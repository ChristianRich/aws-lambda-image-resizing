import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';
import ImageResizeRequest from '../../src/domain/image-resize-request';
import mockRequest from './mock/post.request.json';

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('domain/image-resize-request', () => {
  it('should validate', async () => {
    const { error } = ImageResizeRequest.CONSTRAINTS.validate(mockRequest.data.attributes);
    expect(error).to.eql(null);
  });
});
