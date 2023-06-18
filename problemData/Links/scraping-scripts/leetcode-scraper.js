const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeData() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    let problemLinks = fs.existsSync('leetcodeScrapedData.json') ? JSON.parse(fs.readFileSync('leetcodeScrapedData.json')).LeetCode : [];

    let url = 'https://leetcode.com/problemset/all/';
    await page.goto(url, {waitUntil: 'networkidle0'});

    // read last scraped page number from the file
    let pageNumber = fs.existsSync('leetcodeLastScrapedPage.txt') ? Number(fs.readFileSync('leetcodeLastScrapedPage.txt')) : 1;
    if (pageNumber > 1) {
        url += `page/${pageNumber}`;
        await page.goto(url, {waitUntil: 'networkidle0'});
    }

    while (true) {
        console.log(`Scraping page ${page.url()}`);
        await page.waitForTimeout(2000);

        const links = await page.$$eval('a[href^="/problems/"]', links =>
            links.map(link => link.href).filter(href => !href.endsWith('/solution'))
        );

        problemLinks = problemLinks.concat(links);
        console.log(`Page scraped`);

        fs.writeFileSync('leetcodeLastScrapedPage.txt', pageNumber.toString());

        // Save the current state of scraped data
        const uniqueLinks = Array.from(new Set(problemLinks));
        const data = {
            'LeetCode': uniqueLinks
        };
        fs.writeFileSync('leetcodeScrapedData.json', JSON.stringify(data, null, 4));
        try {
            await page.waitForSelector('[aria-label="next"]:not([disabled])', { timeout: 5000 });
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle0' }),
                page.click('[aria-label="next"]:not([disabled])')
            ]);

            await page.waitForTimeout(3000);
        } catch (error) {
            console.log('Error: ' + error);
            break;
        }
        pageNumber++;
    }

    await browser.close();
    return problemLinks;
}

scrapeData()
    .then(links => {
        const uniqueLinks = Array.from(new Set(links));
        const data = {
            'LeetCode': uniqueLinks
        };

        fs.writeFile('leetcodeScrapedData.json', JSON.stringify(data, null, 4), (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log('Data saved to leetcodeScrapedData.json');
            }
        });
    })
    .catch(console.error);