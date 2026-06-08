/**
 * 发现探点弹窗 · 打字机 + 入场 Gen.47
 */
(function () {
  "use strict";

  var typingTimer = null;

  function clearTyping() {
    if (typingTimer) {
      window.clearInterval(typingTimer);
      typingTimer = null;
    }
  }

  window.DiscoveryCinema = {
    reveal: function (modal) {
      if (!modal) return;
      modal.classList.remove("discovery-visible");
      window.requestAnimationFrame(function () {
        modal.classList.add("discovery-visible");
      });
    },

    hide: function (modal) {
      clearTyping();
      if (modal) modal.classList.remove("discovery-visible");
    },

    typeQuote: function (el, text, onTick, onDone) {
      clearTyping();
      if (!el) {
        if (onDone) onDone();
        return;
      }
      el.textContent = "";
      el.classList.add("typing");
      var i = 0;
      typingTimer = window.setInterval(function () {
        el.textContent += text.charAt(i);
        if (onTick && i % 2 === 0) onTick();
        i += 1;
        if (i >= text.length) {
          clearTyping();
          el.classList.remove("typing");
          if (onDone) onDone();
        }
      }, 28);
    },

    skipTyping: function (el, text) {
      clearTyping();
      if (el) {
        el.textContent = text || "";
        el.classList.remove("typing");
      }
    },
  };
})();
