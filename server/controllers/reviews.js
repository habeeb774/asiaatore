import { Router } from 'express';
import prisma from '../db/client.js';
import { attachUser, requireAuth, requireAdmin } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';

const router = Router();
router.use(attachUser);

function requireUser(req, res, next) {
  if (!req.user || !req.user.id || req.user.id === 'guest') return res.status(401).json({ ok:false, error:'UNAUTHENTICATED' });
  next();
}

// List approved reviews for a product
router.get('/product/:productId', async (req, res) => {
  const list = await prisma.review.findMany({ where: { productId: req.params.productId, status: 'approved' }, orderBy: { createdAt: 'desc' }, take: 100 });
  res.json({ ok: true, reviews: list });
});

// Submit review (initially pending)
router.post('/', requireUser, async (req, res) => {
  try {
    const { productId, rating, title, body } = req.body || {};
    if (!productId || !rating) return res.status(400).json({ ok:false, error:'MISSING_FIELDS' });
    const r = await prisma.review.create({ data: { productId, userId: req.user.id, rating: Math.min(5, Math.max(1, parseInt(rating,10))), title: title || null, body: body || null } });
    res.status(201).json({ ok: true, review: r });
  } catch (e) {
    res.status(500).json({ ok:false, error:'CREATE_FAILED', message: e.message });
  }
});

// Admin moderation list
router.get('/moderation', async (req, res) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ ok:false, error:'FORBIDDEN' });
  const list = await prisma.review.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'desc' }, take: 200 });
  res.json({ ok:true, reviews: list });
});

// Approve / reject
router.post('/:id/moderate', async (req, res) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ ok:false, error:'FORBIDDEN' });
  try {
    const { action } = req.body || {};
    if (!['approve','reject'].includes(action)) return res.status(400).json({ ok:false, error:'INVALID_ACTION' });
    const status = action === 'approve' ? 'approved' : 'rejected';
    const updated = await prisma.review.update({ where: { id: req.params.id }, data: { status } });
    res.json({ ok:true, review: updated });
  } catch (e) {
    res.status(500).json({ ok:false, error:'MODERATE_FAILED', message: e.message });
  }
});

// Batch moderate: { ids: string[], action: 'approve'|'reject' }
router.post('/moderate-batch', async (req, res) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ ok:false, error:'FORBIDDEN' });
  try {
    const { ids, action } = req.body || {};
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ ok:false, error:'INVALID_IDS' });
    if (!['approve','reject'].includes(action)) return res.status(400).json({ ok:false, error:'INVALID_ACTION' });
    const status = action === 'approve' ? 'approved' : 'rejected';
    await prisma.review.updateMany({ where: { id: { in: ids.map(String) } }, data: { status } });
    const updated = await prisma.review.findMany({ where: { id: { in: ids.map(String) } } });
    res.json({ ok:true, updated });
  } catch (e) {
    res.status(500).json({ ok:false, error:'MODERATE_BATCH_FAILED', message: e.message });
  }
});

// Enhanced review features

// Mark review as helpful
router.post('/:id/helpful', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { helpful = true } = req.body;

    // Check if user already voted
    const existingVote = await prisma.reviewHelpful.findUnique({
      where: {
        reviewId_userId: {
          reviewId: id,
          userId: req.user.id
        }
      }
    });

    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: req.locale === 'ar' ? 'لقد قمت بالتصويت بالفعل على هذه المراجعة' : 'You have already voted on this review'
      });
    }

    // Create vote
    await prisma.reviewHelpful.create({
      data: {
        reviewId: id,
        userId: req.user.id,
        helpful
      }
    });

    // Update helpful count
    const review = await prisma.review.findUnique({
      where: { id },
      select: { helpful: true }
    });

    const newHelpfulCount = helpful ? review.helpful + 1 : review.helpful;

    await prisma.review.update({
      where: { id },
      data: { helpful: newHelpfulCount }
    });

    res.json({
      success: true,
      message: req.locale === 'ar' ? 'تم تسجيل تصويتك' : 'Your vote has been recorded'
    });
  } catch (error) {
    req.log?.error({ err: error }, 'Error marking review as helpful'); // Use req.log
    res.status(500).json({
      success: false,
      message: req.locale === 'ar' ? 'حدث خطأ في تسجيل التصويت' : 'Error recording vote'
    });
  }
});

