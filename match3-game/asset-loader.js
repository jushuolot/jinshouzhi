/**
 * 分阶段资源加载 · 首屏只拉核心，立绘/3D/影院模块后台补齐
 */
(function () {
  "use strict";

  var DEFERRED_CSS = [
    "ultimate.css",
    "story.css",
    "codex.css",
    "map-narrative.css",
    "cinema.css",
    "blockbuster.css",
    "portrait-cinema.css",
    "codex-unlock.css",
    "result-cinema.css",
    "match-fx.css",
    "tomb-atmosphere.css",
    "stars.css",
    "ancient-map.css",
    "desktop-cinema.css",
    "artifact-museum.css",
    "discovery-cinema.css",
  ];

  var CRITICAL_SCRIPTS = [
    "landing/sponsors.js",
    "ad-config.js",
    "virtual-account.js",
    "network-earnings.js",
    "story.js",
    "map-narrative.js",
    "expedition-data.js",
    "world-map-2d.js",
    "expedition-map-2d.js",
    "match-fx.js",
    "tomb-atmosphere.js",
    "evolution.js",
    "civilization-clock.js",
    "game.js",
  ];

  var CINEMA_SCRIPTS = [
    "portrait-art.js",
    "portrait-painter.js",
    "portrait-real.js",
    "portrait-cinema.js",
    "cinema-wipe.js",
    "discovery-cinema.js",
    "result-cinema.js",
    "home-cinema.js",
    "blockbuster-intro.js",
  ];

  var CODEX_SCRIPTS = [
    "codex-unlock.js",
    "codex.js",
    "artifact-photos.js",
    "artifact-gallery.js",
    "artifacts-3d.js",
  ];

  var THREE_SCRIPTS = [
    "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js",
    "three-engine.js",
    "world-3d.js",
    "expedition-3d.js",
  ];

  var cinemaReady = null;
  var threeReady = null;
  var codexReady = null;
  var deferredStarted = false;

  function loadStylesheet(href) {
    if (document.querySelector('link[href="' + href + '"]')) return;
    var l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    document.head.appendChild(l);
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) {
        resolve();
        return;
      }
      var s = document.createElement("script");
      s.src = src;
      s.async = false;
      s.onload = function () {
        resolve();
      };
      s.onerror = function () {
        reject(new Error("load failed: " + src));
      };
      document.body.appendChild(s);
    });
  }

  function loadScriptChain(list) {
    return list.reduce(function (p, src) {
      return p.then(function () {
        return loadScript(src);
      });
    }, Promise.resolve());
  }

  function loadDeferredCss() {
    DEFERRED_CSS.forEach(loadStylesheet);
  }

  function preloadPortraits() {
    if (!window.PortraitPainter || !window.PortraitPainter.preloadAll) return;
    window.PortraitPainter.preloadAll(null, null);
  }

  function startDeferredIdle() {
    if (deferredStarted) return;
    deferredStarted = true;
    loadDeferredCss();
    cinemaReady = loadScriptChain(CINEMA_SCRIPTS)
      .then(function () {
        preloadPortraits();
      })
      .catch(function () {
        return null;
      });
    codexReady = loadScriptChain(CODEX_SCRIPTS).catch(function () {
      return null;
    });
    window.setTimeout(function () {
      ensureThree().catch(function () {
        return null;
      });
    }, 1200);
  }

  function ensureCinema() {
    if (window.PortraitCinema && window.CinemaWipe) return Promise.resolve();
    if (!cinemaReady) {
      loadDeferredCss();
      cinemaReady = loadScriptChain(CINEMA_SCRIPTS).catch(function () {
        return null;
      });
    }
    return cinemaReady || Promise.resolve();
  }

  function ensureCodex() {
    if (window.ArtifactGallery) return Promise.resolve();
    if (!codexReady) {
      loadDeferredCss();
      codexReady = loadScriptChain(CODEX_SCRIPTS)
        .then(function () {
          if (window.ThreeEngine && window.ThreeEngine.retryInit) window.ThreeEngine.retryInit();
        })
        .catch(function () {
          return null;
        });
    }
    return codexReady || Promise.resolve();
  }

  function ensureThree() {
    if (typeof THREE !== "undefined" && window.ThreeEngine) return Promise.resolve();
    if (threeReady) return threeReady;
    threeReady = loadScriptChain(THREE_SCRIPTS)
      .then(function () {
        window.threeReady = typeof THREE !== "undefined";
        if (window.ThreeEngine && window.ThreeEngine.retryInit) {
          window.ThreeEngine.retryInit();
        }
      })
      .catch(function () {
        if (window.bootLoaderEnsureThree) {
          return new Promise(function (resolve) {
            window.bootLoaderEnsureThree(resolve);
          });
        }
        return null;
      });
    return threeReady;
  }

  function boot() {
    if (window.setBootStatus) window.setBootStatus("加载核心模块…");
    loadScriptChain(CRITICAL_SCRIPTS)
      .then(function () {
        if (window.requestIdleCallback) {
          window.requestIdleCallback(startDeferredIdle, { timeout: 800 });
        } else {
          window.setTimeout(startDeferredIdle, 50);
        }
      })
      .catch(function () {
        if (window.setBootStatus) window.setBootStatus("加载失败 · 请刷新页面");
      });
  }

  window.MATCH3_ASSETS = {
    ensureCinema: ensureCinema,
    ensureCodex: ensureCodex,
    ensureThree: ensureThree,
    preloadPortraits: preloadPortraits,
    prefetchCinema: function () {
      if (!deferredStarted) startDeferredIdle();
      else ensureCinema();
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
