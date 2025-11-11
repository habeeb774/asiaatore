import { Router } from 'express';
import { audit } from '../utils/audit.js';
import { broadcast } from '../utils/realtimeHub.js';
import { sendEmail } from '../utils/email.js';
import { sendSms } from '../utils/sms.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// In-memory notifications store (per process). For production, persist via DB.
const notifications = [];

// Create a notification and broadcast to target user or all users
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const { title, message, userId = null, type = 'info', meta = {} } = body;
    if (!title || !message) return res.status(400).json({ error: 'INVALID_BODY', message: 'title and message required' });
    const note = { id: `n_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, title, message, userId, type, meta, read: false, createdAt: new Date().toISOString() };
    notifications.push(note);
    // Audit for traceability
    audit({ action: 'notification.create', entity: 'Notification', entityId: note.id, userId: req.user?.id || null, meta: { userId, type } });
    // Broadcast via realtime hub. If userId provided, predicate will target that user only.
    broadcast('notification', note, (client) => !userId || client.userId === String(userId));
    return res.status(201).json({ ok: true, notification: note });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// List recent notifications (optionally filter by userId)
router.get('/', async (req, res) => {
  try {
    const uid = req.query.userId || req.user?.id || null;
    const list = uid ? notifications.filter(n => String(n.userId) === String(uid)) : notifications.slice(-50).reverse();
    return res.json({ ok: true, notifications: list });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// Send offer notifications to subscribed users
router.post('/offers', async (req, res) => {
  try {
    const body = req.body || {};
    const { offerId, offerTitle, offerDescription, discountPercent } = body;
    
    if (!offerId || !offerTitle) {
      return res.status(400).json({ error: 'INVALID_BODY', message: 'offerId and offerTitle required' });
    }

    // Get all users who have opted in for offer notifications
    const subscribedUsers = await prisma.user.findMany({
      where: {
        notificationPreferences: {
          path: ['offers'],
          equals: true
        }
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true
      }
    });

    const results = { email: 0, sms: 0, errors: [] };

    // Send notifications to each subscribed user
    for (const user of subscribedUsers) {
      try {
        // Send email notification
        if (user.email) {
          const emailResult = await sendEmail({
            to: user.email,
            subject: `عرض جديد: ${offerTitle}`,
            html: `
              <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981;">عرض جديد متاح!</h2>
                <h3>${offerTitle}</h3>
                ${offerDescription ? `<p>${offerDescription}</p>` : ''}
                ${discountPercent ? `<p style="font-size: 18px; font-weight: bold; color: #ef4444;">خصم ${discountPercent}%</p>` : ''}
                <p>لا تفوت الفرصة! زر الموقع الآن للاستفادة من العرض.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/offers" 
                   style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  عرض التفاصيل
                </a>
              </div>
            `,
            text: `عرض جديد: ${offerTitle}${offerDescription ? `\n${offerDescription}` : ''}${discountPercent ? `\nخصم ${discountPercent}%` : ''}`
          });
          
          if (emailResult.ok) results.email++;
          else results.errors.push(`Email to ${user.email}: ${emailResult.error}`);
        }

        // Send SMS/WhatsApp notification (using SMS as WhatsApp proxy)
        if (user.phone) {
          const smsResult = await sendSms({
            to: user.phone,
            message: `عرض جديد في ${process.env.STORE_NAME || 'المتجر'}: ${offerTitle}${discountPercent ? ` - خصم ${discountPercent}%` : ''}. زر: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/offers`
          });
          
          if (smsResult.ok) results.sms++;
          else results.errors.push(`SMS to ${user.phone}: ${smsResult.error}`);
        }

        // Create in-app notification
        const note = { 
          id: `offer_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, 
          title: `عرض جديد: ${offerTitle}`, 
          message: offerDescription || `خصم ${discountPercent || 0}% متاح الآن!`, 
          userId: user.id, 
          type: 'offer', 
          meta: { offerId, discountPercent }, 
          read: false, 
          createdAt: new Date().toISOString() 
        };
        notifications.push(note);
        
        // Broadcast to user
        broadcast('notification', note, (client) => client.userId === String(user.id));

      } catch (e) {
        results.errors.push(`User ${user.id}: ${e.message}`);
      }
    }

    // Audit the bulk notification
    audit({ 
      action: 'notification.offers.bulk', 
      entity: 'Offer', 
      entityId: offerId, 
      userId: req.user?.id || null, 
      meta: { recipients: subscribedUsers.length, results } 
    });

    return res.json({ 
      ok: true, 
      message: `تم إرسال الإشعارات إلى ${subscribedUsers.length} مشترك`, 
      results 
    });

  } catch (e) {
    console.error('[NOTIFICATIONS] Offer notification error:', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// Update user notification preferences
router.put('/preferences', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const { email = true, sms = false, offers = true, orders = true } = req.body;
    
    // Update user preferences in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        notificationPreferences: {
          email,
          sms,
          offers,
          orders
        }
      }
    });

    audit({ 
      action: 'notification.preferences.update', 
      entity: 'User', 
      entityId: userId, 
      userId, 
      meta: { email, sms, offers, orders } 
    });

    return res.json({ ok: true, message: 'تم تحديث تفضيلات الإشعارات' });

  } catch (e) {
    console.error('[NOTIFICATIONS] Preferences update error:', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// Get user notification preferences
router.get('/preferences', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true }
    });

    const preferences = user?.notificationPreferences || {
      email: true,
      sms: false,
      offers: true,
      orders: true
    };

    return res.json({ ok: true, preferences });

  } catch (e) {
    console.error('[NOTIFICATIONS] Preferences fetch error:', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// WhatsApp stub preserved for backwards compatibility
router.post('/whatsapp', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.event || !body.orderId) return res.status(400).json({ error: 'INVALID_BODY', message: 'event and orderId required' });
    audit({ action: 'notify.whatsapp', entity: 'Order', entityId: body.orderId, userId: body.userId || null, meta: { event: body.event } });
    console.log('[NOTIFY] whatsapp', body.event, 'order', body.orderId);
    return res.status(202).json({ ok: true, queued: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