// Add response to review (admin/seller only)
router.post('/:id/response', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    if (!response || response.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: req.locale === 'ar' ? 'الرد مطلوب' : 'Response is required'
      });
    }

    // Check if user is admin or seller
    if (!['admin', 'seller'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: req.locale === 'ar' ? 'غير مصرح لك بالرد' : 'Not authorized to respond'
      });
    }

    const reviewResponse = await prisma.reviewResponse.create({
      data: {
        reviewId: id,
        userId: req.user.id,
        response: response.trim()
      },
      include: {
        user: {
          select: { name: true, role: true }
        }
      }
    });

    // Audit the response
    await audit({
      action: 'review_response_added',
      entity: 'review',
      entityId: id,
      userId: req.user.id,
      meta: { responseLength: response.length }
    });

    res.json({
      success: true,
      data: reviewResponse,
      message: req.locale === 'ar' ? 'تم إضافة الرد بنجاح' : 'Response added successfully'
    });
  } catch (error) {
    req.log?.error({ err: error }, 'Error adding review response'); // Use req.log
    res.status(500).json({
      success: false,
      message: req.locale === 'ar' ? 'حدث خطأ في إضافة الرد' : 'Error adding response'
    });
  }
});

// Get enhanced reviews for product
router.get('/product/:productId/enhanced', async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let orderBy;
    switch (sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'highest':
        orderBy = { rating: 'desc' };
        break;
      case 'lowest':
        orderBy = { rating: 'asc' };
        break;
      case 'helpful':
        orderBy = { helpful: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const reviews = await prisma.review.findMany({
      where: {
        productId,
        status: 'approved'
      },
      include: {
        user: {
          select: { id: true, name: true }
        },
        images: {
          orderBy: { sort: 'asc' }
        },
        responses: {
          include: {
            user: {
              select: { name: true, role: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        helpfulVotes: req.user ? {
          where: { userId: req.user.id },
          select: { helpful: true }
        } : false
      },
      orderBy,
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.review.count({
      where: {
        productId,
        status: 'approved'
      }
    });

    // Calculate rating distribution
    const ratingStats = await prisma.review.groupBy({
      by: ['rating'],
      where: {
        productId,
        status: 'approved'
      },
      _count: { rating: true }
    });

    const ratingDistribution = {};
    ratingStats.forEach(stat => {
      ratingDistribution[stat.rating] = stat._count.rating;
    });

    res.json({
      success: true,
      data: {
        reviews: reviews.map(review => ({
          ...review,
          userVoted: review.helpfulVotes?.length > 0,
          userVote: review.helpfulVotes?.[0]?.helpful || null
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        ratingDistribution
      }
    });
  } catch (error) {
    req.log?.error({ err: error }, 'Error fetching enhanced reviews'); // Use req.log
    res.status(500).json({
      success: false,
      message: req.locale === 'ar' ? 'حدث خطأ في جلب المراجعات' : 'Error fetching reviews'
    });
  }
});

// Submit enhanced review with images
router.post('/enhanced', requireAuth, async (req, res) => {
  try {
    const { productId, rating, title, body, images = [] } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({
        success: false,
        message: req.locale === 'ar' ? 'معرف المنتج والتقييم مطلوبان' : 'Product ID and rating are required'
      });
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        productId,
        userId: req.user.id,
        status: { in: ['approved', 'pending'] }
      }
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: req.locale === 'ar' ? 'لقد قمت بمراجعة هذا المنتج بالفعل' : 'You have already reviewed this product'
      });
    }

    // Check if user purchased the product (for verified reviews)
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: req.user.id,
          status: 'delivered'
        }
      }
    });

    const review = await prisma.review.create({
      data: {
        productId,
        userId: req.user.id,
        rating: Math.min(5, Math.max(1, parseInt(rating))),
        title: title?.trim() || null,
        body: body?.trim() || null,
        verified: !!hasPurchased,
        images: {
          create: images.map((image, index) => ({
            url: image.url,
            alt: image.alt || null,
            sort: index
          }))
        }
      },
      include: {
        images: true
      }
    });

    // Audit the review submission
    await audit({
      action: 'review_submitted',
      entity: 'review',
      entityId: review.id,
      userId: req.user.id,
      meta: { productId, verified: !!hasPurchased }
    });

    res.status(201).json({
      success: true,
      data: review,
      message: req.locale === 'ar' ? 'تم إرسال المراجعة بنجاح' : 'Review submitted successfully'
    });
  } catch (error) {
    req.log?.error({ err: error }, 'Error submitting enhanced review'); // Use req.log
    res.status(500).json({
      success: false,
      message: req.locale === 'ar' ? 'حدث خطأ في إرسال المراجعة' : 'Error submitting review'
    });
  }
});

// Get user's review for a product
router.get('/user/:productId', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;

    const review = await prisma.review.findFirst({
      where: {
        productId,
        userId: req.user.id,
        status: { in: ['approved', 'pending'] }
      },
      include: {
        images: {
          orderBy: { sort: 'asc' }
        }
      }
    });

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    req.log?.error({ err: error }, 'Error fetching user review'); // Use req.log
    res.status(500).json({
      success: false,
      message: req.locale === 'ar' ? 'حدث خطأ في جلب المراجعة' : 'Error fetching review'
    });
  }
});

