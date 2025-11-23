import { z } from 'zod';

// Common validation patterns
const emailSchema = z.string().email('INVALID_EMAIL').transform(v => v.trim().toLowerCase());
const phoneSchema = z.string().regex(/^(\+966|0)?5\d{8}$/, 'INVALID_PHONE').transform(v => v.trim());
const passwordSchema = z.string().min(6, 'WEAK_PASSWORD');
const idSchema = z.string().min(1, 'ID_REQUIRED');
const positiveNumberSchema = z.coerce.number().int().positive('POSITIVE_NUMBER_REQUIRED');

// Authentication schemas
export const authSchemas = {
  login: z.object({
    identifier: z.string().min(1, 'IDENTIFIER_REQUIRED'), // email or phone
    password: passwordSchema,
    mfaCode: z.string().optional()
  }),
  
  register: z.object({
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    password: passwordSchema,
    name: z.string().trim().min(1, 'NAME_REQUIRED').optional()
  }).refine((data) => data.email || data.phone, {
    message: 'EMAIL_OR_PHONE_REQUIRED',
    path: ['email']
  }),
  
  resetPassword: z.object({
    email: emailSchema
  }),
  
  updateProfile: z.object({
    name: z.string().trim().min(1).optional(),
    email: emailSchema.optional(),
    phone: phoneSchema.optional()
  })
};

// Order schemas
export const orderSchemas = {
  list: z.object({
    userId: idSchema.optional(),
    status: z.string().trim().optional(),
    paymentMethod: z.string().trim().optional(),
    from: z.string().trim().optional(), // date string
    to: z.string().trim().optional(),   // date string
    page: positiveNumberSchema.optional(),
    pageSize: positiveNumberSchema.max(1000, 'PAGE_SIZE_TOO_LARGE').optional()
  }),
  
  create: z.object({
    items: z.array(z.object({
      productId: z.union([z.string(), z.literal('custom')]),
      quantity: positiveNumberSchema,
      price: z.coerce.number().nonnegative().optional()
    })).min(1, 'AT_LEAST_ONE_ITEM'),
    paymentMethod: z.string().trim().optional(),
    paymentMeta: z.record(z.unknown()).optional(),
    notes: z.string().trim().optional()
  }),
  
  update: z.object({
    status: z.string().trim().optional(),
    items: z.array(z.object({
      productId: z.union([z.string(), z.literal('custom')]),
      quantity: positiveNumberSchema,
      price: z.coerce.number().nonnegative().optional()
    })).optional(),
    paymentMeta: z.record(z.unknown()).optional(),
    notes: z.string().trim().optional()
  }),
  
  bulkUpdate: z.object({
    ids: z.array(idSchema).min(1, 'AT_LEAST_ONE_ID'),
    status: z.string().trim().min(1, 'STATUS_REQUIRED')
  })
};

// Product schemas
export const productSchemas = {
  create: z.object({
    name: z.string().trim().min(1, 'NAME_REQUIRED'),
    description: z.string().trim().optional(),
    price: z.coerce.number().nonnegative('PRICE_REQUIRED'),
    categoryId: idSchema.optional(),
    brandId: idSchema.optional(),
    images: z.array(z.string().url()).optional(),
    stock: z.coerce.number().int().nonnegative().optional(),
    isActive: z.boolean().optional()
  }),
  
  update: z.object({
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().optional(),
    price: z.coerce.number().nonnegative().optional(),
    categoryId: idSchema.optional(),
    brandId: idSchema.optional(),
    images: z.array(z.string().url()).optional(),
    stock: z.coerce.number().int().nonnegative().optional(),
    isActive: z.boolean().optional()
  }),
  
  search: z.object({
    q: z.string().trim().optional(),
    category: idSchema.optional(),
    brand: idSchema.optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().nonnegative().optional(),
    page: positiveNumberSchema.optional(),
    pageSize: positiveNumberSchema.max(100).optional()
  })
};

// Category schemas
export const categorySchemas = {
  create: z.object({
    name: z.string().trim().min(1, 'NAME_REQUIRED'),
    description: z.string().trim().optional(),
    parentId: idSchema.optional(),
    isActive: z.boolean().optional()
  }),
  
  update: z.object({
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().optional(),
    parentId: idSchema.optional(),
    isActive: z.boolean().optional()
  })
};

// Cart schemas
export const cartSchemas = {
  setItem: z.object({
    productId: idSchema,
    quantity: positiveNumberSchema
  }),
  
  removeItem: z.object({
    productId: idSchema
  }),
  
  merge: z.object({
    items: z.array(z.object({
      productId: idSchema,
      quantity: positiveNumberSchema
    }))
  })
};

// Wishlist schemas
export const wishlistSchemas = {
  add: z.object({
    productId: idSchema
  }),
  
  remove: z.object({
    productId: idSchema
  })
};

// Review schemas
export const reviewSchemas = {
  create: z.object({
    productId: idSchema,
    rating: z.coerce.number().int().min(1, 'MIN_RATING').max(5, 'MAX_RATING'),
    comment: z.string().trim().optional()
  }),
  
  moderate: z.object({
    action: z.enum(['approve', 'reject', 'delete'])
  })
};

// Settings schemas
export const settingsSchemas = {
  update: z.object({
    storeName: z.string().trim().min(1).optional(),
    storeDescription: z.string().trim().optional(),
    contactEmail: emailSchema.optional(),
    contactPhone: phoneSchema.optional(),
    socialLinks: z.record(z.string().url()).optional(),
    theme: z.record(z.unknown()).optional()
  })
};

// Payment schemas
export const paymentSchemas = {
  bankConfirm: z.object({
    orderId: idSchema,
    reference: z.string().trim().min(1, 'REFERENCE_REQUIRED')
  }),
  
  bankReject: z.object({
    orderId: idSchema,
    reason: z.string().trim().min(1, 'REASON_REQUIRED')
  })
};

// User management schemas (admin)
export const userSchemas = {
  create: z.object({
    email: emailSchema,
    password: passwordSchema,
    name: z.string().trim().min(1, 'NAME_REQUIRED'),
    role: z.enum(['user', 'admin', 'seller'])
  }),
  
  update: z.object({
    name: z.string().trim().min(1).optional(),
    email: emailSchema.optional(),
    role: z.enum(['user', 'admin', 'seller']).optional(),
    isActive: z.boolean().optional()
  })
};
