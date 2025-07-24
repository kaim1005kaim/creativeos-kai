import React from 'react'
import { useTheme } from '../contexts/ThemeContext'

interface FloatingActionButtonProps {
  onClick: () => void
}

export default function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  const { colors } = useTheme()
  
  return (
    <button
      onClick={onClick}
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
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)'
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)'
      }}
    >
      +
    </button>
  )
}