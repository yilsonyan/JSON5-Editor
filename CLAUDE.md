# JSON5 Editor 设计文档

## 项目概述

JSON5 Editor 是一个轻量级的跨平台 JSON/JSON5 编辑器，专注于提供现代化的编辑体验和高效的文件操作。

### 核心目标

- **轻量快速**：基于 Tauri 2.0，使用系统 WebView，启动速度快，内存占用低
- **跨平台**：支持 macOS 和 Windows
- **现代化 UI**：采用 VS Code Dark+ 主题风格，界面简洁专业
- **实用功能**：语法高亮、实时校验、折叠展开、搜索替换、格式转换

---

## 技术架构

### 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Tauri 2.0 |
| 前端 | Vue 3 + TypeScript + Vite |
| 编辑器 | CodeMirror 6 |
| 文件系统 | @tauri-apps/plugin-fs |
| 文件对话框 | @tauri-apps/plugin-dialog |
| 单实例管理 | tauri-plugin-single-instance |
| JSON5 解析 | json5 npm 包 |

### 项目结构

```
json5-editor/
├── src/                      # Vue 前端源码
│   ├── components/           # Vue 组件
│   │   ├── Editor.vue        # 代码编辑器
│   │   ├── Toolbar.vue       # 工具栏
│   │   ├── StatusBar.vue     # 状态栏
│   │   ├── SearchPanel.vue   # 搜索面板
│   │   └ Toast.vue          # 提示通知
│   ├── composables/          # Vue 组合式函数
│   │   ├── useFile.ts        # 文件操作逻辑
│   │   ├── useJson5.ts       # JSON5 转换逻辑
│   ├── App.vue               # 主应用组件
│   └ main.ts                 # 入口文件
├── src-tauri/                # Tauri 后端源码
│   ├── src/
│   │   ├── main.rs           # Rust 入口
│   │   └ lib.rs              # 应用逻辑
│   ├── tauri.conf.json       # Tauri 配置
│   ├── capabilities/         # 权限配置
│   │   └ default.json        # 文件系统权限
│   ├── icons/                # 应用图标
│   └ Cargo.toml              # Rust 依赖
│   └ package.json            # npm 配置
```

---

## 功能模块

### 1. 文件操作

| 功能 | 快捷键 | 说明 |
|------|--------|------|
| 打开文件 | ⌘O / Ctrl+O | 支持 .json 和 .json5 文件 |
| 保存文件 | ⌘S / Ctrl+S | 保存到当前文件 |
| 另存为 | ⌘⇧S / Ctrl+Shift+S | 选择新路径保存 |
| 关闭文件 | ⌘W / Ctrl+W | 关闭当前文件 |

**实现细节**：
- 使用 `@tauri-apps/plugin-dialog` 提供原生文件对话框
- 使用 `@tauri-apps/plugin-fs` 读写文件
- 文件路径通过 `useFile.ts` 单例管理，确保状态一致性
- 支持系统右键"打开方式"启动（见下文详细说明）

### 2. 编辑器功能

| 功能 | 说明 |
|------|------|
| 语法高亮 | VS Code Dark+ 风格颜色方案 |
| 行号显示 | 左侧固定宽度行号栏 |
| 代码折叠 | 支持 JSON 对象/数组折叠 |
| 活动行高亮 | 当前编辑行背景高亮 |
| 括号匹配 | 自动高亮匹配的括号 |
| 自动缩进 | 输入时自动调整缩进 |

**折叠功能实现**：
- 使用 CodeMirror 6 的 `foldGutter` 提供折叠按钮
- `foldAll()` / `unfoldAll()` 实现一键折叠/展开
- 折叠图标使用 flexbox 居中对齐（height: 21px）

### 3. 语法校验

| 格式 | 校验方式 |
|------|----------|
| JSON | `JSON.parse()` + 手动定位错误位置 |
| JSON5 | `JSON5.parse()` 解析错误消息 |

**错误定位策略**：
- JSON5：直接解析错误消息中的 `at line:column`
- JSON（WebKit）：手动解析器定位，因浏览器不提供行号信息

