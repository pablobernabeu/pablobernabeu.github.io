/*************************************************
 * Lazy-loaded Search Implementation
 * Only loads search index when search is first opened
 **************************************************/

let searchIndexLoaded = false;
let searchData = null;
let fuse = null;

// Lazy load search configuration
const lazySearchConfig = {
  threshold: 0.25, // Balanced matching
  location: 0,
  distance: 50, // Allow more distance flexibility
  maxPatternLength: 32,
  minMatchCharLength: 3,
  keys: [
    { name: "title", weight: 0.99 },
    { name: "content", weight: 0.2 },
    { name: "summary", weight: 0.6 },
    { name: "authors", weight: 0.5 },
    { name: "categories", weight: 0.5 },
    { name: "tags", weight: 0.6 },
  ],
};

// Function to load search index
async function loadSearchIndex() {
  if (searchIndexLoaded) {
    return Promise.resolve(true);
  }

  try {
    console.log("🔍 Loading optimized search index...");

    // Use optimized index if available
    if (window.SearchIndexOptimizer) {
      searchData = await window.SearchIndexOptimizer.getCachedIndex();
    } else {
      // Fallback to original index
      const response = await fetch("/index.json");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      searchData = await response.json();
    }

    if (!searchData || searchData.length === 0) {
      throw new Error("Empty search index");
    }

    // Initialize Fuse with loaded data
    fuse = new Fuse(searchData, lazySearchConfig);
    searchIndexLoaded = true;

    console.log(`✅ Search index loaded: ${searchData.length} items`);
    return true;
  } catch (error) {
    console.error("❌ Failed to load search index:", error);
    return false;
  }
}

// Enhanced toggle search dialog with lazy loading
function enhancedToggleSearchDialog() {
  if ($("body").hasClass("searching")) {
    // Close search - original functionality
    $("[id=search-query]").blur();
    $("body").removeClass("searching compensate-for-scrollbar");
    $("#fancybox-style-noscroll").remove();

    // Remove search query params from URL
    if (window.history && window.history.replaceState) {
      const url = new URL(window.location);
      url.searchParams.delete("q");
      window.history.replaceState({}, "", url.toString());
    }
  } else {
    // Open search - enhanced with lazy loading
    showSearchLoadingState();

    // Load search index if not already loaded
    loadSearchIndex().then((success) => {
      if (success) {
        showSearchInterface();
        bindSearchEvents();
      } else {
        showSearchError();
      }
    });
  }
}

function showSearchLoadingState() {
  // Prevent scrollbar issues
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

  // Show search modal with loading state
  $("body").addClass("searching");
  $(".search-results")
    .css({ opacity: 0, visibility: "visible" })
    .animate({ opacity: 1 }, 200);

  // Show loading indicator
  $("#search-hits").html(
    '<div class="search-loading"><i class="fas fa-spinner fa-spin"></i> Loading search...</div>'
  );
  $("#search-query")
    .attr("placeholder", "Loading search index...")
    .prop("disabled", true);
}

function showSearchInterface() {
  // Enable search input
  $("#search-query")
    .attr("placeholder", "Search...")
    .prop("disabled", false)
    .focus();
  $("#search-hits").html(
    '<p class="search-no-results">Enter search terms above.</p>'
  );
}

function showSearchError() {
  $("#search-hits").html(
    '<div class="search-error"><i class="fas fa-exclamation-triangle"></i> Search temporarily unavailable.</div>'
  );
  $("#search-query")
    .attr("placeholder", "Search unavailable")
    .prop("disabled", true);
}

function bindSearchEvents() {
  // Only bind events once
  if (window.searchEventsBound) return;
  window.searchEventsBound = true;

  // Track pending search timeout
  let searchTimeout = null;

  // Search input handler - immediate clearing, debounced search
  $("#search-query").on("input", function () {
    const query = $(this).val().trim();
    
    // Always cancel any pending search
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      searchTimeout = null;
    }
    
    if (query.length === 0) {
      // Immediately clear results when search field is empty
      $("#search-hits").html("");
    } else if (query.length >= lazySearchConfig.minMatchCharLength) {
      // Debounce the search
      searchTimeout = setTimeout(function () {
        performSearch(query);
      }, 150);
    } else {
      $("#search-hits").html(
        '<p class="search-no-results">Enter at least 3 characters to search.</p>'
      );
    }
  });
}

