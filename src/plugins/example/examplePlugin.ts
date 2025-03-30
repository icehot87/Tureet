import type { TestPlugin, TestCase, TestResult } from '@/types/plugin';

export class ExampleTestPlugin implements TestPlugin {
  id = 'example-test-plugin';
  name = 'Example Test Plugin';
  version = '1.0.0';
  description = 'An example test plugin that demonstrates the plugin system';
  author = 'Tureet Team';
  enabled = true;

  async initialize(): Promise<void> {
    console.log('Example plugin initialized');
  }

  async cleanup(): Promise<void> {
    console.log('Example plugin cleaned up');
  }

  async validateTestCase(testCase: TestCase): Promise<boolean> {
    return testCase.title.length > 0 && testCase.description.length > 0;
  }

  async runTest(testCase: TestCase): Promise<TestResult> {
    const startTime = new Date();
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    return {
      id: `result-${Date.now()}`,
      testCaseId: testCase.id,
      status: 'passed',
      startTime,
      endTime,
      duration,
      notes: 'Test executed successfully by example plugin',
      attachments: [],
    };
  }
} 