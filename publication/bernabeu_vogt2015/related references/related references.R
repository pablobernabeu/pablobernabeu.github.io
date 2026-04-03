

# Run `scopus_search` as many times as necessary based on the number of results, 
# limited to limit of results per search allowed by my API quota (normally, 20).

library(dplyr)
library(rscopus)

# Note. Before running the current function, the user must read in their Scopus API key 
# confidentially (see https://cran.r-project.org/web/packages/rscopus/vignettes/api_key.html).
# An error will be thrown if there's no Scopus API key registered.

query = 
  paste(
    '"How could language have evolved?" OR ',
    '"Lingua ex machina: Reconciling Darwin and Chomsky with the human brain" OR ',
    '"From Hand to Mouth: The Gestural Origins of Language" OR ',
    '"The symbolic species: the coevolution of language and the brain" OR ',
    '"The evolution of the language faculty: Clarifications and implications" OR ',
    '"The faculty of language: What is it, who has it and how did it evolve?" OR ',
    '"Natural language and natural selection" OR ',
    '"The Language Instinct: How the Mind Creates Language" OR ',
    '"The origins of human communication" OR ',
    '"The origin of human multi-modal communication" OR ',
    '"Bringing back the body into the mind: gestures enhance word learning in foreign language" OR ',
    '"The Routledge Handbook of Embodied Cognition" OR ',
    '"Towards a more embedded/extended perspective on the cognitive function of gestures" OR ',
    '"The pragmatic foundations of communication" OR ',
    '"Experimental semiotics: a review" OR ',
    '"Foundations of language: Brain, meaning, grammar, evolution" OR ',
    '"Emergent mirror systems for body language" OR ',
    '"Neural correlates of Early Stone Age toolmaking: technology, language and cognition in human evolution" OR ',
    '"The Oxford handbook of language evolution" OR ',
    '"Language acquisition meets language evolution"'
  )

search_period = '2015-2025'

# Read in 'scopus_search_plus' function
source('https://raw.githubusercontent.com/pablobernabeu/rscopus_plus/main/scopus_search_plus.R')

results = scopus_search_plus(query, search_period, 20)

# List and save DOIs, which can then be copied and pasted into a reference manager, 
# such as Zotero, to create the list of references.

DOIs = results[complete.cases(results$doi), 'doi']

cat(DOIs, sep = '\n')

write.csv(DOIs, 'content/publication/Bernabeu_Vogt2015/related references/related references.csv', row.names = FALSE)
