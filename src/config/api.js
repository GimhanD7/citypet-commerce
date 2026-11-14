/**
 * City Pet Animal Hospital - Centralized API Configuration & Client
 *
 * In development (Vite :5173): requests to /citypet/api are proxied by
 * vite.config.js to http://127.0.0.1:80 — no ERR_CONNECTION_REFUSED.
 * In production (Apache serves the built files): /citypet/api is same-origin.
 */

// Always relative — Vite proxy handles the :5173 → :80 rewrite in dev
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`
    : '/citypet/api')


/**
 * Standard Fetch Wrapper with Timeout, JSON Parsing, and Error Handling
 */
export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}/${endpoint.replace(/^\//, '')}`

  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  const config = {
    credentials: 'include',
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  }

  if (config.body instanceof FormData) delete config.headers['Content-Type']

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 8000)
  config.signal = controller.signal

  try {
    const response = await fetch(url, config)
    clearTimeout(timeoutId)

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      const errorMsg = data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`
      const error = new Error(errorMsg)
      error.status = response.status
      error.data = data
      throw error
    }

    return data?.data !== undefined ? data.data : data
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new Error(`API Request to ${endpoint} timed out after 8s`)
    }
    throw err
  }
}
