const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1').replace(/\/$/, '')

export interface HealthResponse {
  status: string
  service: string
}

export async function getHealth(): Promise<HealthResponse> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3500)
  try {
    const response = await fetch(`${baseUrl}/health`, { signal: controller.signal })
    if (!response.ok) throw new Error('Backend health endpoint unavailable')
    return (await response.json()) as HealthResponse
  } finally {
    clearTimeout(timeout)
  }
}

export const apiBaseUrl = baseUrl

