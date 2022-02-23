const dotenv = require("dotenv");
dotenv.config();
const puppeteer = require("puppeteer");
const nodemailer = require("nodemailer");
const cron = require("node-cron");

// This is where we configure the email
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

// This acts as the default email
var mailOptions = {
  from: process.env.EMAIL,
  to: process.env.EMAIL,
  subject: "Playstation Found",
  text: "That was easy!",
};

// Use this to test that this script works.
// 1. Run the script
// 2. Add the text 'Add to Cart' to your github bio
const testValues = [
  {
    name: "Github",
    url: "https://github.com/kebabgage",
    searchValue: "Add to Cart",
  },
  {
    name: "Amazon Controller (test)",
    url: "https://www.amazon.com.au/DualSense-Wireless-Controller-PlayStation-5/dp/B08H99BPJN/ref=pd_lpo_2?pd_rd_i=B08H99BPJN&psc=1",
    searchValue: "in stock",
  },
];

const scrapeValues = [
  {
    name: "Target",
    url: "https://www.target.com/c/playstation-5-video-games/-/N-hj96d",
    searchValue: null,
    unavailableText: "Consoles will be viewable when inventory is available",
  },
  {
    name: "Amazon",
    url: "https://www.amazon.com.au/PlayStation-5-Console/dp/B08HHV8945?_encoding=UTF8&linkCode=sl1&tag=australiaps5-22&linkId=2819c0dd9b995cf7cbdf5a3d5809c6cc&language=en_AU&ref_=as_li_ss_tl",
    searchValue: "Add to cart",
    unavailableText: "Currently unavailable.",
  },
  {
    name: "Sony",
    url: "https://store.sony.com.au/gaming#prefn1=series&prefv1=PlayStation%205",
    searchValue: "$750",
    unavailableText: null,
  },
  {
    name: "Big W",
    url: "https://www.bigw.com.au/product/playstation-5-console/p/124625",
    searchValue: null,
    unavailableText: "Coming Soon",
  },
  {
    name: "EB Games",
    url: "https://www.ebgames.com.au/product/ps5/267678-playstation-5-console",
    searchValue: null,
    unavailableText: "The page may have been moved or deleted",
  },
];

// The instant one
// cronRunner(scrapeValues);

// Schedule tasks to be run on the server.
cron.schedule("* * * * *", async function () {
  console.log(`[${new Date().toUTCString()}] Restarting cron job`);
  await cronRunner(process.env.TEST === "true" ? testValues : scrapeValues);
});

// This function runs the check on the values in values
async function cronRunner(values) {
  let browser;

  try {
    console.log(`[${new Date().toUTCString()}] Trying to open browser`);
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-setuid-sandbox",
        "--disable-infobars",
        "--disable-features=site-per-process",
        "--window-position=0,0",
        "--disable-extensions",
        '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X   10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0    Safari/537.36"',
      ],
    });

    // Iterate through the values given
    const promises = await Promise.allSettled(
      values.map(async (value) => {
        const { name, url, searchValue, unavailableText } = value;
        console.log(`[${new Date().toUTCString()}] Checking ${name}`);
        const page = await browser.newPage();
        await page.setUserAgent(
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
        );

        await page.goto(url, { waitUntil: "load", timeout: 100000 });

        // Tries to find the text
        let found;
        if (searchValue) {
          found = await page.evaluate((searchValue) => {
            return window.find(searchValue);
          }, searchValue);
        }

        // Tries to find
        let notFound;
        if (unavailableText) {
          notFound = await page.evaluate((unavailableText) => {
            return window.find(unavailableText);
          }, unavailableText);
        }

        if (found === true || notFound === false) {
          console.log(
            `[${new Date().toUTCString()}] FOUND -------------------------- | ${name}`
          );
          var mailOptions = {
            from: process.env.EMAIL,
            to: process.env.EMAIL,
            subject: `Playstation Found at ${name}`,
            text: `Check it out here: ${url}`,
          };

          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(`[${new Date().toUTCString()}] ${error}`);
            } else {
              console.log(
                `[${new Date().toUTCString()}] Email sent. Found at ${name} `
              );
            }
          });
        } else {
          console.log(`[${new Date().toUTCString()}] Not found at ${name}`);
        }

        return 0;
      })
    );
    console.log(`[${new Date().toUTCString()}] Closing browser...`);
    await browser.close();
  } catch (e) {
    console.log(`[${new Date().toUTCString()}] Error with ${url} {${e}}`);
  }
}
