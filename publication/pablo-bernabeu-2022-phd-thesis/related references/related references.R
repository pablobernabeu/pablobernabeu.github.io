

library(dplyr)

query = paste(
  
  '"The concreteness advantage in lexical decision does not depend on perceptual simulations" OR ',
  '"Power failure: Why small sample size undermines the reliability of neuroscience" OR ',
  '"SIMR: An R package for power analysis of generalized linear mixed models by simulation" OR ',
  '"How many participants do we have to include in properly powered experiments?" OR ',
  '"Estimating power in (generalized) linear mixed models: An open introduction and tutorial in R" OR ',
  '"Data-driven computational models reveal perceptual simulation in word processing" OR ',
  '"Strength of perceptual experience predicts word processing performance better than concreteness or imageability" OR ',
  '"Visual and affective multimodal models of word meaning in language and mind" OR ',
  '"Better explanations of lexical and semantic cognition using networks derived from continued rather than single-word associations" OR ',
  '"Predicting human similarity judgments with distributional models" OR ',
  '"Latent semantic analysis cosines as a cognitive similarity measure" OR ',
  '"Predicting lexical priming effects from distributional semantic similarities" OR ',
  '"Mental simulation of object orientation and size" OR ',
  '"The Lancaster Sensorimotor Norms" OR ',
  '"The Calgary semantic decision project" OR ',
  '"Individual differences in semantic processing" OR ',
  '"Object shape and orientation do not routinely influence performance during language processing" OR ',
  '"Linear mixed-effects models and the analysis of nonindependent data" OR ',
  '"Robustness of linear mixed‐effects models to violations of distributional assumptions" OR ',
  '"Effects of perceptual and conceptual similarity in semantic priming" OR ',
  '"The effect of implied orientation derived from verbal context on picture recognition" OR ',
  '"The statistical significance filter leads to overoptimistic expectations of replicability" OR ',
  '"Understanding the role of linguistic distributional knowledge in cognition" OR ',
  '"Individual differences in visual word recognition" OR ',
  '"Individual differences in semantic priming performance: Insights from the semantic priming project" OR ',
  '"The English Lexicon Project" OR ',
  '"Establishing generalizable mechanisms" OR ',
  '"Does object size matter with regard to the mental simulation of object orientation?"'
)

search_period = 2022:2023

# Read in 'scopus_search_plus_DOIs' function
source('https://raw.githubusercontent.com/pablobernabeu/rscopus_plus/main/scopus_search_plus_DOIs.R')

# List and save DOIs, which can then be copied and pasted into a reference manager, 
# such as Zotero, to create the list of references.

path = paste0('content/publication/',
              'Bernabeu-2022-PhD-thesis-Language-sensorimotor-simulation-conceptual-processing/', 
              'related references/')

scopus_search_plus_DOIs(query, search_period, quota = 20, path,
                        save_date_time_file = TRUE, 
                        console_print_DOIs = TRUE)

# Find additional DOIs

# Read in 'scopus_search_plus_DOI' function
source('https://raw.githubusercontent.com/pablobernabeu/rscopus_plus/main/scopus_search_plus_additional_DOIs.R')

scopus_search_plus_additional_DOIs(query, search_period, quota = 20, path,
                                   save_date_time_file = TRUE, 
                                   console_print = TRUE)

