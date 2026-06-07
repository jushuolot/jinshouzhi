(function () {
  "use strict";

  const VISIT_KEY = "match3_landing_visits";

  function getSlot() {
    const params = new URLSearchParams(window.location.search);
    const slot = params.get("slot");
    if (slot === "level_end") return "level_end";
    return "level_start";
  }

  function getSponsor(slot) {
    const catalog = window.MATCH3_SPONSORS || {};
    return catalog[slot] || catalog.level_start;
  }

  function recordVisit(slot) {
    try {
      const raw = window.localStorage.getItem(VISIT_KEY);
      const data = raw ? JSON.parse(raw) : {};
      data[slot] = (data[slot] || 0) + 1;
      data.total = (data.total || 0) + 1;
      data.lastAt = Date.now();
      window.localStorage.setItem(VISIT_KEY, JSON.stringify(data));
      return data;
    } catch (e) {
      return null;
    }
  }

  function postLandingEvent(slot, action) {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") return;
    const sponsor = getSponsor(slot);
    const amount = action === "cta_click" ? sponsor.cpc * 0.3 : 0;
    try {
      void fetch("http://localhost:3920/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "landing_" + action,
          slot: slot,
          amount: amount,
          currency: "CNY",
          ts: Date.now(),
        }),
        keepalive: true,
      });
    } catch (e) {
      // ignore
    }
  }

  const slot = getSlot();
  const sponsor = getSponsor(slot);
  const stats = recordVisit(slot);
  postLandingEvent(slot, "view");

  document.getElementById("slot-badge").textContent = sponsor.badge;
  document.getElementById("hero-icon").textContent = sponsor.icon;
  document.getElementById("hero-title").textContent = sponsor.headline;
  document.getElementById("hero-sponsor").textContent = sponsor.sponsor;
  document.getElementById("hero-teaser").textContent = sponsor.teaser;
  document.getElementById("hero-price").textContent = sponsor.price;
  document.getElementById("hero-price-note").textContent = sponsor.priceNote;
  document.getElementById("cta-btn").textContent = sponsor.cta;

  const list = document.getElementById("bullet-list");
  sponsor.bullets.forEach(function (item) {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });

  if (stats) {
    document.getElementById("stats-line").textContent =
      "本赞助位累计访问 " + (stats[slot] || 1) + " 次（本地统计）";
  }

  document.getElementById("cta-btn").addEventListener("click", function () {
    postLandingEvent(slot, "cta_click");
    document.getElementById("toast").textContent =
      "演示模式：已记录转化意向。有真实商品后，此处可跳转支付页。";
  });

  document.getElementById("share-btn").addEventListener("click", function () {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      void navigator.clipboard.writeText(url).then(function () {
        document.getElementById("toast").textContent = "链接已复制，可发给广告主查看效果";
      });
    } else {
      document.getElementById("toast").textContent = url;
    }
  });
})();
