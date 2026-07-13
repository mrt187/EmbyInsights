define(["emby-input", "emby-button", "emby-checkbox", "emby-select"], function () {
    "use strict";

    var pluginId = "be7dcc0f-d8d7-498f-9d65-77db72239cee";

    return function (view) {
        function openModal(id) { view.querySelector("#" + id).classList.add("open"); }
        function closeModal(id) { view.querySelector("#" + id).classList.remove("open"); }

        function loadReadme() {
            var body = view.querySelector("#ReadmeBody");
            body.textContent = "Lädt…";
            openModal("ReadmeModal");
            ApiClient.ajax({ type: "GET", url: ApiClient.getUrl("EmbyInsights/Readme"), dataType: "json" })
                .then(function (result) { body.textContent = result && result.Text ? result.Text : "Keine Readme verfügbar."; })
                .catch(function () { body.textContent = "Die Readme konnte nicht geladen werden."; });
        }

        function loadLogs() {
            var body = view.querySelector("#LogsBody");
            body.textContent = "Lädt…";
            return ApiClient.ajax({ type: "GET", url: ApiClient.getUrl("EmbyInsights/Logs", { MaxLines: 300 }), dataType: "json" })
                .then(function (result) { body.textContent = result && result.Text ? result.Text : "Noch keine Emby-Insights-Logeinträge."; body.scrollTop = body.scrollHeight; })
                .catch(function () { body.textContent = "Die Logs konnten nicht geladen werden."; });
        }

        function setValue(id, value) {
            view.querySelector("#" + id).value = value;
        }

        function setChecked(id, value) {
            view.querySelector("#" + id).checked = value === true;
        }

        function loadConfig() {
            Dashboard.showLoadingMsg();
            return ApiClient.getPluginConfiguration(pluginId).then(function (config) {
                setChecked("TrackingEnabled", config.TrackingEnabled);
                setChecked("PlaybackReportingEnabled", config.PlaybackReportingEnabled);
                setChecked("StatisticsSourceEnabled", config.StatisticsSourceEnabled);
                setChecked("EnableWebClientExtension", config.EnableWebClientExtension);
                setValue("MinimumPlaybackSeconds", config.MinimumPlaybackSeconds == null ? 30 : config.MinimumPlaybackSeconds);
                setValue("RetentionDays", config.RetentionDays == null ? 0 : config.RetentionDays);
                setValue("Language", config.Language === "en" ? "en" : "de");
            }).finally(function () {
                Dashboard.hideLoadingMsg();
            });
        }

        function saveConfig(event) {
            event.preventDefault();
            Dashboard.showLoadingMsg();
            ApiClient.getPluginConfiguration(pluginId).then(function (config) {
                config.TrackingEnabled = view.querySelector("#TrackingEnabled").checked;
                config.PlaybackReportingEnabled = view.querySelector("#PlaybackReportingEnabled").checked;
                config.StatisticsSourceEnabled = view.querySelector("#StatisticsSourceEnabled").checked;
                config.EnableWebClientExtension = view.querySelector("#EnableWebClientExtension").checked;
                config.MinimumPlaybackSeconds = Math.max(0, parseInt(view.querySelector("#MinimumPlaybackSeconds").value || "30", 10));
                config.RetentionDays = Math.max(0, parseInt(view.querySelector("#RetentionDays").value || "0", 10));
                config.Language = view.querySelector("#Language").value === "en" ? "en" : "de";
                return ApiClient.updatePluginConfiguration(pluginId, config);
            }).then(function (result) {
                Dashboard.processPluginConfigurationUpdateResult(result);
            }).catch(function (error) {
                console.error("Emby Insights settings save failed", error);
                Dashboard.hideLoadingMsg();
            });
        }

        view.querySelector("#EmbyInsightsConfigForm").addEventListener("submit", saveConfig);
        view.querySelector("#BtnReadme").addEventListener("click", loadReadme);
        view.querySelector("#BtnLogs").addEventListener("click", function () { openModal("LogsModal"); loadLogs(); });
        view.querySelector("#BtnRefreshLogs").addEventListener("click", loadLogs);
        view.querySelector("#BtnInfo").addEventListener("click", function () { openModal("InfoModal"); });
        view.querySelector("#BtnOpenStatistics").addEventListener("click", function () {
            window.location.hash = "#!/home?embyinsights=1";
        });
        Array.prototype.forEach.call(view.querySelectorAll("[data-close]"), function (button) {
            button.addEventListener("click", function () { closeModal(button.getAttribute("data-close")); });
        });
        Array.prototype.forEach.call(view.querySelectorAll(".eiModalBackdrop"), function (backdrop) {
            backdrop.addEventListener("click", function (event) { if (event.target === backdrop) closeModal(backdrop.id); });
        });
        view.addEventListener("viewshow", loadConfig);
        loadConfig();
    };
});
