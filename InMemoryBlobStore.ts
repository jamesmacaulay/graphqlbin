import { createHash } from 'crypto';

const maxBlobs = 1000;

export class InMemoryBlobStore {
  _storage: { [digest: string]: string };
  _keys: string[];

  constructor() {
    this._storage = {};
    this._keys = [];
  }

  add(blob: string): Promise<string> {
    const digest = createHash('sha256').update(blob).digest('hex');
    this._storage[digest] = blob;
    this._keys.push(digest);
    if (this._keys.length > maxBlobs) {
      this._keys.shift();
      delete this._storage[digest];
    }
    return Promise.resolve(digest);
  }

  fetch(key: string): Promise<string> {
    return Promise.resolve(this._storage[key]);
  }
}