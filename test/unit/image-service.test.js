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
        putObject: sinon.stub().resolves('https://example.com.example.jpg'),
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
        url: 'https://example.com.example.jpg',
        meta: {
          processingTime: result[0].meta.processingTime,
          sizeReduction: result[0].meta.sizeReduction,
          original: {
            width: 3264,
            height: 2448,
            size: '2.69 MB',
          },
          processed: {
            width: 300,
            height: 225,
            size: '16.32 KB',
          },
        },
      },
      {
        url: 'https://example.com.example.jpg',
        meta: {
          processingTime: result[1].meta.processingTime,
          sizeReduction: result[1].meta.sizeReduction,
          original: {
            width: 3264,
            height: 2448,
            size: '2.69 MB',
          },
          processed: {
            width: 1200,
            height: 900,
            size: '308.61 KB',
          },
        },
      },
    ]);
  });
});
