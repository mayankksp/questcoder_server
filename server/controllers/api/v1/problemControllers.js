const Problem = require('../../../models/problem');
const openAI = require('../../../utils/openAIService');

function termFrequency(term, words) {
    let count = 0;
    let termWords = term.split(' ');
    for (let i = 0; i < words.length - termWords.length + 1; i++) {
        if (words.slice(i, i + termWords.length).join(' ').toLowerCase() === term.toLowerCase()) {
            count++;
        }
    }
    return count / (words.length - termWords.length + 1);
}

function inverseDocumentFrequency(term, documents) {
    let count = 0;
    let termWords = term.split(' ');
    for (let document of documents) {
        for (let i = 0; i < document.length - termWords.length + 1; i++) {
            if (document.slice(i, i + termWords.length).join(' ').toLowerCase() === term.toLowerCase()) {
                count++;
                break;
            }
        }
    }
    if (count === 0) return 0; // Return 0 if term is not in any document
    return Math.log(documents.length / count);
}

function tfidf(term, document, documents, idf) {
    return termFrequency(term, document) * idf;
}

exports.getAllProblems = async (req, res) => {
    console.log('Getting all problems');
    try {
        const searchTerm = req.query.searchTerm;
        const source = req.query.source;
        const difficulty = req.query.difficulty;

        let query = {};

        if (source) query.source = { $in: source.split(',') };
        if (difficulty) {
            query.difficultyLevel = { $in: difficulty.split(',') };
            if (source === 'Codeforces') {
                delete query.difficultyLevel;
                if (difficulty.includes('Easy')) query.rating = { $lt: 1300 };
                if (difficulty.includes('Medium')) query.rating = { $gte: 1300, $lte: 1600 };
                if (difficulty.includes('Hard')) query.rating = { $gt: 1600 };
            } else if (source === 'CodeChef') {
                delete query.difficultyLevel;
                if (difficulty.includes('Easy')) query.rating = { $lt: 1400 };
                if (difficulty.includes('Medium')) query.rating = { $gte: 1400, $lte: 1800 };
                if (difficulty.includes('Hard')) query.rating = { $gt: 1800 };
            } else if (source === 'LeetCode') {
                delete query.rating;
            }
        }
        

        let problems = await Problem.find(query);
        let documents = problems.map(problem => (problem.name + ' ' + problem.problemStatement + ' ' + problem.tags.join(' ')).split(' '));
        let idf = inverseDocumentFrequency(searchTerm, documents);
        let problemScores = problems.map((problem, i) => ({ problem, score: tfidf(searchTerm, documents[i], documents, idf) }));

        problemScores = problemScores.filter(ps => ps.score > 0);

        problemScores.sort((a, b) => b.score - a.score);
        problems = problemScores.map(ps => ps.problem);
        res.status(200).json({ problems });
    } catch (error) {
        console.error(`Error getting all problems: ${error}`);
        res.status(500).json({ error });
    }
}

exports.getSearchTermInfo = async (req, res) => {
    console.log("Inside getSearchTermInfo");
    console.log(req.query);
    try {
        const searchTerm = req.query.searchTerm;
        await openAI.getSearchTermInfo(searchTerm).then((response) => {
            console.log(response);
            res.status(200).json({ problemInfo: response });
        }
        ).catch((error) => {
            console.log(error);
        }
        );
    } catch (error) {
        console.error(`Error getting all problems: ${error}`);
        res.status(500).json({ error });
    }
}