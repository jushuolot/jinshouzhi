/**
 * 大片标题卡 · 镜头引入
 */
(function () {
  "use strict";

  window.BlockbusterIntro = {
    show: function (mount, title, subtitle, durationMs, onDone) {
      if (!mount) {
        if (onDone) onDone();
        return;
      }
      durationMs = durationMs || 2800;
      var el = document.createElement("div");
      el.className = "title-card-overlay";
      el.innerHTML =
        '<h2 class="title-card-main">' +
        (title || "古蜀秘档") +
        '</h2><p class="title-card-sub">' +
        (subtitle || "SANXINGDU · EXPEDITION") +
        "</p>";
      mount.appendChild(el);
      window.setTimeout(function () {
        el.classList.add("hide");
        window.setTimeout(function () {
          el.remove();
          if (onDone) onDone();
        }, 800);
      }, durationMs);
    },

    enableFilmGrain: function () {
      if (document.getElementById("blockbuster-grain")) return;
      var grain = document.createElement("div");
      grain.id = "blockbuster-grain";
      grain.className = "blockbuster-grain";
      document.body.appendChild(grain);
      var vig = document.createElement("div");
      vig.id = "blockbuster-vignette";
      vig.className = "blockbuster-vignette";
      document.body.appendChild(vig);
    },
  };
})();
