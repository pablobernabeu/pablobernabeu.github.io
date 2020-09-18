
<br>

# Mixed-effects models in R, and a new tool for data simulation

#### Pablo Bernabeu

##### 26 Nov 2020 - New Tricks Seminars, Dept. Psychology, Lancaster University


### Abstract

Linear mixed-effects models (LMEMs) are used to account for variation within factors with multiple observations, such as participants, trials, items, channels, etc. (for an earlier approach, see Clark, 1973). This variation is modelled in terms of random intercepts (e.g., overall variation per participant) as well as random slopes for the fixed effects (e.g., treatment effect per participant). These measures help reduce false positives and false negatives (Barr, Levy, Scheepers, & Tily, 2013). Use of LMEMs has grown over the past decade, under various implementation forms (Meteyard & Davies, 2020). In this talk, I will look over the rationale for LMEMs, and demonstrate how to fit them in R (Brauer, & Curtin, 2018; Luke, 2017; Schielzeth et al., 2020). Challenges will also be covered. With the widely-accepted 'maximal' approach, based on fitting all possible random effects for each fixed effect, models sometimes fail to find a solution, or 'convergence'. Advice for the problem of nonconvergence will be demonstrated, through the progressive lightening of the random effects structure (Singman & Kellen, 2017; for an alternative approach, especially with small samples, see Matuschek et al., 2017). At the end, on a different note, I will present a web application that facilitates data simulation for research and teaching (Bernabeu & Lynott, 2020).


### References

<div style = "text-indent:-2em; margin-left:2em;">

Barr, D. J., Levy, R., Scheepers, C., & Tily, H. J. (2013). Random effects structure for confirmatory hypothesis testing: Keep it maximal. *Journal of Memory and Language, 68*, 255–278. http://dx.doi.org/10.1016/j.jml.2012.11.001  

Bernabeu, P., & Lynott, D. (2020). Web application for the simulation of experimental data (Version 1.0). Retrieved from https://github.com/pablobernabeu/Experimental-data-simulation

Brauer, M., & Curtin, J. J. (2018). Linear mixed-effects models and the analysis of nonindependent data: A unified framework to analyze categorical and continuous independent variables that vary within-subjects and/or within-items. *Psychological Methods, 23*(3), 389–411. https://doi.org/10.1037/met0000159  

Clark, H. H. (1973). The language-as-fixed-effect fallacy: A critique of language statistics in psychological research. *Journal of Verbal Learning and Verbal Behavior, 12*(4), 335-359. https://doi.org/10.1016/S0022-5371(73)80014-3  

Luke, S. G. (2017). Evaluating significance in linear mixed-effects models in R. *Behavior Research Methods, 49*(4), 1494–1502. https://doi.org/10.3758/s13428-016-0809-y  

Matuschek, H., Kliegl, R., Vasishth, S., Baayen, H., & Bates, D. (2017). Balancing type 1 error and power in linear mixed models. *Journal of Memory and Language, 94*, 305–315. https://doi.org/10.1016/j.jml. 2017.01.001 

Meteyard, L., & Davies, R. A. (2020). Best practice guidance for linear mixed-effects models in psychological science. *Journal of Memory and Language, 112*, 104092. https://doi.org/10.1016/j.jml.2020.104092  

Schielzeth, H., Dingemanse, N. J., Nakagawa, S., Westneat, D. F., Allegue, H, Teplitsky, C., Reale, D., Dochtermann, N. A., Garamszegi, L. Z., & Araya-Ajoy, Y. G. (2020). Robustness of linear mixed-effects models to violations of distributional assumptions. *Methods in Ecology and Evolution, 00*, 1– 12. https://doi.org/10.1111/2041-210X.13434   

Singmann, H., & Kellen, D. (2019). An Introduction to Mixed Models for Experimental Psychology. In D. H. Spieler & E. Schumacher (Eds.), *New Methods in Cognitive Psychology* (pp. 4–31). Hove, UK: Psychology Press. http://singmann.org/download/publications/singmann_kellen-introduction-mixed-models.pdf 

</div>

<br>
