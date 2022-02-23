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
];

// Schedule tasks to be run on the server.
cron.schedule("* * * * *", async function () {
  console.log("Running the checker");
  await cronRunner(scrapeValues);
});

// This function runs the check on the values in values
async function cronRunner(values) {
  let browser;

  //   try {
  browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-infobars",
      "--disable-features=site-per-process",
      "--window-position=0,0",
      "--disable-extensions",
      '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X   10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0    Safari/537.36"',
    ],
  });

  // Iterate through the values given
  values.forEach(async (value) => {
    const { name, url, searchValue, unavailableText } = value;
    console.log("------------------");
    console.log(`[${new Date().toUTCString()}] Checking ${name}`);
    const page = await browser.newPage();
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
  });
  //   } catch (e) {
  //     console.log(`[${Date.now()}] Error with ${url}`);
  //   }
}
