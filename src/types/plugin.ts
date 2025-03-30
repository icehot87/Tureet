export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  initialize: () => Promise<void>;
  cleanup: () => Promise<void>;
}

export interface PluginManager {
  registerPlugin: (plugin: Plugin) => Promise<void>;
  unregisterPlugin: (pluginId: string) => Promise<void>;
  getPlugin: (pluginId: string) => Plugin | undefined;
  getAllPlugins: () => Plugin[];
  enablePlugin: (pluginId: string) => Promise<void>;
  disablePlugin: (pluginId: string) => Promise<void>;
}

export interface TestPlugin extends Plugin {
  runTest: (testCase: TestCase) => Promise<TestResult>;
  validateTestCase: (testCase: TestCase) => Promise<boolean>;
}

export interface TestCase {
  id: string;
  title: string;
  description: string;
  steps: TestStep[];
  expectedResults: string[];
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  status: 'draft' | 'active' | 'deprecated';
}

export interface TestStep {
  id: string;
  description: string;
  order: number;
}

export interface TestResult {
  id: string;
  testCaseId: string;
  status: 'passed' | 'failed' | 'blocked' | 'skipped';
  startTime: Date;
  endTime: Date;
  duration: number;
  notes: string;
  attachments: string[];
  error?: string;
} 