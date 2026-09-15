"""Run complete FieldScope profiles as two sequential supervised groups."""

import json
import os
from pathlib import Path
import signal
import subprocess
import sys


APP = Path(__file__).resolve().parent.parent
SUPERVISOR = APP / "scripts/supervise-tests.py"
HEAVY_PROFILE = (
    "src/domain/__tests__/walking-constrained-kinematics.profile.test.ts"
)
PROFILE_SUFFIX = ".profile.test.ts"
MAX_RECEIPT_ERROR_BYTES = 8000


class ProfileGroupInterrupted(RuntimeError):
    def __init__(self, signum):
        super().__init__("Profile group runner interrupted by signal " + str(signum))
        self.signum = signum


def discover_profile_groups(app=APP):
    app = app.resolve(strict=True)
    discovered = []
    for candidate in (app / "src").rglob("*" + PROFILE_SUFFIX):
        relative = candidate.relative_to(app)
        if "__tests__" not in relative.parts[1:-1]:
            continue
        resolved = candidate.resolve(strict=True)
        resolved.relative_to(app)
        if resolved.is_file():
            discovered.append(relative.as_posix())
    all_profiles = sorted(set(discovered))
    if HEAVY_PROFILE not in all_profiles:
        raise RuntimeError("Missing required heavy profile")
    heavy = [HEAVY_PROFILE]
    remaining = [path for path in all_profiles if path not in heavy]
    if not remaining:
        raise RuntimeError("Remaining profile group is empty")
    if set(heavy) & set(remaining) or sorted(heavy + remaining) != all_profiles:
        raise RuntimeError("Profile groups do not exactly partition discovered profiles")
    return dict(heavy=heavy, remaining=remaining, all=all_profiles)


def parse_receipt(stdout):
    try:
        receipt = json.loads(stdout)
    except (TypeError, json.JSONDecodeError) as error:
        raise RuntimeError("Supervisor did not return one JSON receipt") from error
    if not isinstance(receipt, dict):
        raise RuntimeError("Supervisor receipt is not an object")
    return receipt


def complete_receipt(receipt, files):
    return (
        receipt.get("outcome") == "passed"
        and receipt.get("completion") == "filtered-profile-selection-complete"
        and receipt.get("exitCode") == 0
        and receipt.get("reaped") is True
        and receipt.get("workInterpretation") == "exact"
        and receipt.get("unknownTail") is False
        and receipt.get("selection")
        == {
            "kind": "selected-profile-files",
            "coverage": "filtered-profiles",
            "files": files,
            "title": None,
        }
    )


def run_supervisor(app, supervisor, files, environment=None):
    command = [sys.executable, str(supervisor), "--profile"]
    for filename in files:
        command.extend(["--file", filename])
    child = None
    interrupted = None
    prior_handlers = {}

    def forward(signum, _frame):
        nonlocal interrupted
        if interrupted is None:
            interrupted = signum
        target = child
        if target is not None and target.poll() is None:
            try:
                target.send_signal(signum)
            except ProcessLookupError:
                pass

    try:
        for current in (signal.SIGTERM, signal.SIGINT):
            prior_handlers[current] = signal.signal(current, forward)
        child = subprocess.Popen(
            command,
            cwd=app,
            env=environment,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        if interrupted is not None and child.poll() is None:
            try:
                child.send_signal(interrupted)
            except ProcessLookupError:
                pass
        stdout, stderr = child.communicate()
    finally:
        try:
            if child is not None and child.poll() is None:
                child.kill()
                child.wait()
        finally:
            for current, handler in prior_handlers.items():
                signal.signal(current, handler)
    if interrupted is not None:
        raise ProfileGroupInterrupted(interrupted)
    try:
        receipt = parse_receipt(stdout)
    except RuntimeError as error:
        return dict(
            outcome="failed",
            completion="incomplete",
            error=str(error),
            exitCode=child.returncode,
            stderr=stderr[-MAX_RECEIPT_ERROR_BYTES:],
        )
    if child.returncode != 0 or not complete_receipt(receipt, files):
        return dict(
            outcome="failed",
            completion="incomplete",
            error="Supervisor group did not return a complete exact selection",
            exitCode=child.returncode,
            receipt=receipt,
            stderr=stderr[-MAX_RECEIPT_ERROR_BYTES:],
        )
    return receipt


def group_summary(name, files, receipt):
    return {
        "name": name,
        "files": files,
        "outcome": receipt.get("outcome"),
        "completion": receipt.get("completion"),
        "summaryPath": receipt.get("summaryPath"),
        "logPath": receipt.get("logPath"),
    }


def run_profile_groups(app=APP, supervisor=SUPERVISOR, environment=None):
    groups = discover_profile_groups(app)
    completed = []
    for name in ("heavy", "remaining"):
        files = groups[name]
        receipt = run_supervisor(app, supervisor, files, environment)
        completed.append(group_summary(name, files, receipt))
        if not complete_receipt(receipt, files):
            return {
                "outcome": "failed",
                "completion": "incomplete",
                "error": receipt.get("error")
                or "Profile group did not complete",
                "selection": {
                    "kind": "profile-suite",
                    "coverage": "profiles",
                    "files": groups["all"],
                    "title": None,
                },
                "groups": completed,
            }
    return {
        "outcome": "passed",
        "completion": "profile-suite-complete",
        "error": None,
        "selection": {
            "kind": "profile-suite",
            "coverage": "profiles",
            "files": groups["all"],
            "title": None,
        },
        "groups": completed,
    }


def main():
    if len(sys.argv) != 1:
        print(json.dumps({
            "outcome": "failed",
            "completion": "incomplete",
            "error": "Profile group runner accepts no arguments",
        }))
        return 1
    try:
        result = run_profile_groups()
    except ProfileGroupInterrupted as error:
        print(json.dumps({
            "outcome": "failed",
            "completion": "incomplete",
            "error": str(error),
        }))
        return 128 + error.signum
    except (OSError, RuntimeError) as error:
        print(json.dumps({
            "outcome": "failed",
            "completion": "incomplete",
            "error": str(error),
        }))
        return 1
    print(json.dumps(result))
    return 0 if result["outcome"] == "passed" else 1


if __name__ == "__main__":
    sys.exit(main())
