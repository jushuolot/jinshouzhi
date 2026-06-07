/**
 * 2.5D 立绘素材 · 分层 SVG（乙女/恋与式半身）
 */
(function () {
  "use strict";

  function svgWrap(inner, vb) {
    vb = vb || "0 0 420 580";
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' +
      vb +
      '" preserveAspectRatio="xMidYMax meet">' +
      inner +
      "</svg>"
    );
  }

  function defs(id, accent, skin) {
    return (
      "<defs>" +
      '<radialGradient id="' +
      id +
      '-aura" cx="50%" cy="35%" r="65%"><stop offset="0%" stop-color="' +
      accent +
      '" stop-opacity="0.45"/><stop offset="100%" stop-color="#030201" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' +
      id +
      '-skin" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="' +
      skin.light +
      '"/><stop offset="55%" stop-color="' +
      skin.mid +
      '"/><stop offset="100%" stop-color="' +
      skin.dark +
      '"/></linearGradient>' +
      '<linearGradient id="' +
      id +
      '-rim" x1="0%" y1="50%" x2="100%" y2="50%"><stop offset="0%" stop-color="' +
      accent +
      '" stop-opacity="0"/><stop offset="78%" stop-color="' +
      accent +
      '" stop-opacity="0.55"/><stop offset="100%" stop-color="#fff" stop-opacity="0.25"/></linearGradient>' +
      '<filter id="' +
      id +
      '-soft"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      "</defs>"
    );
  }

  function baseFace(id, skin, eyeColor, opts) {
    opts = opts || {};
    var fem = opts.feminine;
    var jaw = fem ? "M148 318 Q210 355 272 318 Q268 380 210 395 Q152 380 148 318" : "M142 318 Q210 362 278 318 Q272 392 210 408 Q148 392 142 318";
    return (
      defs(id, opts.accent || "#c9a227", skin) +
      '<ellipse cx="210" cy="200" rx="165" ry="145" fill="url(#' +
      id +
      '-aura)"/>' +
      '<path d="M95 520 Q210 480 325 520 L340 580 L80 580 Z" fill="' +
      (opts.coat || "#2a3820") +
      '"/>' +
      '<path d="M130 520 Q210 500 290 520 L300 580 L120 580 Z" fill="' +
      (opts.coatInner || "#1a1510") +
      '"/>' +
      '<ellipse cx="210" cy="430" rx="72" ry="58" fill="url(#' +
      id +
      '-skin)"/>' +
      '<path d="' +
      jaw +
      '" fill="url(#' +
      id +
      '-skin)"/>' +
      '<ellipse cx="210" cy="268" rx="' +
      (fem ? "78" : "82") +
      '" ry="' +
      (fem ? "92" : "88") +
      '" fill="url(#' +
      id +
      '-skin)"/>' +
      '<ellipse cx="' +
      (fem ? "178" : "175") +
      '" cy="285" rx="14" ry="10" fill="' +
      skin.blush +
      '" opacity="0.35"/>' +
      '<ellipse cx="' +
      (fem ? "242" : "245") +
      '" cy="285" rx="14" ry="10" fill="' +
      skin.blush +
      '" opacity="0.35"/>' +
      '<path d="M188 248 Q210 225 232 248" stroke="' +
      skin.dark +
      '" stroke-width="3" fill="none" opacity="0.5"/>' +
      '<ellipse cx="178" cy="268" rx="11" ry="8" fill="#f8f4ee"/>' +
      '<ellipse cx="242" cy="268" rx="11" ry="8" fill="#f8f4ee"/>' +
      '<circle cx="178" cy="270" r="6" fill="' +
      eyeColor +
      '"/>' +
      '<circle cx="242" cy="270" r="6" fill="' +
      eyeColor +
      '"/>' +
      '<circle cx="176" cy="268" r="2" fill="#0a0a0a"/>' +
      '<circle cx="240" cy="268" r="2" fill="#0a0a0a"/>' +
      '<circle cx="180" cy="266" r="1.2" fill="#fff" opacity="0.9"/>' +
      '<circle cx="244" cy="266" r="1.2" fill="#fff" opacity="0.9"/>' +
      '<path class="pc-eyelid pc-eyelid-l" d="M165 258 Q178 252 191 258 L191 272 Q178 268 165 272 Z" fill="' +
      skin.mid +
      '"/>' +
      '<path class="pc-eyelid pc-eyelid-r" d="M229 258 Q242 252 255 258 L255 272 Q242 268 229 272 Z" fill="' +
      skin.mid +
      '"/>' +
      '<path d="M198 305 Q210 315 222 305" stroke="#8a5048" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
      '<path class="pc-mouth-open" d="M200 312 Q210 322 220 312" stroke="#6a3838" stroke-width="2" fill="#4a2020" opacity="0"/>' +
      (opts.stubble
        ? '<g opacity="0.25" fill="' +
          skin.dark +
          '"><circle cx="195" cy="320" r="1"/><circle cx="205" cy="325" r="1"/><circle cx="215" cy="322" r="1"/><circle cx="225" cy="328" r="1"/></g>'
        : "")
    );
  }

  var SKINS = {
    warm: { light: "#f0d4b0", mid: "#d4a574", dark: "#a07848", blush: "#e8a090" },
    fair: { light: "#fce8dc", mid: "#f0dcc8", dark: "#c8a890", blush: "#f0a8a0" },
    tan: { light: "#e8c898", mid: "#daa882", dark: "#b08050", blush: "#d89070" },
    gold: { light: "#e8c088", mid: "#cea070", dark: "#986040", blush: "#d88868" },
    pale: { light: "#ece0c8", mid: "#e0c8a0", dark: "#b09870", blush: "#d8a890" },
    dim: { light: "#c8a890", mid: "#b89878", dark: "#887058", blush: "#a88070" },
  };

  window.PORTRAIT_ART = {
    hutan: {
      name: "胡探",
      role: "摸金校尉",
      accent: "#c9a227",
      side: "right",
      layers: {
        back: svgWrap(
          baseFace("ht", SKINS.warm, "#3a2818", { accent: "#c9a227", coat: "#2a3820", coatInner: "#1a2018", stubble: true }) +
            '<path d="M120 180 Q210 80 300 180 Q320 120 210 60 Q100 120 120 180" fill="#1a1510"/>',
          "0 0 420 580"
        ),
        body: svgWrap(
          '<path d="M95 520 Q210 470 325 520 L340 580 L80 580 Z" fill="#2a3820"/>' +
            '<path d="M155 480 L165 420 L255 420 L265 480" fill="#3a4830" opacity="0.6"/>' +
            '<circle cx="210" cy="455" r="5" fill="#c9a227"/><circle cx="210" cy="485" r="5" fill="#c9a227"/>',
          "0 0 420 580"
        ),
        face: svgWrap(baseFace("htf", SKINS.warm, "#3a2818", { accent: "#c9a227", stubble: true }), "0 0 420 580"),
        hair: svgWrap(
          '<path d="M128 200 Q210 110 292 200 Q285 160 210 130 Q135 160 128 200" fill="#1a1510"/>' +
            '<path d="M145 210 Q178 175 210 185 Q242 175 275 210 L268 240 Q210 210 152 240 Z" fill="#1a1510"/>',
          "0 0 420 580"
        ),
        acc: svgWrap(
          '<ellipse cx="210" cy="118" rx="118" ry="28" fill="#1a1208"/>' +
            '<path d="M155 118 Q210 55 265 118 L258 95 Q210 40 152 95 Z" fill="#2a2010"/>' +
            '<path d="M95 130 Q210 145 325 130" stroke="#c9a227" stroke-width="2" fill="none" opacity="0.5"/>',
          "0 0 420 580"
        ),
        rim: svgWrap(
          '<rect width="420" height="580" fill="url(#htf-rim)"/>' +
            defs("htf", "#c9a227", SKINS.warm),
          "0 0 420 580"
        ),
      },
    },
    wangdun: {
      name: "王墩",
      role: "力士",
      accent: "#e07a4a",
      side: "left",
      layers: {
        back: svgWrap(
          baseFace("wd", SKINS.tan, "#2a1810", { accent: "#e07a4a", coat: "#4a2818", coatInner: "#3a1810", bulk: true }) +
            '<path d="M110 190 Q210 70 310 190 Q300 130 210 75 Q120 130 110 190" fill="#151010"/>',
          "0 0 420 580"
        ),
        body: svgWrap(
          '<path d="M85 510 Q210 455 335 510 L350 580 L70 580 Z" fill="#4a2818"/>' +
            '<path d="M120 500 Q210 460 300 500 L290 580 L130 580 Z" fill="#f0e8dc" opacity="0.85"/>',
          "0 0 420 580"
        ),
        face: svgWrap(baseFace("wdf", SKINS.tan, "#2a1810", { accent: "#e07a4a" }), "0 0 420 580"),
        hair: svgWrap(
          '<path d="M135 195 Q210 125 285 195 Q278 155 210 135 Q142 155 135 195" fill="#151010"/>' +
            '<path d="M160 215 Q210 195 260 215 L255 235 Q210 218 165 235 Z" fill="#151010"/>',
          "0 0 420 580"
        ),
        acc: svgWrap("", "0 0 420 580"),
        rim: svgWrap('<rect width="420" height="580" fill="url(#wdf-rim)"/>' + defs("wdf", "#e07a4a", SKINS.tan), "0 0 420 580"),
      },
    },
    yangxue: {
      name: "杨雪",
      role: "考古学家",
      accent: "#6ec6ff",
      side: "right",
      layers: {
        back: svgWrap(
          baseFace("yx", SKINS.fair, "#1a2840", { accent: "#6ec6ff", coat: "#1a2840", coatInner: "#f0ece8", feminine: true }) +
            '<path d="M100 175 Q210 65 320 175 Q300 100 210 55 Q120 100 100 175" fill="#0a0810"/>',
          "0 0 420 580"
        ),
        body: svgWrap(
          '<path d="M100 515 Q210 475 320 515 L330 580 L90 580 Z" fill="#1a2840"/>' +
            '<path d="M145 500 Q210 485 275 500 L268 580 L152 580 Z" fill="#f5f0ea"/>',
          "0 0 420 580"
        ),
        face: svgWrap(baseFace("yxf", SKINS.fair, "#284868", { accent: "#6ec6ff", feminine: true }), "0 0 420 580"),
        hair: svgWrap(
          '<path d="M125 185 Q210 95 295 185 Q280 140 210 115 Q140 140 125 185" fill="#0a0810"/>' +
            '<path d="M130 200 Q150 350 120 480 Q140 490 160 420 Q175 500 195 520 L225 520 Q245 500 260 420 Q275 490 295 480 Q265 350 290 200 Q210 175 130 200" fill="#0a0810"/>',
          "0 0 420 580"
        ),
        acc: svgWrap(
          '<rect x="168" y="430" width="84" height="8" rx="3" fill="#c0c8d0" opacity="0.8"/>',
          "0 0 420 580"
        ),
        rim: svgWrap('<rect width="420" height="580" fill="url(#yxf-rim)"/>' + defs("yxf", "#6ec6ff", SKINS.fair), "0 0 420 580"),
      },
    },
    jinyaliu: {
      name: "金牙刘",
      role: "顾问",
      accent: "#ffd93d",
      side: "left",
      layers: {
        back: svgWrap(
          baseFace("jl", SKINS.gold, "#2a1810", { accent: "#ffd93d", coat: "#3a3018", coatInner: "#2a2010" }) +
            '<path d="M115 185 Q210 75 305 185 Q295 125 210 70 Q125 125 115 185" fill="#2a1810"/>',
          "0 0 420 580"
        ),
        body: svgWrap(
          '<path d="M90 515 Q210 465 330 515 L345 580 L75 580 Z" fill="#3a3018"/>' +
            '<path d="M155 470 L175 420 L245 420 L265 470" fill="#4a3820" opacity="0.5"/>',
          "0 0 420 580"
        ),
        face: svgWrap(
          baseFace("jlf", SKINS.gold, "#3a2010", { accent: "#ffd93d" }) +
            '<rect x="222" y="308" width="8" height="6" rx="1" fill="#ffd93d"/>',
          "0 0 420 580"
        ),
        hair: svgWrap(
          '<path d="M130 190 Q210 120 290 190 Q285 150 210 125 Q135 150 130 190" fill="#2a1810"/>' +
            '<path d="M155 205 Q210 188 265 205 L260 228 Q210 210 160 228 Z" fill="#2a1810" opacity="0.9"/>',
          "0 0 420 580"
        ),
        acc: svgWrap("", "0 0 420 580"),
        rim: svgWrap('<rect width="420" height="580" fill="url(#jlf-rim)"/>' + defs("jlf", "#ffd93d", SKINS.gold), "0 0 420 580"),
      },
    },
    chenli: {
      name: "陈礼",
      role: "权威",
      accent: "#a8d4b8",
      side: "right",
      layers: {
        back: svgWrap(
          baseFace("cl", SKINS.pale, "#384838", { accent: "#a8d4b8", coat: "#282420", coatInner: "#1a1815" }) +
            '<path d="M120 180 Q210 80 300 180 Q310 130 210 68 Q110 130 120 180" fill="#606060"/>',
          "0 0 420 580"
        ),
        body: svgWrap('<path d="M95 520 Q210 475 325 520 L340 580 L80 580 Z" fill="#282420"/>', "0 0 420 580"),
        face: svgWrap(baseFace("clf", SKINS.pale, "#405848", { accent: "#a8d4b8" }), "0 0 420 580"),
        hair: svgWrap(
          '<path d="M128 195 Q210 105 292 195 Q288 155 210 128 Q132 155 128 195" fill="#606060"/>' +
            '<path d="M145 210 Q178 178 210 188 Q242 178 275 210 L270 238 Q210 208 150 238 Z" fill="#606060"/>',
          "0 0 420 580"
        ),
        acc: svgWrap(
          '<rect x="158" y="258" width="44" height="28" rx="6" fill="none" stroke="#8899aa" stroke-width="2.5"/>' +
            '<rect x="218" y="258" width="44" height="28" rx="6" fill="none" stroke="#8899aa" stroke-width="2.5"/>' +
            '<line x1="202" y1="272" x2="218" y2="272" stroke="#8899aa" stroke-width="2"/>',
          "0 0 420 580"
        ),
        rim: svgWrap('<rect width="420" height="580" fill="url(#clf-rim)"/>' + defs("clf", "#a8d4b8", SKINS.pale), "0 0 420 580"),
      },
    },
    narrator: {
      name: "旁白",
      role: "古蜀秘档",
      accent: "#888888",
      side: "center",
      layers: {
        back: svgWrap(
          defs("nr", "#888888", SKINS.dim) +
            '<ellipse cx="210" cy="200" rx="155" ry="135" fill="url(#nr-aura)"/>' +
            '<path d="M100 520 Q210 470 320 520 L335 580 L85 580 Z" fill="#1a1815"/>',
          "0 0 420 580"
        ),
        body: svgWrap(
          '<path d="M110 520 Q210 480 310 520 L320 580 L100 580 Z" fill="#1a1815"/>' +
            '<path d="M155 400 Q210 350 265 400 L260 520 Q210 500 160 520 Z" fill="#0a0808" opacity="0.85"/>',
          "0 0 420 580"
        ),
        face: svgWrap(
          defs("nrf", "#888888", SKINS.dim) +
            '<ellipse cx="210" cy="280" rx="55" ry="65" fill="url(#nrf-skin)" opacity="0.35"/>' +
            '<ellipse cx="188" cy="275" rx="8" ry="5" fill="#444" opacity="0.6"/>' +
            '<ellipse cx="232" cy="275" rx="8" ry="5" fill="#444" opacity="0.6"/>',
          "0 0 420 580"
        ),
        hair: svgWrap(
          '<path d="M140 200 Q210 90 280 200 Q270 140 210 100 Q150 140 140 200" fill="#222"/>',
          "0 0 420 580"
        ),
        acc: svgWrap("", "0 0 420 580"),
        rim: svgWrap('<rect width="420" height="580" fill="url(#nrf-rim)"/>' + defs("nrf", "#888888", SKINS.dim), "0 0 420 580"),
      },
    },
  };
})();
