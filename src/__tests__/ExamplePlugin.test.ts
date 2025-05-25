import { ExampleTestPlugin } from '../plugins/example/examplePlugin';

describe('ExampleTestPlugin', () => {
  it('can be instantiated', () => {
    const plugin = new ExampleTestPlugin();
    expect(plugin).toBeInstanceOf(ExampleTestPlugin);
  });
}); 