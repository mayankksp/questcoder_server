const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeData() {
    const browser = await puppeteer.launch({headless:false});
    const page = await browser.newPage();

    // Read previously scraped problem links, if any
    let problemLinks = fs.existsSync('codechefScrapedData.json') ? JSON.parse(fs.readFileSync('codechefScrapedData.json')).codechef : [];

    let url = 'https://www.codechef.com/practice';
    await page.goto(url, {waitUntil: 'networkidle0'});

    // Read last scraped page number from the file
    let pageNumber = fs.existsSync('codechefLastScrapedPage.txt') ? Number(fs.readFileSync('codechefLastScrapedPage.txt')) : 1;
    if (pageNumber > 1) {
        url += `page/${pageNumber}`;
        await page.goto(url, {waitUntil: 'networkidle0'});
    }

    while (true) {
        console.log(`Scraping page ${page.url()}`);
        await page.waitForTimeout(2000);

        // Scrape problem names and construct the problem URLs
        const problemNames = await page.$$eval('tbody.MuiTableBody-root tr td[data-colindex="0"]', tds =>
            tds.map(td => td.innerText)
        );

        const links = problemNames.map(problemName => `https://www.codechef.com/problems/${problemName}`);

        problemLinks = problemLinks.concat(links);
        console.log(`Page scraped`);

        fs.writeFileSync('codechefLastScrapedPage.txt', pageNumber.toString());

        // Save the current state of scraped data
        const uniqueLinks = Array.from(new Set(problemLinks));
        const data = {
            'codechef': uniqueLinks
        };
        fs.writeFileSync('codechefScrapedData.json', JSON.stringify(data, null, 4));
        
        try {
            await page.waitForTimeout(1000);
            await page.waitForSelector('._next-pagination__item_ehs9q_89:not([disabled])', { timeout: 5000 });
            await Promise.all([
                page.click('._next-pagination__item_ehs9q_89:not([disabled])')
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
            'codechef': uniqueLinks
        };

        fs.writeFile('codechefScrapedData.json', JSON.stringify(data, null, 4), (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log('Data saved to codechefScrapedData.json');
            }
        });
    })
    .catch(console.error);
