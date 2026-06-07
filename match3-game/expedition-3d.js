/**
 * 地下探宝大片 · 洞窟 + 圣火探点
 */
(function () {
  "use strict";

  var TE = window.ThreeEngine;
  var instance = null;

  function ExpeditionMap3D(mount, chapterIdx, state, onNodePick) {
    if (!TE || !TE.ok || !mount) { this.ok = false; return; }
    this.ok = true;
    this.chapterIdx = chapterIdx;
    this.state = state;
    this.onNodePick = onNodePick;
    this.nodeMeshes = [];
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.camT = 0;

    var exp = window.MATCH3_EXPEDITION;
    this.nodes = exp && exp.chapters[chapterIdx] ? exp.chapters[chapterIdx].nodes : [];

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020100, 0.035);
    this.scene = scene;

    var camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
    camera.position.set(0, 5, 10);
    this.camera = camera;

    this.renderer = TE.createRenderer(mount, { exposure: 1.5, alpha: false });
    scene.background = new THREE.Color(0x020100);
    TE.addCinematicLights(scene, 0.9);

    this._buildCave();
    this._buildPath();
    this._buildNodes();
    this._bindEvents();

    var self = this;
    this.loopId = TE.startLoop(function (t) { self._animate(t); });
    TE.resizeObserver(mount, camera, this.renderer);
  }

  ExpeditionMap3D.prototype._nodeUnlocked = function (ni) {
    if (ni === 0) return true;
    var prev = this.nodes[ni - 1];
    return prev && this.state.beatenLevels[String(prev.level)] === true;
  };

  ExpeditionMap3D.prototype._buildCave = function () {
    var caveGeo = new THREE.SphereGeometry(18, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
    var caveMat = new THREE.MeshStandardMaterial({
      color: 0x1a1510,
      roughness: 0.98,
      metalness: 0.02,
      side: THREE.BackSide,
    });
    var cave = new THREE.Mesh(caveGeo, caveMat);
    cave.position.y = 4;
    this.scene.add(cave);

    var floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x0a0806, roughness: 0.4, metalness: 0.15 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.1;
    floor.receiveShadow = true;
    this.scene.add(floor);

    this.dust = TE.createDust(300, 12);
    this.scene.add(this.dust);
  };

  ExpeditionMap3D.prototype._buildPath = function () {
    if (this.nodes.length < 2) return;
    var pts = this.nodes.map(function (n) { return new THREE.Vector3(n.x, 0.15, n.z); });
    var curve = new THREE.CatmullRomCurve3(pts);
    this.curve = curve;
    var tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 80, 0.12, 12, false),
      new THREE.MeshStandardMaterial({ color: 0x3a2818, roughness: 0.85, metalness: 0.1 })
    );
    this.scene.add(tube);
    var glow = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 80, 0.04, 8, false),
      new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.4 })
    );
    glow.position.y = 0.05;
    this.scene.add(glow);
  };

  ExpeditionMap3D.prototype._buildNodes = function () {
    var self = this;
    this.nodes.forEach(function (node, ni) {
      var unlocked = self._nodeUnlocked(ni);
      var beaten = self.state.beatenLevels[String(node.level)];
      var isTomb = node.isTomb;
      var group = new THREE.Group();
      group.position.set(node.x, 0.2, node.z);
      group.userData = { nodeIndex: ni, node: node };

      if (isTomb) {
        var obelisk = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.7, 0),
          new THREE.MeshStandardMaterial({
            color: 0xffd93d,
            emissive: 0xff8800,
            emissiveIntensity: unlocked ? 0.6 : 0.1,
            metalness: 0.85,
            roughness: 0.15,
          })
        );
        obelisk.position.y = 1.2;
        group.add(obelisk);
        var pillar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.12, 2.4, 8),
          new THREE.MeshStandardMaterial({ color: 0x4a3820, metalness: 0.5, roughness: 0.4 })
        );
        pillar.position.y = 1.2;
        group.add(pillar);
      } else {
        var crystal = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.4, 1),
          new THREE.MeshStandardMaterial({
            color: unlocked ? 0x6ec6ff : 0x333333,
            emissive: unlocked ? 0x224466 : 0x000000,
            emissiveIntensity: 0.5,
            metalness: 0.6,
            roughness: 0.2,
            transparent: true,
            opacity: unlocked ? 0.95 : 0.4,
          })
        );
        crystal.position.y = 0.8;
        group.add(crystal);
      }

      if (unlocked) {
        var torch = new THREE.PointLight(isTomb ? 0xffaa44 : 0x88ccff, beaten ? 0.4 : 0.9, 5);
        torch.position.y = 1.5;
        group.add(torch);
        group.userData.torch = torch;
      }

      group.userData.unlocked = unlocked;
      group.userData.beaten = beaten;
      self.scene.add(group);
      self.nodeMeshes.push({ group: group, ni: ni });
    });
  };

  ExpeditionMap3D.prototype._bindEvents = function () {
    var self = this;
    this._onMove = function (ev) {
      var rect = self.renderer.domElement.getBoundingClientRect();
      self.pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      self.pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    };
    this._onClick = function () {
      self.raycaster.setFromCamera(self.pointer, self.camera);
      var hits = self.raycaster.intersectObjects(self.nodeMeshes.map(function (n) { return n.group; }), true);
      if (!hits.length) return;
      var obj = hits[0].object;
      while (obj.parent && obj.userData.nodeIndex === undefined) obj = obj.parent;
      if (obj.userData.nodeIndex === undefined || !obj.userData.unlocked) return;
      if (self.onNodePick) self.onNodePick(obj.userData.node, obj.userData.nodeIndex);
    };
    this.renderer.domElement.addEventListener("pointermove", this._onMove);
    this.renderer.domElement.addEventListener("click", this._onClick);
  };

  ExpeditionMap3D.prototype._animate = function (t) {
    this.camT = t * 0.06;
    if (this.curve) {
      var pt = this.curve.getPoint((Math.sin(this.camT) + 1) * 0.5);
      this.camera.position.set(pt.x + Math.sin(t * 0.2) * 2, 5 + Math.sin(t * 0.3), pt.z + 8);
      this.camera.lookAt(pt.x, 1, pt.z);
    }
    this.nodeMeshes.forEach(function (n) {
      n.group.position.y = 0.2 + Math.sin(t * 1.8 + n.ni) * 0.06;
      if (n.group.userData.torch && !n.group.userData.beaten) {
        n.group.userData.torch.intensity = 0.7 + Math.sin(t * 8 + n.ni) * 0.25;
      }
    });
    if (this.dust) this.dust.rotation.y = t * 0.015;
    this.renderer.render(this.scene, this.camera);
  };

  ExpeditionMap3D.prototype.destroy = function () {
    if (this.loopId) TE.stopLoop(this.loopId);
    if (this._onClick) this.renderer.domElement.removeEventListener("click", this._onClick);
    if (this._onMove) this.renderer.domElement.removeEventListener("pointermove", this._onMove);
    TE.disposeScene(this.scene);
    this.mount.innerHTML = "";
  };

  window.ExpeditionMap3D = {
    create: function (mount, chapterIdx, state, onNodePick) {
      if (instance) instance.destroy();
      instance = new ExpeditionMap3D(mount, chapterIdx, state, onNodePick);
      return instance;
    },
    get: function () { return instance; },
    destroy: function () { if (instance) { instance.destroy(); instance = null; } },
  };
})();
