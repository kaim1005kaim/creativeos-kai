import React from 'react'
import { useModelStore } from '../store/model'
import { AVAILABLE_MODELS } from '../lib/models'

export default function ModelSelector() {
  const { selectedModelId, setSelectedModelId } = useModelStore()

  return (
    <div style={{
      padding: '1rem 0',
      borderBottom: '1px solid #333'
    }}>
      <h4 style={{
        margin: '0 0 0.5rem 0',
        fontSize: '0.9rem',
        color: '#999'
      }}>LLMモデル選択</h4>
      <select 
        value={selectedModelId}
        onChange={(e) => setSelectedModelId(e.target.value)}
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
        {AVAILABLE_MODELS.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
    </div>
  )
}