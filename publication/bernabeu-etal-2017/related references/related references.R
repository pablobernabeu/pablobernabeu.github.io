

# Run `scopus_search` as many times as necessary based on the number of results, 
# limited to limit of results per search allowed by my API quota (normally, 20).

library(dplyr)
library(rscopus)

# Note. Before running the current function, the user must read in their Scopus API key 
# confidentially (see https://cran.r-project.org/web/packages/rscopus/vignettes/api_key.html).
# An error will be thrown if there's no Scopus API key registered.

query = 
  paste(
    '"A taste of words: Linguistic context and perceptual simulation predict the modality of words" OR ',
    '"Dutch modality exclusivity norms for 336 properties and 411 concepts" OR ',
    '"Empirically grounding grounded cognition: The case of color" OR ',
    '"Exploring modality switching effects in negated sentences: Further evidence for grounded representations" OR ',
    '"Flexibility in embodied language processing: Context effects in lexical access" OR ',
    '"Modality exclusivity norms for 423 object properties" OR ',
    '"Modality switch effects emerge early and increase throughout conceptual processing: Evidence from ERPs" OR ',
    '"Modality switching in a property verification task: An ERP study of what happens when candles flicker after high heels click" OR ',
    '"Only time will tell—Why temporal information is essential for our neuroscientific understanding of semantics" OR ',
    '"Switching modalities in a sentence verification task: ERP evidence for embodied language processing" OR ',
    '"The modality-switch effect: Visually and aurally presented prime sentences activate our senses" OR ',
    '"The multilevel modality-switch effect: What happens when we see the bees buzzing and hear the diamonds glistening" OR ',
    '"Verifying different-modality properties for concepts produces switching costs" OR ', 
    '"Verifying properties from different emotions produces switching costs: Evidence for coarse-grained language statistics and fine-grained perceptual simulation"'
  )

search_period = '2017-2023'

# Read in 'scopus_search_plus' function
source('https://raw.githubusercontent.com/pablobernabeu/rscopus_plus/main/scopus_search_plus.R')

results = scopus_search_plus(query, search_period, 20)

# List and save DOIs, which can then be copied and pasted into a reference manager, 
# such as Zotero, to create the list of references.

DOIs = results[complete.cases(results$doi), 'doi']

cat(DOIs, sep = '\n')

write.csv(DOIs, 'content/publication/the-interplay-between-linguistic-and-embodied-systems-in-conceptual-processing/related references/related references.csv', row.names = FALSE)

