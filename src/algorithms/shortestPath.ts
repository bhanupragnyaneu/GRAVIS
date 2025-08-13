import type { Node, Edge, AlgorithmResult, AlgorithmStep } from '../types/graph';

// Simple Priority Queue implementation for Dijkstra's algorithm
class PriorityQueue {
  private items: { node: Node; priority: number }[] = [];

  add(node: Node, priority: number): void {
    this.items.push({ node, priority });
    this.items.sort((a, b) => a.priority - b.priority);
  }

  poll(): Node | undefined {
    return this.items.shift()?.node;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  hasNode(nodeId: string): boolean {
    return this.items.some(item => item.node.id === nodeId);
  }

  changePriority(nodeId: string, newPriority: number): void {
    const index = this.items.findIndex(item => item.node.id === nodeId);
    if (index !== -1) {
      this.items[index].priority = newPriority;
      this.items.sort((a, b) => a.priority - b.priority);
    }
  }
}

export function dijkstra(nodes: Node[], edges: Edge[], sourceId: string): AlgorithmResult {
  const steps: AlgorithmStep[] = [];
  const distances: { [nodeId: string]: number } = {};
  const visitedVertices: { [nodeId: string]: boolean } = {};
  const previousVertices: { [nodeId: string]: string | null } = {};
  const queue = new PriorityQueue();
  const visitedList: string[] = [];

  // Find source node
  const sourceNode = nodes.find(n => n.id === sourceId);
  if (!sourceNode) {
    return { steps: [], finalDistances: {}, shortestPaths: {} };
  }

  // Init all distances with infinity assuming that currently we can't reach
  // any of the vertices except the start one.
  nodes.forEach(node => {
    distances[node.id] = Infinity;
    previousVertices[node.id] = null;
    visitedVertices[node.id] = false;
  });

  // We are already at the startVertex so the distance to it is zero.
  distances[sourceId] = 0;

  // Init vertices queue.
  queue.add(sourceNode, distances[sourceId]);

  steps.push({
    type: 'init',
    message: 'Dijkstra\'s Algorithm initialized with priority queue. Source node distance set to 0.',
    distances: { ...distances },
    visited: [...visitedList],
    previous: { ...previousVertices }
  });

  // Iterate over the priority queue of vertices until it is empty.
  while (!queue.isEmpty()) {
    // Fetch next closest vertex.
    const currentNode = queue.poll();
    if (!currentNode) break;

    // Skip if already visited
    if (visitedVertices[currentNode.id]) continue;

    // Mark as visited
    visitedVertices[currentNode.id] = true;
    visitedList.push(currentNode.id);

    steps.push({
      type: 'visit',
      message: `Visiting node ${currentNode.label} with distance ${distances[currentNode.id].toFixed(1)}`,
      currentNode: currentNode.id,
      distances: { ...distances },
      visited: [...visitedList],
      previous: { ...previousVertices }
    });

    // Get all neighbors (nodes connected by edges from current node)
    const outgoingEdges = edges.filter(edge => edge.from.id === currentNode.id);

    // Iterate over every unvisited neighbor of the current vertex.
    outgoingEdges.forEach(edge => {
      const neighbor = edge.to;
      
      // Don't visit already visited vertices.
      if (!visitedVertices[neighbor.id]) {
        // Update distances to every neighbor from current vertex.
        const existingDistanceToNeighbor = distances[neighbor.id];
        const distanceToNeighborFromCurrent = distances[currentNode.id] + edge.weight;

        // If we've found shorter path to the neighbor - update it.
        if (distanceToNeighborFromCurrent < existingDistanceToNeighbor) {
          distances[neighbor.id] = distanceToNeighborFromCurrent;
          
          // Remember previous closest vertex.
          previousVertices[neighbor.id] = currentNode.id;

          // Change priority of the neighbor in a queue since it might have became closer.
          if (queue.hasNode(neighbor.id)) {
            queue.changePriority(neighbor.id, distances[neighbor.id]);
          } else {
            // Find the actual node object for the neighbor
            const neighborNode = nodes.find(n => n.id === neighbor.id);
            if (neighborNode) {
              queue.add(neighborNode, distances[neighbor.id]);
            }
          }

          steps.push({
            type: 'update',
            message: `Updated distance to ${neighbor.label}: ${distanceToNeighborFromCurrent.toFixed(1)} (via ${currentNode.label})`,
            currentNode: currentNode.id,
            distances: { ...distances },
            visited: [...visitedList],
            previous: { ...previousVertices }
          });
        } else if (!queue.hasNode(neighbor.id)) {
          // Add neighbor to the queue for further visiting even if distance wasn't updated.
          const neighborNode = nodes.find(n => n.id === neighbor.id);
          if (neighborNode) {
            queue.add(neighborNode, distances[neighbor.id]);
          }
        }
      }
    });
  }

  steps.push({
    type: 'finish',
    message: 'Dijkstra\'s algorithm completed!',
    distances: { ...distances },
    visited: visitedList,
    previous: { ...previousVertices }
  });

  // Build shortest paths from previous vertices
  const shortestPaths: { [nodeId: string]: string[] } = {};
  nodes.forEach(node => {
    const path: string[] = [];
    let current: string | null = node.id;
    
    while (current !== null) {
      path.unshift(current);
      current = previousVertices[current];
    }
    
    // Only include path if it starts from source (i.e., node is reachable)
    if (path[0] === sourceId) {
      shortestPaths[node.id] = path;
    }
  });

  return {
    steps,
    finalDistances: distances,
    shortestPaths
  };
}


export function bellmanFord(
  nodes: Node[],
  edges: Edge[],
  sourceId: string
): AlgorithmResult {
  const steps: AlgorithmStep[] = [];
  const distances: { [nodeId: string]: number } = {};
  const previous: { [nodeId: string]: string | null } = {};

  
  nodes.forEach(node => {
    distances[node.id] = node.id === sourceId ? 0 : Infinity;
    previous[node.id] = null;
  });

  steps.push({
    type: 'init',
    message: 'Bellman-Ford Algorithm initialized. Source node distance set to 0.',
    distances: { ...distances },
    previous: { ...previous }
  });

  
  const directedEdges: { from: string; to: string; weight: number }[] = [];
  edges.forEach(edge => {
    directedEdges.push({
      from: edge.from.id,
      to: edge.to.id,
      weight: edge.weight
    });
  });

  
  for (let iteration = 0; iteration < nodes.length - 1; iteration++) {
    let hasUpdate = false;
    
    for (const edge of directedEdges) {
      if (distances[edge.from] !== Infinity) {
        const newDistance = distances[edge.from] + edge.weight;
        
        if (newDistance < distances[edge.to]) {
          distances[edge.to] = newDistance;
          previous[edge.to] = edge.from;
          hasUpdate = true;

          const fromNode = nodes.find(n => n.id === edge.from);
          const toNode = nodes.find(n => n.id === edge.to);
          
          steps.push({
            type: 'update',
            message: `Iteration ${iteration + 1}: Relaxed edge ${fromNode?.label} → ${toNode?.label}, updated distance to ${newDistance.toFixed(1)}`,
            distances: { ...distances },
            previous: { ...previous },
            currentNode: edge.from
          });
        }
      }
    }

    
    if (!hasUpdate) {
      steps.push({
        type: 'visit',
        message: `No updates in iteration ${iteration + 1}, algorithm can terminate early.`,
        distances: { ...distances },
        previous: { ...previous }
      });
      break;
    }
  }

  
  let hasNegativeCycle = false;
  const negativeNodes = new Set<string>();
  
  for (const edge of directedEdges) {
    if (distances[edge.from] !== Infinity) {
      const newDistance = distances[edge.from] + edge.weight;
      
      if (newDistance < distances[edge.to]) {
        hasNegativeCycle = true;
        negativeNodes.add(edge.to);
        
        const fromNode = nodes.find(n => n.id === edge.from);
        const toNode = nodes.find(n => n.id === edge.to);
        
        steps.push({
          type: 'update',
          message: `Negative cycle detected! Edge ${fromNode?.label} → ${toNode?.label} can still be relaxed.`,
          distances: { ...distances },
          previous: { ...previous }
        });
      }
    }
  }

  if (hasNegativeCycle) {
    
    const queue = Array.from(negativeNodes);
    const visited = new Set<string>();
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      
      distances[current] = -Infinity;
      previous[current] = null;
      
      
      for (const edge of directedEdges) {
        if (edge.from === current && !visited.has(edge.to)) {
          queue.push(edge.to);
        }
      }
    }
    
    steps.push({
      type: 'finish',
      message: `Bellman-Ford completed with negative cycle detection. ${visited.size} nodes affected by negative cycles.`,
      distances: { ...distances },
      previous: { ...previous }
    });
  } else {
    steps.push({
      type: 'finish',
      message: 'Bellman-Ford algorithm completed successfully! No negative cycles detected.',
      distances: { ...distances },
      previous: { ...previous }
    });
  }

  
  const shortestPaths: { [nodeId: string]: string[] } = {};
  nodes.forEach(node => {
    if (distances[node.id] === -Infinity || distances[node.id] === Infinity) {
      return;
    }
    
    const path: string[] = [];
    let current: string | null = node.id;
    const visited = new Set<string>();
    
    while (current !== null && !visited.has(current)) {
      visited.add(current);
      path.unshift(current);
      current = previous[current];
    }
    
    if (path.length > 0 && path[0] === sourceId) {
      shortestPaths[node.id] = path;
    }
  });

