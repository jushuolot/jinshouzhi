/**
 * Three.js 大片级引擎扩展
 */
(function () {
  "use strict";

  var activeLoops = [];

  function buildEngine() {
    if (typeof THREE === "undefined") return { ok: false };

    function createRenderer(mount, opts) {
    opts = opts || {};
    var w = mount.clientWidth || 400;
    var h = mount.clientHeight || 300;
    var renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: opts.alpha !== false,
      powerPreference: "high-performance",
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = opts.exposure || 1.35;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.innerHTML = "";
    var wrap = document.createElement("div");
    wrap.className = "blockbuster-canvas-wrap";
    wrap.appendChild(renderer.domElement);
    mount.appendChild(wrap);
    renderer.domElement.classList.add("blockbuster-canvas");
    return renderer;
  }

  function addCinematicLights(scene, intensity) {
    intensity = intensity || 1;
    scene.add(new THREE.AmbientLight(0x1a1520, 0.25 * intensity));
    var moon = new THREE.DirectionalLight(0xaaccff, 0.35 * intensity);
    moon.position.set(-8, 12, -6);
    scene.add(moon);
    var key = new THREE.SpotLight(0xffe4c4, 1.4 * intensity, 40, 0.45, 0.6, 1.2);
    key.position.set(5, 10, 7);
    key.castShadow = true;
    key.shadow.mapSize.width = 1024;
    key.shadow.mapSize.height = 1024;
    key.shadow.bias = -0.0002;
    scene.add(key);
    scene.userData.keyLight = key;
    var rim = new THREE.DirectionalLight(0xc9a227, 0.55 * intensity);
    rim.position.set(-6, 4, -8);
    scene.add(rim);
    var fill = new THREE.PointLight(0xff9040, 0.35 * intensity, 25);
    fill.position.set(0, 3, 4);
    scene.add(fill);
    scene.userData.fillLight = fill;
  }

  function createStarfield(scene, radius) {
    radius = radius || 80;
    var count = 1200;
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      var r = radius * (0.85 + Math.random() * 0.15);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.6 + 5;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    var stars = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, transparent: true, opacity: 0.85, depthWrite: false })
    );
    scene.add(stars);
    return stars;
  }

  function createDust(count, spread) {
    count = count || 400;
    spread = spread || 20;
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = Math.random() * spread * 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: 0xffd89b, size: 0.08, transparent: true, opacity: 0.45, depthWrite: false })
    );
  }

  function makeGradientTexture(c1, c2) {
    var c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    var ctx = c.getContext("2d");
    var g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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
    var id = { running: true, t0: performance.now() };
    activeLoops.push(id);
    function frame(now) {
      if (!id.running) return;
      requestAnimationFrame(frame);
      updateFn((now - id.t0) * 0.001);
    }
    requestAnimationFrame(frame);
    return id;
  }

  function stopLoop(id) {
    id.running = false;
  }

  function disposeObject(obj) {
    if (!obj) return;
    obj.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach(function (m) { m.dispose(); });
        else o.material.dispose();
      }
    });
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

    return {
      ok: true,
      createRenderer: createRenderer,
      addLights: function (s, i) { addCinematicLights(s, i); },
      addCinematicLights: addCinematicLights,
      createStarfield: createStarfield,
      createDust: createDust,
      makeGradientTexture: makeGradientTexture,
      easeInOutCubic: easeInOutCubic,
      resizeObserver: resizeObserver,
      startLoop: startLoop,
      stopLoop: stopLoop,
      disposeObject: disposeObject,
      disposeScene: disposeScene,
    };
  }

  window.ThreeEngine = buildEngine();
  window.ThreeEngine.retryInit = function () {
    if (window.ThreeEngine.ok) return true;
    if (typeof THREE === "undefined") return false;
    var built = buildEngine();
    Object.keys(built).forEach(function (k) {
      window.ThreeEngine[k] = built[k];
    });
    return window.ThreeEngine.ok;
  };
})();
