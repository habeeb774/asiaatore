// Centralized error handler middleware: maps common error codes to structured JSON
export function errorHandler(err, req, res, next) {
   
  console.error('[API Error]', { id: req.id, path: req.originalUrl, err });

  if (res.headersSent) return next(err);

  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Unexpected server error';

  if (err && typeof err === 'object') {
    // Body parser JSON errors (invalid JSON payload)
    // express.json/body-parser sets err.type = 'entity.parse.failed' and typically err.status = 400
    const isJsonParseError = (err.type === 'entity.parse.failed') || (err instanceof SyntaxError && err.status === 400);
    if (isJsonParseError) {
      status = 400; code = 'BAD_JSON'; message = 'Invalid JSON payload';
    } else
    // Prisma error mapping
    if (err.code && /^P20\d{2}$/.test(err.code)) {
      switch (err.code) {
        case 'P2002':
          status = 409; code = 'UNIQUE_CONSTRAINT'; message = 'Resource already exists (unique constraint).'; break;
        case 'P2025':
          status = 404; code = 'NOT_FOUND'; message = 'Requested resource not found.'; break;
        case 'P2003':
          status = 400; code = 'FK_CONSTRAINT'; message = 'Foreign key constraint failed.'; break;
        default:
          status = 400; code = err.code; message = 'Database operation failed.';
      }
    } else if (err.name === 'ValidationError') {
      status = 400; code = 'VALIDATION_ERROR'; message = err.message || 'Invalid input.';
    } else if (err.status && err.code) {
      // Custom thrown errors with status/code from services
      status = err.status; code = err.code; message = err.message || message;
    }
  }

  const isProd = process.env.NODE_ENV === 'production';
  const debugEnabled = process.env.DEBUG_ERRORS === 'true';
  const payload = { error: code, message, requestId: req.id };
  if (!isProd && debugEnabled) {
    payload.debug = { originalMessage: err.message, stack: err.stack };
  }
  res.status(status).json(payload);
}

export default errorHandler;
