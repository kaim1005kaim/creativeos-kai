import React, { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export default function PWAInstallPrompt() {
  const { colors } = useTheme()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInWebAppiOS = (window.navigator as any).standalone === true
    const isInWebAppChrome = window.matchMedia('(display-mode: standalone)').matches
    
    if (isStandalone || isInWebAppiOS || isInWebAppChrome) {
      setIsInstalled(true)
      return
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show prompt after a delay (better UX)
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('PWA installation accepted')
      } else {
        console.log('PWA installation dismissed')
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error('Error during PWA installation:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Don't show again for this session
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
  }

  // Don't show if already installed or dismissed recently
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null
  }

  // Check if dismissed recently (within 24 hours)
  const dismissedTime = localStorage.getItem('pwa-prompt-dismissed')
  if (dismissedTime && Date.now() - parseInt(dismissedTime) < 24 * 60 * 60 * 1000) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '100px',
        left: '20px',
        right: '20px',
        backgroundColor: colors.surface,
        border: `2px solid ${colors.primary}`,
        borderRadius: '16px',
        padding: '16px',
        zIndex: 9000,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        animation: 'slideUp 0.3s ease-out'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          backgroundColor: colors.primary,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '12px',
          fontSize: '16px'
        }}>
          📱
        </div>
        <div>
          <h4 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 'bold',
            color: colors.primary
          }}>
            アプリをインストール
          </h4>
          <p style={{
            margin: 0,
            fontSize: '12px',
            opacity: 0.8
          }}>
            ホーム画面に追加して素早くアクセス
          </p>
        </div>
        <button
          onClick={handleDismiss}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: colors.text,
            padding: '4px'
          }}
        >
          ×
        </button>
      </div>

      {/* Features */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '16px',
        fontSize: '12px',
        opacity: 0.9
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>🚀</span>
          <span>高速起動</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>📱</span>
          <span>オフライン対応</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>🔗</span>
          <span>共有機能</span>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{
        display: 'flex',
        gap: '8px'
      }}>
        <button
          onClick={handleInstallClick}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: colors.primary,
            color: colors.background,
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          📥 インストール
        </button>
        <button
          onClick={handleDismiss}
          style={{
            padding: '12px 16px',
            backgroundColor: 'transparent',
            color: colors.text,
            border: `1px solid ${colors.text}40`,
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          後で
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}