import sharp from 'sharp';
import LogService from './log-service';
import S3Service from './s3-service';
import ImageUtil from '../utils/image-util';
import ImageResizeRequest from '../domain/image-resize-request';
import { HttpError, HttpValidationError } from '../errors/http-error';

export const DEFAULT_JPG_QUALITY = 80;
export const DEFAULT_CHROMA_SUB_SAMPLING = '4:4:4';

export default class ImageService {
  /* istanbul ignore next */
  constructor({
    log = new LogService(),
    s3Service = new S3Service({ log }),
  }) {
    this.log = log;
    this.s3Service = s3Service;
  }

  /**
   * Process an image resize request
   * @param {object} attributes
   * @returns {Promise<Object>}
   */
  async process(attributes) {
    if (!attributes) {
      throw new HttpError('body.data.attributes required', 400);
    }

    const { error: validationError } = ImageResizeRequest.CONSTRAINTS.validate(attributes);

    if (validationError) {
      throw new HttpValidationError(validationError.details);
    }

    let inputBuffer;

    try {
      inputBuffer = await this.s3Service.getObject({
        key: attributes.input.key,
      });
    } catch (e) {
      this.log.warn(`Error loading key ${attributes.input.key} from S3`, e);
      throw new HttpError(`Error loading key '${attributes.input.key}' from S3`, 404);
    }

    const results = [];

    this.log.info('process', attributes);

    // Perform a single operation at a time
    for (const operation of attributes.operations) {
      const event = await this.resize({ // eslint-disable-line no-await-in-loop
        buffer: inputBuffer,
        outputFilename: attributes.output.key,
        quality: operation.quality || attributes.output.quality,
        chromaSubsampling: operation.chromaSubsampling || attributes.output.chromaSubsampling,
        maxWidth: operation.maxWidth || undefined,
        maxHeight: operation.maxHeight || undefined,
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
   * @returns {Promise<object>}
   */
  async resize({
    buffer,
    outputFilename,
    quality = DEFAULT_JPG_QUALITY,
    chromaSubsampling = DEFAULT_CHROMA_SUB_SAMPLING,
    maxWidth,
    maxHeight,
  }) {
    const startTime = new Date();
    const metaData = await ImageUtil.getMetaData(buffer);

    this.log.info('resize', {
      maxWidth,
      maxHeight,
      srcWidth: metaData.width,
      srcHeight: metaData.height,
    });

    const {
      width: newWidth,
      height: newHeight,
    } = ImageUtil.calculateAspectRatioFit({
      srcWidth: metaData.width,
      srcHeight: metaData.height,
      maxWidth,
      maxHeight,
    });

    this.log.info('Resize image', {
      srcWidth: metaData.width,
      srcHeight: metaData.height,
      newWidth,
      newHeight,
    });

    const outputBuffer = await sharp(buffer)
      .resize(newWidth, newHeight)
      .normalise(true)
      .sharpen()
      .flatten()
      .jpeg({
        quality,
        chromaSubsampling,
      })
      .toBuffer();

    const key = `${outputFilename}-${newWidth}x${newHeight}.jpg`;
    const url = await this.s3Service.putObject({
      buffer: outputBuffer,
      key,
    });

    const { size } = await ImageUtil.getMetaData(outputBuffer);

    return {
      url,
      meta: {
        processingTime: `${((new Date() - startTime) / 1000).toFixed(2)} sec`,
        size,
        srcWidth: metaData.width,
        srcHeight: metaData.height,
        newWidth,
        newHeight,
      },
    };
  }
}
