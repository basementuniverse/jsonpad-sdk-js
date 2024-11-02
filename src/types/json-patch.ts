export type JSONPatch = {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
  [key: string]: any;
}[];
