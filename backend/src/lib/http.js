const { z } = require('zod');

class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Parse untrusted input with a zod schema, turning failures into a 400.
function parse(schema, data) {
  const result = schema.safeParse(data ?? {});
  if (!result.success) {
    const issues = result.error.issues;
    throw new HttpError(400, issues[0]?.message || 'Invalid request', z.flattenError(result.error).fieldErrors);
  }
  return result.data;
}

// Escape LIKE wildcards so user searches are matched literally.
function likePattern(search) {
  return `%${search.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

function paginate(total, page, limit) {
  return { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) };
}

module.exports = { HttpError, parse, likePattern, paginate };
