import { Languages } from 'lucide-react'
import { useAppState } from '../../app/app-state-context'

export function LanguageSwitch() {
  const { language, setLanguage } = useAppState()
  return (
    <button
      type="button"
      onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
      aria-label={language === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sage-100 px-3 text-sm font-semibold text-forest-950 transition hover:bg-sage-200 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-harvest-500 active:translate-y-px sm:px-4"
    >
      <Languages size={18} aria-hidden="true" />
      {language === 'hi' ? 'English' : 'हिंदी'}
    </button>
  )
}

