import { create } from 'zustand'

export type Theme = 'dark' | 'light'

interface ThemeStore {
  theme: Theme
  setTheme: (t: Theme) => void
  toggle: () => void
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('light', theme === 'light')
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: (localStorage.getItem('aq-theme') as Theme) || 'dark',

  setTheme: (theme) => {
    localStorage.setItem('aq-theme', theme)
    applyTheme(theme)
    set({ theme })
  },

  toggle: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    get().setTheme(next)
  },
}))

export function initTheme() {
  const t = (localStorage.getItem('aq-theme') as Theme) || 'dark'
  applyTheme(t)
}
