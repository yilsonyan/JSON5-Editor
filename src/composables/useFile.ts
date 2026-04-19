import { ref } from 'vue'
import { open, save } from '@tauri-apps/plugin-dialog'
import { readFile, writeFile } from '@tauri-apps/plugin-fs'

export interface FileInfo {
  path: string
  name: string
  content: string
}

// 单例状态
const currentFile = ref<FileInfo | null>(null)
const isModified = ref(false)

export function useFile() {
  const openFile = async (): Promise<string | null> => {
    const selected = await open({
      filters: [
        { name: 'JSON5', extensions: ['json5', 'json'] }
      ]
    })

    if (!selected) return null

    const path = selected as string
    return openFileFromPath(path)
  }

  const openFileFromPath = async (path: string): Promise<string | null> => {
    const name = path.split('/').pop() || 'untitled'
    const bytes = await readFile(path)
    const content = new TextDecoder().decode(bytes)

    currentFile.value = { path, name, content }
    isModified.value = false
    return content
  }

  const saveFile = async (content: string): Promise<boolean> => {
    if (!currentFile.value) {
      console.error('No current file to save')
      return false
    }

    try {
      const bytes = new TextEncoder().encode(content)
      await writeFile(currentFile.value.path, bytes)
      currentFile.value.content = content
      isModified.value = false
      console.log('File saved to:', currentFile.value.path)
      return true
    } catch (e) {
      console.error('Save error:', e)
      return false
    }
  }

  const saveFileAs = async (content: string): Promise<boolean> => {
    const selected = await save({
      filters: [
        { name: 'JSON5', extensions: ['json5', 'json'] }
      ]
    })

    if (!selected) return false

    const path = selected as string
    const name = path.split('/').pop() || 'untitled'

    try {
      const bytes = new TextEncoder().encode(content)
      await writeFile(path, bytes)

      currentFile.value = { path, name, content }
      isModified.value = false
      console.log('File saved as:', path)
      return true
    } catch (e) {
      console.error('SaveAs error:', e)
      return false
    }
  }

  const markModified = () => {
    isModified.value = true
  }

  const closeFile = () => {
    currentFile.value = null
    isModified.value = false
  }

  return {
    currentFile,
    isModified,
    openFile,
    openFileFromPath,
    saveFile,
    saveFileAs,
    closeFile,
    markModified
  }
}