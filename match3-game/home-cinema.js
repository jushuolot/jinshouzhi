/**
 * 首页氛围影院 · 浮尘文物 Gen.37
 */
(function () {
  "use strict";

  var running = false;
  var mount = null;

  var ICONS = ["🎭", "🪄", "📜", "🏺", "🦷", "🦅", "🧭", "🔦"];

  function ensureMount() {
    var home = document.getElementById("screen-home");
    if (!home) return null;
    mount = document.getElementById("home-atmosphere");
    if (!mount) {
      mount = document.createElement("div");
      mount.id = "home-atmosphere";
      mount.className = "home-atmosphere";
      mount.setAttribute("aria-hidden", "true");
      home.insertBefore(mount, home.firstChild);
    }
    return mount;
  }

  function buildScene() {
    var el = ensureMount();
    if (!el) return;
    el.innerHTML = "";

    var orb = document.createElement("div");
    orb.className = "home-glow-orb";
    orb.style.width = "55%";
    orb.style.height = "45%";
    orb.style.left = "22%";
    orb.style.top = "8%";
    el.appendChild(orb);

    for (var i = 0; i < 10; i++) {
      var dust = document.createElement("span");
      dust.className = "home-dust";
      dust.textContent = ICONS[i % ICONS.length];
      dust.style.left = 8 + Math.random() * 84 + "%";
      dust.style.bottom = "-8%";
      dust.style.setProperty("--dur", 12 + Math.random() * 10 + "s");
      dust.style.setProperty("--delay", Math.random() * 8 + "s");
      dust.style.setProperty("--drift", (Math.random() * 40 - 20) + "px");
      dust.style.setProperty("--peak", 0.12 + Math.random() * 0.14);
      el.appendChild(dust);
    }
  }

  window.HomeCinema = {
    start: function () {
      if (running) return;
      running = true;
      buildScene();
      var home = document.getElementById("screen-home");
      if (home) home.classList.add("home-cinema-on");
    },
    stop: function () {
      running = false;
      var home = document.getElementById("screen-home");
      if (home) home.classList.remove("home-cinema-on");
      if (mount) mount.innerHTML = "";
    },
  };
})();
