/**
 * 2.5D 立绘影院 · 分层视差 + 电影镜头
 */
(function () {
  "use strict";

  var ART = window.PORTRAIT_ART;
  var instances = {};

  function buildStage(art, compact) {
    var side = art.side || "right";
    var align =
      side === "left" ? "pc-align-left" : side === "center" ? "pc-align-center" : "pc-align-right";
    return (
      '<div class="portrait-cinema ' +
      align +
      (compact ? " compact" : "") +
      '" style="--pc-accent:' +
      art.accent +
      '">' +
      '<div class="pc-letterbox pc-letterbox-top"></div>' +
      '<div class="pc-letterbox pc-letterbox-bottom"></div>' +
      '<div class="pc-bg">' +
      '<div class="pc-bg-gradient"></div>' +
      '<div class="pc-bokeh"></div>' +
      '<div class="pc-dust"></div>' +
      "</div>" +
      '<div class="pc-flare"></div>' +
      '<div class="pc-stage">' +
      '<div class="pc-layer pc-layer-back" data-z="1">' +
      art.layers.back +
      "</div>" +
      '<div class="pc-layer pc-layer-body" data-z="2">' +
      art.layers.body +
      "</div>" +
      '<div class="pc-layer pc-layer-face" data-z="3">' +
      art.layers.face +
      "</div>" +
      '<div class="pc-layer pc-layer-hair" data-z="4">' +
      art.layers.hair +
      "</div>" +
      '<div class="pc-layer pc-layer-acc" data-z="5">' +
      art.layers.acc +
      "</div>" +
      '<div class="pc-layer pc-layer-rim" data-z="6">' +
      art.layers.rim +
      "</div>" +
      "</div>" +
      '<div class="pc-grade"></div>' +
      '<div class="pc-vignette"></div>' +
      '<div class="pc-grain"></div>' +
      '<div class="pc-hud">' +
      '<span class="pc-role">' +
      art.role +
      '</span><span class="pc-name">' +
      art.name +
      "</span></div>" +
      "</div>"
    );
  }

  function PortraitCinema(mount, id) {
    if (!mount || !ART) {
      this.ok = false;
      return;
    }
    this.ok = true;
    this.mount = mount;
    this.id = id || "main";
    if (window.setMountLoading) window.setMountLoading(mount, "立绘载入…");
    this.talking = false;
    this.enterT = 0;
    this.t = 0;
    this.blinkT = Math.random() * 3;
    this.compact = !!mount.closest(".discovery-modal");
    this.running = true;
    var self = this;
    this._frame = function (now) {
      if (!self.running) return;
      self._tick((now || performance.now()) * 0.001);
      requestAnimationFrame(self._frame);
    };
    requestAnimationFrame(this._frame);
  }

  PortraitCinema.prototype.showCharacter = function (charId, talking) {
    var art = ART[charId] || ART.narrator;
    this.mount.innerHTML = buildStage(art, !!this.compact);
    this.root = this.mount.querySelector(".portrait-cinema");
    this.stage = this.mount.querySelector(".pc-stage");
    this.layers = this.mount.querySelectorAll(".pc-layer");
    this.talking = !!talking;
    this.enterT = 0;
    this.charId = charId;
    if (this.root) this.root.classList.add("pc-enter");
  };

  PortraitCinema.prototype.setTalking = function (on) {
    this.talking = !!on;
    if (this.root) this.root.classList.toggle("pc-talking", this.talking);
  };

  PortraitCinema.prototype._tick = function (t) {
    this.t = t;
    if (!this.root || !this.stage) return;

    if (this.enterT < 1) {
      this.enterT = Math.min(1, this.enterT + 0.045);
      var e = this.enterT < 0.5 ? 2 * this.enterT * this.enterT : 1 - Math.pow(-2 * this.enterT + 2, 2) / 2;
      this.root.style.setProperty("--pc-enter", e);
    }

    var breathe = Math.sin(t * 0.9) * 0.008;
    var ken = 1 + Math.sin(t * 0.15) * 0.025;
    var enterX = 0;
    if (this.enterT < 1) {
      if (this.root.classList.contains("pc-align-left")) enterX = (1 - this.enterT) * -80;
      else if (this.root.classList.contains("pc-align-right")) enterX = (1 - this.enterT) * 80;
    }
    var enterScale = 0.92 + this.enterT * 0.08;
    var enterBlur = (1 - this.enterT) * 6;
    this.stage.style.opacity = String(0.15 + this.enterT * 0.85);
    this.stage.style.filter = enterBlur > 0.1 ? "blur(" + enterBlur + "px)" : "none";
    this.stage.style.transform =
      "translateX(" + enterX + "px) scale(" + (this.enterT < 1 ? enterScale : ken) + ") translateY(" + breathe * 100 + "px)";

    var parallax = Math.sin(t * 0.35) * 6;
    var centered = this.root.classList.contains("pc-align-center");
    for (var i = 0; i < this.layers.length; i++) {
      var z = parseFloat(this.layers[i].getAttribute("data-z") || "1");
      var px = parallax * z * 0.15;
      var py = Math.sin(t * 0.5 + z) * 2;
      var base = centered ? "translateX(calc(-50% + " + px + "px))" : "translate(" + px + "px," + py + "px)";
      if (!centered) this.layers[i].style.transform = "translate(" + px + "px," + py + "px)";
      else this.layers[i].style.transform = base + " translateY(" + py + "px)";
    }

    this.blinkT += 0.016;
    if (this.blinkT > 4.5) {
      this.blinkT = 0;
      if (this.root) {
        this.root.classList.add("pc-blink");
        var r = this.root;
        setTimeout(function () {
          r.classList.remove("pc-blink");
        }, 140);
      }
    }

    if (this.root) {
      this.root.classList.toggle("pc-talking", this.talking);
      this.root.style.setProperty("--pc-pulse", 0.5 + Math.sin(t * 12) * 0.5);
    }
  };

  PortraitCinema.prototype.destroy = function () {
    this.running = false;
    this.mount.innerHTML = "";
    delete instances[this.id];
  };

  window.PortraitCinema = {
    create: function (mount, id) {
      id = id || "main";
      if (instances[id]) instances[id].destroy();
      instances[id] = new PortraitCinema(mount, id);
      return instances[id];
    },
    get: function (id) {
      return instances[id || "main"];
    },
    destroy: function (id) {
      if (id && instances[id]) instances[id].destroy();
      else Object.keys(instances).forEach(function (k) {
        instances[k].destroy();
      });
      instances = {};
    },
  };
})();
