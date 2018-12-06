/* istanbul ignore file */
import express from 'express';
import imageController from './controllers/image-controller';
import TraceService from './services/trace-service';
import LogService from './services/log-service';

const app = express();
app.disable('x-powered-by');

const getLogDetails = req => ({
  host: req.get('host'),
  path: req.path,
  query: req.query,
  headers: req.headers,
});

app.use(express.json())
  .use(TraceService.middleware())
  .use(LogService.middleware())
  .use((req, res, next) => {
    req.log.debug('Processing request', getLogDetails(req));
    next();
  })
  .use(['/resize', '/'], imageController)
  .use((err, req, res, next) => { // eslint-disable-line
    req.log.error('Request processing error', err, getLogDetails(req));

    // Catch invalid JSON error thrown from body parser
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      res.status(400).json({
        errors: [{
          status: 400,
          title: `Invalid JSON: ${err.message}`,
        }],
      });

      return;
    }

    res.status(500).json({
      errors: [{
        status: 500,
        title: 'Internal server error',
        meta: {
          cid: req.log.cid,
        },
      }],
    });
  });

app.listen(3000, () => console.log('App listening on port 3000!')); // eslint-disable-line no-console