export default router;

// ---------------- Seller Reviews (التقييمات للبائعين) ----------------
// List approved seller reviews
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const list = await prisma.sellerReview.findMany({ where: { sellerId: req.params.sellerId, status: 'approved' }, orderBy: { createdAt: 'desc' }, take: 100 });
    const avg = list.length ? (list.reduce((a,r)=>a+r.rating,0)/list.length) : 0;
    res.json({ ok: true, reviews: list, average: avg, count: list.length });
  } catch (e) {
    res.status(500).json({ ok:false, error:'SELLER_REVIEWS_LIST_FAILED', message:e.message });
  }
});

// Submit seller review (pending moderation)
router.post('/seller', requireAuth, async (req, res) => {
  try {
    const { sellerId, rating, title, body } = req.body || {};
    if (!sellerId || !rating) return res.status(400).json({ ok:false, error:'MISSING_FIELDS' });
    // Prevent reviewing self
    if (sellerId === req.user.id) return res.status(400).json({ ok:false, error:'CANNOT_REVIEW_SELF' });
    // Ensure target is seller
    const seller = await prisma.user.findUnique({ where: { id: sellerId } });
    if (!seller || seller.role !== 'seller') return res.status(404).json({ ok:false, error:'SELLER_NOT_FOUND' });
    // Check duplicate (pending or approved)
    const existing = await prisma.sellerReview.findFirst({ where: { sellerId, userId: req.user.id, status: { in: ['pending','approved'] } } });
    if (existing) return res.status(400).json({ ok:false, error:'ALREADY_REVIEWED' });
    const review = await prisma.sellerReview.create({ data: { sellerId, userId: req.user.id, rating: Math.min(5, Math.max(1, parseInt(rating,10))), title: title || null, body: body || null } });
    await audit({ action:'seller_review_submitted', entity:'sellerReview', entityId: review.id, userId: req.user.id, meta:{ sellerId } });
    res.status(201).json({ ok:true, review });
  } catch (e) {
    res.status(500).json({ ok:false, error:'SELLER_REVIEW_CREATE_FAILED', message:e.message });
  }
});

// Seller review moderation list (admin only)
router.get('/seller/moderation', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ ok:false, error:'FORBIDDEN' });
  try {
    const list = await prisma.sellerReview.findMany({ where: { status:'pending' }, orderBy:{ createdAt:'desc' }, take:200 });
    res.json({ ok:true, reviews:list });
  } catch (e) {
    res.status(500).json({ ok:false, error:'SELLER_REVIEW_MODERATION_LIST_FAILED', message:e.message });
  }
});

async function updateSellerAggregate(sellerId) {
  const approved = await prisma.sellerReview.findMany({ where: { sellerId, status:'approved' } });
  const count = approved.length;
  const avg = count ? approved.reduce((a,r)=>a+r.rating,0)/count : 0;
  await prisma.user.update({ where:{ id: sellerId }, data:{ sellerRatingAvg: avg, sellerRatingCount: count } });
}

// Moderate seller review
router.post('/seller/:id/moderate', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ ok:false, error:'FORBIDDEN' });
  try {
    const { action } = req.body || {};
    if (!['approve','reject'].includes(action)) return res.status(400).json({ ok:false, error:'INVALID_ACTION' });
    const review = await prisma.sellerReview.update({ where: { id: req.params.id }, data: { status: action === 'approve' ? 'approved' : 'rejected' } });
    if (action === 'approve') await updateSellerAggregate(review.sellerId);
    await audit({ action:'seller_review_moderated', entity:'sellerReview', entityId: review.id, userId: req.user.id, meta:{ action } });
    res.json({ ok:true, review });
  } catch (e) {
    res.status(500).json({ ok:false, error:'SELLER_REVIEW_MODERATE_FAILED', message:e.message });
  }
});

// Get current user's review for seller
router.get('/seller/:sellerId/user', requireAuth, async (req, res) => {
  try {
    const r = await prisma.sellerReview.findFirst({ where: { sellerId: req.params.sellerId, userId: req.user.id, status: { in:['pending','approved'] } } });
    res.json({ ok:true, review: r || null });
  } catch (e) {
    res.status(500).json({ ok:false, error:'SELLER_REVIEW_USER_FETCH_FAILED', message:e.message });
  }
});
