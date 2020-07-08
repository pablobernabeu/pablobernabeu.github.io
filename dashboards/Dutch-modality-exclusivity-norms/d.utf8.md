---
title: '&nbsp; &nbsp; Dutch modality exclusivity norms'
author: '<a href="#section-info" style="color:#E4E5E8 !important; text-decoration:none !important; font-size:10px"> Bernabeu et al. (2017) </a>'

knit: (function(inputFile, encoding) {
  rmarkdown::render(inputFile, encoding = encoding) })

output:
  flexdashboard::flex_dashboard:
    theme: 'spacelab'
    orientation: columns
    vertical_layout: scroll
    favicon: icon.png
    logo: icon-26.png
runtime: shiny
---





<!-- Begin definition of layout parameters -->
<head>
<style type="text/css">

<!-- Tabs format -->

/* inactive tab */
ul.nav.navbar-nav.navbar-left  a {
  color: white !important;
  background-color: none !important;
  border-bottom: none !important;
}

/* inactive tab hovered over */
ul.nav.navbar-nav.navbar-left  a:hover {
  color: white !important;
  background-color: #34507D !important;
  border-bottom: none !important;
  text-shadow: none !important;
}

/* active tab */
ul.nav.navbar-nav.navbar-left  li.active  a {
  color: white !important;
  font-weight: bold !important;
  background-color: #5472A3 !important;
  border-bottom: none !important;
  text-shadow: none !important;
}

/* visited links in active tabs */
ul.nav.navbar-nav.navbar-left  li.active  a:visited {
  color: white !important;
  font-weight: bold !important;
  background-color: #5472A3 !important;
  border-bottom: none !important;
  text-shadow: none !important;
}

/* visited links in inactive tabs */
ul.nav.navbar-nav.navbar-left  a:visited {
  color: white !important;
  font-weight: bold !important;
  background-color: #5472A3 !important;
  border-bottom: none !important;
  text-shadow: none !important;
}


<!-- Links format -->

/* unvisited link */
section-properties, section-concepts, section-cf-lc-english-norms, section-sound-symbolism, section-info  a {
  color: #3C6CA7 !important;
  border-bottom: 0.03px solid #5277A5 !important;
  font-weight: normal !important;
  background-color: none !important;
  text-shadow: none !important;
}

/* visited link */
section-properties, section-concepts, section-cf-lc-english-norms, section-sound-symbolism, section-info  a:visited {
  color: #426DA1 !important;
  border-bottom: none !important;
  font-weight: normal !important;
  background-color: none !important;
  text-shadow: none !important;
}

/* mouse over link */
section-properties, section-concepts, section-cf-lc-english-norms, section-sound-symbolism, section-info  a:hover {
  color: #2462B0 !important;
  border-bottom: none !important;
  font-weight: normal !important;
  background-color: none !important;
  text-shadow: 1px 1px darkgrey !important;
}

/* selected link */
section-properties, section-concepts, section-cf-lc-english-norms, section-sound-symbolism, section-info  a:active {
  color: #1964BF !important;
  border-bottom: none !important;
  font-weight: bold !important;
  background-color: none !important;
  text-shadow: 1px 1px darkgrey !important;
}


<!-- Define CSS style for customising output to specific screen sizes -->

.desktop-only {display: inline;}
  /* Smartphone Portrait and Landscape */
  @media only screen
    and (max-width : 765px){
     .desktop-only {display: none;}
}

.mobile-only {display: inline;}
  /* Smartphone Portrait and Landscape */
  @media only screen
    and (min-width : 766px){
      .mobile-only {display: none;}
}


<!-- Define CSS style for fonts -->

body{ /* Normal  */
      font-size: 16px;
  }
  
td {  /* Table  */
  font-size: 14px;
}

h1.title {
  font-size: 38px;
  font-weight: bold;
  color: #28002E
}

h1 { /* Header 1 */
  font-size: 28px;
  font-weight: bold;
  color: #28002E
}

h2 { /* Header 2 */
  font-size: 22px;
  font-weight: bold;
  color: #28002E
}

h3 { /* Header 3 */
  font-size: 18px;
  font-weight: bold;
}

h4 { /* Header 4 */
  font-size: 16px;
}

h5 { /* Header 5 */
  font-size: 15px;
}

h6 { /* Header 6 */
  font-size: 14px;
}

code.r{ /* Code block */
  font-size: 12px;
}

pre { /* Code-fromatted output */
  font-size: 14px;
  padding-top: 2px;
  padding-bottom: 2px;
  margin-top: -15px;
  margin-bottom: 18px;
}



<!-- Define CSS style for splitting columns -->

* {
  box-sizing: border-box;
}

/* Create two equal columns that float next to each other */
.column {
  float: left;
  padding: 10px;
}

/* Clear floats after the columns */
.row:after {
  content: "";
  display: table;
  clear: both;
}

</style>


<!-- Load Bootstrap libraries for icons -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
<link rel='stylesheet' href='https://use.fontawesome.com/releases/v5.7.0/css/all.css' integrity='sha384-lZN37f5QGtY3VHgisS14W3ExzMWZxybE1SJSEsQp9S+oqd12jhcu+A56Ebc1zFSJ' crossorigin='anonymous'>

<!-- Javascript function to enable a hovering tooltip -->
<script>
$(document).ready(function(){
    $('[data-toggle="tooltip1"]').tooltip();
});
</script>

