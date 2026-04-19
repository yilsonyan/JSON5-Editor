<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { EditorView, lineNumbers, highlightActiveLine, keymap } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { json } from '@codemirror/lang-json'
import { javascript } from '@codemirror/lang-javascript'
import { foldGutter, bracketMatching, indentOnInput, syntaxHighlighting, foldKeymap, foldAll, unfoldAll, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { linter } from '@codemirror/lint'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import JSON5 from 'json5'

interface Props {
  format?: 'json' | 'json5'
}

const props = withDefaults(defineProps<Props>(), {
  format: 'json5'
})

const editorContainer = ref<HTMLDivElement>()
const content = ref('')
const error = ref<{ line: number; column: number; message: string } | null>(null)
const isValid = ref(true)
const cursorLine = ref(1)
const cursorColumn = ref(1)
const matchCount = ref(0)
const currentMatchIndex = ref(0)

let editorView: EditorView | null = null
const languageCompartment = new Compartment()

const jsonLinter = linter((view) => {
  const code = view.state.doc.toString()
  if (!code.trim()) {
    isValid.value = true
    error.value = null
    return []
  }

  try {
    if (props.format === 'json') {
      JSON.parse(code)
    } else {
      JSON5.parse(code)
    }
    isValid.value = true
    error.value = null
    return []
  } catch (e: unknown) {
    const err = e as SyntaxError

    let line = 1
    let column = 1

    // Parse error message - different formats across browsers
    // V8 (Chrome/Node): "at position X (line Y column Z)"
    // JSON5: "at line:column"
    // WebKit (Safari): no line info, need to find manually

    const lineColMatch = err.message.match(/\(line (\d+) column (\d+)\)/)
    if (lineColMatch) {
      line = parseInt(lineColMatch[1], 10)
      column = parseInt(lineColMatch[2], 10)
    } else {
      // JSON5 format: "at line:column"
      const json5Match = err.message.match(/at (\d+):(\d+)/)
      if (json5Match) {
        line = parseInt(json5Match[1], 10)
        column = parseInt(json5Match[2], 10)
      } else if (props.format === 'json') {
        // WebKit JSON.parse - find error position by manual parsing
        const errorPos = findJsonErrorPosition(code)
        if (errorPos >= 0) {
          const lineInfo = view.state.doc.lineAt(Math.min(errorPos, view.state.doc.length))
          line = lineInfo.number
          column = errorPos - lineInfo.from + 1
        }
      }
    }

    const lineInfo = view.state.doc.line(Math.min(line, view.state.doc.lines))

    isValid.value = false
    error.value = {
      line,
      column,
      message: err.message
    }

    return [{
      from: Math.min(lineInfo.from + column - 1, lineInfo.to),
      to: Math.min(lineInfo.from + column, lineInfo.to),
      message: err.message,
      severity: 'error'
    }]
  }
})

// Manual JSON validator to find error position (for WebKit)
function findJsonErrorPosition(code: string): number {
  let pos = 0
  const len = code.length

  function skipWhitespace(): void {
    while (pos < len && /[\s\n\r\t]/.test(code[pos])) {
      pos++
    }
  }

  function parseValue(): boolean {
    skipWhitespace()
    if (pos >= len) return false

    const char = code[pos]

    if (char === '"') {
      return parseString()
    } else if (char === '{') {
      return parseObject()
    } else if (char === '[') {
      return parseArray()
    } else if (/[0-9\-]/.test(char)) {
      return parseNumber()
    } else if (code.slice(pos, pos + 4) === 'true') {
      pos += 4
      return true
    } else if (code.slice(pos, pos + 5) === 'false') {
      pos += 5
      return true
    } else if (code.slice(pos, pos + 4) === 'null') {
      pos += 4
      return true
    }
    return false
  }

  function parseString(): boolean {
    if (code[pos] !== '"') return false
    pos++
    while (pos < len && code[pos] !== '"') {
      if (code[pos] === '\\') {
        pos++
        if (pos >= len) return false
      }
      pos++
    }
    if (pos >= len) return false
    pos++
    return true
  }

  function parseNumber(): boolean {
    if (code[pos] === '-') pos++
    if (!/[0-9]/.test(code[pos])) return false
    while (pos < len && /[0-9]/.test(code[pos])) pos++
    if (pos < len && code[pos] === '.') {
      pos++
      while (pos < len && /[0-9]/.test(code[pos])) pos++
    }
    if (pos < len && /[eE]/.test(code[pos])) {
      pos++
      if (pos < len && /[+\-]/.test(code[pos])) pos++
      while (pos < len && /[0-9]/.test(code[pos])) pos++
    }
    return true
  }

  function parseObject(): boolean {
    if (code[pos] !== '{') return false
    pos++
    skipWhitespace()

    if (code[pos] === '}') {
      pos++
      return true
    }

    while (pos < len) {
      skipWhitespace()
      if (!parseString()) return false
      skipWhitespace()
      if (code[pos] !== ':') return false
      pos++
      skipWhitespace()
      if (!parseValue()) return false
      skipWhitespace()
      if (code[pos] === '}') {
        pos++
        return true
      }
      if (code[pos] !== ',') return false
      pos++
    }
    return false
  }

  function parseArray(): boolean {
    if (code[pos] !== '[') return false
    pos++
    skipWhitespace()

    if (code[pos] === ']') {
      pos++
      return true
    }

    while (pos < len) {
      skipWhitespace()
      if (!parseValue()) return false
      skipWhitespace()
      if (code[pos] === ']') {
        pos++
        return true
      }
      if (code[pos] !== ',') return false
      pos++
    }
    return false
  }

  skipWhitespace()
  if (!parseValue()) return pos
  skipWhitespace()
  if (pos < len) return pos  // trailing garbage
  return -1
}

// VS Code Dark+ syntax colors (dark mode only)
const vscodeDarkHighlight = HighlightStyle.define([
  { tag: tags.propertyName, color: '#9cdcfe' },
  { tag: tags.definition(tags.propertyName), color: '#9cdcfe' },
  { tag: tags.string, color: '#ce9178' },
  { tag: tags.number, color: '#b5cea8' },
  { tag: tags.bool, color: '#569cd6' },
  { tag: tags.null, color: '#569cd6' },
  { tag: tags.punctuation, color: '#d4d4d4' },
  { tag: tags.bracket, color: '#d4d4d4' },
  { tag: tags.separator, color: '#d4d4d4' },
  // JavaScript/JSON5 specific tags
  { tag: tags.keyword, color: '#569cd6' },
  { tag: tags.comment, color: '#6a9955' },
  { tag: tags.name, color: '#9cdcfe' },
  { tag: tags.variableName, color: '#9cdcfe' },
  { tag: tags.definition(tags.variableName), color: '#9cdcfe' }
])

const vscodeDark = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
    backgroundColor: '#1e1e1e'
  },
  '.cm-scroller': {
    fontFamily: "Consolas, 'Courier New', monospace",
    lineHeight: '1.5',
    padding: '4px 0'
  },
  '.cm-content': {
    padding: '0 16px',
    caretColor: '#d4d4d4'
  },
  '.cm-line': {
    padding: '0 2px'
  },
  '.cm-activeLine': {
    backgroundColor: '#264f36 !important'
  },
  '.cm-gutters': {
    backgroundColor: '#1e1e1e',
    border: 'none',
    color: '#858585'
  },
  '.cm-lineNumbers .cm-gutterElement': {
    minWidth: '48px',
    textAlign: 'right',
    paddingRight: '16px',
    color: '#858585'
  },
  '.cm-foldGutter': {
    width: '20px',
    paddingLeft: '4px'
  },
  '.cm-foldGutter .cm-gutterElement': {
    cursor: 'pointer',
    color: '#c5c5c5',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '21px'
  },
  '.cm-cursor': {
    borderLeftColor: '#d4d4d4',
    borderLeftWidth: '1px'
  },
  '.cm-selectionBackground': {
    backgroundColor: '#264f78 !important'
  },
  '.cm-searchMatch': {
    backgroundColor: '#f7d77d',
    outline: '1px solid #e5a000'
  },
  '.cm-lintRange-error': {
    backgroundImage: 'none',
    backgroundColor: 'rgba(228, 0, 0, 0.1)',
    borderBottom: '2px wavy #e51400'
  }
}, { dark: true })

