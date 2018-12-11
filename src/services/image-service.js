import sharp from 'sharp';
import fileSize from 'filesize';
import omit from 'lodash/omit';
import LogService from './log-service';
import S3Service from './s3-service';
import ImageUtil from '../utils/image-util';
import Image from '../domain/image';
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
   * Process an image resize request and returns an array of image operation stats
   * @param {ImageResizeRequest} attributes
   * @returns {Promise<Object[]>}
   */
  async process(attributes) {
    if (!attributes) {
      throw new HttpError('body.data.attributes required', 400);
    }

    const { error } = ImageResizeRequest.CONSTRAINTS.validate(attributes);

    if (error) {
      throw new HttpValidationError(error.details);
    }

    const buffer = await this.s3Service.getObject({ key: attributes.input.key });
    const inputImage = new Image({ buffer });
    await inputImage.validate();

    this.log.info('processing image resize request', {
      attributes,
      source: omit(inputImage, ['buffer', 'exif', 'icc']),
    });

    return Promise.all(attributes.operations.map(operation => this.resize({
      buffer,
      outputFilename: attributes.output.key,
      quality: operation.quality || attributes.output.quality,
      chromaSubsampling: operation.chromaSubsampling || attributes.output.chromaSubsampling,
      ...operation,
    })));
  }

  /**
   * Resize a single image buffer, saves to S3 and returns a stat object
   * @param {object} param
   * @param {buffer} buffer
   * @param {string} outputFilename
   * @param {number} width - Static width. Warning: Can skew aspect ratio if height is incorrect
   * @param {number} height - Static height. Warning: Can skew aspect ratio if width is incorrect
   * @param {number} maxWidth - Maximum width. Automatically calculates the corresponding height maintaining aspect ratio
   * @param {number} maxHeight - Maximum height. Automatically calculates the corresponding width maintaining aspect ratio
   * @param {number} [quality=80] - jpg quality 0 - 100
   * @param {string} [chromaSubsampling='4:4:4']
   * @param {string} [tag] - Tagging the output with an arbitraty string e.g "thumbnail"
   * @returns {Promise<object>} - Returns stats / info about the image resize operations carried out
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
    tag,
  }) {
    const startTime = new Date();
    const metaDataInput = await ImageUtil.getMetaData(buffer);

    let newWidth;
    let newHeight;

    if (width && height) {
      newWidth = width;
      newHeight = height;
    } else {
      const autoDimensions = ImageUtil.calculateAspectRatioFit({
        srcWidth: metaDataInput.width,
        srcHeight: metaDataInput.height,
        maxWidth,
        maxHeight,
      });

      newWidth = autoDimensions.width;
      newHeight = autoDimensions.height;
    }

    let outputBuffer;

    // Only resize the image if new dimensions are smaller than the original image dimensions
    if (newWidth < metaDataInput.width && newHeight < metaDataInput.height) {
      outputBuffer = await sharp(buffer)
        .resize(newWidth, newHeight)
        .jpeg({
          quality,
          chromaSubsampling,
        })
        .toBuffer();
    } else {
      outputBuffer = buffer; // Skip resize (avoid upscaling)
    }

    const metaDataOutput = await ImageUtil.getMetaData(outputBuffer);
    const prefix = `${new Date().getFullYear()}/${new Date().getMonth() + 1}`;
    const key = `${outputFilename}-${metaDataOutput.width}x${metaDataOutput.height}.jpg`;

    const urls = await this.s3Service.putObject({
      buffer: outputBuffer,
      key,
      prefix,
    });

    const meta = {
      ...urls,
      meta: {
        processingTime: `${((new Date() - startTime) / 1000).toFixed(2)} sec`,
        sizeReduction: `${(((metaDataInput.size - metaDataOutput.size) / metaDataInput.size) * 100).toFixed(2)}%`,
        tag,
        input: {
          width: metaDataInput.width,
          height: metaDataInput.height,
          size: fileSize(metaDataInput.size),
        },
        output: {
          width: metaDataOutput.width,
          height: metaDataOutput.height,
          size: fileSize(metaDataOutput.size),
        },
      },
    };

    this.log.info('Image operation complete', meta);
    return meta;
  }
}