function performSearch(query) {
  if (!fuse || !searchData) {
    showSearchError();
    return;
  }

  try {
    const results = fuse.search(query);
    displaySearchResults(results, query);
  } catch (error) {
    console.error("Search error:", error);
    showSearchError();
  }
}

function displaySearchResults(results, query) {
  const searchHits = $("#search-hits");

  if (results.length === 0) {
    searchHits.html('<p class="search-no-results">No results found.</p>');
    return;
  }

  let html = `<p class="search-results-count">${results.length} result${
    results.length !== 1 ? "s" : ""
  } found for "${query}"</p>`;

  // Limit results for performance
  const maxResults = 50;
  const displayResults = results.slice(0, maxResults);

  displayResults.forEach((result) => {
    const item = result.item;
    html += `
      <div class="search-hit">
        <div class="search-hit-content">
          <h3><a href="${item.permalink}">${highlightMatch(
      item.title,
      query
    )}</a></h3>
          ${
            item.summary
              ? `<p class="search-hit-description">${highlightMatch(
                  item.summary,
                  query
                )}</p>`
              : ""
          }
          ${
            item.authors
              ? `<p class="search-hit-authors">By: ${item.authors.join(
                  ", "
                )}</p>`
              : ""
          }
        </div>
      </div>
    `;
  });

  if (results.length > maxResults) {
    html += `<p class="search-more-results">Showing first ${maxResults} results. Try refining your search.</p>`;
  }

  searchHits.html(html);
  
  // Add click handlers for search result links to properly close search and navigate
  searchHits.find('a').on('click', function(e) {
    const href = $(this).attr('href');
    
    // Always prevent default to handle navigation ourselves
    e.preventDefault();
    e.stopPropagation();
    
    // Close search dialog
    $(".search-results").css({ visibility: "hidden", opacity: 0 });
    $("[id=search-query]").blur().val('');
    $("body").removeClass("searching compensate-for-scrollbar");
    $("#fancybox-style-noscroll").remove();
    $("#search-hits").empty();
    
    // Remove search query params from URL
    if (window.history && window.history.replaceState) {
      const url = new URL(window.location);
      url.searchParams.delete("q");
      window.history.replaceState({}, "", url.toString());
    }
    
    // Navigate to the link after delay to ensure search is fully closed
    setTimeout(function() {
      // Extract hash from href (works for both full URLs and relative URLs)
      let targetHash = null;
      let isTargetHomePage = false;
      
      try {
        const targetUrl = new URL(href, window.location.origin);
        if (targetUrl.hash) {
          targetHash = targetUrl.hash.substring(1); // Remove # prefix
        }
        isTargetHomePage = targetUrl.pathname === '/' || targetUrl.pathname === '/index.html' || targetUrl.pathname === '';
      } catch (e) {
        // Fallback for malformed URLs
        const hashMatch = href.match(/#(.+)$/);
        if (hashMatch) {
          targetHash = hashMatch[1];
        }
        isTargetHomePage = href.startsWith('/#') || href.startsWith('#') || href.match(/^https?:\/\/[^/]+\/?#/);
      }
      
      const isCurrentlyHomePage = window.location.pathname === '/' || window.location.pathname === '/index.html';
      
      if (targetHash && isTargetHomePage && isCurrentlyHomePage) {
        // Same-page hash navigation - scroll to element with offset for fixed navbar
        const targetElement = document.getElementById(targetHash);
        if (targetElement) {
          window.history.pushState({}, "", '#' + targetHash);
          // Get navbar height for offset (default to 70px if not found)
          const navbar = document.querySelector('.navbar-fixed-top, .navbar, nav.fixed-top, header.fixed-top');
          const navbarHeight = navbar ? navbar.offsetHeight : 70;
          const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({
            top: elementPosition - navbarHeight - 10,
            behavior: 'smooth'
          });
        } else {
          // Element not found, try full navigation
          window.location.href = href;
        }
      } else {
        // Different page or not on home page - full navigation
        window.location.href = href;
      }
    }, 150);
  });
}

function highlightMatch(text, query) {
  if (!text || !query) return text;

  const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Override the original toggle function
if (typeof toggleSearchDialog !== "undefined") {
  window.originalToggleSearchDialog = toggleSearchDialog;
}
window.toggleSearchDialog = enhancedToggleSearchDialog;
