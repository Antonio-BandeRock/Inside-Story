// The one description of what desktop/preload.js puts on `window` for the
// Electron build. Every desktop stand-in in this folder reads the bridge
// through getDesktopBridge(), and desktop/preload.js is the other half of
// the contract: the two have to agree, and this file is where they agree.
//
// Nothing outside lib/desktop/ should need this. The Metro redirects in
// metro.config.js (INSIDE_STORY_DESKTOP=1, web platform only) point
// expo-sqlite, expo-secure-store, expo-notifications and expo-file-system
// at the stand-ins,
// so the app's code keeps calling the packages it always called.

export type DesktopSqlParam = string | number | boolean | null | Uint8Array;

export type DesktopSqlParams = DesktopSqlParam[] | Record<string, DesktopSqlParam>;

export type DesktopSqliteBridge = {
  /** Opens (creating if needed) the named database under the app's data folder. */
  open(name: string): Promise<void>;
  run(name: string, sql: string, params: DesktopSqlParams): Promise<{ changes: number; lastInsertRowId: number }>;
  all(name: string, sql: string, params: DesktopSqlParams): Promise<unknown[]>;
  get(name: string, sql: string, params: DesktopSqlParams): Promise<unknown>;
  exec(name: string, sql: string): Promise<void>;
  /**
   * Copies the reference database shipped beside the app into the data
   * folder under `name`, only when the shipped file differs from what was
   * copied last time. Resolves true when a copy happened.
   */
  importReference(name: string): Promise<boolean>;
};

export type DesktopSecretsBridge = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
};

export type DesktopNotificationRequest = {
  identifier: string;
  title: string;
  body: string;
  data: unknown;
  fireAt: number;
};

export type DesktopNotificationResponse = {
  identifier: string;
  data: unknown;
  respondedAt: number;
};

export type DesktopNotificationsBridge = {
  schedule(request: DesktopNotificationRequest): Promise<void>;
  cancel(identifier: string): Promise<void>;
  listScheduled(): Promise<DesktopNotificationRequest[]>;
  lastResponse(): Promise<DesktopNotificationResponse | null>;
  /** Returns a function that removes the listener. */
  onResponse(listener: (response: DesktopNotificationResponse) => void): () => void;
};

export type DesktopFileInfo = {
  exists: boolean;
  isDirectory: boolean;
  size: number;
  modificationTime: number | null;
  creationTime: number | null;
  uri: string;
};

export type DesktopDirectoryEntry = {
  name: string;
  isDirectory: boolean;
  uri: string;
  size: number;
  modificationTime: number | null;
};

/**
 * Synchronous on purpose: expo-file-system's File API is synchronous, and
 * lib/visualPreferences.ts reads its mirror files through it before the
 * first render. Each call throws an Error where the phone would.
 */
export type DesktopFilesBridge = {
  stat(uri: string): DesktopFileInfo;
  readText(uri: string): string;
  readBase64(uri: string): string;
  writeText(uri: string, text: string): void;
  writeBase64(uri: string, base64: string): void;
  delete(uri: string): void;
  makeDirectory(uri: string, intermediates: boolean): void;
  list(uri: string): DesktopDirectoryEntry[];
  copy(from: string, to: string): void;
  move(from: string, to: string): void;
};

export type DesktopPaths = {
  /** file:// URI of the app's Documents folder, with a trailing slash. */
  document: string;
  /** file:// URI of the app's Cache folder, with a trailing slash. */
  cache: string;
  /** Bare path of the SQLite folder, the shape expo-sqlite's defaultDatabaseDirectory has on a phone. */
  sqlite: string;
};

export type DesktopBridge = {
  platform: 'desktop';
  appVersion: string;
  paths: DesktopPaths;
  sqlite: DesktopSqliteBridge;
  secrets: DesktopSecretsBridge;
  files: DesktopFilesBridge;
  notifications: DesktopNotificationsBridge;
};

declare global {
  interface Window {
    insideStoryDesktop?: DesktopBridge;
  }
}

export function getDesktopBridge(): DesktopBridge {
  const bridge = typeof window !== 'undefined' ? window.insideStoryDesktop : undefined;
  if (!bridge) {
    throw new Error('Inside Story desktop bridge is missing: this build only runs inside the desktop app.');
  }
  return bridge;
}

export function isDesktopApp(): boolean {
  return typeof window !== 'undefined' && !!window.insideStoryDesktop;
}
