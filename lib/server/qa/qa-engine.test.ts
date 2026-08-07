import { checkNaming, checkSizeLimit, checkMetadata, checkGlbLoadable, GLB_LOADABLE } from './qa-engine';
import { parseGlb, isGlbFileName } from './glb-loader.server';

function makeValidGlb(): Buffer {
  const json = JSON.stringify({
    asset: { version: '2.0', generator: 'test' },
    scenes: [{ nodes: [0] }], scene: 0,
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', max: [1, 1, 1], min: [-1, -1, -1] }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }],
    buffers: [{ byteLength: 36 }],
  });
  const jb = Buffer.from(json, 'utf8');
  const jp = Buffer.alloc(Math.ceil(jb.length / 4) * 4, 0x20);
  jp.set(jb);
  const bp = Buffer.alloc(36, 0);
  const hdr = Buffer.alloc(12);
  hdr.writeUInt32LE(0x46546c67, 0);
  hdr.writeUInt32LE(2, 4);
  hdr.writeUInt32LE(12 + 8 + jp.length + 8 + bp.length, 8);
  const jh = Buffer.alloc(8); jh.writeUInt32LE(jp.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8); bh.writeUInt32LE(bp.length, 0); bh.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([hdr, jh, jp, bh, bp]);
}

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

describe('checkGlbLoadable', () => {
  it('passes when no GLB assets', async () => {
    const res = await checkGlbLoadable([{ fileName: 'pano.jpg' }], (a) => a.fileName, async () => {});
    expect(res.status).toBe('pass');
    expect(res.name).toBe(GLB_LOADABLE);
  });

  it('passes when loader succeeds', async () => {
    const res = await checkGlbLoadable([{ fileName: 'a.glb' }], (a) => a.fileName, async () => {});
    expect(res.status).toBe('pass');
    expect(res.message).toMatch(/1 GLB/);
  });

  it('fails when loader throws', async () => {
    const res = await checkGlbLoadable(
      [{ fileName: 'broken.glb' }, { fileName: 'ok.glb' }],
      (a) => a.fileName,
      async (u) => { if (u.includes('broken')) throw new Error('corrupt'); }
    );
    expect(res.status).toBe('fail');
    expect(res.message).toMatch(/broken.glb/);
    expect(res.message).not.toMatch(/ok.glb/);
  });
});

describe('parseGlb', () => {
  it('accepts a valid GLB', () => {
    const res = parseGlb(makeValidGlb());
    expect(res.ok).toBe(true);
    expect(res.meshCount).toBe(1);
  });

  it('rejects garbage', () => {
    const res = parseGlb(Buffer.from('not a glb file content'));
    expect(res.ok).toBe(false);
  });

  it('rejects truncated GLB', () => {
    const res = parseGlb(makeValidGlb().subarray(0, 20));
    expect(res.ok).toBe(false);
  });

  it('isGlbFileName matches .glb', () => {
    expect(isGlbFileName('model.glb')).toBe(true);
    expect(isGlbFileName('model.gLb')).toBe(true);
    expect(isGlbFileName('model.jpg')).toBe(false);
  });
});
