/**
 * 乙女风 Canvas 立绘 · 高清合成绘制 Gen.29
 */
(function () {
  "use strict";

  var VER = 29;
  var cache = {};

  var META = {
    hutan: {
      accent: "#c9a227",
      skin: ["#f5dcc0", "#d4a574", "#9a6840"],
      hair: ["#2a2018", "#0a0806"],
      coat: ["#3d5038", "#1a2818"],
      eye: "#4a3820",
      hat: true,
      role: "摸金校尉",
      name: "胡探",
      side: "right",
      stubble: true,
    },
    wangdun: {
      accent: "#e07a4a",
      skin: ["#f0d0a0", "#daa070", "#a87848"],
      hair: ["#1a1410", "#050403"],
      coat: ["#5a3020", "#2a1810"],
      eye: "#2a1810",
      bulk: 1.14,
      role: "力士",
      name: "王墩",
      side: "left",
    },
    yangxue: {
      accent: "#6ec6ff",
      skin: ["#fff0e8", "#f0dcc8", "#c8a890"],
      hair: ["#0a0810", "#020104"],
      coat: ["#243858", "#101828"],
      eye: "#285868",
      fem: true,
      role: "考古学家",
      name: "杨雪",
      side: "right",
    },
    jinyaliu: {
      accent: "#ffd93d",
      skin: ["#f0c890", "#cea060", "#986040"],
      hair: ["#3a2818", "#1a1008"],
      coat: ["#4a3828", "#2a2010"],
      eye: "#3a2010",
      gold: true,
      role: "顾问",
      name: "金牙刘",
      side: "left",
    },
    chenli: {
      accent: "#a8d4b8",
      skin: ["#f5ead8", "#e0c8a0", "#b09870"],
      hair: ["#707070", "#404040"],
      coat: ["#383430", "#181614"],
      eye: "#3a5850",
      glasses: true,
      role: "权威",
      name: "陈礼",
      side: "right",
    },
    narrator: {
      accent: "#a89070",
      skin: ["#d4b898", "#a08060", "#786048"],
      hair: ["#404040", "#202020"],
      coat: ["#2a2420", "#0a0806"],
      eye: "#504838",
      role: "古蜀秘档",
      name: "旁白",
      side: "center",
    },
  };

  function mkCanvas(w, h) {
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  function rad(ctx, x, y, r, a, b) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, a);
    g.addColorStop(1, b);
    return g;
  }

  function lin(ctx, x0, y0, x1, y1, stops) {
    var g = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(function (s) {
      g.addColorStop(s[0], s[1]);
    });
    return g;
  }

  function drawEye(ctx, x, y, iris, sz, fem) {
    sz = sz || 1;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 4;
    ctx.fillStyle = "#faf6ee";
    ctx.beginPath();
    ctx.ellipse(x, y, 14 * sz, 10 * sz, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = rad(ctx, x, y, 10 * sz, iris, "#0a0806");
    ctx.beginPath();
    ctx.arc(x, y + 1, 8.5 * sz, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = fem ? "rgba(100,160,200,0.35)" : "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.arc(x - 2, y - 1, 5 * sz, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0a0a0a";
    ctx.beginPath();
    ctx.arc(x, y + 1, 3.5 * sz, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x + 3, y - 2, 2.2 * sz, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - 2, y + 2, 1 * sz, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(40,30,20,0.5)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x - 14 * sz, y - 8 * sz);
    ctx.quadraticCurveTo(x, y - 12 * sz, x + 14 * sz, y - 8 * sz);
    ctx.stroke();
    ctx.restore();
  }

  function drawHairMass(ctx, cx, cy, m, phase) {
    var bulk = m.bulk || 1;
    var h0 = m.hair[0];
    var h1 = m.hair[1];
    ctx.fillStyle = lin(ctx, cx - 60, cy - 80, cx + 60, cy + 40, [
      [0, h0],
      [1, h1],
    ]);

    if (phase === "back") {
      ctx.beginPath();
      ctx.ellipse(cx, cy - 15, 88 * bulk, 62 * bulk, 0, Math.PI, 0);
      ctx.fill();
      if (m.fem) {
        ctx.beginPath();
        ctx.moveTo(cx - 75, cy);
        ctx.bezierCurveTo(cx - 90, cy + 120, cx - 55, cy + 200, cx - 40, cy + 80);
        ctx.bezierCurveTo(cx - 50, cy + 40, cx - 60, cy + 10, cx - 75, cy);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 75, cy);
        ctx.bezierCurveTo(cx + 90, cy + 120, cx + 55, cy + 200, cx + 40, cy + 80);
        ctx.bezierCurveTo(cx + 50, cy + 40, cx + 60, cy + 10, cx + 75, cy);
        ctx.fill();
      }
      return;
    }

    ctx.beginPath();
    ctx.moveTo(cx - 70 * bulk, cy + 5);
    ctx.bezierCurveTo(cx - 35, cy + 45, cx - 8, cy + 25, cx + 5, cy + 15);
    ctx.bezierCurveTo(cx + 30, cy + 38, cx + 55 * bulk, cy + 12, cx + 68 * bulk, cy - 5);
    ctx.bezierCurveTo(cx + 45, cy - 18, cx - 45, cy - 18, cx - 70 * bulk, cy + 5);
    ctx.fill();

    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = h0;
    ctx.lineWidth = 2;
    for (var i = 0; i < 12; i++) {
      var sx = cx - 50 + i * 9;
      ctx.beginPath();
      ctx.moveTo(sx, cy - 5);
      ctx.bezierCurveTo(sx + 4, cy + 20, sx - 2, cy + 45, sx + 6, cy + 65);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function paintComposite(ctx, w, h, m) {
    var cx = w * 0.5;
    var bulk = m.bulk || 1;
    var fem = m.fem;
    var headY = h * 0.36;
    var chinY = headY + (fem ? 72 : 78) * bulk;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = rad(ctx, cx, headY, w * 0.55, m.accent + "40", "rgba(0,0,0,0)");
    ctx.fillRect(0, 0, w, h);

    drawHairMass(ctx, cx, headY - 25, m, "back");

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - 155 * bulk, h);
    ctx.bezierCurveTo(cx - 110 * bulk, h * 0.68, cx - 70 * bulk, h * 0.54, cx - 48 * bulk, h * 0.52);
    ctx.lineTo(cx + 48 * bulk, h * 0.52);
    ctx.bezierCurveTo(cx + 70 * bulk, h * 0.54, cx + 110 * bulk, h * 0.68, cx + 155 * bulk, h);
    ctx.closePath();
    ctx.fillStyle = lin(ctx, cx - 80, h * 0.45, cx + 80, h, [
      [0, m.coat[0]],
      [0.5, m.coat[1]],
      [1, "#080604"],
    ]);
    ctx.fill();

    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = lin(ctx, cx, h * 0.52, cx, h * 0.62, [[0, m.coat[0]], [1, m.coat[1]]]);
    ctx.beginPath();
    ctx.moveTo(cx - 35 * bulk, h * 0.54);
    ctx.lineTo(cx + 35 * bulk, h * 0.54);
    ctx.lineTo(cx + 20 * bulk, h * 0.62);
    ctx.lineTo(cx - 20 * bulk, h * 0.62);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = lin(ctx, cx, h * 0.55, cx, h * 0.68, [[0, m.skin[0]], [1, m.skin[1]]]);
    ctx.beginPath();
    ctx.ellipse(cx, h * 0.6, 32 * bulk, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = lin(ctx, cx - 30, headY, cx + 30, chinY, [[0, m.skin[0]], [0.55, m.skin[1]], [1, m.skin[2]]]);
    ctx.beginPath();
    ctx.ellipse(cx, headY, (fem ? 68 : 74) * bulk, (fem ? 82 : 86) * bulk, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "rgba(60,40,30,0.12)";
    ctx.beginPath();
    ctx.ellipse(cx + 25 * bulk, headY + 10, 50 * bulk, 70 * bulk, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    ctx.fillStyle = "rgba(240,160,140,0.22)";
    ctx.beginPath();
    ctx.ellipse(cx - 38 * bulk, headY + 22, 16, 11, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 38 * bulk, headY + 22, 16, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    [-1, 1].forEach(function (s) {
      ctx.fillStyle = lin(ctx, cx + s * 50, headY, cx + s * 70, headY + 30, [[0, m.skin[1]], [1, m.skin[2]]]);
      ctx.beginPath();
      ctx.ellipse(cx + s * 72 * bulk, headY + 8, 10, 14, s * 0.3, 0, Math.PI * 2);
      ctx.fill();
    });

    drawEye(ctx, cx - 36 * bulk, headY + 4, m.eye, 1, fem);
    drawEye(ctx, cx + 36 * bulk, headY + 4, m.eye, 1, fem);

    ctx.strokeStyle = m.hair[1];
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    [-1, 1].forEach(function (s) {
      ctx.beginPath();
      ctx.moveTo(cx + s * 12, headY - 18);
      ctx.quadraticCurveTo(cx + s * 28, headY - 28, cx + s * 38, headY - 14);
      ctx.stroke();
    });

    ctx.fillStyle = "rgba(80,50,40,0.15)";
    ctx.beginPath();
    ctx.ellipse(cx, headY + 18, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#a06058";
    ctx.beginPath();
    ctx.moveTo(cx - 12, headY + 38);
    ctx.quadraticCurveTo(cx, headY + 48, cx + 12, headY + 38);
    ctx.quadraticCurveTo(cx, headY + 44, cx - 12, headY + 38);
    ctx.fill();
    ctx.fillStyle = "#c87870";
    ctx.beginPath();
    ctx.moveTo(cx - 10, headY + 40);
    ctx.quadraticCurveTo(cx, headY + 46, cx + 10, headY + 40);
    ctx.fill();

    if (m.gold) {
      ctx.fillStyle = lin(ctx, cx + 6, headY + 38, cx + 18, headY + 46, [[0, "#ffe880"], [1, "#c89820"]]);
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(cx + 8, headY + 40, 9, 6, 2) : ctx.fillRect(cx + 8, headY + 40, 9, 6);
      ctx.fill();
    }

    if (m.stubble) {
      ctx.fillStyle = "rgba(50,35,20,0.3)";
      for (var si = 0; si < 14; si++) {
        ctx.beginPath();
        ctx.arc(cx - 28 + si * 4.5, headY + 46 + (si % 2), 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawHairMass(ctx, cx, headY - 25, m, "front");

    if (m.hat) {
      ctx.fillStyle = "#1a1208";
      ctx.beginPath();
      ctx.ellipse(cx, h * 0.1, 130, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = lin(ctx, cx - 50, h * 0.02, cx + 50, h * 0.18, [[0, "#3a2818"], [1, "#1a1008"]]);
      ctx.beginPath();
      ctx.moveTo(cx - 58, h * 0.1);
      ctx.bezierCurveTo(cx - 30, h * 0.02, cx + 30, h * 0.02, cx + 58, h * 0.1);
      ctx.bezierCurveTo(cx + 45, h * 0.2, cx - 45, h * 0.2, cx - 58, h * 0.1);
      ctx.fill();
      ctx.strokeStyle = "rgba(201,162,39,0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - 90, h * 0.11);
      ctx.lineTo(cx + 90, h * 0.11);
      ctx.stroke();
    }

    if (m.glasses) {
      ctx.strokeStyle = "rgba(180,195,210,0.95)";
      ctx.lineWidth = 2.5;
      ctx.fillStyle = "rgba(200,220,240,0.08)";
      [-1, 1].forEach(function (s) {
        var gx = cx + s * 36 * bulk;
        ctx.beginPath();
        ctx.ellipse(gx, headY + 4, 22, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.beginPath();
        ctx.ellipse(gx - 6, headY, 6, 4, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(200,220,240,0.08)";
      });
      ctx.beginPath();
      ctx.moveTo(cx - 14 * bulk, headY + 4);
      ctx.lineTo(cx + 14 * bulk, headY + 4);
      ctx.stroke();
    }

    ctx.fillStyle = lin(ctx, w * 0.7, 0, w, h, [[0, "rgba(0,0,0,0)"], [1, m.accent + "18"]]);
    ctx.fillRect(0, 0, w, h);
  }

  function paintGlow(ctx, w, h, accent) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = rad(ctx, w * 0.5, h * 0.35, w * 0.6, accent + "35", "rgba(0,0,0,0)");
    ctx.fillRect(0, 0, w, h);
  }

  function paintRim(ctx, w, h, accent) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = lin(ctx, 0, h * 0.4, w, h * 0.4, [[0, "rgba(0,0,0,0)"], [0.8, accent + "28"], [1, "rgba(255,240,220,0.15)"]]);
    ctx.fillRect(0, 0, w, h);
  }

  function layerImg(url, alt) {
    return '<img src="' + url + '" alt="' + (alt || "") + '" draggable="false" loading="eager"/>';
  }

  function paintCharacter(charId) {
    var key = VER + ":" + charId;
    if (cache[key]) return cache[key];
    var m = META[charId] || META.narrator;
    var W = 560;
    var H = 780;

    var cMain = mkCanvas(W, H);
    paintComposite(cMain.getContext("2d"), W, H, m);
    var cGlow = mkCanvas(W, H);
    paintGlow(cGlow.getContext("2d"), W, H, m.accent);
    var cRim = mkCanvas(W, H);
    paintRim(cRim.getContext("2d"), W, H, m.accent);

    var art = {
      name: m.name,
      role: m.role,
      accent: m.accent,
      side: m.side,
      composite: true,
      layers: {
        back: layerImg(cGlow.toDataURL("image/png"), ""),
        body: "",
        face: layerImg(cMain.toDataURL("image/png"), m.name),
        hair: "",
        acc: "",
        rim: layerImg(cRim.toDataURL("image/png"), ""),
      },
    };
    cache[key] = art;
    return art;
  }

  window.PortraitPainter = {
    ok: true,
    version: VER,
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
