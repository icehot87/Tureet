import { TureetPluginManager } from '../lib/pluginManager';

describe('TureetPluginManager', () => {
  it('can be instantiated', () => {
    const manager = new TureetPluginManager();
    expect(manager).toBeInstanceOf(TureetPluginManager);
  });
}); 