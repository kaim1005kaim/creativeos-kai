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
    <div className="color-scheme-selector">
      <div className="selector-header">
        <h4>ノードの色分け</h4>
        <button
          className="legend-toggle"
          onClick={() => setShowLegend(!showLegend)}
          disabled={selectedScheme === 'default'}
        >
          凡例
        </button>
      </div>
      
      <select
        value={selectedScheme}
        onChange={(e) => handleSchemeChange(e.target.value as ColorScheme)}
        className="scheme-select"
      >
        {Object.entries(COLOR_SCHEME_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      
      {showLegend && legends && (
        <div className="color-legend">
          <h5>凡例</h5>
          <div className="legend-items">
            {legends.map((item, index) => (
              <div key={index} className="legend-item">
                <div 
                  className="color-swatch"
                  style={{ backgroundColor: item.color }}
                />
                <span className="legend-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .color-scheme-selector {
          padding: 1rem;
          border-bottom: 1px solid #333;
        }
        
        .selector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .selector-header h4 {
          margin: 0;
          font-size: 0.9rem;
          color: #999;
        }
        
        .legend-toggle {
          background: #333;
          color: #ccc;
          border: none;
          border-radius: 3px;
          padding: 0.25rem 0.5rem;
          font-size: 0.7rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .legend-toggle:hover:not(:disabled) {
          background: #444;
        }
        
        .legend-toggle:disabled {
          background: #222;
          color: #555;
          cursor: not-allowed;
        }
        
        .scheme-select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #555;
          border-radius: 4px;
          background: #222;
          color: #fff;
          font-size: 0.9rem;
          cursor: pointer;
        }
        
        .scheme-select:focus {
          outline: none;
          border-color: #4f46e5;
        }
        
        .color-legend {
          margin-top: 1rem;
          padding: 0.75rem;
          background: #111;
          border-radius: 4px;
          border: 1px solid #333;
        }
        
        .color-legend h5 {
          margin: 0 0 0.5rem 0;
          font-size: 0.8rem;
          color: #ccc;
        }
        
        .legend-items {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .color-swatch {
          width: 12px;
          height: 12px;
          border-radius: 2px;
          border: 1px solid #555;
          flex-shrink: 0;
        }
        
        .legend-label {
          font-size: 0.7rem;
          color: #888;
        }
      `}</style>
    </div>
  )
}