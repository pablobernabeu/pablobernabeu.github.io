/*************************************************
 * Search Index Optimizer
 * Reduces search index size by filtering and compressing data
 **************************************************/

class SearchIndexOptimizer {
  constructor() {
    this.originalIndex = null;
    this.optimizedIndex = null;
    this.compressionRatio = 0.4; // Target 40% of original size
  }

  // Load and optimize the search index
  async loadOptimizedIndex() {
    try {
      console.log("🔍 Loading original search index...");

      const response = await fetch("/index.json");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.originalIndex = await response.json();
      console.log(
        `📊 Original index: ${
          this.originalIndex.length
        } items, ${this.getIndexSize(this.originalIndex)} KB`
      );

      this.optimizedIndex = this.optimizeIndex(this.originalIndex);
      console.log(
        `⚡ Optimized index: ${
          this.optimizedIndex.length
        } items, ${this.getIndexSize(this.optimizedIndex)} KB`
      );

      return this.optimizedIndex;
    } catch (error) {
      console.error("❌ Failed to load search index:", error);
      return null;
    }
  }

  // Optimize the search index
  optimizeIndex(index) {
    if (!Array.isArray(index)) {
      console.warn("Invalid index format");
      return [];
    }

    return index
      .map((item) => {
        const optimized = {
          title: this.truncateText(item.title, 100),
          permalink: item.permalink,
        };

        // Add summary if available and not too long
        if (item.summary && item.summary.length < 200) {
          optimized.summary = this.truncateText(item.summary, 150);
        }

        // Add truncated content
        if (item.content) {
          optimized.content = this.extractKeywords(item.content, 50);
        }

        // Add limited authors
        if (item.authors && item.authors.length > 0) {
          optimized.authors = item.authors.slice(0, 2);
        }

        // Add limited categories
        if (item.categories && item.categories.length > 0) {
          optimized.categories = item.categories.slice(0, 2);
        }

        // Add limited tags
        if (item.tags && item.tags.length > 0) {
          optimized.tags = item.tags.slice(0, 3);
        }

        // Add section for filtering
        if (item.section) {
          optimized.section = item.section;
        }

        return optimized;
      })
      .filter(
        (item) =>
          // Filter out items without meaningful content
          item.title && item.title.length > 3 && item.permalink
      );
  }

  // Extract keywords from content
  extractKeywords(content, maxWords = 50) {
    if (!content) return "";

    // Remove HTML tags and clean text
    const cleanText = content
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Split into words and filter
    const words = cleanText
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 3 &&
          !/^\d+$/.test(word) && // Not just numbers
          !/^[^\w]+$/.test(word) // Not just punctuation
      )
      .slice(0, maxWords);

    return words.join(" ");
  }

  // Truncate text to specified length
  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).replace(/\s+\S*$/, "") + "...";
  }

  // Calculate index size in KB
  getIndexSize(index) {
    const jsonString = JSON.stringify(index);
    return Math.round(new Blob([jsonString]).size / 1024);
  }

  // Get cached index or load fresh
  async getCachedIndex() {
    // Check if we have a cached version
    const cacheKey = "optimized-search-index";
    const cacheTimeKey = "optimized-search-index-time";
    const cacheDuration = 24 * 60 * 60 * 1000; // 24 hours

    try {
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(cacheTimeKey);

      if (cachedData && cacheTime) {
        const age = Date.now() - parseInt(cacheTime);
        if (age < cacheDuration) {
          console.log("📦 Using cached search index");
          return JSON.parse(cachedData);
        }
      }
    } catch (error) {
      console.log("Cache read error:", error);
    }

    // Load fresh index
    const freshIndex = await this.loadOptimizedIndex();

    if (freshIndex) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(freshIndex));
        localStorage.setItem(cacheTimeKey, Date.now().toString());
        console.log("💾 Search index cached");
      } catch (error) {
        console.log("Cache write error:", error);
      }
    }

    return freshIndex;
  }

  // Clear cache
  clearCache() {
    try {
      localStorage.removeItem("optimized-search-index");
      localStorage.removeItem("optimized-search-index-time");
      console.log("🗑️ Search cache cleared");
    } catch (error) {
      console.log("Cache clear error:", error);
    }
  }
}

// Global instance
window.SearchIndexOptimizer = new SearchIndexOptimizer();

// Export for module use
if (typeof module !== "undefined" && module.exports) {
  module.exports = SearchIndexOptimizer;
}
