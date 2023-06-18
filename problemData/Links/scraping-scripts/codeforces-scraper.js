const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeData() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    let problemLinks = [];

    let url = 'https://codeforces.com/problemset/';
    await page.goto(url, {waitUntil: 'networkidle0'});

    // read last scraped page number from the file
    let pageNumber = fs.existsSync('codeforcesLastScrapedPage.txt') ? Number(fs.readFileSync('codeforcesLastScrapedPage.txt')) : 1;
    if (pageNumber > 1) {
        url += `page/${pageNumber}`;
        await page.goto(url, {waitUntil: 'networkidle0'});
    }

    while (true) {
        console.log(`Scraping page ${page.url()}`);
        await page.waitForTimeout(2000);

        const links = await page.$$eval('a[href^="/problemset/problem/"]', links =>
            links.map(link => link.href)
        );

        problemLinks = problemLinks.concat(links);
        console.log(`Page scraped`);

        fs.writeFileSync('codeforcesLastScrapedPage.txt', pageNumber.toString());

        // Save the current state of scraped data
        const uniqueLinks = Array.from(new Set(problemLinks));
        const data = {
            'Codeforces': uniqueLinks
        };
        fs.writeFileSync('codeforcesScrapedData.json', JSON.stringify(data, null, 4));
        try {
            const nextButton = await page.$x('//a[contains(@class, "arrow") and contains(text(), "→")]');
            if (nextButton.length > 0) {
                await Promise.all([
                    page.waitForNavigation({ waitUntil: 'networkidle0' }),
                    nextButton[0].click()
                ]);

                await page.waitForTimeout(3000);
            } else {
                throw new Error("No more pages to scrape.");
            }
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
            'Codeforces': uniqueLinks
        };

        fs.writeFile('codeforcesScrapedData.json', JSON.stringify(data, null, 4), (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log('Data saved to scrapedData.json');
            }
        });
    })
    .catch(console.error);