### 4. 搜索替换

| 功能 | 快捷键 | 说明 |
|------|--------|------|
| 打开搜索 | ⌘F / Ctrl+F | 显示搜索面板 |
| 下一个匹配 | Enter / ↓ | 跳转到下一个匹配项 |
| 上一个匹配 | Shift+Enter / ↑ | 跳转到上一个匹配项 |
| 关闭搜索 | Esc | 关闭搜索面板 |

**搜索计数显示**：
- 显示 `当前索引/总匹配数`（如 `3/15`）
- 替换全部后显示 Toast 提示替换数量

### 5. 格式转换

| 操作 | 说明 |
|------|------|
| JSON → JSON5 | 添加注释支持、单引号、末尾逗号等特性 |
| JSON5 → JSON | 移除注释、转为标准 JSON 格式 |

---

## 界面设计

### 颜色方案（VS Code Dark+）

| 元素 | 颜色 | Hex |
|------|------|-----|
| 背景 | 深灰黑 | #1e1e1e |
| 工具栏/状态栏 | 深灰 | #252526 |
| Key（键名） | 浅蓝 | #9cdcfe |
| String（字符串） | 橙红 | #ce9178 |
| Number（数字） | 浅绿 | #b5cea8 |
| Boolean（布尔） | 蓝色 | #569cd6 |
| Null | 蓝色 | #569cd6 |
| 注释 | 绿色 | #6a9955 |
| 标点符号 | 浅灰 | #d4d4d4 |
| 行号 | 灰色 | #858585 |
| 选中背景 | 蓝灰 | #264f78 |
| 搜索匹配 | 黄色 | #f7d77d |
| 错误波浪线 | 红色 | #e51400 |

### 组件布局

```
┌─────────────────────────────────────────────┐
│  Toolbar                                    │  ← 工具栏（文件标签、操作按钮）
├─────────────────────────────────────────────┤
│  SearchPanel (条件显示)                     │  ← 搜索面板
├─────────────────────────────────────────────┤
│                                             │
│  Editor                                     │  ← 代码编辑区
│                                             │
├─────────────────────────────────────────────┤
│  StatusBar                                  │  ← 状态栏（校验状态、光标位置）
└─────────────────────────────────────────────┘
```

### 工具栏

- 左侧：文件标签（文件名 + 关闭按钮）
- 右侧：操作按钮组（打开、保存、另存为、折叠、展开、搜索）

### 状态栏

- 左侧：校验状态徽章（Valid/Invalid）、错误行跳转按钮
- 右侧：光标位置（Ln X, Col Y）、编码（UTF-8）、格式切换（JSON/JSON5）

---

## 关键实现细节

### 1. 语言模式切换

使用 CodeMirror 6 的 `Compartment` 实现动态语言切换：

```typescript
const languageCompartment = new Compartment()

// JSON 模式：使用 json() 语言包
// JSON5 模式：使用 javascript() 语言包（支持注释等特性）

const getLanguageExtension = (format: 'json' | 'json5') => {
  if (format === 'json5') {
    return javascript({ jsx: false })
  }
  return json()
}
```

### 2. 单例状态管理

`useFile.ts` 使用单例模式确保文件状态在组件间共享：

```typescript
const currentFile = ref<FileInfo | null>(null)
const isModified = ref(false)

export function useFile() {
  return { currentFile, isModified, openFile, ... }
}
```

### 3. 文件关联配置

`tauri.conf.json` 配置文件关联：

```json
{
  "bundle": {
    "fileAssociations": [
      {
        "ext": ["json", "json5"],
        "name": "JSON5 File",
        "role": "Editor",
        "mimeType": "application/json"
      }
    ]
  }
}
```

### 4. 系统右键"打开方式"文件处理

**重要**：不同操作系统传递文件路径的方式不同，需要分别处理。

#### macOS 处理方式

macOS 通过 Apple Events 传递文件，而不是命令行参数。必须使用 `RunEvent::Opened` 事件：

