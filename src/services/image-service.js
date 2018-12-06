import sharp from 'sharp';
import LogService from './log-service';
import S3Service from './s3-service';

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
  async resize(file) { // eslint-disable-line class-methods-use-this
    if (!file) {
      throw new Error('File required');
    }

    const buffer = Buffer.from(file.buffer);
    console.log(file.buffer);

    const outputBuffer = await sharp(file.buffer)
      .resize(320, 240)
      .normalise(true)
      // .sharpen()
      // .flatten()
      // .jpeg()
      .toBuffer();

    return outputBuffer;
  }

  save(buffer, key) { // eslint-disable-line class-methods-use-this
    // const localFilename = '/tmp/{}'.format(os.path.basename(key));
  }
}
