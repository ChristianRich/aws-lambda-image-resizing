import { S3 } from 'aws-sdk';
import url from 'url';
import LogService from './log-service';
import { HttpError } from '../errors/http-error';

export default class S3Service {
  constructor({
    log = new LogService(),
    s3 = new S3({
      signatureVersion: 'v4', // https://github.com/aws/aws-sdk-js/issues/902
    }),
    bucket = process.env.S3_BUCKET_NAME || 'fileupload-bucket',
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

    this.log.info('s3.getSignedUrl', params);
    const bucketUrl = await this.s3.getSignedUrl('putObject', params);
    return url.parse(bucketUrl);
  }

  async getObject({
    bucket = this.bucket,
    key,
  } = {}) {
    const params = {
      Bucket: bucket,
      Key: key,
    };

    this.log.info('s3.getObject', params);

    const { Body } = await this.s3
      .getObject(params)
      .promise();

    return Body;
  }

  async putObject({
    bucket = this.bucket,
    key,
    buffer,
  } = {}) {
    const params = {
      Bucket: bucket,
      Key: key,
      Body: buffer,
    };

    this.log.info('s3.putObject', params);

    return this.s3
      .putObject(params)
      .promise();
  }
}