```rust
// lib.rs
use tauri::RunEvent;

// 在 .run() 回调中处理
.run(|app, event| {
  if let RunEvent::Opened { urls } = event {
    for url in urls {
      if let Ok(path) = url.to_file_path() {
        let path_str = path.to_string_lossy().to_string();
        *PENDING_FILE.lock().unwrap() = Some(path_str.clone());
        let _ = app.emit("file-opened", path_str);
        break;
      }
    }
  }
})
```

**为什么不能用命令行参数**：
- macOS 文件关联启动时，文件路径通过 Apple Events（`kAEOpenDocuments`）传递
- 命令行参数只在首次启动时可能包含文件路径
- 如果应用已在运行，macOS 会触发 `application:openFiles:` delegate 方法，Tauri 将其转换为 `RunEvent::Opened`

#### Windows/Linux 处理方式

Windows 和 Linux 通过命令行参数传递文件：

```rust
// 在 setup 中处理首次启动
.setup(|app| {
  let args: Vec<String> = std::env::args().collect();
  for arg in args.iter().skip(1) {
    if !arg.starts_with("-") {
      *PENDING_FILE.lock().unwrap() = Some(arg.clone());
      break;
    }
  }
  Ok(())
})
```

#### 应用已运行时的处理（单实例）

使用 `tauri-plugin-single-instance` 处理第二次启动：

```rust
.plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
  for arg in &args[1..] {
    if !arg.starts_with("-") && !arg.contains("://") {
      let _ = app.emit("file-opened", arg.clone());
      break;
    }
  }
  if let Some(window) = app.get_webview_window("main") {
    let _ = window.set_focus();
  }
}))
```

#### 前端事件监听

前端监听 `file-opened` 事件并加载文件：

```typescript
// App.vue
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'

const setupFileOpenListener = async () => {
  await listen('file-opened', async (event) => {
    const filePath = event.payload as string
    await handleOpenFromPath(filePath)
  })
}

onMounted(async () => {
  await setupFileOpenListener()
  
  // 检查启动时的待打开文件
  const pendingFile = await invoke<string | null>('get_pending_file')
  if (pendingFile) {
    await handleOpenFromPath(pendingFile)
  }
})
```

**完整流程**：
1. 用户右键文件 → "打开方式" → JSON5 Editor
2. macOS 发送 Apple Event `kAEOpenDocuments`
3. Tauri 将其转换为 `RunEvent::Opened { urls }`
4. Rust 后端提取文件路径，存储到 `PENDING_FILE` 并发出 `file-opened` 事件
5. 前端收到事件，调用 `handleOpenFromPath` 加载文件内容

### 5. 错误位置计算（WebKit 兼容）

WebKit 的 `JSON.parse` 不提供错误行号，使用手动解析器：

```typescript
function findJsonErrorPosition(code: string): number {
  // 手动解析 JSON，遇到错误时返回当前位置
  // 支持：对象、数组、字符串、数字、布尔值、null
}
```

---

## 权限配置

`src-tauri/capabilities/default.json`：

```json
{
  "permissions": [
    "core:default",
    "dialog:default",
    "dialog:allow-open",
    "dialog:allow-save",
    "fs:default",
    "fs:allow-read-text-file",
    "fs:allow-write-text-file",
    "fs:allow-write-file",
    "fs:allow-exists",
    { "identifier": "fs:scope", "allow": [{ "path": "/**" }] }
  ]
}
```

---

## 构建与发布

### 开发模式

```bash
npm run tauri dev
```

### 正式构建

```bash
npm run tauri build
```

生成产物：
- macOS: `.dmg` 和 `.app`
- Windows: `.msi` 和 `.exe`

### 安装后特性

- 右键 JSON/JSON5 文件可选择"用 JSON5 Editor 打开"
- 图标显示"J5"标识

---

## 后续优化方向

1. **性能优化**：代码分割减少包体积
2. **功能扩展**：
   - 多标签页支持
   - 文件对比功能
   - JSON Path 查询
3. **用户体验**：
   - 最近打开文件列表
   - 自动保存/恢复
   - 更多快捷键