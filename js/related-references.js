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

  // References are rendered a page at a time, replacing an earlier hard cap:
  // the references past a cap are simply unreachable, whereas a page with a
  // "show more" is a model readers already have.
  //
  // This is also the only thing that bounds the cost of the list, and the
  // bound is worth having. Measured on the 8,102-reference thesis page, one
  // search re-filter takes 55 ms at this size and 6,246 ms with everything
  // rendered; a battery of filter, sort and slider interactions accrues 951 ms
  // of long tasks here against 119,767 ms unrendered-bound. Cold load, by
  // contrast, is identical from 50 to 1,000 — that budget is relevance
  // scoring, which no display bound touches. 300 is the first size at which a
  // single filter pass crosses 100 ms, so this sits comfortably below it.
  var RELATED_REFERENCES_PAGE_SIZE = 100;

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

  /**
   * First descendant link whose href points at a DOI. Equivalent to
   * querySelector('a[href*="doi.org/"]'), which is run once per reference and
   * again per reference for the self-citation sweep; the selector engine's
   * attribute-substring matcher is the expensive part, and a tag lookup over a
   * citation paragraph's handful of links does the same job.
   */
  function findDoiLink(el) {
    var links = el.getElementsByTagName('a');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      if (href && href.indexOf('doi.org/') !== -1) return links[i];
    }
    return null;
  }

  /**
   * Wrap the journal name and volume number in <em> tags for APA 7 citations
   * that came through as plain text (e.g. from CrossRef content negotiation).
   * Pattern targeted: ". Journal Name, Volume[(Issue)][, Pages]. <a href"
   * Volume must NOT be immediately followed by an en/em-dash, which would
   * indicate a page range rather than a volume number (e.g. "89\u201390").
   */
  function applyApaItalics(html) {
    // Strip Portico preservation-service label inserted by CrossRef's APA formatter
    html = html.replace(/\.?\s*Portico\.?/g, '');
    // 1. Journal articles: ". Journal, Volume[(Issue)][, Pages]. <a href"
    var result = html.replace(
      /(\.\s+)([^.<>]+?),\s*(\d{1,4})(?![\u2013\u2014-])(\([^)]+\))?((?:,\s*[\w\d\u2013-]+(?:[\u2013-]\d+)?)*)(\.\s*(?:https?:\/\/\S+\s*)?\s*<a\s+href)/gi,
      function (match, dot, journal, vol, issue, pages, trailer) {
        return dot + '<em>' + journal + '</em>, <em>' + vol + '</em>' +
               (issue || '') + (pages || '') + trailer;
      }
    );
    // 2. Conference proceedings / book chapters: ". Container Title, N–M. <a href"
    // Only runs when step 1 did not match (result unchanged means no <em> was added).
    if (result === html) {
      result = result.replace(
        /(\.\s+)([^.<>]+?),\s*(\d+[\u2013\u2014-]\d+)(\.\s*(?:https?:\/\/\S+\s*)?\s*<a\s+href)/gi,
        function (match, dot, container, pages, trailer) {
          return dot + '<em>' + container + '</em>, ' + pages + trailer;
        }
      );
    }
    // 3. Ahead-of-print / online-first: ". Journal Name. <a href" (no volume/issue/pages)
    // Only runs when steps 1 and 2 did not match.
    if (result === html) {
      result = result.replace(
        /(\.\s+)([^.<>]+?)(\.\s*(?:https?:\/\/\S+\s*)?\s*<a\s+href)/gi,
        function (match, dot, journal, trailer) {
          return dot + '<em>' + journal + '</em>' + trailer;
        }
      );
    }
    return result;
  }

  function extractReferenceTitle(text) {
    if (!text) return null;

    var normalized = text.replace(/\s+/g, ' ').trim();
    var afterYear = normalized.match(/\(\d{4}[a-z]?(?:,\s*[A-Za-z.]+\s*\d{0,2})?\)\.\s*(.+)$/);
    if (!afterYear) return null;

    var remainder = afterYear[1]
      .replace(/\s*https?:\/\/doi\.org\/\S+.*$/i, '')
      .trim();
    if (!remainder) return null;

    var titleMatch = remainder.match(/^(.+?)(?:[.?!](?:\s|$))/);
    var title = (titleMatch ? titleMatch[1] : remainder)
      .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
      .trim();

    if (!title) return null;
    if (/^(https?:\/\/|doi:)/i.test(title)) return null;
    if (!/[A-Za-z0-9]/.test(title)) return null;

    return title;
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
        var selfLink = findDoiLink(allPs[si]);
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

    // Detach from DOM during bulk mutation to avoid per-ref layout thrashing.
    var hangingNextSibling = hangingIndent.nextSibling;
    section.removeChild(hangingIndent);

    // Apply APA 7 italics to citations that were stored as plain text (e.g. from
    // CrossRef content negotiation, which returns no formatting).  Skip paragraphs
    // that already have <em> or <i> tags — they were either manually formatted or
    // came from a source that already included markup.
    for (var ai = 0; ai < paragraphs.length; ai++) {
      if (!paragraphs[ai].querySelector('em, i')) {
        paragraphs[ai].innerHTML = applyApaItalics(paragraphs[ai].innerHTML);
      }
    }

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

    // The action bar differs between references only in whether the Abstract
    // and Export buttons are present and in the two search URLs. Parsing the
    // same markup once per reference costs an HTML parse per reference (7,259
    // of them on the largest page); build the four shapes once and clone.
    var actionTemplates = {};
    function actionTemplate(hasAbstract, hasDoi) {
      var key = (hasAbstract ? 'a' : '-') + (hasDoi ? 'd' : '-');
      if (actionTemplates[key]) return actionTemplates[key];
      var html = '<span class="reference-actions">';
      if (hasAbstract) {
        html += '<button class="ref-btn ref-abstract-btn" aria-expanded="false">' +
          '<i class="fas fa-align-left"></i> Abstract</button>';
      }
      html += '<button class="ref-btn ref-copy-btn" title="Copy citation">' +
        '<i class="fas fa-copy"></i> Copy</button>';
      if (hasDoi) {
        html += '<button class="ref-btn ref-export-btn" title="Export as BibTeX">' +
          '<i class="fas fa-download"></i> Export</button>';
      }
      html += '<span class="ref-icon-pair">' +
        '<button class="ref-search-icon-btn" data-url="" title="Search on Google Scholar">' +
        '<img src="/img/google-scholar-favicon.png" alt="Scholar" width="22" height="22" class="ref-search-logo"></button>' +
        '<button class="ref-search-icon-btn" data-url="" title="Search on Google">' +
        '<img src="/img/google-favicon.png" alt="Google" width="22" height="22" class="ref-search-logo"></button>' +
        '</span></span>';
      var holder = document.createElement('div');
      holder.innerHTML = html;
      actionTemplates[key] = holder.firstChild;
      return actionTemplates[key];
    }

    /**
     * Give a reference its overlap badge and action bar, once, the first time
     * the filters decide to show it. Building these eagerly added roughly eight
     * elements to each of 8,102 references, and the browser then had to lay out
     * and paint a document of ~112,000 nodes; only the current page is ever on
     * screen. The Abstract button's presence is read from the live attribute
     * rather than a cached flag, so a reference whose abstract arrived from
     * CrossRef in the meantime still gets one.
     *
     * The badge is inserted before the action bar rather than appended. A
     * reference decorated before scoring finished has an action bar and no
     * badge, and appending the badge later would leave it stranded on the far
     * side of eight buttons on those references only.
     */
    function ensureDecorated(ref) {
      var el = ref.el;
      if (ref._actionsBuilt !== true) {
        ref._actionsBuilt = true;
        var actions = actionTemplate(
          !!el.getAttribute('data-abstract') || !!el.getAttribute('data-abstract-pruned'),
          !!ref.doi
        ).cloneNode(true);
        // The icon pair is the template's last child and holds the two search
        // buttons in a fixed order, so the URLs can be filled in without a
        // selector lookup.
        var iconPair = actions.lastChild;
        iconPair.children[0].setAttribute('data-url', ref.scholarUrl);
        iconPair.children[1].setAttribute('data-url', ref.googleUrl);
        el.appendChild(actions);
        ref._actions = actions;
      }
      if (ref.relevance != null && !ref._badge) {
        var badge = document.createElement('span');
        badge.className = 'ref-relevance ' + relevanceTier(ref);
        badge.title = describeRelevance(ref);
        badge.textContent = String(ref.relevance);
        if (ref._actions) el.insertBefore(badge, ref._actions);
        else el.appendChild(badge);
        ref._badge = badge;
      }
    }

    for (var i = 0; i < paragraphs.length; i++) {
      var p = paragraphs[i];
      var text = p.textContent || '';
      if (!text.trim()) continue;

      var titleForSearch = extractReferenceTitle(text);
      if (!titleForSearch) {
        p.style.display = 'none';
        p.classList.add('ref-no-title');
        continue;
      }

      // Extract year
      var yearMatch = text.match(/\((\d{4})[a-z]?(?:,\s*[A-Za-z.]+\s*\d{0,2})?\)/);
      var year = yearMatch ? parseInt(yearMatch[1], 10) : null;

      // Extract DOI
      var doi = null;
      var doiLink = findDoiLink(p);
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
        if (meta.dateAdded) p.setAttribute('data-added', meta.dateAdded);
        // The abstract exists upstream but is not shipped with the page,
        // because this reference falls below the pruning threshold in
        // scripts/prune_reference_abstracts.py. Keep its Abstract button and
        // fetch on demand; never fetch it in bulk.
        if (meta.abstractPruned) p.setAttribute('data-abstract-pruned', '1');
      }

      // Also apply from sessionStorage cache
      if (doi && crossrefCache[doi]) {
        var cached = crossrefCache[doi];
        if (cached.abstract && !p.getAttribute('data-abstract')) p.setAttribute('data-abstract', cleanAbstract(cached.abstract));
        if (cached.type && !p.getAttribute('data-type')) p.setAttribute('data-type', cached.type);
      }

      var pType = p.getAttribute('data-type') || '';
      var abstractForSearch = p.getAttribute('data-abstract') || '';

      if (year) p.setAttribute('data-year', year);
      if (doi) { p.setAttribute('data-doi', doi); hasAnyDoi = true; }
      p.classList.add('ref-item');

      // Track types for filter dropdown
      if (pType) types[pType] = (types[pType] || 0) + 1;

      // Extract title (text after "(YEAR). " up to first sentence-ending punctuation)
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
      // The action bar is not built here. Only the references the filters
      // actually display are ever decorated (see ensureDecorated below), which
      // is one page at a time — on the largest page, 100 of 8,102.
      references.push({
        el: p,
        year: year,
        doi: doi,
        // Captured before any decoration, so relevance scoring never sees the
        // button labels that used to end up in the paragraph's textContent.
        citationText: text,
        scholarUrl: 'https://scholar.google.com/scholar?q=' + searchQuery,
        googleUrl: 'https://www.google.com/search?q=' + searchQuery,
        searchText: (text + ' ' + abstractForSearch).toLowerCase(),
        sourceIndex: references.length
      });
    }

    // Reattach — all off-screen mutations complete; browser does one layout pass.
    if (hangingNextSibling) {
      section.insertBefore(hangingIndent, hangingNextSibling);
    } else {
      section.appendChild(hangingIndent);
    }

    if (!references.length) {
      section.style.display = 'none';
      if (prev) prev.style.display = 'none';
      return;
    }

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

    updateCount(toolbar, references.length, references.length, references.length, false);
    var ctrl = setupFiltering(
      toolbar, references, hangingIndent, minYear, maxYear,
      RELATED_REFERENCES_PAGE_SIZE, ensureDecorated
    );

    var queryStr = scopusQueries
      ? (Array.isArray(scopusQueries) ? scopusQueries[0].query : scopusQueries.query)
      : null;

    // Restore saved filter state or apply default initial sort synchronously,
    // so the list appears in a reasonable order on first paint.
    //
    // Nothing is filtered here and nothing is filtered later. A silent 20%
    // overlap floor used to be applied once scoring finished, on the theory
    // that it kept a huge list manageable. It did not: measured against the
    // same page with the floor removed, it changed no timing metric outside
    // run-to-run noise and left the document 987 nodes *larger*, because the
    // re-filter it triggered decorated a third overlapping page. Paging is
    // what bounds the list. What the floor did do was hide 84% of the thesis
    // page's references from a reader who had asked for nothing, report the
    // filtered figure as if it were the total, and arrive with "Reset filters"
    // already lit.
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

    // Restore previously expanded abstracts synchronously.
    try {
      var expandedDois = getExpandedState();
      if (expandedDois.length) {
        var expandAllBtn = toolbar.querySelector('.ref-expand-all');
        var collapseAllBtn = toolbar.querySelector('.ref-collapse-all');
        var anyExpanded = false;
        var toRestore = [];
        for (var ri = 0; ri < references.length; ri++) {
          var ref = references[ri];
          if (ref.doi && expandedDois.indexOf(ref.doi) !== -1) {
            // Restoring an expanded abstract needs the reference's own button,
            // so decorate it now even if the filters have not reached it yet.
            ensureDecorated(ref);
            toRestore.push({ el: ref.el, btn: ref.el.querySelector('.ref-abstract-btn') });
            anyExpanded = true;
          }
        }
        ctrl.expandInBatches(toRestore);
        if (anyExpanded && expandAllBtn && collapseAllBtn) {
          expandAllBtn.style.display = 'none';
          collapseAllBtn.style.display = '';
          collapseAllBtn.classList.add('active');
          ctrl.setExpandAllActive(true);
        }
        ctrl.applyFilters();
      }
    } catch (e) { console.warn('[related-refs] restore error:', e); }

    // Background-fetch metadata for DOIs missing embedded data (types +
    // abstracts), then re-score once the batch is settled so the ranking rests
    // on one consistent corpus-wide calculation.
    //
    // Deliberately started only after relevance has been scored, so it can be
    // limited to the references actually on screen. Queued over the whole
    // collection it was unbounded: 2,065 of the thesis page's references still
    // lack a type, so every visitor's browser opened 2,065 CrossRef requests,
    // two at a time, for data that affects 130 references they can see. The
    // collector backfills the rest server-side.
    function startPrefetch() {
      backgroundPrefetch(section, references, function () {
        try {
          if (addRelevanceBadges(references, queryStr)) {
            ctrl.setRelevanceReady(true);
            ctrl.updateRelevanceMax();
            ctrl.applySort();
          }
        } catch (refreshErr) {
          if (typeof console !== 'undefined' && console.error) {
            console.error('[related-refs] relevance refresh error:', refreshErr);
          }
        }
      });
    }

    // "Show more" reveals a page the first sweep could not see, so run it
    // again each time. backgroundPrefetch skips whatever it has already
    // queued or cached, so repeat calls only pick up what is new.
    ctrl.setPageGrownHandler(startPrefetch);

    // Defer only the expensive NLP relevance scoring behind a single event-loop
    // tick so the browser can paint the buttons and toolbar first.
    setTimeout(function () {
      try {
        var relevanceReady = addRelevanceBadges(references, queryStr);
        ctrl.setRelevanceReady(relevanceReady);
        ctrl.updateRelevanceMax();
        // Re-sort now that scores are available (only matters when sort = overlap).
        ctrl.applySort();
      } catch (badgeErr) {
        // The page has no usable title, or scoring threw. The list keeps
        // source order and the overlap control removes itself; a control that
        // filters on a score nothing computed can only empty the list.
        ctrl.setRelevanceReady(false);
        ctrl.updateRelevanceMax();
        ctrl.applySort();
        if (typeof console !== 'undefined' && console.error) {
          console.error('[related-refs] relevance scoring error:', badgeErr);
        }
      }
      // Either way the displayed set is now final, so the prefetch can be
      // scoped to it.
      startPrefetch();
    }, 0);
  }

  // =========================================================================
  //  TOOLBAR
  // =========================================================================

  var toolbarSeq = 0;

  function createToolbar(minYear, maxYear, types, hasAnyDoi, scopusQueries) {
    var toolbar = document.createElement('div');
    toolbar.className = 'ref-toolbar';
    var relInputId = 'ref-overlap-min-' + (++toolbarSeq);

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
            '<label class="ref-filter-label" for="' + relInputId + '">' +
              '<i class="fas fa-bullseye"></i> Word overlap</label>' +
            '<svg class="ref-rel-sparkline" viewBox="0 0 200 28" preserveAspectRatio="none" ' +
              'role="img" aria-label="Distribution of word-overlap scores"></svg>' +
            '<div class="ref-relevance-inputs">' +
              '<input type="range" id="' + relInputId + '" class="ref-relevance-min" ' +
                'min="0" max="100" value="0" disabled aria-valuetext="every reference">' +
              // The readout is the label's visible text and would be read twice
              // over; aria-valuetext on the slider says the same thing better.
              '<span class="ref-relevance-value" aria-hidden="true">all</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="ref-sort-filter">' +
          '<label class="ref-filter-label"><i class="fas fa-sort"></i> Sort</label>' +
          '<div class="ref-sort-btns">' +
            // data-sort stays "relevance" so filter state saved by an earlier
            // visit still restores; only the reader-facing word changes.
            '<button class="ref-btn ref-sort-btn active" data-sort="relevance" title="Highest word overlap first"><i class="fas fa-bullseye"></i> Overlap</button>' +
            '<button class="ref-btn ref-sort-btn" data-sort="alpha" title="Sort alphabetically">A&ndash;Z</button>' +
            '<button class="ref-btn ref-sort-btn" data-sort="year-desc" title="Newest first">Year &darr;</button>' +
            '<button class="ref-btn ref-sort-btn" data-sort="year-asc" title="Oldest first">Year &uarr;</button>' +
            '<button class="ref-btn ref-reset-filters" style="visibility:hidden" title="Reset all filters"><i class="fas fa-times-circle"></i> Reset filters</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      // Hidden until scoring succeeds: on a page with no usable title there is
      // no overlap control to explain.
      '<p class="ref-relevance-note" hidden>' +
        'Word overlap counts the words and word pairs a reference shares with this ' +
        'publication’s title and abstract. The scale is arbitrary and ranks references ' +
        'only within this page. It is not a percentage, and not a judgement of quality.' +
      '</p>' +
      '<div class="ref-toolbar-row ref-count-row">' +
        '<span class="ref-count" role="status" aria-live="polite"><span class="ref-count-text"></span></span>' +
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

  function setupFiltering(toolbar, references, hangingIndent, defaultMinYear,
                          defaultMaxYear, pageSizeArg, ensureDecorated) {
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
    var relevanceReady = false;
    var pageSize = Math.max(1, parseInt(pageSizeArg, 10) || 100);
    var renderedCount = pageSize;
    var lastSignature = null;
    // References in the order the list is currently sorted. The page is taken
    // off the front of this, so "the first hundred" means the first hundred the
    // reader would actually scroll past.
    var orderedRefs = references.slice();

    // "Show more", placed after the list where a reader reaches for it.
    var moreBtn = document.createElement('button');
    moreBtn.type = 'button';
    moreBtn.className = 'ref-show-more';
    moreBtn.style.display = 'none';
    moreBtn.addEventListener('click', function () {
      var firstNew = renderedCount;
      renderedCount += pageSize;
      applyFilters();
      // The button hides itself once the list is exhausted, and focus cannot
      // rest on a hidden element: it fell back to <body>, dropping a keyboard
      // reader at the top of the document. Hand it to the first reference the
      // press revealed instead.
      if (moreBtn.style.display === 'none') {
        var revealed = null;
        var seen = 0;
        for (var i = 0; i < references.length; i++) {
          if (!references[i]._matchesFilters || !references[i]._onPage) continue;
          if (seen++ === firstNew) { revealed = references[i].el; break; }
        }
        if (revealed) {
          revealed.setAttribute('tabindex', '-1');
          revealed.focus();
        }
      } else {
        moreBtn.focus();
      }
      if (typeof onPageGrown === 'function') onPageGrown();
    });
    if (hangingIndent.parentNode) {
      hangingIndent.parentNode.insertBefore(moreBtn, hangingIndent.nextSibling);
    }

    /**
     * The slider's visible readout and its accessible name. Zero is not "0",
     * it is the absence of a filter, and saying so is the difference between a
     * control whose left end looks like a setting and one whose left end
     * obviously means "everything".
     */
    function updateRelevanceReadout(matchedCount) {
      var v = parseInt(relevanceMinInput.value, 10) || 0;
      if (!relevanceReady) {
        relevanceValueLabel.textContent = '…';
        relevanceMinInput.setAttribute('aria-valuetext', 'scoring not finished');
        return;
      }
      relevanceValueLabel.textContent = v > 0 ? '≥ ' + v : 'all';
      var says = v > 0
        ? 'word overlap ' + v + ' or more, out of ' + (relevanceMinInput.max || '100')
        : 'every reference, no minimum word overlap';
      if (matchedCount != null) {
        says += ' — ' + groupDigits(matchedCount) + ' reference' +
                (matchedCount === 1 ? '' : 's');
      }
      relevanceMinInput.setAttribute('aria-valuetext', says);
    }

    function compareRelevance(a, b) {
      var scoreDifference = (b.relevance || 0) - (a.relevance || 0);
      if (scoreDifference) return scoreDifference;
      return compareSourceOrder(a, b);
    }

    function compareSourceOrder(a, b) {
      return (a.sourceIndex || 0) - (b.sourceIndex || 0);
    }

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
      var matched = [];
      var baseMatched = [];

      clearBtn.style.display = query ? '' : 'none';

      for (var i = 0; i < orderedRefs.length; i++) {
        var ref = orderedRefs[i];
        var matchesFilters = true;

        // Refresh searchText to include any abstract fetched after init. The
        // check lowercases the whole abstract, so it is done only when the
        // attribute differs from the value last seen; otherwise every filter
        // pass allocates a lowercase copy of every abstract on the page.
        var absText = ref.el.getAttribute('data-abstract') || '';
        if (absText && absText !== ref._absSeen) {
          ref._absSeen = absText;
          if (ref.searchText.indexOf(absText.toLowerCase().substring(0, 40)) === -1) {
            ref.searchText = ref.searchText + ' ' + absText.toLowerCase();
          }
        }
        var fullSearch = ref.searchText;
        // All filters are cumulative (AND logic). The relevance floor is applied
        // in the second pass below, once the slider's own minimum is known.
        if (query && fullSearch.indexOf(query) === -1) matchesFilters = false;
        if (matchesFilters && ref.year && (ref.year < yearMin || ref.year > yearMax)) matchesFilters = false;
        if (matchesFilters && typeVal && (ref.el.getAttribute('data-type') || '') !== typeVal) matchesFilters = false;

        ref._matchesBase = matchesFilters;
        ref._matchesFilters = false;
        ref._onPage = false;
        if (matchesFilters) baseMatched.push(ref);
      }

      resetBtn.style.visibility = isFilterActive() ? 'visible' : 'hidden';

      // Gated on relevanceReady, not just on relMin. Until scoring has run
      // every ref.relevance is undefined, so an ungated floor — restored from
      // sessionStorage before the deferred scoring pass — rejects the entire
      // list, and nothing re-applies the filters until scoring completes. If
      // scoring then fails, nothing re-applies them at all and the list stays
      // permanently empty.
      var floorActive = relevanceReady && relMin > 0;
      for (var bi = 0; bi < baseMatched.length; bi++) {
        var baseRef = baseMatched[bi];
        if (floorActive && (baseRef.relevance || 0) < relMin) continue;
        baseRef._matchesFilters = true;
        matched.push(baseRef);
      }

      // Start again at the first page whenever the selection itself changes,
      // but not when the list is merely re-applied (after scoring, say), which
      // would throw away pages the reader had already asked for.
      var signature = [query, yearMin, yearMax, typeVal, relMin, currentSort].join('');
      if (signature !== lastSignature) {
        lastSignature = signature;
        renderedCount = pageSize;
      }

      // matched is in the order the list is sorted, because the loop above
      // walks orderedRefs, so the page boundary follows what the reader sees.
      var pageEnd = Math.min(renderedCount, matched.length);
      for (var pi = 0; pi < pageEnd; pi++) {
        matched[pi]._onPage = true;
      }

      var visible = 0;
      for (var vi = 0; vi < references.length; vi++) {
        var visibleRef = references[vi];
        var show = visibleRef._matchesFilters && visibleRef._onPage;
        if (show) ensureDecorated(visibleRef);
        // Writing an inline style invalidates style and layout for that element
        // even when the value is unchanged. Filters are re-applied several
        // times during load, and most references keep the same visibility each
        // time, so only write when it actually differs.
        var wantDisplay = show ? '' : 'none';
        if (visibleRef.el.style.display !== wantDisplay) {
          visibleRef.el.style.display = wantDisplay;
        }

        // Also hide/show any abstract panel
        var refPid = visibleRef.el.getAttribute('data-panel-id');
        if (refPid) {
          var refPanel = visibleRef.el.parentNode.querySelector('.reference-abstract[data-for-panel="' + refPid + '"]');
          if (refPanel) {
            var wantPanel = show && refPanel.classList.contains('open') ? 'block' : 'none';
            if (refPanel.style.display !== wantPanel) refPanel.style.display = wantPanel;
          }
        }

        if (show) visible++;
      }

      updateCount(toolbar, visible, matched.length, references.length, relevanceReady);
      updateRelevanceReadout(matched.length);

      var remaining = matched.length - visible;
      if (remaining > 0) {
        moreBtn.textContent = 'Show ' + groupDigits(Math.min(pageSize, remaining)) +
          ' more of ' + groupDigits(remaining) + ' remaining';
        moreBtn.style.display = '';
      } else if (moreBtn.style.display !== 'none') {
        moreBtn.style.display = 'none';
      }

      drawSparkline(baseMatched);

      // When expand-all mode is active, auto-expand any newly visible refs
      // whose abstracts aren't open yet.
      if (expandAllActive) {
        var toReopen = [];
        for (var ei = 0; ei < references.length; ei++) {
          var eRef = references[ei];
          if (eRef.el.style.display === 'none') continue;
          if (!eRef.doi && !eRef.el.getAttribute('data-abstract')) continue;
          var ePid = eRef.el.getAttribute('data-panel-id');
          var ePanel = ePid
            ? eRef.el.parentNode.querySelector('.reference-abstract[data-for-panel="' + ePid + '"]')
            : null;
          if (!ePanel || !ePanel.classList.contains('open')) {
            toReopen.push({ el: eRef.el, btn: eRef.el.querySelector('.ref-abstract-btn') });
          }
        }
        expandInBatches(toReopen);
      }
    }

    function resetAllFilters() {
      searchInput.value = '';
      yearMinInput.value = defaultMinYear;
      yearMaxInput.value = defaultMaxYear;
      typeSelect.value = '';
      relevanceMinInput.value = 0;
      updateRelevanceReadout();
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
        sorted.sort(relevanceReady ? compareRelevance : compareSourceOrder);
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
      // The page is taken off the front of this order, so re-page after sorting.
      orderedRefs = sorted;
      applyFilters();
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
    // The readout follows the thumb immediately; the filter pass does not.
    // A drag emits an input event per pixel, and each pass walks every
    // reference twice, redraws the histogram and rewrites the count — on the
    // largest page that is far more work than a frame can hold. Coalescing
    // into one animation frame keeps the number under the cursor live while
    // doing the work once per frame at most.
    var relevanceFrame = null;
    relevanceMinInput.addEventListener('input', function () {
      updateRelevanceReadout();
      if (relevanceFrame !== null) return;
      relevanceFrame = requestFrame(function () {
        relevanceFrame = null;
        applyFilters();
      });
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
    // Called after "show more" has rendered another page, so the caller can
    // fetch metadata for what it revealed.
    var onPageGrown = null;

    /**
     * Open a batch of abstracts at a time.
     *
     * Six every 300 ms is the rate the "expand abstracts" button has always
     * used; the trouble was that the auto-expand path did not use it. With
     * expand-all active, one press of "show more" reveals a whole page at
     * once, and on the large pages most of those abstracts were pruned from
     * the payload, so each needs a CrossRef round trip. Unbatched, that opened
     * a hundred requests in one go, and a throttled reply is indistinguishable
     * from "no abstract exists" — which removes the button for good.
     */
    function expandInBatches(items) {
      if (!items.length) return;
      var batchIdx = 0;
      var BATCH = 6;
      var pending = 0;

      function onSettled() {
        pending--;
        if (pending <= 0 && batchIdx >= items.length) saveExpandedState();
      }

      function expandBatch() {
        var end = Math.min(batchIdx + BATCH, items.length);
        for (var j = batchIdx; j < end; j++) {
          pending++;
          expandOne(items[j].el, items[j].btn, onSettled);
        }
        batchIdx = end;
        if (batchIdx < items.length) setTimeout(expandBatch, 300);
      }
      expandBatch();
    }

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

        expandInBatches(toExpand);

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
        exportVisible(references, 'bib', exportBibBtn);
      });
    }

    // Export DOI URLs
    var exportDoisBtn = toolbar.querySelector('.ref-export-dois');
    if (exportDoisBtn) {
      exportDoisBtn.addEventListener('click', function () {
        var lines = [];
        for (var i = 0; i < references.length; i++) {
          if (references[i]._matchesFilters && references[i].doi) {
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
          relMin: parseInt(relevanceMinInput.value, 10) || 0,
          shown: renderedCount
        }));
      } catch (e) { /* ignore */ }
    }
    // JSON.stringify plus a synchronous sessionStorage write on every input
    // event is the one part of a drag that no amount of coalescing helps,
    // because it blocks rather than paints. The settled value is the only one
    // worth keeping.
    var saveTimer;
    function saveStateSoon() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveState, 300);
    }
    searchInput.addEventListener('input', saveStateSoon);
    yearMinInput.addEventListener('change', saveState);
    yearMaxInput.addEventListener('change', saveState);
    typeSelect.addEventListener('change', saveState);
    relevanceMinInput.addEventListener('input', saveStateSoon);

    /**
     * Histogram of the overlap scores the slider can act on, drawn over the
     * slider's own domain so the bars, the threshold line and the thumb agree.
     *
     * @param {Object[]} pool  references passing search, year and type but not
     *   the overlap floor. It used to histogram every reference on the page
     *   regardless of the other filters, so narrowing to one decade moved the
     *   count while leaving the shape the reader steers by untouched.
     */
    function drawSparkline(pool) {
      var svg = toolbar.querySelector('.ref-rel-sparkline');
      if (!svg) return;
      if (!relevanceReady) { svg.innerHTML = ''; return; }
      pool = pool || references;
      var W = 200, H = 28, BUCKETS = 10;
      var lo = parseInt(relevanceMinInput.min, 10) || 0;
      var hi = parseInt(relevanceMinInput.max, 10) || 100;
      if (hi <= lo) hi = lo + 1;
      var span = hi - lo;
      var buckets = [];
      for (var k = 0; k < BUCKETS; k++) buckets[k] = 0;
      for (var i = 0; i < pool.length; i++) {
        var rel = pool[i].relevance || 0;
        if (rel < lo || rel > hi) continue;
        var b = Math.min(BUCKETS - 1, Math.floor((rel - lo) * BUCKETS / span));
        buckets[b]++;
      }
      var maxCount = 0;
      for (var m = 0; m < BUCKETS; m++) if (buckets[m] > maxCount) maxCount = buckets[m];
      if (!maxCount) { svg.innerHTML = ''; return; }
      var threshold = parseInt(relevanceMinInput.value, 10) || lo;
      var barW = W / BUCKETS;
      var bucketSpan = span / BUCKETS;
      var parts = [];
      for (var b2 = 0; b2 < BUCKETS; b2++) {
        if (!buckets[b2]) continue;
        var h = Math.max(2, Math.round((buckets[b2] / maxCount) * (H - 2)));
        var bx = b2 * barW;
        var by = H - h;
        // Shade by the bucket's midpoint. Keying off its left edge painted a
        // bucket as surviving the threshold when most of it does not.
        var mid = lo + (b2 + 0.5) * bucketSpan;
        var cls = mid >= threshold ? 'spark-above' : 'spark-below';
        parts.push('<rect class="' + cls + '" x="' + bx.toFixed(1) + '" y="' + by + '" width="' + (barW - 1).toFixed(1) + '" height="' + h + '" rx="1"/>');
      }
      if (threshold > lo) {
        var tx = ((threshold - lo) / span) * W;
        parts.push('<line class="spark-threshold" x1="' + tx.toFixed(1) + '" y1="0" x2="' + tx.toFixed(1) + '" y2="' + H + '" stroke-width="1.5" stroke-dasharray="2,1"/>');
      }
      svg.innerHTML = parts.join('');
      svg.setAttribute('aria-label',
        'Distribution of word-overlap scores, ' + lo + ' to ' + hi +
        ', across ' + groupDigits(pool.length) + ' reference' +
        (pool.length === 1 ? '' : 's'));
    }

    /**
     * Fit the slider to the scores that actually exist, and enable it.
     *
     * The control ships disabled: before scoring there is nothing for it to
     * filter on, and a slider that empties the list when dragged early is
     * worse than one that cannot be dragged yet. If scoring never succeeds it
     * stays disabled and the whole overlap block is hidden, because a filter
     * on a score nothing computed can only ever hide everything.
     */
    function updateRelevanceMax() {
      var relFilter = toolbar.querySelector('.ref-relevance-filter');
      var note = toolbar.querySelector('.ref-relevance-note');
      var maxRel = 0;
      for (var i = 0; i < references.length; i++) {
        if ((references[i].relevance || 0) > maxRel) maxRel = references[i].relevance;
      }
      if (!relevanceReady || maxRel <= 0) {
        relevanceMinInput.value = 0;
        relevanceMinInput.disabled = true;
        if (relFilter) relFilter.hidden = true;
        if (note) note.hidden = true;
        updateRelevanceReadout();
        applyFilters();
        return;
      }
      // Read before assigning: setting max on a range input clamps its value
      // as a side effect, so testing afterwards always found the value already
      // in range and left the readout showing a number the filter no longer
      // used. Reachable whenever a re-score lowers the top of the scale.
      var wanted = parseInt(relevanceMinInput.value, 10) || 0;
      relevanceMinInput.max = maxRel;
      relevanceMinInput.value = Math.min(wanted, maxRel);
      relevanceMinInput.disabled = false;
      if (relFilter) relFilter.hidden = false;
      if (note) note.hidden = false;
      updateRelevanceReadout();
      // Re-apply now that real scores exist: a floor restored from a previous
      // visit was held inert until this point.
      applyFilters();
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
          updateRelevanceReadout();
        }
        // How far the reader had paged is part of where they were. Without it,
        // following a reference out to Scholar and coming back drops them at
        // the first page again.
        if (s.shown != null && s.shown > pageSize) renderedCount = s.shown;
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
      expandInBatches: expandInBatches,
      setPageGrownHandler: function (fn) { onPageGrown = fn; },
      setRelevanceReady: function (ready) {
        relevanceReady = ready === true;
        applyFilters();
      },
      updateRelevanceMax: updateRelevanceMax
    };
  }

  /**
   * One callback on the next frame, or on a short timer where there are no
   * frames to wait for.
   */
  function requestFrame(fn) {
    if (typeof window.requestAnimationFrame === 'function') {
      return window.requestAnimationFrame(fn);
    }
    return setTimeout(fn, 16);
  }

  /** Thousands separators, so five-digit counts stay readable. */
  function groupDigits(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /**
   * The one line that has to be true in every state.
   *
   * Three quantities, kept distinct: how many references the page holds, how
   * many the filters selected, and how many are rendered. The count used to
   * report the filtered figure as the total, which on a page arriving under a
   * silent overlap floor meant it never once showed the reader how many
   * references there were.
   *
   * @param {number} visible      references currently rendered
   * @param {number} matchedTotal references passing every filter
   * @param {number} pageTotal    references on the page
   * @param {boolean} scored      overlap scoring has finished
   */
  function updateCount(toolbar, visible, matchedTotal, pageTotal, scored) {
    var el = toolbar.querySelector('.ref-count');
    matchedTotal = matchedTotal == null ? visible : matchedTotal;
    pageTotal = pageTotal == null ? matchedTotal : pageTotal;

    var text;
    if (matchedTotal === 0) {
      text = 'No references match these filters';
    } else {
      text = matchedTotal < pageTotal
        ? groupDigits(matchedTotal) + ' of ' + groupDigits(pageTotal) + ' references'
        : groupDigits(pageTotal) + ' reference' + (pageTotal !== 1 ? 's' : '');
      if (visible < matchedTotal) {
        text += ' \u00b7 showing the first ' + groupDigits(visible);
      }
    }
    if (scored === false) text += ' \u00b7 working out overlap scores\u2026';

    var textEl = el.querySelector('.ref-count-text');
    if (!textEl) {
      textEl = document.createElement('span');
      textEl.className = 'ref-count-text';
      el.insertBefore(textEl, el.firstChild);
    }
    if (textEl.textContent !== text) textEl.textContent = text;
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
      sessionStorage.setItem(expandedKey, JSON.stringify(dois));
    } catch (e) { console.warn('[related-refs] saveExpandedState error:', e); }
  }

  function getExpandedState() {
    try {
      var s = sessionStorage.getItem(expandedKey);
      var result = s ? JSON.parse(s) : [];
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
  function backgroundPrefetch(section, references, onRelevanceChange) {
    var queue = [];
    for (var i = 0; i < references.length; i++) {
      var ref = references[i];
      if (!ref.doi) continue;
      // Only what the reader can currently see. A reference the filters hide
      // gains nothing from having its type or abstract fetched, and the
      // collection runs to thousands of them.
      //
      // Since paging replaced the display cap, "hidden" also means "not on the
      // rendered page", so this runs again each time the reader presses "show
      // more". Without that, a reference past the first page never acquired a
      // type or an abstract, and because the Abstract button is built only
      // when one of those attributes exists, it never got one at all.
      if (ref.el.style.display === 'none') continue;
      if (ref._prefetchQueued) continue;
      // A pruned abstract is a deliberate omission, not a gap: bulk-fetching
      // those would put thousands of CrossRef requests behind every page load.
      var needsAbstract = !ref.el.getAttribute('data-abstract') &&
        !ref.el.getAttribute('data-abstract-pruned');
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
        ref._prefetchQueued = true;
        queue.push(ref);
      }
    }
    if (!queue.length) return;

    var idx = 0;
    var concurrent = 0;
    var MAX_CONCURRENT = 2;
    var typesChanged = false;
    var rebuildTimer = null;
    var relevanceDirty = false;
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

    function flushRelevanceRefresh() {
      if (!relevanceDirty || !onRelevanceChange) return;
      relevanceDirty = false;
      onRelevanceChange();
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
                relevanceDirty = true;
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
        } else {
          // Re-score only once the complete background batch is settled. A
          // full-corpus rank refresh on every network response would make a
          // large reference list unresponsive for much of the fetch cycle.
          flushRelevanceRefresh();
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

  /**
   * Reconstruct a plain-text abstract from OpenAlex's abstract_inverted_index
   * (a map of word → [position, …]).
   */
  function reconstructOpenAlexAbstract(aii) {
    if (!aii || typeof aii !== 'object') return null;
    var words = Object.keys(aii);
    if (!words.length) return null;
    var maxPos = 0;
    for (var wi = 0; wi < words.length; wi++) {
      var positions = aii[words[wi]];
      for (var pi = 0; pi < positions.length; pi++) {
        if (positions[pi] > maxPos) maxPos = positions[pi];
      }
    }
    var arr = new Array(maxPos + 1);
    for (var wi2 = 0; wi2 < words.length; wi2++) {
      var positions2 = aii[words[wi2]];
      for (var pi2 = 0; pi2 < positions2.length; pi2++) {
        arr[positions2[pi2]] = words[wi2];
      }
    }
    return arr.join(' ').trim() || null;
  }

  function fetchCrossRef(doi, callback) {
    if (crossrefCache[doi]) { callback(crossrefCache[doi]); return; }

    // If a request for this DOI is already in flight, queue the callback
    if (pendingRequests[doi]) {
      pendingRequests[doi].push(callback);
      return;
    }
    pendingRequests[doi] = [callback];

    function resolve(result) {
      var cbs = pendingRequests[doi] || [];
      delete pendingRequests[doi];
      for (var i = 0; i < cbs.length; i++) cbs[i](result);
    }

    // Fallback: try OpenAlex when CrossRef has no abstract.
    function tryOpenAlex(partialResult) {
      var oaUrl = 'https://api.openalex.org/works/doi:' + encodeURIComponent(doi) +
                  '?select=abstract_inverted_index,type';
      var oaXhr = new XMLHttpRequest();
      oaXhr.open('GET', oaUrl, true);
      oaXhr.setRequestHeader('Accept', 'application/json');
      oaXhr.timeout = 20000;
      oaXhr.onload = function () {
        if (oaXhr.status === 200) {
          try {
            var data = JSON.parse(oaXhr.responseText);
            var abs = reconstructOpenAlexAbstract(data.abstract_inverted_index);
            if (abs) partialResult.abstract = abs;
            if (!partialResult.type && data.type) partialResult.type = data.type;
          } catch (e) { /* ignore */ }
        }
        crossrefCache[doi] = partialResult;
        saveCache();
        resolve(partialResult);
      };
      oaXhr.onerror = oaXhr.ontimeout = function () {
        crossrefCache[doi] = partialResult;
        saveCache();
        resolve(partialResult);
      };
      oaXhr.send();
    }

    var url = 'https://api.crossref.org/works/' + encodeURIComponent(doi);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Accept', 'application/json');
    // Polite pool: identified requests get higher rate limits from CrossRef
    xhr.setRequestHeader('User-Agent', 'RelatedRefs/1.0 (mailto:p.bernabeu@lancaster.ac.uk)');
    xhr.timeout = 20000;

    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          var msg = JSON.parse(xhr.responseText).message || {};
          var result = {
            abstract: msg.abstract ? msg.abstract.replace(/<[^>]+>/g, '').trim() : null,
            type: msg.type || null
          };
          // CrossRef has no abstract → try OpenAlex
          if (!result.abstract) {
            tryOpenAlex(result);
          } else {
            crossrefCache[doi] = result;
            saveCache();
            resolve(result);
          }
        } catch (e) { resolve(null); }
      } else {
        // CrossRef failed entirely → try OpenAlex
        tryOpenAlex({ abstract: null, type: null });
      }
    };
    xhr.onerror = function () { tryOpenAlex({ abstract: null, type: null }); };
    xhr.ontimeout = function () { tryOpenAlex({ abstract: null, type: null }); };
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
  /**
   * @param {Element} [btn]  the button that started this, for progress and to
   *   stop a second run being launched over the first.
   */
  function exportVisible(references, format, btn) {
    // Everything the filters selected, not just the page on screen. Exporting
    // 100 of 153 matches because the reader had not pressed "show more" would
    // be a silent, wrong answer.
    var visible = [];
    for (var i = 0; i < references.length; i++) {
      if (references[i]._matchesFilters) visible.push(references[i]);
    }
    if (!visible.length) return;
    if (btn && btn.getAttribute('data-busy')) return;

    if (format === 'txt') {
      var lines = [];
      for (var j = 0; j < visible.length; j++) {
        lines.push(getCleanText(visible[j].el));
      }
      downloadFile(lines.join('\n\n'), 'references.txt', 'text/plain');
      return;
    }

    // BibTeX: one CrossRef request per reference, two at a time with a 300 ms
    // gap, and nothing to download until the last one lands. That was bounded
    // while the list arrived pre-filtered; it is not any more, and a whole
    // unfiltered page runs to hours. Ask before starting a long one, and say
    // how long rather than leaving a dead button.
    var CONFIRM_ABOVE = 300;
    if (visible.length > CONFIRM_ABOVE) {
      var minutes = Math.ceil((visible.length * 0.3) / 2 / 60);
      var ok = window.confirm(
        'Fetching BibTeX for ' + groupDigits(visible.length) + ' references takes about ' +
        minutes + ' minute' + (minutes === 1 ? '' : 's') +
        ', and the file is only saved once every one has arrived.\n\n' +
        'Narrow the filters first for a smaller export, or continue?');
      if (!ok) return;
    }

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
    var total = pending;
    var origHtml = btn ? btn.innerHTML : null;
    if (btn) btn.setAttribute('data-busy', '1');

    function showProgress() {
      if (!btn) return;
      btn.textContent = 'Fetching ' + groupDigits(total - pending) + ' of ' + groupDigits(total) + '\u2026';
    }

    function finish() {
      if (btn) {
        btn.removeAttribute('data-busy');
        btn.innerHTML = origHtml;
      }
      downloadFile(bibs.filter(Boolean).join('\n\n'), 'references.bib', 'application/x-bibtex');
    }

    showProgress();

    function fetchNextBib() {
      while (bibConcurrent < BIB_MAX_CONCURRENT && bibQueueIdx < bibQueue.length) {
        (function (item) {
          bibConcurrent++;
          fetchBibTeX(item.doi, function (bib) {
            bibConcurrent--;
            bibs[item.idx] = bib || ('% Failed: ' + item.doi);
            pending--;
            showProgress();
            if (pending === 0) {
              finish();
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

  /**
   * Decode the HTML entities CrossRef leaves in deposited text, so that an
   * abstract shows "&" and "<" rather than "&amp;" and "&lt;". Escaping is
   * sometimes layered more than once, hence the repeated passes. The result is
   * always passed through escapeHtml() before it reaches the DOM.
   */
  function decodeEntities(text) {
    // Both patterns below require an ampersand, so without one the loop can
    // only ever return the input unchanged after scanning the whole string
    // twice. Abstracts run to ~1,600 characters and 92% of them contain no
    // entity at all, so this guard removes most of the work outright.
    if (text.indexOf('&') === -1) return text;

    var named = {
      amp: '&', apos: "'", quot: '"', nbsp: '\u00A0', lt: '<', gt: '>',
      ndash: '\u2013', mdash: '\u2014', lsquo: '\u2018', rsquo: '\u2019',
      ldquo: '\u201C', rdquo: '\u201D', hellip: '\u2026'
    };
    var out = text, prev, pass = 0;
    do {
      prev = out;
      out = out
        .replace(/&#(x?)([0-9A-Fa-f]+);/gi, function (m, hex, digits) {
          var code = parseInt(digits, hex ? 16 : 10);
          return (code > 0 && code <= 0x10FFFF) ? String.fromCodePoint(code) : m;
        })
        .replace(/&([A-Za-z]+);/g, function (m, name) {
          var ch = named[name.toLowerCase()];
          return ch === undefined ? m : ch;
        });
      pass++;
    } while (out !== prev && pass < 5);
    return out;
  }

  /** Strip JATS/XML tags and remove leading "Abstract" prefix. */
  function cleanAbstract(text) {
    // Strip all XML/HTML tags. This runs before decoding, so that an
    // entity-encoded "<" in the prose (e.g. "P &lt; .001") cannot be read as
    // the start of a tag and swallow the text up to the next ">". The pattern
    // cannot match without a "<", and only 3% of collected abstracts have one.
    var clean = text.indexOf('<') === -1 ? text : text.replace(/<[^>]+>/g, '');
    clean = decodeEntities(clean);
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
                            refText, refAbstract, wordFreqs, query,
                            rareThreshold, coreRareSet) {
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
    // The merged core set and the rarity threshold depend only on the page's
    // own title and abstract, so the caller computes them once for the whole
    // pass. The reference abstract is already tokenised and set-ified above.
    var allCoreTokens = coreTitleSet;
    var allRefTokens = refTitleSet;
    if (hasAbstracts) {
      allCoreTokens = coreRareSet;
      allRefTokens = mergeSet(refTitleSet, refAbsSet);
    }
    var rareShared = 0, rarePossible = 0;
    for (var k in allCoreTokens) {
      if (wordFreqs[k] && wordFreqs[k] <= rareThreshold) {
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
    if (!coreTitle) return false;

    var coreTitleTokens = tokenize(coreTitle);
    if (coreTitleTokens.length === 0) return false;
    var coreTitleSet = toSet(coreTitleTokens);
    var coreTitleBg = bigrams(coreTitleTokens);
    var coreTitleBgSet = toSet(coreTitleBg);

    // Core abstract
    var coreAbstract = getCoreAbstract();
    var coreAbsTokens = tokenize(coreAbstract);
    var coreAbsSet = toSet(coreAbsTokens);
    var coreAbsBg = bigrams(coreAbsTokens);
    var coreAbsBgSet = toSet(coreAbsBg);

    // Build global word frequency map (across all reference titles + abstracts).
    // Reading textContent walks the paragraph's subtree, so each reference's
    // text is read once here and reused by the scoring pass below.
    var wordFreqs = {};
    var vocabSize = 0;
    var refTexts = new Array(references.length);
    var owns = Object.prototype.hasOwnProperty;
    for (var i = 0; i < references.length; i++) {
      // The citation text captured before decoration, so a score never depends
      // on whether the reference happens to be displaying its buttons.
      refTexts[i] = references[i].citationText != null
        ? references[i].citationText
        : (references[i].el.textContent || '');
      var t = extractRefTitle(refTexts[i]);
      var abs = references[i].el.getAttribute('data-abstract') || '';
      var allWords = tokenize(t + ' ' + abs);
      var seen = {};
      for (var j = 0; j < allWords.length; j++) {
        if (!seen[allWords[j]]) {
          if (!owns.call(wordFreqs, allWords[j])) vocabSize++;
          wordFreqs[allWords[j]] = (wordFreqs[allWords[j]] || 0) + 1;
          seen[allWords[j]] = true;
        }
      }
    }

    // Both of these are fixed for the whole pass. Deriving the threshold inside
    // computeRelevance meant an Object.keys() copy of the entire vocabulary per
    // reference, which on the largest page (7,259 references over a vocabulary
    // of tens of thousands of words) dominated the scoring cost outright.
    var rareThreshold = Math.max(3, Math.floor(vocabSize * 0.1));
    var coreRareSet = mergeSet(coreTitleSet, coreAbsSet);

    for (var r = 0; r < references.length; r++) {
      var ref = references[r];
      var text = refTexts[r];
      var refAbstract = ref.el.getAttribute('data-abstract') || '';
      var score = computeRelevance(
        coreTitleTokens, coreTitleSet, coreTitleBg, coreTitleBgSet,
        coreAbsTokens, coreAbsSet, coreAbsBg, coreAbsBgSet,
        text, refAbstract, wordFreqs, queryStr || '',
        rareThreshold, coreRareSet
      );
      ref.relevance = score;
      ref.el.setAttribute('data-relevance', score);
    }

    assignRelevanceTiers(references);

    // The badge element itself is created by ensureDecorated when the
    // reference is first displayed; a reference the filters never show does
    // not need one. Only refresh the ones that exist, for the background
    // re-score.
    for (var u = 0; u < references.length; u++) {
      var scored = references[u];
      if (!scored._badge) continue;
      scored._badge.className = 'ref-relevance ' + relevanceTier(scored);
      scored._badge.title = describeRelevance(scored);
      scored._badge.textContent = String(scored.relevance);
    }
    return true;
  }

  /**
   * Colour and description for a reference's overlap badge, both worked out by
   * assignRelevanceTiers below.
   */
  function relevanceTier(ref) {
    return ref._tier || 'ref-rel-e';
  }

  function describeRelevance(ref) {
    return ref._relDesc || 'Word overlap with this publication';
  }

  /**
   * Grade every reference against the distribution on its own page.
   *
   * The tiers used to be absolute — green at 75, lime at 50, and so on — while
   * the slider was rescaled to the highest score present. Measured across the
   * twelve reference pages, the top score is under 75 on five of them, so
   * green was unreachable by construction: the thesis page peaks at 74, the
   * MPhil at 59, and the HPC page at 45, where the slider's far right still
   * shows nothing but amber and grey. Read as a statement about the
   * references, that is simply false; it was a statement about where
   * Math.round(raw * 350) happens to land. Ranking within the page says the
   * thing the colour was always trying to say, and says it on every page.
   *
   * Ties share a tier, because the cuts are score values rather than indices.
   * A score of 0 — no shared wording at all — is its own bottom tier rather
   * than the tail of the last one.
   */
  function assignRelevanceTiers(references) {
    var scores = [];
    var i;
    for (i = 0; i < references.length; i++) {
      if (references[i].relevance > 0) scores.push(references[i].relevance);
    }
    scores.sort(function (a, b) { return b - a; });
    var n = scores.length;
    var top = n ? scores[0] : 0;
    // First index at which each score appears, so a percentile describes the
    // best rank a tied score reaches rather than an arbitrary one.
    var firstAt = {};
    for (i = n - 1; i >= 0; i--) firstAt[scores[i]] = i;

    function cutAt(fraction) {
      return n ? scores[Math.min(n - 1, Math.floor(n * fraction))] : 0;
    }
    var cutA = cutAt(0.05), cutB = cutAt(0.20), cutC = cutAt(0.50);

    for (i = 0; i < references.length; i++) {
      var ref = references[i];
      var score = ref.relevance || 0;
      if (score <= 0) {
        ref._tier = 'ref-rel-e';
        ref._relDesc = 'Word overlap 0 \u2014 no wording shared with this publication';
      } else {
        ref._tier = score >= cutA ? 'ref-rel-a'
                  : score >= cutB ? 'ref-rel-b'
                  : score >= cutC ? 'ref-rel-c'
                  : 'ref-rel-d';
        var pct = Math.max(1, Math.round(((firstAt[score] + 1) / n) * 100));
        ref._relDesc = 'Word overlap ' + score + ' of ' + top +
                       ' \u2014 top ' + pct + '% on this page';
      }
    }
  }

})();
