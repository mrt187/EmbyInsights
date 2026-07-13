(function () {
  "use strict";
  const tabId = "emby-insights-tab";

  async function injectStatisticsTab() {
    // TODO(Emby Web): Replace these compatibility probes only after verifying
    // the target Web Client build. DOM patching is intentionally isolated here.
    const apiClient = window.ApiClient;
    if (!apiClient?.getCurrentUser) return;
    const user = await apiClient.getCurrentUser();
    if (!user?.Policy?.IsAdministrator || document.getElementById(tabId)) return;

    const favorites = document.querySelector('[data-index="1"], a[href*="favorites"]');
    if (!favorites?.parentNode) return;
    const tab = favorites.cloneNode(true);
    tab.id = tabId; tab.textContent = "Insights"; tab.setAttribute("href", "#!/statistics");
    favorites.parentNode.insertBefore(tab, favorites.nextSibling);
  }

  window.EmbyInsightsTab = { inject: injectStatisticsTab };
  document.addEventListener("viewshow", () => injectStatisticsTab().catch(console.error));
})();
