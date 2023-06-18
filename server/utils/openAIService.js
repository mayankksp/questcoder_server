const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    organization: "org-IVap2zEjl4Iw2d2fzxmV4V9H",
    apiKey: "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",
});
const openai = new OpenAIApi(configuration);

exports.getSemanticSearchResults = async (prompt) => {
    completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "user",
                content: "Search for " + prompt + " in reference to data structures and algorithms. [Output: Correct terminology for " + prompt + "]",
            },
        ],
    })
    return completion.data.choices[0].message;
    console.log((await openai.listModels()).data);
}

exports.getSearchTermInfo = async (prompt) => {
    completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "user",
                content: "Get information about " + prompt + ", in reference to data structures and algorithms. [Output: Information in nearly about in 200 words]",
            },
        ],
    })
    return completion.data.choices[0].message;
    console.log((await openai.listModels()).data);
}