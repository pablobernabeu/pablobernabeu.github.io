# A stand-in for the Scopus Search API, used to run scopusflow's harvest
# functions offline against the corpus bundled with the package. It answers the
# package's own HTTP requests (query, date, start, count and cursor parameters)
# from `example_records`, and returns the quota headers a real response carries.
# The device is the one the package's test suite uses
# (tests/testthat/helper-mock.R). The corpus's own query matches every record;
# any other term is matched against the titles.

scopus_stand_in <- function(corpus, quota_limit = 20000L) {
  `%||%` <- function(x, y) if (is.null(x)) y else x
  entry <- function(i) {
    r <- corpus[i, ]
    e <- list(`prism:doi` = r$doi, `dc:title` = r$title, `dc:creator` = r$authors,
              `prism:publicationName` = r$publication, `prism:coverDate` = r$date,
              `citedby-count` = as.character(r$citations))
    e[!vapply(e, function(v) length(v) != 1L || is.na(v), logical(1))]
  }
  match_term <- function(term) {
    term <- trimws(term)
    term <- sub("^\\((.*)\\)$", "\\1", term)
    term <- sub("^[A-Z][A-Z-]*\\((.*)\\)$", "\\1", term)
    if (tolower(term) == "graphene supercapacitor") return(rep(TRUE, nrow(corpus)))
    grepl(tolower(term), tolower(corpus$title), fixed = TRUE)
  }
  state <- new.env(parent = emptyenv())
  state$requests <- 0L
  handler <- function(req) {
    state$requests <- state$requests + 1L
    q <- httr2::url_parse(req$url)$query
    parts <- strsplit(q$query, " AND ", fixed = TRUE)[[1]]
    keep <- Reduce(`&`, lapply(parts, match_term))
    if (!is.null(q$date)) {
      yrs <- as.integer(regmatches(q$date, gregexpr("[0-9]{4}", q$date))[[1]])
      keep <- keep & corpus$year %in% seq(min(yrs), max(yrs))
    }
    idx <- which(keep)
    total <- length(idx)
    count <- as.integer(q$count %||% "25")
    offset <- if (!is.null(q$cursor)) {
      if (identical(q$cursor, "*")) 0L else as.integer(q$cursor)
    } else {
      as.integer(q$start %||% "0")
    }
    n <- max(0L, min(count, total - offset))
    entries <- if (n > 0L) lapply(idx[offset + seq_len(n)], entry) else
      list(list(error = "Result set was empty"))
    results <- list(`opensearch:totalResults` = as.character(total), entry = entries)
    if (!is.null(q$cursor) && offset + n < total) {
      results$cursor <- list(`@next` = as.character(offset + n))
    }
    httr2::response(
      status_code = 200L,
      headers = list(
        `Content-Type` = "application/json",
        `X-RateLimit-Limit` = as.character(quota_limit),
        `X-RateLimit-Remaining` = as.character(quota_limit - state$requests),
        # A fixed reset time, so that the page does not change between renders.
        `X-RateLimit-Reset` = "1788000000"
      ),
      body = charToRaw(jsonlite::toJSON(list(`search-results` = results),
                                        auto_unbox = TRUE))
    )
  }
  list(handler = handler, state = state)
}
