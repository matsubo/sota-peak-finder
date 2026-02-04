import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

export function Help() {
  const { t } = useTranslation()
  const [sotaCount, setSotaCount] = useState<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sotaResponse = await fetch('/offline-qth/data/sota-data.json')
        const sotaJson = await sotaResponse.json()
        setSotaCount(sotaJson.summits.length)
      } catch (error) {
        console.error("Failed to fetch SOTA data:", error)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-white hover:text-orange-300 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            {t('help.backToHome')}
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-white mt-4">{t('help.title')}</h1>
        </header>

        <main className="space-y-6">
          {/* Section 1: オフラインの仕組み */}
          <section className="bg-white/95 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📱</span>
              {t('help.offline.title')}
            </h2>
            <div className="prose max-w-none text-gray-700 space-y-4">
              <p>{t('help.offline.pwa')}</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>{t('help.offline.cache')}</li>
                <li>{t('help.offline.data')}</li>
                <li>{t('help.offline.gps')}</li>
              </ul>
            </div>
          </section>

          {/* Section 2: 位置情報の精度 */}
          <section className="bg-white/95 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📍</span>
              {t('help.accuracy.title')}
            </h2>
            <div className="prose max-w-none text-gray-700 space-y-4">
              <p>{t('help.accuracy.gpsLimits')}</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>{t('help.accuracy.obstacles')}</li>
                <li>{t('help.accuracy.agps')}</li>
                <li>{t('help.accuracy.estimation')}</li>
              </ul>
            </div>
          </section>

          {/* Section 3: データの精度 */}
          <section className="bg-white/95 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📊</span>
              {t('help.data.title')}
            </h2>
            <div className="prose max-w-none text-gray-700 space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <p className="font-bold text-blue-900">🗾 {t('help.data.region')}</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">JCC/JCG</h3>
                <p>{t('help.data.jccJcg')}</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">SOTA</h3>
                <p>{sotaCount ? t('help.data.sota', { count: sotaCount }) : '...'}</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">{t('label.elevation')}</h3>
                <p>{t('help.data.elevation')}</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">{t('help.data.addressTitle')}</h3>
                <p>{t('help.data.address')}</p>
              </div>
            </div>
          </section>

          {/* Section 4: トラブルシューティング */}
          <section className="bg-white/95 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🔧</span>
              {t('help.troubleshooting.title')}
            </h2>
            <div className="prose max-w-none text-gray-700 space-y-4">
              <div>
                <h3 className="font-bold text-lg mb-2">❌ {t('help.troubleshooting.noLocationTitle')}</h3>
                <p>{t('help.troubleshooting.noLocation')}</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">⏱️ {t('help.troubleshooting.slowTitle')}</h3>
                <p>{t('help.troubleshooting.slow')}</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">⚠️ {t('help.troubleshooting.wrongDataTitle')}</h3>
                <p>{t('help.troubleshooting.wrongData')}</p>
              </div>
            </div>
          </section>
        </main>

        <footer className="mt-10 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-xl text-white transition-all duration-300 border border-white/20 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('help.backToHome')}
          </Link>
        </footer>
      </div>
    </div>
  )
}
