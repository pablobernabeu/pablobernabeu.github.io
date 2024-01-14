

# Run `scopus_search` as many times as necessary based on the number of results, 
# limited to limit of results per search allowed by my API quota (normally, 20).

library(dplyr)
library(rscopus)

# Note. Before running the current function, the user must read in their Scopus API key 
# confidentially (see https://cran.r-project.org/web/packages/rscopus/vignettes/api_key.html).
# An error will be thrown if there's no Scopus API key registered.

query = 
  paste(
    '"The concreteness advantage in lexical decision does not depend on perceptual simulations" OR ',
    '"Strength of perceptual experience predicts word processing performance better than concreteness or imageability" OR ',
    '"Quantifying sensorimotor experience" OR ',
    '"Visual and affective multimodal models of word meaning in language and mind" OR ',
    '"Better explanations of lexical and semantic cognition using networks derived from continued rather than single-word associations" OR ',
    '"Predicting human similarity judgments with distributional models" OR ',
    '"Latent semantic analysis cosines as a cognitive similarity measure" OR ',
    '"Predicting lexical priming effects from distributional semantic similarities" OR ',
    '"The Lancaster Sensorimotor Norms" OR ',
    '"The Calgary semantic decision project" OR ',
    '"Individual differences in semantic processing" OR ',
    '"Robustness of linear mixed‐effects models to violations of distributional assumptions" OR ',
    '"Effects of perceptual and conceptual similarity in semantic priming" OR ',
    '"The statistical significance filter leads to overoptimistic expectations of replicability" OR ',
    '"Understanding the role of linguistic distributional knowledge in cognition" OR ',
    '"Acquisition of abstract concepts is influenced by emotional valence" OR ',
    '"The role of emotional valence in learning novel abstract concepts" OR ',
    '"Effects of emotional and sensorimotor knowledge in semantic processing of concrete and abstract nouns" OR ',
    '"Catching the intangible: A role for emotion?" OR ',
    '"Are automatic conceptual cores the gold standard of semantic processing" OR ',
    '"Reproducing affective norms with lexical co-occurrence statistics" OR ',
    '"The benefits of sensorimotor knowledge" OR ',
    '"Effects of context valence, arousal, and concreteness on visual word processing" OR ',
    '"Predicting lexical norms" OR ',
    '"Norms of valence, arousal, and dominance for 13,915 English lemmas" OR ',
    '"Effects of valence and arousal on emotional word processing are modulated by concreteness" OR ',
    '"Individual differences in visual word recognition"'
  )

search_period = '2021-2023'

# Read in 'super_scopus_search' function
source('https://raw.githubusercontent.com/pablobernabeu/super_scopus_search/main/super_scopus_search.R')

results = super_scopus_search(query, search_period, 20)

# List and save DOIs, which can then be copied and pasted into a reference manager, 
# such as Zotero, to create the list of references.

DOIs = results[complete.cases(results$doi), 'doi']

cat(DOIs, sep = '\n')

write.csv(DOIs, 'content/publication/the-interplay-between-linguistic-and-embodied-systems-in-conceptual-processing/related references.csv', row.names = FALSE)

