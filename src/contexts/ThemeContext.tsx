import React, { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  colors: {
    background: string
    surface: string
    border: string
    text: string
    textSecondary: string
    primary: string
    secondary: string
    accent: string
  }
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const themes = {
  dark: {
    background: '#121212',
    surface: '#1a1a1a',
    border: '#333',
    text: '#ffffff',
    textSecondary: '#cccccc',
    primary: '#4ecdc4',
    secondary: '#ff6b6b',
    accent: '#96ceb4'
  },
  light: {
    background: '#ffffff',
    surface: '#f5f5f5',
    border: '#e0e0e0',
    text: '#000000',
    textSecondary: '#666666',
    primary: '#2196f3',
    secondary: '#f44336',
    accent: '#4caf50'
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('creativeOS-theme')
    return (saved as Theme) || 'dark'
  })

  useEffect(() => {
    localStorage.setItem('creativeOS-theme', theme)
    // Update CSS custom properties for global styling
    const root = document.documentElement
    const colors = themes[theme]
    
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    colors: themes[theme]
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}