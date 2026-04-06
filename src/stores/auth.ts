import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ViewName } from '../types'

export const useAuthStore = defineStore('auth', () => {
  // ─── State ───────────────────────────────────────────────────────────────
  const therapistName = ref<string | null>(sessionStorage.getItem('therapistName'))
  const userRole = ref<string | null>(sessionStorage.getItem('userRole'))
  const currentView = ref<ViewName>('login')

  // ─── Getters ─────────────────────────────────────────────────────────────
  const isManager = computed(() => userRole.value === 'Manager')
  const isLoggedIn = computed(() => !!therapistName.value && !!userRole.value)

  // ─── Actions ─────────────────────────────────────────────────────────────

  /** Persist user info to sessionStorage and reactive state */
  function setUser(name: string, role: string) {
    therapistName.value = name
    userRole.value = role
    sessionStorage.setItem('therapistName', name)
    sessionStorage.setItem('userRole', role)
  }

  /** Clear all user data from state and sessionStorage */
  function clearUser() {
    therapistName.value = null
    userRole.value = null
    sessionStorage.clear()
  }

  /** Navigate to a named view */
  function navigateTo(view: ViewName) {
    currentView.value = view
  }

  /** Route to the correct main menu based on role */
  function navigateToMenu() {
    currentView.value = isManager.value ? 'admin-menu' : 'therapist-menu'
  }

  return {
    // state
    therapistName,
    userRole,
    currentView,
    // getters
    isManager,
    isLoggedIn,
    // actions
    setUser,
    clearUser,
    navigateTo,
    navigateToMenu,
  }
})
