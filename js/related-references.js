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

  function enhanceSection(section) {
    // Tag the heading above this section for extra top-margin
    var prev = section.previousElementSibling;
    // Skip past non-heading elements (e.g. <p>, <script>) to find the heading
    while (prev && !/^H[1-6]$/.test(prev.tagName)) prev = prev.previousElementSibling;
    if (prev) prev.classList.add('ref-section-heading');

    var hangingIndent = section.querySelector('.hanging-indent');
    if (!hangingIndent) return;

    var paragraphs = hangingIndent.querySelectorAll('p');
    if (!paragraphs.length) return;

    // Read pre-embedded metadata from <script class="ref-metadata"> JSON block
    var metadata = {};
    var metaScript = section.querySelector('script.ref-metadata');
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
      // Abstract button: only show when abstract is already known
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
      actionsHtml += '</span>';
      p.insertAdjacentHTML('beforeend', actionsHtml);

      references.push({
        el: p,
        year: year,
        doi: doi,
        searchText: text.toLowerCase()
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

    // Build toolbar
    var toolbar = createToolbar(minYear, maxYear, types, hasAnyDoi, scopusQueries);
    section.parentNode.insertBefore(toolbar, section);

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
    });

    updateCount(toolbar, references.length, references.length);
    setupFiltering(toolbar, references, hangingIndent, minYear, maxYear);

    // Background-fetch metadata for DOIs missing embedded data (types + abstracts)
    backgroundPrefetch(section, references);
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
        '<button class="ref-btn ref-export-bib" title="Export all visible references as BibTeX"><i class="fas fa-file-code"></i> BibTeX</button>'
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
        '<div class="ref-year-filter">' +
          '<label class="ref-filter-label"><i class="fas fa-calendar-alt"></i> Year</label>' +
          '<div class="ref-year-inputs">' +
            '<input type="number" class="ref-year-min" min="' + minYear + '" max="' + maxYear + '" value="' + minYear + '" aria-label="Minimum year">' +
            '<span class="ref-year-sep">&ndash;</span>' +
            '<input type="number" class="ref-year-max" min="' + minYear + '" max="' + maxYear + '" value="' + maxYear + '" aria-label="Maximum year">' +
          '</div>' +
        '</div>' +
        typeFilterHtml +
        '<div class="ref-sort-filter">' +
          '<label class="ref-filter-label"><i class="fas fa-sort"></i> Sort</label>' +
          '<div class="ref-sort-btns">' +
            '<button class="ref-btn ref-sort-btn active" data-sort="alpha" title="Sort alphabetically">A&ndash;Z</button>' +
            '<button class="ref-btn ref-sort-btn" data-sort="year-desc" title="Newest first">Year &darr;</button>' +
            '<button class="ref-btn ref-sort-btn" data-sort="year-asc" title="Oldest first">Year &uarr;</button>' +
          '</div>' +
        '</div>' +
        '<button class="ref-btn ref-reset-filters" style="display:none" title="Reset all filters"><i class="fas fa-times-circle"></i> Reset filters</button>' +
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
    // Top line: details left, GitHub link right
    var hasLink = q.scriptPath || q.source;
    var hasDetails = q.period || q.collected;
    if (hasLink || hasDetails) {
      html += '<div class="ref-query-header">';
      var details = [];
      if (q.period) details.push('Period: ' + escapeHtml(q.period).replace(/-/g, '\u2013'));
      if (q.collected) details.push('Collected: ' + escapeHtml(q.collected));
      if (details.length) html += '<span class="ref-query-details">' + details.join(' \u00b7 ') + '</span>';
      if (q.scriptPath) {
        var ghUrl = 'https://github.com/pablobernabeu/website-files/blob/master/' +
          encodeURI(q.scriptPath);
        html += '<a class="ref-query-link" href="' + ghUrl + '" target="_blank" rel="noopener">' +
          '<i class="fab fa-github"></i> View script on GitHub</a>';
      } else if (q.source) {
        html += '<span class="ref-query-label">' + escapeHtml(q.source === 'auto' ? 'Auto-generated query' : 'From script') + '</span>';
      }
      html += '</div>';
    }
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
      html += '<option value="' + keys[i] + '">' + prettifyType(keys[i]) + ' (' + types[keys[i]] + ')</option>';
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
    var currentSort = 'alpha';

    function isFilterActive() {
      var query = (searchInput.value || '').trim();
      var yearMin = parseInt(yearMinInput.value, 10);
      var yearMax = parseInt(yearMaxInput.value, 10);
      var typeVal = typeSelect.value;
      return query !== '' ||
        yearMin !== defaultMinYear ||
        yearMax !== defaultMaxYear ||
        typeVal !== '';
    }

    function applyFilters() {
      var query = (searchInput.value || '').toLowerCase().trim();
      var yearMin = parseInt(yearMinInput.value, 10) || 0;
      var yearMax = parseInt(yearMaxInput.value, 10) || 9999;
      var typeVal = typeSelect.value;
      var visible = 0;

      clearBtn.style.display = query ? '' : 'none';
      resetBtn.style.display = isFilterActive() ? '' : 'none';

      for (var i = 0; i < references.length; i++) {
        var ref = references[i];
        var show = true;

        // All filters are cumulative (AND logic)
        if (query && ref.searchText.indexOf(query) === -1) show = false;
        if (show && ref.year && (ref.year < yearMin || ref.year > yearMax)) show = false;
        if (show && typeVal && (ref.el.getAttribute('data-type') || '') !== typeVal) show = false;

        ref.el.style.display = show ? '' : 'none';

        // Also hide/show any abstract panel sibling
        var nextEl = ref.el.nextElementSibling;
        if (nextEl && nextEl.classList.contains('reference-abstract')) {
          nextEl.style.display = show && nextEl.classList.contains('open') ? 'block' : 'none';
        }

        if (show) visible++;
      }

      updateCount(toolbar, visible, references.length);
    }

    function resetAllFilters() {
      searchInput.value = '';
      yearMinInput.value = defaultMinYear;
      yearMaxInput.value = defaultMaxYear;
      typeSelect.value = '';
      clearBtn.style.display = 'none';
      resetBtn.style.display = 'none';
      applyFilters();
    }

    function applySort() {
      var sorted = references.slice();
      if (currentSort === 'alpha') {
        sorted.sort(function (a, b) { return a.searchText < b.searchText ? -1 : a.searchText > b.searchText ? 1 : 0; });
      } else if (currentSort === 'year-desc') {
        sorted.sort(function (a, b) { return (b.year || 0) - (a.year || 0); });
      } else if (currentSort === 'year-asc') {
        sorted.sort(function (a, b) { return (a.year || 0) - (b.year || 0); });
      }
      var frag = document.createDocumentFragment();
      for (var i = 0; i < sorted.length; i++) {
        frag.appendChild(sorted[i].el);
        var abs = sorted[i].el.nextElementSibling;
        if (abs && abs.classList.contains('reference-abstract')) {
          frag.appendChild(abs);
        }
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
    resetBtn.addEventListener('click', resetAllFilters);

    Array.prototype.slice.call(sortBtns).forEach(function (btn) {
      btn.addEventListener('click', function () {
        Array.prototype.slice.call(sortBtns).forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentSort = btn.getAttribute('data-sort');
        applySort();
      });
    });

    // Expand / collapse all abstracts (rate-limited for on-demand fetches)
    if (expandAllBtn) {
      expandAllBtn.addEventListener('click', function () {
        // Collect refs whose abstracts aren't open yet
        var toExpand = [];
        for (var i = 0; i < references.length; i++) {
          var ref = references[i];
          var absBtn = ref.el.querySelector('.ref-abstract-btn');
          if (absBtn) {
            var panel = ref.el.nextElementSibling;
            if (!panel || !panel.classList.contains('reference-abstract') || !panel.classList.contains('open')) {
              toExpand.push({ el: ref.el, btn: absBtn });
            }
          }
        }
        // Expand in small batches to avoid flooding CrossRef
        var batchIdx = 0;
        var BATCH = 6;
        function expandBatch() {
          var end = Math.min(batchIdx + BATCH, toExpand.length);
          for (var j = batchIdx; j < end; j++) {
            toggleAbstract(toExpand[j].el, toExpand[j].btn);
          }
          batchIdx = end;
          if (batchIdx < toExpand.length) setTimeout(expandBatch, 300);
        }
        expandBatch();

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
          var panel = references[i].el.nextElementSibling;
          var absBtn = references[i].el.querySelector('.ref-abstract-btn');
          if (panel && panel.classList.contains('reference-abstract') && panel.classList.contains('open')) {
            panel.classList.remove('open');
            panel.style.display = 'none';
            if (absBtn) absBtn.setAttribute('aria-expanded', 'false');
          }
        }
        collapseAllBtn.style.display = 'none';
        collapseAllBtn.classList.remove('active');
        if (expandAllBtn) expandAllBtn.style.display = '';
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
  }

  function updateCount(toolbar, visible, total) {
    var el = toolbar.querySelector('.ref-count');
    el.textContent = visible === total
      ? total + ' reference' + (total !== 1 ? 's' : '')
      : 'Showing ' + visible + ' of ' + total + ' references';
  }

  // =========================================================================
  //  ABSTRACT TOGGLE
  // =========================================================================

  function toggleAbstract(p, btn) {
    var abstractText = p.getAttribute('data-abstract');
    var doi = p.getAttribute('data-doi');

    var panel = p.nextElementSibling;
    if (!panel || !panel.classList.contains('reference-abstract')) {
      panel = document.createElement('div');
      panel.className = 'reference-abstract';
      p.parentNode.insertBefore(panel, p.nextSibling);
    }

    // If already open, just close
    if (panel.classList.contains('open')) {
      panel.classList.remove('open');
      panel.style.display = 'none';
      if (btn) btn.setAttribute('aria-expanded', 'false');
      return;
    }

    // Open the panel
    panel.classList.add('open');
    panel.style.display = 'block';
    if (btn) btn.setAttribute('aria-expanded', 'true');

    // If abstract is already loaded, show it
    if (panel.dataset.loaded) return;

    if (abstractText) {
      panel.innerHTML = '<p>' + escapeHtml(cleanAbstract(abstractText)) + '</p>';
      panel.dataset.loaded = 'true';
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
          panel.innerHTML = '<p class="ref-no-abstract">No abstract available.</p>';
          panel.dataset.loaded = 'true';
        }
        // Also store type if obtained
        if (result && result.type && !p.getAttribute('data-type')) {
          p.setAttribute('data-type', result.type);
          var sec = p.closest ? p.closest('.related-references') : p.parentNode;
          if (sec) rebuildTypeDropdown(sec);
        }
      });
    } else {
      panel.innerHTML = '<p class="ref-no-abstract">No abstract available.</p>';
      panel.dataset.loaded = 'true';
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
  function backgroundPrefetch(section, references) {
    var queue = [];
    for (var i = 0; i < references.length; i++) {
      var ref = references[i];
      if (ref.doi && !ref.el.getAttribute('data-type') && !crossrefCache[ref.doi]) {
        queue.push(ref);
      }
    }
    if (!queue.length) return;

    var idx = 0;
    var concurrent = 0;
    var MAX_CONCURRENT = 4;
    var typesChanged = false;
    var rebuildTimer = null;

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
              }
              if (result.type && !ref.el.getAttribute('data-type')) {
                ref.el.setAttribute('data-type', result.type);
                typesChanged = true;
              }
            }
            scheduleRebuild();
            // Small delay before next request to stay polite
            setTimeout(next, 120);
          });
        })(queue[idx]);
        idx++;
      }
      // Final rebuild when queue is drained
      if (idx >= queue.length && concurrent === 0 && typesChanged) {
        clearTimeout(rebuildTimer);
        rebuildTypeDropdown(section);
      }
    }
    // Stagger start
    setTimeout(next, 500);
  }

  // =========================================================================
  //  CROSSREF API (on-demand fallback)
  // =========================================================================

  function fetchCrossRef(doi, callback) {
    if (crossrefCache[doi]) { callback(crossrefCache[doi]); return; }

    var url = 'https://api.crossref.org/works/' + encodeURIComponent(doi);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.timeout = 15000;
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
          callback(result);
        } catch (e) { callback(null); }
      } else { callback(null); }
    };
    xhr.onerror = function () { callback(null); };
    xhr.ontimeout = function () { callback(null); };
    xhr.send();
  }

  /** Fetch BibTeX for a single DOI. Tries CrossRef transform API first,
   *  then falls back to DOI content negotiation (doi.org). */
  function fetchBibTeX(doi, callback) {
    var crossrefUrl = 'https://api.crossref.org/works/' + encodeURIComponent(doi) + '/transform/application/x-bibtex';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', crossrefUrl, true);
    xhr.timeout = 15000;
    xhr.onload = function () {
      if (xhr.status === 200 && xhr.responseText.trim().charAt(0) === '@') {
        callback(xhr.responseText.trim());
      } else {
        // Fallback: DOI content negotiation
        fetchBibTeXFromDoi(doi, callback);
      }
    };
    xhr.onerror = xhr.ontimeout = function () { fetchBibTeXFromDoi(doi, callback); };
    xhr.send();
  }

  /** Fallback BibTeX fetch via doi.org content negotiation. */
  function fetchBibTeXFromDoi(doi, callback) {
    var url = 'https://doi.org/' + encodeURIComponent(doi);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Accept', 'application/x-bibtex');
    xhr.timeout = 15000;
    xhr.onload = function () {
      if (xhr.status === 200 && xhr.responseText.trim().charAt(0) === '@') {
        callback(xhr.responseText.trim());
      } else {
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

    // BibTeX: fetch each DOI via CrossRef transform API
    var bibs = new Array(visible.length);
    var pending = 0;

    for (var k = 0; k < visible.length; k++) {
      var doi = visible[k].doi;
      if (!doi) {
        bibs[k] = '% No DOI: ' + getCleanText(visible[k].el);
        continue;
      }
      pending++;
      (function (d, idx) {
        fetchBibTeX(d, function (bib) {
          bibs[idx] = bib || ('% Failed: ' + d);
          pending--;
          if (pending === 0) {
            downloadFile(bibs.filter(Boolean).join('\n\n'), 'references.bib', 'application/x-bibtex');
          }
        });
      })(doi, k);
    }

    if (pending === 0) {
      downloadFile(bibs.filter(Boolean).join('\n\n'), 'references.bib', 'application/x-bibtex');
    }
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

})();
