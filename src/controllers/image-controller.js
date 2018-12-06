import express from 'express';
import multer from 'multer';
import ImageService from '../services/image-service';
import S3Service from '../services/s3-service';
import { jsonError } from '../errors/http-error';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
}).single('image');

router.use((req, res, next) => {
  res.jsonError = error => jsonError(res, error);
  next();
});

router.post('/', upload, async (req, res) => {
  try {
    const imageService = new ImageService({ log: req.log });
    const response = await imageService.resize(req.file);
    let objective;

    if (req.objective) {
      objective = JSON.parse(req.objective);
    }

    res.send({
      data: {
        type: 'image-upload',
        response,
        objective,
      },
    });
  } catch (e) {
    req.log.warn('Image resizing failed', e, { file: req.file ? req.file.originalname : undefined });
    res.jsonError(e);
  }
});

router.get('/getSignedUrl', async (req, res) => {
  try {
    const s3Service = new S3Service({ log: req.log });
    const url = await s3Service.getSignedUrl();
    res.json({
      url,
    });
  } catch (e) {
    req.log.warn('getSignedUrl failed', e);
    res.jsonError(e);
  }
});

router.get('/env', async (req, res) => {
  const o = {};

  Object.keys(process.env).forEach(key => {
    if (!key.includes('npm_')) {
      o[key] = process.env[key];
    }
  });

  res.json(o);
});

router.get('/ping', async (req, res) => {
  res.send('200 OK');
});

export default router;
