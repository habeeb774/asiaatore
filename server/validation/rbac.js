// Role definitions matching Prisma schema
export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SELLER: 'seller',
  DELIVERY: 'delivery', // Added for delivery drivers
  GUEST: 'guest'
} ;

// Role hierarchy for permission inheritance
export const ROLE_HIERARCHY = {
  [ROLES.GUEST]: [],
  [ROLES.USER]: [ROLES.GUEST],
  [ROLES.SELLER]: [ROLES.USER, ROLES.GUEST],
  [ROLES.DELIVERY]: [ROLES.USER, ROLES.GUEST],
  [ROLES.ADMIN]: [ROLES.SELLER, ROLES.DELIVERY, ROLES.USER, ROLES.GUEST]
};

// Permission sets
export const PERMISSIONS = {
  // Product permissions
  READ_PRODUCTS: 'read:products',
  CREATE_PRODUCTS: 'create:products',
  UPDATE_PRODUCTS: 'update:products',
  DELETE_PRODUCTS: 'delete:products',
  
  // Order permissions
  READ_OWN_ORDERS: 'read:own:orders',
  READ_ALL_ORDERS: 'read:all:orders',
  UPDATE_ORDERS: 'update:orders',
  DELETE_ORDERS: 'delete:orders',
  
  // User permissions
  READ_OWN_PROFILE: 'read:own:profile',
  UPDATE_OWN_PROFILE: 'update:own:profile',
  READ_USERS: 'read:users',
  UPDATE_USERS: 'update:users',
  DELETE_USERS: 'delete:users',
  
  // Category permissions
  READ_CATEGORIES: 'read:categories',
  CREATE_CATEGORIES: 'create:categories',
  UPDATE_CATEGORIES: 'update:categories',
  DELETE_CATEGORIES: 'delete:categories',
  
  // Settings permissions
  READ_SETTINGS: 'read:settings',
  UPDATE_SETTINGS: 'update:settings',
  
  // Analytics permissions
  READ_ANALYTICS: 'read:analytics',
  
  // Delivery permissions
  MANAGE_DELIVERY: 'manage:delivery',
  ASSIGN_DELIVERY: 'assign:delivery',
  
  // Review permissions
  READ_REVIEWS: 'read:reviews',
  CREATE_REVIEWS: 'create:reviews',
  MODERATE_REVIEWS: 'moderate:reviews'
};

// Role to permissions mapping
export const ROLE_PERMISSIONS = {
  [ROLES.GUEST]: [
    PERMISSIONS.READ_PRODUCTS,
    PERMISSIONS.READ_CATEGORIES
  ],
  
  [ROLES.USER]: [
    PERMISSIONS.READ_PRODUCTS,
    PERMISSIONS.CREATE_PRODUCTS, // For custom orders
    PERMISSIONS.READ_OWN_ORDERS,
    PERMISSIONS.READ_OWN_PROFILE,
    PERMISSIONS.UPDATE_OWN_PROFILE,
    PERMISSIONS.READ_CATEGORIES,
    PERMISSIONS.READ_REVIEWS,
    PERMISSIONS.CREATE_REVIEWS
  ],
  
  [ROLES.SELLER]: [
    PERMISSIONS.READ_PRODUCTS,
    PERMISSIONS.CREATE_PRODUCTS,
    PERMISSIONS.UPDATE_PRODUCTS,
    PERMISSIONS.READ_OWN_ORDERS,
    PERMISSIONS.READ_OWN_PROFILE,
    PERMISSIONS.UPDATE_OWN_PROFILE,
    PERMISSIONS.READ_CATEGORIES,
    PERMISSIONS.READ_REVIEWS,
    PERMISSIONS.CREATE_REVIEWS
  ],
  
  [ROLES.DELIVERY]: [
    PERMISSIONS.READ_PRODUCTS,
    PERMISSIONS.READ_OWN_ORDERS,
    PERMISSIONS.READ_OWN_PROFILE,
    PERMISSIONS.UPDATE_OWN_PROFILE,
    PERMISSIONS.READ_CATEGORIES,
    PERMISSIONS.MANAGE_DELIVERY,
    PERMISSIONS.READ_ANALYTICS
  ],
  
  [ROLES.ADMIN]: [
    // Admin has all permissions
    ...Object.values(PERMISSIONS)
  ]
};

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean} Whether the role has the permission
 */
