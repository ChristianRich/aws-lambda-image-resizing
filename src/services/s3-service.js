import { S3 } from 'aws-sdk';
import url from 'url';
import LogService from './log-service';
import { HttpError } from '../errors/http-error';

// https://github.com/aws/aws-sdk-js/issues/902
export default class S3Service {
  constructor({
    log = new LogService(),
    s3 = new S3({
      signatureVersion: 'v4',
    }),
    bucket = process.env.S3_BUCKET_NAME || '1234',
  } = {}) {
    this.log = log;
    this.s3 = s3;
    this.bucket = bucket;

    if (!bucket) {
      throw new HttpError('Required: S3_BUCKET_NAME');
    }
  }

  /**
   * Generates a pre-signed single use S3 upload url
   * @param {*} param
   */
  async getSignedUrl({
    key = 'myfile.jpg',
    expires = 60 * 5,
  } = {}) {
    const params = {
      Bucket: this.bucket,
      Key: key,
      Expires: expires,
    };

    this.log.debug('Getting pre-signed s3 bucket', params);

    const bucketUrl = await this.s3.getSignedUrl('putObject', params);
    return url.parse(bucketUrl);
  }

  async put({
    bucket,
    key,
  } = {}) {
    const params = {};
    await this.s3.putObject(params);
  }
}
