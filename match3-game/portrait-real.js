/**
 * 写实人像立绘 Gen.31 · PNG 主路径，Canvas 回退
 */
(function () {
  "use strict";

  var VER = 31;
  var BASE = "assets/portraits/";
  var cache = {};
  var loaded = {};
  var failed = {};

  var fallback = window.PortraitPainter;
  var META = (fallback && fallback.meta) || {};

  function layerImg(url, alt) {
    return (
      '<img src="' +
      url +
      '" alt="' +
      (alt || "") +
      '" draggable="false" loading="eager" class="pc-photo" decoding="async"/>'
    );
  }

  function photoArt(charId) {
    var m = META[charId] || META.narrator || {};
    var url = BASE + charId + ".png?v=" + VER;
    return {
      name: m.name || charId,
      role: m.role || "",
      accent: m.accent || "#c9a227",
      side: m.side || "right",
      charId: charId,
      composite: true,
      photo: true,
      layers: {
        back: "",
        body: "",
        face: layerImg(url, m.name),
        hair: "",
        acc: "",
        rim: "",
      },
    };
  }

  function getArt(charId) {
    charId = charId || "narrator";
    if (failed[charId] && fallback && fallback.getArt) {
      return fallback.getArt(charId);
    }
    var key = VER + ":" + charId;
    if (!cache[key]) cache[key] = photoArt(charId);
    return cache[key];
  }

  function preloadAll(onDone) {
    var ids = Object.keys(META);
    if (!ids.length) {
      if (onDone) onDone();
      return;
    }
    var pending = ids.length;
    function doneOne(id, ok) {
      loaded[id] = !!ok;
      if (!ok) failed[id] = true;
      pending -= 1;
      if (pending <= 0 && onDone) onDone();
    }
    ids.forEach(function (id) {
      var img = new Image();
      img.onload = function () {
        doneOne(id, true);
      };
      img.onerror = function () {
        doneOne(id, false);
      };
      img.src = BASE + id + ".png?v=" + VER;
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
    isPhotoReady: function (charId) {
      return !!loaded[charId] && !failed[charId];
    },
    fallback: fallback,
  };
})();
