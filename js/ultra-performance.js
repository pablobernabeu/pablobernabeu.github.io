/*************************************************
 * Ultra-Aggressive Search Optimization
 * Completely disables search until explicitly requested
 **************************************************/

(function () {
  "use strict";

  // Track if search has been initialized
  let searchInitialized = false;
  let searchRequested = false;

  // Store original search functions
  let originalToggleSearchDialog = null;

  // Store reference to capturing handler for removal later
  let captureHandler = null;

  // Override the search toggle function immediately
  function disableSearch() {
    // Find the search link - the menu item uses .js-search-trigger on inner elements
    const triggerEl = document.querySelector(".js-search-trigger");
    const searchButton = triggerEl
      ? triggerEl.closest("a") || triggerEl
      : document.querySelector('[data-target="#search"]') ||
        document.querySelector(".js-search") ||
        document.querySelector(".search-icon");

    if (searchButton) {
      // Prevent the <a href="#"> from navigating
      searchButton.setAttribute("href", "javascript:void(0)");
      searchButton.style.opacity = "0.6";
      searchButton.title = "Click to enable search";

      // Replace click handler
      captureHandler = function (e) {
        e.preventDefault();
        e.stopPropagation();

        if (!searchRequested) {
          enableSearch();
        }

        return false;
      };
      searchButton.addEventListener("click", captureHandler, true);
    }

    // Override global search function
    if (typeof window.toggleSearchDialog === "function") {
      originalToggleSearchDialog = window.toggleSearchDialog;
      window.toggleSearchDialog = function () {
        if (!searchRequested) {
          enableSearch();
          return;
        }

        if (originalToggleSearchDialog) {
          originalToggleSearchDialog();
        }
      };
    }
  }

  // Enable search and load all dependencies
  function enableSearch() {
    if (searchRequested) return;
    searchRequested = true;

    // Show loading state
    const triggerEl = document.querySelector(".js-search-trigger");
    const searchButton = triggerEl
      ? triggerEl.closest("a") || triggerEl
      : document.querySelector('[data-target="#search"]') ||
        document.querySelector(".js-search") ||
        document.querySelector(".search-icon");

    if (searchButton) {
      searchButton.style.opacity = "1";
      searchButton.title = "Loading search...";
      searchButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }

    // Load search dependencies
    loadSearchDependencies().then(() => {

      if (searchButton) {
        searchButton.innerHTML = '<i class="fas fa-search"></i>';
        searchButton.title = "Search";

        // Remove the capturing handler so future clicks go through normally
        if (captureHandler) {
          searchButton.removeEventListener("click", captureHandler, true);
        }
      }

      // Open search directly via DOM (avoids race conditions with function overrides)
      if (!$("body").hasClass("searching")) {
        if (
          !$("#fancybox-style-noscroll").length &&
          document.body.scrollHeight > window.innerHeight
        ) {
          $("head").append(
            '<style id="fancybox-style-noscroll">.compensate-for-scrollbar{margin-right:' +
              (window.innerWidth - document.documentElement.clientWidth) +
              "px;}</style>"
          );
          $("body").addClass("compensate-for-scrollbar");
        }
        $("body").addClass("searching");
        $(".search-results")
          .css({ opacity: 0, visibility: "visible" })
          .animate({ opacity: 1 }, 200);
        $("#search-query").focus();
      }
    });
  }

  // Load all search-related files
  async function loadSearchDependencies() {
    const dependencies = [
      "/js/search-optimizer.js",
      "/js/lazy-search.js",
      "/css/lazy-search.css",
    ];

    const promises = dependencies.map((dep) => {
      if (dep.endsWith(".css")) {
        return loadStylesheet(dep);
      } else {
        return loadScript(dep);
      }
    });

    await Promise.all(promises);

    // Wait a bit for initialization
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function loadStylesheet(href) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`link[href="${href}"]`)) {
        resolve();
        return;
      }

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }

  // Initialize when DOM is ready
  function init() {
    disableSearch();
  }

  // Start immediately
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
