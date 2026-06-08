/**
 * 博物馆级 3D 文物 · 三星堆 / 金沙
 * 纵目面具 · 金杖 · 玉璋 · 陶盉 · 象牙 · 太阳神鸟
 */
(function () {
  "use strict";

  var instance = null;

  function eng() {
    var TE = window.ThreeEngine;
    if (TE && !TE.ok && TE.retryInit) TE.retryInit();
    return TE && TE.ok ? TE : null;
  }

  function bronzeMat(tint) {
    return new THREE.MeshStandardMaterial({
      color: tint || 0x5a7a48,
      metalness: 0.78,
      roughness: 0.34,
      emissive: 0x2a4020,
      emissiveIntensity: 0.45,
    });
  }

  function goldMat() {
    return new THREE.MeshStandardMaterial({
      color: 0xffd54f,
      metalness: 0.97,
      roughness: 0.14,
      emissive: 0x886622,
      emissiveIntensity: 0.55,
    });
  }

  function jadeMat(tint) {
    return new THREE.MeshStandardMaterial({
      color: tint || 0x6ab896,
      metalness: 0.12,
      roughness: 0.22,
      emissive: 0x1a5040,
      emissiveIntensity: 0.35,
    });
  }

  function potteryMat() {
    return new THREE.MeshStandardMaterial({
      color: 0x9a7a5a,
      metalness: 0.05,
      roughness: 0.82,
      emissive: 0x201810,
      emissiveIntensity: 0.12,
    });
  }

  function ivoryMat() {
    return new THREE.MeshStandardMaterial({
      color: 0xf5ecd8,
      metalness: 0.08,
      roughness: 0.38,
      emissive: 0x403830,
      emissiveIntensity: 0.18,
    });
  }

  /** 0 · 青铜纵目面具 */
  function buildBronzeMask() {
    var g = new THREE.Group();
    var mat = bronzeMat(0x4d6b3c);

    var face = new THREE.Mesh(new THREE.SphereGeometry(0.72, 32, 24), mat);
    face.scale.set(1.05, 1.22, 0.42);
    g.add(face);

    var brow = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 0.22), mat);
    brow.position.set(0, 0.42, 0.18);
    g.add(brow);

    [-0.38, 0.38].forEach(function (x) {
      var eye = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.95, 20), bronzeMat(0x3d5a30));
      eye.position.set(x, 0.12, 0.52);
      eye.rotation.x = Math.PI / 2;
      g.add(eye);
      var pupil = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.07, 0.2, 12),
        bronzeMat(0x2a4020)
      );
      pupil.position.set(x, 0.12, 0.98);
      pupil.rotation.x = Math.PI / 2;
      g.add(pupil);
    });

    var nose = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.28, 12), mat);
    nose.position.set(0, -0.08, 0.38);
    nose.rotation.x = Math.PI / 2;
    g.add(nose);

    var mouth = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.18), bronzeMat(0x3a5530));
    mouth.position.set(0, -0.42, 0.28);
    g.add(mouth);

    [-0.82, 0.82].forEach(function (x) {
      var ear = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.12), mat);
      ear.position.set(x, 0.05, 0);
      g.add(ear);
      var lobe = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), mat);
      lobe.position.set(x, -0.32, 0.02);
      lobe.scale.set(1, 1.3, 0.6);
      g.add(lobe);
    });

    g.scale.set(1.05, 1.05, 1.05);
    return g;
  }

  /** 1 · 金杖（权杖）— 鱼鸟箭羽纹，非木棍 */
  function buildGoldStaff() {
    var g = new THREE.Group();
    var gold = goldMat();

    var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 2.0, 24), gold);
    g.add(shaft);

    var capTop = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 16), gold);
    capTop.position.y = 1.05;
    capTop.scale.set(1, 0.7, 1);
    g.add(capTop);

    var capBot = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.12, 20), gold);
    capBot.position.y = -1.06;
    g.add(capBot);

    [0.55, 0.05, -0.45].forEach(function (y, idx) {
      var band = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 10, 32), gold);
      band.position.y = y;
      band.rotation.x = Math.PI / 2;
      g.add(band);

      var fish = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), gold);
      fish.scale.set(1.6, 0.5, 0.35);
      fish.position.set(0.1, y, 0.1);
      g.add(fish);
      var tail = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 8), gold);
      tail.position.set(0.22, y, 0.1);
      tail.rotation.z = -Math.PI / 2;
      g.add(tail);

      var bird = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 8), gold);
      bird.position.set(-0.1, y + 0.02, 0.1);
      bird.rotation.x = -0.4;
      g.add(bird);
      [-1, 1].forEach(function (s) {
        var wing = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.05), gold);
        wing.position.set(-0.1 + s * 0.06, y, 0.12);
        wing.rotation.z = s * 0.5;
        g.add(wing);
      });

      for (var f = 0; f < 3; f++) {
        var feather = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.1, 0.04), gold);
        feather.position.set(0, y - 0.06 + f * 0.06, 0.11);
        feather.rotation.z = (f - 1) * 0.25;
        g.add(feather);
      }
    });

    g.rotation.z = 0.12;
    g.rotation.x = 0.08;
    return g;
  }

  /** 2 · 玉璋 */
  function buildJadeZhang() {
    var g = new THREE.Group();
    var jade = jadeMat();

    var blade = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.35, 0.06), jade);
    g.add(blade);

    [-0.07, 0.07].forEach(function (x) {
      var prong = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.05), jade);
      prong.position.set(x, 0.78, 0);
      g.add(prong);
    });

    [-1, 1].forEach(function (s) {
      var flange = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.04), jade);
      flange.position.set(s * 0.16, -0.05, 0);
      flange.rotation.z = s * 0.08;
      g.add(flange);
    });

    var hole = new THREE.Mesh(
      new THREE.TorusGeometry(0.04, 0.012, 8, 16),
      jadeMat(0x4a9070)
    );
    hole.position.set(0, 0.15, 0.04);
    hole.rotation.x = Math.PI / 2;
    g.add(hole);

    g.rotation.z = 0.15;
    return g;
  }

  /** 3 · 陶盉 */
  function buildPot() {
    var g = new THREE.Group();
    var clay = potteryMat();

    var belly = new THREE.Mesh(new THREE.SphereGeometry(0.45, 28, 20), clay);
    belly.scale.set(1.1, 0.85, 1);
    belly.position.y = 0.15;
    g.add(belly);

    var neck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 0.22, 20), clay);
    neck.position.y = 0.52;
    g.add(neck);

    var spout = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.35, 12), clay);
    spout.position.set(0.42, 0.38, 0);
    spout.rotation.z = -Math.PI / 3;
    g.add(spout);

    var handle = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 8, 16, Math.PI), clay);
    handle.position.set(-0.38, 0.42, 0);
    handle.rotation.z = Math.PI / 2;
    g.add(handle);

    for (var i = 0; i < 3; i++) {
      var a = (i / 3) * Math.PI * 2 + Math.PI / 6;
      var leg = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.28, 12), clay);
      leg.position.set(Math.cos(a) * 0.28, -0.28, Math.sin(a) * 0.22);
      g.add(leg);
    }

    return g;
  }

  /** 4 · 象牙器 */
  function buildIvory() {
    var g = new THREE.Group();
    var iv = ivoryMat();

    var curve = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.09, 16, 32, Math.PI * 0.72), iv);
    curve.rotation.y = Math.PI / 2;
    curve.rotation.z = Math.PI / 2;
    g.add(curve);

    var tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.35, 14), iv);
    tip.position.set(0, 0.42, 0.48);
    tip.rotation.x = -0.6;
    g.add(tip);

    var root = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), iv);
    root.position.set(0, -0.05, -0.42);
    root.scale.set(1.1, 0.9, 1.2);
    g.add(root);

    for (var b = 0; b < 4; b++) {
      var ring = new THREE.Mesh(new THREE.TorusGeometry(0.1 - b * 0.01, 0.012, 8, 20), ivoryMat(0xd8ccb0));
      ring.position.set(0, 0.05 + b * 0.08, 0.15 - b * 0.12);
      ring.rotation.y = Math.PI / 2;
      g.add(ring);
    }

    g.rotation.x = 0.25;
    return g;
  }

  /** 5 · 太阳神鸟金饰 */
  function buildSunBird() {
    var g = new THREE.Group();
    var gold = goldMat();

    var disc = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 0.025, 64), gold);
    g.add(disc);

    var sunCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.04, 32),
      new THREE.MeshStandardMaterial({
        color: 0xffe082,
        metalness: 0.98,
        roughness: 0.1,
        emissive: 0xaa6600,
        emissiveIntensity: 0.7,
      })
    );
    sunCore.position.y = 0.02;
    g.add(sunCore);

    for (var r = 0; r < 12; r++) {
      var ang = (r / 12) * Math.PI * 2;
      var ray = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.02), gold);
      ray.position.set(Math.cos(ang) * 0.68, 0.02, Math.sin(ang) * 0.68);
      ray.rotation.y = -ang;
      g.add(ray);
    }

    for (var b = 0; b < 4; b++) {
      var ba = (b / 4) * Math.PI * 2 + Math.PI / 4;
      var birdG = new THREE.Group();
      var body = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), gold);
      body.scale.set(1.4, 0.7, 0.8);
      birdG.add(body);
      var head = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 8), gold);
      head.position.set(0.1, 0, 0);
      head.rotation.z = -Math.PI / 2;
      birdG.add(head);
      [-1, 1].forEach(function (s) {
        var wing = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.015, 0.06), gold);
        wing.position.set(-0.02, 0, s * 0.07);
        wing.rotation.x = s * 0.4;
        birdG.add(wing);
      });
      birdG.position.set(Math.cos(ba) * 0.38, 0.03, Math.sin(ba) * 0.38);
      birdG.rotation.y = -ba + Math.PI;
      g.add(birdG);
    }

    g.rotation.x = -Math.PI / 2 + 0.35;
    return g;
  }

  var BUILDERS = [
    buildBronzeMask,
    buildGoldStaff,
    buildJadeZhang,
    buildPot,
    buildIvory,
    buildSunBird,
  ];

  var LABELS = ["青铜纵目面具", "金杖", "玉璋", "陶盉", "象牙器", "太阳神鸟金饰"];

  function buildMuseumDisplay(typeId) {
    var g = new THREE.Group();
    var ped = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.95, 0.12, 40),
      new THREE.MeshStandardMaterial({
        color: 0x2a2420,
        roughness: 0.55,
        metalness: 0.15,
        emissive: 0x0a0806,
        emissiveIntensity: 0.1,
      })
    );
    ped.position.y = -0.82;
    ped.receiveShadow = true;
    g.add(ped);

    var rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.88, 0.02, 8, 48),
      goldMat()
    );
    rim.position.y = -0.76;
    rim.rotation.x = Math.PI / 2;
    g.add(rim);

    var builder = BUILDERS[typeId] || BUILDERS[0];
    var artifact = builder();
    artifact.position.y = 0.05;
    if (typeId === 1) artifact.position.y = 0.1;
    if (typeId === 5) artifact.scale.set(0.95, 0.95, 0.95);
    g.add(artifact);
    g.userData.label = LABELS[typeId] || "文物";
    return g;
  }

  function setupMuseumLighting(scene) {
    scene.fog = new THREE.FogExp2(0x221e18, 0.018);
    scene.background = new THREE.Color(0x221e18);

    scene.add(new THREE.AmbientLight(0xfff8ee, 0.72));
    var key = new THREE.DirectionalLight(0xfff0d8, 1.35);
    key.position.set(4, 6, 5);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0xc9d8ff, 0.55);
    fill.position.set(-5, 3, 4);
    scene.add(fill);
    var rim = new THREE.DirectionalLight(0xffd54f, 0.65);
    rim.position.set(0, 2, -6);
    scene.add(rim);
    var spot = new THREE.SpotLight(0xffe8c8, 2.8, 18, 0.42, 0.45, 1);
    spot.position.set(2, 5, 4);
    scene.add(spot);
  }

  function ArtifactViewer3D(mount, typeId) {
    var TE = eng();
    if (!TE || !mount) {
      this.ok = false;
      return;
    }
    this._TE = TE;
    this.mount = mount;
    this.ok = true;
    this.typeId = typeId || 0;
    var scene = new THREE.Scene();
    this.scene = scene;

    var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
    camera.position.set(0, 0.35, 3.1);
    camera.lookAt(0, 0.1, 0);
    this.camera = camera;

    this.renderer = TE.createRenderer(mount, { exposure: 2.35, alpha: false });
    setupMuseumLighting(scene);

    this.setType(typeId);

    var self = this;
    this.loopId = TE.startLoop(function (t) {
      self._animate(t);
    });
    TE.resizeObserver(mount, camera, this.renderer);
  }

  ArtifactViewer3D.prototype.setType = function (typeId) {
    var TE = this._TE || eng();
    if (!TE || !this.scene) return;
    if (this.model) {
      this.scene.remove(this.model);
      TE.disposeObject(this.model);
    }
    this.typeId = typeId;
    this.model = buildMuseumDisplay(typeId);
    this.scene.add(this.model);
  };

  ArtifactViewer3D.prototype._animate = function (t) {
    if (this.model) {
      this.model.rotation.y = t * 0.45;
      this.model.position.y = Math.sin(t * 0.7) * 0.025;
    }
    this.renderer.render(this.scene, this.camera);
  };

  ArtifactViewer3D.prototype.destroy = function () {
    var TE = this._TE || eng();
    if (this.loopId && TE) TE.stopLoop(this.loopId);
    if (this.scene && TE) TE.disposeScene(this.scene);
    if (this.mount) this.mount.innerHTML = "";
  };

  function mountReady(mount, cb, tries) {
    tries = tries || 0;
    if (!mount) {
      cb();
      return;
    }
    if (mount.clientWidth >= 80 && mount.clientHeight >= 80) {
      cb();
      return;
    }
    if (tries > 20) {
      cb();
      return;
    }
    window.requestAnimationFrame(function () {
      mountReady(mount, cb, tries + 1);
    });
  }

  window.ArtifactViewer3D = {
    create: function (mount, typeId) {
      if (instance) instance.destroy();
      var TE = eng();
      if (!TE || !mount) {
        instance = { ok: false, setType: function () {}, destroy: function () {} };
        return instance;
      }
      instance = new ArtifactViewer3D(mount, typeId);
      if (instance.ok) {
        mountReady(mount, function () {
          if (instance && instance._TE && instance.renderer && instance.camera) {
            instance._TE.resizeObserver(mount, instance.camera, instance.renderer);
          }
        });
      }
      return instance;
    },
    get: function () {
      return instance;
    },
    destroy: function () {
      if (instance) {
        instance.destroy();
        instance = null;
      }
    },
  };
})();
