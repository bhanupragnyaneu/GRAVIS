import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useGraphEditor } from '../hooks/useGraphEditor';
import { dijkstra, bellmanFord, floydWarshall } from '../algorithms/shortestPath';
import type { Node, Edge, AlgorithmType, AlgorithmStep, StatusType } from '../types/graph';
import './GraphVisualizer.css';

// Integrated buildAdjacencyMatrix function (with adaptations)
export const buildAdjacencyMatrix = (nodes: Node[], edges: Edge[]) => {
    if (nodes.length === 0) return { matrix: [], nodeOrder: [] };

    const nodeIndexMap = new Map<string, number>();
    // Sort nodes by label for a consistent matrix order
    const sortedNodes = [...nodes].sort((a, b) => a.label.localeCompare(b.label));

    sortedNodes.forEach((node, index) => {
        nodeIndexMap.set(node.id, index);
    });

    const size = sortedNodes.length;
    const matrix: (number | string)[][] = Array(size).fill(0).map(() => Array(size).fill('∞'));

    // Set diagonal to 0
    for (let i = 0; i < size; i++) {
      matrix[i][i] = 0;
    }

    edges.forEach(edge => {
        const startIndex = nodeIndexMap.get(edge.from.id);
        const endIndex = nodeIndexMap.get(edge.to.id);

        if (startIndex !== undefined && endIndex !== undefined) {
            matrix[startIndex][endIndex] = edge.weight;
        }
    });
    
    const nodeOrder = sortedNodes.map(n => n.label);
    return { matrix, nodeOrder };
};


const GraphVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 500 });
  
  const {
    nodes,
    edges,
    editMode,
    sourceNode,
    edgeWeight,
    isAddingEdge,
    edgeStart,
    setEditMode,
    setEdgeWeight,
    clearGraph,
    resetAlgorithmState,
    handleCanvasClick
  } = useGraphEditor((node) => {
    setStatusMessage(`Source node set to: ${node.label}`);
  });

  // Algorithm state
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('dijkstra');
  const [algorithmRunning, setAlgorithmRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<AlgorithmStep[]>([]);
  const [animationSpeed, setAnimationSpeed] = useState(500);
  const [autoPlay, setAutoPlay] = useState(false);
  const [status, setStatus] = useState<StatusType>('idle');
  const [statusMessage, setStatusMessage] = useState('Ready - Add nodes to begin');

  // Adjacency Matrix State
  const [adjacencyMatrix, setAdjacencyMatrix] = useState<(string | number)[][]>([]);
  const [matrixNodeOrder, setMatrixNodeOrder] = useState<string[]>([]);

  // Mouse position for edge preview
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Update canvas dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: Math.max(width, 800), height: Math.max(height, 400) });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
    // Update Adjacency Matrix whenever nodes or edges change
    useEffect(() => {
        if (!algorithmRunning) {
            const { matrix, nodeOrder } = buildAdjacencyMatrix(nodes, edges);
            setAdjacencyMatrix(matrix);
            setMatrixNodeOrder(nodeOrder);
        }
    }, [nodes, edges, algorithmRunning]);

  // Draw the graph
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw debug info
    ctx.fillStyle = '#999';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Nodes: ${nodes.length} | Edges: ${edges.length} | Mode: ${editMode}`, 50, 20);
    if (isAddingEdge && edgeStart) {
      ctx.fillText(`Creating edge from: ${edgeStart.label}`, 10, 35);
    }

    // Draw edges
    edges.forEach(edge => {
      // Calculate angle for arrow
      const dx = edge.to.x - edge.from.x;
      const dy = edge.to.y - edge.from.y;
      const angle = Math.atan2(dy, dx);
      
      // Adjust for node radius (25px)
      const nodeRadius = 25;
      const startX = edge.from.x + Math.cos(angle) * nodeRadius;
      const startY = edge.from.y + Math.sin(angle) * nodeRadius;
      const endX = edge.to.x - Math.cos(angle) * nodeRadius;
      const endY = edge.to.y - Math.sin(angle) * nodeRadius;

      // Draw edge line
      ctx.beginPath();
      ctx.strokeStyle = edge.inPath ? '#FF6B6B' : '#666';
      ctx.lineWidth = edge.inPath ? 4 : 2;
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Draw arrowhead
      const arrowSize = 12;
      ctx.beginPath();
      ctx.fillStyle = edge.inPath ? '#FF6B6B' : '#666';
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowSize * Math.cos(angle - Math.PI / 6),
        endY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        endX - arrowSize * Math.cos(angle + Math.PI / 6),
        endY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();

      // Draw weight label
      const midX = (edge.from.x + edge.to.x) / 2;
      const midY = (edge.from.y + edge.to.y) / 2;

      // White background circle for weight
      ctx.beginPath();
      ctx.arc(midX, midY, 15, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Weight text
      ctx.fillStyle = '#333';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(edge.weight.toString(), midX, midY);
    });

    // Draw temporary edge during creation
    if (isAddingEdge && edgeStart) {
      ctx.beginPath();
      ctx.strokeStyle = '#999';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.moveTo(edgeStart.x, edgeStart.y);
      ctx.lineTo(mousePos.x, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw nodes
    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 25, 0, Math.PI * 2);

      // Determine node color
      let fillColor = '#87CEEB'; // Light blue default
      if (node === sourceNode) {
        fillColor = '#FFA500'; // Orange for source
      } else if (node === edgeStart) {
        fillColor = '#FF69B4'; // Pink for edge start
      } else if (algorithmRunning && steps.length > 0 && currentStep < steps.length) {
        const step = steps[currentStep];
        if (step.currentNode === node.id) {
          fillColor = '#FFD700'; // Gold for current
        } else if (step.visited?.includes(node.id)) {
          fillColor = '#90EE90'; // Green for visited
        }
      }

      ctx.fillStyle = fillColor;
      ctx.fill();

      // Node border
      ctx.strokeStyle = '#333';
      ctx.lineWidth = node === edgeStart ? 4 : 2;
      ctx.stroke();

      // Node label
      ctx.fillStyle = '#333';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, node.x, node.y);

      // Distance label during algorithm
      if (algorithmRunning && steps.length > 0 && currentStep < steps.length) {
        const step = steps[currentStep];
        if (step.distances && step.distances[node.id] !== undefined) {
          const distance = step.distances[node.id];
          const displayDist = distance === Infinity ? '∞' : distance.toFixed(1);
          
          ctx.fillStyle = '#667eea';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(displayDist, node.x, node.y - 40);
        }
      }
    });
  }, [nodes, edges, editMode, sourceNode, isAddingEdge, edgeStart, mousePos, algorithmRunning, steps, currentStep]);

  // Update canvas when dimensions change
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = dimensions.width;
      canvasRef.current.height = dimensions.height;
      drawGraph();
    }
  }, [dimensions, drawGraph]);

  // Canvas event handlers
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    // Update cursor based on edit mode and hover state
    let cursor = 'crosshair';
    if (editMode === 'delete') {
      cursor = 'pointer';
    } else if (isAddingEdge) {
      cursor = 'pointer';
    }
    canvas.style.cursor = cursor;
  }, [editMode, isAddingEdge]);

  const handleCanvasClickEvent = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || algorithmRunning) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    handleCanvasClick(x, y);
  }, [handleCanvasClick, algorithmRunning]);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    // Double-click functionality removed - use "Select Source" button instead
    e.preventDefault();
  }, []);

  // Run algorithm
  const runAlgorithm = useCallback(() => {
    if (!sourceNode) {
      setStatusMessage('Please set a source node first (double-click a node)');
      setStatus('error');
      return;
    }
    const hasNegativeEdge = edges.some(edge => edge.weight < 0);
    if (algorithm === 'dijkstra' && hasNegativeEdge) {
    setStatusMessage("Dijkstra's algorithm cannot run on graphs with negative edge weights.");
    setStatus('error');
    return;
    }
    resetAlgorithmState();
    setStatus('running');
    setStatusMessage('Running algorithm...');

    let result;
    switch (algorithm) {
      case 'dijkstra':
        result = dijkstra(nodes, edges, sourceNode.id);
        break;
      case 'bellmanFord':
        result = bellmanFord(nodes, edges, sourceNode.id);
        break;
      case 'floydWarshall':
        result = floydWarshall(nodes, edges);
        break;
      default:
        return;
    }

    setSteps(result.steps);
    setCurrentStep(0);
    setAlgorithmRunning(true);
    setStatusMessage('Algorithm initialized. Use controls to step through.');
  }, [sourceNode, algorithm, nodes, edges, resetAlgorithmState]);

  // Step controls
  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setStatusMessage(steps[currentStep + 1]?.message || '');
    }
  }, [currentStep, steps]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setStatusMessage(steps[currentStep - 1]?.message || '');
    }
  }, [currentStep, steps]);

  const resetAlgorithm = useCallback(() => {
    setAlgorithmRunning(false);
    setCurrentStep(0);
    setSteps([]);
    setAutoPlay(false);
    setStatus('idle');
    setStatusMessage('Algorithm reset');
    resetAlgorithmState();
  }, [resetAlgorithmState]);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && algorithmRunning && currentStep < steps.length - 1) {
      const timeoutId = setTimeout(nextStep, animationSpeed);
      return () => clearTimeout(timeoutId);
    } else if (currentStep === steps.length - 1 && autoPlay) {
      setAutoPlay(false);
      setStatus('complete');
      setStatusMessage('Algorithm completed!');
    }
  }, [autoPlay, algorithmRunning, currentStep, steps.length, nextStep, animationSpeed]);

  return (
    <div className="container">
      <h1>
        <img 
          src="/gravis.png" 
          alt="Gravis Logo" 
          style={{
            verticalAlign: 'middle', 
            marginRight: '8px',
            height: '100px',
            width: 'auto'
          }} 
        />
        Graph Visualizer
      </h1>
      
      <div className="instructions">
        <h4>How to Use:</h4>
        <strong>📍 Creating Nodes:</strong> Select "Add Node" and click empty space<br/>
        <strong>🔗 Creating Edges:</strong> <span style={{background: 'yellow', padding: '2px 4px', borderRadius: '3px'}}>1. Set weight → 2. Select "Add Edge" → 3. Click first node → 4. Click second node</span><br/>
        <strong>🎯 Set Source:</strong> Select "Select Source" mode and click a node (turns orange)<br/>
        <strong>🗑️ Delete:</strong> Select "Delete" mode and click nodes or edges<br/>
        <strong style={{color: '#667eea'}}>💡 Tip:</strong> Watch step-by-step algorithm execution!
      </div>

      <div className="main-layout">
        <div className="canvas-section">
          <div className="canvas-container" ref={containerRef}>
            <canvas 
              ref={canvasRef}
              width={dimensions.width}
              height={dimensions.height}
              onMouseMove={handleMouseMove}
              onClick={handleCanvasClickEvent}
              onDoubleClick={handleDoubleClick}
            />
          </div>

          <div className="controls">
            <button 
              className={`btn ${editMode === 'addNode' ? 'active' : ''}`}
              onClick={() => setEditMode('addNode')}
              disabled={algorithmRunning}
            >
              Add Node
            </button>
            <button 
              className={`btn ${editMode === 'addEdge' ? 'active' : ''}`}
              onClick={() => setEditMode('addEdge')}
              disabled={algorithmRunning}
            >
              Add Edge
            </button>
        <button 
          className={`btn danger ${editMode === 'delete' ? 'active' : ''}`}
          onClick={() => setEditMode('delete')}
          disabled={algorithmRunning}
        >
          Delete
        </button>
        <button 
          className={`btn success ${editMode === 'setSource' ? 'active' : ''}`}
          onClick={() => setEditMode('setSource')}
          disabled={algorithmRunning}
        >
          Select Source
        </button>            {!algorithmRunning ? (
              <>
                <button 
  className="btn success" 
  onClick={runAlgorithm} 
  disabled={algorithm === 'dijkstra' && edges.some(edge => edge.weight < 0) || algorithmRunning}
>▶ Run {algorithm}</button>
                <button className="btn" onClick={clearGraph}>Clear All</button>
              </>
            ) : (
              <>
                <button className="btn" onClick={prevStep} disabled={currentStep === 0}>⏮ Previous</button>
                <button className="btn" onClick={nextStep} disabled={currentStep === steps.length - 1}>Next ⏭</button>
                <button 
                  className={`btn ${autoPlay ? 'active' : ''}`}
                  onClick={() => setAutoPlay(!autoPlay)}
                  disabled={currentStep === steps.length - 1}
                >
                  {autoPlay ? '⏸ Pause' : '▶ Auto Play'}
                </button>
                <button className="btn danger" onClick={resetAlgorithm}>🔄 Reset</button>
              </>
            )}
          </div>

          <div className="speed-control">
            <label>Animation Speed:</label>
            <input 
              type="range" 
              min="100" 
              max="2000" 
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
            />
            <span>{animationSpeed}ms</span>
            
            <span style={{marginLeft: '20px', color: '#667eea', fontWeight: 'bold'}}>Edge Weight:</span>
            <input 
              type="number" 
              value={edgeWeight} 
              step="0.1"
              onChange={(e) => setEdgeWeight(parseFloat(e.target.value) || 1)}
              style={{width: '70px', marginLeft: '10px'}}
            />
          </div>

          <div className="algorithm-controls">
            <select 
  value={algorithm} 
  onChange={(e) => setAlgorithm(e.target.value as AlgorithmType)}
  disabled={algorithmRunning}
>
  <option 
    value="dijkstra" 
    disabled={edges.some(edge => edge.weight < 0)}
    title={edges.some(edge => edge.weight < 0) ? "Disabled due to negative edge weights" : ""}
  >
    Dijkstra's Algorithm {edges.some(edge => edge.weight < 0) ? "(Not available: negative edges)" : ""}
  </option>
  <option value="bellmanFord">Bellman-Ford Algorithm</option>
  <option value="floydWarshall">Floyd-Warshall Algorithm</option>
</select>
          </div>

          <div className={`status ${status}`}>
            {statusMessage}
          </div>
        </div>

        <div className="info-section">
          <div className="info-panel">
            <div className="panel">
              <h3>📊 Distance Table</h3>
              <table className="distance-table">
                <thead>
                  <tr>
                    <th>Node</th>
                    <th>Distance</th>
                    <th>Previous</th>
                  </tr>
                </thead>
                <tbody>
                  {nodes.map(node => {
                    const currentStepData = algorithmRunning && steps.length > 0 && currentStep < steps.length ? steps[currentStep] : null;
                    const distance = currentStepData?.distances?.[node.id] ?? node.distance;
                    const previous = currentStepData?.previous?.[node.id] ?? null;
                    
                    return (
                      <tr key={node.id}>
                        <td>{node.label}</td>
                        <td>{distance === Infinity ? '∞' : distance.toFixed(1)}</td>
                        <td>{previous || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
             {/* New Adjacency Matrix Panel */}
             <div className="panel">
                            <h3>📋 Adjacency Matrix</h3>
                            {nodes.length > 0 ? (
                                <table className="matrix">
                                    <thead>
                                        <tr>
                                            <th></th>
                                            {matrixNodeOrder.map(label => <th key={label}>{label}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {matrixNodeOrder.map((label, rowIndex) => (
                                            <tr key={label}>
                                                <th>{label}</th>
                                                {adjacencyMatrix[rowIndex].map((val, colIndex) => (
                                                    <td key={`${label}-${matrixNodeOrder[colIndex]}`}
                                                        className={val === '∞' ? 'infinity' : ''}
                                                    >
                                                        {val}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : <p>Add nodes to see the matrix.</p>}
                        </div>
            <div className="panel">
              <h3>📝 Algorithm Info</h3>
              <div className="algorithm-info">
                {algorithm === 'dijkstra' && (
                  <div>
                    <strong>Dijkstra's Algorithm</strong><br/>
                    Time: O((V+E)log V)<br/>
                    Space: O(V)<br/>
                    Note: Works only with non-negative weights
                  </div>
                )}
                {algorithm === 'bellmanFord' && (
                  <div>
                    <strong>Bellman-Ford Algorithm</strong><br/>
                    Time: O(V × E)<br/>
                    Space: O(V)<br/>
                    Note: Handles negative weights, detects negative cycles
                  </div>
                )}
                {algorithm === 'floydWarshall' && (
                  <div>
                    <strong>Floyd-Warshall Algorithm</strong><br/>
                    Time: O(V³)<br/>
                    Space: O(V²)<br/>
                    Note: Finds all-pairs shortest paths
                  </div>
                )}
              </div>
            </div>
          </div>

          {algorithm === 'floydWarshall' && algorithmRunning && steps.length > 0 && currentStep < steps.length && (
            <div className="panel matrix-panel">
              <h3>📋 Distance Matrix (Floyd-Warshall)</h3>
              <div className="matrix-container">
                <table className="matrix">
                  <thead>
                    <tr>
                      <th></th>
                      {steps[currentStep]?.nodes?.map(nodeId => (
                        <th key={nodeId}>{nodeId}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {steps[currentStep]?.nodes?.map((rowNodeId, i) => (
                      <tr key={rowNodeId}>
                        <th>{rowNodeId}</th>
                        {steps[currentStep]?.nodes?.map((colNodeId, j) => {
                          const value = steps[currentStep]?.distanceMatrix?.[i]?.[j];
                          const isHighlighted = 
                            steps[currentStep]?.type === 'update' && 
                            rowNodeId === steps[currentStep]?.iNode && 
                            colNodeId === steps[currentStep]?.jNode;
                          
                          return (
                            <td 
                              key={`${rowNodeId}-${colNodeId}`}
                              className={isHighlighted ? 'updated' : (value === Infinity ? 'infinity' : '')}
                            >
                              {value === Infinity ? '∞' : value}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="legend">
        <div className="legend-item">
          <div className="legend-color" style={{background: '#90EE90'}}></div>
          <span>Visited</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{background: '#FFD700'}}></div>
          <span>Current</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{background: '#87CEEB'}}></div>
          <span>Unvisited</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{background: '#FFA500'}}></div>
          <span>Source</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{background: '#FF69B4'}}></div>
          <span>Edge Start</span>
        </div>
      </div>
    </div>
  );
};

export default GraphVisualizer;