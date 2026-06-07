/**
 * 蜀地 2D 地图 · Three 不可用时的立绘风 fallback
 */
(function () {
  "use strict";

  var instance = null;
  var POSITIONS = [
    { x: 18, y: 70 },
    { x: 34, y: 52 },
    { x: 50, y: 65 },
    { x: 66, y: 44 },
    { x: 82, y: 58 },
  ];

  function WorldMap2D(mount, onPick, opts) {
    if (!mount) {
      this.ok = false;
      return;
    }
    this.ok = true;
    this.mount = mount;
    this.onPick = onPick;
    opts = opts || {};

    var worlds = opts.worlds || [];
    var current = opts.currentChapter != null ? opts.currentChapter : 0;
    var isUnlocked = opts.chapterUnlocked || function () {
      return true;
    };

    mount.innerHTML =
      '<div class="world-map-canvas world-map-2d" role="application" aria-label="蜀地二维地图">' +
      '<span class="world-map-2d-badge">2D 立绘地图</span>' +
      '<div class="world-map-bg"></div>' +
      '<div class="world-map-river"></div>' +
      '<svg class="world-map-path-svg" viewBox="0 0 100 100" preserveAspectRatio="none">' +
      '<path d="M18 70 Q34 58 50 65 T82 58" /></svg>' +
      '<div class="world-map-nodes"></div>' +
      "</div>";

    var nodesEl = mount.querySelector(".world-map-nodes");
    worlds.forEach(function (w, i) {
      var pos = POSITIONS[i] || { x: 20 + i * 15, y: 60 };
      var unlocked = isUnlocked(i);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "world-chapter-node" + (i === current ? " current" : "") + (unlocked ? "" : " locked");
      btn.style.left = pos.x + "%";
      btn.style.top = pos.y + "%";
      btn.disabled = !unlocked;
      btn.innerHTML =
        '<span class="world-node-pin">' +
        (w.icon || "🏺") +
        '</span><span class="world-node-label">' +
        (w.name || "章节") +
        "</span>";
      btn.addEventListener("click", function () {
        if (unlocked && onPick) onPick(i);
      });
      nodesEl.appendChild(btn);
    });
  }

  WorldMap2D.prototype.setChapterHighlight = function (chIdx) {
    var nodes = this.mount.querySelectorAll(".world-chapter-node");
    nodes.forEach(function (n, i) {
      n.classList.toggle("current", i === chIdx);
    });
  };

  WorldMap2D.prototype.destroy = function () {
    if (this.mount) this.mount.innerHTML = "";
  };

  window.WorldMap2D = {
    create: function (mount, onPick, opts) {
      if (instance) instance.destroy();
      instance = new WorldMap2D(mount, onPick, opts);
      return instance;
    },
    get: function () {
      return instance;
    },
    destroy: function () {
      if (instance) {
        instance.destroy();
        instance = null;
      }
    },
  };
})();
