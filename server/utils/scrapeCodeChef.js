let puppeteer = require('puppeteer');
let db = require('../config/mongoose');
let Problem = require('../models/problem');
let links = require('../../ProblemData/Links/allPlatformsScrapedLinks.json').CodeChef;

async function scrapeCodeChef() {
    let browser = await puppeteer.launch({ headless: false });
    let page = await browser.newPage();

    for(let link of links) {
        try {
            // Start the navigation.
            let navigationPromise = page.waitForNavigation();
            try {
                await page.goto(link);
                await page.waitForTimeout(3000); // 30 seconds timeout
            } catch (error) {
                console.error(`Timeout reached on link: ${link}`);
                continue;
            }

            await navigationPromise;

            let problemName = await page.$eval('._titleStatus__container_15tum_839 h1', el => el.innerText);
            console.log('------------------------------------------');
            console.log(`Scraping problem: ${problemName}`);

            let problemStatement = await page.evaluate(() => {
                let elements = Array.from(document.querySelectorAll('h2, p, h3'));
                let problemStartIndex = elements.findIndex(el => el.textContent === 'Problem');
                let problemEndIndex = elements.findIndex(el => el.textContent === 'Input Format');
                return elements.slice(problemStartIndex + 1, problemEndIndex).map(el => el.textContent).join(' ');
            });
            console.log('------------------------------------------');
            console.log(`Scraped problem: ${problemStatement}`);

            let rating = await page.$eval('._difficulty-ratings__box_15tum_632._dark_15tum_110 span:nth-child(2)', el => el.innerText);
            console.log('Difficulty Level:', rating);

            let tags = await page.$$eval('._tagList__item_15tum_668._dark_15tum_110', links => links.map(link => link.innerText));
            console.log('------------------------------------------');
            console.log(tags);

            console.log('------------------------------------------');
            console.log(`CodeChef link: ${link}`);

            let problem = new Problem({
                name: problemName,
                problemStatement: problemStatement,
                tags: tags,
                rating: rating,
                source: 'CodeChef',
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
    await scrapeCodeChef();
    db.close();
});
