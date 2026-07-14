#!/usr/bin/env bash
set -euo pipefail

HOST=""
PLUGIN_DIR=""
CONTAINER="emby"
VERSION="0.2.2"

usage() {
  echo "Usage: $0 --host HOST --plugin-dir PATH [--container NAME]"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host) HOST="${2:-}"; shift 2 ;;
    --plugin-dir) PLUGIN_DIR="${2:-}"; shift 2 ;;
    --container) CONTAINER="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

if [[ -z "$HOST" || -z "$PLUGIN_DIR" ]]; then
  usage >&2
  exit 2
fi

cd "$(dirname "$0")/.."

DLL="src/EmbyInsights.Plugin/bin/Release/net8.0/EmbyInsights.Plugin.dll"
TAB_SCRIPT="src/EmbyInsights.Plugin/WebClientExtension/statistics-tab.global.js"
DASHBOARD_HTML="src/EmbyInsights.Plugin/WebClientExtension/statistics.html"
DASHBOARD_SCRIPT="src/EmbyInsights.Plugin/WebClientExtension/statistics.js"
DLL_NAME="EmbyInsights.Plugin.dll"

dotnet restore tests/EmbyInsights.Tests/EmbyInsights.Tests.csproj \
  -p:NuGetAudit=false --disable-build-servers --verbosity quiet
dotnet build tests/EmbyInsights.Tests/EmbyInsights.Tests.csproj \
  --configuration Release --no-restore --disable-build-servers \
  --maxcpucount:1 -p:UseSharedCompilation=false -nologo

test -f "$DLL"
LOCAL_SIZE=$(stat -f %z "$DLL" 2>/dev/null || stat -c %s "$DLL")

ssh "$HOST" "if test -f '$PLUGIN_DIR/$DLL_NAME'; then cp -p '$PLUGIN_DIR/$DLL_NAME' '$PLUGIN_DIR/$DLL_NAME.bak'; fi"
scp "$DLL" "$HOST:$PLUGIN_DIR/$DLL_NAME"
REMOTE_SIZE=$(ssh "$HOST" "stat -c %s '$PLUGIN_DIR/$DLL_NAME'")
test "$LOCAL_SIZE" = "$REMOTE_SIZE"

scp "$TAB_SCRIPT" "$HOST:/tmp/emby-insights-tab.js"
scp "$DASHBOARD_HTML" "$HOST:/tmp/emby-insights-dashboard.html"
scp "$DASHBOARD_SCRIPT" "$HOST:/tmp/emby-insights-dashboard.js"
ssh "$HOST" "docker cp /tmp/emby-insights-tab.js '$CONTAINER:/app/emby/system/dashboard-ui/emby-insights-tab.js'; \
  docker exec '$CONTAINER' mkdir -p /app/emby/system/dashboard-ui/emby-insights; \
  docker cp /tmp/emby-insights-dashboard.html '$CONTAINER:/app/emby/system/dashboard-ui/emby-insights/dashboard.html'; \
  docker cp /tmp/emby-insights-dashboard.js '$CONTAINER:/app/emby/system/dashboard-ui/emby-insights/dashboard.js'; \
  docker exec '$CONTAINER' sh -lc 'if grep -q \"emby-insights-tab.js\" /app/emby/system/dashboard-ui/index.html; then \
    sed -i \"s#emby-insights-tab.js[^\\\"]*#emby-insights-tab.js?v=$VERSION#g\" /app/emby/system/dashboard-ui/index.html; \
  else sed -i \"s#</body>#    <script src=\\\"emby-insights-tab.js?v=$VERSION\\\"></script>\\n</body>#\" /app/emby/system/dashboard-ui/index.html; fi; \
  if grep -q \"emby-insights/dashboard.js\" /app/emby/system/dashboard-ui/index.html; then \
    sed -i \"s#emby-insights/dashboard.js[^\\\"]*#emby-insights/dashboard.js?v=$VERSION#g\" /app/emby/system/dashboard-ui/index.html; \
  else sed -i \"s#</body>#    <script src=\\\"emby-insights/dashboard.js?v=$VERSION\\\"></script>\\n</body>#\" /app/emby/system/dashboard-ui/index.html; fi'"

ssh "$HOST" "docker restart '$CONTAINER'"
sleep 12
ssh "$HOST" "docker logs '$CONTAINER' --tail 500 2>&1 | grep -iE 'Emby Insights|EmbyInsights|error|exception|could not load|typeload' || true"

echo "Deployment complete: $REMOTE_SIZE bytes"
