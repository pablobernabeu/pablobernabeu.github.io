

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
    '"How many participants do we have to include in properly powered experiments?" OR ',
    '"Data-driven computational models reveal perceptual simulation in word processing" OR ',
    '"Power failure: Why small sample size undermines the reliability of neuroscience" OR ',
    '"Strength of perceptual experience predicts word processing performance better than concreteness or imageability" OR ',
    '"Visual and affective multimodal models of word meaning in language and mind" OR ',
    '"Better explanations of lexical and semantic cognition using networks derived from continued rather than single-word associations" OR ',
    '"Predicting human similarity judgments with distributional models" OR ',
    '"SIMR: An R package for power analysis of generalized linear mixed models by simulation" OR ',
    '"Latent semantic analysis cosines as a cognitive similarity measure" OR ',
    '"Predicting lexical priming effects from distributional semantic similarities" OR ',
    '"Mental simulation of object orientation and size" OR ',
    '"The Lancaster Sensorimotor Norms" OR ',
    '"The Calgary semantic decision project" OR ',
    '"Individual differences in semantic processing" OR ',
    '"Object shape and orientation do not routinely influence performance during language processing" OR ',
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

period = '2022-2023'

# Enable as many searches as necessary given the search quota

my_quota = 20

res = scopus_search(query = query, max_count = my_quota, count = my_quota, date = period)

safe_maximum = 5000  # protection from massive search

total_results = 0 : res$total_results

chunks = total_results[seq(1, length(total_results), my_quota)]

results = data.frame(author = as.character(), date = as.character(), 
                     title = as.character(), publication = as.character(), 
                     doi = as.character())

if(have_api_key()) { 
  
  for(i_chunk in 1 : n_distinct(chunks)) {
    
    res = scopus_search(query = query, max_count = my_quota, count = my_quota, 
                        start = chunks[i_chunk], date = period)
    
    for(i_entry in 1 : length(res$entries)) {
      
      author = res$entries[[i_entry]]$`dc:creator`
      date = res$entries[[i_entry]]$`prism:coverDisplayDate`
      title = res$entries[[i_entry]]$`dc:title`
      publication = res$entries[[i_entry]]$`prism:publicationName`
      doi = res$entries[[i_entry]]$`prism:doi`
      
      i_results = data.frame( author = ifelse(!is.null(author), author, NA), 
                              date = ifelse(!is.null(date), date, NA), 
                              title = ifelse(!is.null(title), title, NA), 
                              publication = ifelse(!is.null(publication), publication, NA), 
                              doi = ifelse(!is.null(doi), doi, NA) )
      
      results = rbind(results, i_results)
    }
  }
}

# List DOIs, which can then be copied and pasted into a reference manager, 
# such as Zotero, to create the list of references.

cat(results[complete.cases(results$doi), 'doi'], sep = '\n')

