// Footer tag cloud highlighter - highlights current page tags and related tags
(function() {
  'use strict';

  console.log('%c FOOTER TAG CLOUD: Script loaded ', 'background: #3b82f6; color: #fff; font-weight: bold; padding: 4px;');

  // Wait for tag-cloud-network.js to load tag co-occurrence data
  function initFooterTagHighlight() {
    const footerTagCloud = document.querySelector('.footer-tag-cloud');
    if (!footerTagCloud) {
      console.log('FOOTER TAG CLOUD: No footer tag cloud found');
      return;
    }

    // Get current page tags from .article-tags
    const articleTags = document.querySelector('.article-tags');
    if (!articleTags) {
      console.log('FOOTER TAG CLOUD: No article tags found - not on an individual content page');
      return;
    }

    // Extract tag names from the current page
    const currentPageTags = new Set();
    const tagLinks = articleTags.querySelectorAll('a');
    tagLinks.forEach(link => {
      const tagName = link.textContent.trim();
      currentPageTags.add(tagName);
    });

    if (currentPageTags.size === 0) {
      console.log('FOOTER TAG CLOUD: No tags on current page');
      return;
    }

    console.log(`FOOTER TAG CLOUD: Found ${currentPageTags.size} tags on current page:`, Array.from(currentPageTags));

    // Wait for tag co-occurrence data to be available from tag-cloud-network.js
    const checkDataInterval = setInterval(() => {
      if (window.tagCooccurrenceData) {
        clearInterval(checkDataInterval);
        highlightTagsInFooter(footerTagCloud, currentPageTags, window.tagCooccurrenceData);
      }
    }, 100);

    // Fallback - highlight after 2 seconds even if data isn't available
    setTimeout(() => {
      clearInterval(checkDataInterval);
      if (!window.tagCooccurrenceData) {
        console.warn('FOOTER TAG CLOUD: Timeout waiting for co-occurrence data, highlighting current tags only');
        highlightTagsInFooter(footerTagCloud, currentPageTags, null);
      }
    }, 2000);
  }

  function highlightTagsInFooter(footerTagCloud, currentPageTags, cooccurrenceData) {
    const footerTags = footerTagCloud.querySelectorAll('a');
    
    // Find related tags based on co-occurrence
    const relatedTags = new Set();
    
    if (cooccurrenceData) {
      currentPageTags.forEach(currentTag => {
        footerTags.forEach(footerTag => {
          const footerTagName = footerTag.getAttribute('data-tag');
          if (!footerTagName) return;
          
          // Check if this footer tag co-occurs with any current page tag
          const key1 = `${currentTag}|${footerTagName}`;
          const key2 = `${footerTagName}|${currentTag}`;
          
          if (cooccurrenceData.has(key1) || cooccurrenceData.has(key2)) {
            const cooccCount = cooccurrenceData.get(key1) || cooccurrenceData.get(key2);
            if (cooccCount && cooccCount >= 2) { // At least 2 co-occurrences
              relatedTags.add(footerTagName);
            }
          }
        });
      });
    }

    console.log(`FOOTER TAG CLOUD: Found ${relatedTags.size} related tags:`, Array.from(relatedTags));

    // Apply styling to tags
    footerTags.forEach(tag => {
      const tagName = tag.getAttribute('data-tag');
      if (!tagName) return;

      if (currentPageTags.has(tagName)) {
        // Current page tag - strong highlight with border
        tag.style.fontWeight = 'bold';
        tag.style.color = '#2563eb'; // Blue
        tag.style.border = '2px solid #2563eb';
        tag.style.borderRadius = '0.3em';
        tag.style.padding = '0.1em 0.3em';
        tag.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
        tag.setAttribute('title', 'Tag on this page');
      } else if (relatedTags.has(tagName)) {
        // Related tag - subtle highlight
        tag.style.fontWeight = '600';
        tag.style.color = '#7c3aed'; // Purple
        tag.style.backgroundColor = 'rgba(124, 58, 237, 0.05)';
        tag.style.borderRadius = '0.2em';
        tag.style.padding = '0.05em 0.2em';
        tag.setAttribute('title', 'Related tag');
      }
    });

    console.log('FOOTER TAG CLOUD: Highlighting complete');
  }

  // Dark mode adjustments
  function applyDarkModeStyles() {
    if (document.body.classList.contains('dark')) {
      const style = document.createElement('style');
      style.textContent = `
        body.dark .footer-tag-cloud a[style*="color: #2563eb"] {
          color: #60a5fa !important;
          border-color: #60a5fa !important;
          background-color: rgba(96, 165, 250, 0.15) !important;
        }
        body.dark .footer-tag-cloud a[style*="color: #7c3aed"] {
          color: #a78bfa !important;
          background-color: rgba(167, 139, 250, 0.1) !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initFooterTagHighlight();
      applyDarkModeStyles();
    });
  } else {
    initFooterTagHighlight();
    applyDarkModeStyles();
  }
})();
