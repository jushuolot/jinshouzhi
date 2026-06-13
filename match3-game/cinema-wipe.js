/**
 * 电影过场 · 章节切换 wipe
 */
(function () {
  "use strict";

  window.CinemaWipe = {
    play: function (label, subtitle, onMid, onDone) {
      var el = document.createElement("div");
      el.className = "cinema-wipe";
      el.innerHTML =
        '<div class="cw-panel cw-panel-a"></div>' +
        '<div class="cw-panel cw-panel-b"></div>' +
        '<div class="cw-text">' +
        (label ? '<p class="cw-label">' + label + "</p>" : "") +
        (subtitle ? '<p class="cw-sub">' + subtitle + "</p>" : "") +
        "</div>";
      document.body.appendChild(el);
      window.requestAnimationFrame(function () {
        el.classList.add("cw-in");
      });
      window.setTimeout(function () {
        if (onMid) onMid();
        el.classList.add("cw-out");
        window.setTimeout(function () {
          el.remove();
          if (onDone) onDone();
        }, 550);
      }, 900);
    },

    quick: function (onDone) {
      this.play("", "", onDone, null);
    },
  };
})();
