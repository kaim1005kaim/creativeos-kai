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
import FloatingActionButton from './components/FloatingActionButton'
import MobileMenu from './components/MobileMenu'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import { useNodeStore } from './store/nodes'
import { useMockData } from './lib/mockApi'
import { useTheme } from './contexts/ThemeContext'
import { Cluster } from './lib/clustering'
import { Cluster as AdvancedCluster } from './lib/advancedClustering'
import './App.css'
import { hideSplashScreen, handleAppUrl, isNative } from './lib/capacitor'
import { enhanceNetworkConnectivity } from './lib/networkEnhancer'

function App() {
  const { nodes, setFilteredNodes, selectedNodeId, setSelectedNodeId } = useNodeStore()
  const mockNodes = useMockData()
  const { colors } = useTheme()
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'clusters' | 'timeline' | 'links' | 'dashboard' | 'advanced-clusters' | 'timeline-view' | 'heatmap'>('list')
  const [user, setUser] = useState<{ id: string; email: string; name: string; picture: string } | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isCreatingSharedNode, setIsCreatingSharedNode] = useState(false)

  useEffect(() => {
    // Initialize with mock data for demo if not logged in
    if (nodes.length === 0 && !user) {
      useNodeStore.setState({ nodes: mockNodes })
    }
    
    // Check for session info in URL (temporary auth handling)
    const urlParams = new URLSearchParams(window.location.search)
    const sessionParam = urlParams.get('session') // Old format
    const shortSessionParam = urlParams.get('s') // New base64 format
    
    console.log('🔍 Auth Debug:', {
      currentUrl: window.location.href,
      hasSessionParam: !!sessionParam,
      hasShortSessionParam: !!shortSessionParam,
      sessionParamLength: sessionParam?.length || 0,
      shortSessionParamLength: shortSessionParam?.length || 0,
      allParams: Object.fromEntries(urlParams.entries())
    })
    
    // Try new base64 format first
    if (shortSessionParam) {
      try {
        console.log('📝 Base64 session param:', shortSessionParam.substring(0, 50) + '...')
        const decodedSession = atob(shortSessionParam)
        console.log('🔓 Decoded session:', decodedSession.substring(0, 100) + '...')
        const sessionData = JSON.parse(decodedSession)
        console.log('✅ Parsed session data:', sessionData)
        setUser(sessionData)
        // Store in localStorage for persistence
        localStorage.setItem('creativeos_user', JSON.stringify(sessionData))
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname)
        console.log('💾 Session stored and URL cleaned')
      } catch (e) {
        console.error('❌ Failed to parse base64 session data:', e)
        console.error('Raw base64 session param:', shortSessionParam)
      }
    }
    // Fallback to old format
    else if (sessionParam) {
      try {
        console.log('📝 Raw session param:', sessionParam.substring(0, 100) + '...')
        const sessionData = JSON.parse(decodeURIComponent(sessionParam))
        console.log('✅ Parsed session data:', sessionData)
        setUser(sessionData)
        // Store in localStorage for persistence
        localStorage.setItem('creativeos_user', JSON.stringify(sessionData))
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname)
        console.log('💾 Session stored and URL cleaned')
      } catch (e) {
        console.error('❌ Failed to parse session data:', e)
        console.error('Raw session param:', sessionParam)
      }
    } else {
      // Check localStorage for existing session
      const storedUser = localStorage.getItem('creativeos_user')
      console.log('🗄️ Checking localStorage:', !!storedUser)
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          console.log('✅ Restored user from localStorage:', userData)
          setUser(userData)
        } catch (e) {
          console.error('❌ Failed to parse stored user:', e)
        }
      }
    }
    
    // Check if mobile screen
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    // Hide splash screen for native apps
    if (isNative) {
      hideSplashScreen()
    }
    
    // Handle deep links for native apps
    handleAppUrl((data) => {
      if (data.url) {
        // Check if it's a deep link URL
        if (data.url.startsWith('creativeos://')) {
          const deepUrl = new URL(data.url)
          const sharedUrl = deepUrl.searchParams.get('url')
          if (sharedUrl) {
            window.location.search = `?url=${encodeURIComponent(sharedUrl)}`
          }
        } else {
          // Direct URL shared from another app
          window.location.search = `?url=${encodeURIComponent(data.url)}`
        }
      } else if (data.text) {
        // Plain text shared (might contain URL)
        window.location.search = `?text=${encodeURIComponent(data.text)}`
      }
      
      // Add comment if provided
      if (data.comment) {
        const currentSearch = new URLSearchParams(window.location.search)
        currentSearch.set('comment', data.comment)
        window.location.search = currentSearch.toString()
      }
    })
    
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // Handle shared URL creation with mobile optimizations
  useEffect(() => {
    const handleSharedUrl = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const sharedUrl = urlParams.get('url') || urlParams.get('text') || urlParams.get('title')
      
      if (sharedUrl && !isCreatingSharedNode) {
        setIsCreatingSharedNode(true)
        
        try {
          // Enhanced URL cleaning for mobile sharing
          let cleanUrl = sharedUrl.trim()
          
          // Handle different URL formats from mobile apps
          if (!cleanUrl.startsWith('http')) {
            cleanUrl = `https://${cleanUrl}`
          }
          
          // Clean tracking parameters common in mobile sharing
          const url = new URL(cleanUrl)
          const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 't', 'ref_src', 'ref_url']
          trackingParams.forEach(param => url.searchParams.delete(param))
          
          // X/Twitter mobile URL normalization
          if (url.hostname.includes('twitter.com') || url.hostname.includes('x.com')) {
            // Convert mobile.twitter.com to twitter.com
            url.hostname = 'twitter.com'
            // Remove mobile-specific parameters
            url.searchParams.delete('s')
            url.searchParams.delete('t')
          }
          
          const finalUrl = url.toString()
          
          // Auto-detect content type for better processing
          let comment = 'Shared from mobile'
          let useMCP = false
          
          if (finalUrl.includes('twitter.com') || finalUrl.includes('x.com')) {
            comment = 'Shared Twitter/X post'
            useMCP = true // Use MCP for better Twitter content extraction
          } else if (finalUrl.includes('youtube.com') || finalUrl.includes('youtu.be')) {
            comment = 'Shared YouTube video'
          } else if (finalUrl.includes('github.com')) {
            comment = 'Shared GitHub repository'
          }
          
          // Create node with optimized options for mobile
          const addNode = useNodeStore.getState().addNode
          await addNode(finalUrl, comment, { useMCP })
          
          // Clean URL parameters after processing
          window.history.replaceState({}, document.title, window.location.pathname)
          
          // Success feedback with more detail
          console.log('Shared URL processed successfully:', {
            original: sharedUrl,
            cleaned: finalUrl,
            type: comment
          })
          
        } catch (error) {
          console.error('Failed to create node from shared URL:', error)
          // TODO: Add user-visible error notification
        } finally {
          setIsCreatingSharedNode(false)
        }
      }
    }
    
    if (user?.id) {
      handleSharedUrl()
    }
  }, [user?.id, isCreatingSharedNode])

  // Load user nodes when user logs in
  useEffect(() => {
    if (user?.id) {
      useNodeStore.getState().loadUserNodes(user.id)
    } else {
      // Clear user-specific data when logged out
      useNodeStore.getState().setCurrentUserId(null)
      // Load mock data for demo
      if (nodes.length === 0) {
        useNodeStore.setState({ nodes: mockNodes })
      }
    }
  }, [user?.id])

  // Enhance connectivity when nodes change
  useEffect(() => {
    if (nodes.length > 1) {
      const enhanced = enhanceNetworkConnectivity(nodes)
      if (JSON.stringify(enhanced) !== JSON.stringify(nodes)) {
        useNodeStore.setState({ nodes: enhanced })
      }
    }
  }, [nodes.length]) // Only trigger when node count changes

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

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('creativeos_user')
    setIsMobileMenuOpen(false)
    window.location.href = '/'
  }

  return (
    <div className="app" style={{ backgroundColor: colors.background, color: colors.text }}>
      {/* Enhanced Mobile Loading Overlay */}
      {isCreatingSharedNode && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          color: '#fff',
          padding: '20px'
        }}>
          {/* OZ-style loading animation */}
          <div style={{
            position: 'relative',
            marginBottom: '24px'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid #333',
              borderTop: '4px solid #4ecdc4',
              borderRight: '4px solid #ff9f43',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '30px',
              height: '30px',
              border: '2px solid #45b7d1',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 0.5s linear infinite reverse'
            }} />
          </div>
          
          <div style={{ textAlign: 'center', maxWidth: '300px' }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              marginBottom: '8px',
              color: '#4ecdc4'
            }}>
              📱 Processing Shared Content
            </h3>
            <p style={{ 
              fontSize: '14px', 
              opacity: 0.9,
              lineHeight: '1.4',
              marginBottom: '16px'
            }}>
              Analyzing URL, extracting content, and generating AI summary...
            </p>
            
            {/* Mobile-friendly progress steps */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px',
              opacity: 0.7
            }}>
              <span>🔍 Extracting</span>
              <span>🤖 AI Analysis</span>
              <span>💾 Saving</span>
            </div>
          </div>
        </div>
      )}
      
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
                  onClick={handleLogout}
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
        
        {/* Mobile FAB and Menu */}
        {isMobile && (
          <>
            <FloatingActionButton onMenuToggle={() => setIsMobileMenuOpen(true)} />
            <MobileMenu 
              isOpen={isMobileMenuOpen}
              onClose={() => setIsMobileMenuOpen(false)}
              user={user}
              onLogout={handleLogout}
            />
            <PWAInstallPrompt />
          </>
        )}
      </main>
    </div>
  )
}

export default App