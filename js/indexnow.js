/**
 * IndexNow JavaScript Implementation
 * Automatically submits URLs to search engines via IndexNow API
 */

class IndexNowSubmitter {
  constructor() {
    this.apiKey = this.getApiKey();
    this.host = this.getHost();
    this.keyLocation = this.getKeyLocation();
    this.apiEndpoint = "https://api.indexnow.org/indexnow";
  }

  getApiKey() {
    const meta = document.querySelector('meta[name="indexnow-key"]');
    return meta ? meta.content : null;
  }

  getHost() {
    const meta = document.querySelector('meta[name="indexnow-host"]');
    return meta ? meta.content : window.location.hostname;
  }

  getKeyLocation() {
    const meta = document.querySelector('meta[name="indexnow-key-location"]');
    return meta ? meta.content : null;
  }

  async submitUrl(url) {
    if (!this.apiKey || !this.keyLocation) {
      console.log("IndexNow: Missing API key or key location");
      return false;
    }

    const payload = {
      host: this.host,
      key: this.apiKey,
      keyLocation: this.keyLocation,
      urlList: [url],
    };

    try {
      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok || response.status === 202) {
        console.log(`IndexNow: Successfully submitted ${url}`);
        return true;
      } else {
        console.log(
          `IndexNow: Submission failed for ${url} - Status: ${response.status}`
        );
        return false;
      }
    } catch (error) {
      console.log(`IndexNow: Error submitting ${url}:`, error.message);
      return false;
    }
  }

  async submitCurrentPage() {
    const currentUrl = window.location.href;
    return await this.submitUrl(currentUrl);
  }

  // Rate-limited batch submission
  async submitUrls(urls, delayMs = 1000) {
    const results = [];
    for (const url of urls) {
      const result = await this.submitUrl(url);
      results.push({ url, success: result });

      // Rate limiting delay
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    return results;
  }
}

// Initialize IndexNow submitter
const indexNowSubmitter = new IndexNowSubmitter();

// Auto-submit current page when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Small delay to ensure page is fully loaded
  setTimeout(() => {
    indexNowSubmitter.submitCurrentPage();
  }, 2000);
});

// Export for manual use
window.IndexNow = indexNowSubmitter;
