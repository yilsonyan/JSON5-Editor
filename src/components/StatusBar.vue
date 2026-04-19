<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  isValid: boolean
  errorLine?: number
  errorColumn?: number
  cursorLine: number
  cursorColumn: number
  format: 'json' | 'json5'
}

const props = withDefaults(defineProps<Props>(), {
  isValid: true,
  cursorLine: 1,
  cursorColumn: 1,
  format: 'json5'
})

const emit = defineEmits<{
  (e: 'formatChange', format: 'json' | 'json5'): void
  (e: 'goToError', line: number): void
}>()

const statusText = computed(() => {
  return props.isValid ? 'Valid' : 'Invalid'
})

const toggleFormat = () => {
  const newFormat = props.format === 'json5' ? 'json' : 'json5'
  emit('formatChange', newFormat)
}

const goToError = () => {
  if (!props.isValid && props.errorLine) {
    emit('goToError', props.errorLine)
  }
}
</script>

<template>
  <footer class="status-bar">
    <div class="status-left">
      <div :class="['status-badge', isValid ? 'valid' : 'invalid']" @click="goToError">
        <svg v-if="isValid" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20,6 9,17 4,12"/>
        </svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M15 9l-6 6M9 9l6 6"/>
        </svg>
        <span>{{ statusText }}</span>
      </div>
      <button v-if="!isValid" @click="goToError" class="error-link">
        第 {{ errorLine }} 行
      </button>
    </div>

    <div class="status-right">
      <span class="cursor-info">
        <span class="cursor-label">Ln</span>
        <span class="cursor-value">{{ cursorLine }}</span>
        <span class="cursor-separator">,</span>
        <span class="cursor-label">Col</span>
        <span class="cursor-value">{{ cursorColumn }}</span>
      </span>
      <span class="encoding">UTF-8</span>
      <button @click="toggleFormat" class="format-toggle">
        {{ format.toUpperCase() }}
      </button>
    </div>
  </footer>
</template>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px;
  background: var(--statusbar-bg);
  border-top: 1px solid var(--border-color);
  font-size: 12px;
  user-select: none;
}

.status-left, .status-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 4px;
  font-weight: 500;
  font-size: 11px;
  transition: all 0.15s ease;
  cursor: default;
}

.status-badge.invalid {
  background: rgba(228, 0, 0, 0.1);
  color: var(--error-color);
  cursor: pointer;
}

.status-badge.invalid:hover {
  background: rgba(228, 0, 0, 0.2);
}

.status-badge.valid {
  background: rgba(56, 138, 52, 0.1);
  color: var(--success-color);
}

.error-link {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  background: var(--error-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.error-link:hover {
  opacity: 0.85;
}

.cursor-info {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary);
}

.cursor-label {
  color: var(--text-muted);
  font-size: 11px;
}

.cursor-value {
  color: var(--text-primary);
  font-weight: 500;
}

.cursor-separator {
  color: var(--text-muted);
  margin: 0 2px;
}

.encoding {
  color: var(--text-muted);
  font-size: 11px;
}

.format-toggle {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  background: var(--surface-bg);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.format-toggle:hover {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}
</style>