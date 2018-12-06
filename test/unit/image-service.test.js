import { describe, it } from 'mocha';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import fs from 'fs';
import ImageService from '../../src/services/image-service';

chai.use(chaiAsPromised);
chai.use(sinonChai);

const { expect } = chai;

describe('image-service', () => {
  it('should ...', async () => {
    const service = new ImageService({
      log: {
        debug: sinon.stub(),
      },
      s3Service: {
        getSignedUrl: sinon.stub(),
        put: sinon.stub(),
      },
    });

    const inputBuffer = await fs.readFileSync(`${process.cwd()}/test/assets/pd-cartier-silver.jpg`);
    const outputBuffer = await service.resize(inputBuffer);
    await fs.writeFileSync(`${process.cwd()}/test/assets/processed.jpg`, outputBuffer);
    console.log(outputBuffer);
    expect(true);
  });
});
