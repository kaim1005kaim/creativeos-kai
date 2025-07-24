import { useEffect, useState, useCallback } from 'react'
import NodeCanvas from './components/NodeCanvas'
import NodeList from './components/NodeList'
import ModelSelector from './components/ModelSelector'
import SearchBar from './components/SearchBar'
import ClusterVisualization from './components/ClusterVisualization'
import TimelineVisualization from './components/TimelineVisualization'
import AdvancedClusterView from './components/AdvancedClusterView'
import TimelineView from './components/TimelineView'
import HeatmapView from './components/HeatmapView'
import LinkManager from './components/LinkManager'
import AddNodeButton from './components/AddNodeButton'
import AdvancedFilters from './components/AdvancedFilters'
import AdvancedSearch from './components/AdvancedSearch'
import TagManager from './components/TagManager'
import Dashboard from './components/Dashboard'
import ThemeToggle from './components/ThemeToggle'
import GoogleLoginButton from './components/GoogleLoginButton'
import { useNodeStore } from './store/nodes'
import { useMockData } from './lib/mockApi'
import { useTheme } from './contexts/ThemeContext'
import { Cluster } from './lib/clustering'
import { Cluster as AdvancedCluster } from './lib/advancedClustering'
import './App.css'

function App() {
  const { nodes, setFilteredNodes, selectedNodeId, setSelectedNodeId } = useNodeStore()
  const mockNodes = useMockData()
  const { colors } = useTheme()
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'clusters' | 'timeline' | 'links' | 'dashboard' | 'advanced-clusters' | 'timeline-view' | 'heatmap'>('list')
  const [user, setUser] = useState<{ id: string; email: string; name: string; picture: string } | null>(null)

  useEffect(() => {
    // Initialize with mock data for demo
    if (nodes.length === 0) {
      useNodeStore.setState({ nodes: mockNodes })
    }
    
    // Check for session info in URL (temporary auth handling)
    const urlParams = new URLSearchParams(window.location.search)
    const sessionParam = urlParams.get('session')
    if (sessionParam) {
      try {
        const sessionData = JSON.parse(decodeURIComponent(sessionParam))
        setUser(sessionData)
        // Store in localStorage for persistence
        localStorage.setItem('creativeos_user', JSON.stringify(sessionData))
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname)
      } catch (e) {
        console.error('Failed to parse session data:', e)
      }
    } else {
      // Check localStorage for existing session
      const storedUser = localStorage.getItem('creativeos_user')
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (e) {
          console.error('Failed to parse stored user:', e)
        }
      }
    }
  }, [])

  const handleClusterSelect = (cluster: Cluster | null) => {
    setSelectedCluster(cluster)
    if (cluster) {
      setFilteredNodes(cluster.nodes.map(n => n.id))
    } else {
      setFilteredNodes([])
    }
  }

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId)
  }

  const handleDateRangeSelect = useCallback((startDate: Date, endDate: Date) => {
    const start = startDate.getTime()
    const end = endDate.getTime()
    const filteredIds = nodes
      .filter(node => node.createdAt >= start && node.createdAt <= end)
      .map(node => node.id)
    setFilteredNodes(filteredIds)
  }, [nodes, setFilteredNodes])

  const handleAdvancedFiltersChange = useCallback((filteredIds: string[]) => {
    setFilteredNodes(filteredIds)
  }, [setFilteredNodes])

  const handleAdvancedSearchResults = useCallback((filteredIds: string[]) => {
    setFilteredNodes(filteredIds)
  }, [setFilteredNodes])

  const handleTagFilter = useCallback((selectedTags: string[]) => {
    if (selectedTags.length === 0) {
      setFilteredNodes([])
      return
    }
    
    const filteredIds = nodes
      .filter(node => 
        selectedTags.every(tag => node.tags?.includes(tag))
      )
      .map(node => node.id)
    setFilteredNodes(filteredIds)
  }, [nodes, setFilteredNodes])

  return (
    <div className="app" style={{ backgroundColor: colors.background, color: colors.text }}>
      <header className="app-header" style={{ backgroundColor: colors.surface, color: colors.text }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>CreativeOS</h1>
            <p>AI-Powered Knowledge Graph Visualization</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img 
                  src={user.picture} 
                  alt={user.name}
                  style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '50%',
                    border: '2px solid ' + colors.primary
                  }}
                />
                <span style={{ fontSize: '14px' }}>{user.name}</span>
                <button
                  onClick={() => {
                    setUser(null)
                    localStorage.removeItem('creativeos_user')
                    window.location.href = '/'
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'transparent',
                    color: colors.text,
                    border: '1px solid ' + colors.text,
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  ログアウト
                </button>
              </div>
            ) : (
              <div style={{ width: '200px' }}>
                <GoogleLoginButton />
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="app-main">
        <div className="canvas-container">
          <NodeCanvas />
        </div>
        <div className="sidebar">
          <div style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <ThemeToggle />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              </div>
            </div>
            <ModelSelector />
            <AddNodeButton />
            <SearchBar />
            <AdvancedSearch onSearchResults={handleAdvancedSearchResults} />
            <TagManager mode="filter" onTagFilter={handleTagFilter} />
            <AdvancedFilters onFiltersChange={handleAdvancedFiltersChange} />
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              backgroundColor: colors.surface,
              borderRadius: '6px',
              padding: '4px',
              marginTop: '10px',
              marginBottom: '1rem'
            }}>
              {/* First row - 3 tabs */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '4px'
              }}>
                <button
                  onClick={() => setActiveTab('list')}
                  style={{
                    padding: '8px 6px',
                    backgroundColor: activeTab === 'list' ? colors.primary : 'transparent',
                    color: activeTab === 'list' ? colors.background : colors.text,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                >
                  ノード一覧
                </button>
                <button
                  onClick={() => setActiveTab('clusters')}
                  style={{
                    padding: '8px 6px',
                    backgroundColor: activeTab === 'clusters' ? colors.primary : 'transparent',
                    color: activeTab === 'clusters' ? colors.background : colors.text,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                >
                  クラスター
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  style={{
                    padding: '8px 6px',
                    backgroundColor: activeTab === 'timeline' ? colors.primary : 'transparent',
                    color: activeTab === 'timeline' ? colors.background : colors.text,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                >
                  タイムライン
                </button>
              </div>
              
              {/* Second row - 2 tabs */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '4px'
              }}>
                <button
                  onClick={() => setActiveTab('links')}
                  style={{
                    padding: '8px 6px',
                    backgroundColor: activeTab === 'links' ? colors.primary : 'transparent',
                    color: activeTab === 'links' ? colors.background : colors.text,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                >
                  リンク管理
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  style={{
                    padding: '8px 6px',
                    backgroundColor: activeTab === 'dashboard' ? colors.primary : 'transparent',
                    color: activeTab === 'dashboard' ? colors.background : colors.text,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                >
                  ダッシュボード
                </button>
              </div>
              
              {/* Third row - Advanced features */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '4px'
              }}>
                <button
                  onClick={() => setActiveTab('advanced-clusters')}
                  style={{
                    padding: '8px 6px',
                    backgroundColor: activeTab === 'advanced-clusters' ? colors.primary : 'transparent',
                    color: activeTab === 'advanced-clusters' ? colors.background : colors.text,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}
                >
                  🔮 高度クラスター
                </button>
                <button
                  onClick={() => setActiveTab('timeline-view')}
                  style={{
                    padding: '8px 6px',
                    backgroundColor: activeTab === 'timeline-view' ? colors.primary : 'transparent',
                    color: activeTab === 'timeline-view' ? colors.background : colors.text,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}
                >
                  📅 タイムライン
                </button>
                <button
                  onClick={() => setActiveTab('heatmap')}
                  style={{
                    padding: '8px 6px',
                    backgroundColor: activeTab === 'heatmap' ? colors.primary : 'transparent',
                    color: activeTab === 'heatmap' ? colors.background : colors.text,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}
                >
                  🔥 ヒートマップ
                </button>
              </div>
            </div>
          </div>
          
          {activeTab === 'list' && <NodeList />}
          {activeTab === 'clusters' && (
            <ClusterVisualization
              nodes={nodes}
              onClusterSelect={handleClusterSelect}
              onNodeSelect={handleNodeSelect}
            />
          )}
          {activeTab === 'timeline' && (
            <TimelineVisualization
              nodes={nodes}
              onNodeSelect={handleNodeSelect}
              onDateRangeSelect={handleDateRangeSelect}
            />
          )}
          {activeTab === 'links' && <LinkManager />}
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'advanced-clusters' && (
            <AdvancedClusterView
              onNodeSelect={handleNodeSelect}
              onClusterSelect={(cluster: AdvancedCluster | null) => {
                // Convert AdvancedCluster to Cluster if needed
                if (cluster) {
                  const convertedCluster: Cluster = {
                    id: cluster.id.toString(),
                    nodes: cluster.nodes.map(cn => cn.node),
                    center: cluster.centroid,
                    color: cluster.color,
                    label: cluster.label
                  }
                  handleClusterSelect(convertedCluster)
                } else {
                  handleClusterSelect(null)
                }
              }}
            />
          )}
          {activeTab === 'timeline-view' && (
            <TimelineView
              onNodeSelect={handleNodeSelect}
            />
          )}
          {activeTab === 'heatmap' && (
            <HeatmapView
              onNodeSelect={handleNodeSelect}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default App