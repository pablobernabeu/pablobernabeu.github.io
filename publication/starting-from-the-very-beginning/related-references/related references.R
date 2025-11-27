

# Run `scopus_search` as many times as necessary based on the number of results, 
# limited to limit of results per search allowed by my API quota (normally, 20).

library(dplyr)
library(rscopus)

# set_api_key('your_key_here')  # (see https://cran.r-project.org/web/packages/rscopus/vignettes/api_key.html)

# I'll read in my personal Scopus key from a file. 
# If you do this, make sure not to share your file.

api_key = readLines('assets/Scopus API key.txt')
set_api_key(api_key)

# Note. Before running the current function, the user must read in their Scopus API key 
# confidentially (see https://cran.r-project.org/web/packages/rscopus/vignettes/api_key.html).
# An error will be thrown if there's no Scopus API key registered.

query = 
  paste(
    '"Morphosyntactic processing in advanced second language (L2) learners: An event-related potential investigation of the effects of L1-L2 similarity and structural distance" OR',
    '"The role of the second language in third language acquisition: The case of Germanic syntax" OR',
    '"How does bilingualism modify cognitive function? Attention to the mechanism" OR',
    '"Bilingual language experience shapes resting-state brain rhythms" OR',
    '"Introduction – multilingualism: Language, brain and cognition" OR',
    '"Why do learners overcome non-facilitative transfer faster from an L2 than an L1? The cumulative input threshold hypothesis" OR',
    '"Event-related potentials at initial exposure in third language acquisition: Implications from an artificial mini-grammar study" OR',
    '"Using artificial languages to study third language learning and processing" OR',
    '"Incidental exposure and L3 learning of morphosyntax" OR',
    '"Mechanisms of human attention: Event-related potentials and oscillations" OR',
    '"The impact of second-and third-language learning on language aptitude and working memory" OR',
    '"Does language switching behavior rely on general executive functions?" OR',
    '"Third language acquisition and linguistic transfer" OR',
    '"On the typological economy of syntactic transfer: Word order and relative clause high/low attachments preference in L3 Brazilian Portuguese" OR',
    '"Linguistic and cognitive motivations for the typological primacy model (TPM) of third language (L3) transfer: Timing of acquisition and proficiency considered"'
  )

search_period = '2018-2024'

# Read in 'scopus_search_plus' function
source('https://raw.githubusercontent.com/pablobernabeu/rscopus_plus/main/scopus_search_plus.R')

results = scopus_search_plus(query, search_period, 20)

# List and save DOIs, which can then be copied and pasted into a reference manager, 
# such as Zotero, to create the list of references.

DOIs = results[complete.cases(results$doi), 'doi']

cat(DOIs, sep = '\n')

write.csv(DOIs, 'content/publication/starting-from-the-very-beginning/related references/related references.csv', 
          row.names = FALSE)

