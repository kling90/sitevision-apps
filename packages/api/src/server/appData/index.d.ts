import type { Node } from '../../types/javax/jcr/Node';

export interface AppData {
  get(...key: string[]): any;
  getNode(key: string): Node;
  getArray(key: string): Node[];
}

declare namespace AppData {}

declare var appData: AppData;

export default appData;
