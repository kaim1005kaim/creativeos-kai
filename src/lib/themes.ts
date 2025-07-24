// テーマとカスタマイズ機能

export interface Theme {
  id: string
  name: string
  displayName: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: string
    textSecondary: string
    border: string
    success: string
    warning: string
    error: string
    info: string
  }
  canvas: {
    background: string
    nodeDefault: string
    nodeXPost: string
    nodeHighlight: string
    connection: string
    fog: string
  }
  shadows: {
    small: string
    medium: string
    large: string
  }
  isDark: boolean
}

export const themes: Record<string, Theme> = {
  light: {
    id: 'light',
    name: 'light',
    displayName: 'ライト',
    colors: {
      primary: '#3b82f6',
      secondary: '#6b7280',
      accent: '#10b981',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1f2937',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    },
    canvas: {
      background: '#ffffff',
      nodeDefault: '#71717a',
      nodeXPost: '#1DA1F2',
      nodeHighlight: '#3b82f6',
      connection: '#000000',
      fog: '#ffffff'
    },
    shadows: {
      small: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      large: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
    },
    isDark: false
  },
  
  dark: {
    id: 'dark',
    name: 'dark',
    displayName: 'ダーク',
    colors: {
      primary: '#60a5fa',
      secondary: '#9ca3af',
      accent: '#34d399',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#334155',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#60a5fa'
    },
    canvas: {
      background: '#0f172a',
      nodeDefault: '#94a3b8',
      nodeXPost: '#1DA1F2',
      nodeHighlight: '#60a5fa',
      connection: '#e2e8f0',
      fog: '#0f172a'
    },
    shadows: {
      small: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      medium: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
      large: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
    },
    isDark: true
  },
  
  ocean: {
    id: 'ocean',
    name: 'ocean',
    displayName: 'オーシャン',
    colors: {
      primary: '#0ea5e9',
      secondary: '#64748b',
      accent: '#06b6d4',
      background: '#f0f9ff',
      surface: '#e0f2fe',
      text: '#0c4a6e',
      textSecondary: '#475569',
      border: '#bae6fd',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0ea5e9'
    },
    canvas: {
      background: '#f0f9ff',
      nodeDefault: '#475569',
      nodeXPost: '#0ea5e9',
      nodeHighlight: '#0284c7',
      connection: '#0c4a6e',
      fog: '#f0f9ff'
    },
    shadows: {
      small: '0 1px 2px 0 rgba(14, 165, 233, 0.1)',
      medium: '0 4px 6px -1px rgba(14, 165, 233, 0.2)',
      large: '0 20px 25px -5px rgba(14, 165, 233, 0.3)'
    },
    isDark: false
  },
  
  forest: {
    id: 'forest',
    name: 'forest',
    displayName: 'フォレスト',
    colors: {
      primary: '#059669',
      secondary: '#6b7280',
      accent: '#0d9488',
      background: '#f0fdf4',
      surface: '#dcfce7',
      text: '#14532d',
      textSecondary: '#4b5563',
      border: '#bbf7d0',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0d9488'
    },
    canvas: {
      background: '#f0fdf4',
      nodeDefault: '#4b5563',
      nodeXPost: '#1DA1F2',
      nodeHighlight: '#059669',
      connection: '#14532d',
      fog: '#f0fdf4'
    },
    shadows: {
      small: '0 1px 2px 0 rgba(5, 150, 105, 0.1)',
      medium: '0 4px 6px -1px rgba(5, 150, 105, 0.2)',
      large: '0 20px 25px -5px rgba(5, 150, 105, 0.3)'
    },
    isDark: false
  },
  
  sunset: {
    id: 'sunset',
    name: 'sunset',
    displayName: 'サンセット',
    colors: {
      primary: '#f97316',
      secondary: '#78716c',
      accent: '#eab308',
      background: '#fffbeb',
      surface: '#fef3c7',
      text: '#92400e',
      textSecondary: '#57534e',
      border: '#fed7aa',
      success: '#65a30d',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0ea5e9'
    },
    canvas: {
      background: '#fffbeb',
      nodeDefault: '#57534e',
      nodeXPost: '#1DA1F2',
      nodeHighlight: '#f97316',
      connection: '#92400e',
      fog: '#fffbeb'
    },
    shadows: {
      small: '0 1px 2px 0 rgba(249, 115, 22, 0.1)',
      medium: '0 4px 6px -1px rgba(249, 115, 22, 0.2)',
      large: '0 20px 25px -5px rgba(249, 115, 22, 0.3)'
    },
    isDark: false
  }
}

// テーマの適用
export function applyTheme(theme: Theme) {
  const root = document.documentElement
  
  // CSS変数の設定
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value)
  })
  
  Object.entries(theme.canvas).forEach(([key, value]) => {
    root.style.setProperty(`--canvas-${key}`, value)
  })
  
  Object.entries(theme.shadows).forEach(([key, value]) => {
    root.style.setProperty(`--shadow-${key}`, value)
  })
  
  // ダークモードクラスの切り替え
  if (theme.isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  
  // テーマIDをdata属性に設定
  root.setAttribute('data-theme', theme.id)
}

