#!/usr/bin/env bash
set -euo pipefail

CONTAINER="emby"
VERSION="0.2.2"

usage() {
  echo "Usage: $0 [--container NAME]"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --container) CONTAINER="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

if [[ -z "$CONTAINER" ]]; then
  usage >&2
  exit 2
fi

DASHBOARD="/app/emby/system/dashboard-ui"
ASSETS="/config/data/emby-insights-web"

docker inspect "$CONTAINER" >/dev/null 2>&1 || exit 0
[[ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null)" == "true" ]] || exit 0

if docker exec "$CONTAINER" sh -lc "test -s '$DASHBOARD/emby-insights-tab.js' && grep -q 'emby-insights-tab.js' '$DASHBOARD/index.html' && grep -q 'emby-insights/dashboard.js' '$DASHBOARD/index.html'"; then
  exit 0
fi

docker exec "$CONTAINER" sh -lc "
  test -s '$ASSETS/emby-insights-tab.js'
  test -s '$ASSETS/dashboard.html'
  test -s '$ASSETS/dashboard.js'
  mkdir -p '$DASHBOARD/emby-insights'
  cp '$ASSETS/emby-insights-tab.js' '$DASHBOARD/emby-insights-tab.js'
  cp '$ASSETS/dashboard.html' '$DASHBOARD/emby-insights/dashboard.html'
  cp '$ASSETS/dashboard.js' '$DASHBOARD/emby-insights/dashboard.js'
  sed -i '/emby-insights-tab.js/d; /emby-insights\/dashboard.js/d; s#</body>#    <script src=\"emby-insights-tab.js?v=$VERSION\"></script>\n    <script src=\"emby-insights/dashboard.js?v=$VERSION\"></script>\n</body>#' '$DASHBOARD/index.html'
"

echo "Emby Insights web client restored in container: $CONTAINER"
