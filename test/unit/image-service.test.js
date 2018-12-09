import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import fs from 'fs';
import ImageService from '../../src/services/image-service';

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('image-service', () => {
  it('should process an image resize request', async () => {
    const service = new ImageService({
      log: {
        info: sinon.stub(),
        warn: sinon.stub(),
      },
      s3Service: {
        getSignedUrl: sinon.stub(),
        getObject: sinon.stub().resolves(fs.readFileSync(`${process.cwd()}/test/assets/iphone-6-landscape.JPG`)),
        putObject: sinon.stub().resolves({
          Etag: '1234',
        }),
      },
    });

    const result = await service.process({
      input: {
        key: 'test.jpg',
      },
      output: {
        key: 'boo',
        quality: 80,
        chromaSubsampling: '4:4:4',
      },
      operations: [
        {
          maxWidth: 300,
          quality: 50,
        },
        {
          maxWidth: 1200,
        },
      ],
    });

    expect(service.s3Service.putObject).to.have.callCount(2);
    expect(service.s3Service.putObject.args[0][0]).to.eql({
      buffer: service.s3Service.putObject.args[0][0].buffer,
      key: 'boo-300x225.jpg',
    });

    expect(service.s3Service.putObject.args[1][0]).to.eql({
      buffer: service.s3Service.putObject.args[1][0].buffer,
      key: 'boo-1200x900.jpg',
    });
    expect(result).to.eql([
      {
        srcWidth: 3264,
        srcHeight: 2448,
        newWidth: 300,
        newHeight: 225,
        s3Upload: {
          Etag: '1234',
        },
        key: 'boo-300x225.jpg',
      },
      {
        srcWidth: 3264,
        srcHeight: 2448,
        newWidth: 1200,
        newHeight: 900,
        s3Upload: {
          Etag: '1234',
        },
        key: 'boo-1200x900.jpg',
      },
    ]);
  });
});
