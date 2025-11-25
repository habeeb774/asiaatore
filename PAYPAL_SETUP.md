# PayPal Integration Setup Guide

## 1. Environment Variables

### Server (`.env`)
Add your PayPal credentials to the root `.env` file:

```dotenv
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_SECRET=your_sandbox_secret
PAYPAL_API=https://api-m.sandbox.paypal.com
# For production use: https://api-m.paypal.com
```

### Client (`client/.env.local`)
Add the Client ID to the frontend configuration:

```dotenv
VITE_PAYPAL_CLIENT_ID=your_sandbox_client_id
```

## 2. Advanced Security Attributes (Optional)

If you need to use `data-csp-nonce` or `data-client-token` (as per your request), you can set them in `client/.env.local`:

```dotenv
VITE_PAYPAL_DATA_CSP_NONCE=your_nonce_value
VITE_PAYPAL_DATA_CLIENT_TOKEN=your_client_token_value
```

The application is already configured to read these values and pass them to the PayPal SDK.

## 3. Verification

1.  Restart the server: `npm run dev:server`
2.  Restart the client: `npm run dev`
3.  Go to the Checkout page and select "PayPal".
4.  The PayPal buttons should appear.
