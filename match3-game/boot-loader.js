/**
 * 启动加载 · Three 备用 CDN · 启动屏 · 系统 toast
 */
(function () {
  "use strict";

  var progress = 0;
  var barFill = null;
  var statusEl = null;
  var tickId = null;

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  function setProgress(p) {
    progress = Math.min(100, p);
    if (barFill) barFill.style.width = progress + "%";
  }

  function startProgress() {
    barFill = document.getElementById("boot-bar-fill");
    statusEl = document.getElementById("boot-status");
    tickId = window.setInterval(function () {
      setProgress(progress + (progress < 70 ? 6 : progress < 90 ? 2 : 0.5));
    }, 160);
  }

  function loadScript(src, onLoad, onError) {
    var s = document.createElement("script");
    s.src = src;
    s.async = false;
    s.onload = function () {
      if (onLoad) onLoad();
    };
    s.onerror = function () {
      if (onError) onError();
    };
    document.body.appendChild(s);
  }

  function ensureThree(done) {
    if (typeof THREE !== "undefined") {
      done(true);
      return;
    }
    setStatus("3D 引擎备用线路加载中…");
    loadScript(
      "https://unpkg.com/three@0.160.0/build/three.min.js",
      function () {
        done(typeof THREE !== "undefined");
      },
      function () {
        loadScript(
          "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
          function () {
            done(typeof THREE !== "undefined");
          },
          function () {
            done(false);
          }
        );
      }
    );
  }

  window.dismissBootSplash = function (msg) {
    if (tickId) window.clearInterval(tickId);
    setProgress(100);
    if (msg) setStatus(msg);
    var splash = document.getElementById("boot-splash");
    window.setTimeout(function () {
      if (splash) splash.classList.add("boot-done");
      window.setTimeout(function () {
        if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
      }, 600);
    }, 350);
  };

  window.showSystemToast = function (text, ms) {
    ms = ms || 3200;
    var old = document.querySelector(".system-toast");
    if (old) old.remove();
    var t = document.createElement("div");
    t.className = "system-toast";
    t.textContent = text;
    document.body.appendChild(t);
    window.setTimeout(function () {
      t.style.opacity = "0";
      t.style.transition = "opacity 0.4s";
      window.setTimeout(function () {
        t.remove();
      }, 450);
    }, ms);
  };

  window.setMountLoading = function (mount, text) {
    if (!mount) return;
    mount.innerHTML =
      '<div class="mount-loading" role="status">' +
      '<div class="mount-spinner" aria-hidden="true"></div>' +
      "<p>" +
      (text || "加载中…") +
      "</p></div>";
  };

  window.threeReady = typeof THREE !== "undefined";

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startProgress);
  } else {
    startProgress();
  }

  if (typeof THREE === "undefined") {
    window.__threePending = true;
    ensureThree(function (ok) {
      window.threeReady = ok;
      window.__threePending = false;
      if (!ok) {
        setStatus("3D 未就绪 · 将使用 2D 立绘地图");
      } else {
        setStatus("3D 引擎就绪");
      }
      if (window.ThreeEngine && typeof window.ThreeEngine.ok === "boolean") {
        /* three-engine already ran without THREE — re-init if needed */
      }
    });
  }
})();
