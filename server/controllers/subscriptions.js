import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import prisma from '../db/client.js';
import { audit } from '../utils/audit.js';

const router = express.Router();

// Get all subscription plans (public)
router.get('/plans', async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      include: {
        features: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    res.json({
      success: true,
      data: plans.map(plan => ({
        id: plan.id,
        name: req.locale === 'ar' ? plan.nameAr : plan.nameEn,
        description: req.locale === 'ar' ? plan.descriptionAr : plan.descriptionEn,
        price: plan.price,
        currency: plan.currency,
        interval: plan.interval,
        intervalCount: plan.intervalCount,
        trialDays: plan.trialDays,
        maxUsers: plan.maxUsers,
        features: plan.features.map(feature => ({
          name: req.locale === 'ar' ? feature.nameAr : feature.nameEn,
          description: req.locale === 'ar' ? feature.descriptionAr : feature.descriptionEn,
          value: feature.value
        }))
      }))
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({
      success: false,
      message: req.locale === 'ar' ? 'حدث خطأ في جلب خطط الاشتراك' : 'Error fetching subscription plans'
    });
  }
});

// Get current user's subscription
router.get('/current', requireAuth, async (req, res) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.user.id,
        status: { in: ['active', 'trial'] }
      },
      include: {
        plan: {
          include: {
            features: {
              orderBy: { sortOrder: 'asc' }
            }
          }
        }
      }
    });

    if (!subscription) {
      return res.json({
        success: true,
        data: null
      });
    }

    res.json({
      success: true,
      data: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialEnd: subscription.trialEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        plan: {
          id: subscription.plan.id,
          name: req.locale === 'ar' ? subscription.plan.nameAr : subscription.plan.nameEn,
          price: subscription.plan.price,
          currency: subscription.plan.currency,
          interval: subscription.plan.interval,
          intervalCount: subscription.plan.intervalCount,
          features: subscription.plan.features.map(feature => ({
            name: req.locale === 'ar' ? feature.nameAr : feature.nameEn,
            description: req.locale === 'ar' ? feature.descriptionAr : feature.descriptionEn,
            value: feature.value
          }))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    res.status(500).json({
      success: false,
      message: req.locale === 'ar' ? 'حدث خطأ في جلب الاشتراك الحالي' : 'Error fetching current subscription'
    });
  }
});

// Subscribe to a plan
router.post('/subscribe/:planId', requireAuth, async (req, res) => {
  try {
    const { planId } = req.params;
    const { paymentMethod } = req.body;

    // Check if plan exists and is active
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { id: planId, isActive: true }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: req.locale === 'ar' ? 'خطة الاشتراك غير موجودة' : 'Subscription plan not found'
      });
    }

    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: req.user.id,
        status: { in: ['active', 'trial'] }
      }
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: req.locale === 'ar' ? 'لديك اشتراك نشط بالفعل' : 'You already have an active subscription'
      });
    }

    // Calculate subscription dates
    const now = new Date();
    const currentPeriodStart = now;
    const currentPeriodEnd = new Date(now);

    if (plan.interval === 'month') {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + plan.intervalCount);
    } else if (plan.interval === 'year') {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + plan.intervalCount);
    } else if (plan.interval === 'week') {
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + (plan.intervalCount * 7));
    }

    const trialEnd = plan.trialDays > 0 ? new Date(now.getTime() + (plan.trialDays * 24 * 60 * 60 * 1000)) : null;

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: req.user.id,
        planId: plan.id,
        status: plan.trialDays > 0 ? 'trial' : 'active',
        currentPeriodStart,
        currentPeriodEnd,
        trialEnd,
        meta: { paymentMethod }
      },
      include: {
        plan: true
      }
    });

    // Create subscription benefits based on plan features
    const benefits = [];
    for (const feature of plan.features) {
      if (feature.nameEn.toLowerCase().includes('discount')) {
        benefits.push({
          userId: req.user.id,
          benefitType: 'discount_percentage',
          value: feature.value || '10',
          expiresAt: currentPeriodEnd
        });
      } else if (feature.nameEn.toLowerCase().includes('shipping')) {
        benefits.push({
          userId: req.user.id,
          benefitType: 'free_shipping',
          value: 'true',
          expiresAt: currentPeriodEnd
        });
      } else if (feature.nameEn.toLowerCase().includes('support')) {
        benefits.push({
          userId: req.user.id,
          benefitType: 'priority_support',
          value: 'true',
          expiresAt: currentPeriodEnd
        });
      }
    }

    if (benefits.length > 0) {
      await prisma.subscriptionBenefit.createMany({
        data: benefits
      });
    }

    // Audit the subscription creation
    await audit({
      action: 'subscription_created',
      entity: 'subscription',
      entityId: subscription.id,
      userId: req.user.id,
      meta: { planId: plan.id, planName: plan.nameEn }
    });

    res.json({
      success: true,
      data: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialEnd: subscription.trialEnd,
        plan: {
          id: plan.id,
          name: req.locale === 'ar' ? plan.nameAr : plan.nameEn,
          price: plan.price,
          currency: plan.currency
        }
      },
      message: req.locale === 'ar' ? 'تم إنشاء الاشتراك بنجاح' : 'Subscription created successfully'
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      message: req.locale === 'ar' ? 'حدث خطأ في إنشاء الاشتراك' : 'Error creating subscription'
    });
  }
});

