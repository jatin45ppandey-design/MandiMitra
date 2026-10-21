import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'

interface SearchableSelectProps {
  label: string
  value: string
  options: string[]
  placeholder: string
  searchLabel: string
  loadingLabel: string
  emptyLabel: string
  onChange: (value: string) => void
  loading?: boolean
  disabled?: boolean
  optional?: string
}

export function SearchableSelect({
  label,
  value,
  options,
  placeholder,
  searchLabel,
  loadingLabel,
  emptyLabel,
  onChange,
  loading = false,
  disabled = false,
  optional,
}: SearchableSelectProps) {
  const id = useId()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const filtered = useMemo(
    () => options.filter((option) => option.toLocaleLowerCase().includes(query.toLocaleLowerCase())),
    [options, query],
  )

  useEffect(() => {
    const handlePointer = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointer)
    return () => document.removeEventListener('pointerdown', handlePointer)
  }, [])

  useEffect(() => {
    if (open && window.matchMedia('(pointer: fine)').matches) {
      window.requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const closeAndFocus = () => {
    setOpen(false)
    setQuery('')
    triggerRef.current?.focus()
  }

  const choose = (option: string) => {
    onChange(option)
    closeAndFocus()
  }

  return (
    <div ref={wrapperRef} className="relative min-w-0">
      <span id={`${id}-label`} className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-forest-950">
        <span>{label}</span>
        {optional ? <span className="text-xs font-normal text-ink-500">{optional}</span> : null}
      </span>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current)
          setActiveIndex(0)
        }}
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl bg-white px-4 text-left text-sm text-forest-950 outline outline-1 -outline-offset-1 outline-forest-900/15 transition hover:outline-forest-700/40 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-harvest-500 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-ink-400"
      >
        <span id={`${id}-value`} className="truncate">{value || placeholder}</span>
        <ChevronDown size={18} className={`shrink-0 transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open ? (
        <div className="absolute z-30 mt-2 w-full min-w-56 rounded-2xl bg-white p-2 shadow-panel outline outline-1 outline-forest-900/10">
          <div className="flex items-center gap-2 rounded-xl bg-sage-50 px-3 outline outline-1 -outline-offset-1 outline-transparent focus-within:outline-3 focus-within:outline-harvest-500">
            <Search size={17} className="text-ink-500" aria-hidden="true" />
            <input
              ref={inputRef}
              role="combobox"
              aria-expanded="true"
              aria-controls={`${id}-listbox`}
              aria-activedescendant={filtered[activeIndex] ? `${id}-option-${activeIndex}` : undefined}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setActiveIndex(0)
              }}
              autoComplete="off"
              name={`${id}-search`}
              onKeyDown={(event) => {
                if (event.key === 'Escape') closeAndFocus()
                if (event.key === 'ArrowDown') {
                  event.preventDefault()
                  setActiveIndex((current) => Math.min(current + 1, filtered.length - 1))
                }
                if (event.key === 'ArrowUp') {
                  event.preventDefault()
                  setActiveIndex((current) => Math.max(current - 1, 0))
                }
                if (event.key === 'Enter' && filtered[activeIndex]) {
                  event.preventDefault()
                  choose(filtered[activeIndex])
                }
              }}
              placeholder={searchLabel}
              className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-400"
            />
          </div>
          <div id={`${id}-listbox`} role="listbox" className="mt-2 max-h-56 overflow-y-auto overscroll-contain">
            {loading ? <p className="px-3 py-4 text-sm text-ink-500">{loadingLabel}</p> : null}
            {!loading && filtered.length === 0 ? (
              <p className="px-3 py-4 text-sm text-ink-500">{emptyLabel}</p>
            ) : null}
            {!loading
              ? filtered.map((option, index) => (
                  <button
                    id={`${id}-option-${index}`}
                    role="option"
                    aria-selected={option === value}
                    tabIndex={-1}
                    type="button"
                    key={option}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => choose(option)}
                    className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-sm transition ${
                      index === activeIndex ? 'bg-sage-100' : 'hover:bg-sage-50'
                    }`}
                  >
                    <span>{option}</span>
                    {option === value ? <Check size={17} aria-hidden="true" /> : null}
                  </button>
                ))
              : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

