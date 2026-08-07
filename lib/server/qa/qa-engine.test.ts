import { checkNaming, checkSizeLimit, checkMetadata } from './qa-engine';

describe('qa-engine checks', () => {
  it('checkNaming rejects bad filenames', () => {
    const res = checkNaming([{ fileName: 'My Photo.JPG' }, { fileName: 'ok-1.glb' }]);
    expect(res.status).toBe('fail');
    expect(res.message).toMatch(/My Photo.JPG/);
  });

  it('checkNaming passes valid names', () => {
    expect(checkNaming([{ fileName: 'pano-1.jpg' }, { fileName: 'model.glb' }]).status).toBe('pass');
  });

  it('checkSizeLimit flags over-500MB', () => {
    expect(checkSizeLimit([{ fileName: 'big.glb', fileSize: 600 * 1024 * 1024 }]).status).toBe('fail');
    expect(checkSizeLimit([{ fileName: 'ok.glb', fileSize: 10 }]).status).toBe('pass');
  });

  it('checkMetadata flags missing fields', () => {
    expect(checkMetadata({ name: '', description: null, clientId: '' }).status).toBe('fail');
    expect(checkMetadata({ name: 'P1', description: 'd', clientId: 'c1' }).status).toBe('pass');
  });
});
