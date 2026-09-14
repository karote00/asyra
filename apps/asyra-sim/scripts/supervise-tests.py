"""Project test supervisor. Engineering deadlines never change product limits."""
import argparse
import json
import os
from pathlib import Path
import selectors
import signal
import subprocess
import sys
import time

APP = Path(__file__).resolve().parent.parent
ROOT = APP.parent.parent
HEAVY = "src/analysis/methods/__tests__/fresh-witness-source-work.test.ts"
HEAVY_CASES = (
    ("heavy", HEAVY, 4),
    ("representative", "src/analysis/methods/__tests__/representative-work.test.ts", 1),
    ("witnessed-zero", "src/analysis/methods/__tests__/witnessed-zero-source-work.test.ts", 4),
)
DEFAULT_JOB_MS = 20 * 60 * 1000
DEFAULT_IDLE_MS = 120000
CLEANUP_MS = 60000
MAX_STREAM_BYTES = 64 * 1024 * 1024


def supervise(command, deadline, idle_ms, expected, journal=None, cwd=APP,
              console=None):
    """Drain a dedicated pipe even when the test's event loop is blocked."""
    read_fd, write_fd = os.pipe()
    environment = dict(os.environ)
    if expected:
        environment["TEST_RECEIPT_FD"] = str(write_fd)
        environment["TEST_SUPERVISED"] = "1"
    else:
        environment.pop("TEST_RECEIPT_FD", None)
        environment.pop("TEST_SUPERVISED", None)
    launched = time.monotonic()
    process = subprocess.Popen(command, cwd=cwd, env=environment,
                               start_new_session=True, pass_fds=(write_fd,),
                               stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    os.close(write_fd)
    selector = selectors.DefaultSelector()
    selector.register(read_fd, selectors.EVENT_READ, "receipt")
    selector.register(process.stdout, selectors.EVENT_READ, "console")
    buffer = b""
    tail = b""
    stream_bytes = {"receipt": 0, "console": 0}
    last = None
    sequence = 0
    final = None
    ready_at = None
    progress_at = launched
    mark = (0, 0, 0)
    stages = []
    outcome = None
    error = None
    status = None
    usage = None
    exited = None

    def terminate():
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass

    def interrupted(signum, _frame):
        raise RuntimeError("Supervisor interrupted by signal " + str(signum))

    prior_handlers = {sig: signal.signal(sig, interrupted)
                      for sig in (signal.SIGTERM, signal.SIGINT)}

    try:
        while True:
            now = time.monotonic()
            if outcome is None and now >= deadline:
                outcome = "hard-stop"
                terminate()
            if (outcome is None and expected and
                    now - progress_at >= idle_ms / 1000):
                outcome = "no-progress"
                terminate()
            if status is None:
                pid, raw, consumed = os.wait4(process.pid, os.WNOHANG)
                if pid:
                    status, usage, exited = raw, consumed, time.monotonic()
                    process.returncode = os.waitstatus_to_exitcode(raw)
                    terminate()  # Descendants cannot outlive the owned phase.
            if status is not None and (not selector.get_map() or
                                       time.monotonic() - exited >= 1):
                break
            for key, _ in selector.select(0.01):
                chunk = os.read(key.fd, 65536)
                if not chunk:
                    selector.unregister(key.fileobj)
                    continue
                stream_bytes[key.data] += len(chunk)
                if stream_bytes[key.data] > MAX_STREAM_BYTES:
                    raise ValueError("Test output stream exceeded 64 MiB")
                if key.data == "console":
                    tail = (tail + chunk)[-8000:]
                    if console:
                        console.write(chunk)
                        console.flush()
                    continue
                buffer += chunk
                if len(buffer) > 65536:
                    raise ValueError("Oversized test receipt")
                while b"\n" in buffer:
                    line, buffer = buffer.split(b"\n", 1)
                    record = json.loads(line)
                    if final is not None:
                        raise ValueError("Receipt after final")
                    if record.get("sequence") != sequence:
                        raise ValueError("Noncontiguous receipt sequence")
                    sequence += 1
                    kind = record.get("kind")
                    if kind not in ("ready", "progress", "final"):
                        raise ValueError("Unknown receipt")
                    if ready_at is None:
                        if kind != "ready":
                            raise ValueError("Missing READY")
                        ready_at = time.monotonic()
                        progress_at = ready_at
                    elif kind == "ready":
                        raise ValueError("Duplicate READY")
                    current = tuple(record.get(k) for k in
                                    ("stage", "work", "completed"))
                    if any(type(v) is not int or v < 0 for v in current):
                        raise ValueError("Invalid progress counters")
                    if any(a < b for a, b in zip(current, mark)):
                        raise ValueError("Regressing progress")
                    if current[0] > 100 or current[2] > expected:
                        raise ValueError("Unbounded stage or case count")
                    if current != mark:
                        progress_at = time.monotonic()
                    record["observedMs"] = (time.monotonic() - launched) * 1000
                    if not stages or current[0] != mark[0]:
                        stages.append({"stage": current[0],
                                       "label": record.get("label"),
                                       "observedMs": record["observedMs"]})
                    mark = current
                    last = record
                    if kind == "final":
                        final = record
                    if journal:
                        journal.write((json.dumps(record) + "\n").encode())
                        journal.flush()
    except Exception as caught:
        error = str(caught)
        outcome = "protocol-error"
        terminate()
    finally:
        if status is None:
            _, status, usage = os.wait4(process.pid, 0)
            process.returncode = os.waitstatus_to_exitcode(status)
            exited = time.monotonic()
        terminate()
        selector.close()
        os.close(read_fd)
        process.stdout.close()
        for sig, handler in prior_handlers.items():
            signal.signal(sig, handler)
    if outcome is None:
        valid_final = (not expected or (final and
                       final.get("completed") == expected and
                       final.get("outcome") == "complete"))
        outcome = "passed" if (process.returncode == 0 and valid_final and
                                not buffer) else "failed"
    exact = outcome == "passed"
    return dict(outcome=outcome, completion="complete" if exact else "incomplete",
                exitCode=process.returncode, error=error,
                lastReceipt=last, discardedTailBytes=len(buffer), reaped=True,
                workInterpretation="exact" if exact else "lower-bound",
                unknownTail=not exact, pid=process.pid,
                startupMs=(ready_at - launched) * 1000 if ready_at else None,
                processWallMs=(exited - launched) * 1000,
                supervisedWallMs=(exited - ready_at) * 1000 if ready_at else None,
                observedStages=stages,
                processUserCpuMs=usage.ru_utime * 1000,
                processSystemCpuMs=usage.ru_stime * 1000,
                cpuIncludesStartup=True, consoleTail=tail.decode(errors="replace"))


def positive(value):
    value = int(value)
    if value <= 0:
        raise ValueError("Test budget must be positive")
    return value


def phase_commands(base, extra, heavy):
    files = [arg for arg in extra if ".test." in arg or ".spec." in arg]
    selected = [entry for entry in HEAVY_CASES
                if not files or any(Path(arg).name == Path(entry[1]).name for arg in files)]
    if selected and any(arg == "-t" or arg.startswith("-t=") or
                        arg.startswith("--testNamePattern") for arg in extra):
        raise ValueError("Supervised proofs require every case in each selected file")
    if heavy and files:
        raise ValueError("Heavy mode selects all supervised files")
    options = [arg for arg in extra if arg not in files]
    phases = []
    if not heavy:
        if not files:
            excluded = [arg for _, path, _ in HEAVY_CASES for arg in ("--exclude", path)]
            phases.append(("ordinary", base + extra + excluded, 0))
        else:
            ordinary = [arg for arg in files
                        if not any(Path(arg).name == Path(entry[1]).name for entry in selected)]
            if ordinary:
                phases.append(("selected", base + ordinary + options, 0))
    phases.extend((name, base + [path] + options, expected)
                  for name, path, expected in selected)
    return phases


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--oracle-command")
    parser.add_argument("--hard-stop-ms", type=positive)
    parser.add_argument("--idle-ms", type=positive)
    parser.add_argument("--heavy", action="store_true")
    parser.add_argument("--init-ci", action="store_true")
    parser.add_argument("arguments", nargs=argparse.REMAINDER)
    args = parser.parse_args()
    artifacts = ROOT / "tmp/test-supervision"
    if args.init_ci:
        artifacts.mkdir(parents=True, exist_ok=True)
        # Workflow records its start before checkout, not at the Test step.
        deadline_ms = positive(os.environ["TEST_JOB_DEADLINE_MS"])
        config = dict(deadlineMs=deadline_ms,
                      cleanupMs=positive(os.environ.get("TEST_CLEANUP_MS", CLEANUP_MS)),
                      idleMs=positive(os.environ.get("TEST_IDLE_MS", DEFAULT_IDLE_MS)))
        (artifacts / "ci-budget.json").write_text(json.dumps(config) + "\n")
        return 0
    if args.oracle_command:
        result = supervise(json.loads(args.oracle_command),
                           time.monotonic() + args.hard_stop_ms / 1000,
                           args.idle_ms, 1)
        print(json.dumps(result))
        return 0 if result["outcome"] == "passed" else 1
    hard_ms = positive(os.environ.get("TEST_JOB_MS", DEFAULT_JOB_MS))
    idle_ms = positive(os.environ.get("TEST_IDLE_MS", DEFAULT_IDLE_MS))
    cleanup_ms = positive(os.environ.get("TEST_CLEANUP_MS", CLEANUP_MS))
    budget_file = artifacts / "ci-budget.json"
    if budget_file.exists() or os.environ.get("CI"):
        # The file is authoritative even when Turbo removes environment flags.
        config = json.loads(budget_file.read_text())
        hard_ms = config["deadlineMs"] - time.time() * 1000
        idle_ms, cleanup_ms = config["idleMs"], config["cleanupMs"]
    deadline = time.monotonic() + (hard_ms - cleanup_ms) / 1000
    if deadline <= time.monotonic():
        raise RuntimeError("No CI execution time remains before cleanup")
    # Resolve only this checkout's declared installation. Never borrow another tree.
    vitest = ROOT / "node_modules/vitest/vitest.mjs"
    if not vitest.is_file():
        raise RuntimeError("Missing checkout-local Vitest; run immutable install")
    node = subprocess.check_output(["node", "-p", "process.execPath"],
                                   cwd=APP, text=True).strip()
    extra = args.arguments
    if extra and extra[0] == "--":
        extra = extra[1:]
    base = [node, str(vitest), "run"]
    phases = phase_commands(base, extra, args.heavy)
    artifacts.mkdir(parents=True, exist_ok=True)
    run_dir = artifacts / (str(time.time_ns()) + "-" + str(os.getpid()))
    run_dir.mkdir()
    summaries = []
    for name, command, expected in phases:
        if expected:
            command += ["--pool=threads", "--maxWorkers=1", "--fileParallelism=false"]
        with (run_dir / (name + ".jsonl")).open("xb") as journal, \
                (run_dir / (name + ".log")).open("xb") as console:
            result = supervise(command, deadline, idle_ms, expected, journal,
                               console=console)
        result["phase"] = name
        summaries.append(result)
        (run_dir / (name + ".json")).write_text(json.dumps(result, indent=2) + "\n")
        print(json.dumps(result), flush=True)
        if result["outcome"] in ("hard-stop", "no-progress", "protocol-error"):
            break
    return 0 if (len(summaries) == len(phases) and
                 all(s["outcome"] == "passed" for s in summaries)) else 1


if __name__ == "__main__":
    sys.exit(main())
