import { useState, useEffect, useMemo } from 'react'
import { fetchActivatorHistory, type ActivatorLogEntry } from '../utils/api'

const PAGE_SIZE = 50

interface UseActivatorHistoryResult {
  activations: ActivatorLogEntry[]
  allActivations: ActivatorLogEntry[]
  callsign: string | null
  loading: boolean
  error: string | null
  currentPage: number
  totalPages: number
  setPage: (page: number) => void
}

export function useActivatorHistory(userId: string | undefined): UseActivatorHistoryResult {
  const numericId = userId !== undefined ? parseInt(userId, 10) : undefined
  const isValid = numericId !== undefined && !isNaN(numericId)

  const [allActivations, setAllActivations] = useState<ActivatorLogEntry[]>([])
  const [callsign, setCallsign] = useState<string | null>(null)
  const [loading, setLoading] = useState(isValid)
  const [error, setError] = useState<string | null>(
    userId !== undefined && !isValid ? 'Invalid user ID' : null
  )
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (!isValid || numericId === undefined) return

    let cancelled = false

    fetchActivatorHistory(numericId)
      .then((data) => {
        if (!cancelled) {
          setAllActivations(data)
          if (data.length > 0) {
            setCallsign(data[0].OwnCallsign)
          }
          setError(null)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Activator history fetch failed:', err)
          setError(err instanceof Error ? err.message : 'Failed to load activator history')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [isValid, numericId])

  const totalPages = Math.max(1, Math.ceil(allActivations.length / PAGE_SIZE))

  const activations = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return allActivations.slice(start, start + PAGE_SIZE)
  }, [allActivations, currentPage])

  const setPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return { activations, allActivations, callsign, loading, error, currentPage, totalPages, setPage }
}
