import { useEffect, useState } from 'react'
import { Share2, Square, Volume2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { translate } from '../../i18n/translations'
import type { Language, MarketPrice } from '../../types/mandi'
import { formatCurrency, formatReportedDate } from '../../utils/format'

interface PriceActionsProps {
  record: MarketPrice
  language: Language
}

export function PriceActions({ record, language }: PriceActionsProps) {
  const [speaking, setSpeaking] = useState(false)
  const [message, setMessage] = useState('')
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  const summary = [
    `MandiMitra`,
    `${record.commodity} — ${record.market}`,
    `${translate(language, 'modalPrice')}: ${formatCurrency(record.modal_price, language)} ${translate(language, 'perQuintal')}`,
    `${translate(language, 'reportedOn')}: ${formatReportedDate(record.arrival_date, language === 'hi' ? 'hi-IN' : 'en-IN')}`,
    `${translate(language, 'source')}: ${record.source}`,
  ].join('\n')

  const toggleSpeech = () => {
    if (!canSpeak) {
      setMessage(translate(language, 'voiceUnavailable'))
      return
    }
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(summary.replaceAll('\n', '. '))
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN'
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
  }

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `MandiMitra — ${record.commodity}`, text: summary })
        return
      }
      await navigator.clipboard.writeText(summary)
      setMessage(translate(language, 'copied'))
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      try {
        await navigator.clipboard.writeText(summary)
        setMessage(translate(language, 'copied'))
      } catch {
        setMessage(translate(language, 'shareFailed'))
      }
    }
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={toggleSpeech}>
          {speaking ? <Square size={17} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
          {translate(language, speaking ? 'stopListening' : 'listen')}
        </Button>
        <Button type="button" variant="secondary" onClick={() => void share()}>
          <Share2 size={18} aria-hidden="true" />
          {translate(language, 'share')}
        </Button>
      </div>
      <p aria-live="polite" className="mt-2 min-h-5 text-xs text-ink-600">{message}</p>
    </div>
  )
}

