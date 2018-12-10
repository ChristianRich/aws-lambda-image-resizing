import sharp from 'sharp';
import fileSize from 'filesize';
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

    const { error } = ImageResizeRequest.CONSTRAINTS.validate(attributes);

    if (error) {
      throw new HttpValidationError(error.details);
    }

    this.log.info('process', attributes);

    let inputBuffer;

    try {
      inputBuffer = await this.s3Service.getObject({
        key: attributes.input.key,
      });
    } catch (e) {
      this.log.warn(`Error loading key ${attributes.input.key} from S3`, e);
      throw new HttpError(`Error loading key '${attributes.input.key}' from S3`, 404);
    }

    await ImageUtil.validate(inputBuffer);

    const promises = attributes.operations.map(operation => this.resize({
      buffer: inputBuffer,
      outputFilename: attributes.output.key,
      quality: operation.quality || attributes.output.quality,
      chromaSubsampling: operation.chromaSubsampling || attributes.output.chromaSubsampling,
      width: operation.width || undefined,
      height: operation.height || undefined,
      maxWidth: operation.maxWidth || undefined,
      maxHeight: operation.maxHeight || undefined,
    }));

    return Promise.all(promises);
  }

  /**
   * Resize a single image buffer
   * @param {object} param
   * @param {buffer} buffer
   * @param {string} outputFilename
   * @param {number} quality
   * @param {string} chromaSubsampling
   * @param {number} width
   * @param {number} height
   * @param {number} maxWidth - Takes precedence over width and automatically calculates the height keeping the source aspect ratio
   * @param {number} maxHeight - Takes precedence over height and automatically calculates the width keeping the source aspect ratio
   * @returns {Promise<object>}
   */
  async resize({
    buffer,
    outputFilename,
    quality = DEFAULT_JPG_QUALITY,
    chromaSubsampling = DEFAULT_CHROMA_SUB_SAMPLING,
    width,
    height,
    maxWidth,
    maxHeight,
  }) {
    const startTime = new Date();
    const metaData = await ImageUtil.getMetaData(buffer);
    const {
      width: newWidth,
      height: newHeight,
    } = ImageUtil.calculateAspectRatioFit({
      srcWidth: metaData.width,
      srcHeight: metaData.height,
      maxWidth,
      maxHeight,
    });

    const outputBuffer = await sharp(buffer)
      .resize(width || newWidth, height || newHeight)
      .jpeg({
        quality,
        chromaSubsampling,
      })
      .toBuffer();

    const prefix = `${new Date().getFullYear()}/${new Date().getMonth() + 1}`;
    const key = `${outputFilename}-${newWidth}x${newHeight}.jpg`;
    const urls = await this.s3Service.putObject({
      buffer: outputBuffer,
      key,
      prefix,
    });

    const { size } = await ImageUtil.getMetaData(outputBuffer);

    const meta = {
      ...urls,
      meta: {
        processingTime: `${((new Date() - startTime) / 1000).toFixed(2)} sec`,
        sizeReduction: `${(((metaData.size - size) / metaData.size) * 100).toFixed(2)}%`,
        input: {
          width: metaData.width,
          height: metaData.height,
          size: fileSize(metaData.size),
        },
        output: {
          width: newWidth,
          height: newHeight,
          size: fileSize(size),
        },
      },
    };

    this.log.info('Image operation complete', meta);
    return meta;
  }
}
