define(["emby-input", "emby-button", "emby-checkbox", "emby-select"], function () {
    "use strict";

    var pluginId = "be7dcc0f-d8d7-498f-9d65-77db72239cee";
    var changelogCache = null;

    return function (view) {
        var language = "de";
        var words = {
            de: {
                intro:"Server-, Medien- und Nutzungsstatistiken – nur für Administratoren.",readme:"Readme",logs:"Logs",info:"Info",
                sourcesSection:"Datenbasis",dataBasisDescription:"Server- und Medien-Fakten kommen direkt aus Emby. Für Nutzungsstatistiken ist Playback Reporting derzeit erforderlich; seine Datenbank wird ausschließlich gelesen und nie verändert.",librarySelection:"Bibliotheken für Insights",librarySelectionDescription:"Nur Medien aus den ausgewählten Bibliotheken werden in Statistiken und Server-Fakten berücksichtigt.",librariesError:"Bibliotheken konnten nicht geladen werden.",
                displaySection:"Darstellung",languageLabel:"Sprache",languageDescription:"Sprache der Statistik- und Einstellungsseiten.",themeLabel:"Design",themeDescription:"Wählt das Erscheinungsbild des Insights-Tabs.",themeEmerald:"Emerald",themeTerminal:"Terminal Grid",save:"Speichern",saveError:"Speichern fehlgeschlagen: ",close:"Schließen",refresh:"Aktualisieren",openInNewTab:"In neuem Tab öffnen",loading:"Lädt…",noLogs:"Noch keine Emby-Insights-Logeinträge.",logsError:"Logs konnten nicht geladen werden: ",changelogError:"Versionshinweise konnten nicht geladen werden.",readmeIntro:"Dein Emby-Server in Zahlen: Medienbestand, Server-Fakten und Nutzung übersichtlich gebündelt direkt im Webclient.",readmeShowsTitle:"Was wird angezeigt?",readmeShowsText:"Gesamtwerte der ausgewählten Bibliotheken: Medienbestand und Speicherbedarf, Server-Fakten sowie Wiedergabezeit, Top-Titel, Nutzer, Clients und Wiedergabemethoden.",readmeSourceTitle:"Woher kommen die Daten?",readmeSourceText:"Medien- und Server-Fakten kommen direkt aus Emby. Nutzungsdaten liest Insights ausschließlich aus Playback Reporting; ohne das Plugin stehen derzeit keine Nutzungsdaten bereit.",readmeStorageTitle:"Wo werden sie gespeichert?",readmeStorageText:"Insights speichert aktuell keine eigene Kopie. Nutzungsdaten bleiben in Playback Reporting; eine eigene Datenbank ist als zukünftiges Feature geplant.",readmeAccessTitle:"Wer kann die Daten sehen?",readmeAccessText:"Nur Emby-Administratoren können den Insights-Tab und seine Schnittstellen öffnen.",
                infoDescription:"Harte Fakten über deinen Server, direkt auf der Startseite: Emby Insights zeigt dir, was auf deinem Server abgeht, und beschert dir nebenbei den einen oder anderen Aha-Moment – nur für Administratoren und ohne Playback Reporting zu verändern. 😉",compatibilityBadge:"✓ Emby Stable + Beta",readOnlyBadge:"✓ Playback Reporting nur lesend",latestChanges:"Letzte Änderung",latestChange:"Der Insights-Tab ist jetzt fester Bestandteil des Plugins; der missverständliche Schalter für die Browser-Erweiterung wurde entfernt.",betaNote:"Emby Insights befindet sich noch in der Beta. Etwas entdeckt oder eine gute Idee?",githubIssues:"Auf GitHub melden"
            },
            en: {
                intro:"Server, media, and usage statistics—visible only to administrators.",readme:"Readme",logs:"Logs",info:"Info",
                sourcesSection:"Data Basis",dataBasisDescription:"Server and media facts come directly from Emby. Playback Reporting is currently required for usage statistics; its database is read only and never modified.",librarySelection:"Libraries for Insights",librarySelectionDescription:"Only media from the selected libraries is included in statistics and server facts.",librariesError:"Libraries could not be loaded.",
                displaySection:"Display",languageLabel:"Language",languageDescription:"Language of the statistics and settings pages.",themeLabel:"Design",themeDescription:"Selects the appearance of the Insights tab.",themeEmerald:"Emerald",themeTerminal:"Terminal Grid",save:"Save",saveError:"Save failed: ",close:"Close",refresh:"Refresh",openInNewTab:"Open in new tab",loading:"Loading…",noLogs:"No Emby Insights log entries yet.",logsError:"Logs could not be loaded: ",changelogError:"Release notes could not be loaded.",readmeIntro:"Your Emby server in numbers: media collection, server facts, and usage neatly bundled in the web client.",readmeShowsTitle:"What is displayed?",readmeShowsText:"Totals for the selected libraries: media collection and storage, server facts, watch time, top titles, users, clients, and playback methods.",readmeSourceTitle:"Where does the data come from?",readmeSourceText:"Media and server facts come directly from Emby. Insights reads usage data exclusively from Playback Reporting; without it, usage data is currently unavailable.",readmeStorageTitle:"Where is it stored?",readmeStorageText:"Insights currently stores no separate copy. Usage data remains in Playback Reporting; a dedicated database is planned as a future feature.",readmeAccessTitle:"Who can view the data?",readmeAccessText:"Only Emby administrators can open the Insights tab and its endpoints.",
                infoDescription:"Hard facts about your server, right on the home screen: Emby Insights shows you what is happening on your server and delivers the occasional aha moment along the way—just for administrators and without changing Playback Reporting. 😉",compatibilityBadge:"✓ Emby Stable + Beta",readOnlyBadge:"✓ Playback Reporting read only",latestChanges:"Latest change",latestChange:"The Insights tab is now a permanent part of the plugin; the misleading browser extension switch has been removed.",betaNote:"Emby Insights is still in beta. Found something or have a bright idea?",githubIssues:"Report it on GitHub"
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

        function describeError(error) {
            if (error && typeof error.text === "function" && typeof error.status !== "undefined") {
                var fallback = error.status + " " + (error.statusText || "Request failed");
                return error.text().then(function (body) {
                    var message = body;
                    try {
                        var json = JSON.parse(body);
                        message = (json.ResponseStatus && json.ResponseStatus.Message) || json.Message || body;
                    } catch (ignored) { /* Response body is plain text. */ }
                    return (message && message.trim()) || fallback;
                }).catch(function () { return fallback; });
            }
            return Promise.resolve(error && error.message ? error.message : String(error));
        }

        function renderChangelog(entries) {
            var container = view.querySelector("#LatestChanges");
            container.innerHTML = "";
            var entry = (entries || [])[0];
            if (!entry) return;
            var version = document.createElement("p");
            var strong = document.createElement("strong");
            strong.textContent = "Version " + (entry.Version || entry.version || "");
            version.appendChild(strong);
            var list = document.createElement("ul");
            (entry.Notes || entry.notes || []).forEach(function (note) {
                var item = document.createElement("li");
                item.textContent = note;
                list.appendChild(item);
            });
            container.appendChild(version);
            container.appendChild(list);
        }

        function loadChangelog() {
            var container = view.querySelector("#LatestChanges");
            if (changelogCache) { renderChangelog(changelogCache); return Promise.resolve(); }
            container.textContent = t("loading");
            return ApiClient.ajax({ type: "GET", url: ApiClient.getUrl("EmbyInsights/Changelog"), dataType: "json" })
                .then(function (entries) { changelogCache = entries || []; renderChangelog(changelogCache); })
                .catch(function () { container.textContent = t("changelogError"); });
        }

        function loadReadme() {
            openModal("ReadmeModal");
        }

        function loadLogs() {
            var body = view.querySelector("#LogsBody");
            body.textContent = t("loading");
            return ApiClient.ajax({ type: "GET", url: ApiClient.getUrl("EmbyInsights/Logs", { MaxLines: 300 }), dataType: "json" })
                .then(function (result) { body.textContent = result && result.Text ? result.Text : t("noLogs"); body.scrollTop = body.scrollHeight; })
                .catch(function (error) { describeError(error).then(function (message) { body.textContent = t("logsError") + message; }); });
        }

        function escapeHtml(value) {
            return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }

        function openLogsInNewTab() {
            var logText = view.querySelector("#LogsBody").textContent;
            var html = '<pre style="white-space:pre-wrap;word-break:break-word;font-family:monospace;' +
                'font-size:14px;line-height:1.4;background:#000;color:#ddd;padding:1em;margin:0">' +
                escapeHtml(logText) + "</pre>";
            var url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
            window.open(url, "_blank");
            window.setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
        }

        function setValue(id, value) {
            view.querySelector("#" + id).value = value;
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
                describeError(error).then(function (message) { Dashboard.alert(t("saveError") + message); });
            });
        }

        view.querySelector("#EmbyInsightsConfigForm").addEventListener("submit", saveConfig);
        view.querySelector("#BtnReadme").addEventListener("click", loadReadme);
        view.querySelector("#BtnLogs").addEventListener("click", function () { openModal("LogsModal"); loadLogs(); });
        view.querySelector("#BtnRefreshLogs").addEventListener("click", loadLogs);
        view.querySelector("#BtnOpenLogsNewTab").addEventListener("click", openLogsInNewTab);
        view.querySelector("#BtnInfo").addEventListener("click", function () { openModal("InfoModal"); loadChangelog(); });
        view.querySelector("#Language").addEventListener("change", function () {
            language = this.value === "en" ? "en" : "de";
            applyTranslations();
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
