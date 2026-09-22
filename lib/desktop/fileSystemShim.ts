// expo-file-system, as the desktop app sees it. metro.config.js resolves
// 'expo-file-system' here when INSIDE_STORY_DESKTOP=1 on the web platform.
// The package's own web build has no file system behind it (its File
// constructor throws before the app can ask anything), so File, Directory
// and Paths are rebuilt here over desktop/files.js, which does the reading
// and writing in Electron's main process under the app's data folder.
//
// The phone API is synchronous, and so is the bridge (see
// DesktopFilesBridge in ./bridge.ts): lib/visualPreferences.ts reads its
// two mirror files with textSync() before the first render, and
// lib/dataBackup.ts and lib/reportPdf.ts create, write, copy and move in
// place. Only the surface the app uses is here; anything else throws so a
// new use fails loudly on desktop rather than quietly.

import { getDesktopBridge, type DesktopFileInfo } from './bridge';

type Location = string | File | Directory;

function joinUris(uris: Location[]): string {
  let uri = '';
  for (const part of uris) {
    const piece = typeof part === 'string' ? part : part.uri;
    if (uri === '') {
      uri = piece;
    } else {
      uri = `${uri.replace(/\/+$/, '')}/${piece.replace(/^\/+/, '')}`;
    }
  }
  return uri;
}

function baseName(uri: string): string {
  const trimmed = uri.replace(/\/+$/, '');
  const slash = trimmed.lastIndexOf('/');
  return decodeURIComponent(slash >= 0 ? trimmed.slice(slash + 1) : trimmed);
}

function parentUri(uri: string): string {
  const trimmed = uri.replace(/\/+$/, '');
  const slash = trimmed.lastIndexOf('/');
  return slash >= 0 ? `${trimmed.slice(0, slash)}/` : trimmed;
}

// A copy or move into a directory lands under the source's name inside
// it, the way the phone API works; into a file, it takes that file's uri.
function destinationUri(source: string, destination: Directory | File): string {
  if (destination instanceof Directory) {
    return joinUris([destination.uri, baseName(source)]);
  }
  return destination.uri;
}

function unsupported(what: string): never {
  throw new Error(`${what} is not available in the desktop app.`);
}

export class Paths {
  static get document(): Directory {
    return new Directory(getDesktopBridge().paths.document);
  }

  static get cache(): Directory {
    return new Directory(getDesktopBridge().paths.cache);
  }

  static get bundle(): Directory {
    return unsupported('Paths.bundle');
  }

  static get appleSharedContainers(): Record<string, Directory> {
    return {};
  }

  static get totalDiskSpace(): number {
    return unsupported('Paths.totalDiskSpace');
  }

  static get availableDiskSpace(): number {
    return unsupported('Paths.availableDiskSpace');
  }

  static join(...uris: Location[]): string {
    return joinUris(uris);
  }

  static basename(uri: string): string {
    return baseName(uri);
  }

  static dirname(uri: string): string {
    return parentUri(uri);
  }

  static extname(uri: string): string {
    const name = baseName(uri);
    const dot = name.lastIndexOf('.');
    return dot > 0 ? name.slice(dot) : '';
  }

  static info(...uris: Location[]): { exists: boolean; isDirectory: boolean | null } {
    const info = getDesktopBridge().files.stat(joinUris(uris));
    return { exists: info.exists, isDirectory: info.exists ? info.isDirectory : null };
  }
}

export class File {
  readonly uri: string;

  constructor(...uris: Location[]) {
    this.uri = joinUris(uris);
  }

  private stat(): DesktopFileInfo {
    return getDesktopBridge().files.stat(this.uri);
  }

  get exists(): boolean {
    const info = this.stat();
    return info.exists && !info.isDirectory;
  }

  get size(): number {
    return this.stat().size;
  }

  get name(): string {
    return baseName(this.uri);
  }

  get extension(): string {
    return Paths.extname(this.uri);
  }

  get parentDirectory(): Directory {
    return new Directory(parentUri(this.uri));
  }

  get type(): string {
    return '';
  }

  get modificationTime(): number | null {
    return this.stat().modificationTime;
  }

  get creationTime(): number | null {
    return this.stat().creationTime;
  }

  info(): { exists: boolean; uri: string; size: number; modificationTime: number | null } {
    const info = this.stat();
    return { exists: info.exists, uri: this.uri, size: info.size, modificationTime: info.modificationTime };
  }

  validatePath(): void {
    // A location is validated by the main process when it is used.
  }

  textSync(): string {
    return getDesktopBridge().files.readText(this.uri);
  }

  async text(): Promise<string> {
    return this.textSync();
  }

