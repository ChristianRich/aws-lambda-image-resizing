/* istanbul ignore file */
import joi from 'joi';

// Represents a single image resize operation
export class SingleImageOperation {
  static get CONSTRAINTS() {
    return joi.object({
      width: joi.number().optional(),
      height: joi.number().optional(),
      maxWidth: joi.number().optional(),
      maxHeight: joi.number().optional(),
      quality: joi.number().optional().min(0).max(100), // Overrides ImageResizeRequest.output.quality
      chromaSubsampling: joi.string().optional(), // Overrides ImageResizeRequest.output.chromaSubsampling
      tag: joi.string().optional(),
    }).required();
  }
}

// Represents the entire POST request body the POST /
export default class ImageResizeRequest {
  static get CONSTRAINTS() {
    return joi.object({
      input: joi.object({
        key: joi.string().required(), // Name or path to existing S3 asset (source) e.g "myImage.jpg" or using an S3 prefix "2018/12/myImage.jpg"
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
