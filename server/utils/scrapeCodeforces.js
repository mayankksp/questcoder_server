let puppeteer = require('puppeteer');
let db = require('../config/mongoose');
let Problem = require('../models/problem');
let links = require('../../ProblemData/Links/allPlatformsScrapedLinks.json').Codeforces;

async function scrapeCodeforces() {
    let browser = await puppeteer.launch({ headless: false });
    let page = await browser.newPage();

    for(let link of links) {
        try {
            // Start the navigation.
            let navigationPromise = page.waitForNavigation();
            try {
                await page.goto(link);
                await page.waitForTimeout(3000); // 3 seconds timeout
            } catch (error) {
                console.error(`Timeout reached on link: ${link}`);
                continue; 
            }
            
            await navigationPromise;

            let problemName = await page.$eval('.title', el => el.innerText.split(/(?<=^\w+)\.\s/)[1]);
            console.log('------------------------------------------');
            console.log(`Scraping problem: ${problemName}`);
            let problemStatement = await page.$eval('.problem-statement > div:nth-child(2)', el => el.innerText.split('For example')[0]);
            console.log('------------------------------------------');
            console.log(`Scraped problem: ${problemStatement}`);

            // Extract tags and difficulty rating
            let tagElements = await page.$$eval('.tag-box', el => el.map(e => e.innerText));
            let tags = [], rating = '';
            tagElements.forEach(tagElement => {
                if(tagElement.startsWith('*')) {
                    rating = tagElement.slice(1);
                } else {
                    tags.push(tagElement);
                }
            });
            console.log('------------------------------------------');
            console.log(tags);
            console.log('Difficulty Level:', rating);

            console.log('------------------------------------------');
            console.log(`Codeforces link: ${link}`);

            let problem = new Problem({
                name: problemName,
                problemStatement: problemStatement,
                tags: tags,
                rating: rating,
                source: 'Codeforces',
                link: link
            });

            try {
                await problem.save();
                console.log(`Saved problem: ${problemName}`);
            }
            catch(error) {
                console.error(`Error saving problem: ${problemName}\n${error}`);
            }
        } catch(error) {
            console.error(`Error on link: ${link}\n${error}`);
        }
    }

    await browser.close();
}

db.once('open', async () => {
    await scrapeCodeforces();
    db.close();
});