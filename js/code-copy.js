// Copy buttons for code blocks.
//
// Posts that load xaringanExtra's clipboard helper get their buttons from it, and
// this script gives every other page the same control, so that copying code does
// not depend on a post having asked for it. The buttons share one set of styles in
// custom.scss, which keeps them in the tab order and fades them in on hover or focus.
//
// The confirmation is announced through a status region appended to <body>. It is a
// <span> at the very end, because custom.scss positions many rules by <body>'s
// children and selects the footer as its last <div> (see baseof.html).
(function () {
  "use strict";

  if (window.xaringanExtraClipboard) return;
  if (!document.querySelector(".article-style pre > code")) return;

  var LABEL = "Copy Code"; // the wording xaringanExtra is given on the other posts
  var DONE = "Copied!";
  var status = document.createElement("span");
  status.className = "sr-only";
  status.setAttribute("role", "status");
  document.body.appendChild(status);

  function fallbackCopy(text) {
    var box = document.createElement("textarea");
    box.value = text;
    box.setAttribute("readonly", "");
    box.style.position = "fixed";
    box.style.opacity = "0";
    document.body.appendChild(box);
    box.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {}
    box.remove();
    return ok ? Promise.resolve() : Promise.reject(new Error("copy failed"));
  }

  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        return fallbackCopy(text);
      });
    }
    return fallbackCopy(text);
  }

  function attach(pre) {
    var code = pre.querySelector(":scope > code");
    if (!code || pre.querySelector(":scope > .code-copy-button")) return;
    var button = document.createElement("button");
    button.type = "button";
    button.className = "code-copy-button";
    button.textContent = LABEL;
    button.setAttribute("aria-label", "Copy code to clipboard");
    var timer = null;
    button.addEventListener("click", function () {
      copy(code.innerText).then(function () {
        button.textContent = DONE;
        button.classList.add("is-copied");
        status.textContent = "Code copied to clipboard";
      }, function () {
        button.textContent = "Press Ctrl+C to Copy";
        button.classList.add("is-copied");
        status.textContent = "Copying failed. Select the code and press Ctrl+C.";
      }).then(function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          button.textContent = LABEL;
          button.classList.remove("is-copied");
          status.textContent = "";
        }, 2500);
      });
    });
    pre.appendChild(button);
  }

  var blocks = document.querySelectorAll(".article-style pre");
  for (var i = 0; i < blocks.length; i++) {
    var pre = blocks[i];
    if (pre.classList.contains("mermaid") || pre.closest(".emgithub-container")) continue;
    attach(pre);
  }
})();
