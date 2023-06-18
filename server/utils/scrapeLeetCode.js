const puppeteer = require('puppeteer');
const db = require('../config/mongoose');
const Problem = require('../models/problem');
const links = require('../../ProblemData/Links/allPlatformsScrapedLinks.json').LeetCode;

async function scrapeLeetCode() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    for(let link of links) {
        try {
            // Start the navigation.
            const navigationPromise = page.waitForNavigation(); // Wait for 10 seconds before navigating to the next link
            try {
                await page.goto(link);
                await page.waitForTimeout(3000); // 3 seconds timeout
            } catch (error) {
                console.error(`Timeout reached on link: ${link}`);
                continue; // Skip this iteration and proceed with the next link
            }
            
            // Wait for navigation to finish.
            await navigationPromise;

            const problemName = await page.$eval('.mr-2.text-label-1.dark\\:text-dark-label-1.text-lg.font-medium', el => el.innerText.split(/(?<=^\d+)\.\s/)[1]);
            console.log('------------------------------------------');
            console.log(`Scraping problem: ${problemName}`);
            const problemStatement = await page.$eval('[data-track-load="qd_description_content"]', el => el.innerText.split('Example 1:')[0]);
            console.log('------------------------------------------');
            console.log(`Scraped problem: ${problemStatement}`);

            // Click on "Related Topics" div and extract all relevant a tags
            // First, find the "Related Topics" div using XPath
            const relatedTopicsDiv = await page.$x("//div[contains(., 'Related Topics')]");
            // If the div was found, click it
            if(relatedTopicsDiv.length > 0) {
                await relatedTopicsDiv[0].click();
            } else {
                throw new Error("Related Topics div not found");
            }
            const tags = await page.$$eval('a[href^="/tag/"]', links => links.map(link => link.innerText));
            console.log('------------------------------------------');
            console.log(tags);

            const difficultyLevel = await page.$eval('.mt-3.flex.space-x-4 > div:first-child', el => el.innerText);
            console.log('Difficulty Level:', difficultyLevel);

                    
            console.log('------------------------------------------');
            console.log(`LeetCode link: ${link}`); // Link is of the form: `https://leetcode.com/problems/${problemName}/description/

            // Create new problem document
            const problem = new Problem({
                name: problemName,
                problemStatement: problemStatement,
                tags: tags,
                difficultyLevel: difficultyLevel,
                source: 'LeetCode',
                link: link
            });

            // Save to database
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

// Connect to MongoDB and run the scraper
db.once('open', async () => {
    try {
        await scrapeLeetCode();
        console.log('LeetCode scraper finished');
    } catch(error) {
        console.error(`Error scraping LeetCode: ${error}`);
    }
    db.close();
});
