import i18next from 'i18next'
import enTranslations from './locales/en/translations.js'
import frTranslations from './locales/fr/translations.js'

const resources = {
    en: { translation: enTranslations },
    fr: { translation: frTranslations }
}

await i18next.init({
    debug: false,
    defaultNS: 'translation',
    fallbackLng: 'fr',
    resources,
    interpolation: {
        escapeValue: false
    }
})

export default i18next