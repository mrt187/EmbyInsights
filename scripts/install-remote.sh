#!/usr/bin/env bash
set -euo pipefail

VERSION="0.13.0"
HOST=""
PLUGIN_DIR=""
CONTAINER="emby"
APPLY=false

usage() {
  echo "Usage: $0 --host HOST --plugin-dir PATH [--container NAME] [--apply]"
  echo
  echo "Without --apply, only the installation plan is shown."
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host) HOST="${2:-}"; shift 2 ;;
    --plugin-dir) PLUGIN_DIR="${2:-}"; shift 2 ;;
    --container) CONTAINER="${2:-}"; shift 2 ;;
    --apply) APPLY=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

if [[ -z "$HOST" || -z "$PLUGIN_DIR" ]]; then
  usage >&2
  exit 2
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DLL="$ROOT_DIR/EmbyInsights.Plugin.dll"
TAB_SCRIPT="$ROOT_DIR/web/statistics-tab.global.js"
DASHBOARD_HTML="$ROOT_DIR/web/statistics.html"
DASHBOARD_SCRIPT="$ROOT_DIR/web/statistics.js"

for file in "$DLL" "$TAB_SCRIPT" "$DASHBOARD_HTML" "$DASHBOARD_SCRIPT"; do
  [[ -f "$file" ]] || { echo "Missing package file: $file" >&2; exit 1; }
done

echo "Emby Insights $VERSION production installation plan"
echo "  SSH host:       $HOST"
echo "  Plugin folder:  $PLUGIN_DIR"
echo "  Docker container: $CONTAINER"
echo "  Existing DLL:   timestamped backup before replacement"
echo "  Web client:     install assets and patch dashboard-ui/index.html"
echo "  Final action:   restart container $CONTAINER"

if [[ "$APPLY" != true ]]; then
  echo
  echo "Preview only. Run again with --apply to perform these actions."
  exit 0
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
REMOTE_TMP="/tmp/emby-insights-$STAMP"
DLL_NAME="EmbyInsights.Plugin.dll"
LOCAL_SIZE="$(stat -f %z "$DLL" 2>/dev/null || stat -c %s "$DLL")"

ssh "$HOST" "mkdir -p '$REMOTE_TMP' '$PLUGIN_DIR'"
scp "$DLL" "$HOST:$REMOTE_TMP/$DLL_NAME"
scp "$TAB_SCRIPT" "$HOST:$REMOTE_TMP/emby-insights-tab.js"
scp "$DASHBOARD_HTML" "$HOST:$REMOTE_TMP/dashboard.html"
scp "$DASHBOARD_SCRIPT" "$HOST:$REMOTE_TMP/dashboard.js"

REMOTE_SIZE="$(ssh "$HOST" "stat -c %s '$REMOTE_TMP/$DLL_NAME'")"
[[ "$LOCAL_SIZE" = "$REMOTE_SIZE" ]] || { echo "DLL size verification failed" >&2; exit 1; }

ssh "$HOST" "if test -f '$PLUGIN_DIR/$DLL_NAME'; then cp -p '$PLUGIN_DIR/$DLL_NAME' '$PLUGIN_DIR/$DLL_NAME.bak-$STAMP'; fi; cp '$REMOTE_TMP/$DLL_NAME' '$PLUGIN_DIR/$DLL_NAME'"

# dashboard-ui preparation requires a running container. This also makes the installer
# safe to use directly after a consistent offline appdata backup.
ssh "$HOST" "if test \"\$(docker inspect -f '{{.State.Running}}' '$CONTAINER')\" != true; then docker start '$CONTAINER'; fi"
ssh "$HOST" "docker cp '$REMOTE_TMP/emby-insights-tab.js' '$CONTAINER:/app/emby/system/dashboard-ui/emby-insights-tab.js'; \
  docker exec '$CONTAINER' mkdir -p /app/emby/system/dashboard-ui/emby-insights; \
  docker cp '$REMOTE_TMP/dashboard.html' '$CONTAINER:/app/emby/system/dashboard-ui/emby-insights/dashboard.html'; \
  docker cp '$REMOTE_TMP/dashboard.js' '$CONTAINER:/app/emby/system/dashboard-ui/emby-insights/dashboard.js'; \
  docker exec '$CONTAINER' sh -lc 'if grep -q \"emby-insights-tab.js\" /app/emby/system/dashboard-ui/index.html; then \
    sed -i \"s#emby-insights-tab.js[^\\\"]*#emby-insights-tab.js?v=$VERSION#g\" /app/emby/system/dashboard-ui/index.html; \
  else sed -i \"s#</body>#    <script src=\\\"emby-insights-tab.js?v=$VERSION\\\"></script>\\n</body>#\" /app/emby/system/dashboard-ui/index.html; fi; \
  if grep -q \"emby-insights/dashboard.js\" /app/emby/system/dashboard-ui/index.html; then \
    sed -i \"s#emby-insights/dashboard.js[^\\\"]*#emby-insights/dashboard.js?v=$VERSION#g\" /app/emby/system/dashboard-ui/index.html; \
  else sed -i \"s#</body>#    <script src=\\\"emby-insights/dashboard.js?v=$VERSION\\\"></script>\\n</body>#\" /app/emby/system/dashboard-ui/index.html; fi'"

ssh "$HOST" "docker restart '$CONTAINER'"
ssh "$HOST" "rm -rf '$REMOTE_TMP'"

echo "Installation complete. Log in again if Emby invalidated the browser session during restart."
