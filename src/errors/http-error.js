/* istanbul ignore file */
import { STATUS_CODES } from 'http';

export class HttpError extends Error {
  constructor(message = STATUS_CODES[500], status = 500, details) {
    super(message);
    this.status = status;
    this.details = details;
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}

export class HttpValidationError extends HttpError {
  constructor(details) {
    super('Validation error', 400, details);
  }
}

/**
 * Throw errors when a required field is missing or when the datatype is unexpected.
 * Usage examples:
 * if (!email) throw new HttpParamError('email'); // "Email is required"
 * if (typeof email !== 'string') throw new HttpParamError('email', String); // "Expected type String for param email"
 * if (!customer) throw new HttpParamError('customer', Customer); // "Expected type Customer for param customer".
 */
export class HttpParamError extends HttpError {
  /**
   * @param {string} param - name of faulty param e.g "email"
   * @param {number} [status] - Http status. Defaults to 400
   * @param {*} [type] - Data type e.g "String", String or MyCustomClass
   */
  constructor(param, type, status = 400) {
    let typeAsString;

    if (typeof type === 'string') {
      typeAsString = type;
    } else if (type.constructor && typeof type.name === 'string') {
      typeAsString = type.name;
    }

    super(typeAsString ? `Expected type ${typeAsString} for param ${param}` : `${param} is required`, status);
  }
}

export function jsonError(res, error = {}) {
  const { name, message = STATUS_CODES[500] } = error;
  let status = 500;
  let errors = [];

  switch (name) {
    case 'RequestError':
      errors.push({
        status,
        title: message,
        meta: error.error,
      });
      break;
    case 'StatusCodeError':
      status = error.statusCode;
      if (error.error && Array.isArray(error.error.errors)) {
        errors = error.error.errors;
      } if (error.error && error.error.errorMessage) {
        // Format Tranxactor error nicely
        errors.push({
          status,
          title: error.error.errorMessage,
          meta: error.error,
        });
      } else {
        errors.push({
          status,
          title: message,
          meta: error.error,
        });
      }
      break;
    case 'HttpError':
      status = error.status;
      errors.push({ status, title: message, meta: error.details });
      break;
    case 'HttpValidationError':
      status = error.status;
      if (Array.isArray(error.details)) {
        errors = error.details.map(detail => ({
          status,
          title: detail.message,
          meta: detail.context,
        }));
      } else {
        errors.push({ status, title: message, meta: error.details });
      }
      break;
    default:
      errors.push({ status, title: message });
  }

  res.status(status || 500).json({ errors });
}
