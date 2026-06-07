/**
 * 蜀地三维总览地图
 */
(function () {
  "use strict";

  var instance = null;

  function WorldMap3D(mount, onChapterPick) {
    if (!window.ThreeEngine || !window.ThreeEngine.ok || !mount) {
      this.ok = false;
      return;
    }
    this.ok = true;
    this.mount = mount;
    this.onChapterPick = onChapterPick;
    this.loopId = null;
    this.chapterMeshes = [];
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0f0a06, 0.045);
    this.scene = scene;

    var camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.set(0, 9, 12);
    camera.lookAt(0, 0, 0);
    this.camera = camera;

    this.renderer = window.ThreeEngine.createRenderer(mount, { exposure: 1.1 });
    window.ThreeEngine.addLights(scene, 1.2);

    this._buildTerrain();
    this._buildTombs();
    this._bindEvents();

    var self = this;
    this._resize = window.ThreeEngine.resizeObserver(mount, camera, this.renderer);
    this.loopId = window.ThreeEngine.startLoop(function (t) {
      self._animate(t);
    });
  }

  WorldMap3D.prototype._buildTerrain = function () {
    var geo = new THREE.PlaneGeometry(24, 18, 48, 36);
    geo.rotateX(-Math.PI / 2);
    var pos = geo.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i);
      var z = pos.getZ(i);
      var h = Math.sin(x * 0.35) * 0.4 + Math.cos(z * 0.28) * 0.35;
      h += Math.exp(-((x * x + z * z) / 40)) * 1.2;
      pos.setY(i, h);
    }
    geo.computeVertexNormals();
    var mat = new THREE.MeshStandardMaterial({
      color: 0x3d3020,
      roughness: 0.92,
      metalness: 0.05,
      flatShading: false,
    });
    var terrain = new THREE.Mesh(geo, mat);
    terrain.receiveShadow = true;
    this.scene.add(terrain);

    var riverGeo = new THREE.PlaneGeometry(14, 1.2, 1, 1);
    riverGeo.rotateX(-Math.PI / 2);
    riverGeo.translate(0, 0.15, 2);
    var river = new THREE.Mesh(
      riverGeo,
      new THREE.MeshStandardMaterial({ color: 0x2a5070, roughness: 0.2, metalness: 0.6, transparent: true, opacity: 0.75 })
    );
    this.scene.add(river);
  };

  WorldMap3D.prototype._buildTombs = function () {
    var chapters = window.MATCH3_EXPEDITION ? window.MATCH3_EXPEDITION.tombTiers : [];
    var positions = [
      { x: -7, z: 4, ch: 0 },
      { x: -3, z: 1, ch: 1 },
      { x: 1, z: -1, ch: 2 },
      { x: 5, z: 0, ch: 3 },
      { x: 8, z: -3, ch: 4 },
    ];
    var self = this;
    positions.forEach(function (p, i) {
      var tier = chapters[i] || { name: "墓" + i, icon: "⚱" };
      var group = new THREE.Group();
      group.position.set(p.x, 0, p.z);
      group.userData = { chapter: p.ch, tier: tier };

      var baseGeo = new THREE.CylinderGeometry(1.2, 1.6, 0.8, 8);
      var baseMat = new THREE.MeshStandardMaterial({ color: 0x5a4020, roughness: 0.85, metalness: 0.15 });
      var base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.5;
      base.castShadow = true;
      group.add(base);

      var tombGeo = new THREE.BoxGeometry(1.4, 1.8 + i * 0.15, 1.4);
      var tombMat = new THREE.MeshStandardMaterial({
        color: i === 4 ? 0x9b59b6 : 0x8b6914 + i * 0x080808,
        roughness: 0.55,
        metalness: 0.35,
      });
      var tomb = new THREE.Mesh(tombGeo, tombMat);
      tomb.position.y = 1.8 + i * 0.1;
      tomb.castShadow = true;
      group.add(tomb);

      var beacon = new THREE.PointLight(0xffd93d, 0.6, 6);
      beacon.position.y = 3;
      group.add(beacon);

      self.scene.add(group);
      self.chapterMeshes.push({ mesh: group, chapter: p.ch });
    });
  };

  WorldMap3D.prototype._bindEvents = function () {
    var self = this;
    this._onClick = function (ev) {
      var rect = self.renderer.domElement.getBoundingClientRect();
      self.pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      self.pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      self.raycaster.setFromCamera(self.pointer, self.camera);
      var hits = self.raycaster.intersectObjects(self.chapterMeshes.map(function (c) { return c.mesh; }), true);
      if (hits.length && self.onChapterPick) {
        var obj = hits[0].object;
        while (obj.parent && obj.userData.chapter === undefined) obj = obj.parent;
        if (obj.userData.chapter !== undefined) self.onChapterPick(obj.userData.chapter);
      }
    };
    this.renderer.domElement.addEventListener("click", this._onClick);
  };

  WorldMap3D.prototype._animate = function (t) {
    this.camera.position.x = Math.sin(t * 0.12) * 2;
    this.camera.lookAt(0, 0.5, 0);
    this.chapterMeshes.forEach(function (c, i) {
      c.mesh.position.y = Math.sin(t * 1.2 + i) * 0.06;
      c.mesh.rotation.y = Math.sin(t * 0.3 + i) * 0.08;
    });
    this.renderer.render(this.scene, this.camera);
  };

  WorldMap3D.prototype.setChapterHighlight = function (chIdx) {
    this.chapterMeshes.forEach(function (c) {
      var scale = c.chapter === chIdx ? 1.15 : 1;
      c.mesh.scale.set(scale, scale, scale);
    });
  };

  WorldMap3D.prototype.destroy = function () {
    if (this.loopId) window.ThreeEngine.stopLoop(this.loopId);
    if (this._onClick) this.renderer.domElement.removeEventListener("click", this._onClick);
    window.ThreeEngine.disposeScene(this.scene);
    this.mount.innerHTML = "";
  };

  WorldMap3D.prototype.mountTo = function (el) {
    if (instance) instance.destroy();
    instance = new WorldMap3D(el, this.onChapterPick);
    return instance;
  };

  window.WorldMap3D = {
    create: function (mount, onChapterPick) {
      if (instance) instance.destroy();
      instance = new WorldMap3D(mount, onChapterPick);
      return instance;
    },
    get: function () { return instance; },
    destroy: function () {
      if (instance) { instance.destroy(); instance = null; }
    },
  };
})();
