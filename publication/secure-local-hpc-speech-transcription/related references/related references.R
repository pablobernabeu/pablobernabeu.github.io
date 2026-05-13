

# Run `scopus_search` as many times as necessary based on the number of results, 
# limited to limit of results per search allowed by my API quota (normally, 20).

library(dplyr)
library(rscopus)

# Note. Before running the current function, the user must read in their Scopus API key 
# confidentially (see https://cran.r-project.org/web/packages/rscopus/vignettes/api_key.html).
# An error will be thrown if there's no Scopus API key registered.

query = 
  paste(
    '"Secure and scalable speech transcription for local and HPC" OR ',
    # Titles from https://scholar.google.com/scholar?hl=en&as_sdt=0%2C5&q=whisper+openai+speech+transcription&btnG=
    '"Leveraging openai whisper model to improve speech recognition for dysarthric individuals" OR ',
    '"Quantization for OpenAI Whisper Models: A Comparative Analysis" OR ',
    '"Fine-Tuning OpenAI Whisper and DistilWhisper: An In-Depth Analysis" OR ',
    '"Moonshine: Speech recognition for live transcription and voice commands" OR ',
    '"Evaluating automatic transcription models utilising cloud platforms" OR ',
    # Titles from https://scholar.google.com/scholar?start=10&q=whisper+openai+speech+transcription&hl=en&as_sdt=0,5
    '"What automatic speech recognition can and cannot do for conversational speech transcription" OR ',
    '"Comparing Speech-to-Text Algorithms for Transcribing Voice Data from Surveys" OR ',
    '"Everyday conversations: a comparative study of expert transcriptions and ASR outputs at a lexical level" OR ',
    '"Transcription of Audio and Video with OpenAI Whisper" OR ',
    '"AI-Powered Audio Summarization and Ethical Content Analysis Using OpenAI Whisper" OR ',
    # Titles from https://scholar.google.com/scholar?start=20&q=whisper+openai+speech+transcription&hl=en&as_sdt=0,5
    '"Assessing Whisper automatic speech recognition and WER scoring for elicited imitation" OR ',
    '"Careless whisper: Speech-to-text hallucination harms" OR ',
    '"Automated transcription of interviews in qualitative research using artificial intelligence" OR ',
    '"Optimizing speech recognition for medical transcription: fine-tuning whisper" OR ',
    '"Efficient and accurate transcription in mental health research" OR ',
    '"Automatic speech recognition and the transcription of indistinct forensic audio: how do the new generation of systems fare?" OR ',
    # Titles from https://scholar.google.com/scholar?start=30&q=whisper+openai+speech+transcription&hl=en&as_sdt=0,5
    '"Spoken language analysis in aging research: The validity of AI-generated speech to text using OpenAI\'s Whisper" OR ',
    # Titles from https://scholar.google.com/scholar?start=40&q=whisper+openai+speech+transcription&hl=en&as_sdt=0,5
    '"Performance Evaluation of Whisper-Series Speech Transcription Models on Raspberry Pi"'
  )

search_period = '2020-2026'

# Read in 'scopus_search_plus' function
source('https://raw.githubusercontent.com/pablobernabeu/rscopus_plus/main/scopus_search_plus.R')

results = scopus_search_plus(query, search_period, 20)

# List and save DOIs, which can then be copied and pasted into a reference manager, 
# such as Zotero, to create the list of references.

DOIs = results[complete.cases(results$doi), 'doi']

cat(DOIs, sep = '\n')

write.csv(DOIs, 'content/publication/secure-local-HPC-speech-transcription/related references/related references.csv', row.names = FALSE)
