class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  
  let errorResponse = {
    success: false,
    message: err.message || 'An internal database orchestrator error occurred'
  };

  // Log strict error traceback in non-production
  console.error('API Error Traced: ', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  // MS SQL Server specific constraint error mappings
  if (err.number) {
    switch (err.number) {
      case 2627: // Unique constraint violation
      case 2601: // Unique index
        errorResponse.message = 'Constraint Violation: Element with similar credentials already registered';
        err.statusCode = 409;
        break;
      case 547: // Foreign key constraint violation
        errorResponse.message = 'Integrity Conflict: Active element holds foreign dependencies';
        err.statusCode = 409;
        break;
      case 8152: // String or binary data would be truncated
        errorResponse.message = 'Input length exceeds target schema bounds';
        err.statusCode = 400;
        break;
    }
  }

  // JWT Specific errors
  if (err.name === 'JsonWebTokenError') {
    errorResponse.message = 'Access session signature is invalid or expired';
    err.statusCode = 401;
  }
  if (err.name === 'TokenExpiredError') {
    errorResponse.message = 'Access session expired. Please sign in again.';
    err.statusCode = 401;
  }

  return res.status(err.statusCode).json(errorResponse);
};

export { AppError, errorHandler };
export default errorHandler;
