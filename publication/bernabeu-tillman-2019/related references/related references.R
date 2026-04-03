

# Run `scopus_search` as many times as necessary based on the number of results, 
# limited to limit of results per search allowed by my API quota (normally, 20).

library(dplyr)
library(rscopus)

# Note. Before running the current function, the user must read in their Scopus API key 
# confidentially (see https://cran.r-project.org/web/packages/rscopus/vignettes/api_key.html).
# An error will be thrown if there's no Scopus API key registered.

query = 
  paste(
    '"Ways to go: Methodological considerations in Whorfian studies in motion events" OR ',
    '"Does language shape thought? English and Mandarin speakers\u2019 conceptions of time" OR ',
    '"Rethinking linguistic relativity" OR ',
    '"Language diversity and thought: A reformulation of the linguistic relativity hypothesis" OR ',
    '"Satellite- vs. verb-framing underpredicts nonverbal motion categorization" OR ',
    '"Speaking of motion: Verb use in English and Spanish" OR ',
    '"The representation of motion in thought and language" OR ',
    '"Lexical, syntactic, and semantic-geometric factors in the acquisition of motion predicates" OR ',
    '"Thinking for speaking" OR ',
    '"Two ways to travel: Verbs of motion in English and Spanish" OR ',
    '"What makes manner of motion salient?" OR ',
    '"Path to realization: A typology of event conflation" OR ',
    '"Perceiving and remembering events cross-linguistically" OR ',
    '"The evolutionary dynamics of motion event encoding" OR ',
    '"Consistency in motion event encoding across languages"'
  )

search_period = '2019-2026'

# Read in 'scopus_search_plus' function
source('https://raw.githubusercontent.com/pablobernabeu/rscopus_plus/main/scopus_search_plus.R')

results = scopus_search_plus(query, search_period, 20)

# List and save DOIs, which can then be copied and pasted into a reference manager, 
# such as Zotero, to create the list of references.

DOIs = results[complete.cases(results$doi), 'doi']

cat(DOIs, sep = '\n')

write.csv(DOIs, 'content/publication/Bernabeu-Tillman-2019/related references/related references.csv', row.names = FALSE)
