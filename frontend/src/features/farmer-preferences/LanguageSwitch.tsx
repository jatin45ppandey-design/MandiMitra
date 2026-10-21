import { Languages } from 'lucide-react'
import type { Language } from '../../i18n/translations'

interface Props {
  language: Language
  onChange: (language: Language) => void
}

export function LanguageSwitch({ language, onChange }: Props) {
  return (
    <button
      type="button"
      onClick={() => onChange(language === 'hi' ? 'en' : 'hi')}
      aria-label={language === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-emerald-900/15 bg-white px-4 text-sm font-semibold text-emerald-950 shadow-sm transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
    >
      <Languages size={18} aria-hidden="true" />
      {language === 'hi' ? 'English' : 'हिंदी'}
    </button>
  )
}