export const hasPermission = (role, permission) => {
  const rolePerms = ROLE_PERMISSIONS[role] || [];
  return rolePerms.includes(permission);
};

/**
 * Check if a role has any of the specified permissions
 * @param {string} role - User role
 * @param {string[]} permissions - Permissions to check
 * @returns {boolean} Whether the role has any of the permissions
 */
export const hasAnyPermission = (role, permissions) => {
  return permissions.some(permission => hasPermission(role, permission));
};

/**
 * Check if a role has all of the specified permissions
 * @param {string} role - User role
 * @param {string[]} permissions - Permissions to check
 * @returns {boolean} Whether the role has all permissions
 */
export const hasAllPermissions = (role, permissions) => {
  return permissions.every(permission => hasPermission(role, permission));
};

/**
 * Check if a role can access another role's resources
 * @param {string} userRole - User's role
 * @param {string} targetRole - Target role to check
 * @returns {boolean} Whether the user role can access target role resources
 */
export const canAccessRole = (userRole, targetRole) => {
  const accessibleRoles = ROLE_HIERARCHY[userRole] || [];
  return accessibleRoles.includes(targetRole);
};

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {string[]} Array of permissions
 */
export const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Middleware to require specific permissions
 * @param {string|string[]} permissions - Required permissions
 * @returns {Function} Express middleware
 */
export const requirePermission = (permissions) => {
  const requiredPerms = Array.isArray(permissions) ? permissions : [permissions];
  
  return (req, res, next) => {
    const userRole = req.user?.role || ROLES.GUEST;
    
    if (!hasAnyPermission(userRole, requiredPerms)) {
      return res.status(403).json({
        ok: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to perform this action',
        required: requiredPerms,
        userRole
      });
    }
    
    next();
  };
};

/**
 * Middleware to require specific role(s)
 * @param {string|string[]} roles - Required role(s)
 * @returns {Function} Express middleware
 */
export const requireRole = (roles) => {
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    const userRole = req.user?.role;
    
    if (!userRole || !requiredRoles.includes(userRole)) {
      return res.status(403).json({
        ok: false,
        error: 'INSUFFICIENT_ROLE',
        message: 'You do not have the required role to perform this action',
        required: requiredRoles,
        userRole
      });
    }
    
    next();
  };
};

/**
 * Middleware to require minimum role level (based on hierarchy)
 * @param {string} minimumRole - Minimum required role
 * @returns {Function} Express middleware
 */
export const requireMinimumRole = (minimumRole) => {
  return (req, res, next) => {
    const userRole = req.user?.role || ROLES.GUEST;
    const accessibleRoles = ROLE_HIERARCHY[minimumRole] || [];
    
    // User must be the minimum role or higher (can access the minimum role)
    if (!accessibleRoles.includes(userRole) && userRole !== minimumRole) {
      return res.status(403).json({
        ok: false,
        error: 'INSUFFICIENT_ROLE_LEVEL',
        message: 'Your role level is insufficient for this action',
        minimumRole,
        userRole
      });
    }
    
    next();
  };
};

/**
 * Middleware to check if user can access their own resources
 * @param {string} resourceUserIdParam - Parameter name for resource owner user ID
 * @returns {Function} Express middleware
 */
export const requireOwnership = (resourceUserIdParam = 'userId') => {
  return (req, res, next) => {
    const userRole = req.user?.role || ROLES.GUEST;
    const userId = req.user?.id;
    const resourceUserId = req.params[resourceUserIdParam] || req.body[resourceUserIdParam];
    
    // Admin can access any resource
    if (userRole === ROLES.ADMIN) {
      return next();
    }
    
    // Users can only access their own resources
    if (userId !== resourceUserId) {
      return res.status(403).json({
        ok: false,
        error: 'ACCESS_DENIED',
        message: 'You can only access your own resources'
      });
    }
    
    next();
  };
};
