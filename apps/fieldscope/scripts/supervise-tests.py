"""FieldScope test process supervisor. Engineering limits are not product limits."""

import argparse
import json
import os
from pathlib import Path
import re
import selectors
import signal
import subprocess
import sys
import time


APP = Path(__file__).resolve().parent.parent
DEFAULT_HARD_STOP_MS = 20 * 60 * 1000
MAX_SAFE_MILLISECONDS = 2_147_483_647
MAX_STREAM_BYTES = 64 * 1024 * 1024
MAX_TAIL_BYTES = 8000
TEST_PATH = re.compile(r"^src/.+/__tests__/.+\.test\.(?:ts|tsx)$")


def read_manifest(directory):
    try:
        return json.loads((directory / "package.json").read_text())
    except (OSError, ValueError) as error:
        raise RuntimeError("Missing or invalid owned package manifest") from error


def owned_file(root, filename):
    try:
        filename.resolve(strict=True).relative_to(root.resolve(strict=True))
    except (OSError, ValueError) as error:
        raise RuntimeError("Vitest installation is outside its owned root") from error
    if not filename.is_file():
        raise RuntimeError("Missing owned Vitest installation")
    return filename


def resolve_owner(app=APP):
    """Resolve an exact checkout or standalone FieldScope installation."""
    app = app.resolve(strict=True)
    manifest = read_manifest(app)
    if (manifest.get("name") != "@asyra/fieldscope" or
            manifest.get("private") is not True or
            manifest.get("packageManager") != "yarn@4.3.1"):
        raise RuntimeError("App manifest does not declare the owned installation")
    repository = app.parent.parent
    if (repository / "apps/fieldscope").resolve() == app:
        root_manifest = read_manifest(repository)
        workspaces = root_manifest.get("workspaces", [])
        if (root_manifest.get("private") is True and
                root_manifest.get("packageManager") == "yarn@4.3.1" and
                "apps/*" in workspaces):
            return repository, app / ".artifacts/test-supervision"
    return app, app / ".artifacts/test-supervision"


def resolve_runtime(app=APP):
    owner, artifacts = resolve_owner(app)
    vitest = owner / "node_modules/vitest/vitest.mjs"
    if not vitest.is_file():
        raise RuntimeError("Missing owned Vitest installation")
    return owner, owned_file(owner, vitest), artifacts


def bounded_milliseconds(value):
    milliseconds = int(value)
    if milliseconds <= 0 or milliseconds > MAX_SAFE_MILLISECONDS:
        raise argparse.ArgumentTypeError(
            "Hard deadline must be within the positive signed-millisecond range"
        )
    return milliseconds


def select_tests(app, files, title):
    if title is not None:
        if not title or len(title) > 4096 or "\0" in title or "\n" in title:
            raise ValueError("Selected test title is invalid")
        if len(files) != 1:
            raise ValueError("A selected title requires exactly one test file")
    if len(files) != len(set(files)):
        raise ValueError("Selected test files must be unique")
    selected = []
    for requested in files:
        if (not requested or Path(requested).is_absolute() or
                Path(requested).as_posix() != requested or
                not TEST_PATH.fullmatch(requested) or
                requested.endswith(".profile.test.ts")):
            raise ValueError("Selected path is not an ordinary FieldScope test")
        try:
            candidate = (app / requested).resolve(strict=True)
            candidate.relative_to(app.resolve(strict=True))
        except (OSError, ValueError) as error:
            raise RuntimeError("Selected test is outside the FieldScope App") from error
        if not candidate.is_file():
            raise RuntimeError("Selected test is not a file")
        selected.append(requested)
    if title is not None:
        return dict(kind="selected-title", coverage="filtered",
                    files=selected, title=title)
    if selected:
        return dict(kind="selected-files", coverage="filtered",
                    files=selected, title=None)
    return dict(kind="ordinary-suite", coverage="full", files=[], title=None)


def terminate_process_group(pid):
    try:
        os.killpg(pid, signal.SIGKILL)
    except ProcessLookupError:
        return None
    except PermissionError as error:
        return "Owned process group cleanup was denied: " + str(error)
    return None


