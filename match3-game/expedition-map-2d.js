/**
 * 探方路线 · 古风卷轴堪舆图（清晰探点）
 */
(function () {
  "use strict";

  var instance = null;

  function nodeUnlocked(nodes, state, ni) {
    if (ni === 0) return true;
    var prev = nodes[ni - 1];
    return prev && state.beatenLevels[String(prev.level)] === true;
  }

  function ExpeditionMap2D(mount, chapterIdx, state, onNodePick) {
    if (!mount) {
      this.ok = false;
      return;
    }
    this.ok = true;
    this.mount = mount;
    this.chapterIdx = chapterIdx;
    this.state = state;
    this.onNodePick = onNodePick;

    var exp = window.MATCH3_EXPEDITION;
    this.nodes = exp && exp.chapters[chapterIdx] ? exp.chapters[chapterIdx].nodes : [];

    mount.innerHTML =
      '<div class="ancient-map-ui expedition-scroll-map" role="application" aria-label="探方路线堪舆图">' +
      '<div class="ancient-map-legend">' +
      '<span><i class="leg-dot leg-open"></i>◎ 可探</span>' +
      '<span><i class="leg-dot leg-done"></i>✓ 已过</span>' +
      '<span><i class="leg-dot leg-lock"></i>🔒 未开</span>' +
      '<span><i class="leg-dot leg-tomb"></i>⚱ 大墓</span>' +
      "</div>" +
      '<div class="expedition-scroll-body">' +
      '<div class="route-scroll" style="max-height:none">' +
      '<div class="route-path"></div>' +
      "</div></div></div>";

    var pathEl = mount.querySelector(".route-path");
    var self = this;
    var nextOpen = -1;

    this.nodes.forEach(function (node, ni) {
      var unlocked = nodeUnlocked(self.nodes, state, ni);
      var beaten = state.beatenLevels[String(node.level)] === true;
      if (unlocked && !beaten && nextOpen < 0) nextOpen = ni;

      var wrap = document.createElement("div");
      wrap.className = "route-node-wrap";

      var card = document.createElement("button");
      card.type = "button";
      var cls = "route-node-card";
      if (node.isTomb) cls += " boss";
      if (!unlocked) cls += " locked";
      if (beaten) cls += " done";
      if (ni === nextOpen) cls += " current";
      card.className = cls;
      card.disabled = !unlocked;
      card.title =
        node.name +
        " · 第 " +
        (node.level + 1) +
        " 层" +
        (node.isTomb ? " · 终极大墓" : "") +
        (beaten ? " · 已通过" : unlocked ? " · 点击发现线索" : " · 需先通过上一探点");

      var pinIcon = node.isTomb ? "⚱" : beaten ? "✓" : unlocked ? "◎" : "🔒";
      card.innerHTML =
        '<span class="route-node-pin" aria-hidden="true">' +
        pinIcon +
        "</span>" +
        '<div class="route-node-num">探点 ' +
        (ni + 1) +
        (node.isTomb ? " · 终局" : "") +
        "</div>" +
        '<div class="route-node-name">' +
        node.name +
        "</div>" +
        '<div class="route-node-level">第 ' +
        (node.level + 1) +
        " 层</div>";

      if (unlocked) {
        card.addEventListener("click", function () {
          if (onNodePick) onNodePick(node, ni);
        });
      }

      wrap.appendChild(card);
      pathEl.appendChild(wrap);
    });
  }

  ExpeditionMap2D.prototype.destroy = function () {
    if (this.mount) this.mount.innerHTML = "";
  };

  window.ExpeditionMap2D = {
    create: function (mount, chapterIdx, state, onNodePick) {
      if (instance) instance.destroy();
      instance = new ExpeditionMap2D(mount, chapterIdx, state, onNodePick);
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
