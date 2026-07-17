const puppeteer = require('puppeteer-core');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ 
    headless: 'new',
    executablePath: 'C:\\Users\\dhanu\\.cache\\puppeteer\\chrome\\win64-150.0.7871.24\\chrome-win64\\chrome.exe'
  });
  const page = await browser.newPage();
  
  const testEmail = `e2e_${Date.now()}@example.com`;
  const testPassword = 'SuperSecurePass123!';
  const testName = 'E2E Tester';

  console.log(`Testing Signup with ${testEmail}`);
  try {
    await page.goto('http://localhost:3000/signup', { waitUntil: 'networkidle0' });
    
    // Fill out the signup form
    await page.type('input[name="displayName"]', testName);
    await page.type('input[name="email"]', testEmail);
    await page.type('input[name="password"]', testPassword);
    
    console.log('Submitting signup form...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);
    
    console.log('Navigation complete. Current URL:', page.url());
    
    if (page.url().includes('/dashboard')) {
      console.log('✅ Signup and automatic login successful! Reached dashboard.');
    } else {
      console.error('❌ Signup failed. Did not reach dashboard. URL:', page.url());
      const bodyText = await page.evaluate(() => document.body.innerText);
      console.log('Page content:', bodyText.substring(0, 1000));
    }
    
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await browser.close();
  }
})();
