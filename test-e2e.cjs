const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const testEmail = `e2e_${Date.now()}@example.com`;
  const testPassword = 'SuperSecurePass123!';
  const testName = 'E2E Tester';

  console.log(`Testing Signup with ${testEmail}`);
  try {
    await page.goto('http://localhost:3001/signup', { waitUntil: 'networkidle0' });
    
    // Fill out the signup form
    await page.type('input[name="displayName"]', testName);
    await page.type('input[name="email"]', testEmail);
    await page.type('input[name="password"]', testPassword);
    
    // Submit the form
    console.log('Submitting signup form...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);
    
    console.log('Navigation complete. Current URL:', page.url());
    
    if (page.url().includes('/dashboard')) {
      console.log('✅ Signup and automatic login successful! Reached dashboard.');
      
      // Test logout
      console.log('Testing logout...');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click('button:has-text("Sign Out")').catch(() => page.evaluate(() => {
          // Fallback if selector fails: find button by text content
          const btns = Array.from(document.querySelectorAll('button'));
          const logoutBtn = btns.find(b => b.textContent.includes('Sign Out'));
          if (logoutBtn) logoutBtn.click();
        }))
      ]);
      console.log('Logged out. Current URL:', page.url());
      
      // Test Login
      console.log('Testing login...');
      await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle0' });
      await page.type('input[name="email"]', testEmail);
      await page.type('input[name="password"]', testPassword);
      
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click('button[type="submit"]')
      ]);
      console.log('Login complete. Current URL:', page.url());
      
      if (page.url().includes('/dashboard')) {
        console.log('✅ Login successful!');
      } else {
        console.error('❌ Login failed. URL:', page.url());
        const bodyText = await page.evaluate(() => document.body.innerText);
        console.log('Page content:', bodyText.substring(0, 500));
      }

    } else {
      console.error('❌ Signup failed. Did not reach dashboard. URL:', page.url());
      // Get the error message from the page
      const bodyText = await page.evaluate(() => document.body.innerText);
      console.log('Page content (first 500 chars):', bodyText.substring(0, 500));
    }
    
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await browser.close();
  }
})();
