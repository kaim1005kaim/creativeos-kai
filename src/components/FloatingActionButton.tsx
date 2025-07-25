import React, { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import QuickAddModal from './QuickAddModal'

interface FloatingActionButtonProps {
  onMenuToggle: () => void
}

export default function FloatingActionButton({ onMenuToggle }: FloatingActionButtonProps) {
  const { colors } = useTheme()
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  
  const handleMainFabClick = () => {
    setIsExpanded(!isExpanded)
  }

  const handleQuickAddClick = () => {
    setShowQuickAdd(true)
    setIsExpanded(false)
  }

  const handleMenuClick = () => {
    onMenuToggle()
    setIsExpanded(false)
  }
  
  return (
    <>
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 998,
          }}
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Quick Add FAB */}
      {isExpanded && (
        <button
          onClick={handleQuickAddClick}
          style={{
            position: 'fixed',
            bottom: '90px',
            left: '20px',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#4ecdc4',
            color: '#000',
            border: 'none',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            zIndex: 999,
            transition: 'all 0.3s ease',
            transform: isExpanded ? 'scale(1)' : 'scale(0)',
          }}
        >
          🚀
        </button>
      )}

      {/* Menu FAB */}
      {isExpanded && (
        <button
          onClick={handleMenuClick}
          style={{
            position: 'fixed',
            bottom: '148px',
            left: '20px',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#ff9f43',
            color: '#000',
            border: 'none',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            zIndex: 999,
            transition: 'all 0.3s ease',
            transform: isExpanded ? 'scale(1)' : 'scale(0)',
          }}
        >
          ⚙️
        </button>
      )}

      {/* Labels */}
      {isExpanded && (
        <>
          <div
            style={{
              position: 'fixed',
              bottom: '100px',
              left: '76px',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: 'bold',
              zIndex: 999,
              pointerEvents: 'none',
            }}
          >
            Quick Add
          </div>
          <div
            style={{
              position: 'fixed',
              bottom: '158px',
              left: '76px',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: 'bold',
              zIndex: 999,
              pointerEvents: 'none',
            }}
          >
            Menu
          </div>
        </>
      )}
      
      {/* Main FAB */}
      <button
        onClick={handleMainFabClick}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: colors.primary,
          color: colors.background,
          border: 'none',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: 'bold',
          zIndex: 1000,
          transition: 'transform 0.3s ease',
          transform: isExpanded ? 'rotate(45deg)' : 'rotate(0deg)',
        }}
      >
        +
      </button>

      {/* Quick Add Modal */}
      <QuickAddModal 
        isOpen={showQuickAdd} 
        onClose={() => setShowQuickAdd(false)} 
      />
    </>
  )
}