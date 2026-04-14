

# Run `scopus_search` as many times as necessary based on the number of results, 
# limited to limit of results per search allowed by my API quota (normally, 20).

library(dplyr)
library(rscopus)

# Note. Before running the current function, the user must read in their Scopus API key 
# confidentially (see https://cran.r-project.org/web/packages/rscopus/vignettes/api_key.html).
# An error will be thrown if there's no Scopus API key registered.

query = 
  paste(
    '"Does object size matter with regard to the mental simulation of object orientation?" OR ',
    '"Representing object colour in language comprehension" OR ',
    '"Mental simulation of four visual object properties" OR ',
    '"Size does matter: Implied object size is mentally simulated during language comprehension" OR ',
    '"Perceptual simulation in developing language comprehension" OR ',
    '"Mental simulation of object orientation and size: A conceptual replication with second language learners" OR ',
    '"Effect size matters: the role of language statistics and perceptual simulation in conceptual processing" OR ',
    '"A pre-registered, multi-lab non-replication of the action-sentence compatibility effect" OR ',
    '"Six challenges for embodiment research" OR ',
    '"Language comprehenders retain implied shape and orientation of objects" OR ',
    '"Object shape and orientation do not routinely influence performance during language processing" OR ',
    '"One word at a time: Mental representations of object shape change incrementally during sentence processing" OR ',
    '"The effect of implied orientation derived from verbal context on picture recognition" OR ',
    '"Six views of embodied cognition" OR ',
    '"Embodiment and language comprehension: Reframing the discussion" OR ',
    '"Revisiting mental simulation in language comprehension: Six replication attempts" OR ',
    '"Language comprehenders mentally represent the shapes of objects" OR ',
    '"Establishing generalizable mechanisms"'
  )

search_period = '2020-2026'

# Read in 'scopus_search_plus' function
source('https://raw.githubusercontent.com/pablobernabeu/rscopus_plus/main/scopus_search_plus.R')

results = scopus_search_plus(query, search_period, 20)

# List and save DOIs, which can then be copied and pasted into a reference manager, 
# such as Zotero, to create the list of references.

DOIs = results[complete.cases(results$doi), 'doi']

cat(DOIs, sep = '\n')

write.csv(DOIs, 'content/publication/investigating-object-orientation-effects-across-18-languages/related references/related references.csv', row.names = FALSE)
