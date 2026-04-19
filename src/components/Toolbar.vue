<script setup lang="ts">
import { computed } from 'vue'
import type { FileInfo } from '../composables/useFile'

interface Props {
  currentFile: FileInfo | null
  isModified: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'open'): void
  (e: 'close'): void
  (e: 'save'): void
  (e: 'saveAs'): void
  (e: 'foldAll'): void
  (e: 'unfoldAll'): void
  (e: 'search'): void
}>()

const fileName = computed(() => {
  if (!props.currentFile) return ''

  let name = props.currentFile.name

  // Truncate if longer than 20 characters (excluding extension)
  const extMatch = name.match(/\.(json5|json)$/i)
  const ext = extMatch ? extMatch[0] : ''
  const baseName = extMatch ? name.slice(0, -ext.length) : name

  if (baseName.length > 20) {
    name = baseName.slice(0, 20) + '..' + ext
  }

  return props.isModified ? `${name} •` : name
})
</script>

<template>
  <header class="toolbar">
    <div class="toolbar-left">
      <div v-if="currentFile" class="file-tab">
        <span class="file-name">{{ fileName }}</span>
        <button @click="emit('close')" class="close-btn" title="关闭文件">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <button v-else @click="emit('open')" class="new-file-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
        </svg>
        <span>打开文件</span>
      </button>
    </div>

    <div class="toolbar-right">
      <div class="btn-group">
        <button @click="emit('open')" class="btn btn-icon" title="打开文件 (⌘O)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          </svg>
        </button>
        <button @click="emit('save')" class="btn btn-icon" :disabled="!currentFile" title="保存 (⌘S)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
            <polyline points="17,21 17,13 7,13 7,21"/>
            <polyline points="7,3 7,8 15,8"/>
          </svg>
        </button>
        <button @click="emit('saveAs')" class="btn btn-icon" title="另存为 (⌘⇧S)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 3H7a2 2 0 00-2 2v16l7-3 7 3V5a2 2 0 00-2-2z"/>
          </svg>
        </button>
      </div>

      <div class="divider"></div>

      <div class="btn-group">
        <button @click="emit('foldAll')" class="btn btn-text" title="折叠全部代码块">
          折叠
        </button>
        <button @click="emit('unfoldAll')" class="btn btn-text" title="展开全部代码块">
          展开
        </button>
      </div>

      <div class="divider"></div>

      <button @click="emit('search')" class="btn btn-icon" title="查找 (⌘F)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
      </button>
    </div>
  </header>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--toolbar-bg);
  border-bottom: 1px solid var(--border-color);
  user-select: none;
  min-height: 48px;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--surface-bg);
  border-radius: 6px;
  border: 1px solid var(--border-color);
  transition: all 0.15s ease;
}

.file-tab:hover {
  background: var(--hover-bg);
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.close-btn:hover {
  background: var(--error-color);
  color: white;
}

.new-file-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--surface-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.new-file-btn:hover {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.btn-group {
  display: flex;
  gap: 2px;
}

.divider {
  width: 1px;
  height: 24px;
  background: var(--border-color);
  margin: 0 6px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn:hover:not(:disabled) {
  background: var(--surface-bg);
  color: var(--text-primary);
}

.btn:active:not(:disabled) {
  transform: scale(0.95);
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-icon {
  width: 34px;
  height: 34px;
}

.btn-text {
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  background: var(--surface-bg);
}

.btn-text:hover:not(:disabled) {
  background: var(--accent-color);
  color: white;
}

svg {
  flex-shrink: 0;
}
</style>