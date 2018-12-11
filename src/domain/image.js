import ImageUtil from '../utils/image-util';
import { HttpError } from '../errors/http-error';

export default class Image {
  constructor({
    buffer,
    maxFileSizeMb = process.env.MAX_FILE_SIZE_MB,
    maxWidthPixels = process.env.MAX_WIDTH_PIXELS,
    maxHeightPixels = process.env.MAX_HEIGHT_PIXELS,
    allowedImageTypes = process.env.ALLOWED_IMAGE_TYPES,
  } = {}) {
    this.buffer = buffer;
    this.maxFileSizeMb = parseInt(maxFileSizeMb, 10);
    this.maxWidthPixels = parseInt(maxWidthPixels, 10);
    this.maxHeightPixels = parseInt(maxHeightPixels, 10);

    if (typeof allowedImageTypes === 'string') {
      this.allowedImageTypes = allowedImageTypes.split(',');
    }

    if (!(buffer instanceof Buffer)) {
      throw new Error('Type buffer expected for param buffer');
    }

    if (typeof this.maxFileSizeMb !== 'number') {
      throw new Error('Required: MAX_FILE_SIZE_MB');
    }

    if (typeof this.maxWidthPixels !== 'number') {
      throw new Error('Required: MAX_WIDTH_PIXELS');
    }

    if (typeof this.maxHeightPixels !== 'number') {
      throw new Error('Required: MAX_HEIGHT_PIXELS');
    }

    if (!this.allowedImageTypes) {
      throw new Error('Required: ALLOWED_IMAGE_TYPES');
    }
  }

  async validate() {
    const meta = await ImageUtil.getMetaData(this.buffer);

    if ((meta.size / 1e+6) > this.maxFileSizeMb) {
      throw new HttpError(`Image exceeds maximum file size of ${this.maxFileSizeMb} Mb`, 400);
    }

    if (!this.allowedImageTypes.includes(meta.format)) {
      throw new HttpError(`Image format ${meta.format} is not supported`, 400);
    }

    if (meta.width > this.maxWidthPixels) {
      throw new HttpError(`Image exceeds maximum width of ${this.maxWidthPixels} pixels`, 400);
    }

    if (meta.height > this.maxHeightPixels) {
      throw new HttpError(`Image exceeds maximum height of ${this.maxHeightPixels} pixels`, 400);
    }

    await this.populate(meta);
  }

  /**
   *  Assign all meta data properties to this instance
   */
  async populate(meta) {
    if (!meta) meta = await ImageUtil.getMetaData(this.buffer); // eslint-disable-line no-param-reassign
    for (const x in meta) this[x] = meta[x]; // eslint-disable-line guard-for-in
  }
}
