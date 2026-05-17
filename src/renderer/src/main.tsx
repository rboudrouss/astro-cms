import React from 'react'
import ReactDOM from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import { App } from './App'
import { initI18n } from './i18n'
import './index.css'

async function bootstrap(): Promise<void> {
  const osLocale = await window.api.getLocale()
  const i18n = initI18n(osLocale)

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </React.StrictMode>
  )
}

bootstrap()
