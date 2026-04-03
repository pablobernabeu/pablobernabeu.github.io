

# Run `scopus_search` as many times as necessary based on the number of results, 
# limited to limit of results per search allowed by my API quota (normally, 20).

library(dplyr)
library(rscopus)

# Note. Before running the current function, the user must read in their Scopus API key 
# confidentially (see https://cran.r-project.org/web/packages/rscopus/vignettes/api_key.html).
# An error will be thrown if there's no Scopus API key registered.

query = 
  paste(
    '"Modality switch effects emerge early and increase throughout conceptual processing: Evidence from ERPs" OR ',
    '"Linguistic distributional knowledge and sensorimotor grounding both contribute to semantic category production" OR ',
    '"Language and simulation in conceptual processing" OR ',
    '"The Lancaster Sensorimotor Norms: Multidimensional measures of perceptual and action strength for 40,000 English words" OR ',
    '"Neurological evidence linguistic processes precede perceptual simulation in conceptual processing" OR ',
    '"Effect size matters: The role of language statistics and perceptual simulation in conceptual processing" OR ',
    '"Strength of perceptual experience predicts word processing performance better than concreteness or imageability" OR ',
    '"The semantic priming project" OR ',
    '"Individual differences in semantic processing: Insights from the Calgary semantic decision project" OR ',
    '"Modality exclusivity norms for 423 object properties" OR ',
    '"Switching modalities in a sentence verification task: ERP evidence for embodied language processing" OR ',
    '"Empirically grounding grounded cognition: The case of color" OR ',
    '"Understanding the role of linguistic distributional knowledge in cognition" OR ',
    '"Building semantic memory from embodied and distributional language experience" OR ',
    '"Symbol interdependency in symbolic and embodied cognition" OR ',
    '"Predicting lexical priming effects from distributional semantic similarities" OR ',
    '"The concreteness advantage in lexical decision does not depend on perceptual simulations" OR ',
    '"Data-driven computational models reveal perceptual simulation in word processing" OR ',
    '"Vision dominates in perceptual language: English sensory vocabulary is optimized for usage" OR ',
    '"Sensorimotor distance: A grounded measure of semantic similarity for 800 million concept pairs"'
  )

search_period = '2020-2026'

# Read in 'scopus_search_plus' function
source('https://raw.githubusercontent.com/pablobernabeu/rscopus_plus/main/scopus_search_plus.R')

results = scopus_search_plus(query, search_period, 20)

# List and save DOIs, which can then be copied and pasted into a reference manager, 
# such as Zotero, to create the list of references.

DOIs = results[complete.cases(results$doi), 'doi']

cat(DOIs, sep = '\n')

write.csv(DOIs, 'content/publication/language-vision-conceptual-processing/related references/related references.csv', row.names = FALSE)