const updateCursorPosition = (view: EditorView) => {
  const pos = view.state.selection.main.head
  const line = view.state.doc.lineAt(pos)
  cursorLine.value = line.number
  cursorColumn.value = pos - line.from + 1
}

const getLanguageExtension = (format: 'json' | 'json5') => {
  if (format === 'json5') {
    return javascript({ jsx: false })
  }
  return json()
}

const createEditor = () => {
  if (!editorContainer.value) return

  const state = EditorState.create({
    doc: content.value,
    extensions: [
      lineNumbers(),
      highlightActiveLine(),
      history(),
      foldGutter(),
      bracketMatching(),
      indentOnInput(),
      syntaxHighlighting(vscodeDarkHighlight),
      languageCompartment.of(getLanguageExtension(props.format)),
      jsonLinter,
      keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap]),
      vscodeDark,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          content.value = update.state.doc.toString()
        }
        if (update.selectionSet || update.docChanged) {
          updateCursorPosition(update.view)
        }
      }),
      EditorView.lineWrapping
    ]
  })

  editorView = new EditorView({
    state,
    parent: editorContainer.value
  })

  updateCursorPosition(editorView)
}

const setLanguage = (format: 'json' | 'json5') => {
  if (!editorView) return
  editorView.dispatch({
    effects: languageCompartment.reconfigure(getLanguageExtension(format))
  })
}

watch(() => props.format, (newFormat) => {
  setLanguage(newFormat)
})

