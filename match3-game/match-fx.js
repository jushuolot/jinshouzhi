/**
 * 消除特效 · 文物色粒子 + 青铜冲击波 Gen.37
 */
(function () {
  "use strict";

  var RELIC_COLORS = ["#c9a227", "#e8c040", "#8b7355", "#b87848", "#f0e6d0", "#6ec6ff"];
  var RELIC_ICONS = ["🎭", "🪄", "📜", "🏺", "🦷", "🦅"];

  function cellCenter(boardEl, wrapRect, r, c) {
    var el = boardEl.querySelector('.cell[data-r="' + r + '"][data-c="' + c + '"]');
    if (!el) return null;
    var rect = el.getBoundingClientRect();
    return {
      x: rect.left - wrapRect.left + rect.width * 0.5,
      y: rect.top - wrapRect.top + rect.height * 0.5,
    };
  }

  function spawnParticle(layer, x, y, color, dist) {
    var p = document.createElement("span");
    p.className = "fx-particle";
    p.style.left = x + "px";
    p.style.top = y + "px";
    p.style.background = color;
    var ang = Math.random() * Math.PI * 2;
    var d = dist || 20 + Math.random() * 36;
    p.style.setProperty("--px", Math.cos(ang) * d + "px");
    p.style.setProperty("--py", Math.sin(ang) * d + "px");
    layer.appendChild(p);
    window.setTimeout(function () {
      p.remove();
    }, 580);
  }

  function spawnEmoji(layer, x, y, icon) {
    var p = document.createElement("span");
    p.className = "fx-particle relic-emoji";
    p.textContent = icon;
    p.style.left = x + "px";
    p.style.top = y + "px";
    var ang = Math.random() * Math.PI * 2;
    var d = 28 + Math.random() * 32;
    p.style.setProperty("--px", Math.cos(ang) * d + "px");
    p.style.setProperty("--py", Math.sin(ang) * d - 12 + "px");
    layer.appendChild(p);
    window.setTimeout(function () {
      p.remove();
    }, 680);
  }

  window.MatchFX = {
    burst: function (matched, boardEl, fxLayer, grid) {
      if (!fxLayer || !boardEl || !matched || !matched.size) return;
      var wrap = boardEl.parentElement && boardEl.parentElement.getBoundingClientRect();
      if (!wrap) return;

      var cx = 0;
      var cy = 0;
      var n = 0;
      var icons = (window.MATCH3_STORY && window.MATCH3_STORY.relicIcons) || RELIC_ICONS;
      var colors = RELIC_COLORS;

      matched.forEach(function (k) {
        var parts = k.split(",");
        var r = Number(parts[0]);
        var c = Number(parts[1]);
        var center = cellCenter(boardEl, wrap, r, c);
        if (!center) return;
        cx += center.x;
        cy += center.y;
        n += 1;
        var t = grid && grid[r] ? grid[r][c] : -1;
        var color = t >= 0 ? colors[t % colors.length] : "#ffd93d";
        var icon = t >= 0 ? icons[t % icons.length] : "✨";
        var count = matched.size >= 6 ? 3 : 2;
        for (var i = 0; i < count; i++) spawnParticle(fxLayer, center.x, center.y, color, 24 + Math.random() * 40);
        if (matched.size >= 4 && Math.random() < 0.45) spawnEmoji(fxLayer, center.x, center.y, icon);
      });

      if (n > 0) {
        var wave = document.createElement("span");
        wave.className = "fx-shockwave";
        wave.style.left = cx / n + "px";
        wave.style.top = cy / n + "px";
        fxLayer.appendChild(wave);
        window.setTimeout(function () {
          wave.remove();
        }, 520);
      }
    },

    specialBirth: function (r, c, kind, boardEl, fxLayer) {
      if (!boardEl || !fxLayer) return;
      var wrap = boardEl.parentElement && boardEl.parentElement.getBoundingClientRect();
      if (!wrap) return;
      var center = cellCenter(boardEl, wrap, r, c);
      if (!center) return;

      var flash = document.createElement("span");
      flash.className = "fx-special-flash";
      if (kind === 3) flash.classList.add("kind-bomb");
      else if (kind === 2) flash.classList.add("kind-col");
      else flash.classList.add("kind-row");
      flash.style.left = center.x + "px";
      flash.style.top = center.y + "px";
      fxLayer.appendChild(flash);
      window.setTimeout(function () {
        flash.remove();
      }, 560);

      var el = boardEl.querySelector('.cell[data-r="' + r + '"][data-c="' + c + '"]');
      if (el) {
        el.classList.add("special-born");
        window.setTimeout(function () {
          el.classList.remove("special-born");
        }, 460);
      }
    },
  };
})();
