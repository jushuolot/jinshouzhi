/**
 * 乙女风 Canvas 立绘 · 妖艳摸金 Gen.41
 */
(function () {
  "use strict";

  var VER = 41;
  var cache = {};

  var META = {
    hutan: {
      accent: "#e8c060",
      skin: ["#f8e8d8", "#e0c098", "#b88858"],
      hair: ["#1a1410", "#050403"],
      coat: ["#2a3028", "#0a1008"],
      eye: "#3a2818",
      hat: true,
      role: "摸金校尉",
      name: "胡探",
      side: "right",
      stubble: true,
    },
    wangdun: {
      accent: "#e89060",
      skin: ["#f5dcc0", "#daa070", "#b07848"],
      hair: ["#141010", "#030201"],
      coat: ["#4a2818", "#1a0c08"],
      eye: "#2a1810",
      bulk: 1.04,
      role: "力士",
      name: "王墩",
      side: "left",
    },
    yangxue: {
      accent: "#5ec8e0",
      skin: ["#fff8f0", "#f8e0d0", "#e0b8a0"],
      hair: ["#141018", "#060608"],
      coat: ["#1a3048", "#0a1828"],
      eye: "#286878",
      fem: true,
      role: "考古学家",
      name: "杨雪",
      side: "right",
    },
    jinyaliu: {
      accent: "#ffd040",
      skin: ["#f5d8a8", "#d89860", "#a86838"],
      hair: ["#2a1810", "#100804"],
      coat: ["#3a2818", "#1a1008"],
      eye: "#381808",
      gold: true,
      role: "顾问",
      name: "金牙刘",
      side: "left",
    },
    chenli: {
      accent: "#88d8a8",
      skin: ["#faf0e0", "#e8d0a8", "#c0a078"],
      hair: ["#606060", "#303030"],
      coat: ["#283028", "#101410"],
      eye: "#285848",
      glasses: true,
      role: "权威",
      name: "陈礼",
      side: "right",
    },
    narrator: {
      accent: "#c8a878",
      skin: ["#e8c8a8", "#b89878", "#886848"],
      hair: ["#383838", "#181818"],
      coat: ["#2a2018", "#080604"],
      eye: "#484030",
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

  function drawEye(ctx, x, y, irisHex, sz) {
    sz = sz || 1;
    var iris = irisHex || "#4a3820";
    ctx.save();

    ctx.fillStyle = "#faf8f2";
    ctx.beginPath();
    ctx.ellipse(x, y, 15 * sz, 10 * sz, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(60,45,35,0.35)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(x, y, 15 * sz, 10 * sz, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = rad(ctx, x, y - 1, 7 * sz, iris, "#1a1008");
    ctx.beginPath();
    ctx.arc(x, y + 0.5, 6.5 * sz, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#141010";
    ctx.beginPath();
    ctx.arc(x, y + 1, 2.8 * sz, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x + 2.5 * sz, y - 1.5 * sz, 2 * sz, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - 2 * sz, y + 1.5 * sz, 0.9 * sz, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(50,35,25,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 15 * sz, y - 6 * sz);
    ctx.quadraticCurveTo(x, y - 11 * sz, x + 15 * sz, y - 6 * sz);
    ctx.stroke();

    ctx.strokeStyle = "rgba(180,140,120,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 12 * sz, y + 7 * sz);
    ctx.quadraticCurveTo(x, y + 9 * sz, x + 12 * sz, y + 7 * sz);
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
      ctx.ellipse(cx, cy - 18, 90 * bulk, 64 * bulk, 0, Math.PI, 0);
      ctx.fill();
      if (m.fem) {
        ctx.beginPath();
        ctx.moveTo(cx - 78, cy - 5);
        ctx.bezierCurveTo(cx - 95, cy + 90, cx - 70, cy + 210, cx - 48, cy + 95);
        ctx.bezierCurveTo(cx - 58, cy + 50, cx - 68, cy + 15, cx - 78, cy - 5);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 78, cy - 5);
        ctx.bezierCurveTo(cx + 95, cy + 90, cx + 70, cy + 210, cx + 48, cy + 95);
        ctx.bezierCurveTo(cx + 58, cy + 50, cx + 68, cy + 15, cx + 78, cy - 5);
        ctx.fill();
      }
      return;
    }

    ctx.beginPath();
    ctx.moveTo(cx - 72 * bulk, cy - 8);
    ctx.bezierCurveTo(cx - 45, cy + 8, cx - 28, cy - 2, cx - 18, cy - 22);
    ctx.lineTo(cx - 55 * bulk, cy - 28);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + 72 * bulk, cy - 8);
    ctx.bezierCurveTo(cx + 45, cy + 8, cx + 28, cy - 2, cx + 18, cy - 22);
    ctx.lineTo(cx + 55 * bulk, cy - 28);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx - 55 * bulk, cy - 30);
    ctx.bezierCurveTo(cx - 20, cy - 38, cx + 20, cy - 38, cx + 55 * bulk, cy - 30);
    ctx.bezierCurveTo(cx + 25, cy - 18, cx - 25, cy - 18, cx - 55 * bulk, cy - 30);
    ctx.fill();
  }

  function paintComposite(ctx, w, h, m) {
    var cx = w * 0.5;
    var bulk = m.bulk || 1;
    var soft = m.soft || 1;
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
    ctx.ellipse(cx, headY, (fem ? 68 : 74) * bulk * soft, (fem ? 82 : 86) * bulk * soft * 1.03, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "rgba(80,50,40,0.06)";
    ctx.beginPath();
    ctx.ellipse(cx + 22 * bulk, headY + 12, 42 * bulk, 58 * bulk, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    ctx.fillStyle = "rgba(255,180,160,0.38)";
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

    drawEye(ctx, cx - 36 * bulk, headY + 4, m.eye, 1);
    drawEye(ctx, cx + 36 * bulk, headY + 4, m.eye, 1);

    ctx.strokeStyle = m.hair[1];
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    [-1, 1].forEach(function (s) {
      ctx.beginPath();
      ctx.moveTo(cx + s * 14, headY - 20);
      ctx.quadraticCurveTo(cx + s * 32, headY - 32, cx + s * 42, headY - 16);
      ctx.stroke();
    });

    ctx.fillStyle = "rgba(90,55,45,0.12)";
    ctx.beginPath();
    ctx.ellipse(cx, headY + 16, 7, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(70,45,35,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, headY + 8);
    ctx.lineTo(cx, headY + 22);
    ctx.stroke();

    ctx.fillStyle = "#b86860";
    ctx.beginPath();
    ctx.moveTo(cx - 13, headY + 36);
    ctx.quadraticCurveTo(cx, headY + 40, cx + 13, headY + 36);
    ctx.quadraticCurveTo(cx, headY + 43, cx - 13, headY + 36);
    ctx.fill();
    ctx.fillStyle = "#d88878";
    ctx.beginPath();
    ctx.moveTo(cx - 11, headY + 38);
    ctx.quadraticCurveTo(cx, headY + 44, cx + 11, headY + 38);
    ctx.fill();
    ctx.strokeStyle = "rgba(120,60,50,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 11, headY + 37);
    ctx.quadraticCurveTo(cx, headY + 39, cx + 11, headY + 37);
    ctx.stroke();

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

    ctx.fillStyle = lin(ctx, w * 0.72, 0, w, h, [[0, "rgba(0,0,0,0)"], [0.6, m.accent + "12"], [1, m.accent + "28"]]);
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = rad(ctx, w * 0.15, h * 0.2, w * 0.35, "rgba(192,64,80,0.06)", "rgba(0,0,0,0)");
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
      charId: charId,
      composite: true,
      idol: true,
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