  return {
    steps,
    finalDistances: distances,
    shortestPaths
  };
}

export function floydWarshall(nodes: Node[], edges: Edge[]): AlgorithmResult {
  const steps: AlgorithmStep[] = [];
  const n = nodes.length;
  const nodeIds = nodes.map(node => node.id);
  
  
  const dist: number[][] = Array(n).fill(null).map(() => Array(n).fill(Infinity));
  const next: (number | null)[][] = Array(n).fill(null).map(() => Array(n).fill(null));

  
  for (let i = 0; i < n; i++) {
    dist[i][i] = 0;
  }


  edges.forEach(edge => {
    const i = nodeIds.indexOf(edge.from.id);
    const j = nodeIds.indexOf(edge.to.id);
    dist[i][j] = edge.weight;
    next[i][j] = j;
  });

  steps.push({
    type: 'init',
    message: 'Floyd-Warshall Algorithm initialized with direct edge distances.',
    distanceMatrix: dist.map(row => [...row]),
    nodes: nodeIds
  });


  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (dist[i][k] + dist[k][j] < dist[i][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
          next[i][j] = next[i][k];

          steps.push({
            type: 'update',
            message: `Using ${nodeIds[k]} as intermediate: Updated distance from ${nodeIds[i]} to ${nodeIds[j]}: ${dist[i][j]}`,
            distanceMatrix: dist.map(row => [...row]),
            nodes: nodeIds,
            iNode: nodeIds[i],
            jNode: nodeIds[j],
            kNode: nodeIds[k]
          });
        }
      }
    }
  }

  steps.push({
    type: 'finish',
    message: 'Floyd-Warshall algorithm completed!',
    distanceMatrix: dist.map(row => [...row]),
    nodes: nodeIds
  });


  const finalDistances: { [nodeId: string]: number } = {};
  const shortestPaths: { [nodeId: string]: string[] } = {};

  if (nodes.length > 0) {
    const sourceIndex = 0;
    nodes.forEach((node, index) => {
      finalDistances[node.id] = dist[sourceIndex][index];
      shortestPaths[node.id] = [nodeIds[sourceIndex], node.id]; // Simplified path
    });
  }

  return {
    steps,
    finalDistances,
    shortestPaths
  };
}


