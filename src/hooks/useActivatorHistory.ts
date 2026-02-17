import { useState, useEffect } from 'react'
import { fetchActivatorHistory, type ActivatorLogEntry } from '../utils/api'

interface UseActivatorHistoryResult {
  activations: ActivatorLogEntry[]
  callsign: string | null
  loading: boolean
  error: string | null
}

export function useActivatorHistory(userId: string | undefined): UseActivatorHistoryResult {
  const numericId = userId !== undefined ? parseInt(userId, 10) : undefined
  const isValid = numericId !== undefined && !isNaN(numericId)

  const [activations, setActivations] = useState<ActivatorLogEntry[]>([])
  const [callsign, setCallsign] = useState<string | null>(null)
  const [loading, setLoading] = useState(isValid)
  const [error, setError] = useState<string | null>(
    userId !== undefined && !isValid ? 'Invalid user ID' : null
  )

  useEffect(() => {
    if (!isValid || numericId === undefined) return

    let cancelled = false

    fetchActivatorHistory(numericId)
      .then((data) => {
        if (!cancelled) {
          setActivations(data)
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

  return { activations, callsign, loading, error }
}
