import { useTranslation } from 'react-i18next'

export function LanguageSelector(): React.JSX.Element {
  const { t, i18n } = useTranslation()

  return (
    <select
      aria-label={t('language')}
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className="rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
    >
      <option value="fr">Français</option>
      <option value="en">English</option>
    </select>
  )
}
