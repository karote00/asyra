#!/bin/bash
set -euo pipefail

E2E_SUITE="${E2E_SUITE:-all}"
case "$E2E_SUITE" in
  all|functional|render-contracts) ;;
  *) echo "Unknown E2E_SUITE: $E2E_SUITE" >&2; exit 2 ;;
esac

E2E_APP_SERVER_PID=''
E2E_COLLABORATION_SERVER_PID=''
E2E_DOCUMENT_BACKEND_PID=''
E2E_DOCUMENT_BACKEND_URL='http://127.0.0.1:4201'
E2E_FUNCTIONAL_OBSERVATION=0
E2E_STATUS_OBSERVATION=0
E2E_STATUS_REPORT=''

# Cleanup function to kill the separately-owned background server processes.
cleanup() {
  E2E_EXIT_CODE=$?
  if [ "$E2E_FUNCTIONAL_OBSERVATION" = 1 ]; then
    if ! node tools/flow-inspector/control-plane/playwright-results.cjs complete "$FLOW_CI_REPORT"; then
      if [ "$E2E_EXIT_CODE" = 0 ]; then E2E_EXIT_CODE=1; fi
    fi
  fi
  if [ "$E2E_STATUS_OBSERVATION" = 1 ]; then
    if ! node tools/flow-inspector/control-plane/playwright-results.cjs complete "$E2E_STATUS_REPORT"; then
      if [ "$E2E_EXIT_CODE" = 0 ]; then E2E_EXIT_CODE=1; fi
    fi
  fi
  if [ -n "$E2E_APP_SERVER_PID" ]; then
    echo "Stopping App server (PID: $E2E_APP_SERVER_PID)..."
    kill "$E2E_APP_SERVER_PID" 2>/dev/null || true
    wait "$E2E_APP_SERVER_PID" 2>/dev/null || true
  fi
  if [ -n "$E2E_COLLABORATION_SERVER_PID" ]; then
    echo "Stopping Collaboration server (PID: $E2E_COLLABORATION_SERVER_PID)..."
    kill "$E2E_COLLABORATION_SERVER_PID" 2>/dev/null || true
    wait "$E2E_COLLABORATION_SERVER_PID" 2>/dev/null || true
  fi
  if [ -n "$E2E_DOCUMENT_BACKEND_PID" ]; then
    echo "Stopping Document backend (PID: $E2E_DOCUMENT_BACKEND_PID)..."
    kill "$E2E_DOCUMENT_BACKEND_PID" 2>/dev/null || true
    wait "$E2E_DOCUMENT_BACKEND_PID" 2>/dev/null || true
  fi
  trap - EXIT INT TERM
  exit "$E2E_EXIT_CODE"
}

# Trap exit signals to ensure cleanup
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

