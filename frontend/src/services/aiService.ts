import axios from 'axios'
import { STORAGE_KEYS } from '../types/auth'

// Cliente dedicado para el AI Engine con timeout extendido (Claude puede tardar ~10s)
const aiApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost',
  timeout: 40_000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

aiApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`
  return config
})

export interface SuggestResponse {
  suggestion: string
  source: 'ai' | 'fallback'
  sessionId: string
}

export interface ReviewComment {
  line: number
  comment: string
}

export interface ReviewResponse {
  comments: ReviewComment[]
  source: 'ai' | 'fallback' | 'error'
  sessionId: string
  message?: string
}

export const aiService = {
  async suggest(sessionId: string, code: string, question: string): Promise<SuggestResponse> {
    const { data } = await aiApi.post<SuggestResponse>('/ai/suggest', {
      sessionId,
      code,
      question,
    })
    return data
  },

  async review(sessionId: string, code: string): Promise<ReviewResponse> {
    const { data } = await aiApi.post<ReviewResponse>('/ai/review', { sessionId, code })
    return data
  },

  async explain(sessionId: string, code: string): Promise<SuggestResponse> {
    const { data } = await aiApi.post<SuggestResponse>('/ai/explain', { sessionId, code })
    return data
  },
}
