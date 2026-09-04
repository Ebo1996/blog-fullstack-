import apiClient from './client'

export const storageApi = {
  uploadEventImage: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post<{ url: string; publicId: string }>('/storage/upload/event-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post<{ url: string; publicId: string }>('/storage/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
