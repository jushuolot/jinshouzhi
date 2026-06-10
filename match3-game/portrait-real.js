/**
 * 写实人像立绘 Gen.42 · 统一 3:4 立绘画幅
 */
(function () {
  "use strict";

  var VER = 44;
  var BASE = "assets/portraits/";
  var EXT = ".jpg";
  var cache = {};
  var loaded = {};
  var failed = {};

  var fallback = window.PortraitPainter;
  var META = (fallback && fallback.meta) || {};

  function layerImg(url, alt, extraClass) {
    return (
      '<img src="' +
      url +
      '" alt="' +
      (alt || "") +
      '" draggable="false" loading="lazy" decoding="async" class="pc-photo' +
      (extraClass ? " " + extraClass : "") +
      '"/>'
    );
  }

  function photoUrl(charId) {
    return BASE + charId + EXT + "?v=" + VER;
  }

  function photoArt(charId) {
    var m = META[charId] || META.narrator || {};
    var url = photoUrl(charId);
    return {
      name: m.name || charId,
      role: m.role || "",
      accent: m.accent || "#c9a227",
      side: m.side || "right",
      charId: charId,
      composite: true,
      photo: true,
      depth: true,
      idol: true,
      glam: true,
      layers: {
        back: layerImg(url, "", "pc-photo-bg"),
        body: "",
        face: layerImg(url, m.name, "pc-photo-main"),
        hair: "",
        acc: "",
        rim: "",
      },
    };
  }

  function fallbackArt(charId) {
    if (window.PORTRAIT_ART) {
      return window.PORTRAIT_ART[charId] || window.PORTRAIT_ART.narrator || null;
    }
    if (fallback && fallback.getArt) return fallback.getArt(charId);
    return null;
  }

  function getArt(charId) {
    charId = charId || "narrator";
    var fallbackResult = fallbackArt(charId);
    if ((failed[charId] || !loaded[charId]) && fallbackResult) {
      return fallbackResult;
    }
    var key = VER + ":" + charId;
    if (!cache[key]) cache[key] = photoArt(charId);
    return cache[key];
  }

  function preloadAll(onDone, onProgress) {
    var ids = Object.keys(META);
    if (!ids.length) {
      if (onDone) onDone();
      return;
    }
    var pending = ids.length;
    var done = 0;
    function tick(id, ok) {
      loaded[id] = !!ok;
      if (!ok) failed[id] = true;
      done += 1;
      pending -= 1;
      if (onProgress) onProgress(done, ids.length, id);
      if (pending <= 0 && onDone) onDone();
    }
    ids.forEach(function (id) {
      var img = new Image();
      img.onload = function () {
        tick(id, true);
      };
      img.onerror = function () {
        tick(id, false);
      };
      img.src = photoUrl(id);
    });
  }

  window.PortraitPainter = {
    ok: true,
    version: VER,
    mode: "photo",
    meta: META,
    paint: getArt,
    getArt: getArt,
    preloadAll: preloadAll,
    photoUrl: photoUrl,
    isPhotoReady: function (charId) {
      return !!loaded[charId] && !failed[charId];
    },
    notePhotoFailure: function (charId) {
      charId = charId || "narrator";
      loaded[charId] = false;
      failed[charId] = true;
    },
    fallback: fallback,
  };
})();
