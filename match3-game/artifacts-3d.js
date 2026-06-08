/**
 * 博物馆级 3D 文物
 */
(function () {
  "use strict";

  var instance = null;

  function eng() {
    var TE = window.ThreeEngine;
    if (TE && !TE.ok && TE.retryInit) TE.retryInit();
    return TE && TE.ok ? TE : null;
  }

  function buildMask() {
    var g = new THREE.Group();
    var face = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.7, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x3d5a30, roughness: 0.42, metalness: 0.55, emissive: 0x0a1508, emissiveIntensity: 0.15 })
    );
    g.add(face);
    [-0.42, 0.42].forEach(function (x) {
      var eye = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.2, 1.1, 16),
        new THREE.MeshStandardMaterial({ color: 0x2a4020, metalness: 0.6, roughness: 0.35 })
      );
      eye.position.set(x, 0.2, 0.45);
      eye.rotation.x = Math.PI / 2;
      g.add(eye);
    });
    [-0.55, 0.55].forEach(function (x) {
      var ear = new THREE.Mesh(
        new THREE.TorusGeometry(0.25, 0.08, 8, 16, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0x3d5a30, metalness: 0.5, roughness: 0.4 })
      );
      ear.position.set(x, 0, 0);
      ear.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2;
      g.add(ear);
    });
    return g;
  }

  function buildStaff() {
    var g = new THREE.Group();
    var rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.07, 2.4, 16),
      new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.92, roughness: 0.18 })
    );
    g.add(rod);
    var fin = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0xffe080, metalness: 0.95, roughness: 0.1, emissive: 0x664400, emissiveIntensity: 0.3 })
    );
    fin.position.y = 1.2;
    g.add(fin);
    for (var i = 0; i < 3; i++) {
      var band = new THREE.Mesh(
        new THREE.TorusGeometry(0.07, 0.015, 8, 24),
        new THREE.MeshStandardMaterial({ color: 0xffd93d, metalness: 0.9, roughness: 0.15 })
      );
      band.position.y = -0.6 + i * 0.5;
      band.rotation.x = Math.PI / 2;
      g.add(band);
    }
    return g;
  }

  function buildBird() {
    var g = new THREE.Group();
    var disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 0.02, 48),
      new THREE.MeshStandardMaterial({ color: 0xffd93d, metalness: 0.95, roughness: 0.08, emissive: 0xaa6600, emissiveIntensity: 0.25 })
    );
    g.add(disc);
    for (var i = 0; i < 4; i++) {
      var a = (i / 4) * Math.PI * 2;
      var bird = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.35, 8),
        new THREE.MeshStandardMaterial({ color: 0xffe066, metalness: 0.9, roughness: 0.12 })
      );
      bird.position.set(Math.cos(a) * 0.45, 0.05, Math.sin(a) * 0.45);
      bird.rotation.z = -Math.PI / 2;
      bird.rotation.y = -a;
      g.add(bird);
    }
    return g;
  }

  function buildPedestalModel(modelFn, typeId) {
    var g = new THREE.Group();
    var ped = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1, 0.15, 32),
      new THREE.MeshStandardMaterial({ color: 0x1a1510, roughness: 0.9, metalness: 0.1 })
    );
    ped.position.y = -0.9;
    ped.receiveShadow = true;
    g.add(ped);
    var m = modelFn(typeId);
    m.position.y = 0.2;
    g.add(m);
    return g;
  }

  var BUILDERS = [buildMask, buildStaff, buildMask, buildStaff, buildStaff, buildBird];

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
    scene.fog = new THREE.FogExp2(0x0a0806, 0.06);
    this.scene = scene;

    var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.set(0, 0.8, 3.8);
    this.camera = camera;

    this.renderer = TE.createRenderer(mount, { exposure: 1.5, alpha: false });
    scene.background = new THREE.Color(0x0a0806);
    TE.addCinematicLights(scene, 1.6);

    var spot = new THREE.SpotLight(0xffe8c8, 2, 15, 0.35, 0.5, 1);
    spot.position.set(2, 5, 3);
    scene.add(spot);

    this.setType(typeId);

    var self = this;
    this.loopId = TE.startLoop(function (t) { self._animate(t); });
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
    var builder = BUILDERS[typeId] || BUILDERS[0];
    this.model = buildPedestalModel(builder, typeId);
    this.scene.add(this.model);
  };

  ArtifactViewer3D.prototype._animate = function (t) {
    if (this.model) {
      this.model.rotation.y = t * 0.5;
      this.model.position.y = Math.sin(t * 0.8) * 0.04;
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
    get: function () { return instance; },
    destroy: function () { if (instance) { instance.destroy(); instance = null; } },
  };
})();
