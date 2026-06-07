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
        return true;
      } else {
        return false;
      }
    } catch (error) {
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

// Per-visitor auto-submission is intentionally disabled: submitting on every
// page view is wasteful (and client-side POSTs to IndexNow are CORS-limited).
// URL submission is handled server-side after each deploy by
// .github/workflows/indexnow-ping.yml. window.IndexNow (below) remains
// available for manual/console submission if ever needed.

// Export for manual use
window.IndexNow = indexNowSubmitter;
