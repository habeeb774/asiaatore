import { Router } from 'express';
import prisma from '../db/client.js';
import { attachUser, requireAuth, requireAdmin } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';

const router = Router();
router.use(attachUser);

// Require admin for all admin review routes
router.use(requireAdmin);

// Get all reviews with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      rating,
      status,
      sortBy = 'newest',
      search,
      productId
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};
    
    if (productId) {
      where.productId = productId;
    }
    
    if (rating && rating !== 'all') {
      where.rating = parseInt(rating);
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { comment: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Build order by clause
    let orderBy = { createdAt: 'desc' };
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'rating_high':
        orderBy = { rating: 'desc' };
        break;
      case 'rating_low':
        orderBy = { rating: 'asc' };
        break;
      case 'helpful':
        orderBy = { helpful: 'desc' };
        break;
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        product: {
          select: { id: true, nameAr: true }
        },
        images: {
          orderBy: { sort: 'asc' }
        },
        responses: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy,
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.review.count({ where });

    // Transform data for frontend
    const transformedReviews = reviews.map(review => ({
      id: review.id,
      productId: review.productId,
      productName: review.product?.nameAr || 'Unknown Product',
      customerName: review.user?.name || 'Anonymous',
      customerEmail: review.user?.email || '',
      customerAvatar: review.user?.avatar || '/default-avatar.png',
      rating: review.rating,
      title: review.title,
      comment: review.body || review.comment || '',
      status: review.status,
      verified: review.verified,
      helpfulCount: review.helpful,
      images: review.images?.map(img => img.url) || [],
      responses: review.responses || [],
      createdAt: review.createdAt,
      updatedAt: review.updatedAt
    }));

    res.json({
      ok: true,
      reviews: transformedReviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    req.log?.error({ err: error }, 'Error fetching admin reviews'); // Use req.log
    res.status(500).json({
      ok: false,
      error: 'FETCH_FAILED',
      message: error.message
    });
  }
});

// Get review statistics
router.get('/stats', async (req, res) => {
  try {
    const { productId } = req.query;

    const where = productId ? { productId } : {};

    const [total, approved, pending, rejected, ratingStats] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.count({ where: { ...where, status: 'approved' } }),
      prisma.review.count({ where: { ...where, status: 'pending' } }),
      prisma.review.count({ where: { ...where, status: 'rejected' } }),
      prisma.review.groupBy({
        by: ['rating'],
        where: { ...where, status: 'approved' },
        _count: { rating: true }
      })
    ]);

    const averageRating = await prisma.review.aggregate({
      where: { ...where, status: 'approved' },
      _avg: { rating: true }
    });

    const ratingDistribution = [5, 4, 3, 2, 1].map(rating => {
      const stat = ratingStats.find(s => s.rating === rating);
      return {
        rating,
        count: stat?._count.rating || 0,
        percentage: total > 0 ? ((stat?._count.rating || 0) / total) * 100 : 0
      };
    });

    res.json({
      ok: true,
      stats: {
        total,
        approved,
        pending,
        rejected,
        averageRating: averageRating._avg.rating || 0,
        ratingDistribution
      }
    });
  } catch (error) {
    req.log?.error({ err: error }, 'Error fetching review stats'); // Use req.log
    res.status(500).json({
      ok: false,
      error: 'FETCH_FAILED',
      message: error.message
    });
  }
});

// Approve/reject review
router.post('/:reviewId/:action', async (req, res) => {
  try {
    const { reviewId, action } = req.params;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        ok: false,
        error: 'INVALID_ACTION',
        message: 'Action must be approve or reject'
      });
    }

    const status = action === 'approve' ? 'approved' : 'rejected';

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { status }
    });

    await audit({
      action: `review_${action}d`,
      entity: 'review',
      entityId: reviewId,
      userId: req.user.id,
      meta: { status, reviewId }
    });

    res.json({
      ok: true,
      review: updated
    });
  } catch (error) {
    req.log?.error({ err: error }, 'Error updating review status'); // Use req.log
    res.status(500).json({
      ok: false,
      error: 'UPDATE_FAILED',
      message: error.message
    });
  }
});

// Update review
router.put('/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, status } = req.body;

    const updateData = {};
    if (rating !== undefined) updateData.rating = Math.min(5, Math.max(1, parseInt(rating)));
    if (comment !== undefined) updateData.body = comment;
    if (status !== undefined) updateData.status = status;

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: updateData
    });

    await audit({
      action: 'review_updated',
      entity: 'review',
      entityId: reviewId,
      userId: req.user.id,
      meta: updateData
    });

    res.json({
      ok: true,
      review: updated
    });
  } catch (error) {
    req.log?.error({ err: error }, 'Error updating review'); // Use req.log
    res.status(500).json({
      ok: false,
      error: 'UPDATE_FAILED',
      message: error.message
    });
  }
});

// Delete review
router.delete('/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;

    await prisma.review.delete({
      where: { id: reviewId }
    });

    await audit({
      action: 'review_deleted',
      entity: 'review',
      entityId: reviewId,
      userId: req.user.id
    });

    res.json({
      ok: true
    });
  } catch (error) {
    req.log?.error({ err: error }, 'Error deleting review'); // Use req.log
    res.status(500).json({
      ok: false,
      error: 'DELETE_FAILED',
      message: error.message
    });
  }
});

// Bulk actions on reviews
router.post('/bulk', async (req, res) => {
  try {
    const { action, reviewIds } = req.body;

    if (!action || !Array.isArray(reviewIds) || reviewIds.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'INVALID_REQUEST',
        message: 'Action and reviewIds are required'
      });
    }

    let updateData = {};

    switch (action) {
      case 'approve':
        updateData = { status: 'approved' };
        break;
      case 'reject':
        updateData = { status: 'rejected' };
        break;
      case 'delete':
        // For delete, we need to handle separately
        await prisma.review.deleteMany({
          where: { id: { in: reviewIds } }
        });

        await audit({
          action: 'reviews_bulk_deleted',
          entity: 'review',
          entityId: reviewIds.join(','),
          userId: req.user.id,
          meta: { reviewIds }
        });

        return res.json({
          ok: true,
          deleted: reviewIds.length
        });
      default:
        return res.status(400).json({
          ok: false,
          error: 'INVALID_ACTION',
          message: 'Action must be approve, reject, or delete'
        });
    }

    const result = await prisma.review.updateMany({
      where: { id: { in: reviewIds } },
      data: updateData
    });

    await audit({
      action: `reviews_bulk_${action}d`,
      entity: 'review',
      entityId: reviewIds.join(','),
      userId: req.user.id,
      meta: { action, reviewIds, count: result.count }
    });

    res.json({
      ok: true,
      updated: result.count
    });
  } catch (error) {
    req.log?.error({ err: error }, 'Error performing bulk action'); // Use req.log
    res.status(500).json({
      ok: false,
      error: 'BULK_ACTION_FAILED',
      message: error.message
    });
  }
});

export default router;
