import React from 'react'
import { useTheme } from '../contexts/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme, colors } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '8px 12px',
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '6px',
        color: colors.text,
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 'bold',
        transition: 'all 0.2s ease',
        marginBottom: '10px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = theme === 'dark' ? '#2a2a2a' : '#e8e8e8'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = colors.surface
      }}
    >
      <span style={{ fontSize: '14px' }}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </span>
      {theme === 'dark' ? 'ライト' : 'ダーク'}モード
    </button>
  )
}