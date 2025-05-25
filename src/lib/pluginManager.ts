import type { Plugin, PluginManager, TestPlugin } from '@/types/plugin';

export class TureetPluginManager implements PluginManager {
  private plugins: Map<string, Plugin> = new Map();

  async registerPlugin(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin with ID ${plugin.id} is already registered`);
    }

    await plugin.initialize();
    this.plugins.set(plugin.id, plugin);
  }

  async unregisterPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin with ID ${pluginId} not found`);
    }

    await plugin.cleanup();
    this.plugins.delete(pluginId);
  }

  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin with ID ${pluginId} not found`);
    }

    plugin.enabled = true;
  }

  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin with ID ${pluginId} not found`);
    }

    plugin.enabled = false;
  }

  // Helper method to get all test plugins
  getTestPlugins(): TestPlugin[] {
    return this.getAllPlugins().filter((plugin): plugin is TestPlugin => 
      'runTest' in plugin && 'validateTestCase' in plugin
    );
  }
}

// Create a singleton instance
export const pluginManager = new TureetPluginManager(); 