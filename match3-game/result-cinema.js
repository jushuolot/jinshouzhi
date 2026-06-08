/**
 * 过关结算影院 Gen.47
 */
(function () {
  "use strict";

  function getRelicForLevel(levelIdx) {
    var icons = (window.MATCH3_STORY && window.MATCH3_STORY.relicIcons) || ["🎭", "🪄", "📜", "🏺", "🦷", "🦅"];
    var names = (window.MATCH3_STORY && window.MATCH3_STORY.relics) || [];
    var i = levelIdx % icons.length;
    return { icon: icons[i] || "🏺", name: names[i] || "文物" };
  }

  window.ResultCinema = {
    decorate: function (modal, opts) {
      if (!modal) return;
      opts = opts || {};
      modal.classList.add("result-cinema");
      modal.classList.remove("result-win", "result-lose", "result-boss", "result-triple", "result-visible");
      modal.classList.add(opts.isWin ? "result-win" : "result-lose");
      if (opts.isBoss) modal.classList.add("result-boss");
      if (opts.isWin && opts.stars >= 3) modal.classList.add("result-triple");

      var tagEl = modal.querySelector("#modal-result-tag");
      var relicEl = modal.querySelector("#modal-result-relic");
      var titleEl = modal.querySelector("#modal-title");
      if (titleEl) {
        titleEl.textContent = opts.isWin
          ? opts.isBoss
            ? "守关突破"
            : "探方成功"
          : "层位未达";
      }
      if (tagEl && relicEl && opts.isWin) {
        var relic = getRelicForLevel(opts.levelIdx || 0);
        tagEl.textContent = opts.isBoss ? "BOSS 层清除 · " + relic.name : "层位记录 · " + relic.name;
        relicEl.textContent = relic.icon;
      }
    },

    animateStars: function (container, count, fallback) {
      if (!container) {
        if (fallback) fallback(count);
        return;
      }
      container.querySelectorAll(".star").forEach(function (el) {
        el.classList.remove("on");
      });
      for (var n = 1; n <= count; n++) {
        (function (starNum) {
          window.setTimeout(function () {
            var el = container.querySelector('.star[data-star="' + starNum + '"]');
            if (el) el.classList.add("on");
          }, starNum * 120);
        })(n);
      }
    },

    reveal: function (modal) {
      if (!modal) return;
      window.requestAnimationFrame(function () {
        modal.classList.add("result-visible");
      });
    },

    chapterClear: function (levelIdx, onDone) {
      if ((levelIdx + 1) % 20 !== 0) {
        if (onDone) onDone();
        return;
      }
      var chIdx = Math.floor(levelIdx / 20);
      var ch =
        window.MATCH3_STORY && window.MATCH3_STORY.chapters
          ? window.MATCH3_STORY.chapters[chIdx]
          : null;
      if (window.CinemaWipe) {
        window.CinemaWipe.play(
          ch ? ch.name + " · 章节突破" : "章节突破",
          "封印解除 · 深入下一探方",
          onDone
        );
      } else if (onDone) {
        onDone();
      }
    },

    bronzePulse: function () {
      document.body.classList.add("bronze-pulse");
      window.setTimeout(function () {
        document.body.classList.remove("bronze-pulse");
      }, 480);
    },
  };
})();
