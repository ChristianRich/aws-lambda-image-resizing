/* istanbul ignore file */
import uuidV4 from 'uuid/v4';

export default class TraceService {
  static middleware({ header, query } = {}) {
    const headerKey = header || 'x-correlation-id';
    const queryKey = query || 'cid';

    return (req, res, next) => {
      let cid;

      if (req.get(headerKey)) {
        // Try to read the cid from the header
        cid = req.get(headerKey);
      } else if (req.query[queryKey]) {
        // Else try to read the cid from the query string
        cid = req.query[queryKey];
      }

      // No cid found, generate a new one
      if (!cid) cid = uuidV4();

      // Set the cid into the request context
      req.cid = cid;

      // Set the cid into the response header
      res.set(headerKey, cid);

      next();
    };
  }
}
