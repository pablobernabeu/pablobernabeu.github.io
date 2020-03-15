---
abstract:
authors:
- P. Bernabeu
date: "2020-01-01"
# doi:
featured: false
image:
  caption: ''
  focal_point: ""
  preview_only: false
# links:
# - name:
#   url:
#  projects:
# - internal-project
publishDate: "2020-01-01"
publication:
publication_short:
publication_types:
- "1"
# slides: example
summary: 'Dashboard with open data from a study by Prudic et al. (2018), that compares citizen science with traditional methods in butterfly sampling. Coding tasks included long-transforming, merging, and as ever, wrangling with a table.'
tags:
- data dashboard
- citizen science
- butterflies
- nature
- open data
- BioScan
- iNaturalist
title: 'Butterfly species richness in Los Angeles'
url_code: 'https://github.com/pablobernabeu/Data-is-present/blob/master/examples-documents-dashboards/Dashboards/Flexdashboard/Butterfly-species-richness-in-LA.Rmd'
url_dataset: 'https://github.com/jcoliver/bioscan'
# url_pdf: ''
# url_poster: '#'
# url_project: ""
# url_slides: ""
# url_source: '#'
# url_video: '#'
---


### [Link to dashboard](/dashboards/Butterfly-species-richness-in-LA/d.html)

<br>

Dashboard with Open data</a> (<a href='https://github.com/jcoliver/bioscan/blob/master/data/iNaturalist-clean-reduced.csv' target="_blank">iNaturalist</a> and <a href='https://github.com/jcoliver/bioscan/blob/master/data/BioScanDataComplete.csv' target="_blank">BioScan</a>) from Prudic, K.L.; Oliver, J.C.; Brown, B.V.; Long, E.C. <a href='https://doi.org/10.3390/insects9040186' target="_blank"> **Comparisons of Citizen Science Data-Gathering Approaches to Evaluate Urban Butterfly Diversity**. *Insects* **2018**, *9*, 186</a>. Prudic and colleagues compared citizen science with traditional methods in the measurement of butterfly populations.

I developed this dashboard independently, after reproducing the [analyses of the original study](https://github.com/jcoliver/bioscan) in a [Reprohack session](https://github.com/reprohack/reprohack-hq/blob/master/README.md). 

My coding tasks included transforming the data to a long format,

```
# There are pseudovariables, that is, observations entered as variables. Since most R processes 
# need the tidy format, convert below (see https://r4ds.had.co.nz/tidy-data.html).
# The specific numbers found through traps and crowdsourcing methods are preserved.

BioScan = BioScan %>% pivot_longer(
    cols = Anthocharis_sara:Vanessa_cardui, names_to = "Species",
    values_to = "Number", values_drop_na = TRUE
  )

# Compare
#str(BioScan)
#str(dat)
# 928 rows now; the result of 29 pseudo-variables being transposed into
# rows, interacting with 32 previous rows, i.e., 29 * 32 = 928.

```

<br>

merging three data sets, 

```
# The iNaturalist data set presents a challenge slightly different from the pseudovariables found above.
# The number of animals of each species must be computed from repeated entries, per site.

iNaturalist = merge(iNaturalist, iNaturalist %>% count(species, site, name = 'Number'))

```

<br>

and, as ever, wrangling with the format of the dashboard pages to preserve the format of a table.

```
Species details {style="background-color: #FCFCFC;"}
=======================================================================

Column {style="data-width:100%; position:static; height:1000px;"}
-----------------------------------------------------------------------

```


Reference

Bernabeu, P. (2020). Dashboard with data from Prudic, Oliver, Brown, & Long (2018), Comparisons of Citizen Science Data-Gathering Approaches to Evaluate Urban Butterfly Diversity, *Insects*, *9*, 186. Retrieved from https://rpubs.com/pcbernabeu/Butterfly-species-richness-in-LA.
