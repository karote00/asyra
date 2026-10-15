#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
FLOW_CI_REPORT="${FLOW_CI_REPORT:-${PLAYWRIGHT_JSON_OUTPUT_NAME:-$PWD/tmp/flow-ci/collaboration-$(node -e 'process.stdout.write(require("node:crypto").randomUUID())').json}}"
case "$FLOW_CI_REPORT" in
  /*) ;;
  *) FLOW_CI_REPORT="$PWD/$FLOW_CI_REPORT" ;;
esac
export FLOW_CI_REPORT
COLLABORATION_RUN_PID=''
COLLABORATION_OBSERVATION=0
cleanup() {
  COLLABORATION_EXIT_CODE=$?
  trap - EXIT INT TERM
  if [ -n "$COLLABORATION_RUN_PID" ]; then
    kill -TERM "$COLLABORATION_RUN_PID" 2>/dev/null || true
    wait "$COLLABORATION_RUN_PID" 2>/dev/null || true
  fi
  if [ "$COLLABORATION_OBSERVATION" = 1 ]; then
    if ! node tools/flow-inspector/control-plane/playwright-results.cjs complete "$FLOW_CI_REPORT"; then
      if [ "$COLLABORATION_EXIT_CODE" = 0 ]; then COLLABORATION_EXIT_CODE=1; fi
    fi
  fi
  exit "$COLLABORATION_EXIT_CODE"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
node tools/flow-inspector/control-plane/playwright-results.cjs begin "$FLOW_CI_REPORT" collaboration
COLLABORATION_OBSERVATION=1
FLOW_OBSERVATION_ID="$(node -e 'process.stdout.write(JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8")).id)' "$FLOW_CI_REPORT.context.json")"
export FLOW_OBSERVATION_ID
PLAYWRIGHT_JSON_OUTPUT_NAME="$FLOW_CI_REPORT" yarn workspace @asyra/asyra-design playwright test --config playwright.collaboration.config.ts "$@" --reporter=line,json &
COLLABORATION_RUN_PID=$!
wait "$COLLABORATION_RUN_PID"
COLLABORATION_RUN_PID=''
