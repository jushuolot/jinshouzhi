/**
 * 大片级 3D 人物 · 精细半身 + 电影灯光
 */
(function () {
  "use strict";

  var TE = window.ThreeEngine;
  var instances = {};

  var CHARS = {
    hutan: { skin: 0xd4a574, skinDark: 0xa07848, hair: 0x1a1510, coat: 0x2a3820, accent: 0xc9a227, hat: true, role: "摸金校尉" },
    wangdun: { skin: 0xdaa882, skinDark: 0xb08050, hair: 0x151010, coat: 0x4a2818, accent: 0xe07a4a, bulk: 1.18, role: "力士" },
    yangxue: { skin: 0xf0dcc8, skinDark: 0xc8a890, hair: 0x0a0810, coat: 0x1a2840, accent: 0x6ec6ff, role: "考古学家" },
    jinyaliu: { skin: 0xcea070, skinDark: 0x986040, hair: 0x2a1810, coat: 0x3a3018, accent: 0xffd93d, gold: true, role: "顾问" },
    chenli: { skin: 0xe0c8a0, skinDark: 0xb09870, hair: 0x606060, coat: 0x282420, accent: 0xa8d4b8, glasses: true, role: "权威" },
    narrator: { skin: 0xb89878, skinDark: 0x887058, hair: 0x333333, coat: 0x1a1815, accent: 0x888888, role: "旁白" },
  };

  function skinMat(def, dark) {
    return new THREE.MeshPhysicalMaterial({
      color: dark ? def.skinDark : def.skin,
      roughness: 0.55,
      metalness: 0.02,
      clearcoat: 0.15,
      clearcoatRoughness: 0.4,
    });
  }

  function buildEpicBust(def) {
    var g = new THREE.Group();
    var bulk = def.bulk || 1;

    var neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * bulk, 0.18 * bulk, 0.35, 16), skinMat(def, false));
    neck.position.y = 1.22;
    g.add(neck);

    var head = new THREE.Mesh(new THREE.SphereGeometry(0.38 * bulk, 48, 48), skinMat(def, false));
    head.position.y = 1.58;
    head.scale.set(1, 1.08, 0.92);
    g.add(head);

    var jaw = new THREE.Mesh(new THREE.BoxGeometry(0.32 * bulk, 0.18 * bulk, 0.28 * bulk), skinMat(def, true));
    jaw.position.set(0, 1.42, 0.12 * bulk);
    g.add(jaw);

    var nose = new THREE.Mesh(new THREE.ConeGeometry(0.06 * bulk, 0.14 * bulk, 8), skinMat(def, true));
    nose.position.set(0, 1.52, 0.32 * bulk);
    nose.rotation.x = Math.PI * 0.5;
    g.add(nose);

    [-0.13, 0.13].forEach(function (x) {
      var eyeW = new THREE.Mesh(
        new THREE.SphereGeometry(0.045 * bulk, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.1 })
      );
      eyeW.position.set(x * bulk, 1.6, 0.28 * bulk);
      g.add(eyeW);
      var hi = new THREE.Mesh(
        new THREE.SphereGeometry(0.015 * bulk, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      hi.position.set(x * bulk + 0.02, 1.62, 0.31 * bulk);
      g.add(hi);
    });

    var hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.4 * bulk, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.62),
      new THREE.MeshStandardMaterial({ color: def.hair, roughness: 0.95, metalness: 0.05 })
    );
    hair.position.y = 1.68;
    g.add(hair);

    if (def.glasses) {
      var frame = new THREE.Mesh(
        new THREE.TorusGeometry(0.11 * bulk, 0.012, 8, 24),
        new THREE.MeshStandardMaterial({ color: 0xaaaacc, metalness: 0.85, roughness: 0.15 })
      );
      frame.position.set(-0.12 * bulk, 1.6, 0.3 * bulk);
      g.add(frame);
      var frame2 = frame.clone();
      frame2.position.x = 0.12 * bulk;
      g.add(frame2);
    }

    var coat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42 * bulk, 0.55 * bulk, 1.05, 24),
      new THREE.MeshStandardMaterial({ color: def.coat, roughness: 0.78, metalness: 0.12 })
    );
    coat.position.y = 0.72;
    g.add(coat);

    var collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.28 * bulk, 0.04, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0x1a1510, roughness: 0.9 })
    );
    collar.position.y = 1.18;
    collar.rotation.x = Math.PI / 2;
    g.add(collar);

    if (def.hat) {
      var brim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55 * bulk, 0.55 * bulk, 0.05, 32),
        new THREE.MeshStandardMaterial({ color: 0x1a1208, roughness: 0.88 })
      );
      brim.position.y = 1.92;
      g.add(brim);
      var crown = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3 * bulk, 0.34 * bulk, 0.42, 24),
        new THREE.MeshStandardMaterial({ color: 0x2a2010, roughness: 0.82 })
      );
      crown.position.y = 2.14;
      g.add(crown);
    }

    if (def.gold) {
      var tooth = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.035, 0.02),
        new THREE.MeshStandardMaterial({ color: 0xffd93d, metalness: 0.95, roughness: 0.12 })
      );
      tooth.position.set(0.07 * bulk, 1.44, 0.34 * bulk);
      g.add(tooth);
    }

    g.userData.jaw = jaw;
    g.userData.head = head;
    return g;
  }

  function CharacterCinema(mount, id) {
    if (!TE || !TE.ok || !mount) { this.ok = false; return; }
    this.ok = true;
    this.mount = mount;
    this.id = id || "default";
    this.enterT = 0;
    this.talking = false;

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030201, 0.08);
    this.scene = scene;

    TE.createStarfield(scene, 40);

    var floor = new THREE.Mesh(
      new THREE.CircleGeometry(4, 48),
      new THREE.MeshStandardMaterial({ color: 0x0a0806, roughness: 0.95, metalness: 0.1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    TE.addCinematicLights(scene, 1.4);

    var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
    camera.position.set(0, 1.35, 4.2);
    camera.lookAt(0, 1.35, 0);
    this.camera = camera;

    this.renderer = TE.createRenderer(mount, { exposure: 1.45, alpha: false });
    scene.background = new THREE.Color(0x030201);

    var self = this;
    this.loopId = TE.startLoop(function (t) { self._animate(t); });
    TE.resizeObserver(mount, camera, this.renderer);
  }

  CharacterCinema.prototype.showCharacter = function (charId, talking) {
    charId = charId || "narrator";
    if (this.bust) {
      this.scene.remove(this.bust);
      TE.disposeObject(this.bust);
    }
    var def = CHARS[charId] || CHARS.narrator;
    this.bust = buildEpicBust(def);
    this.bust.scale.set(0.01, 0.01, 0.01);
    this.enterT = 0;
    this.scene.add(this.bust);
    this.currentId = charId;
    this.talking = talking;
    if (this.scene.userData.keyLight) {
      this.scene.userData.keyLight.color.setHex(def.accent === 0x6ec6ff ? 0xcce8ff : 0xffe8c8);
    }
  };

  CharacterCinema.prototype._animate = function (t) {
    if (this.bust) {
      if (this.enterT < 1) {
        this.enterT = Math.min(1, this.enterT + 0.035);
        var e = TE.easeInOutCubic(this.enterT);
        var s = 0.01 + e * 0.99;
        this.bust.scale.set(s, s, s);
      }
      this.bust.position.y = Math.sin(t * 0.6) * 0.025;
      this.bust.rotation.y = Math.sin(t * 0.25) * 0.06;
      if (this.talking && this.bust.userData.jaw) {
        this.bust.userData.jaw.rotation.x = Math.sin(t * 14) * 0.08;
        this.bust.userData.head.rotation.x = Math.sin(t * 10) * 0.015;
      }
    }
    if (this.scene.userData.keyLight) {
      this.scene.userData.keyLight.position.x = 4 + Math.sin(t * 0.4) * 1.5;
    }
    this.camera.position.x = Math.sin(t * 0.15) * 0.15;
    this.camera.lookAt(0, 1.35 + Math.sin(t * 0.5) * 0.02, 0);
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
    get: function (id) { return instances[id || "main"]; },
    destroy: function (id) {
      if (id && instances[id]) instances[id].destroy();
      else Object.keys(instances).forEach(function (k) { instances[k].destroy(); });
      instances = {};
    },
  };
})();
