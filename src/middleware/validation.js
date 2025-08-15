/**
 * Middleware for validating request parameters
 */

const validatePaginationParams = (req, res, next) => {
  const { page, limit } = req.query;

  // Validate page parameter
  if (page !== undefined) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        error: 'Invalid page parameter',
        message: 'Page must be a positive integer'
      });
    }
    if (pageNum > 1000) {
      return res.status(400).json({
        error: 'Invalid page parameter',
        message: 'Page number too large (max: 1000)'
      });
    }
  }

  // Validate limit parameter
  if (limit !== undefined) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({
        error: 'Invalid limit parameter',
        message: 'Limit must be a positive integer'
      });
    }
    if (limitNum > 100) {
      return res.status(400).json({
        error: 'Invalid limit parameter',
        message: 'Limit too large (max: 100)'
      });
    }
  }

  next();
};

module.exports = {
  validatePaginationParams
};
