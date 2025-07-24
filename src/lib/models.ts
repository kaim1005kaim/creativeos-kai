export type LLMModel = {
  id: string
  name: string
  apiUrl: string
  type: 'deepseek' | 'hunyuan' | 'custom'
}

export const AVAILABLE_MODELS: LLMModel[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek Chat (API)',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    type: 'deepseek',
  },
  {
    id: 'hunyuan',
    name: 'Hunyuan-A13B',
    apiUrl: 'http://localhost:1234/v1/chat/completions',
    type: 'hunyuan',
  }
]

export const DEFAULT_MODEL_ID = 'deepseek'