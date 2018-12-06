import joi from 'joi';

export default class ImageResize {
  constructor({
    s3Bucket,
    s3key,
  } = {}) {
    this.s3Bucket = s3Bucket;
    this.s3key = s3key;
  }
}
