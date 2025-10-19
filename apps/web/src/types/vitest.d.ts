/// <reference types="vitest" />

interface ImportMeta {
  vitest: typeof import('vitest');
}

declare module 'vitest' {
  export const expect: any;
  export const afterEach: (fn: () => void) => void;
  export const beforeEach: (fn: () => void) => void;
  export const describe: (name: string, fn: () => void) => void;
  export const it: (name: string, fn: () => Promise<void> | void) => void;
  export const test: typeof it;

  interface MockInstance {
    mockImplementation(fn: (...args: any[]) => any): this;
    mockReturnValue(val: any): this;
    mockResolvedValue(val: any): this;
    mockRejectedValue(val: any): this;
  }

  export const vi: {
    fn: () => MockInstance;
    mock: (path: string, factory?: any) => void;
    hoisted: (factory: () => any) => any;
    importActual: <T>(path: string) => Promise<T>;
    importMock: <T>(path: string) => Promise<T>;
    resetModules: () => void;
    stubGlobal: (key: string, value: any) => void;
    unstubAllGlobals: () => void;
    spyOn: (obj: object, method: string) => MockInstance;
    clearAllMocks: () => void;
    resetAllMocks: () => void;
  };
}