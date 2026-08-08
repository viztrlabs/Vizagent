const mockSession = { mode: 'immersive-ar' };
const mockExit = jest.fn().mockResolvedValue(undefined);
const fm = {
  enableFeature: jest.fn(),
  getEnabledFeature: jest.fn().mockReturnValue({ planes: [{}, {}] }),
};
const createAsync = jest.fn().mockResolvedValue({
  baseExperience: {
    sessionManager: { session: mockSession },
    featuresManager: fm,
  },
  exitXRAsync: mockExit,
  dispose: jest.fn(),
});

jest.mock('@babylonjs/core/XR/webXRDefaultExperience', () => ({
  WebXRDefaultExperience: { CreateAsync: createAsync },
}));
jest.mock('@babylonjs/core', () => ({
  Engine: jest.fn().mockImplementation(() => ({})),
  Scene: jest.fn().mockImplementation(() => ({})),
  Vector3: { FromArray: jest.fn(() => ({ x: 0, y: 0, z: 0 })) },
}));

import { tryEnterAR, tryEnterVR, getMode, exitXr, getDetectedPlanes, getCapabilities, disposeXr } from './webxr-session';

describe('webxr-session', () => {
  beforeAll(() => {
    Object.defineProperty(globalThis, 'navigator', { value: { xr: { isSessionSupported: jest.fn().mockResolvedValue(true) } }, configurable: true });
  });

  beforeEach(() => {
    createAsync.mockClear();
    disposeXr();
  });

  it('tryEnterAR returns true and enables features', async () => {
    const ok = await tryEnterAR({} as never);
    expect(ok).toBe(true);
    expect(createAsync).toHaveBeenCalled();
  });

  it('getMode returns ar after entering', async () => {
    await tryEnterAR({} as never);
    expect(getMode()).toBe('ar');
  });

  it('getDetectedPlanes reads from plane detector', async () => {
    await tryEnterAR({} as never);
    expect(getDetectedPlanes()).toBe(2);
  });

  it('tryEnterVR returns true', async () => {
    const ok = await tryEnterVR({} as never);
    expect(ok).toBe(true);
  });

  it('getCapabilities queries navigator.xr', async () => {
    const caps = await getCapabilities();
    expect(caps.ar).toBe(true);
    expect(caps.vr).toBe(true);
  });

  it('exitXr clears the experience', async () => {
    await tryEnterAR({} as never);
    expect(getMode()).toBe('ar');
    await exitXr();
    expect(getMode()).toBe('none');
  });
});