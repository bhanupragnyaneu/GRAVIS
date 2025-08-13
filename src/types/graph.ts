export interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  distance: number;
  visited: boolean;
  previous: Node | null;
  current: boolean;
}

export interface Edge {
  from: Node;
  to: Node;
  weight: number;
  inPath: boolean;
}

export interface AlgorithmStep {
  type: 'init' | 'update' | 'visit' | 'finish';
  message: string;
  currentNode?: string;
  distances?: { [nodeId: string]: number };
  visited?: string[];
  previous?: { [nodeId: string]: string | null };
  distanceMatrix?: number[][];
  nodes?: string[];
  iNode?: string;
  jNode?: string;
  kNode?: string;
}

export interface AlgorithmResult {
  steps: AlgorithmStep[];
  finalDistances: { [nodeId: string]: number };
  shortestPaths: { [nodeId: string]: string[] };
}

export type EditMode = 'addNode' | 'addEdge' | 'delete' | 'setSource' | 'normal';
export type AlgorithmType = 'dijkstra' | 'bellmanFord' | 'floydWarshall';
export type StatusType = 'idle' | 'running' | 'complete' | 'error';
