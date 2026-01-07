/**
 * Add ancillary/related tags to article pages based on tag connections
 * Uses same logic as tag-cloud-network.js without rebuilding pages
 */

(function() {
  'use strict';
  
  // Only run on article pages, not home page
  if (document.querySelector('#tags.home-section') || !document.querySelector('.article-tags')) {
    return;
  }
  
  // Don't run if already processed
  if (document.querySelector('.article-tags-ancillary')) {
    console.log('Article ancillary tags: Already loaded, skipping');
    return;
  }
  
  // Get existing tags from current article
  const articleTagsContainer = document.querySelector('.article-tags');
  const existingBadges = Array.from(articleTagsContainer.querySelectorAll('.badge'));
  const existingTags = existingBadges
    .map(badge => badge.textContent.trim())
    .filter(tag => tag !== 's'); // Hide 's' tag
  
  console.log('Article ancillary tags: Extracted existing tags:', existingTags);
  
  // Hide 's' tag badges from display
  articleTagsContainer.querySelectorAll('.badge').forEach(badge => {
    const tagName = badge.textContent.trim();
    if (tagName === 's') {
      badge.style.display = 'none';
    }
  });
  
  if (existingTags.length === 0) {
    return;
  }
  
  console.log('Article ancillary tags: Found existing tags:', existingTags);
  
  // Reuse categorization and similarity functions from tag-cloud-network.js
  function categorizeTag(tag) {
    const tagLower = tag.toLowerCase();
    
    const categoryPatterns = {
      syntax: /\b(syntax|grammar|morpholog|word order|sentence|clause|phrase)\b/i,
      semantics: /\b(semantic|meaning|conceptual|word recognition|lexic)\b/i,
      methods: /\b(statistics|statistical|regression|mixed|linear model|data|method|experiment|electroencephalography|erp|eeg|electrode|brain|neuroimaging)\b/i,
      cognition: /\b(cognit|attention|processing|memory|perception)\b/i,
      programming: /\b(r |r-stats|reproducib|code|dashboard|data vis|javascript|html|css|shiny|plotly|ggplot)\b/i,
      language: /\b(language|linguistic|bilingual|dutch|norwegian|spanish|english|psycholing)\b/i
    };
    
    for (const [category, pattern] of Object.entries(categoryPatterns)) {
      if (pattern.test(tagLower)) {
        return category;
      }
    }
    return 'other';
  }
  
  function getCategoryColor(category) {
    const colors = {
      syntax: '#3B82F6',      // Blue
      semantics: '#A855F7',   // Purple
      methods: '#10B981',     // Green
      cognition: '#F97316',   // Orange
      programming: '#EF4444', // Red
      language: '#06B6D4',    // Cyan
      other: '#6B7280'        // Gray
    };
    return colors[category] || colors.other;
  }
  
  function getSemanticSimilarity(tag1, tag2) {
    const t1 = tag1.toLowerCase();
    const t2 = tag2.toLowerCase();
    
    // Exact match
    if (t1 === t2) return 1.0;
    
    // Domain-specific co-occurrence patterns
    const domainPairs = {
      'word recognition': ['cognition', 'cognitive', 'experiment', 'processing', 'semantics', 'word'],
      'syntax': ['language', 'linguistic', 'psycholinguistics', 'processing', 'sentence', 'grammar'],
      'eeg': ['cognition', 'cognitive', 'experiment', 'methods', 'language', 'electroencephalography', 'erp'],
      'dutch': ['bilingual', 'psycholinguistics', 'word', 'reading', 'language', 'linguistic'],
      'english': ['linguistic', 'bilingual', 'psycholinguistics', 'language'],
      'spanish': ['linguistic', 'bilingual', 'psycholinguistics', 'language']
    };
    
    for (const [key, relatedTerms] of Object.entries(domainPairs)) {
      if (t1.includes(key) && relatedTerms.some(term => t2.includes(term))) return 0.8;
      if (t2.includes(key) && relatedTerms.some(term => t1.includes(term))) return 0.8;
    }
    
    // General semantic similarity
    const semanticPairs = [
      ['language', 'linguistic'],
      ['semantic', 'meaning'],
      ['cognition', 'cognitive'],
      ['statistics', 'statistical'],
      ['data', 'analysis'],
      ['experiment', 'experimental'],
      ['brain', 'neural'],
      ['reading', 'comprehension']
    ];
    
    for (const [term1, term2] of semanticPairs) {
      if ((t1.includes(term1) && t2.includes(term2)) || (t1.includes(term2) && t2.includes(term1))) {
        return 0.7;
      }
    }
    
    return 0;
  }
  
  // Calculate connection strength between two tags
  function getConnectionStrength(tag1, tag2) {
    const category1 = categorizeTag(tag1);
    const category2 = categorizeTag(tag2);
    const semantic = getSemanticSimilarity(tag1, tag2);
    
    let strength = 0;
    
    // Semantic similarity
    strength += semantic * 0.85;
    
    // Same category
    if (category1 === category2 && category1 !== 'other') {
      strength += 0.3;
    }
    
    // Related categories
    const relatedCategories = {
      syntax: ['semantics', 'language'],
      semantics: ['syntax', 'cognition', 'language'],
      methods: ['cognition'],
      cognition: ['semantics', 'methods'],
      programming: ['methods'],
      language: ['syntax', 'semantics']
    };
    
    if (relatedCategories[category1]?.includes(category2)) {
      strength += 0.15;
    }
    
    return Math.min(strength, 1);
  }
  
  // Find all related tags for existing article tags
  const relatedTagsMap = new Map();
  
  // Fetch tag co-occurrence data
  fetch('/index.json')
    .then(response => response.json())
    .then(data => {
      console.log('Article ancillary tags: Loaded index.json with', data.length, 'pages');
      
      // Build list of all available tags and count pages per tag
      // Normalize tag names to lowercase for consistent matching
      const allTagsSet = new Set();
      const tagPageCounts = new Map();
      data.forEach(page => {
        (page.tags || []).forEach(tag => {
          const normalizedTag = tag.toLowerCase();
          allTagsSet.add(normalizedTag);
          tagPageCounts.set(normalizedTag, (tagPageCounts.get(normalizedTag) || 0) + 1);
        });
      });
      const allTags = Array.from(allTagsSet);
      console.log('Article ancillary tags: Found', allTags.length, 'unique tags');
      
      // Build co-occurrence map with normalized tag names
      const tagCooccurrence = new Map();
      
      data.forEach(page => {
        const pageTags = (page.tags || []).map(t => t.toLowerCase());
        for (let i = 0; i < pageTags.length; i++) {
          for (let j = i + 1; j < pageTags.length; j++) {
            const pair = [pageTags[i], pageTags[j]].sort().join('|||');
            tagCooccurrence.set(pair, (tagCooccurrence.get(pair) || 0) + 1);
          }
        }
      });
      
      // Find related tags for each existing tag
      existingTags.forEach(existingTag => {
        const related = [];
        
        allTags.forEach(candidateTag => {
          // Skip if it's already an existing tag or is 's'
          if (existingTags.includes(candidateTag) || candidateTag === 's') {
            return;
          }
          
          // Check co-occurrence
          const pair = [existingTag, candidateTag].sort().join('|||');
          const cooccurrenceCount = tagCooccurrence.get(pair) || 0;
          
          // Calculate strength
          let strength = 0;
          
          if (cooccurrenceCount > 0) {
            // Prioritize real co-occurrence data
            strength = cooccurrenceCount * 0.9;
          }
          
          // Add semantic/heuristic similarity
          strength += getConnectionStrength(existingTag, candidateTag) * 0.1;
          
          if (strength > 0.3) {
            related.push({ tag: candidateTag, strength });
          }
        });
        
        // Sort by strength
        related.sort((a, b) => b.strength - a.strength);
        relatedTagsMap.set(existingTag, related);
      });
      
      // Combine and deduplicate all related tags, keeping track of max strength
      const allRelatedTagsWithStrength = new Map();
      relatedTagsMap.forEach(related => {
        related.forEach(r => {
          const currentStrength = allRelatedTagsWithStrength.get(r.tag) || 0;
          if (r.strength > currentStrength) {
            allRelatedTagsWithStrength.set(r.tag, r.strength);
          }
        });
      });
      
      // Convert to array and sort by strength, then limit to ~15 tags (approx 3 lines)
      const sortedRelatedTags = Array.from(allRelatedTagsWithStrength.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(entry => entry[0]);
      
      const allRelatedTags = new Set(sortedRelatedTags);
      
      // Enhance existing tags with data attributes, page counts, and colored hover
      const existingBadges = articleTagsContainer.querySelectorAll('.badge');
      existingBadges.forEach(badge => {
        // Use text content to get the actual tag name as displayed
        const tag = badge.textContent.trim();
        
        const category = categorizeTag(tag);
        const color = getCategoryColor(category);
        // Use lowercase for lookup since tagPageCounts keys are normalized
        const pageCount = tagPageCounts.get(tag.toLowerCase()) || 0;
        
        badge.setAttribute('data-tag-type', 'primary');
        badge.setAttribute('data-tag-name', tag);
        badge.setAttribute('data-category-color', color);
        
        // Add page count as subscript and apply category color
        badge.innerHTML = `${tag}<sub style="opacity: 0.5; font-size: 0.7em; margin-left: 0.1em;">${pageCount}</sub>`;
        badge.style.color = color;
        
        // Add hover handlers for colored outline (overrides SCSS default)
        badge.addEventListener('mouseenter', function() {
          const tagColor = this.getAttribute('data-category-color');
          this.style.setProperty('color', tagColor, 'important');
          this.style.setProperty('outline', `2px solid ${tagColor}`, 'important');
          this.style.setProperty('outline-offset', '2px', 'important');
          this.style.setProperty('border-radius', '0.3em', 'important');
          this.style.setProperty('background', 'transparent', 'important');
        });
        
        badge.addEventListener('mouseleave', function() {
          const tagColor = this.getAttribute('data-category-color');
          this.style.setProperty('color', tagColor, 'important');
          this.style.removeProperty('outline');
          this.style.removeProperty('outline-offset');
          this.style.removeProperty('border-radius');
          this.style.removeProperty('background');
        });
      });
      
      // Collect primary tags
      const primaryBadges = Array.from(articleTagsContainer.querySelectorAll('.badge'));
      
      // Collect ancillary tags
      const ancillaryTagElements = [];
      
      if (allRelatedTags.size > 0) {
        console.log('Article ancillary tags: Adding', allRelatedTags.size, 'ancillary tags');
        
        Array.from(allRelatedTags).forEach(tag => {
          const category = categorizeTag(tag);
          const color = getCategoryColor(category);
          // Use lowercase for lookup since tagPageCounts keys are normalized
          const pageCount = tagPageCounts.get(tag.toLowerCase()) || 0;
          
          const badge = document.createElement('a');
          badge.className = 'badge badge-light ancillary-tag';
          badge.href = `/tags/${tag.toLowerCase().replace(/\s+/g, '-')}/`;
          badge.innerHTML = `${tag}<sub style="opacity: 0.5; font-size: 0.7em; margin-left: 0.1em;">${pageCount}</sub>`;
          badge.setAttribute('data-tag-type', 'ancillary');
          badge.setAttribute('data-tag-name', tag);
          badge.setAttribute('data-category-color', color);
          // Do not apply color to ancillary tags
          
          // Add hover handlers with dark grey color
          badge.addEventListener('mouseenter', function() {
            this.style.setProperty('color', '#555', 'important');
            this.style.setProperty('opacity', '0.85', 'important');
            this.style.setProperty('outline', `1px dashed #555`, 'important');
            this.style.setProperty('outline-offset', '2px', 'important');
            this.style.setProperty('border-radius', '0.3em', 'important');
            this.style.setProperty('background', 'transparent', 'important');
          });
          
          badge.addEventListener('mouseleave', function() {
            this.style.removeProperty('color');
            this.style.removeProperty('opacity');
            this.style.removeProperty('outline');
            this.style.removeProperty('outline-offset');
            this.style.removeProperty('border-radius');
            this.style.removeProperty('background');
          });
          
          ancillaryTagElements.push(badge);
        });
      }
      
      // Combine all tags and sort alphabetically
      const allTagElements = [...primaryBadges, ...ancillaryTagElements];
      allTagElements.sort((a, b) => {
        const nameA = a.getAttribute('data-tag-name').toLowerCase();
        const nameB = b.getAttribute('data-tag-name').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      // Clear container and rebuild
      articleTagsContainer.innerHTML = '';
      
      // Add separator bar above heading
      const separator = document.createElement('div');
      separator.style.borderTop = '1px solid rgba(0,0,0,0.12)';
      separator.style.marginBottom = '0.75rem';
      separator.style.paddingTop = '0';
      articleTagsContainer.appendChild(separator);
      
      // Add heading for main tags
      const mainHeading = document.createElement('h4');
      mainHeading.textContent = 'Topics';
      mainHeading.style.textAlign = 'center';
      mainHeading.style.marginBottom = '0.25rem';
      mainHeading.style.color = '#666';
      mainHeading.style.fontSize = '0.85rem';
      mainHeading.style.fontWeight = '400';
      mainHeading.style.textTransform = 'uppercase';
      mainHeading.style.letterSpacing = '0.05em';
      articleTagsContainer.appendChild(mainHeading);
      
      // Append all sorted tags
      allTagElements.forEach(badge => articleTagsContainer.appendChild(badge));
    })
    .catch(error => {
      console.error('Error loading tag co-occurrence data:', error);
    });
})();
