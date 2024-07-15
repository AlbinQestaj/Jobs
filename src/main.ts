export enum Delays {
  Short = 500,
  Medium = 2000,
  Long = 5000,
}

function delayedHello(
  name: string,
  delay: number = Delays.Medium,
): Promise<string> {
  return new Promise((resolve: (value?: string) => void) =>
    setTimeout(() => resolve(`Hello, ${name}`), delay),
  );
}
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export async function greeter(name: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  // The name parameter should be of type string. Any is used only to trigger the rule.
  return await delayedHello(name, Delays.Long);
}

// src/index.ts
import puppeteer from 'puppeteer';
import cheerio from 'cheerio';
import mongoose from 'mongoose';
import Job from './jobs.model.js';

mongoose
  .connect('mongodb://localhost:27017/jobApplications')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB', err);
  });

const scrapeLinkedIn = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://www.linkedin.com/login');

  // Log in to LinkedIn
  await page.type('#username', 'your_email');
  await page.type('#password', 'your_password');
  await page.click('.btn__primary--large');

  await page.waitForNavigation();

  // Navigate to job listings
  await page.goto('https://www.linkedin.com/jobs');
  await page.waitForSelector('.job-result-card');

  // Get job links
  const jobLinks = await page.$$eval('.job-result-card__title a', (links) =>
    links.map((link) => link.href),
  );

  for (const link of jobLinks) {
    await page.goto(link);
    await page.waitForSelector('.jobs-apply-button');

    const content = await page.content();
    const $ = cheerio.load(content);

    const title = $('h1').text().trim();
    const company = $('.topcard__org-name-link').text().trim();
    const location = $('.topcard__flavor--bullet').text().trim();

    const jobData = {
      title,
      company,
      location,
      url: link,
    };

    const job = new Job(jobData);
    await job.save();
  }

  await browser.close();
};

scrapeLinkedIn()
  .then(() => {
    console.log('Scraping completed');
    mongoose.connection.close();
  })
  .catch((err) => {
    console.error('Error during scraping', err);
    mongoose.connection.close();
  });
