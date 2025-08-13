import { useState, useCallback, useRef } from 'react';
import type { Node, Edge, EditMode } from '../types/graph';

export function useGraphEditor(onSourceNodeSet?: (node: Node) => void) {
  const [edgeWeight, setEdgeWeight] = useState<number>(1);
  const [editMode, setEditMode] = useState<EditMode>('normal');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [sourceNode, setSourceNode] = useState<Node | null>(null);
  const [isAddingEdge, setIsAddingEdge] = useState<boolean>(false);
  const [edgeStart, setEdgeStart] = useState<Node | null>(null);
  const [edges, setEdges] = useState<Edge[]>([]);
  const nodeIdCounter = useRef(0);

  const generateNodeId = useCallback(() => {
    return String.fromCharCode(65 + nodeIdCounter.current++);
  }, []);

  const addNode = useCallback((x: number, y: number) => {
    const id = generateNodeId();
    const newNode: Node = {
      id,
      label: id,
      x,
      y,
      distance: Infinity,
      visited: false,
      previous: null,
      current: false
    };
    setNodes(prev => [...prev, newNode]);
    return newNode;
  }, [generateNodeId]);
  
  const removeNode = useCallback((nodeToRemove: Node) => {
    setNodes(prev => prev.filter(node => node.id !== nodeToRemove.id));
    setEdges(prev => prev.filter(edge => 
      edge.from.id !== nodeToRemove.id && edge.to.id !== nodeToRemove.id
    ));
    if (sourceNode?.id === nodeToRemove.id) {
      setSourceNode(null);
    }
  }, [sourceNode]);


  const addEdge = useCallback((from: Node, to: Node, weight: number) => {
    const newEdge: Edge = {
      from,
      to,
      weight,
      inPath: false
    };
    setEdges(prev => [...prev, newEdge]);
    return newEdge;
  }, []);

  const removeEdge = useCallback((edgeToRemove: Edge) => {
    setEdges(prev => prev.filter(edge => edge !== edgeToRemove));
  }, []);

  const clearGraph = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSourceNode(null);
    setIsAddingEdge(false);
    setEdgeStart(null);
    nodeIdCounter.current = 0;
  }, []);

  const findNodeAt = useCallback((x: number, y: number, radius: number = 25): Node | null => {
    return nodes.find(node => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= radius;
    }) || null;
  }, [nodes]);

  const resetAlgorithmState = useCallback(() => {
    setNodes(prev => prev.map(node => ({
      ...node,
      distance: Infinity,
      visited: false,
      previous: null,
      current: false
    })));
    setEdges(prev => prev.map(edge => ({
      ...edge,
      inPath: false
    })));
  }, []);

  const findEdgeAt = useCallback((x: number, y: number, tolerance: number = 15): Edge | null => {
    return edges.find(edge => {
      const midX = (edge.from.x + edge.to.x) / 2;
      const midY = (edge.from.y + edge.to.y) / 2;
      const distance = Math.sqrt((x - midX) ** 2 + (y - midY) ** 2);
      return distance <= tolerance;
    }) || null;
  }, [edges]);

  const handleCanvasClick = useCallback((x: number, y: number) => {
    const clickedNode = findNodeAt(x, y);
    
    if (clickedNode) {
      switch (editMode) {
        case 'addNode':
          // Do nothing if clicking on existing node
          break;
        case 'addEdge':
          if (isAddingEdge && edgeStart && edgeStart.id !== clickedNode.id) {
            // Complete edge creation
            const existingEdge = edges.find(edge =>
              (edge.from.id === edgeStart.id && edge.to.id === clickedNode.id) ||
              (edge.from.id === clickedNode.id && edge.to.id === edgeStart.id)
            );
            
            if (!existingEdge) {
              addEdge(edgeStart, clickedNode, edgeWeight);
            }
            setIsAddingEdge(false);
            setEdgeStart(null);
          } else if (!isAddingEdge) {
            // Start edge creation
            setIsAddingEdge(true);
            setEdgeStart(clickedNode);
          }
          break;
        case 'delete':
          removeNode(clickedNode);
          break;
        case 'setSource':
          setSourceNode(clickedNode);
          onSourceNodeSet?.(clickedNode);
          break;
        default:
          break;
      }
    } else {
      // Clicked on empty space
      const clickedEdge = findEdgeAt(x, y);
      
      if (clickedEdge && editMode === 'delete') {
        removeEdge(clickedEdge);
      } else if (editMode === 'addNode' && !clickedEdge) {
        addNode(x, y);
      } else if (isAddingEdge) {
        // Cancel edge creation
        setIsAddingEdge(false);
        setEdgeStart(null);
      }
    }
  }, [editMode, isAddingEdge, edgeStart, edgeWeight, edges, findNodeAt, findEdgeAt, addNode, addEdge, removeNode, removeEdge, setSourceNode]);

  const updateEdgeWeight = useCallback((edge: Edge, newWeight: number) => {
    setEdges(prev => prev.map(e => 
      e === edge ? { ...e, weight: newWeight } : e
    ));
  }, []);

  return {
    nodes,
    edges,
    editMode,
    sourceNode,
    edgeWeight,
    isAddingEdge,
    edgeStart,
    setEditMode,
    setSourceNode,
    setEdgeWeight,
    addNode,
    addEdge,
    removeNode,
    removeEdge,
    clearGraph,
    resetAlgorithmState,
    handleCanvasClick,
    updateEdgeWeight,
    findNodeAt,
    findEdgeAt
  };
}
