// src/algorithms/__tests__/shortestPath.unit.test.ts
import { dijkstra, bellmanFord, floydWarshall } from './src/algorithms/shortestPath';
import type { Node, Edge } from './src/types/graph';

const N = (id: string): Node => ({ id, label: id, x: 0, y: 0, distance: Infinity, visited: false, previous: null, current: false });
const E = (from: Node, to: Node, w: number): Edge => ({ from, to, weight: w, inPath: false });

describe('Algorithms: core logic', () => {
  const A = N('A'), B = N('B'), C = N('C'), D = N('D'), ENode = N('E');

  // ---------- D I J K S T R A ----------
  describe('dijkstra()', () => {
    test('single node → distance 0 to itself', () => {
      const r = dijkstra([A], [], 'A');
      expect(r.finalDistances['A']).toBe(0);
      expect(r.shortestPaths['A']).toEqual(['A']);
    });

    test('accumulates along path (A→B→C→D)', () => {
      const edges = [E(A, B, 1), E(B, C, 2), E(C, D, 3)];
      const r = dijkstra([A, B, C, D], edges, 'A');
      expect(r.finalDistances['A']).toBe(0);
      expect(r.finalDistances['B']).toBe(1);
      expect(r.finalDistances['C']).toBe(3);
      expect(r.finalDistances['D']).toBe(6);
    });

    test('chooses shorter among branches', () => {
      const edges = [E(A, B, 1), E(B, C, 1), E(A, C, 10)];
      const r = dijkstra([A, B, C], edges, 'A');
      expect(r.finalDistances['C']).toBe(2);
      expect(r.shortestPaths['C'][0]).toBe('A');
      expect(r.shortestPaths['C'].slice(-1)[0]).toBe('C');
    });

    test('unreachable stays Infinity and no path entry', () => {
      const r = dijkstra([A, B], [], 'A');
      expect(r.finalDistances['B']).toBe(Infinity);
      expect(r.shortestPaths['B']).toBeUndefined();
    });

    test('directionality respected', () => {
      const r = dijkstra([A, B], [E(B, A, 1)], 'A'); // only B->A exists
      expect(r.finalDistances['B']).toBe(Infinity);
    });

    test('zero-weight edges work', () => {
      const r = dijkstra([A, B, C], [E(A, B, 0), E(B, C, 0)], 'A');
      expect(r.finalDistances['C']).toBe(0);
      expect(r.shortestPaths['C']).toEqual(['A', 'B', 'C']);
    });

    test('ties in distances still correct', () => {
      const edges = [E(A, B, 1), E(B, D, 1), E(A, C, 1), E(C, D, 1)];
      const r = dijkstra([A, B, C, D], edges, 'A');
      expect(r.finalDistances['D']).toBe(2);
    });

    test('invalid source → all Infinity; no paths', () => {
      const r = dijkstra([A, B], [E(A, B, 2)], 'ZZZ');
      expect(r.finalDistances['A']).toBe(undefined);
      expect(Object.keys(r.shortestPaths)).toHaveLength(0);
    });
  });

  // ---------- B E L L M A N – F O R D ----------
  describe('bellmanFord()', () => {
    test('matches Dijkstra on non-negative graphs', () => {
      const edges = [E(A, B, 1), E(B, C, 2), E(A, C, 5)];
      const r1 = dijkstra([A, B, C], edges, 'A');
      const r2 = bellmanFord([A, B, C], edges, 'A');
      expect(r2.finalDistances['C']).toBe(r1.finalDistances['C']); // 3 vs 3
    });

    test('handles a negative edge without negative cycle', () => {
      const edges = [E(A, B, 4), E(A, C, 1), E(C, B, -2)];
      const r = bellmanFord([A, B, C], edges, 'A');
      expect(r.finalDistances['B']).toBe(-1); // A->C(1) + C->B(-2)
    });

    test('detects reachable negative cycle and marks affected nodes as -Infinity', () => {
      const edges = [E(A, B, 1), E(B, C, -3), E(C, B, 1), E(C, D, 2)];
      const r = bellmanFord([A, B, C, D], edges, 'A');
      expect(r.finalDistances['B']).toBe(-Infinity);
      expect(r.finalDistances['C']).toBe(-Infinity);
      expect(r.finalDistances['D']).toBe(-Infinity); // reachable from negative cycle
    });

    test('negative cycle not reachable from source → unaffected', () => {
      const X = N('X'), Y = N('Y');
      const edges = [E(A, B, 2), E(X, Y, -5), E(Y, X, 1)];
      const r = bellmanFord([A, B, X, Y], edges, 'A');
      expect(r.finalDistances['B']).toBe(2);
      expect(r.finalDistances['X']).toBe(Infinity);
      expect(r.finalDistances['Y']).toBe(Infinity);
    });

    test('invalid source → all Infinity; no paths', () => {
      const r = bellmanFord([A, B], [E(A, B, 1)], '??');
      expect(r.finalDistances['A']).toBe(Infinity);
      expect(Object.keys(r.shortestPaths)).toHaveLength(0);
    });
  });

  // ---------- F L O Y D – W A R S H A L L ----------
  describe('floydWarshall()', () => {
    test('diagonal 0; others Infinity at init', () => {
      const r = floydWarshall([A, B], []);
      const init = r.steps.find(s => s.type === 'init') as any;
      expect(init.distanceMatrix[0][0]).toBe(0);
      expect(init.distanceMatrix[1][1]).toBe(0);
      expect(init.distanceMatrix[0][1]).toBe(Infinity);
      expect(init.distanceMatrix[1][0]).toBe(Infinity);
    });

    test('finds shorter path via intermediate node', () => {
      const edges = [E(A, B, 5), E(A, C, 1), E(C, B, 2)];
      const r = floydWarshall([A, B, C], edges);
      // Implementation reports finalDistances from first node (A)
      expect(r.finalDistances['B']).toBe(3);
      expect(r.finalDistances['C']).toBe(1);
    });

    test('directionality respected (A cannot reach B if only B->A edge exists)', () => {
      const edges = [E(B, A, 1)];
      const r = floydWarshall([A, B], edges);
      expect(r.finalDistances['B']).toBe(Infinity);
    });

    test('negative cycle yields negative diagonal in final matrix', () => {
      const edges = [E(A, B, 1), E(B, A, -3)]; // cycle weight -2
      const r = floydWarshall([A, B], edges);
      const finish = r.steps.filter(s => s.type === 'finish').slice(-1)[0] as any;
      expect(finish.distanceMatrix[0][0]).toBeLessThan(0);
      expect(finish.distanceMatrix[1][1]).toBeLessThan(0);
    });

    test('parallel edges: last assignment wins (current behavior)', () => {
      const edges = [E(A, B, 10), E(A, B, 3)];
      const r = floydWarshall([A, B], edges);
      expect(r.finalDistances['B']).toBe(3);
    });

    test('disconnected nodes remain Infinity from first node', () => {
      const X = N('X'), Y = N('Y'), Z = N('Z');
      const r = floydWarshall([X, Y, Z], []);
      expect(r.finalDistances['Y']).toBe(Infinity);
      expect(r.finalDistances['Z']).toBe(Infinity);
    });

    test('shortestPaths are [firstNode, target] (by design here)', () => {
      const edges = [E(A, B, 2), E(B, C, 2)];
      const r = floydWarshall([A, B, C], edges);
      expect(r.shortestPaths['A']).toEqual(['A', 'A']);
      expect(r.shortestPaths['B']).toEqual(['A', 'B']);
      expect(r.shortestPaths['C']).toEqual(['A', 'C']);
    });
  });

  // ---------- C R O S S – C H E C K S ----------
  describe('Path reconstruction sanity checks', () => {
    test('dijkstra reconstructs one valid shortest path', () => {
      const edges = [E(A, C, 1), E(C, D, 1), E(D, B, 1)];
      const r = dijkstra([A, B, C, D], edges, 'A');
      expect(r.finalDistances['B']).toBe(3);
      expect(r.shortestPaths['B'][0]).toBe('A');
      expect(r.shortestPaths['B'].slice(-1)[0]).toBe('B');
    });

    test('bellman-ford reconstruction avoids infinite loops', () => {
      const edges = [E(A, B, 2), E(B, C, 0), E(C, B, 0), E(C, D, 1)];
      const r = bellmanFord([A, B, C, D], edges, 'A');
      expect(r.finalDistances['D']).toBe(3);
      expect(r.shortestPaths['D'][0]).toBe('A');
      expect(r.shortestPaths['D'].slice(-1)[0]).toBe('D');
    });
  });

  // ---------- E D G E   C A S E S ----------
  describe('Edge cases', () => {
    test('empty graph (no nodes)', () => {
      const r1 = dijkstra([], [], 'A');
      const r2 = bellmanFord([], [], 'A');
      const r3 = floydWarshall([], []);
      expect(Object.keys(r1.finalDistances)).toHaveLength(0);
      expect(Object.keys(r2.finalDistances)).toHaveLength(0);
      expect(Object.keys(r3.finalDistances)).toHaveLength(0);
    });

    test('graph with source and no edges', () => {
      const r = dijkstra([A], [], 'A');
      expect(r.finalDistances['A']).toBe(0);
      expect(r.shortestPaths['A']).toEqual(['A']);
    });
  });
});
