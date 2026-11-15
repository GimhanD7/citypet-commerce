import { API_BASE_URL } from './api'

export function mediaUrl(value) {
  if (typeof value !== 'string') return ''
  const url = value.trim()
  if (/^\/(?!\/)/.test(url)) {
    const match = url.match(/(?:^|\/api)\/uploads\/((?:products|profile|slips)\/[a-z0-9_.-]+\.(?:jpg|jpeg|png|webp|mp4|webm|pdf))$/i)
    return match ? API_BASE_URL.replace(/\/$/, '') + '/uploads/' + match[1] : url
  }
  return /^(https?:\/\/|data:image\/)/i.test(url) ? url : ''
}