// Fold all - use CodeMirror's foldAll command
const foldAllBlocks = () => {
  if (!editorView) return
  foldAll(editorView)
}

const unfoldAllBlocks = () => {
  if (!editorView) return
  unfoldAll(editorView)
}

const goToLine = (lineNumber: number) => {
  if (!editorView) return
  const line = editorView.state.doc.line(Math.min(lineNumber, editorView.state.doc.lines))
  editorView.dispatch({
    selection: { anchor: line.from },
    scrollIntoView: true,
    effects: EditorView.scrollIntoView(line.from, { y: 'center' })
  })
  editorView.focus()
}

const search = (query: string) => {
  if (!editorView || !query) {
    matchCount.value = 0
    currentMatchIndex.value = 0
    return
  }

  const state = editorView.state
  const matches: number[] = []
  const text = state.doc.toString()

  let pos = 0
  while (pos < text.length) {
    const idx = text.indexOf(query, pos)
    if (idx === -1) break
    matches.push(idx)
    pos = idx + query.length
  }

  matchCount.value = matches.length

  if (matches.length > 0) {
    const currentPos = state.selection.main.from
    const nextMatchIdx = matches.findIndex(m => m > currentPos)
    const targetMatch = nextMatchIdx >= 0 ? matches[nextMatchIdx] : matches[0]
    currentMatchIndex.value = nextMatchIdx >= 0 ? nextMatchIdx + 1 : 1

    editorView.dispatch({
      selection: { anchor: targetMatch, head: targetMatch + query.length },
      scrollIntoView: true,
      effects: EditorView.scrollIntoView(targetMatch, { y: 'center' })
    })
  } else {
    currentMatchIndex.value = 0
  }
}

const searchPrev = (query: string) => {
  if (!editorView || !query) {
    matchCount.value = 0
    currentMatchIndex.value = 0
    return
  }

  const state = editorView.state
  const matches: number[] = []
  const text = state.doc.toString()

  let pos = 0
  while (pos < text.length) {
    const idx = text.indexOf(query, pos)
    if (idx === -1) break
    matches.push(idx)
    pos = idx + query.length
  }

  matchCount.value = matches.length

  if (matches.length > 0) {
    const currentPos = state.selection.main.from
    // Find previous match (last match before current position)
    const prevMatchIdx = matches.findIndex(m => m >= currentPos) - 1
    const targetMatch = prevMatchIdx >= 0 ? matches[prevMatchIdx] : matches[matches.length - 1]
    const displayIndex = prevMatchIdx >= 0 ? prevMatchIdx + 1 : matches.length
    currentMatchIndex.value = displayIndex

    editorView.dispatch({
      selection: { anchor: targetMatch, head: targetMatch + query.length },
      scrollIntoView: true,
      effects: EditorView.scrollIntoView(targetMatch, { y: 'center' })
    })
  } else {
    currentMatchIndex.value = 0
  }
}

const replace = (query: string, replacement: string) => {
  if (!editorView || !query) return

  const state = editorView.state
  const sel = state.selection.main
  const selectedText = state.doc.sliceString(sel.from, sel.to)

  if (selectedText === query) {
    editorView.dispatch({
      changes: { from: sel.from, to: sel.to, insert: replacement },
      selection: { anchor: sel.from + replacement.length }
    })
  } else {
    search(query)
  }
}

const replaceAll = (query: string, replacement: string) => {
  if (!editorView || !query) return 0

  const state = editorView.state
  const text = state.doc.toString()
  const changes: { from: number; to: number; insert: string }[] = []

  let pos = 0
  while (pos < text.length) {
    const idx = text.indexOf(query, pos)
    if (idx === -1) break
    changes.push({ from: idx, to: idx + query.length, insert: replacement })
    pos = idx + query.length
  }

  const count = changes.length
  if (count > 0) {
    editorView.dispatch({ changes })
    matchCount.value = 0
    currentMatchIndex.value = 0
  }
  return count
}

const setContent = (text: string) => {
  if (editorView) {
    editorView.dispatch({
      changes: { from: 0, to: editorView.state.doc.length, insert: text }
    })
    updateCursorPosition(editorView)
  }
}

const getContent = () => {
  return editorView?.state.doc.toString() || ''
}

onMounted(() => {
  createEditor()
})

defineExpose({
  foldAllBlocks,
  unfoldAllBlocks,
  goToLine,
  search,
  searchPrev,
  replace,
  replaceAll,
  setContent,
  getContent,
  content,
  error,
  isValid,
  cursorLine,
  cursorColumn,
  matchCount,
  currentMatchIndex
})
</script>

<template>
  <div class="editor" ref="editorContainer"></div>
</template>

<style scoped>
.editor {
  flex: 1;
  overflow: hidden;
  background: var(--editor-bg);
}

.editor :deep(.cm-editor) {
  height: 100%;
  background: transparent;
}

.editor :deep(.cm-scroller) {
  overflow: auto;
}
</style>