// Notification service for email and SMS
import nodemailer from 'nodemailer';
import twilio from 'twilio';

// Email transporter
const emailTransporter = process.env.SMTP_HOST ? nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
}) : null;

// Twilio client
const twilioClient = process.env.TWILIO_SID && process.env.TWILIO_TOKEN ? twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN) : null;

const STATUS_MESSAGES = {
  ar: {
    pending: 'تم استلام طلبك وهو قيد المراجعة',
    confirmed: 'تم تأكيد طلبك',
    processing: 'طلبك قيد التحضير',
    shipped: 'تم شحن طلبك',
    delivered: 'تم تسليم طلبك بنجاح',
    cancelled: 'تم إلغاء طلبك'
  },
  en: {
    pending: 'Your order has been received and is under review',
    confirmed: 'Your order has been confirmed',
    processing: 'Your order is being prepared',
    shipped: 'Your order has been shipped',
    delivered: 'Your order has been delivered successfully',
    cancelled: 'Your order has been cancelled'
  }
};

export async function sendOrderStatusNotification(order, newStatus, options = {}) {
  const { lang = 'ar', skipEmail = false, skipSMS = false } = options;
  const messages = STATUS_MESSAGES[lang] || STATUS_MESSAGES.ar;
  const message = messages[newStatus] || `Order status updated to: ${newStatus}`;

  const customerEmail = order?.paymentMeta?.address?.email || order?.user?.email;
  const customerPhone = order?.paymentMeta?.address?.phone;

  // Send email
  if (!skipEmail && emailTransporter && customerEmail) {
    try {
      await emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@store.com',
        to: customerEmail,
        subject: `تحديث حالة الطلب #${order.id}`,
        html: `
          <div dir="rtl">
            <h2>تحديث حالة الطلب</h2>
            <p>رقم الطلب: <strong>${order.id}</strong></p>
            <p>${message}</p>
            <p>شكراً لتسوقك معنا!</p>
          </div>
        `,
        text: `تحديث حالة الطلب #${order.id}: ${message}`
      });
      console.log(`[NOTIFICATION] Email sent to ${customerEmail} for order ${order.id}`);
    } catch (error) {
      console.error('[NOTIFICATION] Email send failed:', error.message);
    }
  }

  // Send SMS
  if (!skipSMS && twilioClient && customerPhone && process.env.TWILIO_FROM) {
    try {
      await twilioClient.messages.create({
        body: `Order #${order.id}: ${message}`,
        from: process.env.TWILIO_FROM,
        to: customerPhone.startsWith('+') ? customerPhone : `+966${customerPhone.replace(/^0/, '')}`
      });
      console.log(`[NOTIFICATION] SMS sent to ${customerPhone} for order ${order.id}`);
    } catch (error) {
      console.error('[NOTIFICATION] SMS send failed:', error.message);
    }
  }
}

export async function sendOrderConfirmation(order, options = {}) {
  // Similar to status notification but for new orders
  return sendOrderStatusNotification(order, 'pending', { ...options, message: 'تم استلام طلبك بنجاح' });
}