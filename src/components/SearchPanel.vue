<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

interface Props {
  matchCount: number
  currentMatchIndex: number
}

withDefaults(defineProps<Props>(), {
  matchCount: 0,
  currentMatchIndex: 0
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'search', query: string): void
  (e: 'searchPrev', query: string): void
  (e: 'replace', query: string, replacement: string): void
  (e: 'replaceAll', query: string, replacement: string): void
}>()

const searchQuery = ref('')
const replaceQuery = ref('')
const showReplace = ref(false)

const handleSearch = () => {
  if (searchQuery.value) {
    emit('search', searchQuery.value)
  }
}

const handleSearchPrev = () => {
  if (searchQuery.value) {
    emit('searchPrev', searchQuery.value)
  }
}

const handleReplace = () => {
  if (searchQuery.value) {
    emit('replace', searchQuery.value, replaceQuery.value)
  }
}

const handleReplaceAll = () => {
  if (searchQuery.value) {
    emit('replaceAll', searchQuery.value, replaceQuery.value)
  }
}

const toggleReplace = () => {
  showReplace.value = !showReplace.value
}

// Auto search on input
watch(searchQuery, () => {
  handleSearch()
})

// Keyboard shortcuts
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    emit('close')
  } else if (e.key === 'Enter') {
    if (e.shiftKey) {
      handleSearchPrev()
    } else {
      handleSearch()
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    handleSearch()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    handleSearchPrev()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="search-panel">
    <div class="search-row">
      <div class="input-group">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索..."
          class="search-input"
          @keydown.enter="handleSearch"
        />
        <span v-if="matchCount > 0" class="match-count">
          {{ currentMatchIndex }}/{{ matchCount }}
        </span>
        <button @click="handleSearch" class="btn-small" title="搜索下一个">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
        <button @click="toggleReplace" :class="['btn-small', { active: showReplace }]" title="替换">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </div>
      <button @click="emit('close')" class="btn-close" title="关闭 (Esc)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <div v-if="showReplace" class="replace-row">
      <div class="input-group">
        <input
          v-model="replaceQuery"
          type="text"
          placeholder="替换为..."
          class="search-input"
        />
        <button @click="handleReplace" class="btn-small" title="替换当前">
          替换
        </button>
        <button @click="handleReplaceAll" class="btn-small" title="替换全部">
          全部
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-panel {
  display: flex;
  flex-direction: column;
  padding: 8px 16px;
  background: var(--toolbar-bg);
  border-bottom: 1px solid var(--border-color);
}

.search-row, .replace-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.replace-row {
  margin-top: 8px;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.search-input {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--editor-bg);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
}

.search-input:focus {
  border-color: var(--accent-color);
}

.match-count {
  padding: 4px 8px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--surface-bg);
  border-radius: 4px;
  min-width: 50px;
  text-align: center;
}

.btn-small {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--surface-bg);
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-small:hover {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.btn-small.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.btn-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-close:hover {
  background: var(--error-color);
  color: white;
}
</style>