// システムテーマの検出
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

// テーマ設定の保存・読み込み
export function saveThemePreference(themeId: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('creativeos-theme', themeId)
  }
}

export function loadThemePreference(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('creativeos-theme')
    if (saved && themes[saved]) {
      return saved
    }
  }
  return getSystemTheme()
}

// カスタムテーマの作成
export function createCustomTheme(
  baseTheme: Theme, 
  overrides: Partial<Theme>
): Theme {
  return {
    ...baseTheme,
    ...overrides,
    colors: {
      ...baseTheme.colors,
      ...overrides.colors
    },
    canvas: {
      ...baseTheme.canvas,
      ...overrides.canvas
    },
    shadows: {
      ...baseTheme.shadows,
      ...overrides.shadows
    }
  }
}

// テーマのバリデーション
export function validateTheme(theme: Partial<Theme>): boolean {
  const requiredColors = [
    'primary', 'secondary', 'accent', 'background', 'surface',
    'text', 'textSecondary', 'border', 'success', 'warning', 'error', 'info'
  ]
  
  const requiredCanvas = [
    'background', 'nodeDefault', 'nodeXPost', 'nodeHighlight', 'connection', 'fog'
  ]
  
  if (!theme.colors || !theme.canvas) return false
  
  for (const color of requiredColors) {
    if (!theme.colors[color as keyof typeof theme.colors]) return false
  }
  
  for (const canvas of requiredCanvas) {
    if (!theme.canvas[canvas as keyof typeof theme.canvas]) return false
  }
  
  return true
}

// カラーピッカー用のプリセット
export const colorPresets = {
  blues: ['#1e3a8a', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'],
  greens: ['#14532d', '#166534', '#15803d', '#16a34a', '#22c55e', '#4ade80'],
  reds: ['#7f1d1d', '#991b1b', '#dc2626', '#ef4444', '#f87171', '#fca5a5'],
  oranges: ['#9a3412', '#c2410c', '#ea580c', '#f97316', '#fb923c', '#fdba74'],
  purples: ['#581c87', '#7c2d12', '#a21caf', '#c026d3', '#d946ef', '#e879f9'],
  grays: ['#111827', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db']
}

// アクセシビリティ対応
export function checkColorContrast(
  foreground: string, 
  background: string
): { ratio: number; isAccessible: boolean } {
  // シンプルなコントラスト比計算
  const getLuminance = (color: string) => {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16) / 255
    const g = parseInt(hex.substr(2, 2), 16) / 255
    const b = parseInt(hex.substr(4, 2), 16) / 255
    
    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2]
  }
  
  const l1 = getLuminance(foreground)
  const l2 = getLuminance(background)
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
  
  return {
    ratio,
    isAccessible: ratio >= 4.5 // WCAG AA標準
  }
}