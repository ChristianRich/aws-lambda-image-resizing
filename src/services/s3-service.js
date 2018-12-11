import { S3 } from 'aws-sdk';
import mimeTypes from 'mime-types';
import omit from 'lodash/omit';
import rp from 'request-promise-native';
import LogService from './log-service';
import { HttpError } from '../errors/http-error';

export default class S3Service {
  constructor({
    log = new LogService(),
    s3 = new S3({ signatureVersion: 'v4' }), // https://github.com/aws/aws-sdk-js/issues/902
    http = rp,
    bucketName = process.env.S3_BUCKET_NAME,
  } = {}) {
    this.log = log;
    this.s3 = s3;
    this.http = http;
    this.bucketName = bucketName;

    if (!this.bucketName) {
      throw new HttpError('Required: S3_BUCKET_NAME');
    }
  }

  /**
   * Generates a pre-signed single use S3 upload url
   * @param {object} param
   * @param {string} key
   * @param {number} [expires=60*5] - Default expiry to 5 minutes
   */
  async getSignedUrl({
    key,
    expires = 60 * 5,
  } = {}) {
    if (typeof key !== 'string') {
      throw new HttpError('Type string expected for param key');
    }

    const params = {
      Bucket: this.bucketName,
      Key: key,
      Expires: expires,
    };

    this.log.info('s3.getSignedUrl', params);
    return this.s3.getSignedUrl('putObject', params);
  }

  /**
   * Returns a object from S3
   * @param {object} params
   * @param {string} key
   */
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

    if (!Body) {
      throw new HttpError(`Error loading key '${key}' from S3`, 404);
    }

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
    if (!(buffer instanceof Buffer)) {
      throw new HttpError('Type Buffer expected for param buffer', 400);
    }

    const params = {
      Bucket: this.bucketName,
      Key: `${prefix}/${key}`,
      Body: buffer,
      ACL: acl,
      ContentType: mimeTypes.lookup(key),
      CacheControl: cacheControl,
    };

    this.log.info('s3.putObject', omit(params, 'Body'));

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

  /**
   * Uploads a file to S3 using a pre-signed url. See getSignedUrl().
   * @param {object} param
   * @param {string} url - pre-signed url
   * @param {buffer} buffer - file to upload
   */
  async upload({
    url,
    buffer,
  } = {}) {
    const params = {
      method: 'PUT',
      url,
      body: buffer,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      json: true,
    };

    this.log.info('s3.getObject', params);
    this.http(params);
  }
}
