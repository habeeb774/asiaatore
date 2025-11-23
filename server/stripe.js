import express from 'express';
import Stripe from 'stripe';
import prisma from './db/client.js';
import { audit } from './utils/audit.js';
import { serializePaymentMeta, mergePaymentMeta, deserializePaymentMeta } from './utils/paymentMeta.js';

const router = express.Router();

// Initialize Stripe with secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.warn('[STRIPE] STRIPE_SECRET_KEY not set, Stripe payments disabled');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

async function findOrderByStripeIntent(paymentIntentId, options = {}) {
  if (!paymentIntentId) return null;
  const { select, include } = options;
  const where = {
    OR: [
      { paymentMeta: { path: ['index', 'stripe', 'paymentIntentId'], equals: paymentIntentId } },
      { paymentMeta: { path: ['stripePaymentIntentId'], equals: paymentIntentId } }
    ]
  };

  let order = await prisma.order.findFirst({ where, select, include });
  if (order) return order;

  const candidates = await prisma.order.findMany({
    where: { paymentMethod: 'stripe' },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    select: { id: true, paymentMeta: true }
  }).catch(() => []);

  for (const candidate of candidates) {
    const meta = deserializePaymentMeta(candidate.paymentMeta);
    if (!meta) continue;
    const matches = meta?.stripePaymentIntentId === paymentIntentId
      || meta?.stripe?.paymentIntentId === paymentIntentId;
    if (matches) {
      order = await prisma.order.findUnique({ where: { id: candidate.id }, select, include });
      if (order) return order;
    }
  }
  return null;
}

// Create Payment Intent
router.post('/create-intent', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe not configured' });
    }

    const { amount, currency = 'SAR', orderId, items, userId } = req.body;

    let order = null;
    if (orderId) {
      order = await prisma.order.findUnique({ where: { id: orderId } });
    }

    if (!order) {
      const initialMeta = serializePaymentMeta({
        stage: 'stripe:init',
        stripe: {
          requestedAt: new Date().toISOString(),
          requestedAmount: amount,
          requestedCurrency: currency
        }
      });

      order = await prisma.order.create({
        data: {
          id: orderId || `order_${Date.now()}`,
          userId: userId || 'guest',
          status: 'pending',
          paymentMethod: 'stripe',
          currency,
          items: items || [],
          total: amount,
          paymentMeta: initialMeta
        }
      });
    }

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        orderId: order.id,
        userId: userId || 'guest'
      }
    });

    // Update order with payment intent ID
    const updatedMeta = mergePaymentMeta(order.paymentMeta, meta => {
      const next = { ...meta };
      next.stripePaymentIntentId = paymentIntent.id;
      next.paymentMethod = 'stripe';
      next.stripe = {
        ...(meta.stripe || {}),
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        lastStatus: paymentIntent.status
      };
      next.stage = 'stripe:intent';
      return next;
    }) || serializePaymentMeta({ stripePaymentIntentId: paymentIntent.id });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentMeta: updatedMeta,
        paymentMethod: 'stripe'
      }
    });

    await audit({
      action: 'payment.intent.created',
      entity: 'order',
      entityId: order.id,
      userId: userId || 'guest',
      meta: { provider: 'stripe', amount, currency }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      orderId: order.id
    });

  } catch (error) {
    console.error('[STRIPE] Create intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Confirm Payment (webhook alternative)
router.post('/confirm', async (req, res) => {
  try {
    const { paymentIntentId, paymentMethodId } = req.body;

    if (!stripe) {
      return res.status(503).json({ error: 'Stripe not configured' });
    }

    // Get payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update order status
      const order = await findOrderByStripeIntent(paymentIntentId);

      if (order) {
        const nextMeta = mergePaymentMeta(order.paymentMeta, meta => {
          const next = { ...meta };
          next.stripeConfirmed = true;
          if (paymentMethodId) {
            next.stripePaymentMethodId = paymentMethodId;
            next.stripe = { ...(meta.stripe || {}), paymentMethodId };
          }
          next.stage = 'stripe:confirmed';
          return next;
        }) || serializePaymentMeta({ stripeConfirmed: true, stripePaymentMethodId: paymentMethodId });

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'paid',
            paymentMeta: nextMeta
          }
        });

        await audit({
          action: 'payment.confirmed',
          entity: 'order',
          entityId: order.id,
          userId: order.userId,
          meta: { provider: 'stripe', paymentIntentId, amount: paymentIntent.amount / 100 }
        });
      }

      res.json({ success: true, orderId: order?.id });
    } else {
      res.status(400).json({ error: 'Payment not succeeded' });
    }

  } catch (error) {
    console.error('[STRIPE] Confirm error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Webhook handler for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers?.['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe not configured' });
    }

    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('[STRIPE] Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const order = await findOrderByStripeIntent(paymentIntent.id);

        if (order && order.status !== 'paid') {
          const nextMeta = mergePaymentMeta(order.paymentMeta, meta => {
            const next = { ...meta };
            next.stripeWebhookConfirmed = true;
            next.stage = 'stripe:webhook_confirmed';
            return next;
          }) || serializePaymentMeta({ stripeWebhookConfirmed: true });
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'paid',
              paymentMeta: nextMeta
            }
          });

          await audit({
            action: 'payment.webhook.succeeded',
            entity: 'order',
            entityId: order.id,
            userId: order.userId,
            meta: { provider: 'stripe', paymentIntentId: paymentIntent.id, amount: paymentIntent.amount / 100 }
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const failedIntent = event.data.object;
        const failedOrder = await findOrderByStripeIntent(failedIntent.id);

        if (failedOrder) {
          const nextMeta = mergePaymentMeta(failedOrder.paymentMeta, meta => {
            const next = { ...meta };
            next.stripeWebhookFailed = true;
            next.stripeFailureReason = failedIntent.last_payment_error?.message;
            next.stage = 'stripe:webhook_failed';
            return next;
          }) || serializePaymentMeta({
            stripeWebhookFailed: true,
            stripeFailureReason: failedIntent.last_payment_error?.message
          });
          await prisma.order.update({
            where: { id: failedOrder.id },
            data: {
              status: 'payment_failed',
              paymentMeta: nextMeta
            }
          });

          await audit({
            action: 'payment.webhook.failed',
            entity: 'order',
            entityId: failedOrder.id,
            userId: failedOrder.userId,
            meta: { provider: 'stripe', paymentIntentId: failedIntent.id, error: failedIntent.last_payment_error?.message }
          });
        }
        break;
      }

      default:
        console.log(`[STRIPE] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[STRIPE] Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;