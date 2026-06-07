/**
 * Three.js 共享引擎
 */
(function () {
  "use strict";

  if (typeof THREE === "undefined") {
    window.ThreeEngine = { ok: false };
    return;
  }

  var activeLoops = [];

  function createRenderer(mount, opts) {
    opts = opts || {};
    var w = mount.clientWidth || 400;
    var h = mount.clientHeight || 300;
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = opts.exposure || 1.05;
    mount.innerHTML = "";
    mount.appendChild(renderer.domElement);
    return renderer;
  }

  function addLights(scene, intensity) {
    intensity = intensity || 1;
    var amb = new THREE.AmbientLight(0xc9a882, 0.35 * intensity);
    scene.add(amb);
    var key = new THREE.DirectionalLight(0xffe8c8, 0.9 * intensity);
    key.position.set(4, 8, 5);
    key.castShadow = true;
    scene.add(key);
    var rim = new THREE.DirectionalLight(0x6ec6ff, 0.25 * intensity);
    rim.position.set(-5, 3, -4);
    scene.add(rim);
    var fill = new THREE.PointLight(0xc9a227, 0.4 * intensity, 20);
    fill.position.set(0, 2, 3);
    scene.add(fill);
  }

  function resizeObserver(mount, camera, renderer, onResize) {
    function resize() {
      var w = mount.clientWidth || 400;
      var h = mount.clientHeight || 300;
      if (camera.aspect !== undefined) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
      renderer.setSize(w, h);
      if (onResize) onResize(w, h);
    }
    resize();
    window.addEventListener("resize", resize);
    return resize;
  }

  function startLoop(updateFn) {
    var id = { running: true };
    activeLoops.push(id);
    function frame(t) {
      if (!id.running) return;
      requestAnimationFrame(frame);
      updateFn(t * 0.001);
    }
    requestAnimationFrame(frame);
    return id;
  }

  function stopLoop(id) {
    id.running = false;
  }

  function disposeScene(scene) {
    scene.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach(function (m) { m.dispose(); });
        else o.material.dispose();
      }
    });
  }

  window.ThreeEngine = {
    ok: true,
    createRenderer: createRenderer,
    addLights: addLights,
    resizeObserver: resizeObserver,
    startLoop: startLoop,
    stopLoop: stopLoop,
    disposeScene: disposeScene,
  };
})();
