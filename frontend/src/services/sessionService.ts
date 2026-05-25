import { api } from '../lib/api'

export interface SessionData {
  session: {
    id: string
    status: string
    started_at: string
    editor_url: string
  }
  exercise: {
    id: number
    title: string
    statement: string
    difficulty: string
    language: string
    initial_code: string
  }
  host: {
    id: number
    name: string
    email: string
  }
}

export const sessionService = {
  async start(exerciseId?: number): Promise<SessionData> {
    const { data } = await api.post<SessionData>('/sessions/start', 
      exerciseId ? { exercise_id: exerciseId } : {}
    )
    return data
  }
}