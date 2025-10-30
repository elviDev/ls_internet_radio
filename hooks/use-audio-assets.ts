"use client"

import { useState, useCallback } from 'react'

interface AudioAsset {
  id: string
  filename: string
  originalName: string
  url: string
  size: number
  mimeType: string
  description?: string
  tags?: string
  createdAt: string
}

interface AudioAssetsResponse {
  assets: AudioAsset[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export function useAudioAssets() {
  const [assets, setAssets] = useState<AudioAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  const fetchAssets = useCallback(async (params: {
    search?: string
    type?: string
    genre?: string
    page?: number
    limit?: number
  } = {}) => {
    setLoading(true)
    try {
      const searchParams = new URLSearchParams()
      if (params.search) searchParams.set('search', params.search)
      if (params.type) searchParams.set('type', params.type)
      if (params.genre) searchParams.set('genre', params.genre)
      if (params.page) searchParams.set('page', params.page.toString())
      if (params.limit) searchParams.set('limit', params.limit.toString())

      const response = await fetch(`/api/assets/audio?${searchParams}`)
      if (!response.ok) throw new Error('Failed to fetch assets')

      const data: AudioAssetsResponse = await response.json()
      setAssets(data.assets)
      setPagination(data.pagination)
      return data
    } catch (error) {
      console.error('Error fetching audio assets:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const uploadAsset = useCallback(async (file: File, metadata: {
    title?: string
    artist?: string
    genre?: string
    audioType?: 'music' | 'jingle' | 'effect' | 'voice'
  }) => {
    const formData = new FormData()
    formData.append('file', file)
    if (metadata.title) formData.append('title', metadata.title)
    if (metadata.artist) formData.append('artist', metadata.artist)
    if (metadata.genre) formData.append('genre', metadata.genre)
    if (metadata.audioType) formData.append('audioType', metadata.audioType)

    const response = await fetch('/api/assets/audio', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to upload asset')
    }

    const data = await response.json()
    return data.asset as AudioAsset
  }, [])

  return {
    assets,
    loading,
    pagination,
    fetchAssets,
    uploadAsset
  }
}