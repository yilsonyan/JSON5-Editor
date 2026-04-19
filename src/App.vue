<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import Editor from './components/Editor.vue'
import Toolbar from './components/Toolbar.vue'
import StatusBar from './components/StatusBar.vue'
import SearchPanel from './components/SearchPanel.vue'
import Toast from './components/Toast.vue'
import { useFile } from './composables/useFile'
import { useJson5 } from './composables/useJson5'

const { currentFile, openFile, openFileFromPath, saveFile, saveFileAs, closeFile, isModified } = useFile()
const { content, error, isValid, toJson, toJson5 } = useJson5()

const editorRef = ref<InstanceType<typeof Editor> | null>(null)
const cursorLine = ref(1)
const cursorColumn = ref(1)
const currentFormat = ref<'json' | 'json5'>('json5')
const showSearch = ref(false)
const matchCount = ref(0)
const currentMatchIndex = ref(0)

const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'info'>('info')
const showToast = ref(false)

const showToastNotification = (message: string, type: 'success' | 'error' | 'info') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
}

watch(() => editorRef.value?.isValid, (val) => {
  if (val !== undefined) isValid.value = val
})

watch(() => editorRef.value?.error, (val) => {
  error.value = val || null
})

watch(() => editorRef.value?.cursorLine, (val) => {
  if (val) cursorLine.value = val
})

watch(() => editorRef.value?.cursorColumn, (val) => {
  if (val) cursorColumn.value = val
})

watch(() => editorRef.value?.matchCount, (val) => {
  if (val !== undefined) matchCount.value = val
})

watch(() => editorRef.value?.currentMatchIndex, (val) => {
  if (val !== undefined) currentMatchIndex.value = val
})

const setupKeyboardShortcuts = () => {
  document.addEventListener('keydown', async (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const cmdKey = isMac ? e.metaKey : e.ctrlKey

    if (cmdKey) {
      switch (e.key.toLowerCase()) {
        case 'o':
          e.preventDefault()
          await handleOpen()
          break
        case 's':
          e.preventDefault()
          if (e.shiftKey) {
            await handleSaveAs()
          } else {
            await handleSave()
          }
          break
        case 'f':
          e.preventDefault()
          showSearch.value = true
          break
        case 'w':
          e.preventDefault()
          handleClose()
          break
      }
    }

    if (e.key === 'Escape' && showSearch.value) {
      showSearch.value = false
    }
  })
}

const handleOpen = async () => {
  const fileContent = await openFile()
  if (fileContent && editorRef.value) {
    editorRef.value.setContent(fileContent)
    content.value = fileContent
    await nextTick()
    cursorLine.value = editorRef.value.cursorLine
    cursorColumn.value = editorRef.value.cursorColumn
  }
}

const handleSave = async () => {
  if (editorRef.value && currentFile.value) {
    const text = editorRef.value.getContent()
    const success = await saveFile(text)
    if (success) {
      isModified.value = false
      showToastNotification('文件已保存', 'success')
    } else {
      showToastNotification('保存失败', 'error')
    }
  } else {
    showToastNotification('请先打开文件', 'error')
  }
}

const handleSaveAs = async () => {
  if (editorRef.value) {
    const text = editorRef.value.getContent()
    const success = await saveFileAs(text)
    if (success) {
      isModified.value = false
      showToastNotification('文件已另存', 'success')
    } else {
      showToastNotification('另存失败', 'error')
    }
  }
}

const handleClose = () => {
  closeFile()
  editorRef.value?.setContent('')
  content.value = ''
  showToastNotification('文件已关闭', 'info')
}

const handleFoldAll = () => {
  editorRef.value?.foldAllBlocks()
}

const handleUnfoldAll = () => {
  editorRef.value?.unfoldAllBlocks()
}

const handleSearch = () => {
  showSearch.value = true
}

const handleSearchQuery = (query: string) => {
  editorRef.value?.search(query)
}

const handleSearchPrev = (query: string) => {
  editorRef.value?.searchPrev(query)
}

const handleReplace = (query: string, replacement: string) => {
  editorRef.value?.replace(query, replacement)
}

const handleReplaceAll = (query: string, replacement: string) => {
  const count = editorRef.value?.replaceAll(query, replacement) || 0
  if (count > 0) {
    showToastNotification(`已替换 ${count} 处`, 'success')
  }
}

