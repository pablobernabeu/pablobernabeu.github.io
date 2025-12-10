/*************************************************
 * Deferred Asset Loader
 * Loads non-critical JavaScript after page load
 **************************************************/

(function () {
  "use strict";

  // Configuration
  const config = {
    deferredScripts: [
      "/js/performance-monitor.js",
      "/js/search-optimizer.js",
      "/js/lazy-search.js",
    ],
    deferredStyles: ["/css/lazy-search.css"],
    loadDelay: 50, // Reduced delay for faster perceived performance
    debug: false,
  };

  function log(...args) {
    if (config.debug) {
      console.log("[DeferredLoader]", ...args);
    }
  }

  // Load CSS asynchronously
  function loadStylesheet(href) {
    return new Promise((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.onload = () => {
        log(`✅ Loaded stylesheet: ${href}`);
        resolve();
      };
      link.onerror = () => {
        log(`❌ Failed to load stylesheet: ${href}`);
        reject(new Error(`Failed to load stylesheet: ${href}`));
      };
      document.head.appendChild(link);
    });
  }

  // Load JavaScript asynchronously
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      // Check if script already loaded
      if (document.querySelector(`script[src="${src}"]`)) {
        log(`⚠️ Script already loaded: ${src}`);
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => {
        log(`✅ Loaded script: ${src}`);
        resolve();
      };
      script.onerror = () => {
        log(`❌ Failed to load script: ${src}`);
        reject(new Error(`Failed to load script: ${src}`));
      };
      document.head.appendChild(script);
    });
  }

  // Load all deferred assets
  async function loadDeferredAssets() {
    log("🚀 Starting deferred asset loading...");

    try {
      // Load stylesheets first (non-blocking)
      const stylePromises = config.deferredStyles.map((href) =>
        loadStylesheet(href).catch((err) =>
          log(`Stylesheet error: ${err.message}`)
        )
      );

      // Load scripts (can be blocking)
      const scriptPromises = config.deferredScripts.map((src) =>
        loadScript(src).catch((err) => log(`Script error: ${err.message}`))
      );

      // Wait for all assets
      await Promise.allSettled([...stylePromises, ...scriptPromises]);

      log("✅ Deferred asset loading complete");

      // Dispatch custom event
      document.dispatchEvent(new CustomEvent("deferredAssetsLoaded"));
    } catch (error) {
      log("❌ Error during deferred loading:", error);
    }
  }

  // Initialize loading based on page state
  function initLoader() {
    if (document.readyState === "complete") {
      // Page already loaded
      setTimeout(loadDeferredAssets, config.loadDelay);
    } else {
      // Wait for page load
      window.addEventListener("load", () => {
        setTimeout(loadDeferredAssets, config.loadDelay);
      });
    }
  }

  // Critical path optimization
  function optimizeCriticalPath() {
    // Preconnect to external domains
    const preconnectDomains = [
      "//fonts.googleapis.com",
      "//fonts.gstatic.com",
      "//www.google-analytics.com",
    ];

    preconnectDomains.forEach((domain) => {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = domain;
      link.crossOrigin = "anonymous";
      document.head.appendChild(link);
    });

    // Prefetch critical resources
    const prefetchResources = [
      "/index.json", // Search index
    ];

    // Only prefetch on fast connections
    if (
      "connection" in navigator &&
      navigator.connection.effectiveType !== "slow-2g"
    ) {
      prefetchResources.forEach((href) => {
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.href = href;
        document.head.appendChild(link);
      });
    }
  }

  // Image lazy loading optimization
  function optimizeImages() {
    // Add loading="lazy" to images without it
    const images = document.querySelectorAll("img:not([loading])");
    images.forEach((img) => {
      // Skip images in viewport
      const rect = img.getBoundingClientRect();
      const inViewport = rect.top < window.innerHeight && rect.bottom > 0;

      if (!inViewport) {
        img.loading = "lazy";
      }
    });
  }

  // Font optimization
  function optimizeFonts() {
    // Add font-display: swap to loaded fonts
    const fontLinks = document.querySelectorAll(
      'link[href*="fonts.googleapis.com"]'
    );
    fontLinks.forEach((link) => {
      if (!link.href.includes("display=swap")) {
        link.href += link.href.includes("?")
          ? "&display=swap"
          : "?display=swap";
      }
    });
  }

  // Service worker registration for caching
  function registerServiceWorker() {
    if ("serviceWorker" in navigator && window.location.protocol === "https:") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => log("Service Worker registered:", reg.scope))
        .catch((err) => log("Service Worker registration failed:", err));
    }
  }

  // Performance monitoring
  function monitorPerformance() {
    if ("PerformanceObserver" in window) {
      // Monitor Largest Contentful Paint
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        log(`LCP: ${Math.round(lastEntry.startTime)}ms`);
      });
      observer.observe({ entryTypes: ["largest-contentful-paint"] });
    }

    // Log page load time
    window.addEventListener("load", () => {
      setTimeout(() => {
        const loadTime =
          performance.timing.loadEventEnd - performance.timing.navigationStart;
        log(`Page load time: ${loadTime}ms`);
      }, 0);
    });
  }

  // Initialize everything
  function init() {
    log("🎯 Initializing performance optimizations...");

    optimizeCriticalPath();
    optimizeImages();
    optimizeFonts();
    registerServiceWorker();
    monitorPerformance();
    initLoader();
  }

  // Start when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Expose API for debugging
  window.DeferredLoader = {
    loadScript,
    loadStylesheet,
    config,
  };
})();
