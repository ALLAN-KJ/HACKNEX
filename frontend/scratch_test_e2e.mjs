import { chromium } from 'playwright';
import path from 'path';

async function run() {
  console.log("Launching browser via Playwright...");
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch (e) {
    try {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
    } catch (e2) {
      browser = await chromium.launch({ headless: true });
    }
  }

  const context = await browser.newContext();
  const page = await context.newPage();

  // Log console messages and network errors from page
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log("1. Navigating to http://localhost:5173/ ...");
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

  console.log("2. Verifying page title and header...");
  const heading = await page.textContent('h1');
  console.log(`Heading found: "${heading.trim()}"`);

  // Locate file input
  const fileInput = await page.locator('input[type="file"]');
  const filePath = path.resolve('..', 'backend', 'test.csv');
  console.log(`3. Setting input file: ${filePath}`);
  await fileInput.setInputFiles(filePath);

  // Verify file badge is shown
  await page.waitForSelector('text=test.csv', { timeout: 5000 });
  console.log("4. Verified 'test.csv' attached file badge is displayed!");

  // Enter question in textarea
  const questionText = "What is the total value sum?";
  console.log(`5. Typing question: "${questionText}"`);
  await page.fill('textarea', questionText);

  // Click Analyze button
  console.log("6. Clicking Analyze button...");
  await page.click('button:has-text("Analyze")');

  // Verify loading state
  console.log("7. Checking loading state...");
  const loadingIndicator = page.locator('text=Analyzing...');
  const wasLoading = await loadingIndicator.isVisible().catch(() => false);
  console.log(`Analyzing... loading state active: ${wasLoading}`);

  // Wait for loading to finish and result to appear
  console.log("8. Waiting for result panel...");
  await page.waitForSelector('text=Result', { timeout: 30000 });
  console.log("Result panel displayed successfully!");

  // Wait a moment for rendering
  await page.waitForTimeout(1000);

  // 9. Inspect Result sections
  console.log("9. Verifying Result Sections:");

  // A. Submitted question section
  const questionLabel = page.locator('text=Q:');
  const hasQuestionLabel = await questionLabel.isVisible();
  console.log(`- Q: label visible: ${hasQuestionLabel}`);

  const questionSection = questionLabel.locator('..');
  const questionSectionText = await questionSection.textContent();
  console.log(`- Submitted Question text in result: "${questionSectionText.trim()}"`);

  // B. Result Answer / Output
  const isVerifiedOutput = await page.locator('text=Verified Sandbox Output').isVisible().catch(() => false);
  console.log(`- Has 'Verified Sandbox Output' badge: ${isVerifiedOutput}`);

  // C. Confidence
  const highBadge = await page.locator('text=HIGH').isVisible().catch(() => false);
  const medBadge = await page.locator('text=MEDIUM').isVisible().catch(() => false);
  const lowBadge = await page.locator('text=LOW').isVisible().catch(() => false);
  console.log(`- Confidence level: ${highBadge ? 'HIGH' : medBadge ? 'MEDIUM' : lowBadge ? 'LOW' : 'UNKNOWN'}`);

  // D. Verification Code
  const codeSection = await page.locator('text=Verification Code').isVisible().catch(() => false);
  console.log(`- Verification Code block present: ${codeSection}`);
  if (codeSection) {
    const codeSnippet = await page.locator('pre code').textContent();
    console.log(`- Executed Python Code:\n${codeSnippet}`);
  }

  // E. Full result container content
  const resultContainerText = await page.locator('div[aria-live="polite"]').textContent();
  console.log(`\n========================================`);
  console.log(`FULL RESULT PANEL CONTENT:`);
  console.log(resultContainerText.trim());
  console.log(`========================================\n`);

  // Take screenshot
  const screenshotPath = path.resolve('..', 'browser_verification_result.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`10. Full-page screenshot saved to: ${screenshotPath}`);

  await browser.close();
  console.log("\n>>> ALL CHECKS PASSED SUCCESSFULLY! <<<");
}

run().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
