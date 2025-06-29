import React, { useState } from 'react'
import { create } from 'zustand'
import { ColorScheme, COLOR_SCHEME_LABELS, COLOR_LEGENDS } from '../lib/nodeColors'

interface ColorSchemeStore {
  selectedScheme: ColorScheme
  setSelectedScheme: (scheme: ColorScheme) => void
}

export const useColorSchemeStore = create<ColorSchemeStore>((set) => ({
  selectedScheme: 'default',
  setSelectedScheme: (scheme) => set({ selectedScheme: scheme }),
}))

export default function ColorSchemeSelector() {
  const [showLegend, setShowLegend] = useState(false)
  const { selectedScheme, setSelectedScheme } = useColorSchemeStore()

  const handleSchemeChange = (scheme: ColorScheme) => {
    setSelectedScheme(scheme)
    setShowLegend(scheme !== 'default')
  }

  const legends = COLOR_LEGENDS[selectedScheme as keyof typeof COLOR_LEGENDS]

  return (
    <div style={{ padding: '1rem', borderBottom: '1px solid #333' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#999' }}>ノードの色分け</h4>
        <button
          onClick={() => setShowLegend(!showLegend)}
          disabled={selectedScheme === 'default'}
          style={{
            background: '#333',
            color: '#ccc',
            border: 'none',
            borderRadius: '3px',
            padding: '0.25rem 0.5rem',
            fontSize: '0.7rem',
            cursor: 'pointer'
          }}
        >
          凡例
        </button>
      </div>
      
      <select
        value={selectedScheme}
        onChange={(e) => handleSchemeChange(e.target.value as ColorScheme)}
        style={{
          width: '100%',
          padding: '0.5rem',
          border: '1px solid #555',
          borderRadius: '4px',
          background: '#222',
          color: '#fff',
          fontSize: '0.9rem',
          cursor: 'pointer'
        }}
      >
        {Object.entries(COLOR_SCHEME_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      
      {showLegend && legends && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: '#111',
          borderRadius: '4px',
          border: '1px solid #333'
        }}>
          <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#ccc' }}>凡例</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {legends.map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '2px',
                  border: '1px solid #555',
                  backgroundColor: item.color,
                  flexShrink: 0
                }} />
                <span style={{ fontSize: '0.7rem', color: '#888' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}