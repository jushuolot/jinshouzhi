/**
 * 博物馆实拍展柜 · 图鉴顶部（优先于几何 3D）
 */
(function () {
  "use strict";

  var instance = null;
  var catalog = window.MATCH3_ARTIFACT_PHOTOS || [];

  function entry(typeId) {
    return catalog[typeId] || catalog[0];
  }

  function buildDom(mount, typeId) {
    mount.innerHTML = "";
    var wrap = document.createElement("div");
    wrap.className = "artifact-museum";

    var stage = document.createElement("div");
    stage.className = "artifact-museum-stage";

    var glow = document.createElement("div");
    glow.className = "artifact-museum-glow";
    stage.appendChild(glow);

    var frame = document.createElement("div");
    frame.className = "artifact-museum-frame";

    var img = document.createElement("img");
    img.className = "artifact-museum-photo";
    img.draggable = false;
    img.decoding = "async";
    var e = entry(typeId);
    img.alt = e.name;
    img.src = e.src;

    frame.appendChild(img);
    stage.appendChild(frame);
    wrap.appendChild(stage);

    var cap = document.createElement("p");
    cap.className = "artifact-museum-caption";
    cap.textContent = e.name + " · " + e.ref;
    if (e.license) {
      cap.title = (e.source || "公开资料") + " · " + e.license + (e.author ? " · " + e.author : "");
    }
    wrap.appendChild(cap);

    mount.appendChild(wrap);
    return { wrap: wrap, img: img, cap: cap };
  }

  function Gallery(mount, typeId) {
    this.mount = mount;
    this.typeId = typeId || 0;
    this.ok = true;
    this.dom = buildDom(mount, this.typeId);
  }

  Gallery.prototype.setType = function (typeId) {
    this.typeId = typeId;
    var e = entry(typeId);
    if (this.dom && this.dom.img) {
      this.dom.img.classList.add("artifact-photo-switch");
      this.dom.img.src = e.src;
      this.dom.img.alt = e.name;
      window.setTimeout(function () {
        if (this.dom && this.dom.img) this.dom.img.classList.remove("artifact-photo-switch");
      }.bind(this), 320);
    }
    if (this.dom && this.dom.cap) {
      this.dom.cap.textContent = e.name + " · " + e.ref;
      if (e.license) {
        this.dom.cap.title =
          (e.source || "公开资料") + " · " + e.license + (e.author ? " · " + e.author : "");
      }
    }
  };

  Gallery.prototype.destroy = function () {
    if (this.mount) this.mount.innerHTML = "";
  };

  window.ArtifactGallery = {
    create: function (mount, typeId) {
      if (instance) instance.destroy();
      if (!mount) {
        instance = { ok: false, setType: function () {}, destroy: function () {} };
        return instance;
      }
      instance = new Gallery(mount, typeId);
      return instance;
    },
    get: function () {
      return instance;
    },
    destroy: function () {
      if (instance) {
        instance.destroy();
        instance = null;
      }
    },
  };
})();
