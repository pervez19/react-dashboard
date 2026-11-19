/** One entry of the documented project tree (a folder or a file). */
export interface DocNode {
  name: string;
  kind: 'folder' | 'file';
  /** What it is, in one or two sentences. */
  summary: string;
  /** How it works. */
  how?: string;
  /** Why it exists / why it is built this way. */
  why?: string;
  children?: DocNode[];
}
