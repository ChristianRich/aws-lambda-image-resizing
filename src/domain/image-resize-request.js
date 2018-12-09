/* istanbul ignore file */
import joi from 'joi';

export class SingleImageOperation {
  static get CONSTRAINTS() {
    return joi.object({
      maxWidth: joi.number().optional(),
      maxHeight: joi.number().optional(),
      quality: joi.number().optional().min(0).max(100),
      chromaSubsampling: joi.string().optional(),
    }).required();
  }
}

export default class ImageResizeRequest {
  static get CONSTRAINTS() {
    return joi.object({
      input: joi.object({
        key: joi.string().required(),
      }).required(),
      output: joi.object({
        key: joi.string().optional(),
        quality: joi.number().optional().min(0).max(100),
        chromaSubsampling: joi.string().optional(),
      }).optional(),
      operations: joi.array().items(SingleImageOperation.CONSTRAINTS).required(),
    }).required();
  }
}