const handleGoToError = (line: number) => {
  editorRef.value?.goToLine(line)
}

const handleFormatChange = (format: 'json' | 'json5') => {
  if (editorRef.value) {
    const text = editorRef.value.getContent()
    if (format === 'json') {
      const converted = toJson(text)
      if (converted) {
        editorRef.value.setContent(converted)
        showToastNotification('已转换为 JSON', 'success')
      } else {
        showToastNotification('转换失败，请检查格式', 'error')
      }
    } else {
      const converted = toJson5(text)
      if (converted) {
        editorRef.value.setContent(converted)
        showToastNotification('已转换为 JSON5', 'success')
      } else {
        showToastNotification('转换失败，请检查格式', 'error')
      }
    }
    currentFormat.value = format
  }
}

const handleOpenFromPath = async (filePath: string) => {
  // Wait for editor to be ready with multiple retries
  let retries = 0
  while (!editorRef.value && retries < 10) {
    await new Promise(resolve => setTimeout(resolve, 100))
    retries++
  }

  if (!editorRef.value) {
    console.error('Editor not ready after multiple retries')
    return
  }

  const fileContent = await openFileFromPath(filePath)
  if (fileContent && editorRef.value) {
    editorRef.value.setContent(fileContent)
    content.value = fileContent
    await nextTick()
    cursorLine.value = editorRef.value.cursorLine
    cursorColumn.value = editorRef.value.cursorColumn
    showToastNotification(`已打开: ${currentFile.value?.name}`, 'success')
  }
}

const setupFileOpenListener = async () => {
  // Listen for file-opened event (from deep-link plugin)
  await listen('file-opened', async (event) => {
    const filePath = event.payload as string
    await handleOpenFromPath(filePath)
  })
}

onMounted(async () => {
  setupKeyboardShortcuts()
  await setupFileOpenListener()
  if (editorRef.value) {
    cursorLine.value = editorRef.value.cursorLine
    cursorColumn.value = editorRef.value.cursorColumn
  }
  // Check if there's a pending file to open (from app launch with file)
  try {
    const pendingFile = await invoke<string | null>('get_pending_file')
    if (pendingFile) {
      await handleOpenFromPath(pendingFile)
    }
  } catch (e) {
    console.error('Failed to get pending file:', e)
  }
})
</script>

<template>
  <div class="app">
    <Toolbar
      :currentFile="currentFile"
      :isModified="isModified"
      @open="handleOpen"
      @close="handleClose"
      @save="handleSave"
      @saveAs="handleSaveAs"
      @foldAll="handleFoldAll"
      @unfoldAll="handleUnfoldAll"
      @search="handleSearch"
    />
    <SearchPanel
      v-if="showSearch"
      :matchCount="matchCount"
      :currentMatchIndex="currentMatchIndex"
      @close="showSearch = false"
      @search="handleSearchQuery"
      @searchPrev="handleSearchPrev"
      @replace="handleReplace"
      @replaceAll="handleReplaceAll"
    />
    <Editor ref="editorRef" :format="currentFormat" />
    <StatusBar
      :isValid="isValid"
      :errorLine="error?.line"
      :errorColumn="error?.column"
      :cursorLine="cursorLine"
      :cursorColumn="cursorColumn"
      :format="currentFormat"
      @formatChange="handleFormatChange"
      @goToError="handleGoToError"
    />
    <Toast
      v-if="showToast"
      :message="toastMessage"
      :type="toastType"
      @close="showToast = false"
    />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app, .app {
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-color: #1e1e1e;
}

.app {
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* Dark Theme (only) */
:root {
  --bg-color: #1e1e1e;
  --editor-bg: #1e1e1e;
  --toolbar-bg: #252526;
  --statusbar-bg: #252526;
  --surface-bg: rgba(255, 255, 255, 0.08);
  --hover-bg: rgba(255, 255, 255, 0.12);
  --border-color: #3c3c3c;
  --text-primary: #cccccc;
  --text-secondary: #9d9d9d;
  --text-muted: #6e6e6e;
  --accent-color: #007acc;
  --accent-hover: #1177bb;
  --error-color: #f14c4c;
  --success-color: #4ec9b0;
}
</style>