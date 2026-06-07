/**
 * 章节三维探宝路线 · 探点 → 闯关
 */
(function () {
  "use strict";

  var instance = null;

  function ExpeditionMap3D(mount, chapterIdx, state, onNodePick) {
    if (!window.ThreeEngine || !window.ThreeEngine.ok || !mount) {
      this.ok = false;
      return;
    }
    this.ok = true;
    this.mount = mount;
    this.chapterIdx = chapterIdx;
    this.state = state;
    this.onNodePick = onNodePick;
    this.nodeMeshes = [];
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    var exp = window.MATCH3_EXPEDITION;
    this.nodes = exp && exp.chapters[chapterIdx] ? exp.chapters[chapterIdx].nodes : [];

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080604, 0.055);
    this.scene = scene;

    var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 80);
    camera.position.set(0, 7, 8);
    camera.lookAt(0, 0, -0.5);
    this.camera = camera;

    this.renderer = window.ThreeEngine.createRenderer(mount, { exposure: 1.15 });
    window.ThreeEngine.addLights(scene, 1);

    this._buildTunnel();
    this._buildNodes();
    this._bindEvents();

    var self = this;
    this.loopId = window.ThreeEngine.startLoop(function (t) {
      self._animate(t);
    });
  }

  ExpeditionMap3D.prototype._nodeUnlocked = function (ni) {
    if (ni === 0) return true;
    var prev = this.nodes[ni - 1];
    if (!prev) return false;
    return this.state.beatenLevels[prev.level] === true;
  };

  ExpeditionMap3D.prototype._buildTunnel = function () {
    var curve = new THREE.CatmullRomCurve3(
      this.nodes.map(function (n) {
        return new THREE.Vector3(n.x, 0.2, n.z);
      })
    );
    var tubeGeo = new THREE.TubeGeometry(curve, 64, 0.15, 8, false);
    var tube = new THREE.Mesh(
      tubeGeo,
      new THREE.MeshStandardMaterial({ color: 0x4a3820, roughness: 0.9, metalness: 0.1 })
    );
    this.scene.add(tube);

    var glowGeo = new THREE.TubeGeometry(curve, 64, 0.05, 6, false);
    var glow = new THREE.Mesh(
      glowGeo,
      new THREE.MeshBasicMaterial({ color: 0xc9a227, transparent: true, opacity: 0.35 })
    );
    glow.position.y = 0.05;
    this.scene.add(glow);
    this.curve = curve;
  };

  ExpeditionMap3D.prototype._buildNodes = function () {
    var self = this;
    this.nodes.forEach(function (node, ni) {
      var group = new THREE.Group();
      group.position.set(node.x, 0.3, node.z);
      group.userData = { nodeIndex: ni, node: node };

      var unlocked = self._nodeUnlocked(ni);
      var beaten = self.state.beatenLevels[node.level] === true;
      var isTomb = node.isTomb;

      var geo = isTomb
        ? new THREE.OctahedronGeometry(0.55, 0)
        : new THREE.SphereGeometry(0.35, 16, 16);
      var col = beaten ? 0x5cb85c : unlocked ? (isTomb ? 0xffd93d : 0xc9a227) : 0x444444;
      var mat = new THREE.MeshStandardMaterial({
        color: col,
        emissive: unlocked ? col : 0x000000,
        emissiveIntensity: isTomb ? 0.4 : 0.25,
        roughness: 0.4,
        metalness: isTomb ? 0.7 : 0.45,
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = isTomb ? 0.6 : 0.35;
      mesh.castShadow = true;
      group.add(mesh);

      if (isTomb) {
        var ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.8, 0.04, 8, 32),
          new THREE.MeshBasicMaterial({ color: 0xffd93d, transparent: true, opacity: 0.6 })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.1;
        group.add(ring);
      }

      var pl = new THREE.PointLight(unlocked ? 0xffe08a : 0x333333, unlocked ? 0.5 : 0.1, 4);
      pl.position.y = 1;
      group.add(pl);

      self.scene.add(group);
      self.nodeMeshes.push({ group: group, ni: ni, unlocked: unlocked, beaten: beaten });
    });
  };

  ExpeditionMap3D.prototype._bindEvents = function () {
    var self = this;
    this._onClick = function (ev) {
      var rect = self.renderer.domElement.getBoundingClientRect();
      self.pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      self.pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      self.raycaster.setFromCamera(self.pointer, self.camera);
      var hits = self.raycaster.intersectObjects(
        self.nodeMeshes.map(function (n) { return n.group; }),
        true
      );
      if (!hits.length) return;
      var obj = hits[0].object;
      while (obj.parent && obj.userData.nodeIndex === undefined) obj = obj.parent;
      if (obj.userData.nodeIndex === undefined) return;
      var ni = obj.userData.nodeIndex;
      if (!self._nodeUnlocked(ni)) return;
      if (self.onNodePick) self.onNodePick(obj.userData.node, ni);
    };
    this.renderer.domElement.addEventListener("click", this._onClick);
  };

  ExpeditionMap3D.prototype._animate = function (t) {
    var self = this;
    this.nodeMeshes.forEach(function (n) {
      n.group.position.y = 0.3 + Math.sin(t * 2 + n.ni) * 0.08;
      if (n.unlocked && !n.beaten) {
        n.group.rotation.y = t * 0.5;
      }
    });
    if (this.curve) {
      var pt = this.curve.getPoint((Math.sin(t * 0.15) + 1) * 0.5);
      this.camera.lookAt(pt.x, pt.y, pt.z);
    }
    this.renderer.render(this.scene, this.camera);
  };

  ExpeditionMap3D.prototype.destroy = function () {
    if (this.loopId) window.ThreeEngine.stopLoop(this.loopId);
    if (this._onClick) this.renderer.domElement.removeEventListener("click", this._onClick);
    window.ThreeEngine.disposeScene(this.scene);
    this.mount.innerHTML = "";
  };

  window.ExpeditionMap3D = {
    create: function (mount, chapterIdx, state, onNodePick) {
      if (instance) instance.destroy();
      instance = new ExpeditionMap3D(mount, chapterIdx, state, onNodePick);
      return instance;
    },
    get: function () { return instance; },
    destroy: function () {
      if (instance) { instance.destroy(); instance = null; }
    },
  };
})();
