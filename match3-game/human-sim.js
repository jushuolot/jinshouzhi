/**
 * 真人模拟级肖像引擎 · 参考 Sims / 恋与 / 主机角色创建器
 * 次表面皮肤 · 虹膜 · 发束 · 眨眼 · 口型
 */
(function () {
  "use strict";

  if (typeof THREE === "undefined") {
    window.HumanSim = { ok: false };
    return;
  }

  var TE = window.ThreeEngine;

  function hex(c) {
    return new THREE.Color(c);
  }

  function makeNoiseNormal(size) {
    size = size || 128;
    var c = document.createElement("canvas");
    c.width = c.height = size;
    var ctx = c.getContext("2d");
    var img = ctx.createImageData(size, size);
    for (var y = 0; y < size; y++) {
      for (var x = 0; x < size; x++) {
        var i = (y * size + x) * 4;
        var n = 118 + Math.floor((Math.random() - 0.5) * 28);
        img.data[i] = n;
        img.data[i + 1] = n;
        img.data[i + 2] = 255;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }

  function makeIrisTexture(hue, sat) {
    var c = document.createElement("canvas");
    c.width = c.height = 64;
    var ctx = c.getContext("2d");
    var g = ctx.createRadialGradient(32, 32, 4, 32, 32, 28);
    g.addColorStop(0, "hsl(" + hue + ", " + sat + "%, 18%)");
    g.addColorStop(0.35, "hsl(" + hue + ", " + (sat + 10) + "%, 32%)");
    g.addColorStop(0.7, "hsl(" + (hue + 8) + ", " + sat + "%, 42%)");
    g.addColorStop(1, "hsl(" + hue + ", " + (sat - 5) + "%, 22%)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    for (var i = 0; i < 14; i++) {
      ctx.beginPath();
      ctx.moveTo(32, 32);
      var a = (i / 14) * Math.PI * 2;
      ctx.lineTo(32 + Math.cos(a) * 26, 32 + Math.sin(a) * 26);
      ctx.stroke();
    }
    var tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function skinMaterial(def, opts) {
    opts = opts || {};
    var mat = new THREE.MeshPhysicalMaterial({
      color: opts.dark ? def.skinDark : def.skin,
      roughness: opts.dark ? 0.62 : 0.48,
      metalness: 0.0,
      clearcoat: 0.22,
      clearcoatRoughness: 0.35,
      sheen: 0.35,
      sheenRoughness: 0.55,
      sheenColor: hex(0xffdcc8),
    });
    var nMap = makeNoiseNormal(96);
    mat.normalMap = nMap;
    mat.normalScale = new THREE.Vector2(0.08, 0.08);
    mat.onBeforeCompile = function (shader) {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <output_fragment>",
        [
          "vec3 viewDir = normalize(vViewPosition);",
          "float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 2.0);",
          "outgoingLight += diffuseColor.rgb * vec3(1.0, 0.72, 0.58) * fresnel * 0.22;",
          "outgoingLight += diffuseColor.rgb * 0.06 * (1.0 - abs(dot(normalize(vNormal), viewDir)));",
          "#include <output_fragment>",
        ].join("\n")
      );
    };
    return mat;
  }

  function buildEye(side, def, bulk, y) {
    var g = new THREE.Group();
    var sx = side * 0.115 * bulk;
    var irisHue = def.irisHue != null ? def.irisHue : 28;
    var irisSat = def.irisSat != null ? def.irisSat : 42;

    var sclera = new THREE.Mesh(
      new THREE.SphereGeometry(0.052 * bulk, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0xf5efe6, roughness: 0.35, metalness: 0.0 })
    );
    sclera.scale.set(1.15, 0.92, 0.75);
    g.add(sclera);

    var iris = new THREE.Mesh(
      new THREE.CircleGeometry(0.022 * bulk, 24),
      new THREE.MeshStandardMaterial({
        map: makeIrisTexture(irisHue, irisSat),
        roughness: 0.25,
        metalness: 0.05,
      })
    );
    iris.position.set(0, 0, 0.038 * bulk);
    g.add(iris);

    var pupil = new THREE.Mesh(
      new THREE.CircleGeometry(0.009 * bulk, 16),
      new THREE.MeshBasicMaterial({ color: 0x050505 })
    );
    pupil.position.set(0, 0, 0.039 * bulk);
    g.add(pupil);

    var cornea = new THREE.Mesh(
      new THREE.SphereGeometry(0.054 * bulk, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.55),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.12,
        roughness: 0.05,
        metalness: 0.0,
        transmission: 0.85,
        thickness: 0.2,
        ior: 1.38,
      })
    );
    cornea.scale.set(1.1, 0.95, 0.8);
    g.add(cornea);

    var lidTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.056 * bulk, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.42),
      skinMaterial(def, { dark: true })
    );
    lidTop.position.y = 0.012 * bulk;
    lidTop.rotation.x = -0.15;
    g.add(lidTop);

    var lidBot = new THREE.Mesh(
      new THREE.SphereGeometry(0.048 * bulk, 16, 10, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.35),
      skinMaterial(def, { dark: true })
    );
    lidBot.position.y = -0.018 * bulk;
    g.add(lidBot);

    g.position.set(sx, y, 0.31 * bulk);
    g.userData.lidTop = lidTop;
    g.userData.lidBot = lidBot;
    g.userData.blink = 0;
    return g;
  }

  function addHairStrand(root, def, bulk, seed) {
    var pts = [];
    var n = 5 + (seed % 3);
    for (var i = 0; i < n; i++) {
      pts.push(
        new THREE.Vector3(
          (Math.sin(seed + i * 0.7) * 0.15 + (seed % 5) * 0.02 - 0.05) * bulk,
          (1.72 + i * 0.08 + Math.sin(seed + i) * 0.04) * bulk,
          (0.08 + i * 0.04 + Math.cos(seed * 0.3 + i) * 0.06) * bulk
        )
      );
    }
    var curve = new THREE.CatmullRomCurve3(pts);
    var tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 12, 0.018 * bulk * (0.8 + (seed % 4) * 0.08), 6, false),
      new THREE.MeshStandardMaterial({
        color: def.hair,
        roughness: 0.88,
        metalness: 0.04,
        flatShading: true,
      })
    );
    root.add(tube);
    return tube;
  }

  function buildHair(def, bulk, feminine) {
    var root = new THREE.Group();
    var cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.41 * bulk, 32, 32, 0, Math.PI * 2, 0, feminine ? 0.72 : 0.58),
      new THREE.MeshStandardMaterial({ color: def.hair, roughness: 0.92, metalness: 0.03 })
    );
    cap.position.y = 1.68 * bulk;
    cap.scale.set(1.02, feminine ? 1.05 : 0.95, 0.98);
    root.add(cap);
    var count = feminine ? 38 : 28;
    for (var i = 0; i < count; i++) addHairStrand(root, def, bulk, i * 1.7 + (def.hair % 7));
    if (feminine) {
      for (var j = 0; j < 12; j++) {
        var longPts = [
          new THREE.Vector3((j - 6) * 0.04 * bulk, 1.55 * bulk, 0.15 * bulk),
          new THREE.Vector3((j - 6) * 0.05 * bulk, 1.05 * bulk, 0.22 * bulk),
          new THREE.Vector3((j - 6) * 0.06 * bulk, 0.55 * bulk, 0.18 * bulk),
        ];
        var lc = new THREE.CatmullRomCurve3(longPts);
        root.add(
          new THREE.Mesh(
            new THREE.TubeGeometry(lc, 8, 0.014 * bulk, 5, false),
            new THREE.MeshStandardMaterial({ color: def.hair, roughness: 0.9 })
          )
        );
      }
    }
    return root;
  }

  function buildPortrait(def) {
    var g = new THREE.Group();
    var bulk = def.bulk || 1;
    var fem = !!def.feminine;
    var jawW = fem ? 0.28 : 0.32;

    var torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38 * bulk, 0.52 * bulk, 1.15, 32),
      new THREE.MeshStandardMaterial({
        color: def.coat,
        roughness: 0.72,
        metalness: 0.08,
        normalMap: makeNoiseNormal(64),
        normalScale: new THREE.Vector2(0.12, 0.12),
      })
    );
    torso.position.y = 0.68;
    g.add(torso);

    var shirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22 * bulk, 0.28 * bulk, 0.35, 16),
      skinMaterial(def, false)
    );
    shirt.position.y = 1.12;
    g.add(shirt);

    var neck = new THREE.Mesh(new THREE.CylinderGeometry(0.11 * bulk, 0.14 * bulk, 0.32, 20), skinMaterial(def, false));
    neck.position.y = 1.28;
    g.add(neck);

    var head = new THREE.Mesh(new THREE.SphereGeometry(0.36 * bulk, 64, 64), skinMaterial(def, false));
    head.position.y = 1.58;
    head.scale.set(fem ? 0.94 : 1, fem ? 1.06 : 1.08, fem ? 0.9 : 0.92);
    g.add(head);

    var cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.08 * bulk, 16, 16), skinMaterial(def, false));
    cheekL.position.set(-0.18 * bulk, 1.52, 0.22 * bulk);
    cheekL.scale.set(1, 0.7, 0.6);
    g.add(cheekL);
    var cheekR = cheekL.clone();
    cheekR.position.x = 0.18 * bulk;
    g.add(cheekR);

    var jaw = new THREE.Mesh(new THREE.BoxGeometry(jawW * bulk, 0.16 * bulk, 0.24 * bulk), skinMaterial(def, true));
    jaw.position.set(0, 1.42, 0.14 * bulk);
    g.add(jaw);

    var upperLip = new THREE.Mesh(
      new THREE.BoxGeometry(0.14 * bulk, 0.035 * bulk, 0.04 * bulk),
      new THREE.MeshStandardMaterial({ color: def.skinDark, roughness: 0.45 })
    );
    upperLip.position.set(0, 1.46, 0.33 * bulk);
    g.add(upperLip);

    var lowerLip = new THREE.Mesh(
      new THREE.BoxGeometry(0.12 * bulk, 0.04 * bulk, 0.045 * bulk),
      new THREE.MeshStandardMaterial({ color: 0x9a5048, roughness: 0.38, metalness: 0.02 })
    );
    lowerLip.position.set(0, 1.435, 0.335 * bulk);
    g.add(lowerLip);

    var nose = new THREE.Mesh(new THREE.CapsuleGeometry(0.045 * bulk, 0.1 * bulk, 6, 12), skinMaterial(def, true));
    nose.position.set(0, 1.52, 0.34 * bulk);
    nose.rotation.x = Math.PI * 0.42;
    nose.scale.set(fem ? 0.85 : 1, 1, fem ? 0.9 : 1);
    g.add(nose);

    var browL = new THREE.Mesh(
      new THREE.BoxGeometry(0.09 * bulk, 0.018 * bulk, 0.025 * bulk),
      new THREE.MeshStandardMaterial({ color: def.hair, roughness: 0.95 })
    );
    browL.position.set(-0.11 * bulk, 1.66, 0.3 * bulk);
    browL.rotation.z = 0.12;
    g.add(browL);
    var browR = browL.clone();
    browR.position.x = 0.11 * bulk;
    browR.rotation.z = -0.12;
    g.add(browR);

    var eyeY = 1.6;
    var eyeL = buildEye(-1, def, bulk, eyeY);
    var eyeR = buildEye(1, def, bulk, eyeY);
    g.add(eyeL);
    g.add(eyeR);

    g.add(buildHair(def, bulk, fem));

    [-1, 1].forEach(function (s) {
      var ear = new THREE.Mesh(
        new THREE.SphereGeometry(0.055 * bulk, 12, 12),
        skinMaterial(def, true)
      );
      ear.position.set(s * 0.34 * bulk, 1.54, -0.02 * bulk);
      ear.scale.set(0.55, 0.85, 0.45);
      g.add(ear);
    });

    if (def.glasses) {
      [-0.115, 0.115].forEach(function (x) {
        var lens = new THREE.Mesh(
          new THREE.TorusGeometry(0.055 * bulk, 0.008, 8, 24),
          new THREE.MeshStandardMaterial({ color: 0x8899aa, metalness: 0.9, roughness: 0.12 })
        );
        lens.position.set(x * bulk, eyeY, 0.33 * bulk);
        g.add(lens);
      });
      var bridge = new THREE.Mesh(
        new THREE.BoxGeometry(0.04 * bulk, 0.008, 0.008),
        new THREE.MeshStandardMaterial({ color: 0x8899aa, metalness: 0.85, roughness: 0.15 })
      );
      bridge.position.set(0, eyeY + 0.01, 0.335 * bulk);
      g.add(bridge);
    }

    if (def.hat) {
      var brim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.52 * bulk, 0.52 * bulk, 0.04, 32),
        new THREE.MeshStandardMaterial({ color: 0x1a1208, roughness: 0.86 })
      );
      brim.position.y = 1.9;
      g.add(brim);
      var crown = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28 * bulk, 0.32 * bulk, 0.38, 24),
        new THREE.MeshStandardMaterial({ color: 0x2a2010, roughness: 0.8 })
      );
      crown.position.y = 2.1;
      g.add(crown);
    }

    if (def.gold) {
      var tooth = new THREE.Mesh(
        new THREE.BoxGeometry(0.045, 0.03, 0.018),
        new THREE.MeshStandardMaterial({ color: 0xffd93d, metalness: 0.96, roughness: 0.1 })
      );
      tooth.position.set(0.06 * bulk, 1.445, 0.345 * bulk);
      g.add(tooth);
    }

    g.userData.jaw = jaw;
    g.userData.lowerLip = lowerLip;
    g.userData.head = head;
    g.userData.browL = browL;
    g.userData.browR = browR;
    g.userData.eyes = [eyeL, eyeR];
    g.userData.blinkTimer = Math.random() * 2;
    return g;
  }

  function addPortraitRig(scene) {
    scene.add(new THREE.AmbientLight(0xfff0e8, 0.32));
    var key = new THREE.SpotLight(0xfff5eb, 2.2, 35, 0.38, 0.55, 1.1);
    key.position.set(2.5, 3.2, 4.5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    scene.userData.keyLight = key;
    var fill = new THREE.DirectionalLight(0xc8d8ff, 0.45);
    fill.position.set(-3, 2, 3);
    scene.add(fill);
    var rim = new THREE.DirectionalLight(0xffc870, 0.65);
    rim.position.set(-2, 2.5, -4);
    scene.add(rim);
    scene.userData.rimLight = rim;
    var hair = new THREE.PointLight(0xffffff, 0.35, 12);
    hair.position.set(0, 3.5, 1);
    scene.add(hair);
  }

  function animatePortrait(bust, t, talking) {
    if (!bust) return;
    bust.position.y = Math.sin(t * 0.5) * 0.018;
    bust.rotation.y = Math.sin(t * 0.18) * 0.04;
    bust.rotation.z = Math.sin(t * 0.22) * 0.012;

    if (talking && bust.userData.jaw) {
      var m = Math.sin(t * 16) * 0.5 + 0.5;
      bust.userData.jaw.rotation.x = m * 0.09;
      bust.userData.jaw.position.y = 1.42 - m * 0.012;
      if (bust.userData.lowerLip) {
        bust.userData.lowerLip.position.y = 1.435 - m * 0.008;
        bust.userData.lowerLip.scale.y = 1 + m * 0.15;
      }
      if (bust.userData.browL) {
        bust.userData.browL.position.y = 1.66 + m * 0.008;
        bust.userData.browR.position.y = 1.66 + m * 0.008;
      }
    }

    bust.userData.blinkTimer = (bust.userData.blinkTimer || 0) + 0.016;
    var blinkPhase = bust.userData.blinkTimer % 4.2;
    var b = (blinkPhase - 3.85) / 0.12;
    var blink = b >= 0 && b <= 1 ? (b < 0.5 ? b * 2 : 2 - b * 2) : 0;
    (bust.userData.eyes || []).forEach(function (eye) {
      if (eye.userData.lidTop) eye.userData.lidTop.scale.y = 1 - blink * 0.85;
      if (eye.userData.lidBot) eye.userData.lidBot.scale.y = 1 - blink * 0.55;
    });
  }

  window.HumanSim = {
    ok: true,
    buildPortrait: buildPortrait,
    addPortraitRig: addPortraitRig,
    animatePortrait: animatePortrait,
    skinMaterial: skinMaterial,
  };
})();
