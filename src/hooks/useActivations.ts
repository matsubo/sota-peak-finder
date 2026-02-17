import { useState, useEffect } from 'react'
import { fetchSummitActivations, type SummitActivation } from '../utils/api'

interface UseActivationsResult {
  activations: SummitActivation[]
  loading: boolean
  error: string | null
  fetchedAt: Date | null
}

export function useActivations(summitRef: string | undefined): UseActivationsResult {
  const [activations, setActivations] = useState<SummitActivation[]>([])
  const [loading, setLoading] = useState(!!summitRef)
  const [error, setError] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null)

  useEffect(() => {
    if (!summitRef) return

    let cancelled = false

    fetchSummitActivations(summitRef, 10)
      .then((data) => {
        if (!cancelled) {
          setActivations(data)
          setError(null)
          setFetchedAt(new Date())
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Activations fetch failed:', err)
          setError(err instanceof Error ? err.message : 'Failed to load activations')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [summitRef])

  return { activations, loading, error, fetchedAt }
}
