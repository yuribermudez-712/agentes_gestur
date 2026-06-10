import puppeteer from 'puppeteer';

async function getPageTitle(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 30000, //
    });

    // once the selector is available, extract the data
    const productName = await page.evaluate(() => {
      console.log("First product name:", "asdas");

      var hoteles = document.querySelectorAll("app-alojamiento");
      console.info("Mamam" + hoteles.length);
      var g = "";
      for (let index = 0; index < hoteles.length; index++) {
        fruitsArray = hoteles[index].querySelector('a.action-aloj[href]').split("/");
        g += fruitsArray[3];

      }

      return g;
    });
    console.log("First product name:", productName);
    await page.screenshot({
      path: './h1.png',
    });



  } catch (error) {
    console.error(`Error getting page title: ${error}`);
    return null;
  } finally {
    await browser.close();
  }
}

// Example usage:
getPageTitle('https://buskaia.com/#/site/nuevo');