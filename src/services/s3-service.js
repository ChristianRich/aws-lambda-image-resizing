import { S3 } from 'aws-sdk';
import mimeTypes from 'mime-types';
import LogService from './log-service';
import { HttpError } from '../errors/http-error';

export default class S3Service {
  constructor({
    log = new LogService(),
    s3 = new S3({
      signatureVersion: 'v4', // https://github.com/aws/aws-sdk-js/issues/902
    }),
    bucketName = process.env.S3_BUCKET_NAME,
  } = {}) {
    this.log = log;
    this.s3 = s3;
    this.bucketName = bucketName;

    if (!this.bucketName) {
      throw new HttpError('Required: S3_BUCKET_NAME');
    }
  }

  /**
   * Generates a pre-signed single use S3 upload url
   * @param {*} param
   */
  async getSignedUrl({
    key,
    expires = 60 * 5,
  } = {}) {
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Expires: expires,
    };

    this.log.info('s3.getSignedUrl', params);
    return this.s3.getSignedUrl('putObject', params);
  }

  async getObject({
    key,
  } = {}) {
    const params = {
      Bucket: this.bucketName,
      Key: key,
    };

    this.log.info('s3.getObject', params);

    const { Body } = await this.s3
      .getObject(params)
      .promise();

    return Body;
  }

  /**
   * Uploads a file to S3 in YYYY/MM folder structure and returns the absolute url
   * @param {object} params
   * @param {string} key - filename eg. 'myImage.jpg'
   * @param {buffer} buffer - image Buffer containing the binary image data
   * @param {string} [cacheControl='public, max-age=31557600000'] - defaults to 1 year
   * @param {string} [prefix='']
   * @param {string} [ACL='public-read']
   * @returns {object} Url info
   */
  async putObject({
    key,
    buffer,
    cacheControl = 'public, max-age=31557600000',
    prefix = '',
    acl = 'public-read',
  } = {}) {
    const params = {
      Bucket: this.bucketName,
      Key: `${prefix}/${key}`,
      Body: buffer,
      ACL: acl,
      ContentType: mimeTypes.lookup(key),
      CacheControl: cacheControl,
    };

    this.log.info('s3.putObject', params);

    await this.s3
      .putObject(params)
      .promise();

    return {
      url: `https://s3-${process.env.AWS_REGION}.amazonaws.com/${this.bucketName}/${params.Key}`,
      key,
      prefix,
      region: process.env.AWS_REGION,
      baseUrl: `https://s3-${process.env.AWS_REGION}.amazonaws.com`,
    };
  }
}
