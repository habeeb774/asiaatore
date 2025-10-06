## Payments Integration Overview

This project now supports a multi‑method payment abstraction with database‑backed orders (Prisma) and audit logging.

### Supported Methods
| Method | Description | Key Routes |
|--------|-------------|------------|
| PayPal | Real sandbox checkout & capture | `/api/pay/paypal/create-order`, `/api/pay/paypal/capture` |
| STC Pay (Sandbox Scaffold) | Session + confirm + webhook (falls back to simulation if creds missing) | `/api/pay/stc/create`, `/api/pay/stc/confirm`, `/api/pay/stc/webhook` |
| Bank Transfer | Manual offline settlement with reference | `/api/pay/bank/init`, `/api/pay/bank/mark-paid` |
| Cash on Delivery (COD) | Reserve order for payment on delivery | `/api/pay/cod/enable` |

### PayPal Flow
1. Frontend calls `createPayPalTransaction({ items, currency })`.
2. Response returns `{ approvalUrl, localOrderId, paypalOrderId }`.
3. Redirect user to `approvalUrl`.
4. After return (success page), call `capturePayPalOrder({ localOrderId, paypalOrderId })`.
5. Order status updates to `paid` (or `processing` if not fully captured) and an AuditLog entry `order.paypal.capture` is recorded.

### STC Pay (Sandbox Scaffold) Flow
If STC credentials are set (`STC_MERCHANT_ID`, `STC_API_KEY`, `STC_API_SECRET`):
1. Ensure order exists (status `created`/`pending`).
2. Frontend calls `createStcPayTransaction({ orderId })`.
3. Backend requests sandbox session (placeholder endpoint `/payments/session`).
4. Response returns `{ sessionId, externalReference }`.
5. User completes payment on STC page (future redirect integration).
6. STC sends POST webhook -> `/api/pay/stc/webhook` with status.
7. Order becomes `paid` / `cancelled` accordingly.

If credentials missing: falls back to local simulation (manual confirm via `/confirm`).

### Bank Transfer Flow
1. User chooses bank transfer at checkout: call `initBankTransfer({ orderId })`.
2. Response returns bank fields (account, IBAN, reference) stored in `paymentMeta.bank` with status `awaiting`.
3. After receiving offline transfer, admin calls `markBankTransferPaid({ orderId, reference })`.
4. Order set to `paid`, AuditLog: `order.bank.markPaid`.

### Cash on Delivery Flow
1. Call `enableCashOnDelivery({ orderId })`.
2. Status stays `reserved` (in `paymentMeta.cod.status`).
3. Later a manual status transition to `shipped` / `delivered` / `paid` closes lifecycle.

### Environment Variables
```
PAYPAL_CLIENT_ID=your_sandbox_client
PAYPAL_SECRET=your_sandbox_secret
PAYPAL_RETURN_URL=http://localhost:5173/checkout/success
PAYPAL_CANCEL_URL=http://localhost:5173/checkout/cancel
PAYPAL_WEBHOOK_ID=your_webhook_id   # From PayPal dashboard (optional but recommended)

# STC Pay (sandbox scaffold)
STC_API_BASE=https://sandbox-api.stcpay.com.sa
STC_MERCHANT_ID=your_merchant_id
STC_API_KEY=your_api_key
STC_API_SECRET=your_api_secret
STC_CALLBACK_URL=http://localhost:4000/api/pay/stc/webhook

# Optional (for bank transfer info)
BANK_ACCOUNT_NAME=Demo Store
BANK_IBAN=SA00 0000 0000 0000 0000 0000
BANK_NAME=Demo Bank
```

### Data Model Highlights
`Order` stores financial totals (`subtotal, discount, tax, grandTotal`) and `paymentMethod`, `paymentMeta` JSON which may contain:
```
{
	paypal: { create: {...}, capture: {...}, paypalOrderId, webhook: {...} },
	stc: { sessionId, externalReference, create: {...}, webhook: {...}, success },
	bank: { accountName, iban, reference, status },
	cod: { status, reservedAt }
}
```

### Audit Logging
Every significant payment event logs to `AuditLog` with an action prefix:
```
order.paypal.create
order.paypal.capture
order.stc.create
order.stc.confirm
order.stc.webhook
order.bank.init
order.bank.markPaid
order.cod.enable
```

### Local Development
```powershell
npm install
npm run db:push
npm run db:seed   # if you have a seed script
npm run start:server
npm run dev       # frontend
```

### Security Notes
- Replace header‑based fake auth with JWT / session before production.
- Add (now added) webhooks (PayPal + STC) to validate capture asynchronously. Ensure you restrict exposure / add secret validation in production.
- Implement state machine to constrain illegal status jumps.
- Consider rate limiting and idempotency keys for create-order.

### Future Roadmap
- Full STC Pay / Mada gateway production spec (replace scaffold endpoints with real ones once docs finalized).
- Automatic cancellation of unpaid orders after timeout.
- Webhook replay detection & signature verification.
- Background reconciliation job for bank transfers.

