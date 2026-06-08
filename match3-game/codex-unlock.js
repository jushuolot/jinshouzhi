/**
 * 文物首收录 · 电影感通知 Gen.35
 */
(function () {
  "use strict";

  var queue = [];
  var showing = false;

  function render(entry) {
    return (
      '<div class="codex-unlock-card">' +
      '<div class="codex-unlock-shine" aria-hidden="true"></div>' +
      '<p class="codex-unlock-tag">图鉴首收录</p>' +
      '<div class="codex-unlock-head">' +
      '<span class="codex-unlock-icon">' +
      (entry.icon || "🏺") +
      "</span>" +
      "<div>" +
      '<p class="codex-unlock-name">' +
      (entry.name || "未知文物") +
      "</p>" +
      (entry.era
        ? '<p class="codex-unlock-meta">' + entry.era + " · " + (entry.rarity || "") + "</p>"
        : "") +
      "</div></div>" +
      (entry.lore ? '<p class="codex-unlock-lore">' + entry.lore + "</p>" : "") +
      "</div>"
    );
  }

  function showNext() {
    if (!queue.length) {
      showing = false;
      return;
    }
    showing = true;
    var entry = queue.shift();
    var layer = document.createElement("div");
    layer.className = "codex-unlock-layer";
    layer.setAttribute("role", "status");
    layer.innerHTML = render(entry);
    document.body.appendChild(layer);
    window.requestAnimationFrame(function () {
      layer.classList.add("cu-in");
    });
    window.setTimeout(function () {
      layer.classList.add("cu-out");
      window.setTimeout(function () {
        layer.remove();
        showNext();
      }, 420);
    }, 3400);
  }

  window.CodexUnlock = {
    show: function (entry) {
      if (!entry) return;
      queue.push(entry);
      if (!showing) showNext();
    },
  };
})();
