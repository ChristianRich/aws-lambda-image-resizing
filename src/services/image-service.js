import sharp from 'sharp';
import LogService from './log-service';
import S3Service from './s3-service';
import ImageUtils from '../util/image';
import { HttpError } from '../errors/http-error';

export default class ImageService {
  constructor({
    log = new LogService(),
    s3Service = new S3Service({ log }),
  }) {
    this.log = log;
    this.s3Service = s3Service;
  }

  /**
   * Resize a file from a buffer
   */
  async bulkResize(attributes) {
    if (!attributes) {
      throw new HttpError('attributes required', 400);
    }
    const inputBuffer = await this.s3Service.getObject({
      key: attributes.input.key, // test.jpg
    });

    if (!inputBuffer) {
      throw new HttpError('File in S3 not found', 404);
    }

    const results = [];

    this.log.info('resize', attributes);

    for (const size of attributes.sizes) {
      const event = await this.resize({ // eslint-disable-line no-await-in-loop
        buffer: inputBuffer,
        filename: attributes.output.key,
        quality: attributes.output.quality,
        chromaSubsampling: attributes.output.chromaSubsampling,
        maxWidth: size.maxWidth || undefined,
        maxHeight: size.maxHeight || undefined,
      });

      results.push(event);
    }

    return results;
  }

  /**
   * Resize a single image buffer
   * @param {object} param
   * @param {buffer} buffer
   * @param {string} filename
   * @param {number} quality
   * @param {string} chromaSubsampling
   * @param {number} maxWidth
   * @param {number} maxHeight
   * @returns {Promise<Buffer>}
   */
  async resize({
    buffer,
    filename,
    quality = 80,
    chromaSubsampling = '4:4:4',
    maxWidth,
    maxHeight,
  }) {
    const dimensions = ImageUtils.getDimensions(buffer);

    this.log.info('resize', {
      maxWidth,
      maxHeight,
      srcWidth: dimensions.width,
      srcHeight: dimensions.height,
    });

    const { width, height } = ImageUtils.calculateAspectRatioFit({
      srcWidth: dimensions.width,
      srcHeight: dimensions.height,
      maxWidth,
      maxHeight,
    });

    this.log.info('Resize image', {
      srcWidth: dimensions.width,
      srcHeight: dimensions.height,
      newWidth: width,
      newHeight: height,
    });

    // TODO review operations
    const outputBuffer = await sharp(buffer)
      .resize(width, height)
      .normalise(true)
      .sharpen()
      .flatten()
      .jpeg({
        quality,
        chromaSubsampling,
      })
      .toBuffer();

    const key = `${filename}-${width}x${height}.jpg`;
    const s3Upload = await this.s3Service.putObject({
      buffer: outputBuffer,
      key,
    });

    return {
      srcWidth: dimensions.width,
      srcHeight: dimensions.height,
      newWidth: width,
      newHeight: height,
      s3Upload,
      key,
    };
  }
}
