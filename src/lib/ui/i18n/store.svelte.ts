import { en } from './en';
import { es } from './es';
import type { Translations } from './en';
import { browser } from '$app/environment';

// NOTE: When adding new languages in the future (e.g. fr, de):
// 1. Create fr.ts implementing Translations
// 2. Import it here
// 3. Add it to the dictionaries object
// 4. Update the Locale type

export const dictionaries = {
	en,
	es
} as const;

export type Locale = keyof typeof dictionaries;

class I18nStore {
	#locale = $state<Locale>('en');

	constructor() {
		if (import.meta.env.MODE === 'test') {
			this.#locale = 'en';
			return;
		}
		if (browser) {
			const saved = localStorage.getItem('quill-locale') as Locale | null;
			if (saved && saved in dictionaries) {
				this.#locale = saved;
			} else {
				// Detect browser language as fallback if nothing is saved
				const navLang = navigator.language.split('-')[0] as Locale;
				if (navLang in dictionaries) {
					this.#locale = navLang;
				}
			}
		}
	}

	get locale() {
		return this.#locale;
	}

	set locale(value: Locale) {
		if (value in dictionaries) {
			this.#locale = value;
			if (browser) {
				localStorage.setItem('quill-locale', value);
			}
		}
	}

	get t(): Translations {
		return dictionaries[this.#locale];
	}
}

export const i18n = new I18nStore();
