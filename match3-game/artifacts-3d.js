/**
 * 三维文物展示
 */
(function () {
  "use strict";

  var instance = null;

  function buildMask() {
    var g = new THREE.Group();
    var face = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.5, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x4a6a3a, roughness: 0.55, metalness: 0.45 })
    );
    g.add(face);
    [-0.35, 0.35].forEach(function (x) {
      var eye = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.18, 0.9, 12),
        new THREE.MeshStandardMaterial({ color: 0x3a5530, metalness: 0.5, roughness: 0.4 })
      );
      eye.position.set(x, 0.15, 0.35);
      eye.rotation.x = Math.PI / 2;
      g.add(eye);
    });
    return g;
  }

  function buildStaff() {
    var g = new THREE.Group();
    var rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 2.2, 12),
      new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.85, roughness: 0.25 })
    );
    g.add(rod);
    var fin = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xffd93d, metalness: 0.9, roughness: 0.15 })
    );
    fin.position.y = 1.1;
    g.add(fin);
    return g;
  }

  function buildBird() {
    var g = new THREE.Group();
    var body = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffd93d, metalness: 0.92, roughness: 0.12 })
    );
    g.add(body);
    var wing = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.04, 0.25),
      new THREE.MeshStandardMaterial({ color: 0xe8a317, metalness: 0.88, roughness: 0.15 })
    );
    wing.position.y = 0.05;
    g.add(wing);
    return g;
  }

  function buildDefault(type) {
    var colors = [0x8b6914, 0xc9a227, 0x6ec6ff, 0xa08060, 0xf0e8d8, 0xffd93d];
    return new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.5, 0.15, 64, 8),
      new THREE.MeshStandardMaterial({ color: colors[type] || 0xc9a227, metalness: 0.5, roughness: 0.35 })
    );
  }

  var BUILDERS = [buildMask, buildStaff, buildDefault, buildDefault, buildDefault, buildBird];

  function ArtifactViewer3D(mount, typeId) {
    if (!window.ThreeEngine || !window.ThreeEngine.ok || !mount) {
      this.ok = false;
      return;
    }
    this.ok = true;
    this.mount = mount;
    this.typeId = typeId || 0;

    var scene = new THREE.Scene();
    scene.background = null;
    this.scene = scene;

    var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(0, 0.5, 3.5);
    this.camera = camera;

    this.renderer = window.ThreeEngine.createRenderer(mount, { exposure: 1.25 });
    window.ThreeEngine.addLights(scene, 1.4);

    var builder = BUILDERS[this.typeId] || buildDefault;
    this.model = builder(this.typeId);
    this.scene.add(this.model);

    var self = this;
    this.loopId = window.ThreeEngine.startLoop(function (t) {
      self._animate(t);
    });
    window.ThreeEngine.resizeObserver(mount, camera, this.renderer);
  }

  ArtifactViewer3D.prototype.setType = function (typeId) {
    if (this.model) {
      this.scene.remove(this.model);
      window.ThreeEngine.disposeScene(this.model);
    }
    this.typeId = typeId;
    var builder = BUILDERS[typeId] || buildDefault;
    this.model = builder(typeId);
    this.scene.add(this.model);
  };

  ArtifactViewer3D.prototype._animate = function (t) {
    if (this.model) {
      this.model.rotation.y = t * 0.6;
      this.model.rotation.x = Math.sin(t * 0.4) * 0.12;
    }
    this.renderer.render(this.scene, this.camera);
  };

  ArtifactViewer3D.prototype.destroy = function () {
    if (this.loopId) window.ThreeEngine.stopLoop(this.loopId);
    window.ThreeEngine.disposeScene(this.scene);
    this.mount.innerHTML = "";
  };

  window.ArtifactViewer3D = {
    create: function (mount, typeId) {
      if (instance) instance.destroy();
      instance = new ArtifactViewer3D(mount, typeId);
      return instance;
    },
    get: function () { return instance; },
    destroy: function () {
      if (instance) { instance.destroy(); instance = null; }
    },
  };
})();
