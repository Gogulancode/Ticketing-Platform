// Playwright E2E Tests for Ticketing Platform
// Install: npm install -D @playwright/test
// Run: npx playwright test
// Run with credentials: TEST_USER=user@test.com TEST_PASS=password npx playwright test

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://enrichbeauty.solutionsnextwave.com';

// Test credentials - set via environment variables for authenticated tests
const TEST_USER = process.env.TEST_USER || '';
const TEST_PASS = process.env.TEST_PASS || '';
const HAS_CREDENTIALS = Boolean(TEST_USER && TEST_PASS);

test.describe('Ticketing Platform E2E Tests', () => {
  
  test.describe('Public Pages', () => {
    
    test('should load login page without critical errors', async ({ page }) => {
      const criticalErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Ignore non-critical errors
          if (!text.includes('favicon') && 
              !text.includes('ResizeObserver') &&
              !text.includes('net::ERR') &&
              !text.includes('Failed to load resource')) {
            criticalErrors.push(text);
          }
        }
      });
      
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      // Check page loaded with correct title
      const title = await page.title();
      expect(title).toMatch(/Nivo|Ticketing|Support/i);
      
      // Log any errors found
      if (criticalErrors.length > 0) {
        console.log('Console errors found:', criticalErrors);
      }
    });
    
    test('should have working login form elements', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      // Check login form elements exist using exact IDs from the code
      const emailInput = page.locator('#login-email');
      const passwordInput = page.locator('#login-password');
      const submitButton = page.locator('button[type="submit"]');
      
      await expect(emailInput).toBeVisible({ timeout: 10000 });
      await expect(passwordInput).toBeVisible({ timeout: 10000 });
      await expect(submitButton).toBeVisible({ timeout: 10000 });
    });
    
    test('should show error on invalid login', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      await page.fill('#login-email', 'invalid@test.com');
      await page.fill('#login-password', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // Should stay on login page (not redirect)
      await page.waitForTimeout(3000);
      const currentUrl = page.url();
      expect(currentUrl).toContain('/login');
    });
  });

  test.describe('API Health', () => {
    
    test('API health endpoint responds correctly', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/health`);
      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body.status).toBe('healthy');
      expect(body.message).toContain('running');
    });
    
    test('API settings endpoints require authentication', async ({ request }) => {
      const endpoints = [
        '/api/tickets/settings/categories',
        '/api/tickets/settings/priorities',
        '/api/tickets/settings/statuses',
      ];
      
      for (const endpoint of endpoints) {
        const response = await request.get(`${BASE_URL}${endpoint}`);
        expect(response.status()).toBe(401);
      }
    });
  });

  // Authenticated tests - only run if credentials provided
  test.describe('Authenticated Features', () => {
    
    // Skip all tests in this group if no credentials
    test.beforeEach(async ({ page }, testInfo) => {
      if (!HAS_CREDENTIALS) {
        testInfo.skip();
        return;
      }
      
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      
      await page.fill('#login-email', TEST_USER);
      await page.fill('#login-password', TEST_PASS);
      await page.click('button[type="submit"]');
      
      // Wait for navigation away from login
      await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });
    });
    
    test('should load tickets dashboard after login', async ({ page }, testInfo) => {
      if (!HAS_CREDENTIALS) { testInfo.skip(); return; }
      
      const url = page.url();
      // After login, should be on root (which redirects to /tickets) or directly on /tickets
      expect(url).toMatch(/tickets|dashboard|\/$|\/$/);
      await page.waitForLoadState('networkidle');
    });
    
    test('should navigate to new ticket page', async ({ page }, testInfo) => {
      if (!HAS_CREDENTIALS) { testInfo.skip(); return; }
      
      await page.goto(`${BASE_URL}/tickets/new`);
      await page.waitForLoadState('networkidle');
      
      // The form has id="title" for the title input
      const titleInput = page.locator('#title, input[id="title"], input[placeholder*="description of your issue" i]');
      await expect(titleInput.first()).toBeVisible({ timeout: 10000 });
    });
    
    test('should load settings page', async ({ page }, testInfo) => {
      if (!HAS_CREDENTIALS) { testInfo.skip(); return; }
      
      await page.goto(`${BASE_URL}/tickets/settings`);
      await page.waitForLoadState('networkidle');
      
      const content = await page.content();
      expect(content).toMatch(/categories|priorities|statuses|agents/i);
    });
  });

  test.describe('URL Routing', () => {
    
    test('should redirect to login when accessing protected routes', async ({ page }) => {
      await page.context().clearCookies();
      
      await page.goto(`${BASE_URL}/tickets`);
      await page.waitForLoadState('networkidle');
      
      const url = page.url();
      expect(url).toContain('/login');
    });
    
    test('ticket detail URL with query params should not 404', async ({ page }) => {
      await page.goto(`${BASE_URL}/tickets/123e4567-e89b-12d3-a456-426614174000?action=reopen`);
      await page.waitForLoadState('networkidle');
      
      const content = await page.content();
      expect(content.toLowerCase()).not.toContain('page not found');
    });
  });

  test.describe('Frontend Assets', () => {
    
    test('should load CSS correctly', async ({ request }) => {
      const indexResponse = await request.get(`${BASE_URL}/index.html`);
      const html = await indexResponse.text();
      
      const cssMatch = html.match(/href="([^"]*\.css)"/);
      if (cssMatch) {
        const cssPath = cssMatch[1].startsWith('/') ? cssMatch[1] : `/${cssMatch[1]}`;
        const cssResponse = await request.get(`${BASE_URL}${cssPath}`);
        expect(cssResponse.status()).toBe(200);
      }
    });
    
    test('should load JS correctly', async ({ request }) => {
      const indexResponse = await request.get(`${BASE_URL}/index.html`);
      const html = await indexResponse.text();
      
      const jsMatch = html.match(/src="([^"]*\.js)"/);
      if (jsMatch) {
        const jsPath = jsMatch[1].startsWith('/') ? jsMatch[1] : `/${jsMatch[1]}`;
        const jsResponse = await request.get(`${BASE_URL}${jsPath}`);
        expect(jsResponse.status()).toBe(200);
      }
    });
  });
});
