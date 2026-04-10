// Related References Interactive Enhancement
// Search, year filter, type filter, abstract toggle, copy, export, sort.
// Pre-embedded metadata is read from <script class="ref-metadata"> when
// available; otherwise abstracts are fetched on-demand from CrossRef.
(function () {
  'use strict';

  // Shared CrossRef cache (session-scoped)
  var crossrefCache = {};
  try {
    var stored = sessionStorage.getItem('refCrossRefCache');
    if (stored) crossrefCache = JSON.parse(stored);
  } catch (e) { /* ignore */ }

  function saveCache() {
    try { sessionStorage.setItem('refCrossRefCache', JSON.stringify(crossrefCache)); } catch (e) { /* ignore */ }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var sections = document.querySelectorAll('.related-references');
    if (!sections.length) return;

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            observer.unobserve(entry.target);
            enhanceSection(entry.target);
          }
        });
      }, { rootMargin: '300px' });
      sections.forEach(function (s) { observer.observe(s); });
    } else {
      sections.forEach(enhanceSection);
    }
  });

  // =========================================================================
  //  SECTION ENHANCEMENT
  // =========================================================================

  // Detect the current publication's own DOI from the page's DOI button link
  function getPageDoi() {
    var doiBtn = document.querySelector('a.btn[href*="doi.org/"]');
    if (doiBtn) {
      var m = doiBtn.getAttribute('href').match(/doi\.org\/(.+)$/);
      if (m) return decodeURIComponent(m[1]).toLowerCase();
    }
    return null;
  }

  function enhanceSection(section) {
    // Tag the heading above this section for extra top-margin
    var prev = section.previousElementSibling;
    // Skip past non-heading elements (e.g. <p>, <script>) to find the heading
    while (prev && !/^H[1-6]$/.test(prev.tagName)) prev = prev.previousElementSibling;
    if (prev) prev.classList.add('ref-section-heading');

    var hangingIndent = section.querySelector('.hanging-indent');
    if (!hangingIndent) return;

    // Hide self-citations: remove references whose DOI matches the page's own DOI
    var pageDoi = getPageDoi();
    if (pageDoi) {
      var allPs = hangingIndent.querySelectorAll('p');
      for (var si = 0; si < allPs.length; si++) {
        var selfLink = allPs[si].querySelector('a[href*="doi.org/"]');
        if (selfLink) {
          var sm = selfLink.getAttribute('href').match(/doi\.org\/(.+)$/);
          if (sm && decodeURIComponent(sm[1]).toLowerCase() === pageDoi) {
            allPs[si].style.display = 'none';
            allPs[si].classList.add('ref-self-citation');
          }
        }
      }
    }

    var paragraphs = hangingIndent.querySelectorAll('p:not(.ref-self-citation)');
    if (!paragraphs.length) return;

    // Read pre-embedded metadata from <script class="ref-metadata"> JSON block
    // For Rmd publications the script may be in a parent wrapper div, not inside .related-references
    var metadata = {};
    var metaScript = section.querySelector('script.ref-metadata');
    if (!metaScript && section.parentNode) {
      metaScript = section.parentNode.querySelector('script.ref-metadata');
    }
    if (metaScript) {
      try { metadata = JSON.parse(metaScript.textContent) || {}; } catch (e) { /* ignore */ }
    }

    // Read Scopus query info from <script class="scopus-queries"> JSON block
    // For Rmd publications the script may be in a parent wrapper div, not inside .related-references
    var scopusQueries = null;
    var scopusScript = section.querySelector('script.scopus-queries');
    if (!scopusScript && section.parentNode) {
      scopusScript = section.parentNode.querySelector('script.scopus-queries');
    }
    if (scopusScript) {
      try { scopusQueries = JSON.parse(scopusScript.textContent); } catch (e) { /* ignore */ }
    }

    var references = [];
    var types = {};
    var hasAnyDoi = false;

    for (var i = 0; i < paragraphs.length; i++) {
      var p = paragraphs[i];
      var text = p.textContent || '';
      if (!text.trim()) continue;

      // Extract year
      var yearMatch = text.match(/\((\d{4})[a-z]?(?:,\s*[A-Za-z.]+\s*\d{0,2})?\)/);
      var year = yearMatch ? parseInt(yearMatch[1], 10) : null;

      // Extract DOI
      var doi = null;
      var doiLink = p.querySelector('a[href*="doi.org/"]');
      if (doiLink) {
        var href = doiLink.getAttribute('href');
        var m = href.match(/doi\.org\/(.+)$/);
        if (m) doi = decodeURIComponent(m[1]);
      }

      // Apply metadata from JSON block (keyed by DOI)
      var meta = doi ? metadata[doi] || metadata[doi.toLowerCase()] : null;
      if (meta) {
        if (meta.abstract) p.setAttribute('data-abstract', cleanAbstract(meta.abstract));
        if (meta.type) p.setAttribute('data-type', meta.type);
      }

      // Also apply from sessionStorage cache
      if (doi && crossrefCache[doi]) {
        var cached = crossrefCache[doi];
        if (cached.abstract && !p.getAttribute('data-abstract')) p.setAttribute('data-abstract', cleanAbstract(cached.abstract));
        if (cached.type && !p.getAttribute('data-type')) p.setAttribute('data-type', cached.type);
      }

      var pType = p.getAttribute('data-type') || '';
      var hasAbstract = !!p.getAttribute('data-abstract');

      if (year) p.setAttribute('data-year', year);
      if (doi) { p.setAttribute('data-doi', doi); hasAnyDoi = true; }
      p.classList.add('ref-item');

      // Track types for filter dropdown
      if (pType) types[pType] = (types[pType] || 0) + 1;

      // Inject buttons inline — always visible
      var actionsHtml = '<span class="reference-actions">';
      // Abstract button: only when abstract is already known.
      // backgroundPrefetch will inject the button later if CrossRef
      // returns an abstract for this DOI.
      if (hasAbstract) {
        actionsHtml += '<button class="ref-btn ref-abstract-btn" aria-expanded="false">' +
          '<i class="fas fa-align-left"></i> Abstract</button>';
      }
      actionsHtml += '<button class="ref-btn ref-copy-btn" title="Copy citation">' +
        '<i class="fas fa-copy"></i> Copy</button>';
      if (doi) {
        actionsHtml += '<button class="ref-btn ref-export-btn" title="Export as BibTeX">' +
          '<i class="fas fa-download"></i> Export</button>';
      }
      // Extract title (text after "(YEAR). " up to first sentence-ending punctuation)
      var titleForSearch = null;
      var titleMatch = text.match(/\)\.\s+(.+?)[.?!]\s/);
      if (titleMatch) titleForSearch = titleMatch[1].trim();
      // Extract author surnames (before the year parenthetical)
      var surnamesStr = '';
      var authStr = text.replace(/\s*\(\d{4}.*$/, '');
      var surnameMatches = authStr.match(/[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþ\-]+/g);
      if (surnameMatches) surnamesStr = surnameMatches.join(' ');
      var queryParts = [];
      if (surnamesStr) queryParts.push(surnamesStr);
      if (year) queryParts.push(String(year));
      if (titleForSearch) queryParts.push('"' + titleForSearch + '"');
      if (doi) queryParts.push('"' + doi + '"');
      var searchQuery = encodeURIComponent(queryParts.length ? queryParts.join(' ') : text.trim());
      actionsHtml += '<span class="ref-icon-pair">' +
        '<button class="ref-search-icon-btn" data-url="https://scholar.google.com/scholar?q=' + searchQuery +
        '" title="Search on Google Scholar"><img src="/img/google-scholar-favicon.png" alt="Scholar" width="22" height="22" class="ref-search-logo"></button>' +
        '<button class="ref-search-icon-btn" data-url="https://www.google.com/search?q=' + searchQuery +
        '" title="Search on Google"><img src="/img/google-favicon.png" alt="Google" width="22" height="22" class="ref-search-logo"></button>' +
        '</span>';
      actionsHtml += '</span>';
      p.insertAdjacentHTML('beforeend', actionsHtml);

      // Include abstract text in searchable content
      var abstractForSearch = p.getAttribute('data-abstract') || '';
      references.push({
        el: p,
        year: year,
        doi: doi,
        searchText: (text + ' ' + abstractForSearch).toLowerCase()
      });
    }
    if (!references.length) return;

    // Year range
    var years = [];
    for (var j = 0; j < references.length; j++) {
      if (references[j].year) years.push(references[j].year);
    }
    var minYear = years.length ? Math.min.apply(null, years) : 2000;
    var maxYear = years.length ? Math.max.apply(null, years) : new Date().getFullYear();

    // Build toolbar — save/restore scroll so DOM insertion doesn't
    // pull the viewport when the section is below the current view.
    var scrollBefore = window.pageYOffset;
    var toolbar = createToolbar(minYear, maxYear, types, hasAnyDoi, scopusQueries);
    section.parentNode.insertBefore(toolbar, section);
    window.scrollTo({ top: scrollBefore, left: 0, behavior: 'instant' });

    // Hide search/sort/filter rows when there is only one reference
    if (references.length <= 1) {
      var rows = toolbar.querySelectorAll('.ref-toolbar-row:not(.ref-count-row)');
      for (var ri = 0; ri < rows.length; ri++) rows[ri].style.display = 'none';
    }

    // Event delegation for clicks
    hangingIndent.addEventListener('click', function (e) {
      var absBtn = e.target.closest('.ref-abstract-btn');
      if (absBtn) {
        var p = absBtn.closest('p.ref-item');
        if (p) toggleAbstract(p, absBtn);
        return;
      }
      var copyBtn = e.target.closest('.ref-copy-btn');
      if (copyBtn) {
        var p2 = copyBtn.closest('p.ref-item');
        if (p2) copyCitation(p2, copyBtn);
        return;
      }
      var expBtn = e.target.closest('.ref-export-btn');
      if (expBtn) {
        var p3 = expBtn.closest('p.ref-item');
        if (p3) exportSingle(p3, expBtn);
        return;
      }
      var iconBtn = e.target.closest('.ref-search-icon-btn');
      if (iconBtn) {
        var url = iconBtn.getAttribute('data-url');
        if (url) window.location.href = url;
        return;
      }
    });

    updateCount(toolbar, references.length, references.length);
    var ctrl = setupFiltering(toolbar, references, hangingIndent, minYear, maxYear);

    // Compute and display relevance scores
    var queryStr = scopusQueries
      ? (Array.isArray(scopusQueries) ? scopusQueries[0].query : scopusQueries.query)
      : null;

    // Wrap scoring + state restoration in try/catch so backgroundPrefetch
    // always runs even if an earlier step throws unexpectedly.
    try {
      addRelevanceBadges(references, queryStr);
      ctrl.updateRelevanceMax();
    } catch (badgeErr) {
      if (typeof console !== 'undefined' && console.error) {
        console.error('[related-refs] relevance scoring error:', badgeErr);
      }
    }

    // Restore saved filter state or apply default sort (relevance)
    try {
      var saved = sessionStorage.getItem('refFilters:' + window.location.pathname);
      if (saved) {
        ctrl.restoreState(JSON.parse(saved));
      } else {
        ctrl.applyFilters();
        ctrl.applySort();
      }
    } catch (e) {
      try { ctrl.applySort(); } catch (e2) { /* ignore */ }
    }

    // Restore previously expanded abstracts
    try {
      var expandedDois = getExpandedState();
      if (expandedDois.length) {
        var expandAllBtn = toolbar.querySelector('.ref-expand-all');
        var collapseAllBtn = toolbar.querySelector('.ref-collapse-all');
        var anyExpanded = false;
        for (var ri = 0; ri < references.length; ri++) {
          var ref = references[ri];
          if (ref.doi && expandedDois.indexOf(ref.doi) !== -1) {
            var absBtn = ref.el.querySelector('.ref-abstract-btn');
            console.log('[related-refs] restore: expanding doi=' + ref.doi +
              ', hasAbsBtn=' + !!absBtn +
              ', hasDataAbstract=' + !!ref.el.getAttribute('data-abstract'));
            expandOne(ref.el, absBtn, function () {});
            anyExpanded = true;
          }
        }
        if (anyExpanded && expandAllBtn && collapseAllBtn) {
          expandAllBtn.style.display = 'none';
          collapseAllBtn.style.display = '';
          collapseAllBtn.classList.add('active');
          ctrl.setExpandAllActive(true);
        }
        // Re-run filters so panels created above are hidden when
        // their parent <p> is filtered out (avoids orphaned stacking).
        ctrl.applyFilters();
      }
    } catch (e) { console.warn('[related-refs] restore error:', e); }

    // Background-fetch metadata for DOIs missing embedded data (types + abstracts)
    backgroundPrefetch(section, references, queryStr);
  }

  // =========================================================================
  //  TOOLBAR
  // =========================================================================

  function createToolbar(minYear, maxYear, types, hasAnyDoi, scopusQueries) {
    var toolbar = document.createElement('div');
    toolbar.className = 'ref-toolbar';

    // Bulk actions
    var bulkParts = [];
    if (hasAnyDoi) {
      bulkParts.push(
        '<button class="ref-btn ref-expand-all" title="Expand all abstracts"><i class="fas fa-expand-alt"></i> Expand abstracts</button>' +
        '<button class="ref-btn ref-collapse-all" title="Collapse all abstracts" style="display:none"><i class="fas fa-compress-alt"></i> Collapse abstracts</button>'
      );
    }
    bulkParts.push(
      '<button class="ref-btn ref-export-all" title="Export all visible references as plain text"><i class="fas fa-file-export"></i> Export visible</button>'
    );
    if (hasAnyDoi) {
      bulkParts.push(
        '<button class="ref-btn ref-export-bib" title="Export all visible references as BibTeX"><i class="fas fa-file-code"></i> BibTeX</button>' +
        '<button class="ref-btn ref-export-dois" title="Export DOI URLs of all visible references"><i class="fas fa-link"></i> DOI URLs</button>'
      );
    }
    if (scopusQueries) {
      bulkParts.push(
        '<button class="ref-btn ref-show-queries" title="View the Scopus query used to collect these references">' +
          '<i class="fas fa-search"></i> View Scopus query</button>'
      );
    }
    var bulkHtml = '<div class="ref-bulk-actions">' + bulkParts.join('') + '</div>';

    // Build Scopus query panel (hidden by default)
    var queryPanelHtml = '';
    if (scopusQueries) {
      var rows = '';
      if (Array.isArray(scopusQueries)) {
        for (var q = 0; q < scopusQueries.length; q++) {
          rows += buildQueryRow(scopusQueries[q]);
        }
      } else {
        rows = buildQueryRow(scopusQueries);
      }
      queryPanelHtml = '<div class="ref-query-panel" style="display:none">' + rows + '</div>';
    }

    var typeFilterHtml =
      '<div class="ref-type-filter">' +
        '<label class="ref-filter-label"><i class="fas fa-filter"></i> Type</label>' +
        '<select class="ref-type-select" aria-label="Filter by publication type">' +
          buildTypeOptions(types) +
        '</select>' +
      '</div>';

    toolbar.innerHTML =
      '<div class="ref-toolbar-row">' +
        '<div class="ref-search-wrapper">' +
          '<i class="fas fa-search ref-search-icon"></i>' +
          '<input type="text" class="ref-search" placeholder="Search references..." aria-label="Search references">' +
          '<button class="ref-btn ref-search-clear" title="Clear search" style="display:none">&times;</button>' +
        '</div>' +
      '</div>' +
      '<div class="ref-toolbar-row ref-filters-row">' +
        '<div class="ref-filters-inner">' +
          '<div class="ref-year-filter">' +
            '<label class="ref-filter-label"><i class="fas fa-calendar-alt"></i> Year</label>' +
            '<div class="ref-year-inputs">' +
              '<input type="number" class="ref-year-min" min="' + minYear + '" max="' + maxYear + '" value="' + minYear + '" aria-label="Minimum year">' +
              '<span class="ref-year-sep">&ndash;</span>' +
              '<input type="number" class="ref-year-max" min="' + minYear + '" max="' + maxYear + '" value="' + maxYear + '" aria-label="Maximum year">' +
            '</div>' +
          '</div>' +
          typeFilterHtml +
          '<div class="ref-relevance-filter">' +
            '<label class="ref-filter-label"><i class="fas fa-bullseye"></i> Min relevance</label>' +
            '<svg class="ref-rel-sparkline" viewBox="0 0 200 28" preserveAspectRatio="none" aria-hidden="true"></svg>' +
            '<div class="ref-relevance-inputs">' +
              '<input type="range" class="ref-relevance-min" min="0" max="100" value="0" aria-label="Minimum relevance score">' +
              '<span class="ref-relevance-value">0%</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="ref-sort-filter">' +
          '<label class="ref-filter-label"><i class="fas fa-sort"></i> Sort</label>' +
          '<div class="ref-sort-btns">' +
            '<button class="ref-btn ref-sort-btn active" data-sort="relevance" title="Most relevant first"><i class="fas fa-bullseye"></i> Relevance</button>' +
            '<button class="ref-btn ref-sort-btn" data-sort="alpha" title="Sort alphabetically">A&ndash;Z</button>' +
            '<button class="ref-btn ref-sort-btn" data-sort="year-desc" title="Newest first">Year &darr;</button>' +
            '<button class="ref-btn ref-sort-btn" data-sort="year-asc" title="Oldest first">Year &uarr;</button>' +
          '</div>' +
        '</div>' +
        '<button class="ref-btn ref-reset-filters" style="visibility:hidden" title="Reset all filters"><i class="fas fa-times-circle"></i> Reset filters</button>' +
      '</div>' +
      '<div class="ref-toolbar-row ref-count-row">' +
        '<span class="ref-count"></span>' +
        bulkHtml +
      '</div>' +
      queryPanelHtml;

    // Wire up the query viewer toggle
    var showQBtn = toolbar.querySelector('.ref-show-queries');
    var qPanel = toolbar.querySelector('.ref-query-panel');
    if (showQBtn && qPanel) {
      showQBtn.addEventListener('click', function () {
        var open = qPanel.style.display !== 'none';
        qPanel.style.display = open ? 'none' : 'block';
        showQBtn.classList.toggle('active', !open);
      });
    }

    return toolbar;
  }

  function buildQueryRow(q) {
    var html = '<div class="ref-query-row">';
    // Attribution line: sources + links
    html += '<div class="ref-query-header">';
    var details = [];
    if (q.period) details.push('Period: ' + escapeHtml(q.period).replace(/-/g, '\u2013'));
    if (q.collected) details.push('Collected: ' + escapeHtml(q.collected));
    if (details.length) html += '<span class="ref-query-details">' + details.join(' \u00b7 ') + '</span>';
    // Source links: collection script + blog post
    html += '<span class="ref-query-links">';
    html += 'Sourced from <a href="https://www.scopus.com" target="_blank" rel="noopener">Scopus</a>';
    html += ' &amp; <a href="https://www.crossref.org" target="_blank" rel="noopener">CrossRef</a>';
    html += ' using <a href="/2024/rscopus-plus-an-extension-of-the-rscopus-package/" target="_blank" rel="noopener">rscopus_plus</a>';
    if (q.scriptPath) {
      var ghUrl = 'https://github.com/pablobernabeu/website-files/blob/master/' +
        encodeURI(q.scriptPath);
      html += ' (<a class="ref-query-link" href="' + ghUrl + '" target="_blank" rel="noopener">' +
        '<i class="fab fa-github"></i> script</a>)';
    }
    html += '</span>';
    html += '</div>';
    if (q.query) html += '<code class="ref-query-code">' + highlightQuery(escapeHtml(q.query)) + '</code>';
    html += '</div>';
    return html;
  }

  /** Syntax-highlight OR/AND/NOT operators and quoted strings in a Scopus query. */
  function highlightQuery(html) {
    // Highlight quoted strings (literal " characters)
    html = html.replace(/&quot;(.*?)&quot;/g,
      '<span class="ref-q-quote">&quot;</span><span class="ref-q-string">$1</span><span class="ref-q-quote">&quot;</span>');
    // Also match literal " characters
    html = html.replace(/"(.*?)"/g,
      '<span class="ref-q-quote">"</span><span class="ref-q-string">$1</span><span class="ref-q-quote">"</span>');
    // Highlight boolean operators as whole words
    html = html.replace(/\b(OR|AND|NOT)\b/g, '<span class="ref-q-op">$1</span>');
    return html;
  }

  function buildTypeOptions(types) {
    var html = '<option value="">All types</option>';
    var keys = Object.keys(types).sort();
    for (var i = 0; i < keys.length; i++) {
      html += '<option value="' + keys[i] + '">' + prettifyType(keys[i]) + '</option>';
    }
    return html;
  }

  function prettifyType(type) {
    return type.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  // =========================================================================
  //  FILTERING & SORTING
  // =========================================================================

  function setupFiltering(toolbar, references, hangingIndent, defaultMinYear, defaultMaxYear) {
    var searchInput = toolbar.querySelector('.ref-search');
    var clearBtn = toolbar.querySelector('.ref-search-clear');
    var yearMinInput = toolbar.querySelector('.ref-year-min');
    var yearMaxInput = toolbar.querySelector('.ref-year-max');
    var typeSelect = toolbar.querySelector('.ref-type-select');
    var sortBtns = toolbar.querySelectorAll('.ref-sort-btn');
    var expandAllBtn = toolbar.querySelector('.ref-expand-all');
    var collapseAllBtn = toolbar.querySelector('.ref-collapse-all');
    var exportAllBtn = toolbar.querySelector('.ref-export-all');
    var exportBibBtn = toolbar.querySelector('.ref-export-bib');
    var resetBtn = toolbar.querySelector('.ref-reset-filters');
    var relevanceMinInput = toolbar.querySelector('.ref-relevance-min');
    var relevanceValueLabel = toolbar.querySelector('.ref-relevance-value');
    var currentSort = 'relevance';

    function isFilterActive() {
      var query = (searchInput.value || '').trim();
      var yearMin = parseInt(yearMinInput.value, 10);
      var yearMax = parseInt(yearMaxInput.value, 10);
      var typeVal = typeSelect.value;
      var relMin = parseInt(relevanceMinInput.value, 10) || 0;
      return query !== '' ||
        yearMin !== defaultMinYear ||
        yearMax !== defaultMaxYear ||
        typeVal !== '' ||
        relMin > 0;
    }

    function applyFilters() {
      var query = (searchInput.value || '').toLowerCase().trim();
      var yearMin = parseInt(yearMinInput.value, 10) || 0;
      var yearMax = parseInt(yearMaxInput.value, 10) || 9999;
      var typeVal = typeSelect.value;
      var relMin = parseInt(relevanceMinInput.value, 10) || 0;
      var visible = 0;

      clearBtn.style.display = query ? '' : 'none';
      resetBtn.style.visibility = isFilterActive() ? 'visible' : 'hidden';

      for (var i = 0; i < references.length; i++) {
        var ref = references[i];
        var show = true;

        // Refresh searchText to include any abstract fetched after init
        var absText = ref.el.getAttribute('data-abstract') || '';
        var fullSearch = ref.searchText;
        if (absText && fullSearch.indexOf(absText.toLowerCase().substring(0, 40)) === -1) {
          fullSearch = fullSearch + ' ' + absText.toLowerCase();
          ref.searchText = fullSearch;
        }
        // All filters are cumulative (AND logic)
        if (query && fullSearch.indexOf(query) === -1) show = false;
        if (show && ref.year && (ref.year < yearMin || ref.year > yearMax)) show = false;
        if (show && typeVal && (ref.el.getAttribute('data-type') || '') !== typeVal) show = false;
        if (show && relMin > 0 && (ref.relevance || 0) < relMin) show = false;

        ref.el.style.display = show ? '' : 'none';

        // Also hide/show any abstract panel
        var refPid = ref.el.getAttribute('data-panel-id');
        if (refPid) {
          var refPanel = ref.el.parentNode.querySelector('.reference-abstract[data-for-panel="' + refPid + '"]');
          if (refPanel) {
            refPanel.style.display = show && refPanel.classList.contains('open') ? 'block' : 'none';
          }
        }

        if (show) visible++;
      }

      updateCount(toolbar, visible, references.length);
      drawSparkline();

      // When expand-all mode is active, auto-expand any newly visible refs
      // whose abstracts aren't open yet.
      if (expandAllActive) {
        for (var ei = 0; ei < references.length; ei++) {
          var eRef = references[ei];
          if (eRef.el.style.display === 'none') continue;
          if (!eRef.doi && !eRef.el.getAttribute('data-abstract')) continue;
          var ePid = eRef.el.getAttribute('data-panel-id');
          var ePanel = ePid
            ? eRef.el.parentNode.querySelector('.reference-abstract[data-for-panel="' + ePid + '"]')
            : null;
          if (!ePanel || !ePanel.classList.contains('open')) {
            var eBtn = eRef.el.querySelector('.ref-abstract-btn');
            expandOne(eRef.el, eBtn, function () {});
          }
        }
      }
    }

    function resetAllFilters() {
      searchInput.value = '';
      yearMinInput.value = defaultMinYear;
      yearMaxInput.value = defaultMaxYear;
      typeSelect.value = '';
      relevanceMinInput.value = 0;
      relevanceValueLabel.textContent = '0%';
      clearBtn.style.display = 'none';
      resetBtn.style.visibility = 'hidden';
      applyFilters();
      saveState();
    }

    function applySort() {
      var sorted = references.slice();
      if (currentSort === 'alpha') {
        sorted.sort(function (a, b) { return a.searchText < b.searchText ? -1 : a.searchText > b.searchText ? 1 : 0; });
      } else if (currentSort === 'relevance') {
        sorted.sort(function (a, b) { return (b.relevance || 0) - (a.relevance || 0); });
      } else if (currentSort === 'year-desc') {
        sorted.sort(function (a, b) { return (b.year || 0) - (a.year || 0); });
      } else if (currentSort === 'year-asc') {
        sorted.sort(function (a, b) { return (a.year || 0) - (b.year || 0); });
      }
      // Collect each ref's abstract panel BEFORE moving anything
      var panels = [];
      for (var i = 0; i < sorted.length; i++) {
        var spid = sorted[i].el.getAttribute('data-panel-id');
        panels[i] = spid
          ? sorted[i].el.parentNode.querySelector('.reference-abstract[data-for-panel="' + spid + '"]')
          : null;
      }
      var frag = document.createDocumentFragment();
      for (var j = 0; j < sorted.length; j++) {
        frag.appendChild(sorted[j].el);
        if (panels[j]) frag.appendChild(panels[j]);
      }
      hangingIndent.appendChild(frag);
    }

    var searchTimer;
    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(applyFilters, 250);
    });
    clearBtn.addEventListener('click', function () {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      applyFilters();
      searchInput.focus();
    });
    yearMinInput.addEventListener('change', applyFilters);
    yearMaxInput.addEventListener('change', applyFilters);
    typeSelect.addEventListener('change', applyFilters);
    relevanceMinInput.addEventListener('input', function () {
      relevanceValueLabel.textContent = relevanceMinInput.value + '%';
      applyFilters();
    });
    resetBtn.addEventListener('click', resetAllFilters);

    Array.prototype.slice.call(sortBtns).forEach(function (btn) {
      btn.addEventListener('click', function () {
        Array.prototype.slice.call(sortBtns).forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentSort = btn.getAttribute('data-sort');
        applySort();
        saveState();
      });
    });

    // Apply default sort (relevance) on init — called externally after
    // relevance badges are computed so scores are available.
    // (return statement is at bottom of setupFiltering)

    // Track whether "expand all" mode is active so filter changes can
    // auto-expand newly visible references.
    var expandAllActive = false;

    // Expand / collapse all abstracts (rate-limited for on-demand fetches)
    if (expandAllBtn) {
      expandAllBtn.addEventListener('click', function () {
        // Collect visible refs that have a DOI and aren't open yet
        var toExpand = [];
        for (var i = 0; i < references.length; i++) {
          var ref = references[i];
          // Skip refs hidden by filters
          if (ref.el.style.display === 'none') continue;
          // Need a DOI or an already-known abstract to expand
          if (!ref.doi && !ref.el.getAttribute('data-abstract')) continue;
          var absBtn = ref.el.querySelector('.ref-abstract-btn');
          var pid = ref.el.getAttribute('data-panel-id');
          var panel = pid
            ? ref.el.parentNode.querySelector('.reference-abstract[data-for-panel="' + pid + '"]')
            : null;
          if (!panel || !panel.classList.contains('open')) {
            toExpand.push({ el: ref.el, btn: absBtn });
          }
        }

        var batchIdx = 0;
        var BATCH = 6;
        var pending = 0;

        function onSettled() {
          pending--;
          if (pending <= 0 && batchIdx >= toExpand.length) {
            saveExpandedState();
          }
        }

        function expandBatch() {
          var end = Math.min(batchIdx + BATCH, toExpand.length);
          for (var j = batchIdx; j < end; j++) {
            pending++;
            expandOne(toExpand[j].el, toExpand[j].btn, onSettled);
          }
          batchIdx = end;
          if (batchIdx < toExpand.length) setTimeout(expandBatch, 300);
        }
        expandBatch();

        expandAllActive = true;
        expandAllBtn.style.display = 'none';
        if (collapseAllBtn) {
          collapseAllBtn.style.display = '';
          collapseAllBtn.classList.add('active');
        }
      });
    }

    if (collapseAllBtn) {
      collapseAllBtn.addEventListener('click', function () {
        for (var i = 0; i < references.length; i++) {
          var pid = references[i].el.getAttribute('data-panel-id');
          var panel = pid
            ? references[i].el.parentNode.querySelector('.reference-abstract[data-for-panel="' + pid + '"]')
            : null;
          var absBtn = references[i].el.querySelector('.ref-abstract-btn');
          if (panel && panel.classList.contains('open')) {
            panel.classList.remove('open');
            panel.style.display = 'none';
            if (absBtn) absBtn.setAttribute('aria-expanded', 'false');
          }
        }
        expandAllActive = false;
        collapseAllBtn.style.display = 'none';
        collapseAllBtn.classList.remove('active');
        if (expandAllBtn) expandAllBtn.style.display = '';
        saveExpandedState();
      });
    }

    // Export visible references as plain-text APA
    if (exportAllBtn) {
      exportAllBtn.addEventListener('click', function () {
        exportVisible(references, 'txt');
      });
    }

    // Export visible references as BibTeX (on-demand fetch)
    if (exportBibBtn) {
      exportBibBtn.addEventListener('click', function () {
        exportVisible(references, 'bib');
      });
    }

    // Export DOI URLs
    var exportDoisBtn = toolbar.querySelector('.ref-export-dois');
    if (exportDoisBtn) {
      exportDoisBtn.addEventListener('click', function () {
        var lines = [];
        for (var i = 0; i < references.length; i++) {
          if (references[i].el.style.display !== 'none' && references[i].doi) {
            lines.push('https://doi.org/' + references[i].doi);
          }
        }
        if (lines.length) {
          downloadFile(lines.join('\n'), 'doi-urls.txt', 'text/plain');
        }
      });
    }

    // Save filter state on every change
    function saveState() {
      try {
        var key = 'refFilters:' + window.location.pathname;
        sessionStorage.setItem(key, JSON.stringify({
          search: (searchInput.value || '').trim(),
          yearMin: parseInt(yearMinInput.value, 10),
          yearMax: parseInt(yearMaxInput.value, 10),
          type: typeSelect.value,
          sort: currentSort,
          relMin: parseInt(relevanceMinInput.value, 10) || 0
        }));
      } catch (e) { /* ignore */ }
    }
    searchInput.addEventListener('input', saveState);
    yearMinInput.addEventListener('change', saveState);
    yearMaxInput.addEventListener('change', saveState);
    typeSelect.addEventListener('change', saveState);
    relevanceMinInput.addEventListener('input', saveState);

    function drawSparkline() {
      var svg = toolbar.querySelector('.ref-rel-sparkline');
      if (!svg) return;
      var W = 200, H = 28, BUCKETS = 10;
      var buckets = [];
      for (var k = 0; k < BUCKETS; k++) buckets[k] = 0;
      for (var i = 0; i < references.length; i++) {
        var rel = references[i].relevance || 0;
        var b = Math.min(BUCKETS - 1, Math.floor(rel * BUCKETS / 100));
        buckets[b]++;
      }
      var maxCount = 0;
      for (var m = 0; m < BUCKETS; m++) if (buckets[m] > maxCount) maxCount = buckets[m];
      if (!maxCount) { svg.innerHTML = ''; return; }
      var threshold = parseInt(relevanceMinInput.value, 10) || 0;
      var barW = W / BUCKETS;
      var parts = [];
      for (var b2 = 0; b2 < BUCKETS; b2++) {
        if (!buckets[b2]) continue;
        var h = Math.max(2, Math.round((buckets[b2] / maxCount) * (H - 2)));
        var bx = b2 * barW;
        var by = H - h;
        var bucketStart = b2 * (100 / BUCKETS);
        var cls = bucketStart >= threshold ? 'spark-above' : 'spark-below';
        parts.push('<rect class="' + cls + '" x="' + bx.toFixed(1) + '" y="' + by + '" width="' + (barW - 1).toFixed(1) + '" height="' + h + '" rx="1"/>');
      }
      if (threshold > 0) {
        var tx = (threshold / 100) * W;
        parts.push('<line class="spark-threshold" x1="' + tx.toFixed(1) + '" y1="0" x2="' + tx.toFixed(1) + '" y2="' + H + '" stroke-width="1.5" stroke-dasharray="2,1"/>');
      }
      svg.innerHTML = parts.join('');
    }

    // Return controller for external callers (enhanceSection)
    return {
      applySort: applySort,
      applyFilters: applyFilters,
      restoreState: function (s) {
        if (s.search) { searchInput.value = s.search; clearBtn.style.display = ''; }
        if (s.yearMin != null) yearMinInput.value = s.yearMin;
        if (s.yearMax != null) yearMaxInput.value = s.yearMax;
        if (s.type) typeSelect.value = s.type;
        if (s.relMin != null && s.relMin > 0) {
          relevanceMinInput.value = s.relMin;
          relevanceValueLabel.textContent = s.relMin + '%';
        }
        if (s.sort) {
          currentSort = s.sort;
          Array.prototype.slice.call(sortBtns).forEach(function (b) {
            b.classList.toggle('active', b.getAttribute('data-sort') === s.sort);
          });
        }
        resetBtn.style.visibility = isFilterActive() ? 'visible' : 'hidden';
        applyFilters();
        applySort();
        saveState();
      },
      saveState: saveState,
      setExpandAllActive: function (v) { expandAllActive = v; },
      updateRelevanceMax: function () {
        var maxRel = 0;
        for (var i = 0; i < references.length; i++) {
          if ((references[i].relevance || 0) > maxRel) maxRel = references[i].relevance;
        }
        if (maxRel > 0) {
          relevanceMinInput.max = maxRel;
          // Clamp current value if it exceeds new max
          if (parseInt(relevanceMinInput.value, 10) > maxRel) {
            relevanceMinInput.value = maxRel;
            relevanceValueLabel.textContent = maxRel + '%';
          }
          drawSparkline();
        }
      }
    };
  }

  function updateCount(toolbar, visible, total) {
    var el = toolbar.querySelector('.ref-count');
    el.textContent = visible === total
      ? total + ' reference' + (total !== 1 ? 's' : '')
      : 'Showing ' + visible + ' of ' + total + ' references';
  }

  // =========================================================================
  //  EXPANDED-ABSTRACT PERSISTENCE (sessionStorage)
  // =========================================================================

  var expandedKey = 'refExpanded:' + window.location.pathname;

  function saveExpandedState() {
    try {
      var panels = document.querySelectorAll('.reference-abstract.open[data-for-panel]');
      var dois = [];
      for (var i = 0; i < panels.length; i++) {
        var pid = panels[i].getAttribute('data-for-panel');
        var p = document.querySelector('[data-panel-id="' + pid + '"]');
        if (p) {
          var d = p.getAttribute('data-doi');
          if (d) dois.push(d);
        }
      }
      console.log('[related-refs] saveExpandedState: panels found=' + panels.length + ', dois=' + JSON.stringify(dois));
      sessionStorage.setItem(expandedKey, JSON.stringify(dois));
    } catch (e) { console.warn('[related-refs] saveExpandedState error:', e); }
  }

  function getExpandedState() {
    try {
      var s = sessionStorage.getItem(expandedKey);
      var result = s ? JSON.parse(s) : [];
      console.log('[related-refs] getExpandedState: key=' + expandedKey + ', dois=' + JSON.stringify(result));
      return result;
    } catch (e) { console.warn('[related-refs] getExpandedState error:', e); return []; }
  }

  // Safety-net: persist expanded state on page unload
  window.addEventListener('beforeunload', saveExpandedState);

  // =========================================================================
  //  ABSTRACT TOGGLE
  // =========================================================================

  // Monotonic counter for linking <p> refs to their abstract panels.
  var panelIdCounter = 0;

  /**
   * Find the existing abstract panel for a <p>, or create one.
   * Uses a data-panel-id / data-for-panel link so the lookup is
   * immune to DOM reordering caused by other panels being inserted.
   */
  function findOrCreatePanel(p) {
    var pid = p.getAttribute('data-panel-id');
    if (pid) {
      var existing = p.parentNode.querySelector('.reference-abstract[data-for-panel="' + pid + '"]');
      if (existing) return existing;
    }
    // Assign a unique id
    pid = 'rp-' + (++panelIdCounter);
    p.setAttribute('data-panel-id', pid);

    var panel = document.createElement('div');
    panel.className = 'reference-abstract';
    panel.setAttribute('data-for-panel', pid);
    // Insert right after the <p> (before the next element sibling)
    var next = p.nextElementSibling;
    p.parentNode.insertBefore(panel, next);
    return panel;
  }

  /**
   * Expand a single abstract (open-only, with done callback).
   * Used by "Expand all" so we know when each async fetch settles.
   */
  function expandOne(p, btn, done) {
    var abstractText = p.getAttribute('data-abstract');
    var doi = p.getAttribute('data-doi');

    var panel = findOrCreatePanel(p);
    if (!panel) { done(); return; }

    // Already open — nothing to do
    if (panel.classList.contains('open') && panel.dataset.loaded) {
      done();
      return;
    }

    // If the ref is currently hidden by a filter, keep the panel hidden too
    var refHidden = p.style.display === 'none';
    panel.classList.add('open');
    panel.style.display = refHidden ? 'none' : 'block';
    if (btn) btn.setAttribute('aria-expanded', 'true');

    if (panel.dataset.loaded) { done(); return; }

    if (abstractText) {
      panel.innerHTML = '<p>' + escapeHtml(cleanAbstract(abstractText)) + '</p>';
      panel.dataset.loaded = 'true';
      done();
    } else if (doi) {
      panel.innerHTML = '<p class="ref-loading">Loading abstract\u2026</p>';
      fetchCrossRef(doi, function (result) {
        if (result && result.abstract) {
          var abs = cleanAbstract(result.abstract);
          p.setAttribute('data-abstract', abs);
          panel.innerHTML = '<p>' + escapeHtml(abs) + '</p>';
          panel.dataset.loaded = 'true';
          // Ensure an individual toggle button exists
          injectAbstractButton(p);
          var injBtn = p.querySelector('.ref-abstract-btn');
          if (injBtn) injBtn.setAttribute('aria-expanded', 'true');
        } else {
          panel.classList.remove('open');
          panel.style.display = 'none';
          if (panel.parentNode) panel.parentNode.removeChild(panel);
          removeAbstractButton(p);
        }
        if (result && result.type && !p.getAttribute('data-type')) {
          p.setAttribute('data-type', result.type);
          var sec = p.closest ? p.closest('.related-references') : p.parentNode;
          if (sec) rebuildTypeDropdown(sec);
        }
        done();
      });
    } else {
      panel.classList.remove('open');
      panel.style.display = 'none';
      if (panel.parentNode) panel.parentNode.removeChild(panel);
      removeAbstractButton(p);
      done();
    }
  }

  function toggleAbstract(p, btn) {
    var abstractText = p.getAttribute('data-abstract');
    var doi = p.getAttribute('data-doi');

    var panel = findOrCreatePanel(p);
    if (!panel) return;

    // If already open, just close
    if (panel.classList.contains('open')) {
      panel.classList.remove('open');
      panel.style.display = 'none';
      if (btn) btn.setAttribute('aria-expanded', 'false');
      saveExpandedState();
      return;
    }

    // Open the panel
    panel.classList.add('open');
    panel.style.display = 'block';
    if (btn) btn.setAttribute('aria-expanded', 'true');

    // If abstract is already loaded, show it
    if (panel.dataset.loaded) { saveExpandedState(); return; }

    if (abstractText) {
      panel.innerHTML = '<p>' + escapeHtml(cleanAbstract(abstractText)) + '</p>';
      panel.dataset.loaded = 'true';
      saveExpandedState();
    } else if (doi) {
      // Fetch abstract on demand from CrossRef
      panel.innerHTML = '<p class="ref-loading">Loading abstract\u2026</p>';
      fetchCrossRef(doi, function (result) {
        if (result && result.abstract) {
          var abs = cleanAbstract(result.abstract);
          p.setAttribute('data-abstract', abs);
          panel.innerHTML = '<p>' + escapeHtml(abs) + '</p>';
          panel.dataset.loaded = 'true';
        } else {
          // No abstract — close panel and remove button silently
          panel.classList.remove('open');
          panel.style.display = 'none';
          if (panel.parentNode) panel.parentNode.removeChild(panel);
          removeAbstractButton(p);
        }
        saveExpandedState();
        // Also store type if obtained
        if (result && result.type && !p.getAttribute('data-type')) {
          p.setAttribute('data-type', result.type);
          var sec = p.closest ? p.closest('.related-references') : p.parentNode;
          if (sec) rebuildTypeDropdown(sec);
        }
      });
    } else {
      // No DOI and no abstract — close panel and remove button
      panel.classList.remove('open');
      panel.style.display = 'none';
      if (panel.parentNode) panel.parentNode.removeChild(panel);
      removeAbstractButton(p);
    }
  }

  /**
   * Rebuild the type-filter <select> from current data-type attributes.
   * Called after each background prefetch result instead of incrementally
   * updating counts (which caused visual count run-ups).
   */
  function rebuildTypeDropdown(section) {
    var tb = section.previousElementSibling;
    if (!tb || !tb.classList.contains('ref-toolbar')) {
      tb = section.parentNode ? section.parentNode.querySelector('.ref-toolbar') : null;
    }
    if (!tb) return;
    var sel = tb.querySelector('.ref-type-select');
    if (!sel) return;
    var curVal = sel.value;
    // Recount types from DOM
    var hangingIndent = section.querySelector('.hanging-indent');
    if (!hangingIndent) return;
    var items = hangingIndent.querySelectorAll('p.ref-item');
    var types = {};
    for (var i = 0; i < items.length; i++) {
      var t = items[i].getAttribute('data-type');
      if (t) types[t] = (types[t] || 0) + 1;
    }
    sel.innerHTML = buildTypeOptions(types);
    // Restore previous selection if still valid
    if (curVal) {
      for (var j = 0; j < sel.options.length; j++) {
        if (sel.options[j].value === curVal) { sel.value = curVal; break; }
      }
    }
    // Re-run filters so visible refs stay in sync with the updated counts
    sel.dispatchEvent(new Event('change'));
  }

  /**
   * Remove the abstract button from a ref <p> (when no abstract exists).
   */
  function removeAbstractButton(p) {
    var btn = p.querySelector('.ref-abstract-btn');
    if (btn) btn.parentNode.removeChild(btn);
  }

  /**
   * Inject an abstract button into a ref <p> if it doesn't already have one.
   */
  function injectAbstractButton(p) {
    if (p.querySelector('.ref-abstract-btn')) return;
    var actions = p.querySelector('.reference-actions');
    if (!actions) return;
    var btn = document.createElement('button');
    btn.className = 'ref-btn ref-abstract-btn';
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<i class="fas fa-align-left"></i> Abstract';
    actions.insertBefore(btn, actions.firstChild);
  }

  /**
   * Background prefetch: fetch metadata for DOIs without embedded data,
   * rate-limited to avoid flooding CrossRef. Populates types dropdown and
   * caches abstracts so they display instantly when clicked.
   */
  function backgroundPrefetch(section, references, queryStr) {
    var queue = [];
    for (var i = 0; i < references.length; i++) {
      var ref = references[i];
      if (!ref.doi) continue;
      var needsAbstract = !ref.el.getAttribute('data-abstract');
      var needsType = !ref.el.getAttribute('data-type');
      if (!needsAbstract && !needsType) continue;

      // Evict stale cache entries that lack the data we still need
      if (crossrefCache[ref.doi]) {
        var c = crossrefCache[ref.doi];
        if ((needsAbstract && !c.abstract) || (needsType && !c.type)) {
          delete crossrefCache[ref.doi];
        }
      }
      if (!crossrefCache[ref.doi]) {
        queue.push(ref);
      }
    }
    if (!queue.length) return;

    var idx = 0;
    var concurrent = 0;
    var MAX_CONCURRENT = 2;
    var typesChanged = false;
    var rebuildTimer = null;
    var retryQueue = [];
    var retryDelay = 3000;

    function scheduleRebuild() {
      if (!typesChanged) return;
      // Debounce: rebuild at most every 400ms
      if (rebuildTimer) clearTimeout(rebuildTimer);
      rebuildTimer = setTimeout(function () {
        rebuildTypeDropdown(section);
        typesChanged = false;
      }, 400);
    }

    function next() {
      while (concurrent < MAX_CONCURRENT && idx < queue.length) {
        (function (ref) {
          concurrent++;
          fetchCrossRef(ref.doi, function (result) {
            concurrent--;
            if (result) {
              if (result.abstract && !ref.el.getAttribute('data-abstract')) {
                ref.el.setAttribute('data-abstract', cleanAbstract(result.abstract));
                injectAbstractButton(ref.el);
                rescoreReference(ref, queryStr);
              }
              if (result.type && !ref.el.getAttribute('data-type')) {
                ref.el.setAttribute('data-type', result.type);
                typesChanged = true;
              }
            } else if (!ref._retried) {
              // Failed — queue for one retry
              ref._retried = true;
              retryQueue.push(ref);
            }
            scheduleRebuild();
            // Longer delay between requests to avoid rate-limiting
            setTimeout(next, 250);
          });
        })(queue[idx]);
        idx++;
      }
      // Primary queue drained — process retries
      if (idx >= queue.length && concurrent === 0) {
        if (typesChanged) {
          clearTimeout(rebuildTimer);
          rebuildTypeDropdown(section);
          typesChanged = false;
        }
        if (retryQueue.length) {
          queue = retryQueue;
          retryQueue = [];
          idx = 0;
          setTimeout(next, retryDelay);
          retryDelay *= 2; // exponential backoff for further rounds
        }
      }
    }
    // Stagger start
    setTimeout(next, 500);
  }

  // =========================================================================
  //  CROSSREF API (on-demand fallback)
  // =========================================================================

  // In-flight request deduplication: maps DOI → array of pending callbacks
  var pendingRequests = {};

  function fetchCrossRef(doi, callback) {
    if (crossrefCache[doi]) { callback(crossrefCache[doi]); return; }

    // If a request for this DOI is already in flight, queue the callback
    if (pendingRequests[doi]) {
      pendingRequests[doi].push(callback);
      return;
    }
    pendingRequests[doi] = [callback];

    var url = 'https://api.crossref.org/works/' + encodeURIComponent(doi);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Accept', 'application/json');
    // Polite pool: identified requests get higher rate limits from CrossRef
    xhr.setRequestHeader('User-Agent', 'RelatedRefs/1.0 (mailto:p.bernabeu@lancaster.ac.uk)');
    xhr.timeout = 20000;

    function resolve(result) {
      var cbs = pendingRequests[doi] || [];
      delete pendingRequests[doi];
      for (var i = 0; i < cbs.length; i++) cbs[i](result);
    }

    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          var msg = JSON.parse(xhr.responseText).message || {};
          var result = {
            abstract: msg.abstract || null,
            type: msg.type || null
          };
          crossrefCache[doi] = result;
          saveCache();
          resolve(result);
        } catch (e) { resolve(null); }
      } else { resolve(null); }
    };
    xhr.onerror = function () { resolve(null); };
    xhr.ontimeout = function () { resolve(null); };
    xhr.send();
  }

  /** Fetch BibTeX for a single DOI. Tries CrossRef transform endpoint first,
   *  then data.crossref.org content negotiation, then builds BibTeX from
   *  CrossRef JSON metadata as a last resort. */
  function fetchBibTeX(doi, callback) {
    var crossrefUrl = 'https://api.crossref.org/works/' + encodeURIComponent(doi) + '/transform/application/x-bibtex';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', crossrefUrl, true);
    xhr.timeout = 15000;
    xhr.onload = function () {
      if (xhr.status === 200 && xhr.responseText.trim().charAt(0) === '@') {
        callback(xhr.responseText.trim());
      } else {
        fetchBibTeXFallback(doi, callback);
      }
    };
    xhr.onerror = xhr.ontimeout = function () { fetchBibTeXFallback(doi, callback); };
    xhr.send();
  }

  /** Fallback BibTeX fetch via data.crossref.org (accepts content negotiation
   *  directly without cross-origin redirects). */
  function fetchBibTeXFallback(doi, callback) {
    var url = 'https://data.crossref.org/' + encodeURIComponent(doi);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Accept', 'application/x-bibtex');
    xhr.timeout = 15000;
    xhr.onload = function () {
      if (xhr.status === 200 && xhr.responseText.trim().charAt(0) === '@') {
        callback(xhr.responseText.trim());
      } else {
        // Last resort: build from JSON metadata
        buildBibTeXFromJSON(doi, callback);
      }
    };
    xhr.onerror = xhr.ontimeout = function () { buildBibTeXFromJSON(doi, callback); };
    xhr.send();
  }

  /** Build a BibTeX entry from CrossRef JSON metadata.
   *  This handles DOIs where neither transform endpoint returns BibTeX. */
  function buildBibTeXFromJSON(doi, callback) {
    var url = 'https://api.crossref.org/works/' + encodeURIComponent(doi);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.timeout = 15000;
    xhr.onload = function () {
      if (xhr.status !== 200) { callback(null); return; }
      try {
        var msg = JSON.parse(xhr.responseText).message;
        if (!msg) { callback(null); return; }

        var type = msg.type || 'misc';
        // Map CrossRef types to BibTeX entry types
        var bibType = 'misc';
        if (type === 'journal-article') bibType = 'article';
        else if (type === 'book-chapter') bibType = 'incollection';
        else if (type === 'book') bibType = 'book';
        else if (type === 'proceedings-article') bibType = 'inproceedings';
        else if (type === 'dissertation') bibType = 'phdthesis';

        // Build citekey: LastName_Year
        var authors = msg.author || [];
        var firstAuthor = authors.length > 0 ? (authors[0].family || 'Unknown') : 'Unknown';
        var year = '';
        if (msg.issued && msg.issued['date-parts'] && msg.issued['date-parts'][0]) {
          year = String(msg.issued['date-parts'][0][0] || '');
        }
        var citekey = firstAuthor.replace(/[^A-Za-z]/g, '') + (year ? '_' + year : '');

        var fields = [];
        if (msg.title && msg.title[0]) fields.push('  title={' + msg.title[0] + '}');
        if (authors.length > 0) {
          var authorStr = authors.map(function (a) {
            return (a.family || '') + (a.given ? ', ' + a.given : '');
          }).join(' and ');
          fields.push('  author={' + authorStr + '}');
        }
        if (year) fields.push('  year={' + year + '}');
        if (msg.issued && msg.issued['date-parts'] && msg.issued['date-parts'][0]) {
          var m = msg.issued['date-parts'][0][1];
          if (m) {
            var months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
            fields.push('  month=' + (months[m - 1] || ''));
          }
        }
        if (msg['container-title'] && msg['container-title'][0]) {
          var jField = bibType === 'article' ? 'journal' : 'booktitle';
          fields.push('  ' + jField + '={' + msg['container-title'][0] + '}');
        }
        if (msg.volume) fields.push('  volume={' + msg.volume + '}');
        if (msg.issue) fields.push('  number={' + msg.issue + '}');
        if (msg.page) fields.push('  pages={' + msg.page + '}');
        if (msg.publisher) fields.push('  publisher={' + msg.publisher + '}');
        if (msg.ISSN && msg.ISSN[0]) fields.push('  ISSN={' + msg.ISSN[0] + '}');
        if (msg.ISBN && msg.ISBN[0]) fields.push('  ISBN={' + msg.ISBN[0] + '}');
        fields.push('  DOI={' + doi + '}');
        if (msg.URL) fields.push('  url={' + msg.URL + '}');

        var bib = '@' + bibType + '{' + citekey + ',\n' + fields.join(',\n') + '\n}';
        callback(bib);
      } catch (e) {
        callback(null);
      }
    };
    xhr.onerror = xhr.ontimeout = function () { callback(null); };
    xhr.send();
  }

  // =========================================================================
  //  COPY CITATION
  // =========================================================================

  function copyCitation(p, btn) {
    var text = getCleanText(p);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { showCopyFeedback(btn); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) { /* ignore */ }
      document.body.removeChild(ta);
      showCopyFeedback(btn);
    }
  }

  function showCopyFeedback(btn) {
    var orig = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
    btn.classList.add('ref-copied');
    setTimeout(function () {
      btn.innerHTML = orig;
      btn.classList.remove('ref-copied');
    }, 1500);
  }

  // =========================================================================
  //  EXPORT
  // =========================================================================

  /** Export a single reference as BibTeX via CrossRef transform API. */
  function exportSingle(p, btn) {
    var doi = p.getAttribute('data-doi');
    if (!doi) return;

    var origHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    fetchBibTeX(doi, function (bib) {
      btn.innerHTML = origHtml;
      if (bib) {
        downloadFile(bib, doi.replace(/\//g, '_') + '.bib', 'application/x-bibtex');
      } else {
        // Fallback: export as plain text
        downloadFile(getCleanText(p), 'reference.txt', 'text/plain');
      }
    });
  }

  /** Export all currently visible references. */
  function exportVisible(references, format) {
    var visible = [];
    for (var i = 0; i < references.length; i++) {
      if (references[i].el.style.display !== 'none') visible.push(references[i]);
    }
    if (!visible.length) return;

    if (format === 'txt') {
      var lines = [];
      for (var j = 0; j < visible.length; j++) {
        lines.push(getCleanText(visible[j].el));
      }
      downloadFile(lines.join('\n\n'), 'references.txt', 'text/plain');
      return;
    }

    // BibTeX: fetch each DOI — rate-limited to avoid overwhelming CrossRef
    var bibs = new Array(visible.length);
    var pending = 0;
    var bibQueue = [];

    for (var k = 0; k < visible.length; k++) {
      var doi = visible[k].doi;
      if (!doi) {
        bibs[k] = '% No DOI: ' + getCleanText(visible[k].el);
        continue;
      }
      pending++;
      bibQueue.push({ doi: doi, idx: k });
    }

    if (pending === 0) {
      downloadFile(bibs.filter(Boolean).join('\n\n'), 'references.bib', 'application/x-bibtex');
      return;
    }

    var bibQueueIdx = 0;
    var bibConcurrent = 0;
    var BIB_MAX_CONCURRENT = 2;

    function fetchNextBib() {
      while (bibConcurrent < BIB_MAX_CONCURRENT && bibQueueIdx < bibQueue.length) {
        (function (item) {
          bibConcurrent++;
          fetchBibTeX(item.doi, function (bib) {
            bibConcurrent--;
            bibs[item.idx] = bib || ('% Failed: ' + item.doi);
            pending--;
            if (pending === 0) {
              downloadFile(bibs.filter(Boolean).join('\n\n'), 'references.bib', 'application/x-bibtex');
            } else {
              setTimeout(fetchNextBib, 300);
            }
          });
        })(bibQueue[bibQueueIdx]);
        bibQueueIdx++;
      }
    }

    fetchNextBib();
  }

  function downloadFile(content, filename, mimeType) {
    var blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  }

  // =========================================================================
  //  UTILITIES
  // =========================================================================

  /** Get clean citation text from a <p>, excluding button labels. */
  function getCleanText(p) {
    var clone = p.cloneNode(true);
    var acts = clone.querySelector('.reference-actions');
    if (acts) acts.remove();
    var badge = clone.querySelector('.ref-relevance');
    if (badge) badge.remove();
    return clone.textContent.trim();
  }

  /** Strip JATS/XML tags and remove leading "Abstract" prefix. */
  function cleanAbstract(text) {
    // Strip all XML/HTML tags
    var clean = text.replace(/<[^>]+>/g, '');
    // Remove leading "Abstract" (with optional colon/period/space)
    clean = clean.replace(/^\s*Abstract[:\.]?\s*/i, '');
    return clean.trim();
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // =========================================================================
  //  RELEVANCE SCORING
  // =========================================================================

  /** English stopwords (common function words to ignore in similarity). */
  var STOPWORDS = {};
  (function () {
    var sw = 'a an the and or but in on of to for with from by at is are was were be been being ' +
      'have has had do does did will would shall should may might can could not no nor ' +
      'this that these those it its he she they them their his her we our you your i me my ' +
      'if then than so as also very much more most all each any some such into about between ' +
      'through during before after above below up down out off over under again further too ' +
      'how what which who whom where when why there here just only both few many several ' +
      'other another new case study using used based evidence effects effect role';
    sw.split(' ').forEach(function (w) { STOPWORDS[w] = true; });
  })();

  /**
   * Get the core publication title from the page.
   * Tries <meta property="og:title">, then <meta name="citation_title">, then <h1>.
   * Strips trailing " | Author Name" from og:title.
   */
  function getCoreTitle() {
    var el = document.querySelector('meta[property="og:title"]');
    if (el) {
      var t = el.getAttribute('content') || '';
      return t.replace(/\s*\|[^|]*$/, '').trim();
    }
    el = document.querySelector('meta[name="citation_title"]');
    if (el) return (el.getAttribute('content') || '').trim();
    el = document.querySelector('h1.article-title, h1');
    if (el) return el.textContent.trim();
    return '';
  }

  /**
   * Get the core publication abstract from the page meta description.
   */
  function getCoreAbstract() {
    var el = document.querySelector('meta[name="description"]');
    return el ? (el.getAttribute('content') || '').trim() : '';
  }

  /**
   * Tokenise text into lowercase word stems, removing stopwords and short tokens.
   */
  function tokenize(text) {
    return text.toLowerCase()
      .replace(/[^a-z0-9\u00C0-\u017F]+/g, ' ')
      .split(/\s+/)
      .filter(function (w) { return w.length > 2 && !STOPWORDS[w]; });
  }

  /** Build Set-like object from array. */
  function toSet(arr) {
    var s = {};
    for (var i = 0; i < arr.length; i++) s[arr[i]] = true;
    return s;
  }

  /** Extract bigrams (consecutive pairs). */
  function bigrams(tokens) {
    var bg = [];
    for (var i = 0; i < tokens.length - 1; i++) {
      bg.push(tokens[i] + ' ' + tokens[i + 1]);
    }
    return bg;
  }

  /**
   * Extract the reference title from an APA-formatted citation text.
   * Pattern: "Author(s). (Year). TITLE. *Journal*" or "TITLE. In ..."
   */
  function extractRefTitle(text) {
    // Match after "). " which follows the year
    var m = text.match(/\)\.\s+(.+?)(?:\.\s+(?:\*|In\s|http|\<))/);
    if (m) return m[1];
    // Fallback: everything between first "). " and second ". "
    var m2 = text.match(/\)\.\s+(.+?)\.\s/);
    if (m2) return m2[1];
    return text;
  }

  /**
   * Compute relevance of a reference to the core publication, 0–100.
   *
   * Uses both titles and abstracts (when available). Heuristic:
   *  - Title unigram overlap (Jaccard):      25 % weight
   *  - Title bigram overlap (Jaccard):        15 % weight
   *  - Abstract unigram overlap (Jaccard):    20 % weight (0 if no abstracts)
   *  - Abstract bigram overlap (Jaccard):     10 % weight (0 if no abstracts)
   *  - Shared rare-word bonus:                20 % weight
   *  - Title-in-query bonus:                  10 % weight
   *
   * When no abstract is available for a reference, the title weights are
   * boosted proportionally so the total still spans the full 0–100 range.
   */
  function computeRelevance(coreTitleTokens, coreTitleSet, coreTitleBg, coreTitleBgSet,
                            coreAbsTokens, coreAbsSet, coreAbsBg, coreAbsBgSet,
                            refText, refAbstract, wordFreqs, query) {
    var refTitle = extractRefTitle(refText);
    var refTitleTokens = tokenize(refTitle);
    if (refTitleTokens.length === 0) return 0;

    var refTitleSet = toSet(refTitleTokens);
    var refTitleBg = bigrams(refTitleTokens);
    var refTitleBgSet = toSet(refTitleBg);

    // ----- Title unigram Jaccard -----
    var titleUni = jaccard(coreTitleSet, refTitleSet);

    // ----- Title bigram Jaccard -----
    var titleBi = jaccard(coreTitleBgSet, refTitleBgSet);

    // ----- Abstract similarity (if both sides have abstracts) -----
    var absUni = 0, absBi = 0;
    var hasAbstracts = coreAbsTokens.length > 0 && refAbstract;
    if (hasAbstracts) {
      var refAbsTokens = tokenize(refAbstract);
      if (refAbsTokens.length > 0) {
        var refAbsSet = toSet(refAbsTokens);
        var refAbsBg = bigrams(refAbsTokens);
        var refAbsBgSet = toSet(refAbsBg);
        absUni = jaccard(coreAbsSet, refAbsSet);
        absBi = jaccard(coreAbsBgSet, refAbsBgSet);
      } else {
        hasAbstracts = false;
      }
    }

    // ----- Rare-word bonus (across titles + abstracts combined) -----
    var allCoreTokens = coreTitleSet;
    var allRefTokens = refTitleSet;
    if (hasAbstracts) {
      allCoreTokens = mergeSet(coreTitleSet, coreAbsSet);
      allRefTokens = mergeSet(refTitleSet, toSet(tokenize(refAbstract)));
    }
    var rareShared = 0, rarePossible = 0;
    var threshold = Math.max(3, Math.floor(Object.keys(wordFreqs).length * 0.1));
    for (var k in allCoreTokens) {
      if (wordFreqs[k] && wordFreqs[k] <= threshold) {
        rarePossible++;
        if (allRefTokens[k]) rareShared++;
      }
    }
    var rareScore = rarePossible > 0 ? rareShared / rarePossible : 0;

    // ----- Title-in-query bonus -----
    var queryBonus = 0;
    if (query) {
      var queryLower = query.toLowerCase();
      var titleLower = refTitle.toLowerCase();
      if (queryLower.indexOf(titleLower) !== -1) {
        queryBonus = 1;
      } else {
        var inQuery = 0;
        for (var i = 0; i < refTitleTokens.length; i++) {
          if (queryLower.indexOf(refTitleTokens[i]) !== -1) inQuery++;
        }
        queryBonus = refTitleTokens.length > 0 ? inQuery / refTitleTokens.length : 0;
      }
    }

    // ----- Weighted combination -----
    var raw;
    if (hasAbstracts) {
      // Full weighting: titles 40%, abstracts 30%, rare 20%, query 10%
      raw = titleUni * 0.25 + titleBi * 0.15 +
            absUni * 0.20 + absBi * 0.10 +
            rareScore * 0.20 + queryBonus * 0.10;
    } else {
      // No abstract: redistribute abstract weight to titles
      raw = titleUni * 0.40 + titleBi * 0.30 +
            rareScore * 0.20 + queryBonus * 0.10;
    }

    // Scale into 0–100 range
    var pct = Math.min(100, Math.round(raw * 350));
    return Math.max(0, pct);
  }

  /** Jaccard similarity between two set-like objects. */
  function jaccard(setA, setB) {
    var intersection = 0, union = {};
    var k;
    for (k in setA) union[k] = true;
    for (k in setB) union[k] = true;
    for (k in setA) { if (setB[k]) intersection++; }
    var uSize = Object.keys(union).length;
    return uSize > 0 ? intersection / uSize : 0;
  }

  /** Merge two set-like objects. */
  function mergeSet(a, b) {
    var m = {};
    var k;
    for (k in a) m[k] = true;
    for (k in b) m[k] = true;
    return m;
  }

  /**
   * Compute relevance for all references and inject badges.
   * @param {Object[]} references  array of { el, year, doi, searchText }
   * @param {string}   queryStr   Scopus query string or null
   */
  function addRelevanceBadges(references, queryStr) {
    var coreTitle = getCoreTitle();
    if (!coreTitle) return;

    var coreTitleTokens = tokenize(coreTitle);
    if (coreTitleTokens.length === 0) return;
    var coreTitleSet = toSet(coreTitleTokens);
    var coreTitleBg = bigrams(coreTitleTokens);
    var coreTitleBgSet = toSet(coreTitleBg);

    // Core abstract
    var coreAbstract = getCoreAbstract();
    var coreAbsTokens = tokenize(coreAbstract);
    var coreAbsSet = toSet(coreAbsTokens);
    var coreAbsBg = bigrams(coreAbsTokens);
    var coreAbsBgSet = toSet(coreAbsBg);

    // Build global word frequency map (across all reference titles + abstracts)
    var wordFreqs = {};
    for (var i = 0; i < references.length; i++) {
      var t = extractRefTitle(references[i].el.textContent || '');
      var abs = references[i].el.getAttribute('data-abstract') || '';
      var allWords = tokenize(t + ' ' + abs);
      var seen = {};
      for (var j = 0; j < allWords.length; j++) {
        if (!seen[allWords[j]]) {
          wordFreqs[allWords[j]] = (wordFreqs[allWords[j]] || 0) + 1;
          seen[allWords[j]] = true;
        }
      }
    }

    for (var r = 0; r < references.length; r++) {
      var ref = references[r];
      var text = ref.el.textContent || '';
      var refAbstract = ref.el.getAttribute('data-abstract') || '';
      var score = computeRelevance(
        coreTitleTokens, coreTitleSet, coreTitleBg, coreTitleBgSet,
        coreAbsTokens, coreAbsSet, coreAbsBg, coreAbsBgSet,
        text, refAbstract, wordFreqs, queryStr || ''
      );
      ref.relevance = score;
      ref.el.setAttribute('data-relevance', score);

      // Inject badge before the action buttons
      var badge = document.createElement('span');
      badge.className = 'ref-relevance';
      badge.title = 'Estimated relevance to this publication';
      badge.textContent = score + '%';
      badge.style.backgroundColor = relevanceColor(score);
      badge.style.color = '#fff';

      var actions = ref.el.querySelector('.reference-actions');
      if (actions) {
        ref.el.insertBefore(badge, actions);
      } else {
        ref.el.appendChild(badge);
      }
    }
  }

  /**
   * Re-score a single reference after its abstract becomes available
   * (called from backgroundPrefetch).
   */
  function rescoreReference(ref, queryStr) {
    var coreTitle = getCoreTitle();
    if (!coreTitle) return;
    var coreTitleTokens = tokenize(coreTitle);
    if (coreTitleTokens.length === 0) return;

    var coreAbstract = getCoreAbstract();
    var coreAbsTokens = tokenize(coreAbstract);

    var refAbstract = ref.el.getAttribute('data-abstract') || '';
    if (!refAbstract) return; // nothing new to score with

    var score = computeRelevance(
      coreTitleTokens, toSet(coreTitleTokens), bigrams(coreTitleTokens), toSet(bigrams(coreTitleTokens)),
      coreAbsTokens, toSet(coreAbsTokens), bigrams(coreAbsTokens), toSet(bigrams(coreAbsTokens)),
      ref.el.textContent || '', refAbstract, {}, queryStr || ''
    );

    // Only update if score improved (abstract should never reduce relevance)
    if (score > (ref.relevance || 0)) {
      ref.relevance = score;
      ref.el.setAttribute('data-relevance', score);
      var badge = ref.el.querySelector('.ref-relevance');
      if (badge) {
        badge.textContent = score + '%';
        badge.style.backgroundColor = relevanceColor(score);
        badge.style.color = '#fff';
      }
    }
  }

  /**
   * Map 0-100 relevance score to a colour.
   * Low scores → grey, mid → amber, high → green.
   */
  function relevanceColor(score) {
    if (score >= 75) return '#16a34a'; // green-600
    if (score >= 50) return '#65a30d'; // lime-600
    if (score >= 35) return '#ca8a04'; // yellow-600
    if (score >= 20) return '#d97706'; // amber-600
    return '#94a3b8';                  // slate-400 (grey)
  }

})();
