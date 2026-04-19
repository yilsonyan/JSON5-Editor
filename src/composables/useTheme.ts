import { ref } from 'vue'

const isDark = ref(false)

export function useTheme() {
  const updateTheme = () => {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  updateTheme()
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme)

  return { isDark }
}