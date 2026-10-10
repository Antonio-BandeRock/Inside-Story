// The one description of what desktop/preload.js puts on `window` for the
// Electron build. Every desktop stand-in in this folder reads the bridge
// through getDesktopBridge(), and desktop/preload.js is the other half of
// the contract: the two have to agree, and this file is where they agree.
//
// Nothing outside lib/desktop/ should need this. The Metro redirects in
// metro.config.js (LIFESTEAD_DESKTOP=1, web platform only) point
// expo-sqlite, expo-secure-store, expo-notifications and expo-file-system
// at the stand-ins, so the app's code keeps calling the packages it always
// called. The one exception is the shared folder: lib/oneDriveGraph.ts and
// lib/oneDriveAuth.ts ask isDesktopApp() themselves and hand the call to
// lib/desktop/cloudFolder.ts, since what changes there is not a package
// but where the folder is.

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
  /**
   * App Lock (1.0.60.7). Missing on an installer built before 1.0.60.7.
   * unlock opens a sealed database into memory with its key (a wrong key
   * rejects); close writes it back sealed and drops the key.
   */
  unlock?(name: string, keyBase64: string): Promise<void>;
  close?(name: string): Promise<void>;
  /** Turns the lock on or off for one database file, checked table by table. */
  seal?(name: string, keyBase64: string): Promise<DesktopSealResult>;
  unseal?(name: string, keyBase64: string): Promise<DesktopSealResult>;
  keepSealed?(name: string): Promise<boolean>;
  abandonSeal?(name: string): Promise<boolean>;
  filesOnDisk?(name: string): Promise<{ plain: boolean; sealed: boolean }>;
  /**
   * Renames a sealed file that no key here opens, never deleting it, and
   * answers the new name, or null when a plain file is beside it. Missing on
   * an installer built before 1.0.60.15.
   */
  setAsideSealed?(name: string): Promise<string | null>;
};

export type DesktopSealResult =
  | { ok: true; step: 'copy' | 'finish' | 'no-database' }
  | { ok: false; problem: string };

