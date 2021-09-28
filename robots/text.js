const algorithmia = require('algorithmia');
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd')

const { IamAuthenticator } = require('ibm-watson/auth')
const watsonApiKey = require('../credentials/watson-nlu.json')

const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');

var nlu = new NaturalLanguageUnderstandingV1({
    authenticator: new IamAuthenticator({ apikey: watsonApiKey.apikey }),
    version: '2018-04-05',
    serviceUrl: watsonApiKey.url
});




async function robot(content) {

    await fetchContentFromWikipedia(content)
    sanitizeContent(content)
    breakContentIntoSentences(content)
    limitMaximumSentences(content)
    await fetchKeywordsofAllSentences(content)

    async function fetchContentFromWikipedia(content) {
        const algorithmiaAuthenticaded = algorithmia(algorithmiaApiKey)
        const wikipediaAlgorithm = algorithmiaAuthenticaded.algo('web/WikipediaParser/0.1.2?timeout=300')
        const wikipediaResponse = await wikipediaAlgorithm.pipe(content.searchTerm)
        const wikipediaContent = wikipediaResponse.get()

        content.sourceContentOriginal = wikipediaContent.content
    }

    function sanitizeContent(content) {
        const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal)
        const withoutDatesInParenteses = removeDatesInParenteses(withoutBlankLinesAndMarkdown)

        content.sourceContentSanitized = withoutDatesInParenteses

        function removeBlankLinesAndMarkdown(text) {
            const allLines = text.split('\n')

            const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
                if (line.trim().length === 0 || line.trim().startsWith('=')) {
                    return false
                }
                return true
            })
            return withoutBlankLinesAndMarkdown.join(' ')
        }

        function removeDatesInParenteses(text) {
            return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g, ' ')
        }

    }
    function breakContentIntoSentences() {
        content.sentences = []

        const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)

        sentences.forEach((sentence) => {
            content.sentences.push({
                text: sentence,
                keywords: [],
                images: []
            })
        })
    }

    function limitMaximumSentences(content) {
        content.sentences = content.sentences.slice(0, content.maximumSentences)
    }

 


    async function fetchWatsonAndReturnKeywords(sentence) {

        return new Promise((resolve, reject) => {
            nlu.analyze({
                html: sentence,
                features: {
                    keywords: {}
                }
            }).then(response => {

                const keywords = response.result.keywords
                //console.log(keywords)
                resolve(keywords)
                
               


            })
                .catch(err => {
                    console.log('error: ', err);
                    reject()
                });
            
        })
    }

       async function fetchKeywordsofAllSentences(content) {
        for (const sentence of content.sentences) {

            //sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text)
            let palavraChaves = await fetchWatsonAndReturnKeywords(sentence.text)
            palavraChaves = palavraChaves.map( (palavraChave) => {return palavraChave.text})
           
            sentence.keywords = palavraChaves
            

        }
    }

}

module.exports = robot