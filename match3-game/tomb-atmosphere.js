/**
 * 墓冢火把氛围 · 按章节调色 Gen.39
 */
(function () {
  "use strict";

  var TORCH = [
    "rgba(201, 162, 39, 0.16)",
    "rgba(180, 120, 80, 0.18)",
    "rgba(100, 160, 100, 0.14)",
    "rgba(232, 163, 23, 0.2)",
    "rgba(155, 89, 182, 0.15)",
  ];

  window.TombAtmosphere = {
    apply: function (levelIdx) {
      var play = document.getElementById("screen-play");
      if (!play) return;
      var ch = Math.floor(levelIdx / 20);
      var color = TORCH[ch] || TORCH[0];
      play.style.setProperty("--torch-color", color);
      play.classList.add("tomb-active");
      play.classList.toggle("torch-boss", (levelIdx + 1) % 20 === 0);
      var torch = document.getElementById("tomb-torch");
      if (torch) torch.setAttribute("aria-hidden", "false");
    },
    clear: function () {
      var play = document.getElementById("screen-play");
      if (play) {
        play.classList.remove("tomb-active", "torch-boss");
      }
    },
  };
})();
