

# Run `scopus_search` as many times as necessary based on the number of results, 
# limited to limit of results per search allowed by my API quota (normally, 20).

library(dplyr)
library(rscopus)

# Note. Before running the current function, the user must read in their Scopus API key 
# confidentially (see https://cran.r-project.org/web/packages/rscopus/vignettes/api_key.html).
# An error will be thrown if there's no Scopus API key registered.

query = 
  paste(
    '"Modality exclusivity norms for 423 object properties" OR ',
    '"Modality exclusivity norms for 400 nouns: The relationship between perceptual experience and surface word form"'
  )

search_period = '2017-2023'

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