// Cancel subscription
router.post('/cancel', requireAuth, async (req, res) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.user.id,
        status: { in: ['active', 'trial'] }
      }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: req.locale === 'ar' ? 'لا يوجد اشتراك نشط' : 'No active subscription found'
      });
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        cancelledAt: new Date()
      }
    });

    // Audit the cancellation
    await audit({
      action: 'subscription_cancelled',
      entity: 'subscription',
      entityId: subscription.id,
      userId: req.user.id
    });

    res.json({
      success: true,
      message: req.locale === 'ar' ? 'تم إلغاء الاشتراك بنجاح' : 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: req.locale === 'ar' ? 'حدث خطأ في إلغاء الاشتراك' : 'Error cancelling subscription'
    });
  }
});

// Get user's subscription benefits
router.get('/benefits', requireAuth, async (req, res) => {
  try {
    const benefits = await prisma.subscriptionBenefit.findMany({
      where: {
        userId: req.user.id,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: benefits.map(benefit => ({
        id: benefit.id,
        benefitType: benefit.benefitType,
        value: benefit.value,
        expiresAt: benefit.expiresAt,
        usedCount: benefit.usedCount,
        maxUses: benefit.maxUses
      }))
    });
  } catch (error) {
    console.error('Error fetching subscription benefits:', error);
    res.status(500).json({
      success: false,
      message: req.locale === 'ar' ? 'حدث خطأ في جلب فوائد الاشتراك' : 'Error fetching subscription benefits'
    });
  }
});

// Admin routes
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        plan: {
          select: { id: true, nameEn: true, nameAr: true, price: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    console.error('Error fetching all subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscriptions'
    });
  }
});

// Admin: Create subscription plan
router.post('/admin/plans', requireAdmin, async (req, res) => {
  try {
    const {
      nameAr,
      nameEn,
      descriptionAr,
      descriptionEn,
      price,
      currency = 'SAR',
      interval = 'month',
      intervalCount = 1,
      trialDays = 0,
      maxUsers = 1,
      features = []
    } = req.body;

    const plan = await prisma.subscriptionPlan.create({
      data: {
        nameAr,
        nameEn,
        descriptionAr,
        descriptionEn,
        price: parseFloat(price),
        currency,
        interval,
        intervalCount: parseInt(intervalCount),
        trialDays: parseInt(trialDays),
        maxUsers: parseInt(maxUsers)
      }
    });

    // Create features
    if (features.length > 0) {
      await prisma.subscriptionFeature.createMany({
        data: features.map((feature, index) => ({
          planId: plan.id,
          nameAr: feature.nameAr,
          nameEn: feature.nameEn,
          descriptionAr: feature.descriptionAr,
          descriptionEn: feature.descriptionEn,
          value: feature.value,
          sortOrder: index
        }))
      });
    }

    res.json({
      success: true,
      data: plan,
      message: 'Subscription plan created successfully'
    });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating subscription plan'
    });
  }
});

export default router;