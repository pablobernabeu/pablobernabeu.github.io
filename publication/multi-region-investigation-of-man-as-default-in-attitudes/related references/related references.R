

# Run `scopus_search` as many times as necessary based on the number of results, 
# limited to limit of results per search allowed by my API quota (normally, 20).

library(dplyr)
library(rscopus)

# Note. Before running the current function, the user must read in their Scopus API key 
# confidentially (see https://cran.r-project.org/web/packages/rscopus/vignettes/api_key.html).
# An error will be thrown if there's no Scopus API key registered.

query = 
  paste(
    '"Masculine bias in the attribution of personhood: people = male, male = people" OR ',
    '"Is man the measure of all things? A social cognitive account of androcentrism" OR ',
    '"Gender schema theory: a cognitive account of sex typing" OR ',
    '"Based on billions of words on the internet, people = men" OR ',
    '"Intersectional Male-Centric and White-Centric Biases in Collective Concepts" OR ',
    '"When he doesn\u2019t mean you: gender-exclusive language as ostracism" OR ',
    '"Prototypes of race and gender: the invisibility of Black women" OR ',
    '"Race is gendered: how covarying phenotypes and stereotypes bias sex categorization" OR ',
    '"An Intersectional analysis of gender and ethnic stereotypes" OR ',
    '"Forming attitudes that predict future behavior: a meta-analysis of the attitude-behavior relation" OR ',
    '"The Psychological science accelerator: advancing psychology through a distributed collaborative network" OR ',
    '"Measuring stereotypes of female politicians" OR ',
    '"Gendered race prototypes: evidence for the non-prototypicality of Asian men and Black women" OR ',
    '"Role congruity theory of prejudice toward female leaders" OR ',
    '"Status incongruity and backlash effects: defending the gender hierarchy motivates prejudice against female leaders" OR ',
    '"Intersectional invisibility: the distinctive advantages and disadvantages of multiple subordinate-group identities" OR ',
    '"Prejudice at the nexus of race and gender: an outgroup male target hypothesis" OR ',
    '"A sociohistorical model of intersectional social category prototypes" OR ',
    '"Typical roles and intergroup relations shape stereotypes" OR ',
    '"Exemplar-based model of social judgment"'
  )

search_period = '2020-2026'

# Read in 'scopus_search_plus' function
source('https://raw.githubusercontent.com/pablobernabeu/rscopus_plus/main/scopus_search_plus.R')

results = scopus_search_plus(query, search_period, 20)

# List and save DOIs, which can then be copied and pasted into a reference manager, 
# such as Zotero, to create the list of references.

DOIs = results[complete.cases(results$doi), 'doi']

cat(DOIs, sep = '\n')

write.csv(DOIs, 'content/publication/multi-region-investigation-of-man-as-default-in-attitudes/related references/related references.csv', row.names = FALSE)
