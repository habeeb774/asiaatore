import { test, expect } from '@playwright/test';

test.describe('Purchase Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
  });

  test('complete purchase journey: login → add to cart → checkout', async ({ page }) => {
    // Step 1: Login
    await page.click('[data-testid="login-button"]'); // Assuming there's a login button
    await page.fill('[data-testid="login-email"]', 'user@example.com');
    await page.fill('[data-testid="login-password"]', 'password123');
    await page.click('[data-testid="login-submit"]');
    
    // Verify login was successful
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-count"]')).toBeVisible();

    // Step 2: Add product to cart
    // Navigate to products page or find products on home page
    await page.click('[data-testid="products-link"]');
    
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]');
    
    // Add first product to cart
    await page.click('[data-testid="product-card"]:first-child [data-testid="add-to-cart"]');
    
    // Verify product was added to cart
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
    await expect(page.locator('[data-testid="add-to-cart-success"]')).toBeVisible();

    // Step 3: Go to cart
    await page.click('[data-testid="cart-button"]');
    
    // Verify cart page loads with product
    await expect(page.locator('[data-testid="cart-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
    
    // Verify product details in cart
    await expect(page.locator('[data-testid="cart-item-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-item-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-item-quantity"]')).toBeVisible();
    await expect(page.locator("[data-testid='cart-total']")).toBeVisible();

    // Step 4: Start checkout process
    await page.click('[data-testid="checkout-button"]');
    
    // Verify checkout page loads
    await expect(page.locator('[data-testid="checkout-page"]')).toBeVisible();
    
    // Fill checkout form (if not pre-filled)
    await page.fill('[data-testid="checkout-name"]', 'Test User');
    await page.fill('[data-testid="checkout-phone"]', '+966501234567');
    await page.fill('[data-testid="checkout-address"]', 'Test Address, Riyadh, Saudi Arabia');
    
    // Select payment method
    await page.click('[data-testid="payment-method-bank"]');
    
    // Place order
    await page.click('[data-testid="place-order-button"]');
    
    // Verify order confirmation
    await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-success-message"]')).toContainText('تم استلام طلبك');
  });

  test('guest purchase journey: add to cart → checkout → register', async ({ page }) => {
    // Step 1: Add product to cart without login
    await page.click('[data-testid="products-link"]');
    await page.waitForSelector('[data-testid="product-card"]');
    await page.click('[data-testid="product-card"]:first-child [data-testid="add-to-cart"]');
    
    // Verify cart shows item
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
    
    // Step 2: Go to cart and checkout
    await page.click('[data-testid="cart-button"]');
    await expect(page.locator('[data-testid="cart-page"]')).toBeVisible();
    await page.click('[data-testid="checkout-button"]');
    
    // Step 3: Should prompt for login/registration
    await expect(page.locator('[data-testid="auth-required"]')).toBeVisible();
    
    // Step 4: Register as new user
    await page.click('[data-testid="register-tab"]');
    await page.fill('[data-testid="register-name"]', 'New User');
    await page.fill('[data-testid="register-email"]', 'newuser@example.com');
    await page.fill('[data-testid="register-phone"]', '+966501234568');
    await page.fill('[data-testid="register-password"]', 'password123');
    await page.click('[data-testid="register-submit"]');
    
    // Verify registration and continue checkout
    await expect(page.locator('[data-testid="checkout-page"]')).toBeVisible();
    
    // Complete checkout process
    await page.fill('[data-testid="checkout-name"]', 'New User');
    await page.fill('[data-testid="checkout-phone"]', '+966501234568');
    await page.fill('[data-testid="checkout-address"]', 'New Address, Riyadh, Saudi Arabia');
    await page.click('[data-testid="payment-method-bank"]');
    await page.click('[data-testid="place-order-button"]');
    
    // Verify order confirmation
    await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible();
  });

  test('cart quantity update and remove items', async ({ page }) => {
    // Login first
    await page.click('[data-testid="login-button"]');
    await page.fill('[data-testid="login-email"]', 'user@example.com');
    await page.fill('[data-testid="login-password"]', 'password123');
    await page.click('[data-testid="login-submit"]');
    
    // Add multiple products
    await page.click('[data-testid="products-link"]');
    await page.waitForSelector('[data-testid="product-card"]');
    
    // Add first product
    await page.click('[data-testid="product-card"]:nth-child(1) [data-testid="add-to-cart"]');
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
    
    // Add second product
    await page.click('[data-testid="product-card"]:nth-child(2) [data-testid="add-to-cart"]');
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('2');
    
    // Go to cart
    await page.click('[data-testid="cart-button"]');
    
    // Update quantity of first item
    await page.fill('[data-testid="cart-item-quantity"]:first-child', '3');
    await page.click('[data-testid="update-quantity"]:first-child');
    
    // Verify total updated
    await expect(page.locator('[data-testid="cart-total"]')).toBeVisible();
    
    // Remove an item
    await page.click('[data-testid="remove-item"]:first-child');
    
    // Verify cart updated
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
  });
});
