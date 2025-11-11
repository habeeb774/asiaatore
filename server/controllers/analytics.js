import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import prisma from '../db/client.js';

const router = express.Router();

// Track analytics event (public endpoint for client-side tracking)
router.post('/track', async (req, res) => {
  try {
    const {
      eventType,
      eventData,
      sessionId,
      userAgent,
      ipAddress,
      referrer,
      url
    } = req.body;

    // Get user ID from auth if available
    const userId = req.user?.id;

    // Create analytics event
    const event = await prisma.analyticsEvent.create({
      data: {
        eventType,
        eventData,
        userId,
        sessionId,
        userAgent: userAgent || req.headers['user-agent'],
        ipAddress: ipAddress || req.ip,
        referrer,
        url
      }
    });

    res.json({ success: true, eventId: event.id });
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking event'
    });
  }
});

// Get analytics dashboard data (admin only)
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const { period = '30d', startDate, endDate } = req.query;

    // Calculate date range
    let start, end = new Date();
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      start = new Date();
      switch (period) {
        case '7d':
          start.setDate(start.getDate() - 7);
          break;
        case '30d':
          start.setDate(start.getDate() - 30);
          break;
        case '90d':
          start.setDate(start.getDate() - 90);
          break;
        case '1y':
          start.setFullYear(start.getFullYear() - 1);
          break;
        default:
          start.setDate(start.getDate() - 30);
      }
    }

    // Get key metrics
    const [
      totalRevenue,
      totalOrders,
      totalUsers,
      pageViews,
      topProducts,
      revenueByDay,
      ordersByDay,
      topCategories
    ] = await Promise.all([
      // Total revenue
      prisma.order.aggregate({
        where: {
          status: 'delivered',
          createdAt: { gte: start, lte: end }
        },
        _sum: { grandTotal: true }
      }),

      // Total orders
      prisma.order.count({
        where: {
          createdAt: { gte: start, lte: end }
        }
      }),

      // Total users
      prisma.user.count({
        where: {
          createdAt: { gte: start, lte: end }
        }
      }),

      // Page views
      prisma.analyticsEvent.count({
        where: {
          eventType: 'page_view',
          timestamp: { gte: start, lte: end }
        }
      }),

      // Top products
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            status: 'delivered',
            createdAt: { gte: start, lte: end }
          }
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10
      }),

      // Revenue by day
      prisma.$queryRaw`
        SELECT DATE(createdAt) as date, SUM(grandTotal) as revenue
        FROM \`Order\`
        WHERE status = 'delivered' AND createdAt >= ? AND createdAt <= ?
        GROUP BY DATE(createdAt)
        ORDER BY date
      `,

      // Orders by day
      prisma.$queryRaw`
        SELECT DATE(createdAt) as date, COUNT(*) as orders
        FROM \`Order\`
        WHERE createdAt >= ? AND createdAt <= ?
        GROUP BY DATE(createdAt)
        ORDER BY date
      `,

      // Top categories
      prisma.orderItem.groupBy({
        by: ['nameEn'],
        where: {
          order: {
            status: 'delivered',
            createdAt: { gte: start, lte: end }
          }
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10
      })
    ]);

    // Get product details for top products
    const topProductIds = topProducts.map(p => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, nameEn: true, nameAr: true }
    });

    const topProductsWithNames = topProducts.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        name: req.locale === 'ar' ? product?.nameAr : product?.nameEn,
        quantity: item._sum.quantity
      };
    });

    res.json({
      success: true,
      data: {
        period: { start, end },
        metrics: {
          totalRevenue: totalRevenue._sum.grandTotal || 0,
          totalOrders,
          totalUsers,
          pageViews,
          averageOrderValue: totalOrders > 0 ? (totalRevenue._sum.grandTotal || 0) / totalOrders : 0
        },
        charts: {
          revenueByDay,
          ordersByDay
        },
        topProducts: topProductsWithNames,
        topCategories: topCategories.map(cat => ({
          category: cat.nameEn,
          quantity: cat._sum.quantity
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching analytics dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics data'
    });
  }
});

// Get predictive insights
router.get('/insights', requireAdmin, async (req, res) => {
  try {
    const insights = await prisma.predictiveInsight.findMany({
      where: {
        status: 'active',
        expiresAt: { gte: new Date() }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching insights'
    });
  }
});

// Update insight status
router.patch('/insights/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const insight = await prisma.predictiveInsight.update({
      where: { id },
      data: { status }
    });

    res.json({
      success: true,
      data: insight
    });
  } catch (error) {
    console.error('Error updating insight:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating insight'
    });
  }
});

// Get real-time analytics (last 24 hours)
router.get('/realtime', requireAdmin, async (req, res) => {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      activeUsers,
      pageViews,
      orders,
      revenue
    ] = await Promise.all([
      // Active users (unique sessions in last 24h)
      prisma.analyticsEvent.findMany({
        where: {
          timestamp: { gte: last24Hours }
        },
        select: { sessionId: true },
        distinct: ['sessionId']
      }),

      // Page views in last 24h
      prisma.analyticsEvent.count({
        where: {
          eventType: 'page_view',
          timestamp: { gte: last24Hours }
        }
      }),

      // Orders in last 24h
      prisma.order.count({
        where: {
          createdAt: { gte: last24Hours }
        }
      }),

      // Revenue in last 24h
      prisma.order.aggregate({
        where: {
          status: 'delivered',
          createdAt: { gte: last24Hours }
        },
        _sum: { grandTotal: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        activeUsers: activeUsers.length,
        pageViews,
        orders,
        revenue: revenue._sum.grandTotal || 0,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error fetching realtime analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching realtime data'
    });
  }
});

// Generate sample predictive insights (for demo)
router.post('/generate-insights', requireAdmin, async (req, res) => {
  try {
    const insights = [
      {
        insightType: 'sales_forecast',
        title: 'مبيعات قوية متوقعة الأسبوع القادم',
        description: 'بناءً على اتجاهات المبيعات الحالية، نتوقع زيادة في المبيعات بنسبة 15-20% الأسبوع القادم',
        confidence: 0.85,
        data: { predictedIncrease: 17.5, basedOnDays: 30 },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      },
      {
        insightType: 'product_recommendation',
        title: 'زيادة عرض منتج الكترونيات',
        description: 'المنتجات الإلكترونية تحقق أداءً جيداً. نوصي بزيادة المخزون لهذه الفئة',
        confidence: 0.92,
        data: { category: 'electronics', currentPerformance: 'high', recommendation: 'increase_stock' },
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
      },
      {
        insightType: 'customer_churn',
        title: 'عملاء محتملون للخروج',
        description: 'تم تحديد 25 عميل لم يقوموا بأي طلب منذ 60 يوماً',
        confidence: 0.78,
        data: { atRiskCustomers: 25, daysSinceLastOrder: 60, recommendedAction: 'send_reminder' },
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
      }
    ];

    const createdInsights = await prisma.predictiveInsight.createMany({
      data: insights
    });

    res.json({
      success: true,
      message: 'Sample insights generated',
      count: insights.length
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating insights'
    });
  }
});

export default router;