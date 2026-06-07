/**
 * 蜀地三维大片地图 · 史诗地形 + 五级神墓
 */
(function () {
  "use strict";

  var TE = window.ThreeEngine;
  var instance = null;

  function buildMonument(group, tier, index) {
    var bronze = new THREE.MeshStandardMaterial({
      color: index >= 4 ? 0x7a5090 : 0x9a7820,
      roughness: 0.35,
      metalness: 0.65,
      emissive: index >= 4 ? 0x3a2050 : 0x2a1800,
      emissiveIntensity: 0.25,
    });

    for (var s = 0; s < 4 + index; s++) {
      var w = 2.2 - s * 0.25;
      var step = new THREE.Mesh(new THREE.BoxGeometry(w, 0.45, w), bronze);
      step.position.y = 0.3 + s * 0.42;
      step.castShadow = true;
      step.receiveShadow = true;
      group.add(step);
    }

    var gateL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.8, 0.2), bronze);
    gateL.position.set(-0.9, 2.2, 0);
    group.add(gateL);
    var gateR = gateL.clone();
    gateR.position.x = 0.9;
    group.add(gateR);
    var lintel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.25, 0.35), bronze);
    lintel.position.y = 3.5;
    group.add(lintel);

    var orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 24, 24),
      new THREE.MeshStandardMaterial({
        color: 0xffd93d,
        emissive: 0xffa000,
        emissiveIntensity: 0.8,
        metalness: 0.9,
        roughness: 0.1,
      })
    );
    orb.position.y = 4.2;
    group.add(orb);

    var pl = new THREE.PointLight(0xffd080, 1.2, 12);
    pl.position.y = 4.5;
    group.add(pl);

    var ring = new THREE.Mesh(
      new THREE.RingGeometry(1.8, 2.1, 48),
      new THREE.MeshBasicMaterial({ color: 0xffd93d, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    group.add(ring);
    group.userData.ring = ring;
    group.userData.orb = orb;
  }

  function WorldMap3D(mount, onChapterPick) {
    if (!TE || !TE.ok || !mount) { this.ok = false; return; }
    this.ok = true;
    this.mount = mount;
    this.onChapterPick = onChapterPick;
    this.chapterMeshes = [];
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.camT = 0;
    this.introT = 0;

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050308, 0.018);
    this.scene = scene;

    TE.createStarfield(scene, 120);
    this.dust = TE.createDust(800, 50);
    scene.add(this.dust);

    var camera = new THREE.PerspectiveCamera(42, 1, 0.2, 200);
    camera.position.set(0, 28, 38);
    this.camera = camera;
    this.camTarget = new THREE.Vector3(0, 2, 0);

    this.renderer = TE.createRenderer(mount, { exposure: 1.4, alpha: false });
    scene.background = new THREE.Color(0x030208);
    TE.addCinematicLights(scene, 1.5);

    this._buildTerrain();
    this._buildTombs();
    this._bindEvents();

    var self = this;
    TE.resizeObserver(mount, camera, this.renderer);
    this.loopId = TE.startLoop(function (t) { self._animate(t); });
  }

  WorldMap3D.prototype._buildTerrain = function () {
    var geo = new THREE.PlaneGeometry(80, 60, 128, 96);
    geo.rotateX(-Math.PI / 2);
    var pos = geo.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i);
      var z = pos.getZ(i);
      var h =
        Math.sin(x * 0.08) * 2 +
        Math.cos(z * 0.06) * 1.8 +
        Math.sin(x * 0.15 + z * 0.12) * 1.2;
      h += Math.exp(-((x * x) / 200 + (z * z) / 150)) * 4;
      if (Math.abs(x) < 3) h -= 1.5;
      pos.setY(i, h);
    }
    geo.computeVertexNormals();
    var mat = new THREE.MeshStandardMaterial({
      color: 0x2a2218,
      roughness: 0.95,
      metalness: 0.03,
      flatShading: false,
    });
    var terrain = new THREE.Mesh(geo, mat);
    terrain.receiveShadow = true;
    this.scene.add(terrain);
  };

  WorldMap3D.prototype._buildTombs = function () {
    var tiers = window.MATCH3_EXPEDITION ? window.MATCH3_EXPEDITION.tombTiers : [];
    var positions = [
      { x: -22, z: 12, ch: 0 },
      { x: -10, z: 4, ch: 1 },
      { x: 2, z: -2, ch: 2 },
      { x: 14, z: 2, ch: 3 },
      { x: 26, z: -8, ch: 4 },
    ];
    var self = this;
    positions.forEach(function (p, i) {
      var group = new THREE.Group();
      group.position.set(p.x, 0, p.z);
      group.userData = { chapter: p.ch, tier: tiers[i] || {} };
      buildMonument(group, tiers[i], i);
      self.scene.add(group);
      self.chapterMeshes.push({ mesh: group, chapter: p.ch });
    });
  };

  WorldMap3D.prototype._bindEvents = function () {
    var self = this;
    this._onMove = function (ev) {
      var rect = self.renderer.domElement.getBoundingClientRect();
      self.pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      self.pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    };
    this._onClick = function () {
      self.raycaster.setFromCamera(self.pointer, self.camera);
      var hits = self.raycaster.intersectObjects(self.chapterMeshes.map(function (c) { return c.mesh; }), true);
      if (hits.length && self.onChapterPick) {
        var obj = hits[0].object;
        while (obj.parent && obj.userData.chapter === undefined) obj = obj.parent;
        if (obj.userData.chapter !== undefined) self.onChapterPick(obj.userData.chapter);
      }
    };
    this.renderer.domElement.addEventListener("pointermove", this._onMove);
    this.renderer.domElement.addEventListener("click", this._onClick);
  };

  WorldMap3D.prototype._animate = function (t) {
    if (this.introT < 1) {
      this.introT = Math.min(1, this.introT + 0.008);
      var e = TE.easeInOutCubic(this.introT);
      this.camera.position.set(
        THREE.MathUtils.lerp(0, 8, e),
        THREE.MathUtils.lerp(45, 16, e),
        THREE.MathUtils.lerp(55, 22, e)
      );
    } else {
      this.camT = t * 0.08;
      this.camera.position.x = 8 + Math.sin(this.camT) * 6;
      this.camera.position.y = 16 + Math.sin(this.camT * 0.5) * 2;
      this.camera.position.z = 22 + Math.cos(this.camT * 0.7) * 4;
    }
    this.camera.lookAt(this.camTarget);
    if (this.dust) {
      this.dust.rotation.y = t * 0.02;
    }
    this.chapterMeshes.forEach(function (c, i) {
      if (c.mesh.userData.orb) {
        c.mesh.userData.orb.scale.setScalar(1 + Math.sin(t * 2 + i) * 0.08);
      }
      if (c.mesh.userData.ring) {
        c.mesh.userData.ring.material.opacity = 0.15 + Math.sin(t * 1.5 + i) * 0.1;
      }
    });
    this.renderer.render(this.scene, this.camera);
  };

  WorldMap3D.prototype.setChapterHighlight = function (chIdx) {
    this.chapterMeshes.forEach(function (c) {
      var s = c.chapter === chIdx ? 1.12 : 0.92;
      c.mesh.scale.set(s, s, s);
    });
    var target = this.chapterMeshes.find(function (c) { return c.chapter === chIdx; });
    if (target) this.camTarget.set(target.mesh.position.x, 3, target.mesh.position.z);
  };

  WorldMap3D.prototype.destroy = function () {
    if (this.loopId) TE.stopLoop(this.loopId);
    if (this._onClick) this.renderer.domElement.removeEventListener("click", this._onClick);
    if (this._onMove) this.renderer.domElement.removeEventListener("pointermove", this._onMove);
    TE.disposeScene(this.scene);
    this.mount.innerHTML = "";
  };

  window.WorldMap3D = {
    create: function (mount, onChapterPick) {
      if (instance) instance.destroy();
      instance = new WorldMap3D(mount, onChapterPick);
      return instance;
    },
    get: function () { return instance; },
    destroy: function () { if (instance) { instance.destroy(); instance = null; } },
  };
})();
