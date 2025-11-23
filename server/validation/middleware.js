import { ZodError } from 'zod';

/**
 * Validation middleware factory
 * @param {Object} schema - Zod schema to validate against
 * @param {string} source - Request body source ('body', 'query', 'params')
 * @returns {Function} Express middleware
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      let data;
      
      switch (source) {
        case 'query':
          data = req.query;
          break;
        case 'params':
          data = req.params;
          break;
        case 'body':
        default:
          data = req.body || {};
          break;
      }

      const result = schema.safeParse(data);
      
      if (!result.success) {
        const errors = result.error.flatten();
        
        // Format error response for better frontend handling
        const formattedErrors = {
          fieldErrors: errors.fieldErrors,
          formErrors: errors.formErrors
        };
        
        return res.status(400).json({
          ok: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          fields: formattedErrors
        });
      }
      
      // Replace the source data with validated data
      switch (source) {
        case 'query':
          req.query = result.data;
          break;
        case 'params':
          req.params = result.data;
          break;
        case 'body':
        default:
          req.body = result.data;
          break;
      }
      
      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      
      if (error instanceof ZodError) {
        const errors = error.flatten();
        return res.status(400).json({
          ok: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          fields: {
            fieldErrors: errors.fieldErrors,
            formErrors: errors.formErrors
          }
        });
      }
      
      // For unexpected errors
      return res.status(500).json({
        ok: false,
        error: 'INTERNAL_ERROR',
        message: 'Validation failed unexpectedly'
      });
    }
  };
};

/**
 * Async validation middleware for complex validations
 * @param {Function} validator - Async validation function
 * @returns {Function} Express middleware
 */
export const validateAsync = (validator) => {
  return async (req, res, next) => {
    try {
      await validator(req);
      next();
    } catch (error) {
      if (error.code === 'VALIDATION_ERROR') {
        return res.status(400).json({
          ok: false,
          error: 'VALIDATION_ERROR',
          message: error.message,
          fields: error.fields
        });
      }
      
      console.error('Async validation error:', error);
      return res.status(500).json({
        ok: false,
        error: 'INTERNAL_ERROR',
        message: 'Validation failed unexpectedly'
      });
    }
  };
};

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  constructor(message, fields = {}) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
    this.fields = fields;
  }
}
