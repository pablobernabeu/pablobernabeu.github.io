

# Run `scopus_search` as many times as necessary based on the number of results, 
# limited to limit of results per search allowed by my API quota (normally, 20).

library(dplyr)
library(rscopus)

# Note. Before running the current function, the user must read in their Scopus API key 
# confidentially (see https://cran.r-project.org/web/packages/rscopus/vignettes/api_key.html).
# An error will be thrown if there's no Scopus API key registered.

query = 
  paste(
    'TITLE("Secure and scalable speech transcription for local and HPC") OR ',
    'TITLE("Learn OpenAI Whisper: Transform your understanding of GenAI through robust and accurate speech processing solutions") OR ',
    # Titles from https://scholar.google.com/scholar?hl=en&as_sdt=0%2C5&q=whisper+openai+speech+transcription&btnG=
    'TITLE("Leveraging openai whisper model to improve speech recognition for dysarthric individuals") OR ',
    'TITLE("Quantization for OpenAI\'s Whisper Models: A Comparative Analysis") OR ',
    'TITLE("Fine-Tuning OpenAI Whisper and DistilWhisper: An In-Depth Analysis") OR ',
    'TITLE("Moonshine: Speech recognition for live transcription and voice commands") OR ',
    'TITLE("Automated Speech-To-Text Captioning for Videos and Noise Robustness Analysis Using OpenAI Whisper: A Performance and Enhancement Study") OR ',
    'TITLE("Evaluating automatic transcription models utilising cloud platforms") OR ',
    'TITLE("Efficient and accurate transcription in mental health research: A tutorial on using whisper AI for audio file transcription") OR ',
    # Titles from https://scholar.google.com/scholar?start=10&q=whisper+openai+speech+transcription&hl=en&as_sdt=0,5
    'TITLE("What automatic speech recognition can and cannot do for conversational speech transcription") OR ',
    'TITLE("Comparing Speech-to-Text Algorithms for Transcribing Voice Data from Surveys") OR ',
    'TITLE("Transcribing and coding voice answers obtained in web surveys: comparing three leading automatic speech recognition tools and human versus LLM-based coding") OR ',
    'TITLE("Everyday conversations: a comparative study of expert transcriptions and ASR outputs at a lexical level") OR ',
    'TITLE("Transcription of Audio and Video with OpenAI\'s Whisper") OR ',
    'TITLE("Cantonese Dialect Transcription in Diverse Sophisticated Scenarios via the OpenAI Whisper Speech Recognition Model") OR ',
    'TITLE("Speech Recognition and Accessibility in Panopto Videos: A Comparative Analysis of OPENAI\'s Whisper and Traditional Automatic Speech Recognition") OR ',
    'TITLE("AI-Powered Audio Summarization and Ethical Content Analysis Using OpenAI Whisper") OR ',
    # Titles from https://scholar.google.com/scholar?start=20&q=whisper+openai+speech+transcription&hl=en&as_sdt=0,5
    'TITLE("Assessing Whisper automatic speech recognition and WER scoring for elicited imitation: Steps toward automation") OR ',
    'TITLE("Careless whisper: Speech-to-text hallucination harms") OR ',
    'TITLE("Automated transcription of interviews in qualitative research using artificial intelligence: a simple guide") OR ',
    'TITLE("Optimizing speech recognition for medical transcription: fine-tuning whisper and developing a web application") OR ',
    'TITLE("Evaluating AI Speech and Text Technologies to Reduce the Administrative Burden in Occupational Health: An Exploratory Study on Whisper and ChatGPT-4") OR ',
    'TITLE("Maithili Speech Recognition with OpenAI\'s Whisper: A Fine-Tuning Approach") OR ',
    'TITLE("Lyricwhiz: Robust multilingual zero-shot lyrics transcription by whispering to chatgpt") OR ',
    'TITLE("Enhancing Diversity in Inclusive Learning Classroom Using OpenAI Whisper Model") OR ',
    'TITLE("Automatic speech recognition and the transcription of indistinct forensic audio: how do the new generation of systems fare?")'
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
