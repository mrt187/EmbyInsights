(function (root, createDashboard) {
  var dashboard = createDashboard();
  root.EmbyInsightsDashboard = dashboard;
  if (typeof define === "function") define(["emby-button"], function () { return dashboard; });
})(window, function () {
  "use strict";

  return function (view, apiClient) {
    apiClient = apiClient || (typeof ApiClient !== "undefined" ? ApiClient : null);
    if (!apiClient) throw new Error("Emby API client is unavailable.");
    var currentRange = "all";
    var language = "de";
    var pluginId = "be7dcc0f-d8d7-498f-9d65-77db72239cee";
    var words = {
      de: { serverFacts:"Server-Fakten",userFacts:"Nutzer-Fakten",days7:"7 Tage",days30:"30 Tage",year:"Jahr",all:"Gesamt",extensions:"Plugins",installedPlugins:"installierte Plugins",movieArchive:"Filme",moviesOnServer:"Filme auf dem Server",seriesWorld:"Serien",seriesEpisodes:"Serien · Episoden",musicCollection:"Musiksammlung",albumsTracks:"Alben · Titel",mediaStorage:"Speicherplatz",librarySize:"Bibliotheksgröße",apiKeys:"API-Schlüssel",createdApiKeys:"erstellte Schlüssel",completedDownloads:"Abgeschlossene Downloads",offlineItems:"vollständig übertragene Offline-Medien",totalWatchTime:"Gesamtwiedergabezeit",allUsers:"alle Nutzer",topMovie:"Top-Film",topSeries:"Top-Serie",topUser:"Top-Benutzer",noData:"Noch keine Daten",activity:"Aktivität",watchTimePerDay:"Wiedergabezeit pro Tag",devicesClients:"Geräte & Clients",playbackMethods:"Wiedergabemethoden",watchTime:"Wiedergabezeit",moviesPlayed:"Abgespielte Filme",plays:"Wiedergaben",activeUsers:"Aktive Benutzer",averagePlay:"Ø Wiedergabedauer",noActivity:"Noch keine Aktivität in diesem Zeitraum.",unknown:"Unbekannt",playSingular:"Wiedergabe",playPlural:"Wiedergaben",noDevices:"Keine Gerätedaten.",noPlayback:"Keine Wiedergabedaten.",loadError:"Statistiken konnten nicht geladen werden",hours:"Std.",minutes:"Min."},
      en: { serverFacts:"Server Facts",userFacts:"User Facts",days7:"7 Days",days30:"30 Days",year:"Year",all:"All Time",extensions:"Plugins",installedPlugins:"installed plugins",movieArchive:"Movies",moviesOnServer:"movies on the server",seriesWorld:"Series",seriesEpisodes:"series · episodes",musicCollection:"Music Collection",albumsTracks:"albums · tracks",mediaStorage:"Storage",librarySize:"library size",apiKeys:"API Keys",createdApiKeys:"created keys",completedDownloads:"Completed Downloads",offlineItems:"fully transferred offline media",totalWatchTime:"Total Watch Time",allUsers:"all users",topMovie:"Top Movie",topSeries:"Top Series",topUser:"Top User",noData:"No data yet",activity:"Activity",watchTimePerDay:"watch time per day",devicesClients:"Devices & Clients",playbackMethods:"Playback Methods",watchTime:"Watch Time",moviesPlayed:"Movies Played",plays:"Plays",activeUsers:"Active Users",averagePlay:"Average Play Duration",noActivity:"No activity in this period.",unknown:"Unknown",playSingular:"play",playPlural:"plays",noDevices:"No device data.",noPlayback:"No playback data.",loadError:"Statistics could not be loaded",hours:"hrs",minutes:"min"}
    };

    function t(key) { return (words[language] && words[language][key]) || words.de[key] || key; }

    function applyTranslations() {
      Array.prototype.forEach.call(view.querySelectorAll("[data-i18n]"), function (element) {
        element.textContent = t(element.getAttribute("data-i18n"));
      });
    }

    applyTranslations();
    apiClient.getPluginConfiguration(pluginId).then(function (config) {
      language = config && config.Language === "en" ? "en" : "de";
      applyTranslations();
    }).catch(function () {});

    function value(object, camel, pascal) {
      return object && object[camel] != null ? object[camel] : object && object[pascal];
    }

    function request(route, parameters) {
      return ajaxWithRetry(function () { return apiClient.ajax({
        type: "GET", url: apiClient.getUrl("EmbyInsights/" + route, parameters), dataType: "json"
      }); });
    }

    function coreRequest(route) {
      return ajaxWithRetry(function () { return apiClient.ajax({ type: "GET", url: apiClient.getUrl(route), dataType: "json" }); });
    }

    function ajaxWithRetry(factory, attempts) {
      attempts = attempts == null ? 20 : attempts;
      return factory().catch(function (error) {
        if (attempts <= 1) throw error;
        return new Promise(function (resolve) { window.setTimeout(resolve, 1000); })
          .then(function () { return ajaxWithRetry(factory, attempts - 1); });
      });
    }

    function metric(number, label) {
      var article = document.createElement("article"); article.className = "eiMetric";
      var strong = document.createElement("strong"); strong.textContent = number;
      var span = document.createElement("span"); span.textContent = label;
      article.appendChild(strong); article.appendChild(span); return article;
    }

    function renderOverview(data) {
      var container = view.querySelector("#InsightsMetrics"); container.innerHTML = "";
      view.querySelector("#HighlightWatchTime").textContent = duration(value(data,"watchSeconds","WatchSeconds"));
      container.appendChild(metric(value(data,"movies","Movies") || 0, t("moviesPlayed")));
      container.appendChild(metric(value(data,"playbackCount","PlaybackCount") || 0, t("plays")));
      container.appendChild(metric(value(data,"activeUsers","ActiveUsers") || 0, t("activeUsers")));
      var plays = Number(value(data,"playbackCount","PlaybackCount") || 0), seconds = Number(value(data,"watchSeconds","WatchSeconds") || 0);
      container.appendChild(metric(duration(plays ? seconds / plays : 0), t("averagePlay")));
    }

    function renderServerOverview(data) {
      view.querySelector("#HighlightMovies").textContent = value(data,"movies","Movies") || 0;
      view.querySelector("#HighlightSeries").textContent = value(data,"series","Series") || 0;
      view.querySelector("#HighlightEpisodes").textContent = value(data,"episodes","Episodes") || 0;
      view.querySelector("#HighlightAlbums").textContent = value(data,"musicAlbums","MusicAlbums") || 0;
      view.querySelector("#HighlightSongs").textContent = value(data,"songs","Songs") || 0;
      view.querySelector("#HighlightStorage").textContent = value(data,"totalSize","TotalSize") || "0 B";
    }

    function renderEnvironment(info, plugins, keys, jobs) {
      var version = value(info,"version","Version") || t("unknown");
      view.querySelector("#ServerVersionBadge").textContent = "Emby " + version;
      view.querySelector("#HighlightPlugins").textContent = Array.isArray(plugins) ? plugins.length : 0;
      var keyItems = value(keys,"items","Items");
      view.querySelector("#HighlightApiKeys").textContent = value(keys,"totalRecordCount","TotalRecordCount") || (Array.isArray(keyItems) ? keyItems.length : 0);
      var jobItems = value(jobs,"items","Items") || [];
      var downloads = jobItems.filter(function (job) { return String(value(job,"status","Status") || "").toLowerCase() === "completed"; })
        .reduce(function (total, job) { return total + Number(value(job,"itemCount","ItemCount") || 0); }, 0);
      view.querySelector("#HighlightDownloads").textContent = downloads;
    }

    function renderActivity(rows) {
      var chart = view.querySelector("#ActivityChart"); chart.innerHTML = "";
      if (!rows || !rows.length) { chart.innerHTML = ""; var empty = document.createElement("div"); empty.className = "eiEmpty"; empty.textContent = t("noActivity"); chart.appendChild(empty); return; }
      var maximum = Math.max.apply(null, rows.map(function (x) { return Number(value(x,"watchSeconds","WatchSeconds") || 0); })) || 1;
      rows.slice(-31).forEach(function (row) {
        var seconds = Number(value(row,"watchSeconds","WatchSeconds") || 0);
        var column = document.createElement("div"); column.className = "eiBarColumn";
        column.title = (value(row,"date","Date") || "") + " · " + Math.round(seconds / 60) + " " + t("minutes");
        var bar = document.createElement("div"); bar.className = "eiBar"; bar.style.height = Math.max(2, seconds / maximum * 100) + "%";
        var label = document.createElement("span"); label.className = "eiBarLabel"; label.textContent = String(value(row,"date","Date") || "").slice(8);
        column.appendChild(bar); column.appendChild(label); chart.appendChild(column);
      });
    }

    function renderTopItems(rows) {
      if (!rows || !rows.length) return;
      var movie = rows.filter(function (row) { return String(value(row,"mediaKind","MediaKind")).toLowerCase() === "movie"; })[0];
      var episode = rows.filter(function (row) { return String(value(row,"mediaKind","MediaKind")).toLowerCase() === "episode"; })[0];
      renderFeature(movie, "TopMovie"); renderFeature(episode, "TopSeries");
    }

    function renderFeature(row, prefix) {
      var image = view.querySelector("#" + prefix + "Image"), name = view.querySelector("#" + prefix + "Name"), meta = view.querySelector("#" + prefix + "Meta");
      if (!row) { image.style.display = "none"; name.textContent = t("noData"); meta.textContent = ""; return; }
      var isSeries = prefix === "TopSeries";
      var imageId = isSeries ? value(row,"seriesItemId","SeriesItemId") : value(row,"itemId","ItemId");
      name.textContent = (isSeries ? value(row,"seriesName","SeriesName") : value(row,"name","Name")) || t("unknown");
      var count = Number(value(row,"playCount","PlayCount") || 0);
      meta.textContent = count + " " + (count === 1 ? t("playSingular") : t("playPlural")) + " · " + duration(value(row,"watchSeconds","WatchSeconds"));
      image.src = apiClient.getUrl("Items/" + imageId + "/Images/Primary", { MaxWidth: 700, Quality: 90 });
      image.style.display = "block"; image.onerror = function () { image.style.display = "none"; };
    }

    function duration(seconds) {
      seconds = Number(seconds || 0);
      var hours = Math.floor(seconds / 3600), minutes = Math.round((seconds % 3600) / 60);
      return hours ? hours + " " + t("hours") + " " + minutes + " " + t("minutes") : minutes + " " + t("minutes");
    }

    function renderUsers(rows) {
      if (!rows || !rows.length) return;
      var top = rows[0];
      if (top) {
        view.querySelector("#TopUserName").textContent = value(top,"name","Name") || value(top,"userId","UserId");
        view.querySelector("#TopUserMeta").textContent = duration(value(top,"watchSeconds","WatchSeconds")) + " · " + (value(top,"playCount","PlayCount") || 0) + " " + t("plays");
        var avatar = view.querySelector("#TopUserImage"); avatar.src = apiClient.getUrl("Users/" + value(top,"userId","UserId") + "/Images/Primary"); avatar.onerror = function () { avatar.style.visibility = "hidden"; };
      }
    }

    function renderDevices(rows) {
      var container = view.querySelector("#DevicesList"); container.innerHTML = "";
      if (!rows || !rows.length) { container.innerHTML = '<div class="eiEmpty">' + t("noDevices") + '</div>'; return; }
      rows.forEach(function (row) {
        var line = document.createElement("div"); line.className = "eiDataRow";
        var body = document.createElement("div"), client = document.createElement("strong"), device = document.createElement("div"), total = document.createElement("span");
        client.textContent = value(row,"clientName","ClientName") || t("unknown");
        device.className = "eiTopMeta"; device.textContent = (value(row,"deviceName","DeviceName") || t("unknown")) + " · " + (value(row,"playCount","PlayCount") || 0) + " " + t("plays");
        total.className = "eiDataValue"; total.textContent = duration(value(row,"watchSeconds","WatchSeconds"));
        body.appendChild(client); body.appendChild(device); line.appendChild(body); line.appendChild(total); container.appendChild(line);
      });
    }

    function renderMethods(rows) {
      var container = view.querySelector("#PlaybackMethodsList"); container.innerHTML = "";
      if (!rows || !rows.length) { container.innerHTML = '<div class="eiEmpty">' + t("noPlayback") + '</div>'; return; }
      rows.forEach(function (row) {
        var line = document.createElement("div"); line.className = "eiDataRow";
        var body = document.createElement("div"), name = document.createElement("strong"), meta = document.createElement("div"), bar = document.createElement("div"), fill = document.createElement("span"), total = document.createElement("span");
        var percentage = Number(value(row,"percentage","Percentage") || 0);
        name.textContent = value(row,"method","Method") || t("unknown");
        meta.className = "eiTopMeta"; meta.textContent = (value(row,"playCount","PlayCount") || 0) + " " + t("plays") + " · " + duration(value(row,"watchSeconds","WatchSeconds"));
        bar.className = "eiMethodBar"; fill.style.width = percentage + "%"; bar.appendChild(fill);
        total.className = "eiDataValue"; total.textContent = percentage.toFixed(1) + " %";
        body.appendChild(name); body.appendChild(meta); body.appendChild(bar); line.appendChild(body); line.appendChild(total); container.appendChild(line);
      });
    }

    function showError(error) {
      console.error("Emby Insights dashboard load failed", error);
      var target = view.querySelector("#InsightsMetrics");
      var fallback = error && error.message ? error.message : (error && error.status ? error.status + " " + (error.statusText || "") : String(error));
      target.innerHTML = ""; var message = document.createElement("div"); message.className = "eiError"; message.textContent = t("loadError") + ": " + fallback; target.appendChild(message);
      if (error && typeof error.text === "function") {
        error.text().then(function (body) {
          if (body) target.textContent = t("loadError") + ": " + body;
        }).catch(function () {});
      }
    }

    function refresh() {
      return Promise.all([
        request("Overview", { Range: currentRange }), request("Activity", { Range: currentRange }),
        request("TopItems", { Range: currentRange, Limit: 10 }), request("Users", { Range: currentRange }),
        request("Devices", { Range: currentRange }), request("PlaybackMethods", { Range: currentRange }),
        request("ServerOverview", {}),
        Promise.all([
          coreRequest("System/Info").catch(function () { return {}; }),
          coreRequest("Plugins").catch(function () { return []; }),
          coreRequest("Auth/Keys").catch(function () { return {}; }),
          coreRequest("Sync/Jobs").catch(function () { return {}; })
        ])
      ]).then(function (results) {
        renderOverview(results[0]); renderActivity(results[1]); renderTopItems(results[2]);
        renderUsers(results[3]); renderDevices(results[4]); renderMethods(results[5]); renderServerOverview(results[6]);
        renderEnvironment(results[7][0], results[7][1], results[7][2], results[7][3]);
      }).catch(showError);
    }

    Array.prototype.forEach.call(view.querySelectorAll("[data-range]"), function (button) {
      button.addEventListener("click", function () {
        currentRange = button.getAttribute("data-range");
        Array.prototype.forEach.call(view.querySelectorAll("[data-range]"), function (x) { x.classList.toggle("active", x === button); });
        refresh();
      });
    });
    Array.prototype.forEach.call(view.querySelectorAll("[data-page]"), function (button) {
      button.addEventListener("click", function () {
        var page = button.getAttribute("data-page");
        var highlights = page === "highlights";
        view.querySelector("#HighlightsPage").hidden = page !== "highlights";
        view.querySelector("#TechnicalPage").hidden = page !== "technical";
        view.querySelector(".eiDashboard").classList.toggle("eiHighlightsMode", highlights);
        Array.prototype.forEach.call(view.querySelectorAll("[data-page]"), function (x) { x.classList.toggle("active", x === button); });
        if (highlights && currentRange !== "all") {
          currentRange = "all";
          Array.prototype.forEach.call(view.querySelectorAll("[data-range]"), function (x) { x.classList.toggle("active", x.getAttribute("data-range") === "all"); });
          refresh();
        }
      });
    });
    view.addEventListener("viewshow", refresh);
    refresh();
  };
});
