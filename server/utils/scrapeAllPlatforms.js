// Path: server/utils/scrapeAllPlatforms.js
const puppeteer = require('puppeteer');
const db = require('../config/mongoose');
const Problem = require('../models/problem');
const linksLeetCode = require('../../ProblemData/Links/allPlatformsScrapedLinks.json').LeetCode;
const linksCodeforces = require('../../ProblemData/Links/allPlatformsScrapedLinks.json').Codeforces;
const linksCodeChef = require('../../ProblemData/Links/allPlatformsScrapedLinks.json').CodeChef;
const fs = require('fs');

let failedUrls = {
    "LeetCode": [],
    "Codeforces": [],
    "CodeChef": []
};

async function scrapeLeetCode(page) {
    for(let link of linksLeetCode) {
        try {
            const navigationPromise = page.waitForNavigation();
            try {
                await page.goto(link);
                await page.waitForTimeout(5000);
            } catch (error) {
                console.error(`Timeout reached on link: ${link}`);
                continue;
            }
            await navigationPromise;
            const problemName = await page.$eval('.mr-2.text-label-1.dark\\:text-dark-label-1.text-lg.font-medium', el => el.innerText.split(/(?<=^\d+)\.\s/)[1]);
            const problemStatement = await page.$eval('[data-track-load="qd_description_content"]', el => el.innerText.split('Example 1:')[0]);
            const relatedTopicsDiv = await page.$x("//div[contains(., 'Related Topics')]");
            if(relatedTopicsDiv.length > 0) {
                await relatedTopicsDiv[0].click();
            } else {
                throw new Error("Related Topics div not found");
            }
            const tags = await page.$$eval('a[href^="/tag/"]', links => links.map(link => link.innerText));
            const difficultyLevel = await page.$eval('.mt-3.flex.space-x-4 > div:first-child', el => el.innerText);
            const problem = new Problem({
                name: problemName,
                problemStatement: problemStatement,
                tags: tags,
                difficultyLevel: difficultyLevel,
                source: 'LeetCode',
                link: link
            });
            try {
                console.log(`Saving problem: ${problemName}`);
                console.log('------------------------------------------');
                console.log(`Scraped problem: ${problemStatement}`);
                console.log('------------------------------------------');
                console.log(tags);
                console.log('Difficulty Level:', difficultyLevel);
                console.log('------------------------------------------');
                console.log(`LeetCode link: ${link}`);
                console.log('------------------------------------------');
                await problem.save();
                console.log(`Saved problem: ${problemName}`);
            }
            catch(error) {
                console.error(`Error saving problem: ${problemName}\n${error}`);
            }
        } catch(error) {
            console.error(`Error on link: ${link}\n${error}`);
            failedUrls["LeetCode"].push(link); 
        }
    }
}

async function scrapeCodeforces(page) {
    for(let link of linksCodeforces) {
        try {
            let navigationPromise = page.waitForNavigation();
            try {
                await page.goto(link);
                await page.waitForTimeout(5000);
            } catch (error) {
                console.error(`Timeout reached on link: ${link}`);
                continue;
            }
            await navigationPromise;
            let problemName = await page.$eval('.title', el => el.innerText.split(/(?<=^\w+)\.\s/)[1]);
            let problemStatement = await page.$eval('.problem-statement > div:nth-child(2)', el => el.innerText.split('For example')[0]);
            let tagElements = await page.$$eval('.tag-box', el => el.map(e => e.innerText));
            let tags = [], rating = '';
            tagElements.forEach(tagElement => {
                if(tagElement.startsWith('*')) {
                    rating = tagElement.slice(1);
                } else {
                    tags.push(tagElement);
                }
            });
            let problem = new Problem({
                name: problemName,
                problemStatement: problemStatement,
                tags: tags,
                rating: rating,
                source: 'Codeforces',
                link: link
            });
            try {
                console.log(`Saving problem: ${problemName}`);
                console.log('------------------------------------------');
                console.log(`Scraped problem: ${problemStatement}`);
                console.log('------------------------------------------');
                console.log(tags);
                console.log('Rating:', rating);
                console.log('------------------------------------------');
                console.log(`Codeforces link: ${link}`);
                console.log('------------------------------------------');
                await problem.save();
                console.log(`Saved problem: ${problemName}`);
            }
            catch(error) {
                console.error(`Error saving problem: ${problemName}\n${error}`);
            }
        } catch(error) {
            console.error(`Error on link: ${link}\n${error}`);
            failedUrls["Codeforces"].push(link); 
        }
    }
}

async function scrapeCodeChef(page) {
    for(let link of linksCodeChef) {
        try {
            let navigationPromise = page.waitForNavigation();
            try {
                await page.goto(link);
                await page.waitForTimeout(5000);
            } catch (error) {
                console.error(`Timeout reached on link: ${link}`);
                continue;
            }
            await navigationPromise;
            let problemName = await page.$eval('._titleStatus__container_15tum_839 h1', el => el.innerText);
            let problemStatement = await page.evaluate(() => {
                let elements = Array.from(document.querySelectorAll('h2, p, h3'));
                let problemStartIndex = elements.findIndex(el => el.textContent === 'Problem');
                let problemEndIndex = elements.findIndex(el => el.textContent === 'Input Format');
                return elements.slice(problemStartIndex + 1, problemEndIndex).map(el => el.textContent).join(' ');
            });
            let rating = await page.$eval('._difficulty-ratings__box_15tum_632._dark_15tum_110 span:nth-child(2)', el => el.innerText);
            let tags = await page.$$eval('._tagList__item_15tum_668._dark_15tum_110', links => links.map(link => link.innerText));
            let problem = new Problem({
                name: problemName,
                problemStatement: problemStatement,
                tags: tags,
                rating: rating,
                source: 'CodeChef',
                link: link
            });
            try {
                console.log(`Saving problem: ${problemName}`);
                console.log('------------------------------------------');
                console.log(`Scraped problem: ${problemStatement}`);
                console.log('------------------------------------------');
                console.log(tags);
                console.log('Rating:', rating);
                console.log('------------------------------------------');
                console.log(`CodeChef link: ${link}`);
                console.log('------------------------------------------');
                await problem.save();
                console.log(`Saved problem: ${problemName}`);
            }
            catch(error) {
                console.error(`Error saving problem: ${problemName}\n${error}`);
            }
        } catch(error) {
            console.error(`Error on link: ${link}\n${error}`);
            failedUrls["CodeChef"].push(link); 
        }
    }
}

db.once('open', async () => {
    try {
        const browser = await puppeteer.launch({ headless: false});
        const page = await browser.newPage();

        console.log('Starting LeetCode scraper');
        await scrapeLeetCode(page);
        console.log('LeetCode scraper finished');

        console.log('Starting Codeforces scraper');
        await scrapeCodeforces(page);
        console.log('Codeforces scraper finished');

        console.log('Starting CodeChef scraper');
        await scrapeCodeChef(page);
        console.log('CodeChef scraper finished');

        await browser.close();
    } catch(error) {
        console.error(`Error scraping: ${error}`);
    }

    fs.writeFile("failedUrls.json", JSON.stringify(failedUrls), err => {
        if (err) {
            console.error(`Error writing failedUrls to file: ${err}`);
        } else {
            console.log("Wrote failedUrls to file successfully.");
        }
    });

    db.close();
});
