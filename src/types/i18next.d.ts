import Translations from './Translations'

declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: 'translation'
        resources: {
            translation: Translations
        }
    }
}