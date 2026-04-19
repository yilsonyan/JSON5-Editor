<script setup lang="ts">
import { onMounted } from 'vue'

interface Props {
  message: string
  type: 'success' | 'error' | 'info'
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

onMounted(() => {
  setTimeout(() => {
    emit('close')
  }, 3000)
})
</script>

<template>
  <div :class="['toast', type]">
    <div class="toast-icon">
      <svg v-if="type === 'success'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="20,6 9,17 4,12"/>
      </svg>
      <svg v-else-if="type === 'error'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="12" r="10"/>
        <path d="M15 9l-6 6M9 9l6 6"/>
      </svg>
      <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4M12 8h.01"/>
      </svg>
    </div>
    <span class="toast-message">{{ message }}</span>
    <button class="toast-close" @click="emit('close')">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.toast {
  position: fixed;
  bottom: 60px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--editor-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
  z-index: 1000;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.toast.success {
  border-color: var(--success-color);
}

.toast.success .toast-icon {
  color: var(--success-color);
}

.toast.error {
  border-color: var(--error-color);
}

.toast.error .toast-icon {
  color: var(--error-color);
}

.toast.info {
  border-color: var(--accent-color);
}

.toast.info .toast-icon {
  color: var(--accent-color);
}

.toast-icon {
  display: flex;
  align-items: center;
}

.toast-message {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
}

.toast-close {
  display: flex;
  align-items: center;
  padding: 4px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
}

.toast-close:hover {
  background: var(--surface-bg);
}
</style>