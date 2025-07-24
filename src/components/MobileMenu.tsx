import React, { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import SearchBar from './SearchBar'
import AddNodeButton from './AddNodeButton'
import ModelSelector from './ModelSelector'
import ThemeToggle from './ThemeToggle'
import GoogleLoginButton from './GoogleLoginButton'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  user: { id: string; email: string; name: string; picture: string } | null
  onLogout: () => void
}

export default function MobileMenu({ isOpen, onClose, user, onLogout }: MobileMenuProps) {
  const { colors } = useTheme()
  
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
        }}
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.surface,
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          padding: '20px',
          zIndex: 9999,
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Handle bar */}
        <div
          style={{
            width: '40px',
            height: '4px',
            backgroundColor: colors.text + '40',
            borderRadius: '2px',
            margin: '0 auto 20px',
          }}
        />

        {/* User section */}
        {user ? (
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <img 
              src={user.picture} 
              alt={user.name}
              style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%',
                border: '3px solid ' + colors.primary,
                marginBottom: '10px'
              }}
            />
            <h3 style={{ margin: '0 0 5px', fontSize: '18px' }}>{user.name}</h3>
            <p style={{ margin: '0 0 10px', fontSize: '14px', opacity: 0.7 }}>{user.email}</p>
            <button
              onClick={onLogout}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: colors.text,
                border: '1px solid ' + colors.text,
                borderRadius: '20px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              ログアウト
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            <GoogleLoginButton />
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <h4 style={{ margin: '0 0 10px', fontSize: '14px', opacity: 0.7 }}>ノード追加</h4>
            <AddNodeButton />
          </div>
          
          <div>
            <h4 style={{ margin: '0 0 10px', fontSize: '14px', opacity: 0.7 }}>検索</h4>
            <SearchBar />
          </div>
          
          <div>
            <h4 style={{ margin: '0 0 10px', fontSize: '14px', opacity: 0.7 }}>モデル選択</h4>
            <ModelSelector />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ margin: 0, fontSize: '14px', opacity: 0.7 }}>テーマ</h4>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </>
  )
}