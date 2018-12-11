import sharp from 'sharp';
import { HttpError } from '../errors/http-error';

/**
 * Collection of utilities handy for interacting with images and resizing
 */
export default class ImageUtil {
  /**
   * Calculates the corresponding width or height for which ever property is missing by keeping the aspect ratio
   * @param {number} srcWidth
   * @param {number} srcHeight
   * @param {number} [maxWidth]
   * @param {number} [maxHeight]
   * @return {aspectRatio: number, srcWidth: number, srcHeight: number, width: number, height: number}
   */
  static calculateAspectRatioFit({ // eslint-disable-line class-methods-use-this
    srcWidth,
    srcHeight,
    maxWidth = srcWidth,
    maxHeight = srcHeight,
  } = {}) {
    if (typeof srcWidth !== 'number') throw new HttpError('srcWidth expected', 400);
    if (typeof srcHeight !== 'number') throw new HttpError('srcHeight expected', 400);

    const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);

    return {
      aspectRatio: ratio,
      srcWidth,
      srcHeight,
      width: Math.floor(srcWidth * ratio),
      height: Math.floor(srcHeight * ratio),
    };
  }

  /**
   * Returns a string representation of an aspect ratio based on width and height
   *
   * Most common image aspect ratios are:
   * 4:3      Smart phones
   * 2:3      35mm camara, DSLR (both APS-C cropped sensor and full-frame), most compact camaras
   * 16:9     Wide screen images, HDTV
   * 1:1      Square photos like Instagram, Hipstamatic
   *
   * Source:
   * http://photo.stackexchange.com/questions/33713/most-common-aspect-ratio
   *
   * @param {number} w
   * @param {number} h
   * @return {string}
   * */
  static getRatio(w, h) {
    const r = this.gcd(w, h);
    return `${w / r}:${h / r}`;
  }

  /**
   *  Returns the greatest common divisor for two numbers (GCD).
   *  The GCD is the highest number that evenly divides both numbers without leaving a remainder.
   *  Examples: The GCD for 6 and 10 is 2, the GCD for 44 and 99 is 11.
   *
   *  Source:
   *  http://stackoverflow.com/questions/1186414/whats-the-algorithm-to-calculate-aspect-ratio-i-need-an-output-like-43-169
   *
   *  @param {number} a
   *  @param {number} b
   *  @return {number}
   * */
  static gdc(a, b) {
    return ((b === 0) ? a : this.gcd(b, a % b));
  }

  /**
   * Return images meta-data e.g width, height, size
   * @param {Buffer} buffer
   * @returns {object} see http://sharp.pixelplumbing.com/en/stable/api-input/#metadata
   */
  static getMetaData(buffer) {
    return sharp(buffer)
      .metadata();
  }
}
