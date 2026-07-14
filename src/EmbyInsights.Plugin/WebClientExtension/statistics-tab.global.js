(function () {
    "use strict";

    var buttonId = "emby-insights-home-tab";
    var overlayId = "emby-insights-overlay";
    var openStateKey = "emby-insights-open";
    var assetVersion = "0.2.0";
    var checking = false;
    var retryTimer = null;

    function isHomeRoute() {
        return /#!\/(?:home|embyinsights)(?:$|[?&])/.test(window.location.hash || "");
    }

    function isInsightsRoute() {
        var hash = window.location.hash || "";
        return /#!\/embyinsights(?:$|[?&])/.test(hash) ||
            (isHomeRoute() && window.sessionStorage.getItem(openStateKey) === "1");
    }

    function removeOverlay() {
        document.body.classList.remove("emby-insights-active");
        var overlay = document.getElementById(overlayId);
        if (overlay) overlay.remove();
        var button = document.getElementById(buttonId);
        if (button) button.classList.remove("active");
    }

    function updateOverlayTop() {
        var overlay = document.getElementById(overlayId);
        if (!overlay) return;
        var header = document.querySelector(".skinHeader");
        overlay.style.top = Math.max(0, header ? header.getBoundingClientRect().bottom : 0) + "px";
    }

    function showOverlay() {
        if (!isInsightsRoute()) return;
        document.body.classList.add("emby-insights-active");
        if (!window.ApiClient || typeof window.EmbyInsightsDashboard !== "function") {
            if (!retryTimer) retryTimer = window.setTimeout(function () {
                retryTimer = null;
                showOverlay();
            }, 100);
            return;
        }
        var button = document.getElementById(buttonId);
        if (button) button.classList.add("active");
        if (document.getElementById(overlayId)) return;
        var overlay = document.createElement("div");
        overlay.id = overlayId;
        overlay.innerHTML = '<div class="emby-insights-loading">Insights werden geladen…</div>';
        document.body.appendChild(overlay);
        updateOverlayTop();
        fetch("emby-insights/dashboard.html?v=" + assetVersion, { cache: "no-store" }).then(function (response) {
            if (!response.ok) throw new Error("Dashboard resource returned " + response.status);
            return response.text();
        }).then(function (html) {
            overlay.innerHTML = html;
            var factory = window.EmbyInsightsDashboard;
            var view = overlay.querySelector(".view");
            if (typeof factory !== "function" || !view) throw new Error("Statistics controller not found.");
            factory(view, window.ApiClient);
        }).catch(function (error) {
            console.error("Emby Insights overlay load failed", error);
            overlay.innerHTML = "";
            var message = document.createElement("div");
            message.className = "emby-insights-loading error";
            message.textContent = "Statistiken konnten nicht geladen werden: " + String(error && error.message ? error.message : error);
            overlay.appendChild(message);
        });
    }

    function syncRoute() {
        if (isInsightsRoute()) showOverlay(); else removeOverlay();
        inject();
    }

    function findHomeTabs() {
        var sliders = document.querySelectorAll(".tabs-viewmenubar-slider.emby-tabs-slider");
        for (var index = 0; index < sliders.length; index++) {
            var slider = sliders[index];
            var start = slider.querySelector('.main-tab-button[data-index="0"]');
            var favorites = slider.querySelector('.main-tab-button[data-index="1"]');
            if (start && favorites && slider.closest(".skinHeader"))
                return { slider: slider, favorites: favorites };
        }
        return null;
    }

    function openStatistics(event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        window.sessionStorage.setItem(openStateKey, "1");
        // Keep Emby's router on its real home route. Custom query parameters can
        // leave some Web Client builds on the loading screen after a hard refresh.
        if (window.location.hash !== "#!/home") window.location.hash = "#!/home";
        showOverlay();
    }

    function inject() {
        updateOverlayTop();
        if (!isHomeRoute()) {
            window.sessionStorage.removeItem(openStateKey);
            removeOverlay();
            var oldButton = document.getElementById(buttonId);
            if (oldButton) oldButton.remove();
            return;
        }
        if (document.getElementById(buttonId) || checking || !window.ApiClient) {
            if (isInsightsRoute()) showOverlay();
            return;
        }
        var homeTabs = findHomeTabs();
        if (!homeTabs) return;
        checking = true;
        window.ApiClient.getCurrentUser()
            .then(function (user) {
                if (!user || !user.Policy || !user.Policy.IsAdministrator) return;
                if (document.getElementById(buttonId) || !document.body.contains(homeTabs.slider)) return;
                var button = document.createElement("button");
                button.type = "button";
                button.id = buttonId;
                button.className = "emby-insights-tab-button";
                button.textContent = "Insights";
                button.setAttribute("aria-label", button.textContent);
                button.addEventListener("click", openStatistics);
                homeTabs.favorites.insertAdjacentElement("afterend", button);
                if (isInsightsRoute()) showOverlay();
            }).catch(function (error) {
                console.warn("Emby Insights tab injection skipped", error);
            }).finally(function () { checking = false; });
    }

    var style = document.createElement("style");
    style.textContent = ".emby-insights-tab-button{appearance:none;background:transparent;border:0;border-radius:999px;color:rgba(255,255,255,.6);cursor:pointer;display:inline-block;font:inherit;font-weight:600;height:24.7656px;line-height:24.7656px;padding:0 16px}.emby-insights-tab-button:hover,.emby-insights-tab-button:focus{color:#fff;outline:none}.emby-insights-tab-button.active{background:rgba(189,189,189,.5);border-radius:999px;color:#fff}body.emby-insights-active .main-tab-button[data-index=\"0\"]{background:transparent!important}#emby-insights-overlay{background:#101416;bottom:0;left:0;overflow:auto;position:fixed;right:0;z-index:1090}#emby-insights-overlay>.view{height:100%}.emby-insights-loading{color:#aaa;display:grid;height:100%;place-items:center}.emby-insights-loading.error{color:#ff8a80}";
    document.head.appendChild(style);

    document.addEventListener("click", function (event) {
        var target = event.target && event.target.closest ? event.target.closest("#" + buttonId) : null;
        if (target) return openStatistics(event);
        var normalTab = event.target && event.target.closest ? event.target.closest(".main-tab-button") : null;
        if (normalTab && isInsightsRoute()) {
            window.sessionStorage.removeItem(openStateKey);
            removeOverlay();
            window.location.hash = "#!/home";
        }
    }, true);

    new MutationObserver(inject).observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener("hashchange", syncRoute);
    window.addEventListener("load", syncRoute);
    window.addEventListener("resize", function () {
        updateOverlayTop();
    });
    document.addEventListener("viewshow", syncRoute);
    syncRoute();
})();
