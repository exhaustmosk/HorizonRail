import { create } from 'zustand'
import { DEMO_CREDENTIALS } from '../lib/constants'
import type { Employee } from '../types'
import { useOrgStore } from './orgStore'

interface AuthStore {
  user: Employee | null
  login: (email: string, password: string) => boolean
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,

  login: (email, password) => {
    const cred = DEMO_CREDENTIALS[email.toLowerCase()]
    if (!cred || cred.password !== password) return false

    const employee = useOrgStore
      .getState()
      .getEmployeeByEmail(cred.email)
    if (!employee) return false

    set({ user: employee })
    return true
  },

  logout: () => set({ user: null }),
}))
