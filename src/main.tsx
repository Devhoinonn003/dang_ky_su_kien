import { StrictMode, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Template from './template-internet-day'
import schema from './template-internet-day/schema.json'
import type { Language, RegistrationContent, ServerData } from './template-internet-day/src/types'
import serverDataJson from './mock/serverData.json'
import { createMockApi, type MockApiCall } from './mock/mockApi'

const serverData: ServerData = serverDataJson

/** Demo-only variants used to exercise the edge cases of the checklist. */
const SERVER_VARIANTS: Record<'default' | 'single' | 'paid' | 'none', ServerData | undefined> = {
  default: serverData,
  single: { ...serverData, sessions: serverData.sessions.slice(0, 1) },
  // All sample tickets are free, so SALE10 would discount 0 đ; this variant adds a paid one.
  paid: {
    ...serverData,
    ticket_types: [
      ...serverData.ticket_types,
      {
        id: 3, ticket_name: 'Workshop', ticket_code: 'WORKSHOP', price: '150000.00',
        total_quantity: 40, available_quantity: 12, sold_quantity: 28,
        sale_start_time: '2026-10-01T00:00:00+07:00', sale_end_time: '2026-12-01T00:00:00+07:00',
        description: 'Buổi thực hành chuyên sâu',
      },
    ],
  },
  none: undefined,
}
type ServerVariant = keyof typeof SERVER_VARIANTS

/** Content with several fields removed or broken, to check the fallbacks. */
const partialContent = {
  defaultData: {
    Hero: { title: { vi: 'Sự kiện chưa điền đủ nội dung' } },
    Agenda: 'not-an-array',
    Theme: { primaryColor: 'not-a-color' },
  },
} as unknown as { defaultData: RegistrationContent }

function Demo() {
  const [lang, setLang] = useState<Language>('vi')
  const [isPreview, setIsPreview] = useState(false)
  const [serverVariant, setServerVariant] = useState<ServerVariant>('default')
  const [partial, setPartial] = useState(false)
  const [calls, setCalls] = useState<MockApiCall[]>([])

  const langRef = useRef(lang)
  const serverRef = useRef(SERVER_VARIANTS[serverVariant])
  useEffect(() => {
    langRef.current = lang
    serverRef.current = SERVER_VARIANTS[serverVariant]
    document.documentElement.lang = lang
    document.title = schema.defaultData.metadata.title[lang]
  }, [lang, serverVariant])

  const mockApi = useMemo(
    () =>
      createMockApi({
        getLanguage: () => langRef.current,
        getServerData: () => serverRef.current,
        onCall: (call) => setCalls((prev) => [...prev, call]),
      }),
    [],
  )

  const registerCalls = calls.filter((c) => c.name === 'register')
  const lastRegister = registerCalls.at(-1)

  return (
    <>
      <div className="relative z-40 border-b border-white/10 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
          <span className="text-xs font-semibold tracking-wide text-white/70 uppercase">Demo</span>
          <div role="group" aria-label="Language / Ngôn ngữ" className="flex rounded-lg bg-white/10 p-1">
            {(['vi', 'en'] as const).map((code) => (
              <button
                key={code}
                type="button"
                aria-pressed={lang === code}
                onClick={() => setLang(code)}
                className={`rounded-md px-3 py-1.5 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  lang === code ? 'bg-white text-slate-900' : 'text-white hover:bg-white/10'
                }`}
              >
                {code === 'vi' ? 'Tiếng Việt' : 'English'}
              </button>
            ))}
          </div>
        </div>
        <details className="mx-auto max-w-6xl px-4 pb-2 text-sm sm:px-6">
          <summary className="cursor-pointer py-1 text-white/80 hover:text-white">
            Demo options · register() called {registerCalls.length}×
          </summary>
          <div className="grid gap-3 py-2 sm:grid-cols-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isPreview} onChange={(e) => setIsPreview(e.target.checked)} />
              isPreview
            </label>
            <label className="flex items-center gap-2">
              serverData
              <select
                value={serverVariant}
                onChange={(e) => setServerVariant(e.target.value as ServerVariant)}
                className="rounded bg-white px-2 py-1 text-slate-900"
              >
                <option value="default">serverData.json</option>
                <option value="single">1 session</option>
                <option value="paid">+ paid ticket (SALE10)</option>
                <option value="none">missing</option>
              </select>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={partial} onChange={(e) => setPartial(e.target.checked)} />
              partial / broken content
            </label>
          </div>
          {lastRegister && (
            <pre className="max-h-56 overflow-auto rounded bg-black/50 p-2 text-xs">
              {JSON.stringify(lastRegister.request, null, 2)}
            </pre>
          )}
        </details>
      </div>

      <Template
        content={partial ? partialContent : { defaultData: schema.defaultData }}
        language={lang}
        serverData={SERVER_VARIANTS[serverVariant]}
        isPreview={isPreview}
        api={mockApi}
      />
    </>
  )
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
)
