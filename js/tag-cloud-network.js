// Tag cloud network visualization - shows co-occurrence relationships
(function() {
  'use strict';

  console.log('%c TAG CLOUD NETWORK: Script file loaded! ', 'background: #22c55e; color: #000; font-weight: bold; padding: 4px;');

  const THRESHOLD = 0.05; // Very low threshold to ensure organic connections appear
  let tags = [];
  let cooccurrences = [];
  let svg = null;
  let tagCooccurrenceData = null; // Will store actual co-occurrence counts from content

  function initTagNetwork() {
    console.log('TAG CLOUD NETWORK: initTagNetwork() called');
    const tagCloud = document.querySelector('#tags .tag-cloud');
    if (!tagCloud) {
      console.warn('TAG CLOUD NETWORK: No .tag-cloud element found');
      return;
    }
    console.log('TAG CLOUD NETWORK: Found tag cloud element, proceeding...');

    const tagCloudRect = tagCloud.getBoundingClientRect();

    // Parse tag data from links - only include tags that are actually positioned within/near the cloud
    tags = Array.from(tagCloud.querySelectorAll('a'))
      .map(link => {
        const rect = link.getBoundingClientRect();
        return {
          element: link,
          rect: rect,
          name: link.getAttribute('data-tag'),
          count: parseInt(link.getAttribute('data-count')),
          url: link.href,
          category: categorizeTag(link.getAttribute('data-tag'))
        };
      })
      .filter(tag => {
        // Filter out tags that are positioned far from the tag cloud container
        // This prevents errant connections to hidden or mispositioned elements
        const verticalDistance = Math.abs(tag.rect.top - tagCloudRect.top);
        const horizontalDistance = Math.abs(tag.rect.left - tagCloudRect.left);
        const isNearCloud = verticalDistance < tagCloudRect.height + 200 && 
                           horizontalDistance < tagCloudRect.width + 200;
        
        if (!isNearCloud) {
          console.warn(`Excluding tag "${tag.name}" - positioned too far from cloud (v: ${verticalDistance}px, h: ${horizontalDistance}px)`);
        }
        
        return isNearCloud;
      });

    // Calculate centrality metrics
    calculateCentrality(tags);

    // Fetch actual tag co-occurrence data from search index, then calculate connections
    fetchTagCooccurrences(tags).then(cooccurrenceData => {
      tagCooccurrenceData = cooccurrenceData;
      console.log(`Stored ${tagCooccurrenceData.size} co-occurrence pairs in memory`);
      
      // Debug: Check for Dutch in co-occurrence data
      const dutchPairs = Array.from(cooccurrenceData.entries()).filter(([key]) => key.includes('dutch'));
      console.log(`Dutch co-occurrence pairs in data: ${dutchPairs.length}`);
      if (dutchPairs.length > 0) {
        console.log('Dutch pairs:', dutchPairs);
      }
      
      // Expose to global scope for footer tag cloud highlighter
      window.tagCooccurrenceData = cooccurrenceData;
      
      // Calculate co-occurrences with real data
      cooccurrences = calculateCooccurrences(tags);
      console.log(`Calculated ${cooccurrences.length} connections above threshold`);

      // Create SVG canvas for connection lines
      svg = createSVGCanvas(tagCloud);

      // Setup tag hover effects immediately - don't wait for animations
      console.log('%c ABOUT TO SETUP HOVER EFFECTS ', 'background: red; color: white; font-weight: bold;');
      
      // Setup hover effects first (saves original state without colors)
      setupTagHoverEffects(tags, cooccurrences);
      console.log('%c FINISHED SETTING UP HOVER EFFECTS ', 'background: green; color: white; font-weight: bold;');

      // Draw connections in background, then apply colors after animation
      drawConnectionsAnimated(svg, cooccurrences, tags).then(() => {
        // Apply thematic colors to tags after animation completes
        applyThematicColors(tags);
      });
      
      // Redraw on window resize
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          svg.innerHTML = '';
          drawConnectionsAnimated(svg, cooccurrences, tags);
        }, 150);
      });
    }).catch(error => {
      console.warn('Could not fetch tag co-occurrence data, using heuristics only:', error);
      
      // Fall back to heuristics-only mode
      cooccurrences = calculateCooccurrences(tags);
      svg = createSVGCanvas(tagCloud);
      
      // Setup hover effects immediately
      setupTagHoverEffects(tags, cooccurrences);
      
      // Draw connections in background, then apply colors
      drawConnectionsAnimated(svg, cooccurrences, tags).then(() => {
        // Apply thematic colors to tags after animation completes
        applyThematicColors(tags);
      });
      
      // Redraw on window resize
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          svg.innerHTML = '';
          drawConnectionsAnimated(svg, cooccurrences, tags);
        }, 150);
      });
    });
  }

  function categorizeTag(tagName) {
    const categories = {
      syntax: /syntax|grammar|morphology|parsing|tree|clause|sentence structure|word order/i,
      semantics: /semantic|meaning|pragmatic|lexicon|lexical|conceptual|metaphor|word recognition/i,
      methods: /statistic|analysis|method|experiment|study|data|research|model|regression|mixed.effect|eeg|erps|event.related|electroencephalography|impedance|electrode|stimuli|trial|norming|norms|modality|preprocessing|research methods/i,
      cognition: /cognit|perception|memory|brain|neuroscience|psychological|mental|attention|processing(?!.*audio)/i,
      programming: /\bR\b|python|programming|code|software|package|function|script|github|javascript|css|html|dashboard|shiny|ggplot|lme4|brms|markdown/i,
      language: /language|linguistic|speech|text|corpus|translation|bilingual|multilingual|second language|dutch|norwegian|english|spanish|creole|psycholinguistics|reading|comprehension|word(?!.*recognition)|lexical decision/i
    };

    const lowerTag = tagName.toLowerCase();
    for (const [category, pattern] of Object.entries(categories)) {
      if (pattern.test(tagName)) {
        return category;
      }
    }
    return 'other';
  }

  function getCategoryColor(category) {
    const colors = {
      syntax: '#3b82f6',      // Blue
      semantics: '#8b5cf6',   // Purple
      methods: '#10b981',     // Green
      cognition: '#f59e0b',   // Orange
      programming: '#ef4444', // Red
      language: '#06b6d4',    // Cyan
      other: '#6b7280'        // Gray
    };
    return colors[category] || colors.other;
  }

  function applyThematicColors(tags) {
    console.log('%c APPLYING THEMATIC COLORS TO TAGS ', 'background: purple; color: white; font-weight: bold; padding: 4px;');
    tags.forEach(tag => {
      const color = getCategoryColor(tag.category);
      console.log(`  Tag: "${tag.name}" -> Category: ${tag.category} -> Color: ${color}`);
      tag.element.style.setProperty('color', color, 'important');
      tag.element.style.transition = 'color 6s cubic-bezier(0.85, 0, 0.15, 1) 1s';
      console.log(`  Applied color to element:`, tag.element, `Current color:`, tag.element.style.color);
    });
    console.log('%c FINISHED APPLYING THEMATIC COLORS ', 'background: purple; color: white; font-weight: bold; padding: 4px;');
  }

  function calculateCentrality(tags) {
    // Calculate degree centrality (will be updated with actual connections)
    tags.forEach(tag => {
      tag.centrality = 0;
    });
  }

  /**
   * Fetch actual tag co-occurrence data from the search index
   * Returns a Map where key is "tag1|tag2" and value is co-occurrence count
   */
  async function fetchTagCooccurrences(tags) {
    try {
      const response = await fetch('/index.json');
      if (!response.ok) throw new Error('Failed to fetch search index');
      
      const searchIndex = await response.json();
      console.log(`Loaded ${searchIndex.length} pages from index.json`);
      
      // Debug: Show sample of tag data from index
      if (searchIndex.length > 0) {
        const samplePage = searchIndex[0];
        console.log('Sample page from index:', { title: samplePage.title, tags: samplePage.tags });
      }
      
      // Collect all unique tags from index to see what's available
      const allIndexTags = new Set();
      searchIndex.forEach(page => {
        if (page.tags && Array.isArray(page.tags)) {
          page.tags.forEach(tag => allIndexTags.add(tag.toLowerCase()));
        }
      });
      console.log(`Found ${allIndexTags.size} unique tags in index.json`);
      console.log('Index contains dutch?', allIndexTags.has('dutch'));
      console.log('Index contains eeg?', allIndexTags.has('eeg'));
      console.log('Index contains electroencephalography?', allIndexTags.has('electroencephalography'));
      console.log('Index contains event-related potentials?', allIndexTags.has('event-related potentials'));
      console.log('Index contains erps?', allIndexTags.has('erps'));
      if (allIndexTags.has('dutch')) {
        console.log('Dutch tag appears in index - checking co-occurrences...');
      }
      
      // Show all tags containing 'eeg' or 'event' or 'electro'
      const eegRelated = Array.from(allIndexTags).filter(t => 
        t.includes('eeg') || t.includes('event') || t.includes('electro') || t.includes('erp'));
      if (eegRelated.length > 0) {
        console.log('EEG-related tags in index:', eegRelated);
      }
      
      const cooccurrenceMap = new Map();
      
      // Count how many pages each pair of tags appears on together
      searchIndex.forEach(page => {
        if (!page.tags || !Array.isArray(page.tags) || page.tags.length < 2) return;
        
        // Normalize tag names for matching
        const pageTags = page.tags.map(t => t.toLowerCase().trim());
        
        // Check all pairs of tags on this page
        for (let i = 0; i < pageTags.length; i++) {
          for (let j = i + 1; j < pageTags.length; j++) {
            const tag1 = pageTags[i];
            const tag2 = pageTags[j];
            
            // Create consistent key (alphabetically sorted)
            const key = tag1 < tag2 ? `${tag1}|${tag2}` : `${tag2}|${tag1}`;
            
            // Increment co-occurrence count
            cooccurrenceMap.set(key, (cooccurrenceMap.get(key) || 0) + 1);
          }
        }
      });
      
      console.log(`Found ${cooccurrenceMap.size} unique tag co-occurrence pairs from ${searchIndex.length} pages`);
      
      // Debug: Check for Dutch in co-occurrence data
      const dutchPairs = Array.from(cooccurrenceMap.entries()).filter(([key]) => key.includes('dutch'));
      console.log(`Dutch co-occurrence pairs found: ${dutchPairs.length}`);
      if (dutchPairs.length > 0) {
        console.log('Dutch pairs:', dutchPairs);
      }
      
      // Log some examples for debugging
      if (cooccurrenceMap.size > 0) {
        const examples = Array.from(cooccurrenceMap.entries()).slice(0, 10);
        console.log('Sample co-occurrences:', examples.map(([key, count]) => `${key}: ${count}`).join(', '));
      }
      
      return cooccurrenceMap;
      
    } catch (error) {
      console.error('Error fetching tag co-occurrences:', error);
      throw error;
    }
  }

  /**
   * Get actual co-occurrence count for two tags from the fetched data
   */
  function getActualCooccurrence(tag1Name, tag2Name) {
    if (!tagCooccurrenceData) return 0;
    
    const name1 = tag1Name.toLowerCase().trim();
    const name2 = tag2Name.toLowerCase().trim();
    const key = name1 < name2 ? `${name1}|${name2}` : `${name2}|${name1}`;
    
    const count = tagCooccurrenceData.get(key) || 0;
    
    // Debug logging for specific tags
    if (name1 === 'dutch' || name2 === 'dutch') {
      console.log(`Dutch co-occurrence: ${name1}|${name2} = ${count}`);
    }
    if (name1.includes('eeg') || name2.includes('eeg') || 
        name1.includes('event') || name2.includes('event') ||
        name1.includes('electro') || name2.includes('electro')) {
      console.log(`EEG-related co-occurrence: ${name1}|${name2} = ${count}`);
    }
    
    return count;
  }

  function calculateCooccurrences(tags) {
    const cooccurrences = [];

    // Define explicit connection rules ONLY for tags that don't appear in content
    // Rely on organic co-occurrence for everything else
    const explicitRules = [
      // CSS doesn't appear in index.json, so add essential web dev connections
      { tag1: 'css', tag2: 'html', strength: 0.90 },
      { tag1: 'css', tag2: 'programming', strength: 0.75 },
      { tag1: 'css', tag2: 'software', strength: 0.70 }
    ];

    // Define blocked connections (pairs that should never connect)
    const blockedConnections = [
      { pattern1: 'word recognition', pattern2: 'cognit' }, // Block word recognition ↔ anything with 'cognit'
      { pattern1: 'eeg', pattern2: 'audio processing' },
      { pattern1: 'eeg', pattern2: 'audio' }
    ];

    // Helper function to check if a connection is blocked
    function isBlocked(name1, name2) {
      const n1 = name1.toLowerCase();
      const n2 = name2.toLowerCase();
      return blockedConnections.some(block => {
        const matches1 = (n1.includes(block.pattern1.toLowerCase()) && n2.includes(block.pattern2.toLowerCase()));
        const matches2 = (n2.includes(block.pattern1.toLowerCase()) && n1.includes(block.pattern2.toLowerCase()));
        return matches1 || matches2;
      });
    }

    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        const tag1 = tags[i];
        const tag2 = tags[j];
        
        // Check if this connection is blocked
        if (isBlocked(tag1.name, tag2.name)) {
          continue; // Skip this pair entirely
        }
        
        // Check for explicit rules first
        const explicitRule = explicitRules.find(rule => {
          const n1 = tag1.name.toLowerCase();
          const n2 = tag2.name.toLowerCase();
          return (n1 === rule.tag1 && n2 === rule.tag2) || (n1 === rule.tag2 && n2 === rule.tag1);
        });
        
        if (explicitRule) {
          // Use explicit rule strength directly
          cooccurrences.push({
            source: tag1,
            target: tag2,
            strength: explicitRule.strength,
            actualCooccurrence: 0,
            explicit: true,
            factors: {
              cooccurrence: 0,
              frequency: 0,
              popularity: 0,
              category: 0,
              semantic: 0,
              explicit: explicitRule.strength
            }
          });
          continue; // Skip normal calculation for explicit rules
        }
        
        // Multiple factors contribute to relationship strength:
        
        // 0. ACTUAL CO-OCCURRENCE (most important - real data from content)
        const actualCooccurrence = getActualCooccurrence(tag1.name, tag2.name);
        // Improved normalization: more generous to show organic connections
        // 1 page = 0.6, 2 pages = 0.75, 3 pages = 0.85, 4+ pages = 0.95-1.0
        const cooccurrenceFactor = actualCooccurrence > 0 
          ? Math.min(0.6 + (actualCooccurrence - 1) * 0.15, 1.0)
          : 0;
        
        // 1. Frequency similarity (tags with similar counts likely appear together)
        const maxCount = Math.max(tag1.count, tag2.count);
        const minCount = Math.min(tag1.count, tag2.count);
        const frequencyRatio = minCount / maxCount;
        
        // 2. Absolute frequency (popular tags are more likely to co-occur)
        const popularityFactor = Math.min((minCount / 10), 1); // Cap at 10 posts
        
        // 3. Category affinity (same category = likely related)
        const sameCategoryBonus = tag1.category === tag2.category ? 0.25 : 0;
        const relatedCategoryBonus = areRelatedCategories(tag1.category, tag2.category) ? 0.12 : 0;
        
        // 4. Semantic similarity from enhanced heuristics (linguistic patterns)
        const semanticSimilarity = getConceptNetSimilarity(tag1.name, tag2.name);
        
        // Combined strength with weighted factors
        // ACTUAL CO-OCCURRENCE is PRIMARY signal (90% weight when present)
        // Semantic similarity and other factors are minimal when co-occurrence exists
        const strength = actualCooccurrence > 0
          ? ( // When tags actually co-occur on pages (high confidence - USE REAL DATA)
              cooccurrenceFactor * 0.90 +      // Actual co-occurrence (DOMINANT - organic data)
              semanticSimilarity * 0.05 +       // Semantic similarity (minimal boost)
              frequencyRatio * 0.02 +           // Frequency similarity
              popularityFactor * 0.01 +         // Absolute popularity
              sameCategoryBonus * 0.01 +        // Same category
              relatedCategoryBonus * 0.01       // Related category
            )
          : ( // When no co-occurrence (rely on heuristics as fallback - BOOST for isolated tags)
              frequencyRatio * 0.10 +           // Frequency similarity (increased)
              popularityFactor * 0.10 +         // Absolute popularity (increased)
              sameCategoryBonus * 0.30 +        // Same category (increased)
              relatedCategoryBonus * 0.15 +     // Related category (increased)
              semanticSimilarity * 0.85         // Semantic similarity (DOMINANT for non-cooccurring)
            );

        // Only include if above threshold
        if (strength >= THRESHOLD) {
          cooccurrences.push({
            source: tag1,
            target: tag2,
            strength: Math.min(strength, 1.0), // Cap at 1.0
            actualCooccurrence: actualCooccurrence,
            factors: {
              cooccurrence: cooccurrenceFactor,
              frequency: frequencyRatio,
              popularity: popularityFactor,
              category: sameCategoryBonus + relatedCategoryBonus,
              semantic: semanticSimilarity
            }
          });
          
          // Debug Dutch connections
          if (tag1.name.toLowerCase() === 'dutch' || tag2.name.toLowerCase() === 'dutch') {
            console.log(`Dutch connection: ${tag1.name} <-> ${tag2.name}, strength: ${strength.toFixed(3)}, actualCooccurrence: ${actualCooccurrence}`);
          }
        } else if (tag1.name.toLowerCase() === 'dutch' || tag2.name.toLowerCase() === 'dutch') {
          // Log when Dutch pairs don't meet threshold
          console.log(`Dutch pair BELOW threshold: ${tag1.name} <-> ${tag2.name}, strength: ${strength.toFixed(3)} (threshold: ${THRESHOLD})`);
        }
      }
    }

    // Update centrality based on actual connections
    tags.forEach(tag => tag.centrality = 0);
    cooccurrences.forEach(conn => {
      conn.source.centrality++;
      conn.target.centrality++;
    });

    // Log statistics about connection types
    const explicitConnections = cooccurrences.filter(c => c.explicit);
    const cooccurrenceBasedConnections = cooccurrences.filter(c => c.actualCooccurrence > 0 && !c.explicit);
    const heuristicConnections = cooccurrences.filter(c => c.actualCooccurrence === 0 && !c.explicit);
    console.log(`Tag network: ${cooccurrences.length} total connections (${explicitConnections.length} explicit, ${cooccurrenceBasedConnections.length} co-occurrence, ${heuristicConnections.length} heuristic)`);
    
    // Log strength distribution
    if (cooccurrences.length > 0) {
      const strengths = cooccurrences.map(c => c.strength).sort((a, b) => b - a);
      console.log(`Strength range: ${strengths[0].toFixed(3)} (max) to ${strengths[strengths.length-1].toFixed(3)} (min)`);
    } else {
      console.warn('No connections found! Check threshold and data.');
    }
    
    // Log specific examples requested by user
    const exampleTags = [
      { tag: 'Dutch', expectedConnections: ['conceptual modality switch', 'modality exclusivity norms', 'language', 'stimuli'] },
      { tag: 'CSS', expectedConnections: ['HTML', 'programming', 'software', 'data dashboard'] }
    ];
    
    exampleTags.forEach(({ tag, expectedConnections }) => {
      const tagObj = tags.find(t => t.name.toLowerCase() === tag.toLowerCase());
      if (tagObj) {
        console.log(`\nConnections for "${tag}":`);
        const connections = cooccurrences.filter(c => 
          c.source.name.toLowerCase() === tag.toLowerCase() || 
          c.target.name.toLowerCase() === tag.toLowerCase()
        );
        connections.forEach(conn => {
          const otherTag = conn.source.name.toLowerCase() === tag.toLowerCase() ? conn.target.name : conn.source.name;
          const isExpected = expectedConnections.some(e => e.toLowerCase() === otherTag.toLowerCase());
          const sourceType = conn.explicit ? 'EXPLICIT RULE' : (conn.actualCooccurrence > 0 ? `co-occurrence: ${conn.actualCooccurrence} pages` : 'heuristics');
          console.log(`  - ${otherTag} (strength: ${conn.strength.toFixed(3)}, ${sourceType})${isExpected ? ' ✓ EXPECTED' : ''}`);
        });
      } else {
        console.log(`\n"${tag}" not found in tag cloud`);
      }
    });
    
    // Normalize centrality
    const maxCentrality = Math.max(...tags.map(t => t.centrality), 1);
    tags.forEach(tag => {
      tag.centralityNorm = tag.centrality / maxCentrality;
      // Remove any hub tag styling
      tag.element.style.textDecoration = '';
      tag.element.removeAttribute('title');
    });

    // Sort by strength and limit to prevent clutter (increased limits)
    const maxConnections = Math.max(50, tags.length * 3);
    return cooccurrences
      .sort((a, b) => b.strength - a.strength)
      .slice(0, maxConnections);
  }

  function areRelatedCategories(cat1, cat2) {
    const related = {
      'syntax': ['semantics', 'language'],
      'semantics': ['syntax', 'language', 'cognition'],
      'methods': ['programming'],
      'cognition': ['semantics', 'language'],
      'programming': ['methods'],
      'language': ['syntax', 'semantics', 'cognition']
    };
    return related[cat1]?.includes(cat2) || related[cat2]?.includes(cat1);
  }

  /**
   * Enhanced semantic similarity using multiple linguistic heuristics
   * Combines string matching, morphological patterns, and domain knowledge
   */
  function getConceptNetSimilarity(name1, name2) {
    const words1 = name1.toLowerCase().split(/[-\s]+/);
    const words2 = name2.toLowerCase().split(/[-\s]+/);
    
    let maxSimilarity = 0;
    
    // 1. Exact word matches (strongest signal)
    // Allow single-letter matches for important tags like "R"
    const sharedWords = words1.filter(w => words2.includes(w) && (w.length > 2 || w === 'r' || w === 's'));
    if (sharedWords.length > 0) {
      maxSimilarity = Math.max(maxSimilarity, 0.4 + (sharedWords.length * 0.15));
    }
    
    // 2. Morphological relatedness (linguistic stems)
    const stems = {
      'linguistic': ['language', 'linguistics', 'linguist'],
      'semantic': ['semantics', 'meaning', 'lexical', 'lexicon'],
      'syntax': ['syntactic', 'grammar', 'grammatical'],
      'cognit': ['cognitive', 'cognition', 'mental'],
      'experiment': ['experimental', 'study', 'trial'],
      'statistic': ['statistical', 'stats', 'analysis'],
      'psycho': ['psychology', 'psychological', 'psycholinguistics'],
      'neuro': ['neuroscience', 'neurological', 'brain'],
      'process': ['processing', 'processor'],
      'learn': ['learning', 'learner', 'acquisition'],
      'visual': ['vision', 'sight', 'perception'],
      'modality': ['modal', 'mode', 'sensory'],
      'concept': ['conceptual', 'notion'],
      'research': ['study', 'investigation', 'analysis'],
      'method': ['methodology', 'technique', 'approach'],
      'model': ['modeling', 'simulation'],
      'language': ['linguistic', 'bilingual', 'multilingual'],
      'word': ['lexical', 'vocabulary', 'lexicon'],
      'recogni': ['recognition', 'recognize'],
      'read': ['reading', 'reader'],
      'comprehens': ['understanding', 'processing', 'comprehension'],
      'product': ['production', 'generating'],
      'cross': ['inter', 'multi', 'trans'],
      'data': ['dataset', 'corpus', 'corpora'],
      'visual': ['visualisation', 'visualization', 'plotting'],
      'norw': ['norwegian', 'norway'],
      'dutch': ['netherlands', 'holland']
    };
    
    for (const [stem, related] of Object.entries(stems)) {
      const has1 = words1.some(w => w.includes(stem) || related.some(r => w.includes(r)));
      const has2 = words2.some(w => w.includes(stem) || related.some(r => w.includes(r)));
      if (has1 && has2) {
        maxSimilarity = Math.max(maxSimilarity, 0.35);
      }
    }
    
    // 3. Substring containment (compound words)
    for (const w1 of words1) {
      for (const w2 of words2) {
        if (w1.length >= 4 && w2.length >= 4) {
          if (w1.includes(w2) || w2.includes(w1)) {
            maxSimilarity = Math.max(maxSimilarity, 0.30);
          }
          
          // Shared prefix (at least 5 chars for specificity)
          if (w1.length >= 5 && w2.length >= 5) {
            let sharedPrefix = 0;
            for (let i = 0; i < Math.min(w1.length, w2.length); i++) {
              if (w1[i] === w2[i]) sharedPrefix++;
              else break;
            }
            if (sharedPrefix >= 5) {
              maxSimilarity = Math.max(maxSimilarity, 0.25);
            }
          }
        }
      }
    }
    
    // 4. Domain-specific co-occurrence patterns
    const domainPairs = [
      // R ecosystem
      ['r', 'rstats'], ['r', 'lme4'], ['r', 'lmertest'], ['r', 'brms'], 
      ['r', 'statistics'], ['r', 'statistical'], ['r', 'regression'],
      ['r', 'data'], ['r', 'analysis'], ['r', 'modeling'], ['r', 'model'],
      ['r', 'mixed'], ['r', 'linear'], ['r', 'plotting'], ['r', 'visualization'],
      ['r', 'sjplot'], ['r', 'simr'], ['r', 'papaja'], ['r', 'programming'],
      ['rstats', 'statistics'], ['rstats', 'data'],
      // Python ecosystem
      ['python', 'programming'], ['python', 'data'], ['python', 'analysis'],
      // JavaScript
      ['javascript', 'jsPsych'], ['javascript', 'programming'],
      // EEG/neuroscience
      ['eeg', 'erps'], ['eeg', 'electrodes'], ['eeg', 'impedance'],
      ['eeg', 'brain'], ['eeg', 'neuroscience'], ['eeg', 'cognition'],
      ['eeg', 'cognitive'], ['eeg', 'experiment'], ['eeg', 'methods'],
      ['eeg', 'research methods'], ['eeg', 'language'], ['eeg', 'processing'],
      ['erps', 'brain'], ['erps', 'cognition'], ['erps', 'experiment'],
      // Linguistics
      ['semantic', 'lexical'], ['semantic', 'meaning'], ['semantic', 'conceptual'],
      ['semantic', 'language'], ['semantic', 'linguistic'],
      ['syntax', 'grammar'], ['syntax', 'parsing'], ['syntax', 'language'],
      ['syntax', 'linguistic'], ['syntax', 'psycholinguistics'],
      ['syntax', 'processing'], ['syntax', 'sentence'],
      ['psycholinguistics', 'language'], ['psycholinguistics', 'linguistic'],
      ['psycholinguistics', 'cognition'], ['psycholinguistics', 'psychology'],
      ['psycholinguistics', 'word'], ['psycholinguistics', 'semantic'],
      // Word/reading processes
      ['word', 'lexical'], ['word', 'reading'], ['word', 'language'],
      ['word recognition', 'reading'], ['word recognition', 'lexical'],
      ['word recognition', 'language'], ['word recognition', 'psycholinguistics'],
      ['word recognition', 'lexical decision'], ['word recognition', 'cognition'],
      ['word recognition', 'cognitive'], ['word recognition', 'experiment'],
      ['word recognition', 'processing'], ['reading', 'language'],
      ['reading', 'comprehension'], ['reading', 'cognition'],
      ['lexical', 'semantic'], ['lexical', 'word'],
      ['lexical decision', 'semantic decision'], ['lexical decision', 'word'],
      ['lexical decision', 'experiment'], ['lexical decision', 'cognition'],
      // Language names & linguistics
      ['norwegian', 'language'], ['norwegian', 'linguistic'], ['norwegian', 'bilingual'],
      ['norwegian', 'multilingual'], ['norwegian', 'second language'],
      ['dutch', 'language'], ['dutch', 'linguistic'], ['dutch', 'bilingual'],
      ['dutch', 'psycholinguistics'], ['dutch', 'word'], ['dutch', 'reading'],
      ['english', 'language'], ['english', 'linguistic'], ['english', 'bilingual'],
      ['spanish', 'language'], ['spanish', 'linguistic'], ['spanish', 'bilingual'],
      ['creole', 'language'], ['creole', 'linguistic'],
      // Bilingualism
      ['bilingual', 'multilingual'], ['bilingual', 'second language'],
      ['bilingual', 'language'], ['multilingual', 'language'],
      ['language learning', 'language'], ['language', 'speech'],
      // Experimental methods
      ['experiment', 'stimuli'], ['experiment', 'trial'], ['experiment', 'study'],
      ['lme4', 'linear mixed-effects models'], ['lme4', 'linear-mixed effects models'],
      ['lme4', 'mixed'], ['lmertest', 'lme4'],
      // Statistics
      ['statistical', 'regression'], ['statistical', 'analysis'],
      ['statistics', 'analysis'], ['statistics', 'data'],
      // Open science
      ['open science', 'open data'], ['open science', 'reproducibility'],
      ['open science', 'replication'],
      // Data visualization and dashboards
      ['visualisation', 'visualization'], ['visualisation', 'plotting'],
      ['visualisation', 'data'], ['visualisation', 'dashboard'],
      ['visualisation', 'research methods'], ['visualisation', 'data presentation'],
      ['visualization', 'plotting'], ['visualization', 'data'],
      ['visualization', 'dashboard'], ['visualization', 'research methods'],
      ['data dashboard', 'dashboard'], ['data dashboard', 'visualization'],
      ['data dashboard', 'visualisation'], ['data dashboard', 'data'],
      ['data dashboard', 'data presentation'], ['dashboard', 'data'],
      ['plotting', 'data'], ['plotting', 'graph'],
      // Data processing
      ['preprocessing', 'data'], 
      ['data', 'analysis'], ['data', 'statistics'],
      ['data presentation', 'data'], ['data presentation', 'research'],
      // Corpora
      ['corpus', 'corpora'], ['language', 'linguistic']
    ];
    
    for (const [term1, term2] of domainPairs) {
      const n1 = name1.toLowerCase();
      const n2 = name2.toLowerCase();
      if ((n1.includes(term1) && n2.includes(term2)) || 
          (n1.includes(term2) && n2.includes(term1))) {
        maxSimilarity = Math.max(maxSimilarity, 0.40);
      }
    }
    
    return Math.min(maxSimilarity, 1.0);
  }



  function createSVGCanvas(container) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute';
    svg.style.top = '-150px';  // Extend above container
    svg.style.left = '-150px'; // Extend left of container
    svg.style.width = 'calc(100% + 300px)';  // Add padding on both sides
    svg.style.height = 'calc(100% + 300px)'; // Add padding top and bottom
    svg.style.pointerEvents = 'none'; // Let mouse events pass through to tags
    svg.style.zIndex = '0';
    svg.style.overflow = 'visible';
    
    // Insert SVG before tag links
    container.style.position = 'relative';
    container.insertBefore(svg, container.firstChild);
    
    return svg;
  }

  function drawConnectionsAnimated(svg, cooccurrences, tags) {
    console.log(`Drawing ${cooccurrences.length} connections with animation`);
    const rect = svg.parentElement.getBoundingClientRect();
    // Add padding to viewBox to prevent edge cropping
    svg.setAttribute('viewBox', `-150 -150 ${rect.width + 300} ${rect.height + 300}`);

    if (cooccurrences.length === 0) {
      console.warn('No connections to draw!');
      return Promise.resolve();
    }

    // Draw all connections immediately (no stagger)
    cooccurrences.forEach((conn) => {
      drawConnection(svg, conn, rect.width, rect.height);
    });

    // Bring tag links to front
    tags.forEach(tag => {
      tag.element.style.position = 'relative';
      tag.element.style.zIndex = '1';
    });
    
    // Return resolved promise to signal completion
    return Promise.resolve();
  }

  function drawConnection(svg, conn, width, height) {
    const sourceRect = conn.source.element.getBoundingClientRect();
    const targetRect = conn.target.element.getBoundingClientRect();
    const containerRect = svg.parentElement.getBoundingClientRect();

    // Validate that both tags are actually visible and positioned correctly
    if (sourceRect.width === 0 || sourceRect.height === 0 || 
        targetRect.width === 0 || targetRect.height === 0) {
      console.warn(`Skipping connection from "${conn.source.name}" to "${conn.target.name}" - one tag has zero dimensions`);
      return;
    }

    // Calculate center points
    const x1 = sourceRect.left + sourceRect.width / 2 - containerRect.left;
    const y1 = sourceRect.top + sourceRect.height / 2 - containerRect.top;
    const x2 = targetRect.left + targetRect.width / 2 - containerRect.left;
    const y2 = targetRect.top + targetRect.height / 2 - containerRect.top;

    // Skip connections where coordinates are far outside the expected range
    const maxDistance = 2000; // Maximum reasonable distance from container
    if (Math.abs(x1) > maxDistance || Math.abs(y1) > maxDistance ||
        Math.abs(x2) > maxDistance || Math.abs(y2) > maxDistance) {
      console.warn(`Skipping connection from "${conn.source.name}" to "${conn.target.name}" - coordinates too far: (${x1},${y1}) to (${x2},${y2})`);
      return;
    }

    // Calculate control point for curved line
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const curvature = Math.min(distance * 0.2, 50);
    const angle = Math.atan2(dy, dx);
    const controlX = (x1 + x2) / 2 + Math.cos(angle + Math.PI / 2) * curvature;
    const controlY = (y1 + y2) / 2 + Math.sin(angle + Math.PI / 2) * curvature;

    // Create curved path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const pathData = `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'none');
    path.setAttribute('class', 'tag-connection'); // Add class for easier querying
    
    const opacity = Math.max(conn.strength * 0.3, 0.15); // Increased base opacity
    const strokeWidth = Math.max(conn.strength * 2, 1.2); // Increased base width
    
    // Line color: blend both tags' category colors for clarity
    const color1 = getCategoryColor(conn.source.category);
    const color2 = getCategoryColor(conn.target.category);
    const color = conn.source.category === conn.target.category ? color1 : blendColors(color1, color2);
    
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', strokeWidth);
    path.setAttribute('stroke-opacity', '0'); // Start hidden
    path.setAttribute('stroke-linecap', 'round');
    path.style.transition = 'all 0.3s ease';
    
    // Invisible wider path for hovering
    const hitPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hitPath.setAttribute('d', pathData);
    hitPath.setAttribute('fill', 'none');
    hitPath.setAttribute('stroke', 'transparent');
    hitPath.setAttribute('stroke-width', Math.max(strokeWidth * 4, 12));
    hitPath.style.cursor = 'pointer';

    // Store connection data on elements for hover effects
    path.connectionData = conn;
    hitPath.connectionData = conn;
    
    // Add to SVG
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.appendChild(path);
    group.appendChild(hitPath);

    // Add edge label
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', controlX);
    label.setAttribute('y', controlY);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', color);
    label.setAttribute('font-size', '10');
    label.setAttribute('opacity', '0');
    label.textContent = conn.strength.toFixed(2);
    label.style.pointerEvents = 'none';
    group.appendChild(label);

    // Create particle for animation
    const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    particle.setAttribute('r', '2');
    particle.setAttribute('fill', color);
    particle.setAttribute('opacity', '0');
    group.appendChild(particle);

    svg.appendChild(group);

    // Interaction handlers - highlight on line hover
    const highlightConnection = (highlight) => {
      if (highlight) {
        path.setAttribute('stroke-opacity', Math.min(opacity * 2.5, 0.6));
        path.setAttribute('stroke-width', strokeWidth * 1.8);
        label.setAttribute('opacity', '0.8');
        const sourceColor = getCategoryColor(conn.source.category);
        const targetColor = getCategoryColor(conn.target.category);
        conn.source.element.style.color = sourceColor;
        conn.source.element.style.outline = `2px solid ${sourceColor}`;
        conn.source.element.style.outlineOffset = '2px';
        conn.source.element.style.borderRadius = '0.3em';
        conn.source.element.style.textShadow = `0 0 12px ${sourceColor}60`;
        conn.target.element.style.color = targetColor;
        conn.target.element.style.outline = `2px solid ${targetColor}`;
        conn.target.element.style.outlineOffset = '2px';
        conn.target.element.style.borderRadius = '0.3em';
        conn.target.element.style.textShadow = `0 0 12px ${targetColor}60`;
        animateParticle(particle, pathData);
      } else {
        path.setAttribute('stroke-opacity', opacity);
        path.setAttribute('stroke-width', strokeWidth);
        label.setAttribute('opacity', '0');
        conn.source.element.style.color = '';
        conn.source.element.style.outline = '';
        conn.source.element.style.outlineOffset = '';
        conn.source.element.style.borderRadius = '';
        conn.source.element.style.textShadow = '';
        conn.target.element.style.color = '';
        conn.target.element.style.outline = '';
        conn.target.element.style.outlineOffset = '';
        conn.target.element.style.borderRadius = '';
        conn.target.element.style.textShadow = '';
        particle.setAttribute('opacity', '0');
      }
    };

    // Only attach hover handlers to the connection line
    let isHovering = false;
    
    hitPath.addEventListener('mouseenter', () => {
      isHovering = true;
      highlightConnection(true);
    });
    
    hitPath.addEventListener('mouseleave', () => {
      isHovering = false;
      setTimeout(() => {
        if (!isHovering) {
          highlightConnection(false);
        }
      }, 50);
    });
    
    // Click line to navigate between tags
    hitPath.addEventListener('click', (e) => {
      e.preventDefault();
      conn.source.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        conn.target.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 800);
    });
  }

  function animateParticle(particle, pathData) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    
    let progress = 0;
    particle.setAttribute('opacity', '0.8');
    
    const animate = () => {
      if (progress > 1) return;
      
      const point = path.getPointAtLength(progress * path.getTotalLength());
      particle.setAttribute('cx', point.x);
      particle.setAttribute('cy', point.y);
      
      progress += 0.02;
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  // Add tag hover highlighting
  function setupTagHoverEffects(tags, cooccurrences) {
    // Get all SVG paths for connection highlighting
    const svg = document.querySelector('#tags svg');
    const allPaths = svg ? Array.from(svg.querySelectorAll('path.tag-connection')) : [];
    console.log(`Setting up hover effects for ${allPaths.length} connection paths`);
    
    // Note: Paths may not exist yet if called before drawing, but we can still set up tag hover events
    
    // Store original styles to restore on mouseleave
    tags.forEach(tag => {
      // Save original inline cssText to restore later
      tag.originalCssText = tag.element.style.cssText;
    });
    
    // PRE-CACHE: Build connection lookup for each tag (huge performance boost)
    const tagConnectionsMap = new Map();
    tags.forEach(tag => {
      const connectedTags = new Map(); // tag name -> connection strength
      const connectedPaths = []; // paths connected to this tag
      
      cooccurrences.forEach(conn => {
        if (conn.source.name === tag.name) {
          connectedTags.set(conn.target.name, conn.strength);
        } else if (conn.target.name === tag.name) {
          connectedTags.set(conn.source.name, conn.strength);
        }
      });
      
      // Pre-filter paths for this tag
      allPaths.forEach(path => {
        const conn = path.connectionData;
        if (conn && (conn.source.name === tag.name || conn.target.name === tag.name)) {
          connectedPaths.push({
            path: path,
            conn: conn,
            baseOpacity: Math.max(conn.strength * 0.3, 0.15),
            baseWidth: Math.max(conn.strength * 2, 1.2)
          });
        }
      });
      
      tagConnectionsMap.set(tag.name, {
        connectedTags: connectedTags,
        connectedPaths: connectedPaths,
        categoryColor: getCategoryColor(tag.category)
      });
      
      console.log(`Tag "${tag.name}": ${connectedTags.size} connections to:`, Array.from(connectedTags.keys()));
    });
    
    // Pre-cache category colors for all tags
    tags.forEach(tag => {
      tag.cachedColor = getCategoryColor(tag.category);
    });
    
    console.log(`Hover effects ready for ${tags.length} tags, tracking ${tagConnectionsMap.size} connection maps`);
    
    tags.forEach(tag => {
      const tagData = tagConnectionsMap.get(tag.name);
      
      // Verify element is hoverable
      if (!tag.element) {
        console.error(`Tag ${tag.name} has no element!`);
        return;
      }
      
      console.log(`Setting up hover for "${tag.name}" on element:`, tag.element);
      
      tag.element.addEventListener('mouseenter', () => {
        // Get connection data for this tag
        const hoveredTagData = tagConnectionsMap.get(tag.name);
        
        if (!hoveredTagData) {
          console.error(`No hover data found for tag: ${tag.name}`);
          return;
        }
        
        console.log(`Hovering ${tag.name}: ${hoveredTagData.connectedTags.size} connections`, 
                    Array.from(hoveredTagData.connectedTags.keys()));
        
        // Apply styles to hovered tag using individual properties to preserve existing styles
        tag.element.style.setProperty('color', tag.cachedColor, 'important');
        tag.element.style.setProperty('outline', `2px solid ${tag.cachedColor}`, 'important');
        tag.element.style.setProperty('outline-offset', '2px', 'important');
        tag.element.style.setProperty('border-radius', '0.3em', 'important');
        tag.element.style.setProperty('background-color', `${tag.cachedColor}15`, 'important');
        tag.element.style.setProperty('text-shadow', `0 0 12px ${tag.cachedColor}60`, 'important');
        tag.element.style.setProperty('opacity', '1', 'important');
        tag.element.style.setProperty('transform', 'scale(1.2)', 'important');
        
        // Then update other tags
        const hoveredTagRect = tag.element.getBoundingClientRect();
        const tagCloudRect = tag.element.closest('.tag-cloud').getBoundingClientRect();
        
        let highlightedCount = 0;
        tags.forEach(t => {
          if (t.name === tag.name) {
            // Already applied above
          } else if (hoveredTagData.connectedTags.has(t.name)) {
            // Connected tags - apply visible highlighting with dashed outline, no background
            highlightedCount++;
            console.log(`  -> Highlighting: ${t.name}`);
            t.element.style.setProperty('color', t.cachedColor, 'important');
            t.element.style.setProperty('outline', `1.5px dashed ${t.cachedColor}`, 'important');
            t.element.style.setProperty('outline-offset', '2px', 'important');
            t.element.style.setProperty('border-radius', '0.3em', 'important');
            t.element.style.setProperty('background-color', 'transparent', 'important');
            t.element.style.setProperty('text-shadow', `0 0 8px ${t.cachedColor}40`, 'important');
            t.element.style.setProperty('opacity', '1', 'important');
          } else {
            // Unconnected tags - dim significantly
            t.element.style.opacity = '0.2';
          }
        });
        console.log(`Highlighted ${highlightedCount} connected tags`);
        
        // Highlight connection lines (using pre-cached paths) - only if paths exist
        if (allPaths.length > 0 && hoveredTagData.connectedPaths.length > 0) {
          // First dim ALL paths quickly
          allPaths.forEach(path => {
            path.setAttribute('stroke-opacity', '0.05');
          });
          
          // Calculate expanded box area (outline + offset)
          const boxPadding = 10; // Extra padding beyond outline
          const boxLeft = hoveredTagRect.left - tagCloudRect.left - boxPadding;
          const boxRight = hoveredTagRect.right - tagCloudRect.left + boxPadding;
          const boxTop = hoveredTagRect.top - tagCloudRect.top - boxPadding;
          const boxBottom = hoveredTagRect.bottom - tagCloudRect.top + boxPadding;
          
          // Then brighten only connected paths, with reduced opacity near the hovered tag
          tagData.connectedPaths.forEach(({ path, baseOpacity, baseWidth, conn }) => {
            // Check if path intersects with the hovered tag's box area
            const pathBBox = path.getBBox();
            const intersectsBox = !(pathBBox.x + pathBBox.width < boxLeft || 
                                     pathBBox.x > boxRight || 
                                     pathBBox.y + pathBBox.height < boxTop || 
                                     pathBBox.y > boxBottom);
            
            // Use lighter opacity if the line intersects the box
            const finalOpacity = intersectsBox ? 
              Math.min(baseOpacity * 1.5, 0.35) : 
              Math.min(baseOpacity * 3, 0.7);
            
            path.setAttribute('stroke-opacity', finalOpacity);
            path.setAttribute('stroke-width', baseWidth * (1 + conn.strength * 0.8));
          });
        }
      });
      
      tag.element.addEventListener('mouseleave', () => {
        // Reset all tags by removing only hover-specific properties
        tags.forEach(t => {
          // Remove hover effects but keep thematic color
          t.element.style.removeProperty('outline');
          t.element.style.removeProperty('outline-offset');
          t.element.style.removeProperty('border-radius');
          t.element.style.removeProperty('background-color');
          t.element.style.removeProperty('text-shadow');
          t.element.style.removeProperty('transform');
          t.element.style.opacity = '';
          
          // Ensure thematic color persists with important flag
          const color = getCategoryColor(t.category);
          t.element.style.setProperty('color', color, 'important');
        });
        
        // Hide all connection lines on mouse leave
        if (allPaths.length > 0) {
          allPaths.forEach(path => {
            path.setAttribute('stroke-opacity', '0');
            const conn = path.connectionData;
            if (conn) {
              const baseWidth = Math.max(conn.strength * 2, 1.2);
              path.setAttribute('stroke-width', baseWidth);
            }
          });
        }
      });
    });
  }

  // Helper function to blend two colors
  function blendColors(color1, color2) {
    // Simple average blend - convert hex to RGB and back
    const hex2rgb = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    };
    
    const rgb2hex = (r, g, b) => {
      return '#' + [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
    };
    
    const rgb1 = hex2rgb(color1);
    const rgb2 = hex2rgb(color2);
    const blended = rgb1.map((val, i) => (val + rgb2[i]) / 2);
    return rgb2hex(...blended);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    console.log('TAG CLOUD NETWORK: Waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', initTagNetwork);
  } else {
    console.log('TAG CLOUD NETWORK: DOM already loaded, initializing immediately');
    initTagNetwork();
  }
})();
