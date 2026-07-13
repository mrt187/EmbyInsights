define(["emby-input", "emby-button", "emby-checkbox", "emby-select"], function () {
    "use strict";

    var pluginId = "be7dcc0f-d8d7-498f-9d65-77db72239cee";

    return function (view) {
        var language = "de";
        var words = {
            de: {
                intro:"Moderne, nur für Administratoren sichtbare Wiedergabestatistiken.",readme:"Readme",logs:"Logs",info:"Info",
                trackingSection:"Datenerfassung",trackingEnabled:"Native Wiedergabeerfassung aktivieren",trackingDescription:"Erfasst neue Wiedergaben direkt über Emby Insights.",minimumLabel:"Mindestwiedergabedauer (Sekunden)",minimumDescription:"Kürzere Sitzungen werden nicht als Wiedergabe gespeichert.",retentionLabel:"Aufbewahrung (Tage)",retentionDescription:"0 bewahrt Statistiken unbegrenzt auf.",
                sourcesSection:"Datenquellen",playbackReportingEnabled:"Playback Reporting verwenden",playbackReportingDescription:"Liest vorhandene Wiedergaben aus Playback Reporting. Wird der Schalter deaktiviert, werden diese Daten nicht mehr in Insights verwendet.",librarySelection:"Bibliotheken für Insights",librarySelectionDescription:"Nur Medien aus den ausgewählten Bibliotheken werden in Statistiken und Server-Fakten berücksichtigt.",librariesError:"Bibliotheken konnten nicht geladen werden.",
                displaySection:"Darstellung",languageLabel:"Sprache",languageDescription:"Sprache der Statistik- und Einstellungsseiten.",themeLabel:"Design",themeDescription:"Wählt das Erscheinungsbild des Insights-Tabs.",themeEmerald:"Emerald",themeTerminal:"Terminal Grid",browserSection:"Browser-Erweiterung",browserEnabled:"Admin-Tab „Insights“ aktivieren",browserDescription:"Der Tab wird ausschließlich für Administratoren im Browser eingeblendet.",openStatistics:"Insights öffnen",save:"Speichern",close:"Schließen",refresh:"Aktualisieren",loading:"Lädt…",noLogs:"Noch keine Emby-Insights-Logeinträge.",logsError:"Die Logs konnten nicht geladen werden.",readmeIntro:"Wiedergabestatistiken für Emby-Administratoren – übersichtlich, direkt im Webclient und ohne Playback Reporting zu verändern.",readmeShowsTitle:"Was wird angezeigt?",readmeShowsText:"Wiedergabezeit, beliebte Filme und Serien, aktive Nutzer und Clients.",readmeSourceTitle:"Woher kommen die Daten?",readmeSourceText:"Aktuell aus der Playback-Reporting-Datenbank. Sie wird ausschließlich gelesen.",readmeAccessTitle:"Wer kann die Daten sehen?",readmeAccessText:"Nur Emby-Administratoren können den Insights-Tab und seine Schnittstellen öffnen.",
                infoDescription:"Emby Insights zeigt Administratoren auf einen Blick, was auf dem Emby-Server angesehen wurde – zum Beispiel Wiedergabezeit, beliebte Filme und Serien sowie aktive Benutzer. Playback Reporting wird dabei nur gelesen und nicht verändert.",latestChanges:"Letzte Änderungen",changeTranscodeDetails:"Detaillierte Playback-Reporting-Werte wie Transcode (v:h264 a:ac3) werden korrekt als Transcoding erkannt.",changeRealFacts:"Server- und Nutzer-Fakten verwenden jetzt zuverlässig echte Daten aus Emby und Playback Reporting.",changeClientTranscoding:"Nutzer-Fakten zeigen Top Nutzer, Top Clients und eine eigene Rangliste der transcodierenden Clients.",changeAlbumCount:"Alben werden bei aktiver Bibliotheksauswahl korrekt über die Album-IDs der enthaltenen Titel gezählt.",changeTerminalTheme:"Das neue optionale Terminal-Grid-Design verwendet technische Kacheln, Info-Labels in eckigen Klammern und Emby-Grün als Akzent.",changeHeaderPosters:"Titel und Emby-Version stehen nun mittig im Kopfbereich; Film- und Serienposter werden vollständig und unbeschnitten angezeigt.",changeBackdrops:"Top-Film und Top-Serie verwenden jetzt die passenden 16:9-Backdrop-Bilder; Poster dienen nur noch als unbeschnittener Fallback.",changeUncroppedBackdrops:"Backdrop-Bilder werden vollständig und unbeschnitten über einem weichgezeichneten, kachelfüllenden Hintergrund dargestellt."
            },
            en: {
                intro:"Modern playback statistics visible only to administrators.",readme:"Readme",logs:"Logs",info:"Info",
                trackingSection:"Data Collection",trackingEnabled:"Enable native playback tracking",trackingDescription:"Records new playback sessions directly through Emby Insights.",minimumLabel:"Minimum playback duration (seconds)",minimumDescription:"Shorter sessions are not stored as plays.",retentionLabel:"Retention (days)",retentionDescription:"0 keeps statistics indefinitely.",
                sourcesSection:"Data Sources",playbackReportingEnabled:"Use Playback Reporting",playbackReportingDescription:"Reads existing plays from Playback Reporting. When disabled, those records are no longer used in Insights.",librarySelection:"Libraries for Insights",librarySelectionDescription:"Only media from the selected libraries is included in statistics and server facts.",librariesError:"Libraries could not be loaded.",
                displaySection:"Display",languageLabel:"Language",languageDescription:"Language of the statistics and settings pages.",themeLabel:"Design",themeDescription:"Selects the appearance of the Insights tab.",themeEmerald:"Emerald",themeTerminal:"Terminal Grid",browserSection:"Browser Extension",browserEnabled:"Enable the admin Insights tab",browserDescription:"The tab is displayed only to administrators in the browser.",openStatistics:"Open Insights",save:"Save",close:"Close",refresh:"Refresh",loading:"Loading…",noLogs:"No Emby Insights log entries yet.",logsError:"The logs could not be loaded.",readmeIntro:"Playback statistics for Emby administrators, clearly presented in the web client without modifying Playback Reporting.",readmeShowsTitle:"What is displayed?",readmeShowsText:"Watch time, popular movies and series, active users, and clients.",readmeSourceTitle:"Where does the data come from?",readmeSourceText:"Currently from the Playback Reporting database, which is accessed read-only.",readmeAccessTitle:"Who can view the data?",readmeAccessText:"Only Emby administrators can open the Insights tab and its endpoints.",
                infoDescription:"Emby Insights gives administrators a quick view of what has been watched on the Emby server, including watch time, popular movies and series, and active users. Playback Reporting is read only and is never modified.",latestChanges:"Latest Changes",changeTranscodeDetails:"Detailed Playback Reporting values such as Transcode (v:h264 a:ac3) are now correctly recognized as transcoding.",changeRealFacts:"Server and user facts now reliably use real data from Emby and Playback Reporting.",changeClientTranscoding:"User Facts now show Top Users, Top Clients, and a separate ranking of transcoding clients.",changeAlbumCount:"Albums are now counted correctly from the album ids of included tracks when library selection is enabled.",changeTerminalTheme:"The new optional Terminal Grid design uses technical cards, bracketed info labels, and Emby green as its accent.",changeHeaderPosters:"The title and Emby version are now centered in the header; movie and series posters are displayed fully without cropping.",changeBackdrops:"Top Movie and Top Series now use matching 16:9 backdrop images; posters are only used as an uncropped fallback.",changeUncroppedBackdrops:"Backdrop images are now shown fully and uncropped over a blurred background that fills the entire card."
            }
        };

        function t(key) { return words[language][key] || words.de[key] || key; }
        function applyTranslations() {
            Array.prototype.forEach.call(view.querySelectorAll("[data-i18n]"), function (element) {
                element.textContent = t(element.getAttribute("data-i18n"));
            });
            Array.prototype.forEach.call(view.querySelectorAll("[data-i18n-label]"), function (element) {
                element.setAttribute("label", t(element.getAttribute("data-i18n-label")));
            });
        }

        function openModal(id) { view.querySelector("#" + id).classList.add("open"); }
        function closeModal(id) { view.querySelector("#" + id).classList.remove("open"); }

        function loadReadme() {
            openModal("ReadmeModal");
        }

        function loadLogs() {
            var body = view.querySelector("#LogsBody");
            body.textContent = t("loading");
            return ApiClient.ajax({ type: "GET", url: ApiClient.getUrl("EmbyInsights/Logs", { MaxLines: 300 }), dataType: "json" })
                .then(function (result) { body.textContent = result && result.Text ? result.Text : t("noLogs"); body.scrollTop = body.scrollHeight; })
                .catch(function () { body.textContent = t("logsError"); });
        }

        function setValue(id, value) {
            view.querySelector("#" + id).value = value;
        }

        function setChecked(id, value) {
            view.querySelector("#" + id).checked = value === true;
        }

        function loadLibraries(config) {
            var container = view.querySelector("#LibrarySelection");
            view._insightsLibrariesLoaded = false;
            container.textContent = t("loading");
            return ApiClient.ajax({ type: "GET", url: ApiClient.getUrl("Library/VirtualFolders"), dataType: "json" })
                .then(function (result) {
                    var folders = Array.isArray(result) ? result : ((result && (result.Items || result.items)) || []);
                    var selected = (config.IncludedLibraryPaths || config.includedLibraryPaths || []).map(function (path) { return String(path).toLowerCase(); });
                    var filterEnabled = config.LibraryFilterEnabled === true || config.libraryFilterEnabled === true;
                    container.innerHTML = "";
                    folders.forEach(function (folder) {
                        var paths = folder.Locations || folder.locations || [];
                        if (!paths.length) return;
                        var label = document.createElement("label"); label.className = "eiLibraryOption";
                        var checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.setAttribute("is", "emby-checkbox"); checkbox.className = "eiLibraryCheckbox"; checkbox._libraryPaths = paths;
                        checkbox.checked = !filterEnabled || paths.some(function (path) { return selected.indexOf(String(path).toLowerCase()) !== -1; });
                        var name = document.createElement("span"); name.textContent = folder.Name || folder.name || paths[0];
                        label.appendChild(checkbox); label.appendChild(name); container.appendChild(label);
                    });
                    if (!container.children.length) container.textContent = t("librariesError");
                    else view._insightsLibrariesLoaded = true;
                }).catch(function () { container.textContent = t("librariesError"); });
        }

        function loadConfig() {
            Dashboard.showLoadingMsg();
            return ApiClient.getPluginConfiguration(pluginId).then(function (config) {
                setChecked("TrackingEnabled", config.TrackingEnabled);
                setChecked("PlaybackReportingEnabled", config.PlaybackReportingEnabled);
                setChecked("EnableWebClientExtension", config.EnableWebClientExtension);
                setValue("MinimumPlaybackSeconds", config.MinimumPlaybackSeconds == null ? 30 : config.MinimumPlaybackSeconds);
                setValue("RetentionDays", config.RetentionDays == null ? 0 : config.RetentionDays);
                setValue("Language", config.Language === "en" ? "en" : "de");
                setValue("Theme", config.Theme === "terminal" ? "terminal" : "emerald");
                language = config.Language === "en" ? "en" : "de";
                applyTranslations();
                return loadLibraries(config);
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
                config.EnableWebClientExtension = view.querySelector("#EnableWebClientExtension").checked;
                config.MinimumPlaybackSeconds = Math.max(0, parseInt(view.querySelector("#MinimumPlaybackSeconds").value || "30", 10));
                config.RetentionDays = Math.max(0, parseInt(view.querySelector("#RetentionDays").value || "0", 10));
                config.Language = view.querySelector("#Language").value === "en" ? "en" : "de";
                config.Theme = view.querySelector("#Theme").value === "terminal" ? "terminal" : "emerald";
                if (view._insightsLibrariesLoaded) {
                    var libraryBoxes = Array.prototype.slice.call(view.querySelectorAll(".eiLibraryCheckbox"));
                    var selectedBoxes = libraryBoxes.filter(function (box) { return box.checked; });
                    config.LibraryFilterEnabled = selectedBoxes.length !== libraryBoxes.length;
                    config.IncludedLibraryPaths = selectedBoxes.reduce(function (paths, box) { return paths.concat(box._libraryPaths || []); }, []);
                }
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
        view.querySelector("#Language").addEventListener("change", function () {
            language = this.value === "en" ? "en" : "de";
            applyTranslations();
        });
        view.querySelector("#BtnOpenStatistics").addEventListener("click", function () {
            window.sessionStorage.setItem("emby-insights-open", "1");
            window.location.hash = "#!/home";
        });
        Array.prototype.forEach.call(view.querySelectorAll("[data-close]"), function (button) {
            button.addEventListener("click", function () { closeModal(button.getAttribute("data-close")); });
        });
        Array.prototype.forEach.call(view.querySelectorAll(".eiModalBackdrop"), function (backdrop) {
            backdrop.addEventListener("click", function (event) { if (event.target === backdrop) closeModal(backdrop.id); });
        });
        view.addEventListener("viewshow", loadConfig);
        applyTranslations();
        loadConfig();
    };
});
