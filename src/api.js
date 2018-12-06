/* istanbul ignore file */
import awsServerlessExpress from 'aws-serverless-express';
import express from 'express';
import imageController from './controllers/image-controller';
import LogService from './services/log-service';
import TraceService from './services/trace-service';
import { jsonError } from './errors/http-error';

const app = express();
app.disable('x-powered-by');

const server = awsServerlessExpress.createServer(app);

const getLogDetails = req => ({
  host: req.get('host'),
  path: req.path,
  query: req.query,
  headers: req.headers,
});

app
  .use(express.json({ limit: '10mb' }))
  .use(express.urlencoded({ limit: '10mb' }))
  .use(TraceService.middleware())
  .use(LogService.middleware())
  .use((req, res, next) => {
    req.log.debug('Processing request', getLogDetails(req));
    res.jsonError = error => jsonError(res, error);
    next();
  })
  .use(['/resize', '/'], imageController)
  .use((err, req, res, next) => {
    if (!req.log) req.log = new LogService({ cid: req.cid });
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
        meta: { cid: req.log.cid },
      }],
    });

    next(err);
  });

exports.handler = (event, context) => awsServerlessExpress.proxy(server, event, context);