<!-- Javascript function to add hyperlink to logo image -->
<script>
$('.navbar-logo').wrap('<a href="https://pablobernabeu.github.io/#data-dashboards">');
</script>

</head>











<i class="fas fa-code" aria-hidden="true"></i> Info {style="background-color: #FCFCFC; data-width: 100%; width: 900px; margin: 0 auto;"}
=======================================================================

Column {style="height:1300px; background-color:#FCFCFC;"}
--------------------------------------------------------

<div style = "padding-left: 60px; padding-right: 60px; padding-bottom:5px; text-align: justify; background-color: #FCFCFC;">

<div style = "color: #308212; font-weight: bold; font-size: 18px; text-align: center; padding-top: 35px;"> Desktop computer recommended. Please allow a few seconds to load. </div>

<div style="text-align: center; font-size: 14px; padding-top: 10px; margin-top: 2px; margin-bottom: 0px;"> This is a reduced version of a dashboard. </div>

<!-- Links -->
<div style = "text-align: center; padding-top: 12px;">

<a href="https://pablobernabeu.shinyapps.io/Dutch-modality-exclusivity-norms/" target="_top" style='color:#827182; border-bottom:none !important; font-size: 17px; font-weight: bold; font-family: "Courier New", Courier, monospace;'> <i class="fas fa-drafting-compass" aria-hidden="true" style='padding-top:4px; padding-bottom:6px; font-size:19px; color:#5A647B;'></i> See complete dashboard </a>

<a href="https://osf.io/58gzs/" target="_top" style="color:#577787; border-bottom:none !important;font-size: 18px; font-weight: bold; font-family: 'Courier New', Courier, monospace;"> <i class='fas fa-database' aria-hidden="true" style='font-size:16px; color:#577787'></i> Data </a>

<a href="https://github.com/pablobernabeu/Modality-exclusivity-norms-747-Dutch-English-replication/blob/master/Dutch-modality-exclusivity-norms-RPubs.Rmd" target="_top" style="color:#577787; border-bottom:none !important;font-size: 18px; font-weight: bold; font-family: 'Courier New', Courier, monospace;"> <i class='fab fa-r-project' aria-hidden="true" style='font-size:16px; color:#577787'></i><i class='fas fa-code' aria-hidden="true" style='font-size:9px; color:#526772'></i> Code </a>

</div>

<div style='text-align:right !important;'>
<a href="http://creativecommons.org/licenses/by/4.0/" rel="Attribution licence" target="_top" style="color:#CEC7BF; font-size:13px;"> Licence <img style="border-width:0;" src="https://i.creativecommons.org/l/by/4.0/80x15.png" alt="Creative Commons License"></img> </a>
</div>

