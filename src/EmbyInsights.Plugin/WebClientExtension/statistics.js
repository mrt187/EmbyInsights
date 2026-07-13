(function (root, createDashboard) {
  var dashboard = createDashboard();
  root.EmbyInsightsDashboard = dashboard;
  if (typeof define === "function") define(["emby-button"], function () { return dashboard; });
})(window, function () {
  "use strict";

  return function (view, apiClient) {
    apiClient = apiClient || (typeof ApiClient !== "undefined" ? ApiClient : null);
    if (!apiClient) throw new Error("Emby API client is unavailable.");
    var language = "de";
    var theme = "emerald";
    var backupInfoData = null;
    var userFactsData = [];
    var deviceFactsData = [];
    var pluginId = "be7dcc0f-d8d7-498f-9d65-77db72239cee";
    var words = {
      de: { serverFacts:"Server-Fakten",userFacts:"Nutzer-Fakten",extensions:"Plugins",installedPlugins:"installierte Plugins",movieArchive:"Filme",moviesOnServer:"Filme auf dem Server",seriesWorld:"Serien",seriesEpisodes:"Serien · Episoden",musicCollection:"Musiksammlung",albumsTracks:"Alben · Titel",mediaStorage:"Speicherplatz",librarySize:"Bibliotheksgröße",apiKeys:"API-Schlüssel",createdApiKeys:"erstellte Schlüssel",completedDownloads:"Abgeschlossene Downloads",offlineItems:"vollständig übertragene Offline-Medien",totalWatchTime:"Gesamtwiedergabezeit",allUsers:"alle Nutzer",topMovie:"Top-Film",topSeries:"Top-Serie",topUser:"Top-Benutzer",noData:"Noch keine Daten",devicesClients:"Top-Clients nach Wiedergaben",playbackMethods:"Wiedergabemethoden",plays:"Wiedergaben",unknown:"Unbekannt",playSingular:"Wiedergabe",playPlural:"Wiedergaben",noDevices:"Keine Client-Daten.",noPlayback:"Keine Wiedergabedaten.",loadError:"Statistiken konnten nicht geladen werden",hours:"Std.",minutes:"Min.",userRanking:"Top Nutzer",directPlayKing:"Direct Play King",transcodeKing:"Transcode King",directPlays:"Direct Plays",transcodes:"Transcodierungen",directPlayShort:"Direct",transcodeShort:"Transcode",usersTotal:"Nutzer insgesamt",clientsTotal:"Clients insgesamt",topClientsWatch:"Top Clients",topClientsTranscoding:"Top Clients Transcoding",backups:"Backups",lastBackup:"Letztes Backup",noBackup:"Noch kein Backup"},
      en: { serverFacts:"Server Facts",userFacts:"User Facts",extensions:"Plugins",installedPlugins:"installed plugins",movieArchive:"Movies",moviesOnServer:"movies on the server",seriesWorld:"Series",seriesEpisodes:"series · episodes",musicCollection:"Music Collection",albumsTracks:"albums · tracks",mediaStorage:"Storage",librarySize:"library size",apiKeys:"API Keys",createdApiKeys:"created keys",completedDownloads:"Completed Downloads",offlineItems:"fully transferred offline media",totalWatchTime:"Total Watch Time",allUsers:"all users",topMovie:"Top Movie",topSeries:"Top Series",topUser:"Top User",noData:"No data yet",devicesClients:"Top Clients by Plays",playbackMethods:"Playback Methods",plays:"Plays",unknown:"Unknown",playSingular:"play",playPlural:"plays",noDevices:"No client data.",noPlayback:"No playback data.",loadError:"Statistics could not be loaded",hours:"hrs",minutes:"min",userRanking:"Top Users",directPlayKing:"Direct Play King",transcodeKing:"Transcode King",directPlays:"Direct Plays",transcodes:"Transcodes",directPlayShort:"Direct",transcodeShort:"Transcode",usersTotal:"Users total",clientsTotal:"Clients total",topClientsWatch:"Top Clients",topClientsTranscoding:"Top Clients Transcoding",backups:"Backups",lastBackup:"Last backup",noBackup:"No backup yet"}
    };

    function t(key) { return (words[language] && words[language][key]) || words.de[key] || key; }

    function applyTheme(name) {
      theme = name === "terminal" ? "terminal" : "emerald";
      var dashboard = view.querySelector(".eiDashboard");
      if (dashboard) dashboard.classList.toggle("eiThemeTerminal", theme === "terminal");
    }

    function applyTranslations() {
      Array.prototype.forEach.call(view.querySelectorAll("[data-i18n]"), function (element) {
        element.textContent = t(element.getAttribute("data-i18n"));
      });
      if (view.querySelector("#UserRankingList")) renderUserFacts(userFactsData);
      if (view.querySelector("#TopClientsWatchList")) renderWatchClients(deviceFactsData);
      if (backupInfoData) renderBackupInfo(backupInfoData);
    }

    applyTranslations();
    apiClient.getPluginConfiguration(pluginId).then(function (config) {
      language = config && config.Language === "en" ? "en" : "de";
      applyTheme(config && config.Theme === "terminal" ? "terminal" : "emerald");
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

    function safeRequest(route, parameters, fallback) {
      return request(route, parameters).catch(function (error) {
        console.error("Emby Insights request failed: " + route, error);
        return fallback;
      });
    }

    function coreRequest(route) {
      return ajaxWithRetry(function () { return apiClient.ajax({ type: "GET", url: apiClient.getUrl(route), dataType: "json" }); });
    }

    function ajaxWithRetry(factory, attempts) {
      attempts = attempts == null ? 20 : attempts;
      return factory().catch(function (error) {
        if (attempts <= 1 || (error && error.status && error.status !== 503)) throw error;
        return new Promise(function (resolve) { window.setTimeout(resolve, 1000); })
          .then(function () { return ajaxWithRetry(factory, attempts - 1); });
      });
    }

    function renderOverview(data) {
      view.querySelector("#HighlightWatchTime").textContent = duration(value(data,"watchSeconds","WatchSeconds"));
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
      view.querySelector("#EmbyVersionLine").textContent = "Emby " + (value(info,"version","Version") || t("unknown"));
      view.querySelector("#HighlightPlugins").textContent = Array.isArray(plugins) ? plugins.length : 0;
      var keyItems = value(keys,"items","Items");
      view.querySelector("#HighlightApiKeys").textContent = value(keys,"totalRecordCount","TotalRecordCount") || (Array.isArray(keyItems) ? keyItems.length : 0);
      var jobItems = value(jobs,"items","Items") || [];
      var downloads = jobItems.filter(function (job) { return String(value(job,"status","Status") || "").toLowerCase() === "completed"; })
        .reduce(function (total, job) { return total + Number(value(job,"itemCount","ItemCount") || 0); }, 0);
      view.querySelector("#HighlightDownloads").textContent = downloads;
    }

    function renderBackupInfo(data) {
      backupInfoData = data;
      var full = value(data,"fullBackupInfo","FullBackupInfo"), light = value(data,"lightBackups","LightBackups") || [];
      var backups = (Array.isArray(light) ? light.slice() : []);
      if (full && value(full,"dateCreated","DateCreated")) backups.push(full);
      view.querySelector("#HighlightBackups").textContent = backups.length;
      var meta = view.querySelector("#HighlightBackupMeta");
      if (!backups.length) { meta.textContent = t("noBackup"); return; }
      var latest = backups.map(function (backup) { return new Date(value(backup,"dateCreated","DateCreated")); })
        .filter(function (date) { return !isNaN(date.getTime()); })
        .sort(function (a, b) { return b.getTime() - a.getTime(); })[0];
      meta.textContent = latest ? t("lastBackup") + ": " + latest.toLocaleDateString(language === "de" ? "de-DE" : "en-US") : t("noBackup");
    }

    function renderTopItems(rows) {
      if (!rows || !rows.length) return;
      var movie = rows.filter(function (row) { return String(value(row,"mediaKind","MediaKind")).toLowerCase() === "movie"; })[0];
      var episode = rows.filter(function (row) {
        return String(value(row,"mediaKind","MediaKind")).toLowerCase() === "episode" &&
          value(row,"seriesItemId","SeriesItemId") && value(row,"seriesName","SeriesName");
      })[0];
      renderFeature(movie, "TopMovie"); renderFeature(episode, "TopSeries");
    }

    function renderFeature(row, prefix) {
      var card = view.querySelector("#" + prefix + "Card"), image = view.querySelector("#" + prefix + "Image"), name = view.querySelector("#" + prefix + "Name"), meta = view.querySelector("#" + prefix + "Meta");
      if (!row) { card.style.removeProperty("--ei-feature-background"); image.style.display = "none"; name.textContent = t("noData"); meta.textContent = ""; return; }
      var isSeries = prefix === "TopSeries";
      var imageId = isSeries ? value(row,"seriesItemId","SeriesItemId") : value(row,"itemId","ItemId");
      name.textContent = (isSeries ? value(row,"seriesName","SeriesName") : value(row,"name","Name")) || t("unknown");
      var count = Number(value(row,"playCount","PlayCount") || 0);
      meta.textContent = count + " " + (count === 1 ? t("playSingular") : t("playPlural")) + " · " + duration(value(row,"watchSeconds","WatchSeconds"));
      if (imageId) {
        var primaryFallback = false;
        var backdropUrl = apiClient.getUrl("Items/" + imageId + "/Images/Backdrop/0", { MaxWidth: 1200, Quality: 90 });
        image.classList.remove("eiPosterFallback");
        card.style.setProperty("--ei-feature-background", "url(\"" + backdropUrl + "\")");
        image.src = backdropUrl;
        image.style.display = "block";
        image.onerror = function () {
          if (!primaryFallback) {
            primaryFallback = true;
            var primaryUrl = apiClient.getUrl("Items/" + imageId + "/Images/Primary", { MaxWidth: 700, Quality: 90 });
            image.classList.add("eiPosterFallback");
            card.style.setProperty("--ei-feature-background", "url(\"" + primaryUrl + "\")");
            image.src = primaryUrl;
          } else { card.style.removeProperty("--ei-feature-background"); image.style.display = "none"; }
        };
      } else { card.style.removeProperty("--ei-feature-background"); image.style.display = "none"; }
    }

    function duration(seconds) {
      seconds = Number(seconds || 0);
      var hours = Math.floor(seconds / 3600), minutes = Math.round((seconds % 3600) / 60);
      return hours ? hours + " " + t("hours") + " " + minutes + " " + t("minutes") : minutes + " " + t("minutes");
    }

    function renderUsers(rows) {
      userFactsData = rows || [];
      renderUserFacts(userFactsData);
      if (!userFactsData.length) return;
      var top = userFactsData[0];
      if (top) {
        view.querySelector("#TopUserName").textContent = value(top,"name","Name") || value(top,"userId","UserId");
        view.querySelector("#TopUserMeta").textContent = duration(value(top,"watchSeconds","WatchSeconds")) + " · " + (value(top,"playCount","PlayCount") || 0) + " " + t("plays");
        var avatar = view.querySelector("#TopUserImage"); avatar.src = apiClient.getUrl("Users/" + value(top,"userId","UserId") + "/Images/Primary"); avatar.onerror = function () { avatar.style.visibility = "hidden"; };
      }
    }

    function userColor(name) {
      var colors = theme === "terminal"
        ? ["#183f25", "#20512e", "#286239", "#1b4829", "#316f41"]
        : ["#327c68", "#5d6fb4", "#9b5f76", "#8b6c3f", "#477e9d", "#7b609e", "#4d8b57", "#a15d48", "#52758b", "#6d7850"];
      var hash = 0, text = String(name || "?");
      for (var i = 0; i < text.length; i++) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
      return colors[Math.abs(hash) % colors.length];
    }

    function initials(name) {
      return String(name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(function (part) { return part.charAt(0); }).join("").toUpperCase() || "?";
    }

    function decorateAvatar(element, user) {
      element.textContent = user.initials;
      element.style.backgroundColor = user.color;
      element.style.backgroundImage = user.id ? "url('" + apiClient.getUrl("Users/" + user.id + "/Images/Primary") + "')" : "none";
      element.style.backgroundPosition = "center";
      element.style.backgroundSize = "cover";
    }

    function renderUserFacts(rows) {
      var users = (rows || []).map(function (row) {
        var name = value(row,"name","Name") || value(row,"userId","UserId") || t("unknown");
        return { id:value(row,"userId","UserId"), name:name, initials:initials(name), seconds:Number(value(row,"watchSeconds","WatchSeconds") || 0), plays:Number(value(row,"playCount","PlayCount") || 0), direct:Number(value(row,"directPlayCount","DirectPlayCount") || 0), transcode:Number(value(row,"transcodeCount","TranscodeCount") || 0), color:userColor(name) };
      }).sort(function (a, b) { return b.seconds - a.seconds; });
      view.querySelector("#TotalUsers").textContent = users.length;
      var container = view.querySelector("#UserRankingList"); container.innerHTML = "";
      if (!users.length) {
        view.querySelector("#DirectPlayLeaderName").textContent = t("noData");
        view.querySelector("#TranscodeLeaderName").textContent = t("noData");
        view.querySelector("#DirectPlayLeaderCount").textContent = 0;
        view.querySelector("#TranscodeLeaderCount").textContent = 0;
        return;
      }
      var directLeader = users.slice().sort(function (a,b) { return b.direct - a.direct; })[0];
      var transcodeLeader = users.slice().sort(function (a,b) { return b.transcode - a.transcode; })[0];
      decorateAvatar(view.querySelector("#DirectPlayLeaderAvatar"), directLeader);
      view.querySelector("#DirectPlayLeaderName").textContent = directLeader.name;
      view.querySelector("#DirectPlayLeaderCount").textContent = directLeader.direct;
      decorateAvatar(view.querySelector("#TranscodeLeaderAvatar"), transcodeLeader);
      view.querySelector("#TranscodeLeaderName").textContent = transcodeLeader.name;
      view.querySelector("#TranscodeLeaderCount").textContent = transcodeLeader.transcode;
      users.forEach(function (user, index) {
        var row = document.createElement("div"); row.className = "eiUserRow" + (index === 0 ? " featured" : "");
        var identity = document.createElement("div"); identity.className = "eiUserIdentity";
        var avatar = document.createElement("span"); avatar.className = "eiUserMiniAvatar"; decorateAvatar(avatar, user);
        var stats = document.createElement("div"); stats.className = "eiUserStats";
        var name = document.createElement("strong"); name.className = "eiUserName"; name.textContent = user.name;
        var detail = document.createElement("div"); detail.className = "eiTopMeta"; detail.textContent = user.direct + " " + t("directPlayShort") + " · " + user.transcode + " " + t("transcodeShort");
        var split = document.createElement("div"); split.className = "eiPlaybackSplit";
        var directBar = document.createElement("span"); directBar.style.width = ((user.direct + user.transcode) ? user.direct * 100 / (user.direct + user.transcode) : 0) + "%"; split.appendChild(directBar);
        stats.appendChild(name); stats.appendChild(detail); stats.appendChild(split); identity.appendChild(avatar); identity.appendChild(stats);
        var totals = document.createElement("div"); totals.className = "eiUserTotals";
        var time = document.createElement("strong"); time.textContent = duration(user.seconds);
        var plays = document.createElement("span"); plays.className = "eiTopMeta"; plays.textContent = user.plays + " " + t("plays"); totals.appendChild(time); totals.appendChild(plays);
        row.appendChild(identity); row.appendChild(totals); container.appendChild(row);
      });
    }

    function renderWatchClients(rows) {
      deviceFactsData = rows || [];
      var byName = {};
      deviceFactsData.forEach(function (row) {
        var name = value(row,"clientName","ClientName") || t("unknown");
        if (!byName[name]) byName[name] = { name:name, seconds:0, plays:0, transcodes:0 };
        byName[name].seconds += Number(value(row,"watchSeconds","WatchSeconds") || 0);
        byName[name].plays += Number(value(row,"playCount","PlayCount") || 0);
        byName[name].transcodes += Number(value(row,"transcodeCount","TranscodeCount") || 0);
      });
      var clients = Object.keys(byName).map(function (name) { return byName[name]; }).sort(function (a, b) { return b.seconds - a.seconds; });
      view.querySelector("#TotalClients").textContent = clients.length;
      var container = view.querySelector("#TopClientsWatchList"); container.innerHTML = "";
      clients.forEach(function (client) {
        var row = document.createElement("div"); row.className = "eiWatchClientRow";
        var body = document.createElement("div"), nameLine = document.createElement("div"), crown = document.createElement("span"), name = document.createElement("strong"), meta = document.createElement("span"), time = document.createElement("span");
        nameLine.className = "eiWatchClientName"; crown.className = "eiWatchClientCrown"; crown.textContent = "👑"; name.textContent = client.name;
        meta.className = "eiTopMeta"; meta.textContent = client.plays + " " + t("plays"); time.className = "eiWatchClientTime"; time.textContent = duration(client.seconds);
        nameLine.appendChild(crown); nameLine.appendChild(name); body.appendChild(nameLine); body.appendChild(meta); row.appendChild(body); row.appendChild(time); container.appendChild(row);
      });
      renderTranscodeClients(clients);
    }

    function renderTranscodeClients(clients) {
      var container = view.querySelector("#TopClientsTranscodeList"); container.innerHTML = "";
      clients.filter(function (client) { return client.transcodes > 0; }).sort(function (a, b) { return b.transcodes - a.transcodes || b.seconds - a.seconds; }).forEach(function (client) {
        var row = document.createElement("div"); row.className = "eiWatchClientRow";
        var body = document.createElement("div"), nameLine = document.createElement("div"), crown = document.createElement("span"), name = document.createElement("strong"), meta = document.createElement("span"), count = document.createElement("span");
        nameLine.className = "eiWatchClientName"; crown.className = "eiWatchClientCrown"; crown.textContent = "👑"; name.textContent = client.name;
        meta.className = "eiTopMeta"; meta.textContent = client.plays + " " + t("plays"); count.className = "eiWatchClientTime"; count.textContent = client.transcodes + " " + t("transcodeShort");
        nameLine.appendChild(crown); nameLine.appendChild(name); body.appendChild(nameLine); body.appendChild(meta); row.appendChild(body); row.appendChild(count); container.appendChild(row);
      });
    }

    function showError(error) {
      console.error("Emby Insights dashboard load failed", error);
      var target = view.querySelector(".eiDashboard"), oldMessage = target.querySelector(".eiError");
      if (oldMessage) oldMessage.remove();
      var fallback = error && error.message ? error.message : (error && error.status ? error.status + " " + (error.statusText || "") : String(error));
      var message = document.createElement("div"); message.className = "eiError"; message.textContent = t("loadError") + ": " + fallback; target.insertBefore(message, target.firstChild);
      if (error && typeof error.text === "function") {
        error.text().then(function (body) {
          if (body) message.textContent = t("loadError") + ": " + body;
        }).catch(function () {});
      }
    }

    function refresh() {
      return Promise.all([
        safeRequest("Overview", { Range: "all" }, null), safeRequest("TopItems", { Range: "all", Limit: 10 }, []),
        safeRequest("Users", { Range: "all" }, []), safeRequest("ServerOverview", {}, null),
        safeRequest("Devices", { Range: "all" }, []),
        Promise.all([
          coreRequest("System/Info").catch(function () { return {}; }),
          coreRequest("Plugins").catch(function () { return []; }),
          coreRequest("Auth/Keys").catch(function () { return {}; }),
          coreRequest("Sync/Jobs").catch(function () { return {}; }),
          coreRequest("BackupRestore/BackupInfo").catch(function () { return {}; })
        ])
      ]).then(function (results) {
        if (results[0]) renderOverview(results[0]); renderTopItems(results[1]); renderUsers(results[2]);
        if (results[3]) renderServerOverview(results[3]); renderWatchClients(results[4]);
        renderEnvironment(results[5][0], results[5][1], results[5][2], results[5][3]);
        renderBackupInfo(results[5][4]);
      }).catch(showError);
    }

    Array.prototype.forEach.call(view.querySelectorAll("[data-page]"), function (button) {
      button.addEventListener("click", function () {
        var page = button.getAttribute("data-page");
        var highlights = page === "highlights";
        view.querySelector("#HighlightsPage").hidden = page !== "highlights";
        view.querySelector("#TechnicalPage").hidden = page !== "technical";
        view.querySelector(".eiDashboard").classList.toggle("eiHighlightsMode", highlights);
        Array.prototype.forEach.call(view.querySelectorAll("[data-page]"), function (x) { x.classList.toggle("active", x === button); });
      });
    });
    view.addEventListener("viewshow", refresh);
    refresh();
  };
});
