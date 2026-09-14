declare module '*.db' {
  const value: number;
  export default value;
}

// react-native-zeroconf 0.14 ships plain JavaScript and no type
// declarations. Only what lib/lanSync.ts uses is declared here, read from
// the package's src/index.js and its Android NsdServiceImpl (which is where
// the resolved service's shape comes from).
declare module 'react-native-zeroconf' {
  export type ZeroconfService = {
    name: string;
    fullName?: string;
    host?: string;
    port: number;
    addresses?: string[];
    txt?: Record<string, string>;
  };

  export type ZeroconfEvent =
    | 'start'
    | 'stop'
    | 'error'
    | 'found'
    | 'remove'
    | 'update'
    | 'resolved'
    | 'published'
    | 'unpublished';

  export default class Zeroconf {
    on(event: 'resolved' | 'published' | 'unpublished', listener: (service: ZeroconfService) => void): this;
    on(event: 'found' | 'remove', listener: (name: string) => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'start' | 'stop' | 'update', listener: () => void): this;
    removeAllListeners(event?: ZeroconfEvent): this;
    scan(type?: string, protocol?: string, domain?: string): void;
    stop(): void;
    publishService(
      type: string,
      protocol: string,
      domain: string,
      name: string,
      port: number,
      txt?: Record<string, string>,
    ): void;
    unpublishService(name: string): void;
    getServices(): Record<string, ZeroconfService>;
    removeDeviceListeners(): void;
  }
}
