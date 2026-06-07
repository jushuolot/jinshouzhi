/**
 * 电影级大型 3D 人物（半身像）
 */
(function () {
  "use strict";

  var CHARS = {
    hutan: { skin: 0xc8956a, hair: 0x2a2018, coat: 0x3a4a28, accent: 0xc9a227, hat: true },
    wangdun: { skin: 0xd4a574, hair: 0x1a1510, coat: 0x5a3020, accent: 0xe07a4a, hat: false, bulk: 1.15 },
    yangxue: { skin: 0xe8c4a8, hair: 0x1a1018, coat: 0x2a3850, accent: 0x6ec6ff, hat: false },
    jinyaliu: { skin: 0xcea070, hair: 0x2a2015, coat: 0x4a3a20, accent: 0xffd93d, hat: false, gold: true },
    chenli: { skin: 0xd8b890, hair: 0x505050, coat: 0x3a3530, accent: 0xa8d4b8, hat: false, glasses: true },
    narrator: { skin: 0xb89878, hair: 0x333333, coat: 0x2a2520, accent: 0xaaaaaa, hat: false },
  };

  var instance = null;

  function buildBust(def, side) {
    var g = new THREE.Group();
    var bulk = def.bulk || 1;

    var headGeo = new THREE.SphereGeometry(0.42 * bulk, 32, 32);
    var headMat = new THREE.MeshStandardMaterial({ color: def.skin, roughness: 0.65, metalness: 0.02 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.55;
    head.castShadow = true;
    g.add(head);

    var hairGeo = new THREE.SphereGeometry(0.44 * bulk, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.55);
    var hair = new THREE.Mesh(
      hairGeo,
      new THREE.MeshStandardMaterial({ color: def.hair, roughness: 0.9, metalness: 0.05 })
    );
    hair.position.y = 1.65;
    g.add(hair);

    if (def.glasses) {
      var glass = new THREE.Mesh(
        new THREE.TorusGeometry(0.12, 0.015, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 })
      );
      glass.position.set(-0.1, 1.58, 0.35);
      g.add(glass.clone());
      g.children[g.children.length - 1].position.x = 0.1;
    }

    var torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35 * bulk, 0.45 * bulk, 0.9, 16),
      new THREE.MeshStandardMaterial({ color: def.coat, roughness: 0.85, metalness: 0.08 })
    );
    torso.position.y = 0.85;
    torso.castShadow = true;
    g.add(torso);

    if (def.hat) {
      var brim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.04, 20),
        new THREE.MeshStandardMaterial({ color: 0x2a2010, roughness: 0.9 })
      );
      brim.position.y = 1.95;
      g.add(brim);
      var crown = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.32, 0.35, 16),
        new THREE.MeshStandardMaterial({ color: 0x3a3020, roughness: 0.85 })
      );
      crown.position.y = 2.15;
      g.add(crown);
    }

    if (def.gold) {
      var tooth = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.04, 0.02),
        new THREE.MeshStandardMaterial({ color: 0xffd93d, metalness: 0.9, roughness: 0.2 })
      );
      tooth.position.set(0.08, 1.48, 0.38);
      g.add(tooth);
    }

    var rim = new THREE.PointLight(def.accent, 0.35, 4);
    rim.position.set(side === "left" ? 1 : -1, 1.6, 1);
    g.add(rim);

    g.rotation.y = side === "left" ? 0.35 : side === "right" ? -0.35 : 0;
    return g;
  }

  function CharacterCinema(mount) {
    if (!window.ThreeEngine || !window.ThreeEngine.ok || !mount) {
      this.ok = false;
      return;
    }
    this.ok = true;
    this.mount = mount;
    this.currentId = null;
    this.bust = null;
    this.talkPhase = 0;

    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0806);
    this.scene = scene;

    var camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
    camera.position.set(0, 1.4, 3.2);
    camera.lookAt(0, 1.2, 0);
    this.camera = camera;

    this.renderer = window.ThreeEngine.createRenderer(mount, { exposure: 1.2 });
    window.ThreeEngine.addLights(scene, 1.3);

    var self = this;
    this.loopId = window.ThreeEngine.startLoop(function (t) {
      self._animate(t);
    });
    window.ThreeEngine.resizeObserver(mount, camera, this.renderer);
  }

  CharacterCinema.prototype.showCharacter = function (charId, talking) {
    charId = charId || "narrator";
    if (this.bust) {
      this.scene.remove(this.bust);
      window.ThreeEngine.disposeScene(this.bust);
    }
    var def = CHARS[charId] || CHARS.narrator;
    var side = charId === "chenli" || charId === "hutan" ? "left" : charId === "wangdun" || charId === "jinyaliu" ? "right" : "center";
    this.bust = buildBust(def, side);
    this.scene.add(this.bust);
    this.currentId = charId;
    this.talking = talking;
  };

  CharacterCinema.prototype._animate = function (t) {
    if (this.bust) {
      this.bust.position.y = Math.sin(t * 0.8) * 0.03;
      if (this.talking) {
        this.bust.rotation.x = Math.sin(t * 8) * 0.02;
        this.bust.position.y += Math.sin(t * 12) * 0.015;
      }
    }
    this.renderer.render(this.scene, this.camera);
  };

  CharacterCinema.prototype.destroy = function () {
    if (this.loopId) window.ThreeEngine.stopLoop(this.loopId);
    window.ThreeEngine.disposeScene(this.scene);
    this.mount.innerHTML = "";
  };

  window.CharacterCinema = {
    create: function (mount) {
      if (instance) instance.destroy();
      instance = new CharacterCinema(mount);
      return instance;
    },
    get: function () { return instance; },
    destroy: function () {
      if (instance) { instance.destroy(); instance = null; }
    },
  };
})();