def supervise(command, deadline, cwd=APP, console=None,
              max_stream_bytes=MAX_STREAM_BYTES):
    """Drain output and stop the owned process group outside the Node event loop."""
    if max_stream_bytes <= 0 or max_stream_bytes > MAX_STREAM_BYTES:
        raise ValueError("Output bound is outside the supported range")
    launched = time.monotonic()
    process = subprocess.Popen(
        command,
        cwd=cwd,
        start_new_session=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    selector = selectors.DefaultSelector()
    selector.register(process.stdout, selectors.EVENT_READ)
    tail = b""
    stream_bytes = 0
    status = None
    usage = None
    exited = None
    outcome = None
    error = None
    cleanup_error = None

    def terminate():
        nonlocal cleanup_error
        failure = terminate_process_group(process.pid)
        if failure and cleanup_error is None:
            cleanup_error = failure

    def interrupted(signum, _frame):
        raise RuntimeError("Supervisor interrupted by signal " + str(signum))

    prior_handlers = {
        current: signal.signal(current, interrupted)
        for current in (signal.SIGTERM, signal.SIGINT)
    }
    try:
        while True:
            now = time.monotonic()
            if outcome is None and now >= deadline:
                outcome = "hard-stop"
                terminate()
            if status is None:
                pid, raw, consumed = os.wait4(process.pid, os.WNOHANG)
                if pid:
                    status, usage, exited = raw, consumed, time.monotonic()
                    process.returncode = os.waitstatus_to_exitcode(raw)
                    terminate()
            if status is not None and (
                    not selector.get_map() or time.monotonic() - exited >= 1):
                break
            for key, _ in selector.select(0.01):
                chunk = os.read(key.fd, 65536)
                if not chunk:
                    selector.unregister(key.fileobj)
                    continue
                remaining = max_stream_bytes - stream_bytes
                accepted = chunk[:max(remaining, 0)]
                if accepted:
                    stream_bytes += len(accepted)
                    tail = (tail + accepted)[-MAX_TAIL_BYTES:]
                    if console:
                        console.write(accepted)
                        console.flush()
                if len(accepted) != len(chunk):
                    outcome = "output-limit"
                    terminate()
    except Exception as caught:
        outcome = "supervisor-error"
        error = str(caught)
        terminate()
    finally:
        if status is None:
            _, status, usage = os.wait4(process.pid, 0)
            process.returncode = os.waitstatus_to_exitcode(status)
            exited = time.monotonic()
        terminate()
        selector.close()
        process.stdout.close()
        for current, handler in prior_handlers.items():
            signal.signal(current, handler)
    if cleanup_error:
        outcome = "cleanup-error"
        error = cleanup_error if error is None else error + "; " + cleanup_error
    if outcome is None:
        outcome = "passed" if process.returncode == 0 else "failed"
    exact = outcome == "passed"
    return dict(
        outcome=outcome,
        completion="process-complete" if exact else "incomplete",
        exitCode=process.returncode,
        error=error,
        reaped=True,
        workInterpretation="exact" if exact else "lower-bound",
        unknownTail=not exact,
        pid=process.pid,
        processWallMs=(exited - launched) * 1000,
        processUserCpuMs=usage.ru_utime * 1000,
        processSystemCpuMs=usage.ru_stime * 1000,
        cpuIncludesStartup=True,
        consoleTail=tail.decode(errors="replace"),
    )


def run_command(command, hard_stop_ms, selection, artifacts,
                max_stream_bytes=MAX_STREAM_BYTES):
    artifacts = artifacts.resolve()
    try:
        artifacts.relative_to(APP.resolve(strict=True))
    except ValueError as error:
        raise RuntimeError("Test artifacts must remain inside FieldScope") from error
    artifacts.mkdir(parents=True, exist_ok=True)
    run_directory = artifacts / (str(time.time_ns()) + "-" + str(os.getpid()))
    run_directory.mkdir()
    log_path = run_directory / "console.log"
    summary_path = run_directory / "summary.json"
    with log_path.open("xb") as console:
        result = supervise(
            command,
            time.monotonic() + hard_stop_ms / 1000,
            cwd=APP,
            console=console,
            max_stream_bytes=max_stream_bytes,
        )
    result["selection"] = selection
    if result["outcome"] == "passed":
        if selection["coverage"] == "full":
            result["completion"] = "full-suite-complete"
        else:
            result["completion"] = "filtered-selection-complete"
    result["logPath"] = str(log_path)
    result["summaryPath"] = str(summary_path)
    summary_path.write_text(json.dumps(result, indent=2) + "\n")
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", action="append", default=[])
    parser.add_argument("--title")
    parser.add_argument(
        "--hard-stop-ms",
        type=bounded_milliseconds,
        default=DEFAULT_HARD_STOP_MS,
    )
    args = parser.parse_args()
    owner, vitest, artifacts = resolve_runtime()
    selection = select_tests(APP, args.file, args.title)
    node = subprocess.check_output(
        ["node", "-p", "process.execPath"], cwd=APP, text=True
    ).strip()
    command = [
        node,
        str(vitest),
        "run",
        "--config",
        str(APP / "vitest.config.ts"),
        *selection["files"],
    ]
    if selection["title"] is not None:
        command.extend(["-t", selection["title"]])
    result = run_command(command, args.hard_stop_ms, selection, artifacts)
    print(json.dumps(result), flush=True)
    return 0 if result["outcome"] == "passed" else 1


if __name__ == "__main__":
    sys.exit(main())