if [ "$E2E_SUITE" = "functional" ]; then
  if [ -z "${FLOW_CI_REPORT:-}" ]; then
    FLOW_CI_REPORT="$PWD/tmp/flow-ci/functional-$(node -e 'process.stdout.write(require("node:crypto").randomUUID())').json"
  fi
  # Workspace commands run from the App directory; keep one root-owned destination.
  case "$FLOW_CI_REPORT" in
    /*) ;;
    *) FLOW_CI_REPORT="$PWD/$FLOW_CI_REPORT" ;;
  esac
  export E2E_SUITE FLOW_CI_REPORT
  node tools/flow-inspector/control-plane/playwright-results.cjs begin "$FLOW_CI_REPORT" functional
  E2E_FUNCTIONAL_OBSERVATION=1
fi

read -r E2E_HOST E2E_PORT E2E_APP_URL \
  E2E_COLLABORATION_HEALTH_URL E2E_COLLABORATION_WEBSOCKET_URL <<< "$(
  node --input-type=module -e "
    import {
      loadEnvironment,
      resolveEnvironment
    } from './apps/asyra-design/app-environment.mjs'
    const config = resolveEnvironment(
      loadEnvironment()
    )
    const collaborationWebSocketURL = new URL(
      '/collaboration',
      config.collaborationHealthURL
    )
    collaborationWebSocketURL.protocol = 'ws:'
    process.stdout.write(
      [
        config.viteHost,
        config.vitePort,
        config.appURL,
        config.collaborationHealthURL,
        collaborationWebSocketURL.href
      ].join(' ')
    )
  "
)"

# 1. Build project
echo "Step 1: Building project..."
yarn react:build

# 2. Build and start the formal document backend.
echo "Step 2: Building Document backend..."
yarn workspace @asyra/asyra-design build:document-backend

echo "Step 3: Starting Document backend..."
DOCUMENT_BACKEND_DATA_DIR=test-results/document-backend \
  yarn workspace @asyra/asyra-design document:backend:start &
E2E_DOCUMENT_BACKEND_PID=$!

echo "Step 4: Waiting for Document backend to be ready..."
node scripts/wait-for-http.mjs "http://127.0.0.1:4201/health" GET 60000

# 5. Build and start the Collaboration server as a dedicated CI dependency.
echo "Step 5: Building Collaboration server..."
yarn workspace @asyra/asyra-design build:collaboration-server

echo "Step 6: Starting Collaboration server..."
DOCUMENT_PERSISTENCE_BACKEND_URL="$E2E_DOCUMENT_BACKEND_URL" \
  yarn workspace @asyra/asyra-design collaboration:server:start &
E2E_COLLABORATION_SERVER_PID=$!

echo "Step 7: Waiting for Collaboration server to be ready..."
node scripts/wait-for-http.mjs "$E2E_COLLABORATION_HEALTH_URL" GET 60000

# 8. Start the diagnostic-enabled app runtime used by the ordinary E2E suite.
# Production bundle/exclusion behavior is covered by the build and package gates.
echo "Step 8: Starting E2E App server at $E2E_APP_URL..."
E2E_OWN_SERVERS=1 \
  E2E_DOCUMENT_BACKEND_URL="$E2E_DOCUMENT_BACKEND_URL" \
  VITE_COLLABORATION_WS_URL="$E2E_COLLABORATION_WEBSOCKET_URL" \
  yarn workspace @asyra/asyra-design start \
  --port "$E2E_PORT" \
  --host "$E2E_HOST" \
  --strictPort &
E2E_APP_SERVER_PID=$!

# 9. Wait for App server ready
echo "Step 9: Waiting for App server to be ready..."
node scripts/wait-for-http.mjs "$E2E_APP_URL" HEAD 60000

# Independent CI jobs use the same PID-owned services and cleanup guards.
if [ "$E2E_SUITE" = "render-contracts" ] || { [ "$E2E_SUITE" = "all" ] && [ "${CI:-}" = "true" ]; }; then
  echo "Running render contracts and collecting timing observations..."
  yarn workspace @asyra/asyra-design playwright test --config playwright.config.ts e2e/render-delta-performance.spec.ts --workers=1
fi
if [ "$E2E_SUITE" = "render-contracts" ]; then
  exit 0
fi

if [ "$E2E_SUITE" = "functional" ] || [ "${CI:-}" = "true" ]; then
  echo "Running functional Playwright tests..."
  if [ -n "${FLOW_CI_REPORT:-}" ]; then
    E2E_SKIP_PERFORMANCE=true PLAYWRIGHT_JSON_OUTPUT_NAME="$FLOW_CI_REPORT" yarn test:e2e:asyra-design --reporter=line,json
  else
    E2E_SKIP_PERFORMANCE=true yarn test:e2e:asyra-design
  fi
else
  echo "Running Playwright tests..."
  yarn test:e2e:asyra-design
fi

# Retain functional attachments before the next Playwright invocation clears its output.
if [ "$E2E_FUNCTIONAL_OBSERVATION" = 1 ]; then
  E2E_FUNCTIONAL_OBSERVATION=0
  node tools/flow-inspector/control-plane/playwright-results.cjs complete "$FLOW_CI_REPORT"
  E2E_STATUS_REPORT="${FLOW_CI_REPORT%.json}-status.json"
  node tools/flow-inspector/control-plane/playwright-results.cjs begin "$E2E_STATUS_REPORT" status
  E2E_STATUS_OBSERVATION=1
fi

echo "Final step: Running isolated unavailable-service status toast test..."
if [ "$E2E_STATUS_OBSERVATION" = 1 ]; then
  PLAYWRIGHT_JSON_OUTPUT_NAME="$E2E_STATUS_REPORT" yarn workspace @asyra/asyra-design test:e2e:status-toast --reporter=line,json
else
  yarn workspace @asyra/asyra-design test:e2e:status-toast
fi