/** Windows Hello holding a copy of the App Lock key (desktop/hello.js). */
export type DesktopHelloBridge = {
  available(): Promise<boolean>;
  /** What to store, or null when the person cancelled. */
  wrapKey(keyBase64: string): Promise<string | null>;
  unwrapKey(stored: string): Promise<{ kind: 'key'; key: string } | { kind: 'cancelled' } | { kind: 'needs-passcode' }>;
  remove(): Promise<void>;
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

/**
 * How large the app draws on this computer: Chromium's page zoom, kept by
 * desktop/zoom.js. The steps are the list in lib/desktop/zoom.ts.
 */
export type DesktopZoomBridge = {
  get(): Promise<number>;
  /** Lands on the nearest step and resolves with it. */
  set(factor: number): Promise<number>;
  /** Fires for every change, including ones made from the keyboard or the menu. Returns the remover. */
  onChange(listener: (factor: number) => void): () => void;
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
  /**
   * The operating system's Open dialog (asynchronous: it waits on the
   * person). Answers null when it was closed without a choice.
   */
  pick(options: DesktopPickFileOptions): Promise<DesktopPickedFile | null>;
  /**
   * The operating system's Save As dialog, then a copy of the file to the
   * place chosen, anywhere on the disk. Answers the destination path, or
   * null when the dialog was closed without a choice.
   */
  saveAs(uri: string, options: DesktopSaveAsOptions): Promise<string | null>;
};

export type DesktopPickFileOptions = {
  title?: string;
  /** Narrows the dialog's filter; an unknown type shows every file. */
  mimeType?: string;
  /** Where the dialog opens: a file:// URI or a bare path. */
  defaultPath?: string;
};

export type DesktopPickedFile = { uri: string; name: string };

export type DesktopSaveAsOptions = {
  title?: string;
  /** The name offered in the dialog; the source file's name when absent. */
  fileName?: string;
  mimeType?: string;
};

export type DesktopCloudFolderEntry = { name: string; path: string };

export type DesktopCloudFolderStat = {
  exists: boolean;
  isDirectory: boolean;
  name: string;
  path: string;
};

/**
 * The shared folder on a computer: the OneDrive folder on the disk, which
 * the OneDrive client keeps signed in and in step with the cloud, so the
 * app needs no sign-in of its own. lib/desktop/cloudFolder.ts answers
 * lib/oneDriveGraph.ts's calls through this; desktop/cloudFolder.js does
 * the work. A folder is its absolute path. Every call rejects with an
 * Error carrying a sentence when the disk refuses.
 */
export type DesktopCloudFolderBridge = {
  /** The OneDrive folders found on this computer, usually one. */
  roots(): Promise<DesktopCloudFolderEntry[]>;
  /** The operating system's folder dialog; null when it was closed without a choice. */
  pickFolder(defaultPath: string | null): Promise<string | null>;
  stat(folder: string): Promise<DesktopCloudFolderStat>;
  listFolders(folder: string): Promise<DesktopCloudFolderEntry[]>;
  listFiles(folder: string): Promise<string[]>;
  /** Makes the folder, under the next free name if that one is taken. */
  makeFolder(parent: string, name: string): Promise<DesktopCloudFolderEntry>;
  readText(folder: string, fileName: string): Promise<string>;
  /** Written whole: to a temporary name beside the final one, then renamed into place. */
  writeText(folder: string, fileName: string, text: string): Promise<void>;
  deleteFile(folder: string, fileName: string): Promise<void>;
  moveFile(fromFolder: string, fileName: string, intoFolder: string): Promise<void>;
  /** Copies a file (a file:// URI or a path) into the folder, whole. Missing on an installer built before 1.0.57.23. */
  copyFileIn?(folder: string, fileName: string, source: string): Promise<void>;
  /** A file's bytes. Missing on an installer built before 1.0.57.23. */
  readBytes?(folder: string, fileName: string): Promise<Uint8Array>;
};

/** Printing and PDFs in a hidden window (K11), since expo-print on the
 *  web target only prints the app window itself and makes no file. */
export type DesktopPrintBridge = {
  /** The system print dialog for the page: 'printed' or 'cancelled'; rejects when the printer refuses. */
  html(html: string): Promise<'printed' | 'cancelled'>;
  /** The page as a PDF in Cache/reports, named fileBase.pdf; answers its file:// URI. */
  toPdf(html: string, fileBase: string): Promise<string>;
};

/** Reading a web page from the main process, where no CORS rule applies. */
export type DesktopWebBridge = {
  /** Rejects with an Error carrying a sentence when the page cannot be read. */
  fetchPage(url: string): Promise<{ text: string; finalUrl: string }>;
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
  /** Missing on an installer built before 1.0.60.7. */
  hello?: DesktopHelloBridge;
  files: DesktopFilesBridge;
  notifications: DesktopNotificationsBridge;
  zoom: DesktopZoomBridge;
  cloudFolder: DesktopCloudFolderBridge;
  /** Missing on an installer built before 1.0.53.12. */
  web?: DesktopWebBridge;
  /** Missing on an installer built before 1.0.56.21. */
  print?: DesktopPrintBridge;
  /** Missing on an installer built before 1.0.55.38. */
  stationListener?: DesktopStationListenerBridge;
};

export type StationListenerStatus = {
  listening: boolean;
  port: number | null;
  /** This computer's IPv4 addresses on the home network. */
  addresses: string[];
  /** A sentence, when listening failed. */
  error: string | null;
  lastReport: { from: string; receivedAt: string } | null;
};

export type StationReport = { from: string; body: string; receivedAt: string };

/** A weather station that sends its readings to this computer (I22,
 *  desktop/stationListener.js). */
export type DesktopStationListenerBridge = {
  start(port: number): Promise<StationListenerStatus>;
  stop(): Promise<StationListenerStatus>;
  status(): Promise<StationListenerStatus>;
  onReport(listener: (report: StationReport) => void): () => void;
};

declare global {
  interface Window {
    insideStoryDesktop?: DesktopBridge;
  }
}

export function getDesktopBridge(): DesktopBridge {
  const bridge = typeof window !== 'undefined' ? window.insideStoryDesktop : undefined;
  if (!bridge) {
    throw new Error('Lifestead desktop bridge is missing: this build only runs inside the desktop app.');
  }
  return bridge;
}

export function isDesktopApp(): boolean {
  return typeof window !== 'undefined' && !!window.insideStoryDesktop;
}
