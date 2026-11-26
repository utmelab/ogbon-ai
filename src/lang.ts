export function initLang() {
  const lang = document.querySelector<HTMLElement>('[data-lang]')
  const langBtn = document.querySelector<HTMLButtonElement>('[data-lang-btn]')
  const langMenu = document.querySelector<HTMLElement>('[data-lang-menu]')
  if (!lang || !langBtn || !langMenu) return

  function setGoogleLang(code: string) {
    const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo')
    if (!combo) return false
    combo.value = code
    combo.dispatchEvent(new Event('change'))
    return true
  }

  langBtn.addEventListener('click', () => {
    const open = lang.classList.toggle('is-open')
    langBtn.setAttribute('aria-expanded', String(open))
  })

  langMenu.querySelectorAll<HTMLButtonElement>('[data-lang-set]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const code = btn.dataset.langSet || 'en'
      langBtn.textContent = code.toUpperCase()
      lang.classList.remove('is-open')
      langBtn.setAttribute('aria-expanded', 'false')
      if (code === 'en') {
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${location.hostname};`
        location.reload()
        return
      }
      document.cookie = `googtrans=/en/${code}; path=/;`
      document.cookie = `googtrans=/en/${code}; path=/; domain=${location.hostname};`
      if (!setGoogleLang(code)) {
        let tries = 0
        const t = window.setInterval(() => {
          tries += 1
          if (setGoogleLang(code) || tries > 20) window.clearInterval(t)
        }, 250)
      }
    })
  })

  document.addEventListener('click', (e) => {
    if (!lang.contains(e.target as Node)) {
      lang.classList.remove('is-open')
      langBtn.setAttribute('aria-expanded', 'false')
    }
  })

  ;(window as any).googleTranslateElementInit = () => {
    const g = (window as any).google
    if (!g?.translate?.TranslateElement) return
    new g.translate.TranslateElement({ pageLanguage: 'en', autoDisplay: false }, 'google_translate_element')
  }

  if (!document.querySelector('script[data-gt]')) {
    const gtScript = document.createElement('script')
    gtScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    gtScript.defer = true
    gtScript.dataset.gt = '1'
    document.head.appendChild(gtScript)
  }
}

export const langMarkup = `
  <div class="lang" data-lang>
    <button class="lang__btn" type="button" data-lang-btn aria-haspopup="listbox" aria-expanded="false">EN</button>
    <div class="lang__menu" role="listbox" data-lang-menu>
      <button type="button" data-lang-set="en">English</button>
      <button type="button" data-lang-set="fr">Français</button>
      <button type="button" data-lang-set="es">Español</button>
      <button type="button" data-lang-set="pt">Português</button>
      <button type="button" data-lang-set="tr">Türkçe</button>
      <button type="button" data-lang-set="hi">हिन्दी</button>
      <button type="button" data-lang-set="ar">العربية</button>
    </div>
  </div>
  <div id="google_translate_element" class="gt-hidden" aria-hidden="true"></div>
`
