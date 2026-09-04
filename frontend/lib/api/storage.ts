import { getAccessToken } from './client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

async function uploadFile(endpoint: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const token = getAccessToken() ?? (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null)
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Upload failed')
  }

  const data = await response.json()
  return { data: data.data ?? data }
}

export const storageApi = {
  uploadEventImage: async (file: File) => {
    return uploadFile('/storage/upload/event-image', file)
  },

  uploadAvatar: async (file: File) => {
    return uploadFile('/storage/upload/avatar', file)
  },
}
