/**
 * 真人模拟级 3D 肖像 · Sims / 恋与式半身演绎
 */
(function () {
  "use strict";

  var TE = window.ThreeEngine;
  var HS = window.HumanSim;
  var instances = {};

  var CHARS = {
    hutan: {
      skin: 0xd4a574,
      skinDark: 0xa07848,
      hair: 0x1a1510,
      coat: 0x2a3820,
      accent: 0xc9a227,
      hat: true,
      role: "摸金校尉",
      irisHue: 32,
      irisSat: 38,
    },
    wangdun: {
      skin: 0xdaa882,
      skinDark: 0xb08050,
      hair: 0x151010,
      coat: 0x4a2818,
      accent: 0xe07a4a,
      bulk: 1.22,
      role: "力士",
      irisHue: 22,
      irisSat: 35,
    },
    yangxue: {
      skin: 0xf0dcc8,
      skinDark: 0xc8a890,
      hair: 0x0a0810,
      coat: 0x1a2840,
      accent: 0x6ec6ff,
      feminine: true,
      role: "考古学家",
      irisHue: 205,
      irisSat: 32,
    },
    jinyaliu: {
      skin: 0xcea070,
      skinDark: 0x986040,
      hair: 0x2a1810,
      coat: 0x3a3018,
      accent: 0xffd93d,
      gold: true,
      role: "顾问",
      irisHue: 18,
      irisSat: 40,
    },
    chenli: {
      skin: 0xe0c8a0,
      skinDark: 0xb09870,
      hair: 0x606060,
      coat: 0x282420,
      accent: 0xa8d4b8,
      glasses: true,
      role: "权威",
      irisHue: 210,
      irisSat: 18,
    },
    narrator: {
      skin: 0xb89878,
      skinDark: 0x887058,
      hair: 0x333333,
      coat: 0x1a1815,
      accent: 0x888888,
      role: "旁白",
      irisHue: 30,
      irisSat: 25,
    },
  };

  function ensureHud(mount, def) {
    var hud = mount.querySelector(".sim-portrait-hud");
    if (!hud) {
      hud = document.createElement("div");
      hud.className = "sim-portrait-hud";
      mount.appendChild(hud);
    }
    hud.innerHTML =
      '<span class="sim-role-tag">' +
      (def.role || "") +
      '</span><span class="sim-name-plate">' +
      (def.displayName || "") +
      "</span>";
    return hud;
  }

  function CharacterCinema(mount, id) {
    if (!TE || !TE.ok || !HS || !HS.ok || !mount) {
      this.ok = false;
      return;
    }
    this.ok = true;
    this.mount = mount;
    this.id = id || "default";
    this.enterT = 0;
    this.talking = false;

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080604, 0.06);
    this.scene = scene;

    var backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 8),
      new THREE.MeshStandardMaterial({
        color: 0x12100e,
        roughness: 0.95,
        metalness: 0.05,
        map: TE.makeGradientTexture("#1a1510", "#030201"),
      })
    );
    backdrop.position.set(0, 1.4, -2.5);
    scene.add(backdrop);

    var floor = new THREE.Mesh(
      new THREE.CircleGeometry(3.5, 48),
      new THREE.MeshStandardMaterial({ color: 0x0a0806, roughness: 0.92, metalness: 0.15 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    HS.addPortraitRig(scene);

    var camera = new THREE.PerspectiveCamera(28, 1, 0.1, 40);
    camera.position.set(0, 1.42, 3.35);
    camera.lookAt(0, 1.38, 0);
    this.camera = camera;
    this.baseCamZ = 3.35;

    this.renderer = TE.createRenderer(mount, { exposure: 1.55, alpha: false });
    scene.background = new THREE.Color(0x060504);

    var wrap = mount.querySelector(".blockbuster-canvas-wrap");
    if (wrap && !mount.querySelector(".sim-vignette")) {
      var vig = document.createElement("div");
      vig.className = "sim-vignette";
      mount.appendChild(vig);
    }

    var self = this;
    this.loopId = TE.startLoop(function (t) {
      self._animate(t);
    });
    TE.resizeObserver(mount, camera, this.renderer);
  }

  CharacterCinema.prototype.showCharacter = function (charId, talking) {
    charId = charId || "narrator";
    if (this.bust) {
      this.scene.remove(this.bust);
      TE.disposeObject(this.bust);
    }
    var def = CHARS[charId] || CHARS.narrator;
    def.displayName = {
      hutan: "胡探",
      wangdun: "王墩",
      yangxue: "杨雪",
      jinyaliu: "金牙刘",
      chenli: "陈礼",
      narrator: "旁白",
    }[charId] || "旁白";

    this.bust = HS.buildPortrait(def);
    this.bust.scale.set(0.001, 0.001, 0.001);
    this.enterT = 0;
    this.scene.add(this.bust);
    this.currentId = charId;
    this.talking = !!talking;

    ensureHud(this.mount, def);

    if (this.scene.userData.keyLight) {
      var warm = def.accent === 0x6ec6ff;
      this.scene.userData.keyLight.color.setHex(warm ? 0xe8f4ff : 0xfff0e0);
      this.scene.userData.rimLight.color.setHex(def.accent || 0xffc870);
    }
    this.baseCamZ = def.feminine ? 3.15 : def.bulk > 1.1 ? 3.55 : 3.35;
  };

  CharacterCinema.prototype.setTalking = function (on) {
    this.talking = !!on;
  };

  CharacterCinema.prototype._animate = function (t) {
    if (this.bust) {
      if (this.enterT < 1) {
        this.enterT = Math.min(1, this.enterT + 0.028);
        var e = TE.easeInOutCubic(this.enterT);
        var s = 0.001 + e * 0.999;
        this.bust.scale.set(s, s, s);
      }
      HS.animatePortrait(this.bust, t, this.talking);
    }

    var breathe = Math.sin(t * 0.35) * 0.04;
    this.camera.position.z = this.baseCamZ + breathe;
    this.camera.position.x = Math.sin(t * 0.12) * 0.06;
    this.camera.lookAt(0, 1.36 + Math.sin(t * 0.45) * 0.015, 0);

    if (this.scene.userData.keyLight) {
      this.scene.userData.keyLight.position.x = 2.5 + Math.sin(t * 0.3) * 0.4;
    }

    this.renderer.render(this.scene, this.camera);
  };

  CharacterCinema.prototype.destroy = function () {
    if (this.loopId) TE.stopLoop(this.loopId);
    TE.disposeScene(this.scene);
    this.mount.innerHTML = "";
    delete instances[this.id];
  };

  window.CharacterCinema = {
    create: function (mount, id) {
      id = id || "main";
      if (instances[id]) instances[id].destroy();
      instances[id] = new CharacterCinema(mount, id);
      return instances[id];
    },
    get: function (id) {
      return instances[id || "main"];
    },
    destroy: function (id) {
      if (id && instances[id]) instances[id].destroy();
      else {
        Object.keys(instances).forEach(function (k) {
          instances[k].destroy();
        });
      }
      instances = {};
    },
  };
})();
