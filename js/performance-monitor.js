/*************************************************
 * Performance Monitor
 * Tracks and reports website performance metrics
 **************************************************/

class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.initialized = false;
    this.init();
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Start monitoring immediately
    this.measureLoadTime();
    this.measureCoreWebVitals();
    this.measureResourceTiming();

    // Report after page load
    window.addEventListener("load", () => {
      setTimeout(() => this.reportMetrics(), 1000);
    });
  }

  measureLoadTime() {
    const navigation = performance.getEntriesByType("navigation")[0];
    if (navigation) {
      this.metrics.loadTime = Math.round(
        navigation.loadEventEnd - navigation.fetchStart
      );
      this.metrics.domContentLoaded = Math.round(
        navigation.domContentLoadedEventEnd - navigation.fetchStart
      );
      this.metrics.firstPaint = this.getFirstPaint();
      this.metrics.firstContentfulPaint = this.getFirstContentfulPaint();
    }
  }

  getFirstPaint() {
    const paintEntries = performance.getEntriesByType("paint");
    const firstPaint = paintEntries.find(
      (entry) => entry.name === "first-paint"
    );
    return firstPaint ? Math.round(firstPaint.startTime) : null;
  }

  getFirstContentfulPaint() {
    const paintEntries = performance.getEntriesByType("paint");
    const fcp = paintEntries.find(
      (entry) => entry.name === "first-contentful-paint"
    );
    return fcp ? Math.round(fcp.startTime) : null;
  }

  measureCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    if ("PerformanceObserver" in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.largestContentfulPaint = Math.round(lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.metrics.firstInputDelay = Math.round(
              entry.processingStart - entry.startTime
            );
          });
        });
        fidObserver.observe({ entryTypes: ["first-input"] });

        // Cumulative Layout Shift (CLS) - requires layout-shift support
        if ("layout-shift" in PerformanceObserver.supportedEntryTypes) {
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            });
            this.metrics.cumulativeLayoutShift =
              Math.round(clsValue * 1000) / 1000;
          });
          clsObserver.observe({ entryTypes: ["layout-shift"] });
        }
      } catch (error) {
        console.log("Core Web Vitals measurement error:", error);
      }
    }
  }

  measureResourceTiming() {
    const resources = performance.getEntriesByType("resource");
    const resourceMetrics = {
      total: resources.length,
      scripts: 0,
      stylesheets: 0,
      images: 0,
      totalSize: 0,
      cachHits: 0,
    };

    resources.forEach((resource) => {
      // Count resource types
      if (resource.name.includes(".js")) resourceMetrics.scripts++;
      else if (resource.name.includes(".css")) resourceMetrics.stylesheets++;
      else if (resource.name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i))
        resourceMetrics.images++;

      // Calculate size (approximate)
      if (resource.transferSize !== undefined) {
        resourceMetrics.totalSize += resource.transferSize;
      }

      // Check for cache hits
      if (resource.transferSize === 0 && resource.decodedBodySize > 0) {
        resourceMetrics.cachHits++;
      }
    });

    this.metrics.resources = resourceMetrics;
  }

  measureSearchPerformance() {
    if (window.searchData) {
      const searchIndexSize = new Blob([JSON.stringify(window.searchData)])
        .size;
      this.metrics.searchIndexSize = Math.round(searchIndexSize / 1024); // KB
      this.metrics.searchItemCount = window.searchData.length;
    }
  }

  getPerformanceGrade() {
    const { loadTime, firstContentfulPaint, largestContentfulPaint } =
      this.metrics;

    let score = 100;

    // Load time scoring
    if (loadTime > 5000) score -= 30;
    else if (loadTime > 3000) score -= 20;
    else if (loadTime > 2000) score -= 10;

    // First Contentful Paint scoring
    if (firstContentfulPaint > 3000) score -= 20;
    else if (firstContentfulPaint > 2000) score -= 10;
    else if (firstContentfulPaint > 1000) score -= 5;

    // Largest Contentful Paint scoring
    if (largestContentfulPaint > 4000) score -= 25;
    else if (largestContentfulPaint > 2500) score -= 15;
    else if (largestContentfulPaint > 1500) score -= 5;

    if (score >= 90) return { grade: "A", color: "#28a745" };
    if (score >= 80) return { grade: "B", color: "#17a2b8" };
    if (score >= 70) return { grade: "C", color: "#ffc107" };
    if (score >= 60) return { grade: "D", color: "#fd7e14" };
    return { grade: "F", color: "#dc3545" };
  }

  reportMetrics() {
    this.measureSearchPerformance();

    const grade = this.getPerformanceGrade();

    console.group(
      `%c📊 Performance Report - Grade: ${grade.grade}`,
      `color: ${grade.color}; font-weight: bold; font-size: 14px;`
    );

    console.log("⏱️  Load Metrics:");
    console.log(`   • Page Load Time: ${this.metrics.loadTime || "N/A"}ms`);
    console.log(
      `   • DOM Content Loaded: ${this.metrics.domContentLoaded || "N/A"}ms`
    );
    console.log(`   • First Paint: ${this.metrics.firstPaint || "N/A"}ms`);
    console.log(
      `   • First Contentful Paint: ${
        this.metrics.firstContentfulPaint || "N/A"
      }ms`
    );

    if (this.metrics.largestContentfulPaint) {
      console.log("🎯 Core Web Vitals:");
      console.log(
        `   • Largest Contentful Paint: ${this.metrics.largestContentfulPaint}ms`
      );
      if (this.metrics.firstInputDelay !== undefined) {
        console.log(
          `   • First Input Delay: ${this.metrics.firstInputDelay}ms`
        );
      }
      if (this.metrics.cumulativeLayoutShift !== undefined) {
        console.log(
          `   • Cumulative Layout Shift: ${this.metrics.cumulativeLayoutShift}`
        );
      }
    }

    if (this.metrics.resources) {
      const { resources } = this.metrics;
      console.log("📦 Resource Metrics:");
      console.log(`   • Total Resources: ${resources.total}`);
      console.log(
        `   • Scripts: ${resources.scripts}, Stylesheets: ${resources.stylesheets}, Images: ${resources.images}`
      );
      console.log(
        `   • Total Size: ${Math.round(resources.totalSize / 1024)}KB`
      );
      console.log(
        `   • Cache Hits: ${resources.cachHits}/${
          resources.total
        } (${Math.round((resources.cachHits / resources.total) * 100)}%)`
      );
    }

    if (this.metrics.searchIndexSize) {
      console.log("🔍 Search Metrics:");
      console.log(`   • Index Size: ${this.metrics.searchIndexSize}KB`);
      console.log(`   • Item Count: ${this.metrics.searchItemCount}`);
    }

    console.groupEnd();

    // Store metrics globally for debugging
    window.performanceMetrics = this.metrics;
  }

  // Public method to get current metrics
  getMetrics() {
    return { ...this.metrics };
  }

  // Method to benchmark search operations
  benchmarkSearch(query, iterations = 100) {
    if (!window.fuse || !query) return null;

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      window.fuse.search(query);
    }
    const end = performance.now();

    const averageTime = (end - start) / iterations;
    console.log(
      `🔍 Search Benchmark: ${iterations} searches of "${query}" averaged ${averageTime.toFixed(
        2
      )}ms`
    );

    return averageTime;
  }
}

// Initialize performance monitor
window.PerformanceMonitor = new PerformanceMonitor();

// Expose benchmark function globally
window.benchmarkSearch = (query, iterations) =>
  window.PerformanceMonitor.benchmarkSearch(query, iterations);

// Export for debugging
window.getPerformanceMetrics = () => window.PerformanceMonitor.getMetrics();
