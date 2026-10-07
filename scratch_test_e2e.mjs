import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function run() {
  console.log("Launching browser...");
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    console.log("Failed with default chromium, trying msedge channel...");
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Navigating to http://localhost:5173/ ...");
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

  console.log("Checking page title and header...");
  const title = await page.title();
  const heading = await page.textContent('h1');
  console.log(`Page title: "${title}", Heading: "${heading}"`);

  // Locate file input
  const fileInput = await page.locator('input[type="file"]');
  const filePath = path.resolve('backend', 'test.csv');
  console.log(`Setting input file: ${filePath}`);
  await fileInput.setInputFiles(filePath);

  // Verify file badge is shown
  await page.waitForSelector('text=test.csv', { timeout: 5000 });
  console.log("Verified 'test.csv' badge is present!");

  // Enter question in textarea
  const questionText = "What is the total value sum?";
  console.log(`Typing question: "${questionText}"`);
  await page.fill('textarea', questionText);

  // Click Analyze button
  console.log("Clicking Analyze button...");
  await page.click('button:has-text("Analyze")');

  // Wait for loading to finish and result to appear
  console.log("Waiting for analysis result...");
  await page.waitForSelector('text=Result', { timeout: 30000 });
  console.log("Result panel displayed!");

  // Wait a bit for animations
  await page.waitForTimeout(1000);

  // Check the submitted question section
  const questionEl = await page.locator('text=Q:');
  const isQuestionVisible = await questionEl.isVisible();
  console.log(`Question "Q:" label visible: ${isQuestionVisible}`);

  const questionParentText = await questionEl.locator('..').textContent();
  console.log(`Question section text: "${questionParentText}"`);

  // Check the answer section
  const resultText = await page.locator('div[aria-live="polite"]').textContent();
  console.log(`\nFull Result Content:\n-------------------\n${resultText}\n-------------------`);

  // Take screenshot
  const screenshotPath = 'proofanalyst_browser_verification.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved to ${screenshotPath}`);

  await browser.close();
  console.log("Test completed successfully!");
}

run().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
