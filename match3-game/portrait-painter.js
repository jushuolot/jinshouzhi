/**
 * 手绘风 Canvas 立绘 · 运行时绘制 PNG 分层
 */
(function () {
  "use strict";

  var META = {
    hutan: { accent: "#c9a227", skin: ["#f0d4b0", "#c89860"], hair: "#1a1510", coat: "#2a3820", hat: true, role: "摸金校尉", name: "胡探", side: "right" },
    wangdun: { accent: "#e07a4a", skin: ["#e8c898", "#c89058"], hair: "#151010", coat: "#4a2818", bulk: 1.12, role: "力士", name: "王墩", side: "left" },
    yangxue: { accent: "#6ec6ff", skin: ["#fce8dc", "#e8c0a8"], hair: "#0a0810", coat: "#1a2840", fem: true, role: "考古学家", name: "杨雪", side: "right" },
    jinyaliu: { accent: "#ffd93d", skin: ["#e8c088", "#c08048"], hair: "#2a1810", coat: "#3a3018", gold: true, role: "顾问", name: "金牙刘", side: "left" },
    chenli: { accent: "#a8d4b8", skin: ["#ece0c8", "#c8a878"], hair: "#606060", coat: "#282420", glasses: true, role: "权威", name: "陈礼", side: "right" },
    narrator: { accent: "#888888", skin: ["#b89878", "#887058"], hair: "#333333", coat: "#1a1815", shadow: true, role: "古蜀秘档", name: "旁白", side: "center" },
  };

  var cache = {};

  function mkCanvas(w, h) {
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  function radial(ctx, x, y, r, c0, c1) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, c0);
    g.addColorStop(1, c1);
    return g;
  }

  function linear(ctx, x0, y0, x1, y1, stops) {
    var g = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(function (s) {
      g.addColorStop(s[0], s[1]);
    });
    return g;
  }

  function paintGlow(ctx, w, h, accent) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = radial(ctx, w * 0.55, h * 0.32, w * 0.55, accent + "55", "rgba(3,2,1,0)");
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = radial(ctx, w * 0.5, h * 0.85, w * 0.45, "rgba(80,50,20,0.25)", "rgba(0,0,0,0)");
    ctx.fillRect(0, 0, w, h);
  }

  function paintBody(ctx, w, h, m) {
    ctx.clearRect(0, 0, w, h);
    var cx = w * 0.5;
    var bulk = m.bulk || 1;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - 140 * bulk, h);
    ctx.quadraticCurveTo(cx - 90 * bulk, h * 0.72, cx - 55 * bulk, h * 0.58);
    ctx.lineTo(cx + 55 * bulk, h * 0.58);
    ctx.quadraticCurveTo(cx + 90 * bulk, h * 0.72, cx + 140 * bulk, h);
    ctx.closePath();
    ctx.fillStyle = linear(ctx, cx - 100, h * 0.5, cx + 100, h, [[0, m.coat], [1, "#0a0806"]]);
    ctx.fill();

    ctx.fillStyle = linear(ctx, cx, h * 0.55, cx, h * 0.72, [[0, m.skin[0]], [1, m.skin[1]]]);
    ctx.beginPath();
    ctx.ellipse(cx, h * 0.62, 38 * bulk, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function paintFace(ctx, w, h, m) {
    ctx.clearRect(0, 0, w, h);
    if (m.shadow) {
      ctx.fillStyle = radial(ctx, w * 0.5, h * 0.42, w * 0.22, "rgba(80,80,80,0.35)", "rgba(0,0,0,0)");
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#444";
      ctx.beginPath();
      ctx.ellipse(w * 0.42, h * 0.38, 12, 8, 0, 0, Math.PI * 2);
      ctx.ellipse(w * 0.58, h * 0.38, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    var cx = w * 0.5;
    var cy = h * 0.38;
    var bulk = m.bulk || 1;
    var fem = m.fem;

    ctx.fillStyle = radial(ctx, cx, cy, 95 * bulk, m.skin[0], m.skin[1]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, (fem ? 72 : 78) * bulk, 88 * bulk, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(232,160,144,0.28)";
    ctx.beginPath();
    ctx.ellipse(cx - 42 * bulk, cy + 18, 18, 12, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 42 * bulk, cy + 18, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    [-1, 1].forEach(function (side) {
      var ex = cx + side * 38 * bulk;
      var ey = cy + 2;
      ctx.fillStyle = "#f5efe6";
      ctx.beginPath();
      ctx.ellipse(ex, ey, 16, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = fem ? "#385868" : "#3a2818";
      ctx.beginPath();
      ctx.arc(ex, ey + 1, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#080808";
      ctx.beginPath();
      ctx.arc(ex, ey + 1, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ex + 3, ey - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.strokeStyle = m.hair;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 32 * bulk, cy - 28);
    ctx.quadraticCurveTo(cx, cy - 42, cx + 32 * bulk, cy - 28);
    ctx.stroke();

    ctx.strokeStyle = "#8a5048";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy + 38);
    ctx.quadraticCurveTo(cx, cy + 48, cx + 14, cy + 38);
    ctx.stroke();

    if (m.gold) {
      ctx.fillStyle = "#ffd93d";
      ctx.fillRect(cx + 8, cy + 36, 10, 7);
    }

    if (m.stubble !== false && !fem && !m.glasses) {
      ctx.fillStyle = "rgba(80,50,30,0.35)";
      for (var i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.arc(cx - 20 + i * 6, cy + 42, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function paintHair(ctx, w, h, m) {
    ctx.clearRect(0, 0, w, h);
    var cx = w * 0.5;
    var cy = h * 0.32;
    var bulk = m.bulk || 1;

    ctx.fillStyle = m.hair;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 10, 82 * bulk, 58 * bulk, 0, Math.PI, 0);
    ctx.fill();

    if (m.fem) {
      ctx.beginPath();
      ctx.moveTo(cx - 70, cy);
      ctx.quadraticCurveTo(cx - 85, h * 0.55, cx - 60, h * 0.72);
      ctx.quadraticCurveTo(cx - 45, h * 0.5, cx - 35, cy + 10);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 70, cy);
      ctx.quadraticCurveTo(cx + 85, h * 0.55, cx + 60, h * 0.72);
      ctx.quadraticCurveTo(cx + 45, h * 0.5, cx + 35, cy + 10);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.moveTo(cx - 55 * bulk, cy + 5);
    ctx.quadraticCurveTo(cx - 20, cy + 35, cx + 5, cy + 18);
    ctx.quadraticCurveTo(cx + 25, cy + 32, cx + 55 * bulk, cy + 8);
    ctx.lineTo(cx + 50, cy - 5);
    ctx.quadraticCurveTo(cx, cy + 8, cx - 50, cy - 5);
    ctx.closePath();
    ctx.fill();
  }

  function paintAcc(ctx, w, h, m) {
    ctx.clearRect(0, 0, w, h);
    var cx = w * 0.5;
    var cy = h * 0.38;

    if (m.hat) {
      ctx.fillStyle = "#1a1208";
      ctx.beginPath();
      ctx.ellipse(cx, h * 0.14, 120, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2a2010";
      ctx.beginPath();
      ctx.moveTo(cx - 55, h * 0.14);
      ctx.quadraticCurveTo(cx, h * 0.02, cx + 55, h * 0.14);
      ctx.lineTo(cx + 48, h * 0.22);
      ctx.quadraticCurveTo(cx, h * 0.12, cx - 48, h * 0.22);
      ctx.closePath();
      ctx.fill();
    }

    if (m.glasses) {
      ctx.strokeStyle = "rgba(160,180,200,0.9)";
      ctx.lineWidth = 3;
      ctx.strokeRect(cx - 58, cy - 8, 48, 36);
      ctx.strokeRect(cx + 10, cy - 8, 48, 36);
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy + 8);
      ctx.lineTo(cx + 10, cy + 8);
      ctx.stroke();
    }
  }

  function paintRim(ctx, w, h, accent) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = linear(ctx, 0, h * 0.5, w, h * 0.5, [[0, "rgba(0,0,0,0)"], [0.75, accent + "22"], [1, "rgba(255,255,255,0.12)"]]);
    ctx.fillRect(0, 0, w, h);
  }

  function layerImg(dataUrl, alt) {
    return '<img src="' + dataUrl + '" alt="' + (alt || "") + '" draggable="false" loading="eager"/>';
  }

  function paintCharacter(charId) {
    if (cache[charId]) return cache[charId];
    var m = META[charId] || META.narrator;
    var W = 420;
    var H = 580;

    var cGlow = mkCanvas(W, H);
    paintGlow(cGlow.getContext("2d"), W, H, m.accent);
    var cBody = mkCanvas(W, H);
    paintBody(cBody.getContext("2d"), W, H, m);
    var cFace = mkCanvas(W, H);
    paintFace(cFace.getContext("2d"), W, H, m);
    var cHair = mkCanvas(W, H);
    paintHair(cHair.getContext("2d"), W, H, m);
    var cAcc = mkCanvas(W, H);
    paintAcc(cAcc.getContext("2d"), W, H, m);
    var cRim = mkCanvas(W, H);
    paintRim(cRim.getContext("2d"), W, H, m.accent);

    var art = {
      name: m.name,
      role: m.role,
      accent: m.accent,
      side: m.side,
      layers: {
        back: layerImg(cGlow.toDataURL("image/png"), m.name + " 光晕"),
        body: layerImg(cBody.toDataURL("image/png"), m.name + " 身体"),
        face: layerImg(cFace.toDataURL("image/png"), m.name + " 面部"),
        hair: layerImg(cHair.toDataURL("image/png"), m.name + " 头发"),
        acc: layerImg(cAcc.toDataURL("image/png"), m.name + " 配饰"),
        rim: layerImg(cRim.toDataURL("image/png"), ""),
      },
    };
    cache[charId] = art;
    return art;
  }

  window.PortraitPainter = {
    ok: true,
    meta: META,
    paint: paintCharacter,
    preloadAll: function (onDone) {
      var ids = Object.keys(META);
      var i = 0;
      function next() {
        if (i >= ids.length) {
          if (onDone) onDone();
          return;
        }
        paintCharacter(ids[i]);
        i += 1;
        window.requestAnimationFrame(next);
      }
      next();
    },
    getArt: function (charId) {
      return paintCharacter(charId);
    },
  };
})();
