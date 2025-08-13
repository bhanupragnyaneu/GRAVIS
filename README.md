# 🔍 Graph Visualizer

An interactive React TypeScript application for visualizing shortest path algorithms: Dijkstra's, Bellman-Ford, and Floyd-Warshall algorithms.

## ✨ Features

- **Interactive Graph Creation**: Click to add nodes, select modes to create edges
- **Beautiful UI**: Modern gradient design with smooth animations
- **Algorithm Visualization**: Step-by-step execution of shortest path algorithms
- **Real-time Controls**: Play, pause, step forward/backward through algorithm execution
- **Multiple Algorithms**:
  - Dijkstra's Algorithm (non-negative weights)
  - Bellman-Ford Algorithm (handles negative weights, detects negative cycles)
  - Floyd-Warshall Algorithm (all-pairs shortest paths)
- **Interactive Features**:
  - Add/delete nodes and edges
  - Set edge weights
  - Set source nodes
  - Adjustable animation speed
  - Example graphs for testing

## 🚀 Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
   ```
   npm install
   ```
2. Start the development server:
   ```
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

## 🎮 How to Use

### Creating a Graph
1. **Add Nodes**: Select "Add Node" mode and click on empty canvas space
2. **Add Edges**: 
   - Set the desired edge weight in the input field
   - Select "Add Edge" mode
   - Click on the first node (it will turn pink)
   - Click on the second node to create the edge
3. **Set Source**: Double-click any node to set it as the source (turns orange)

### Running Algorithms
1. Select an algorithm from the dropdown menu
2. Ensure you have set a source node
3. Click " Run Algorithm" to start
4. Use the step controls to navigate through the algorithm execution:
   - **Previous/Next**: Step through manually
   - **Auto Play**: Automatically advance through steps
   - **Reset**: Return to initial state

### Graph Manipulation
- **Delete Mode**: Select "Delete" and click on nodes or edges to remove them
- **Clear All**: Remove all nodes and edges from the canvas
- **Edge Weights**: Can be edited when creating edges

## 🎨 Visual Legend

- 🔵 **Light Blue**: Unvisited nodes
- 🟠 **Orange**: Source node
- 🟡 **Gold**: Currently processing node
- 🟢 **Green**: Visited nodes
- 🩷 **Pink**: Selected node for edge creation

## 🔧 Technical Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: CSS3 with CSS Grid and Flexbox
- **Canvas**: HTML5 Canvas API for graph rendering
- **State Management**: React Hooks (useState, useCallback, useEffect)

## 📁 Project Structure

```
src/
├── algorithms/          # Algorithm implementations
│   └── shortestPath.ts  # Dijkstra, Bellman-Ford, Floyd-Warshall
├── components/          # React components
│   ├── GraphVisualizer.tsx
│   └── GraphVisualizer.css
├── hooks/              # Custom React hooks
│   └── useGraphEditor.ts
├── types/              # TypeScript type definitions
│   └── graph.ts
├── App.tsx             # Main App component
├── main.tsx           # Application entry point
```

## 🎯 Algorithm Details

### Dijkstra's Algorithm
- **Time Complexity**: O((V+E)log V)
- **Space Complexity**: O(V)
- **Use Case**: Finding shortest paths from a source to all other vertices (non-negative weights only)

### Bellman-Ford Algorithm
- **Time Complexity**: O(V × E)
- **Space Complexity**: O(V)
- **Use Case**: Finding shortest paths with negative edge weights, detects negative cycles

### Floyd-Warshall Algorithm
- **Time Complexity**: O(V³)
- **Space Complexity**: O(V²)
- **Use Case**: Finding shortest paths between all pairs of vertices

## 🙏 Acknowledgments and Citations

- Built with React and TypeScript
- Inspired by classical graph algorithms visualization tools
- Uses modern web technologies for optimal performance
- Inspired from github projects:
   https://github.com/Dhyaan1/Graph-Algorithm-Visualizer
   https://github.com/Saumy-TOXOTIS/dsa-graph-visualiser
