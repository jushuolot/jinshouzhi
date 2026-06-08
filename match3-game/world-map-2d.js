/**
 * 蜀地堪舆图 · 古风二维总览（默认主视图）
 */
(function () {
  "use strict";

  var instance = null;
  var POSITIONS = [
    { x: 16, y: 68 },
    { x: 32, y: 48 },
    { x: 50, y: 62 },
    { x: 68, y: 42 },
    { x: 84, y: 56 },
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
    var tiers = (window.MATCH3_EXPEDITION && window.MATCH3_EXPEDITION.tombTiers) || [];

    mount.innerHTML =
      '<div class="ancient-map-ui world-map-canvas ancient-scroll" role="application" aria-label="蜀地堪舆总览图">' +
      '<p class="ancient-scroll-title">蜀 · 地 · 堪 · 舆 · 图</p>' +
      '<div class="world-map-bg"></div>' +
      '<div class="world-map-river"></div>' +
      '<svg class="world-map-path-svg" viewBox="0 0 100 100" preserveAspectRatio="none">' +
      '<path d="M16 68 Q32 52 50 62 T84 56" /></svg>' +
      '<div class="world-map-nodes"></div>' +
      "</div>";

    var nodesEl = mount.querySelector(".world-map-nodes");
    worlds.forEach(function (w, i) {
      var pos = POSITIONS[i] || { x: 20 + i * 15, y: 60 };
      var unlocked = isUnlocked(i);
      var tier = tiers[i] || {};
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "world-chapter-node" + (i === current ? " current" : "") + (unlocked ? "" : " locked");
      btn.style.left = pos.x + "%";
      btn.style.top = pos.y + "%";
      btn.disabled = !unlocked;
      btn.setAttribute("aria-label", (w.name || "章节") + (unlocked ? "，点击进入" : "，尚未解锁"));
      btn.innerHTML =
        '<span class="world-node-pin">' +
        (w.icon || "🏺") +
        '</span><span class="world-node-label">' +
        (w.name || "章节") +
        '</span><span class="world-node-tier">' +
        (tier.name || "") +
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
