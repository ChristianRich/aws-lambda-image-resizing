import express from 'express';
import ImageService from '../services/image-service';
import S3Service from '../services/s3-service';
import { jsonError } from '../errors/http-error';

const router = express.Router();

router.use((req, res, next) => {
  res.jsonError = error => jsonError(res, error);
  next();
});

router.post('/', async (req, res) => {
  const {
    body: {
      data: {
        attributes,
      } = {},
    } = {},
  } = req;

  try {
    const imageService = new ImageService({ log: req.log });
    const response = await imageService.process(attributes);

    res.send({
      data: response.map(x => ({
        type: 'image-processing-operation',
        attributes: x,
      })),
    });
  } catch (e) {
    req.log.warn('Image resizing failed', e, attributes);
    res.jsonError(e);
  }
});

router.post('/getSignedUrl', async (req, res) => {
  const {
    body: {
      data: {
        attributes,
      } = {},
    } = {},
  } = req;

  try {
    const s3Service = new S3Service({ log: req.log });
    const url = await s3Service.getSignedUrl(attributes);
    res.json({
      data: {
        type: 's3-signed-url',
        attributes: {
          ...url,
        },
      },
    });
  } catch (e) {
    req.log.warn('getSignedUrl failed', e);
    res.jsonError(e);
  }
});

export default router;
