import { useState, useEffect } from 'react'
import type { SotaData } from '../types/location'
import { initSotaDatabase } from '../utils/api'

/**
 * SOTA データベースの初期化フック
 *
 * SQLite WASM を使用して世界中の SOTA データにアクセスします
 *
 * @returns isReady: データベースが初期化済みか, error: 初期化エラー
 */
export function useSotaData() {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    initSotaDatabase()
      .then((success) => {
        if (mounted) {
          setIsReady(success)
          if (!success) {
            setError(new Error('Failed to initialize SOTA database'))
          }
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err)
          setIsReady(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  // 後方互換性のため、旧形式のオブジェクトも返す
  return {
    isReady,
    error,
    // レガシー形式（既存コードとの互換性のため）
    summits: [],
    version: '2.0.0',
    lastUpdate: new Date().toISOString().split('T')[0],
    region: 'Worldwide'
  } as SotaData & { isReady: boolean; error: Error | null }
}
