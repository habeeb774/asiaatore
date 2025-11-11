import express from 'express';
import Stripe from 'stripe';
import prisma from './db/client.js';
import { audit } from './utils/audit.js';

const router = express.Router();

// Initialize Stripe with secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.warn('[STRIPE] STRIPE_SECRET_KEY not set, Stripe payments disabled');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

// Create Payment Intent
router.post('/create-intent', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe not configured' });
    }

    const { amount, currency = 'SAR', orderId, items, userId } = req.body;

    // Create or get order
    let order;
    if (orderId) {
      order = await prisma.order.findUnique({ where: { id: orderId } });
    }

    if (!order) {
      // Create order if not exists
      order = await prisma.order.create({
        data: {
          id: orderId || `order_${Date.now()}`,
          userId: userId || 'guest',
          status: 'pending',
          paymentMethod: 'stripe',
          currency,
          items: items || [],
          total: amount,
          paymentMeta: { stripeIntent: true }
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
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentMeta: {
          ...order.paymentMeta,
          stripePaymentIntentId: paymentIntent.id
        }
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
      const order = await prisma.order.findFirst({
        where: { paymentMeta: { path: ['stripePaymentIntentId'], equals: paymentIntentId } }
      });

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'paid',
            paymentMeta: {
              ...order.paymentMeta,
              stripeConfirmed: true,
              stripePaymentMethodId: paymentMethodId
            }
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
  const sig = req.headers['stripe-signature'];
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
        const order = await prisma.order.findFirst({
          where: { paymentMeta: { path: ['stripePaymentIntentId'], equals: paymentIntent.id } }
        });

        if (order && order.status !== 'paid') {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'paid',
              paymentMeta: {
                ...order.paymentMeta,
                stripeWebhookConfirmed: true
              }
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
        const failedOrder = await prisma.order.findFirst({
          where: { paymentMeta: { path: ['stripePaymentIntentId'], equals: failedIntent.id } }
        });

        if (failedOrder) {
          await prisma.order.update({
            where: { id: failedOrder.id },
            data: {
              status: 'payment_failed',
              paymentMeta: {
                ...failedOrder.paymentMeta,
                stripeWebhookFailed: true,
                stripeFailureReason: failedIntent.last_payment_error?.message
              }
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