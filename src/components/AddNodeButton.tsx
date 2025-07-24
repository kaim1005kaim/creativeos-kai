import React, { useState } from 'react'
import NodeInput from './NodeInput'

const AddNodeButton: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div style={{
      marginBottom: '10px'
    }}>
      {/* フローティング追加ボタン */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#4ecdc4',
            color: '#000',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#45b7d1'
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(78, 205, 196, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4ecdc4'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <span style={{ fontSize: '16px' }}>+</span>
          新しいノードを追加
        </button>
      ) : (
        <div style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '6px',
          border: '2px solid #4ecdc4'
        }}>
          {/* ヘッダー */}
          <div style={{
            padding: '12px',
            backgroundColor: '#4ecdc4',
            color: '#000',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
              新しいノードを追加
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#000',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '0',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              ×
            </button>
          </div>
          
          {/* ノード入力フォーム */}
          <div style={{ 
            padding: '0',
            backgroundColor: '#1a1a1a'
          }}>
            <NodeInput />
          </div>
        </div>
      )}
    </div>
  )
}

export default AddNodeButton