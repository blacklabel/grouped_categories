// Test setup file for Jest

// Mock Highcharts if not available in test environment
if (typeof window === 'undefined') {
  (global as any).window = {} as any;
}

// Mock document if not available
if (typeof document === 'undefined') {
  (global as any).document = {
    createElement: jest.fn(),
    body: {
      appendChild: jest.fn(),
      removeChild: jest.fn()
    }
  } as any;
}

// Mock console methods to reduce noise in tests
(global as any).console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
