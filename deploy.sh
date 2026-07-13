#!/usr/bin/env bash
set -euo pipefail

HOST="mini"
PLUGIN_DIR="/mnt/user/appdata/emby/plugins"
CONTAINER="emby"
DLL_NAME="EmbyInsights.Plugin.dll"
DLL="src/EmbyInsights.Plugin/bin/Release/net8.0/$DLL_NAME"
TAB_SCRIPT="src/EmbyInsights.Plugin/WebClientExtension/statistics-tab.global.js"
DASHBOARD_HTML="src/EmbyInsights.Plugin/WebClientExtension/statistics.html"
DASHBOARD_SCRIPT="src/EmbyInsights.Plugin/WebClientExtension/statistics.js"
TAB_VERSION="0.13.0"

cd "$(dirname "$0")"

dotnet restore tests/EmbyInsights.Tests/EmbyInsights.Tests.csproj \
  -p:NuGetAudit=false --disable-build-servers --verbosity quiet
dotnet build tests/EmbyInsights.Tests/EmbyInsights.Tests.csproj \
  --configuration Release --no-restore --disable-build-servers \
  --maxcpucount:1 -p:UseSharedCompilation=false -nologo

test -f "$DLL"
LOCAL_SIZE=$(stat -f %z "$DLL")

ssh "$HOST" "if test -f '$PLUGIN_DIR/$DLL_NAME'; then cp -p '$PLUGIN_DIR/$DLL_NAME' '$PLUGIN_DIR/$DLL_NAME.bak'; fi"
scp "$DLL" "$HOST:$PLUGIN_DIR/$DLL_NAME"
REMOTE_SIZE=$(ssh "$HOST" "stat -c %s '$PLUGIN_DIR/$DLL_NAME'")
test "$LOCAL_SIZE" = "$REMOTE_SIZE"

# Optional browser-only extension. Container updates replace dashboard-ui, so every deploy
# reinstalls this idempotent script tag and the script itself.
scp "$TAB_SCRIPT" "$HOST:/tmp/emby-insights-tab.js"
scp "$DASHBOARD_HTML" "$HOST:/tmp/emby-insights-dashboard.html"
scp "$DASHBOARD_SCRIPT" "$HOST:/tmp/emby-insights-dashboard.js"
ssh "$HOST" "docker cp /tmp/emby-insights-tab.js '$CONTAINER:/app/emby/system/dashboard-ui/emby-insights-tab.js'; \
  docker exec '$CONTAINER' mkdir -p /app/emby/system/dashboard-ui/emby-insights; \
  docker cp /tmp/emby-insights-dashboard.html '$CONTAINER:/app/emby/system/dashboard-ui/emby-insights/dashboard.html'; \
  docker cp /tmp/emby-insights-dashboard.js '$CONTAINER:/app/emby/system/dashboard-ui/emby-insights/dashboard.js'; \
  docker exec '$CONTAINER' sh -lc 'if grep -q \"emby-insights-tab.js\" /app/emby/system/dashboard-ui/index.html; then \
    sed -i \"s#emby-insights-tab.js[^\\\"]*#emby-insights-tab.js?v=$TAB_VERSION#g\" /app/emby/system/dashboard-ui/index.html; \
  else sed -i \"s#</body>#    <script src=\\\"emby-insights-tab.js?v=$TAB_VERSION\\\"></script>\\n</body>#\" /app/emby/system/dashboard-ui/index.html; fi; \
  if grep -q \"emby-insights/dashboard.js\" /app/emby/system/dashboard-ui/index.html; then \
    sed -i \"s#emby-insights/dashboard.js[^\\\"]*#emby-insights/dashboard.js?v=$TAB_VERSION#g\" /app/emby/system/dashboard-ui/index.html; \
  else sed -i \"s#</body>#    <script src=\\\"emby-insights/dashboard.js?v=$TAB_VERSION\\\"></script>\\n</body>#\" /app/emby/system/dashboard-ui/index.html; fi'"

ssh "$HOST" "docker restart '$CONTAINER'"
sleep 12
ssh "$HOST" "docker logs '$CONTAINER' --tail 500 2>&1 | grep -iE 'Emby Insights|EmbyInsights|error|exception|could not load|typeload' || true"

echo "Deployment complete: $REMOTE_SIZE bytes"