<!-- Enable this once the Binder feature is enabled (https://github.com/jupyter/repo2docker/issues/799) -->
<!-- <div style="text-align: center; color: #A9AEC1; font-size: 12px; padding-top: 21px; margin-top: 2px; margin-bottom: 2px;"> In case of downtime, please [visit here](https://mybinder.org/v2/gh/pablobernabeu/Modality-exclusivity-norms-747-Dutch-English-replication/master?urlpath=shiny/Shiny-app/){target="_top"}. </div> -->

</div>


<div style = "padding-left: 60px; padding-right: 60px; text-align: justify; background-color:#FCFCFC; font-size: 16px; line-height: 1.6;">

## Information

This dashboard presents the data and analyses of a set of modality exclusivity norms for Dutch. Various tabs and interactive plots are available. In addition, the data set is available in [CSV format](https://osf.io/ge7pn/){target="_top"} and [Excel format including column definitions](https://osf.io/58gzs/){target="_top"}.

The norms, which are ratings of linguistic stimuli, served a twofold purpose: first, the creation of linguistic stimuli (Bernabeu, 2018; see also Speed & Majid, 2017), and second, a conceptual replication of Lynott and Connell's (2009, 2013) analyses. In the collection of the ratings, forty-two respondents completed surveys for the properties or the concepts separately. Each word was rated by eight participants on average, with a minimum of five (e.g., for *bevriezend*) and a maximum of ten ratings per word (e.g., for *donzig*). The [instructions to participants](https://osf.io/ungey/){target="_top"} were similar to those used by Lynott and Connell (2009, 2013), except that we elicited three modalities (auditory, haptic, visual) instead of five.

> <div style = "text-align: justify; background-color: #FCFCFC; font-size: 15px;"> 'This is a stimulus validation for a future experiment. The task is to rate how much you experience everyday' [properties/concepts] 'using three different perceptual senses: feeling by touch, hearing and seeing. Please rate every word on each of the three senses, from 0 (not experienced at all with that sense) to 5 (experienced greatly with that sense). If you do not know the meaning of a word, leave it blank.' </div>

### Definitions (as in Lynott & Connell, 2009, 2013)

* Dominant modality: Highest-rated modality;
* Modality exclusivity: Range of the three modality ratings divided by the sum;
* Perceptual strength: Highest rating across modalities.


<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>
<img src="d_files/figure-html/unnamed-chunk-1-1.png" width="500" data-figure-id=fig1 style="display: block; margin: auto;" />

##### Figure 1. Number of words in the norms per word category, dominant modality, and modality exclusivity. <br> [<i class='fas fa-external-link-alt' aria-hidden=TRUE style='font-size:7'></i> Github](https://raw.githubusercontent.com/pablobernabeu/Modality-exclusivity-norms-747-Dutch-English-replication/master/stacked_exc.png){target="_top"}. {style='text-align:justify; padding-left:5px; padding-right:5px; line-height: 1.4;'}


These norms were validated in an experiment demonstrating that shifts across trials with different dominant modalities incurred semantic processing costs ([Bernabeu, Willems, & Louwerse, 2017](https://mindmodeling.org/cogsci2017/papers/0318/index.html){target="_top"}). All data for that study are [available](https://osf.io/97unm/wiki/home/){target="_top"}, including a [dashboard](https://pablobernabeu.shinyapps.io/ERP-waveform-visualization_CMS-experiment/){target="_top"} (in case of downtime of the dashboard site, please see [this alternative](https://mybinder.org/v2/gh/pablobernabeu/Modality-switch-effects-emerge-early-and-increase-throughout-conceptual-processing/master?urlpath=shiny/Shiny-app/){target="_top"}).

The [**properties**](#properties){style='background-color:#FDFFFF'} and the [**concepts**](#concepts){style='background-color:#FDFFFF'} may also be consulted together on a [**table**](#table){style='background-color:#FDFFFF'}. Distinct relationships emerged among the modalities, with the visual and haptic modalities being more related to each other than to the auditory modality. This ties in with findings that, in conceptual processing, modalities can be collated based on language statistics (Louwerse & Connell, 2011). Furthermore, properties were found to be more strongly perceptual than concepts ([**cf. English norms by Lynott & Connell, 2009, 2013**](#section-cf-lc-english-norms){style='background-color:#FDFFFF'}).

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>
<img src="d_files/figure-html/unnamed-chunk-2-1.png" width="775" data-figure-id=fig2 style="display: block; margin: auto;" />

##### Figure 2. Dutch norms compared to English norms (reanalysis of Lynott & Connell, 2009, 2013, narrowed to three modalities) based on a principal component analysis of the auditory, haptic, and visual ratings for each word. Letters indicate the dominant modality of each word (*a* = auditory, *h* = haptic, *v* = visual), and contours further display the degree of consistency of the modalities. [<i class='fas fa-external-link-alt' aria-hidden=TRUE style='font-size:7'></i> Github](https://raw.githubusercontent.com/pablobernabeu/Modality-exclusivity-norms-747-Dutch-English-replication/master/allfour_lowres.png){target="_top"}. {style='text-align:justify; padding-left:5px; padding-right:5px; line-height:1.4;'}



<!-- Begin two-column format -->
<div class="row">
  <div class="column" style="width: 65%;">
<div>
The norms also served to investigate [**sound symbolism**](#sound-symbolism){style='background-color:#FDFFFF'}, which is the relation between the form of words and their meaning. The form of words rests on their sound more than on their visual or tactile properties (at least in spoken language). Therefore, auditory ratings should more reliably predict the lexical properties of words (length, frequency, distinctiveness) than haptic or visual ratings would. Lynott and Connell's (2013) findings were replicated, as auditory ratings were either the best predictor of lexical properties, or yielded an effect that was opposite in polarity to the effects of haptic and visual ratings. The present analyses and further ones will be reported in a forthcoming paper.

All data and code are [available for re-use](https://osf.io/brkjw/wiki/home/){target="_top"} under a [CC BY licence](https://creativecommons.org/licenses/by/4.0/){target="_top"}, by citing the source:
</div>
  </div>

  <div class="column" style="width: 35%; padding-left: 8px;">
<div style = "padding-top: 5px; padding-bottom: 8px; float: right; font-size: 13px; display: inline-block; background-color: #FAFAFA;">
<div style = "text-align: center !important; padding-bottom: 0 !important;"><img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Booba-Kiki.svg" alt="Bouba-Kiki" width=80px height=55px></img></div>
<div style="text-align: justify !important; padding-top: 0 !important; padding-right: 5px; padding-left: 5px;"> Sound symbolism is a psycholinguistic effect whereby the pronunciation and the meaning of words bear a non-arbitrary relationship. For instance, when people are asked to match the pseudowords *bouba* and *kiki* to the above objects, the vast majority name the angular object *kiki* and the smooth one *bouba* (Köhler, 1929; Sourav et al., 2019). </div>
<div style="font-size:65%; padding-top:4px; padding-right: 5px; padding-left: 5px; text-align:left;"> Image: <a href="https://commons.wikimedia.org/wiki/File:Booba-Kiki.svg" target="_top" title="via Wikimedia Commons">Monochrome version 1 June 2007 by BendžVectorized with Inkscape --Qef (talk) 21:21, 23 June 2008 (UTC)</a> [<a href="http://creativecommons.org/licenses/by-sa/3.0/" target="_top">CC BY-SA</a>].</div>
</div>
  </div>
<!-- End two-column format -->
</div>

> <div style = "text-align: justify; text-indent:-1.5em; margin-left:1.5em; font-size: 16px; background-color: #FCFCFC; font-size: 15px;"> Bernabeu, P., Willems, R. M., & Louwerse, M. M. (2017). Modality switch effects emerge early and increase throughout conceptual processing: Evidence from ERPs [Data dashboard for modality exclusivity norms]. Retrieved from https://pablobernabeu.shinyapps.io/Dutch-Modality-Exclusivity-Norms/.</div>


### External corpora

* Concreteness and age of acquisition: Norms by Brysbaert, Warriner, and Kuperman (2014);
* Phonological and orthographic neighbours: DutchPOND (Marian et al., 2012);
* Word frequency and contextual diversity: SUBTLEX-NL (Keuleers, Brysbaert, & New, 2010);
* Lemma frequency: CELEX (Baayen, Piepenbrock, & van Rijn, 1993).


### Acknowledgements {style='padding-top:5px;'}

This research was greatly supported by the help of Tilburg University, which provided funding; Wendy Leijten, who provided linguistic advice; and the forty-two Tilburg University students who completed the surveys.


### References {style='padding-top:5px;'}

<div style = "text-align: justify; text-indent:-2em; margin-left:2em; background-color:#FCFCFC; font-size:15px;">

Baayen, R. H., Piepenbrock, R., & van Rijn, H. (1993). *The CELEX Lexical Database* [CD-ROM]. Philadelphia: Linguistic Data Consortium, University of Pennsylvania.

Bernabeu, P.  (2018). *Dutch  modality  exclusivity  norms  for  336  properties  and  411  concepts* [Unpublished manuscript]. School of Humanities, Tilburg University. Tilburg, Netherlands. https://psyarxiv.com/s2c5h.

Bernabeu, P., Willems, R. M., & Louwerse, M. M. (2017). Modality switch effects emerge early and increase throughout conceptual processing: Evidence from ERPs. In G. Gunzelmann, A. Howes,  T. Tenbrink, & E. J. Davelaar (Eds.), *Proceedings of the 39th Annual Conference of the Cognitive Science Society* (pp. 1629-1634). Austin, TX: Cognitive Science Society. [https://mindmodeling.org/cogsci2017/papers/0318/index.html](https://mindmodeling.org/cogsci2017/papers/0318/index.html){target="_top"}.

Brysbaert, M., Warriner, A.B., & Kuperman, V. (2014). Concreteness ratings for 40 thousand generally known English word lemmas. *Behavior Research Methods, 46*, 3, 904-911. <br>
[https://doi.org/10.3758/s13428-013-0403-5](https://doi.org/10.3758/s13428-013-0403-5){target="_top"}.

Field, A. P., Miles, J., & Field, Z. (2012). *Discovering Statistics Using R*. London, UK: Sage.

Keuleers, E., Brysbaert, M. & New, B. (2010). SUBTLEX-NL: A new frequency measure for Dutch words based on film subtitles. *Behavior Research Methods, 42*, 3, 643-650. [https://doi.org/10.3758/BRM.42.3.643](https://doi.org/10.3758/BRM.42.3.643){target="_top"}.

Köhler, W. (1929). *Gestalt Psychology*. New York: Liveright.

Louwerse, M., & Connell, L. (2011). A taste of words: Linguistic context and perceptual simulation predict the modality of words. *Cognitive Science, 35*, 2, 381-98. [https://doi.org/10.1111/j.1551-6709.2010.01157.x](https://doi.org/10.1111/j.1551-6709.2010.01157.x){target="_top"}.

Lynott, D., & Connell, L. (2009). Modality exclusivity norms for 423 object concepts. *Behavior Research Methods, 41*, 2, 558-564. [https://doi.org/10.3758/BRM.41.2.558](https://doi.org/10.3758/BRM.41.2.558){target="_top"}.

Lynott, D., & Connell, L. (2013). Modality exclusivity norms for 400 nouns: The relationship between perceptual experience and surface word form. *Behavior Research Methods, 45*, 2, 516-526. <br>
[https://doi.org/10.3758/s13428-012-0267-0](https://doi.org/10.3758/s13428-012-0267-0){target="_top"}.

Marian, V., Bartolotti, J., Chabal, S., & Shook, A. (2012). CLEARPOND: Cross-Linguistic Easy-Access Resource for Phonological and Orthographic Neighborhood Densities. *PLoS ONE, 7*, 8: e43230. <br>
[https://doi.org/10.1371/journal.pone.0043230](https://doi.org/10.1371/journal.pone.0043230){target="_top"}.

Speed, L. J., & Majid, A. (2017). Dutch modality exclusivity norms: Simulating perceptual modality in space. *Behavior Research Methods, 49*, 6, 2204-2218. [https://doi.org/10.3758/s13428-017-0852-3](https://doi.org/10.3758/s13428-017-0852-3){target="_top"}.

Sourav, S., Kekunnaya, R., Shareef, I., Banerjee, S., Bottari, D., & Röder, B. (2019). A protracted sensitive period regulates the development of cross-modal sound–shape associations in humans. *Psychological Science, 30*, 10, 1473–1482. [https://doi.org/10.1177/0956797619866625](https://doi.org/10.1177/0956797619866625){target="_top"}.

</div>


## Contact {style='padding-top:5px;'}

Pablo Bernabeu. Email: p.bernabeu@lancaster.ac.uk.

[Webpage](http://www.research.lancs.ac.uk/portal/en/people/pablo-de-juan-bernabeu){target="_top"}

<br/>

</div>






Table {#table style="background-color:#FCFCFC;"}
=======================================================================

Column {style="data-width:100%; position:static; height:1000px;"}
-----------------------------------------------------------------------

### <span style = 'font-size: 15px;'> **Property and concept words**. Please scroll horizontally and vertically. Column information available by hovering on header. Columns may be simultaneously filtered and sorted (e.g., to find out range), and words may be searched under the header. [CSV](https://osf.io/ge7pn/){target="_top"} and [Excel spreadsheet](https://osf.io/58gzs/){target="_top"} also available.</span> {style="margin-top:17px; padding-top:25px; text-align:justify;"}

<div style = "text-align: justify; background-color: #FCFCFC;">

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>
preserve7893b7a5a7b94b25

</div>






<i class="fas fa-chart-bar" aria-hidden="true"></i> Properties {data-orientation=rows style="position: absolute !important;"}
=======================================================================

<!-- Inputs {.sidebar} -->
<!-- ----------------------------------------------------------------------- -->

<!-- <div style="padding-top: 25px; padding-bottom: 10px;"> -->

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>


<!-- </div> -->



<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>




<!-- Chunk right below removed from mobiles because it's badly displayed -->
<!-- #### {.desktop-only} -->

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>



<!-- Show again on all devices -->
<!-- #### -->

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>




<!-- #### **Modality** -->

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>



<!-- #### **Concreteness** -->

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>



<!-- #### **Length** -->

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>



<!-- #### **Word frequency** -->

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>



<!-- #### **Distinctiveness** -->

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>



<!-- #### **Age of acquisition** -->

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>



<!-- <div style = "padding-top: 10px; font-size = 0.6em; text-align: left"> -->

<!-- #### **Definitions** -->

<!-- **Principal component analysis (PCA):** Method for reducing dimensionality of data while retaining the main patterns ([read more](https://www.nature.com/articles/nmeth.4346){target="_top"}). -->

<!-- <div><span data-toggle="tooltip1" data-placement="bottom" title=" &nbsp; Computed as in Lynott and Connell (2009, 2013). " style="border-bottom: 0.9px dotted grey"><b> Dominant modality: </b></span> Highest-rated modality. </div> -->

<!-- <div style="padding-top:5px;"><span data-toggle="tooltip1" data-placement="bottom" title=" &nbsp; Computed as in Lynott and Connell (2009, 2013). " style="border-bottom: 0.9px dotted grey"><b> Modality exclusivity: </b></span> Range of the three modality ratings divided by the sum. </div> -->

<!-- <div style="padding-top:5px; padding-bottom:6px;"><span data-toggle="tooltip1" data-placement="bottom" title=" &nbsp; Computed as in Lynott and Connell (2009, 2013). " style="border-bottom: 0.9px dotted grey"><b> Perceptual strength: </b> </span> Highest rating across modalities. </div> -->


<!-- #### **Corpora** -->

<!-- **Concreteness and age of acquisition:** [Norms by Brysbaert, Warriner, and Kuperman (2014)](#info). -->

<!-- **Phonological and orthographic neighbours**: [DutchPOND (Marian et al., 2012)](#info). -->

<!-- **Word frequency and contextual diversity**: [SUBTLEX-NL (Keuleers, Brysbaert, & New, 2010)](#info). -->

<!-- **Lemma frequency**: [CELEX (Baayen, Piepenbrock, & van Rijn, 1993)](#info). -->

<!-- </div style="padding-bottom:14px;"> -->



Row {data-height=1000 padding-bottom=7}
-----------------------------------------------------------------------

### <span style = 'font-size: 16px !important;'> Principal component analysis (PCA) reflecting different relationships among the modalities. The visual and haptic modalities were related, whereas the auditory modality was more independent (see PCA loadings below; cf. <a href="#section-cf-lc-english-norms">Lynott & Connell's 2009 data for English</a>). <a href="https://osf.io/ge7pn/" target="_top">CSV</a> and <a href="https://osf.io/58gzs/" target="_top">Excel spreadsheet</a> also available.</span> {style="text-align:justify; padding-top: 30px !important; padding-bottom: 5px !important; padding-left: 4px !important; padding-right: 4px !important;"}

<!-- create margin -->
<div style="font-size:8px; padding-top:6px;"> </div>

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>
preserve1569ed5ef1959968

<!-- create margin -->
<div style="font-size:8px; padding-top:6px;"> </div>



Row {style="data-width:100%;"}
-----------------------------------------------------------------------

### <span> <b>Loadings of principal components (PC) in the form of correlations.</b> Coefficients above <i>r</i> = &plusmn;.70 (i.e., 50% shared variance) shown in bold. When the three modalities were reduced to two principal components, the visual and haptic modalities loaded onto the components similarly, both with positive polarities, whereas the auditory modality was relatively independent, with a negative polarity.</span> {style="font-size: 15px !important; text-align:justify; padding-top: 8px !important; padding-bottom: 5px !important; padding-left: 4px !important; padding-right: 4px !important;"}

<!-- create margin -->
<div style="font-size:8px; padding-top:6px;"> </div>

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>
<table class="table table-striped" style="width: auto !important; margin-left: auto; margin-right: auto;">
 <thead>
  <tr>
   <th style="text-align:left;"> Variable </th>
   <th style="text-align:left;"> PC1 </th>
   <th style="text-align:left;"> PC2 </th>
  </tr>
 </thead>
<tbody>
  <tr>
   <td style="text-align:left;"> Auditory </td>
   <td style="text-align:left;"> <span style=" font-weight: bold;    color: black !important;">-.85</span> </td>
   <td style="text-align:left;"> <span style="     ">-.16</span> </td>
  </tr>
  <tr>
   <td style="text-align:left;"> Haptic </td>
   <td style="text-align:left;"> <span style="     ">.11</span> </td>
   <td style="text-align:left;"> <span style=" font-weight: bold;    color: black !important;">.99</span> </td>
  </tr>
  <tr>
   <td style="text-align:left;"> Visual </td>
   <td style="text-align:left;"> <span style=" font-weight: bold;    color: black !important;">.87</span> </td>
   <td style="text-align:left;"> <span style="     ">.08</span> </td>
  </tr>
</tbody>
</table>









<i class="fas fa-chart-bar" aria-hidden="true"></i> Concepts {data-orientation=rows style="position: absolute !important;"}
=======================================================================

<!-- Inputs {.sidebar} -->
<!-- ----------------------------------------------------------------------- -->

<!-- <div style="padding-top: 25px; padding-bottom: 10px;"> -->

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>


<!-- </div> -->



<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>



<!-- Chunk right below removed from mobiles because it's badly displayed -->
<!-- #### {.desktop-only} -->

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>



<!-- Show again on all devices -->
<!-- #### -->

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>




<!-- #### **Modality** -->

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>



<!-- #### **Concreteness** -->

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>



<!-- #### **Length** -->

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>



<!-- #### **Word frequency** -->

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>



<!-- #### **Distinctiveness** -->

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>



<!-- #### **Age of acquisition** -->

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>



<!-- <div style = "padding-top: 10px; font-size = 0.6em; text-align: left"> -->

<!-- #### **Definitions** -->

<!-- **Principal component analysis (PCA):** Method for reducing dimensionality of data while retaining the main patterns ([read more](https://www.nature.com/articles/nmeth.4346){target="_top"}). -->

<!-- <div><span data-toggle="tooltip1" data-placement="bottom" title=" &nbsp; Computed as in Lynott and Connell (2009, 2013). " style="border-bottom: 0.9px dotted grey"><b> Dominant modality: </b></span> Highest-rated modality. </div> -->

<!-- <div style="padding-top:5px;"><span data-toggle="tooltip1" data-placement="bottom" title=" &nbsp; Computed as in Lynott and Connell (2009, 2013). " style="border-bottom: 0.9px dotted grey"><b> Modality exclusivity: </b></span> Range of the three modality ratings divided by the sum. </div> -->

<!-- <div style="padding-top:5px; padding-bottom:6px;"><span data-toggle="tooltip1" data-placement="bottom" title=" &nbsp; Computed as in Lynott and Connell (2009, 2013). " style="border-bottom: 0.9px dotted grey"><b> Perceptual strength: </b> </span> Highest rating across modalities. </div> -->


<!-- #### **Corpora** -->

<!-- **Concreteness and age of acquisition:** [Norms by Brysbaert, Warriner, and Kuperman (2014)](#info). -->

<!-- **Phonological and orthographic neighbours**: [DutchPOND (Marian et al., 2012)](#info). -->

<!-- **Word frequency and contextual diversity**: [SUBTLEX-NL (Keuleers, Brysbaert, & New, 2010)](#info). -->

<!-- **Lemma frequency**: [CELEX (Baayen, Piepenbrock, & van Rijn, 1993)](#info). -->

<!-- </div style="padding-bottom:14px;"> -->



Row {data-height=1000 padding-bottom=7}
-----------------------------------------------------------------------

### <span style = 'font-size: 16px !important;'> Principal component analysis (PCA) reflecting different relationships among the modalities. The visual and haptic modalities were related, whereas the auditory modality was more independent (see PCA loadings below; cf. <a href="#section-cf-lc-english-norms">Lynott & Connell's 2009 data for English</a>). <a href="https://osf.io/ge7pn/" target="_top">CSV</a> and <a href="https://osf.io/58gzs/" target="_top">Excel spreadsheet</a> also available.</span> {style="text-align:justify; padding-top: 30px !important; padding-bottom: 5px !important; padding-left: 4px !important; padding-right: 4px !important;"}

<!-- create margin -->
<div style="font-size:8px; padding-top:6px;"> </div>

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>
preserve5301365d92b07b95

<!-- create margin -->
<div style="font-size:8px; padding-top:6px;"> </div>



Row {style="data-width:100%;"}
-----------------------------------------------------------------------

### <span> <b>Loadings of principal components (PC) in the form of correlations.</b> Coefficients above <i>r</i> = &plusmn;.70 (i.e., 50% shared variance) shown in bold. When the three modalities were reduced to two principal components, visual and haptic ratings shared one component, whereas the auditory modality was relatively independent, having its own component.</span> {style="font-size: 15px !important; text-align:justify; padding-top: 8px !important; padding-bottom: 5px !important; padding-left: 4px !important; padding-right: 4px !important;"}

<!-- create margin -->
<div style="font-size:8px; padding-top:6px;"> </div>

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>
<table class="table table-striped" style="width: auto !important; margin-left: auto; margin-right: auto;">
 <thead>
  <tr>
   <th style="text-align:left;"> Variable </th>
   <th style="text-align:left;"> PC1 </th>
   <th style="text-align:left;"> PC2 </th>
  </tr>
 </thead>
<tbody>
  <tr>
   <td style="text-align:left;"> Auditory </td>
   <td style="text-align:left;"> <span style="     ">.03</span> </td>
   <td style="text-align:left;"> <span style=" font-weight: bold;    color: black !important;">.99</span> </td>
  </tr>
  <tr>
   <td style="text-align:left;"> Haptic </td>
   <td style="text-align:left;"> <span style=" font-weight: bold;    color: black !important;">.85</span> </td>
   <td style="text-align:left;"> <span style="     ">-.09</span> </td>
  </tr>
  <tr>
   <td style="text-align:left;"> Visual </td>
   <td style="text-align:left;"> <span style=" font-weight: bold;    color: black !important;">.84</span> </td>
   <td style="text-align:left;"> <span style="     ">.12</span> </td>
  </tr>
</tbody>
</table>







Cf. L&C English Norms
=======================================================================

<div style = "background-color: #FCFCFC; text-align: justify; font-size: 15px; padding-top:37px; padding-bottom: 5px; margin-bottom:4px; padding-left: 20px; padding-right: 20px;">
<b> Comparison with Lynott and Connell's (2009, 2013) English norms ([see complete data](http://www.lancaster.ac.uk/staff/connelll/lab/norms.html){target="_top"}).</b> In both languages, properties were visibly more perceptual than concepts.
</div>

Column {style="height:50%;" data-padding=1}
-----------------------------------------------------------------------

### Reanalysis of [Lynott and Connell's (2009) English properties](https://doi.org/10.3758/BRM.41.2.558){target="_top"} narrowed to three modalities



<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>
preserve4bb13965349049c4




### Reanalysis of [Lynott and Connell's (2013) English concepts](https://doi.org/10.3758/s13428-012-0267-0){target="_top"} narrowed to three modalities



<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>
preserve25e40e7de0eb1faf




Column {style="height:50%;" data-padding=1}
-----------------------------------------------------------------------

### &nbsp;&nbsp;&nbsp; [Dutch properties](#properties)

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>
preservef659ea95731e428a




### &nbsp;&nbsp;&nbsp; [Dutch concepts](#concepts)

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>
preserveacd38937b953f6bf







Sound Symbolism {data-orientation=rows background-color=#FBFBFB style='width:950px; margin:0 auto;'}
=======================================================================

Row {data-height=290 padding-top=30 padding-bottom=14px}
-----------------------------------------------------------------------





<!-- <div style = "background-color: #FCFCFC; padding-top: 18px; padding-left: 15px; padding-right: 1px; padding-bottom: 0px;"> -->

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>


<!-- </div> -->



<div style = "background-color: #FCFCFC; text-align: justify; padding-top: 39px; padding-right: 60px; padding-left: 60px; padding-bottom: 38px; margin-top: 0; margin-bottom: 7px;">

**Sound symbolism is the relation between the form of words and their meaning.** The form of words rests on their sound more than on their visual or tactile properties (at least in spoken language). Therefore, auditory ratings should more reliably predict the lexical properties of words (length, frequency, distinctiveness) than haptic or visual ratings would ([see external corpora](#info)). By means of regression analyses following Lynott and Connell (2013; see [Table 6](https://link.springer.com/article/10.3758%2Fs13428-012-0267-0#Sec4){target="_top"}), we found that auditory ratings were either the best predictor of lexical properties, or yielded an effect that was opposite in polarity to the effects of haptic and visual ratings, thus supporting sound symbolism.

Standardised coefficients ($\beta$) presented below, followed by asterisks indicating significance (<sup>\*</sup>*p* < .05; <sup>\*\*</sup>*p* < .01; <sup>\*\*\*</sup>*p* < .001), and the standard error below. Regression assumptions observed, i.e., normal distribution of residuals (transformations attempted), largest variance inflation factor < 10 and its mean around 1, tolerance > 0.2 ([Field, Miles, & Field, 2012](#info)). 'PC' = Kaiser-normalised, varimax-rotated principal component.

</div>



<!-- <div style = "background-color: #FCFCFC; padding-top: 18px; padding-right: 22px; padding-left: 1px; padding-bottom: 0px;"> -->

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>


<!-- </div> -->





Row {style="data-width:100%;"}
-----------------------------------------------------------------------

### <span style="font-size:1.7em; color:black;"> &nbsp; **Properties** </span> {style="background-color:#FFFAF4; padding-top:0px; padding-bottom:0.2px;"}

<div style = "background-color:white; padding-top:4px; padding-bottom:0.017px;">

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>
preservefc8a9331d9dd351f

</div>




### <span style="font-size:1.7em; color:black;"> &nbsp; **Concepts** </span> {style="background-color:#FFFEF3; padding-top:0px; padding-bottom:0.2px;"}

<div style = "background-color:white; padding-top:4px; padding-bottom:0.017px;">

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>
preserve8a38b0975d3b5799

</div>




Row {style="data-width:100%; padding-top: 0px; padding-bottom: 30px;"}
-----------------------------------------------------------------------

### <span> <b>Loadings of principal components for properties (see 'PC' dependent variables above), in the form of correlations.</b> Coefficients above <i>r</i> = &plusmn;.70 (i.e., 50% shared variance) shown in bold. </span> {style="background-color:#FFFAF4; padding-top:8px; padding-bottom:1px; text-align:justify;"}

<!-- create margin -->
<div style="background-color:white; padding-top:4px; padding-bottom:3px;">

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>
<table class="table table-striped" style="margin-left: auto; margin-right: auto;">
 <thead>
  <tr>
   <th style="text-align:left;"> Dependent </th>
   <th style="text-align:left;"> PC1 </th>
   <th style="text-align:left;"> PC2 </th>
   <th style="text-align:left;"> PC3 </th>
  </tr>
 </thead>
<tbody>
  <tr>
   <td style="text-align:left;"> Letters </td>
   <td style="text-align:left;"> <span style=" font-weight: bold;    color: black !important;">.86</span> </td>
   <td style="text-align:left;"> <span style="     ">-.35</span> </td>
   <td style="text-align:left;"> <span style="     ">-.33</span> </td>
  </tr>
  <tr>
   <td style="text-align:left;"> Phonemes </td>
   <td style="text-align:left;"> <span style=" font-weight: bold;    color: black !important;">.87</span> </td>
   <td style="text-align:left;"> <span style="     ">-.25</span> </td>
   <td style="text-align:left;"> <span style="     ">-.39</span> </td>
  </tr>
  <tr>
   <td style="text-align:left;"> Contextual diversity </td>
   <td style="text-align:left;"> <span style="     ">-.25</span> </td>
   <td style="text-align:left;"> <span style=" font-weight: bold;    color: black !important;">.93</span> </td>
   <td style="text-align:left;"> <span style="     ">.23</span> </td>
  </tr>
  <tr>
   <td style="text-align:left;"> Word frequency </td>
   <td style="text-align:left;"> <span style="     ">-.25</span> </td>
   <td style="text-align:left;"> <span style=" font-weight: bold;    color: black !important;">.93</span> </td>
   <td style="text-align:left;"> <span style="     ">.23</span> </td>
  </tr>
  <tr>
   <td style="text-align:left;"> Lemma frequency </td>
   <td style="text-align:left;"> <span style="     ">-.24</span> </td>
   <td style="text-align:left;"> <span style=" font-weight: bold;    color: black !important;">.85</span> </td>
   <td style="text-align:left;"> <span style="     ">.31</span> </td>
  </tr>
  <tr>
   <td style="text-align:left;"> Phonological neighbours </td>
   <td style="text-align:left;"> <span style="     ">-.36</span> </td>
   <td style="text-align:left;"> <span style="     ">.31</span> </td>
   <td style="text-align:left;"> <span style=" font-weight: bold;    color: black !important;">.86</span> </td>
  </tr>
  <tr>
   <td style="text-align:left;"> Orthographic neighbours </td>
   <td style="text-align:left;"> <span style="     ">-.37</span> </td>
   <td style="text-align:left;"> <span style="     ">.29</span> </td>
   <td style="text-align:left;"> <span style=" font-weight: bold;    color: black !important;">.86</span> </td>
  </tr>
</tbody>
</table>



</div>


### <span> <b>Loadings of principal components for concepts (see 'PC' dependent variables above), in the form of correlations.</b> Coefficients above <i>r</i> = &plusmn;.70 (i.e., 50% shared variance) shown in bold. </span> {style="background-color:#FFFEF3; padding-top:8px; padding-bottom:1px; text-align:justify;"}

<!-- create margin -->
<div style="background-color:white; padding-top:4px; padding-bottom:3px;">

<div class="knitr-options" data-fig-width="576" data-fig-height="460"></div>
<table class="table table-striped" style="margin-left: auto; margin-right: auto;">
 <thead>
  <tr>
   <th style="text-align:left;"> Dependent </th>
   <th style="text-align:left;"> PC1 </th>
   <th style="text-align:left;"> PC2 </th>
   <th style="text-align:left;"> PC3 </th>
  </tr>
 </thead>
<tbody>
  <tr>
   <td style="text-align:left;"> Letters </td>
   <td style="text-align:left;"> <span style=" font-weight: bold;    color: black !important;">.91</span> </td>
   <td style="text-align:left;"> <span style="     ">-.19</span> </td>
   <td style="text-align:left;"> <span style="     ">-.33</span> </td>
  </tr>
  <tr>
   <td style="text-align:left;"> Phonemes </td>
   <td style="text-align:left;"> <span style=" font-weight: bold;    color: black !important;">.92</span> </td>
   <td style="text-align:left;"> <span style="     ">-.16</span> </td>
   <td style="text-align:left;"> <span style="     ">-.33</span> </td>
  </tr>
  <tr>
   <td style="text-align:left;"> Contextual diversity </td>
   <td style="text-align:left;"> <span style="     ">-.18</span> </td>
   <td style="text-align:left;"> <span style=" font-weight: bold;    color: black !important;">.95</span> </td>
   <td style="text-align:left;"> <span style="     ">.16</span> </td>
  </tr>
  <tr>
   <td style="text-align:left;"> Word frequency </td>
   <td style="text-align:left;"> <span style="     ">-.19</span> </td>
   <td style="text-align:left;"> <span style=" font-weight: bold;    color: black !important;">.94</span> </td>
   <td style="text-align:left;"> <span style="     ">.17</span> </td>
  </tr>
  <tr>
   <td style="text-align:left;"> Lemma frequency </td>
   <td style="text-align:left;"> <span style="     ">-.05</span> </td>
   <td style="text-align:left;"> <span style=" font-weight: bold;    color: black !important;">.89</span> </td>
   <td style="text-align:left;"> <span style="     ">.07</span> </td>
  </tr>
  <tr>
   <td style="text-align:left;"> Phonological neighbours </td>
   <td style="text-align:left;"> <span style="     ">-.32</span> </td>
   <td style="text-align:left;"> <span style="     ">.17</span> </td>
   <td style="text-align:left;"> <span style=" font-weight: bold;    color: black !important;">.90</span> </td>
  </tr>
  <tr>
   <td style="text-align:left;"> Orthographic neighbours </td>
   <td style="text-align:left;"> <span style="     ">-.32</span> </td>
   <td style="text-align:left;"> <span style="     ">.15</span> </td>
   <td style="text-align:left;"> <span style=" font-weight: bold;    color: black !important;">.90</span> </td>
  </tr>
</tbody>
</table>



</div>