  base64Sync(): string {
    return getDesktopBridge().files.readBase64(this.uri);
  }

  async base64(): Promise<string> {
    return this.base64Sync();
  }

  bytesSync(): Uint8Array {
    const binary = atob(this.base64Sync());
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  async bytes(): Promise<Uint8Array> {
    return this.bytesSync();
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    return this.bytesSync().buffer as ArrayBuffer;
  }

  write(content: string | Uint8Array): void {
    const files = getDesktopBridge().files;
    if (typeof content === 'string') {
      files.writeText(this.uri, content);
      return;
    }
    let binary = '';
    for (let index = 0; index < content.length; index += 1) {
      binary += String.fromCharCode(content[index]);
    }
    files.writeBase64(this.uri, btoa(binary));
  }

  create(): void {
    if (!this.exists) {
      this.write('');
    }
  }

  delete(): void {
    getDesktopBridge().files.delete(this.uri);
  }

  copy(destination: Directory | File): void {
    getDesktopBridge().files.copy(this.uri, destinationUri(this.uri, destination));
  }

  move(destination: Directory | File): void {
    getDesktopBridge().files.move(this.uri, destinationUri(this.uri, destination));
  }

  rename(newName: string): void {
    getDesktopBridge().files.move(this.uri, joinUris([parentUri(this.uri), newName]));
  }

  open(): never {
    return unsupported('File.open');
  }

  readableStream(): never {
    return unsupported('File.readableStream');
  }

  writableStream(): never {
    return unsupported('File.writableStream');
  }

  stream(): never {
    return unsupported('File.stream');
  }

  slice(): never {
    return unsupported('File.slice');
  }

  /**
   * The operating system's Open dialog. Every caller in the app treats a
   * falsy answer as a cancel (Restore from a File, the .is import), so a
   * closed dialog answers null rather than throwing. A picked file can be
   * anywhere on the disk, and reads are allowed anywhere.
   */
  static async pickFileAsync(initialUri?: string, mimeType?: string): Promise<File | null> {
    const picked = await getDesktopBridge().files.pick({
      mimeType,
      defaultPath: initialUri,
    });
    return picked ? new File(picked.uri) : null;
  }

  static async downloadFileAsync(): Promise<never> {
    return unsupported('File.downloadFileAsync');
  }
}

export class Directory {
  readonly uri: string;

  constructor(...uris: Location[]) {
    const joined = joinUris(uris);
    this.uri = joined.endsWith('/') ? joined : `${joined}/`;
  }

  private stat(): DesktopFileInfo {
    return getDesktopBridge().files.stat(this.uri);
  }

  get exists(): boolean {
    const info = this.stat();
    return info.exists && info.isDirectory;
  }

  get size(): number | null {
    return null;
  }

  get name(): string {
    return baseName(this.uri);
  }

  get parentDirectory(): Directory {
    return new Directory(parentUri(this.uri));
  }

  info(): { exists: boolean; uri: string } {
    return { exists: this.exists, uri: this.uri };
  }

  validatePath(): void {
    // A location is validated by the main process when it is used.
  }

  create(options?: { intermediates?: boolean; idempotent?: boolean }): void {
    if (this.exists && (options?.idempotent || options?.intermediates)) {
      return;
    }
    getDesktopBridge().files.makeDirectory(this.uri, !!options?.intermediates);
  }

  createFile(name: string): File {
    const file = new File(this.uri, name);
    file.create();
    return file;
  }

  createDirectory(name: string): Directory {
    const directory = new Directory(this.uri, name);
    directory.create();
    return directory;
  }

  delete(): void {
    getDesktopBridge().files.delete(this.uri);
  }

  copy(destination: Directory | File): void {
    getDesktopBridge().files.copy(this.uri, destinationUri(this.uri, destination));
  }

  move(destination: Directory | File): void {
    getDesktopBridge().files.move(this.uri, destinationUri(this.uri, destination));
  }

  rename(newName: string): void {
    getDesktopBridge().files.move(this.uri, joinUris([parentUri(this.uri), newName]));
  }

  listAsRecords(): { isDirectory: boolean; uri: string }[] {
    return getDesktopBridge().files.list(this.uri).map((entry) => ({ isDirectory: entry.isDirectory, uri: entry.uri }));
  }

  list(): (Directory | File)[] {
    return getDesktopBridge().files.list(this.uri).map((entry) => (entry.isDirectory ? new Directory(entry.uri) : new File(entry.uri)));
  }

  static async pickDirectoryAsync(): Promise<never> {
    return unsupported('Directory.pickDirectoryAsync');
  }
}

export type FileInfo = ReturnType<File['info']>;
export type DirectoryInfo = ReturnType<Directory['info']>;
