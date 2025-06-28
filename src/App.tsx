import { useEffect } from 'react'
import NodeCanvas from './components/NodeCanvas'
import NodeList from './components/NodeList'
import ModelSelector from './components/ModelSelector'
import SearchBar from './components/SearchBar'
import { useNodeStore } from './store/nodes'
import { useMockData } from './lib/mockApi'
import './App.css'

function App() {
  const { nodes, setFilteredNodes } = useNodeStore()
  const mockNodes = useMockData()

  useEffect(() => {
    // Initialize with mock data for demo
    if (nodes.length === 0) {
      useNodeStore.setState({ nodes: mockNodes })
    }
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>CreativeOS</h1>
        <p>AI-Powered Knowledge Graph Visualization</p>
      </header>
      <main className="app-main">
        <div className="canvas-container">
          <NodeCanvas />
        </div>
        <div className="sidebar">
          <ModelSelector />
          <SearchBar />
          <NodeList />
        </div>
      </main>
    </div>
  )
}

export default App