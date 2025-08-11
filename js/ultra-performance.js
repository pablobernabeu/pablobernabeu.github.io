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

  // Override the search toggle function immediately
  function disableSearch() {
    // Find and disable search button
    const searchButton =
      document.querySelector('[data-target="#search"]') ||
      document.querySelector(".js-search") ||
      document.querySelector(".search-icon");

    if (searchButton) {
      searchButton.style.opacity = "0.6";
      searchButton.title = "Click to enable search";

      // Replace click handler
      searchButton.addEventListener(
        "click",
        function (e) {
          e.preventDefault();
          e.stopPropagation();

          if (!searchRequested) {
            enableSearch();
          }

          return false;
        },
        true
      );
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

    console.log("🔍 Enabling search functionality...");

    // Show loading state
    const searchButton =
      document.querySelector('[data-target="#search"]') ||
      document.querySelector(".js-search") ||
      document.querySelector(".search-icon");

    if (searchButton) {
      searchButton.style.opacity = "1";
      searchButton.title = "Loading search...";
      searchButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }

    // Load search dependencies
    loadSearchDependencies().then(() => {
      console.log("✅ Search enabled and ready");

      // Restore original functionality
      if (originalToggleSearchDialog) {
        window.toggleSearchDialog = originalToggleSearchDialog;
      }

      if (searchButton) {
        searchButton.innerHTML = '<i class="fas fa-search"></i>';
        searchButton.title = "Search";
      }

      // Auto-open search
      if (typeof window.toggleSearchDialog === "function") {
        window.toggleSearchDialog();
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
    console.log("🚀 Ultra-aggressive performance mode enabled");
    console.log("📊 Search disabled until requested");
    disableSearch();
  }

  // Start immediately
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
