import { ref, watch } from 'vue'
import JSON5 from 'json5'

export interface ParseError {
  line: number
  column: number
  message: string
}

export function useJson5() {
  const content = ref('')
  const error = ref<ParseError | null>(null)
  const isValid = ref(true)

  const parse = (text: string) => {
    try {
      JSON5.parse(text)
      error.value = null
      isValid.value = true
      return true
    } catch (e: unknown) {
      const err = e as Error & { line?: number; column?: number }
      error.value = {
        line: err.line || 1,
        column: err.column || 1,
        message: err.message
      }
      isValid.value = false
      return false
    }
  }

  const toJson = (text: string) => {
    try {
      const obj = JSON5.parse(text)
      return JSON.stringify(obj, null, 2)
    } catch {
      return null
    }
  }

  const toJson5 = (text: string) => {
    try {
      const obj = JSON.parse(text)
      return JSON5.stringify(obj, null, 2)
    } catch {
      return null
    }
  }

  watch(content, (newContent) => {
    if (newContent) {
      parse(newContent)
    }
  })

  return {
    content,
    error,
    isValid,
    parse,
    toJson,
    toJson5
  }
}