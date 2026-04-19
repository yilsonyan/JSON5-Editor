use std::sync::Mutex;
use tauri::{command, Manager, Emitter, Listener, RunEvent};

// Store the file path to be opened
static PENDING_FILE: Mutex<Option<String>> = Mutex::new(None);

#[command]
fn get_pending_file() -> Option<String> {
  PENDING_FILE.lock().unwrap().take()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
      // Handle when second instance is launched (Windows/Linux mainly)
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
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .invoke_handler(tauri::generate_handler![get_pending_file])
    .setup(|app| {
      #[cfg(any(windows, target_os = "linux"))]
      {
        // On Windows/Linux, files are passed as command line args
        let args: Vec<String> = std::env::args().collect();
        for arg in args.iter().skip(1) {
          if !arg.starts_with("-") {
            *PENDING_FILE.lock().unwrap() = Some(arg.clone());
            break;
          }
        }
      }

      #[cfg(target_os = "macos")]
      {
        // Listen for file drop events (drag and drop)
        let handle = app.handle().clone();
        app.listen("tauri://drag-drop", move |event| {
          let payload = event.payload();
          if let Ok(paths) = serde_json::from_str::<Vec<String>>(payload) {
            if let Some(first_path) = paths.first() {
              let _ = handle.emit("file-opened", first_path.clone());
            }
          }
        });

        app.listen("tauri://drag-cancel", |_event| {});
        app.listen("tauri://drag-enter", |_event| {});
        app.listen("tauri://drag-leave", |_event| {});
      }

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .build(tauri::generate_context!())
    .expect("error while running tauri application")
    .run(|app, event| {
      // Handle macOS/iOS/Android file open events
      #[cfg(any(target_os = "macos", target_os = "ios", target_os = "android"))]
      if let RunEvent::Opened { urls } = event {
        for url in urls {
          if let Ok(path) = url.to_file_path() {
            let path_str = path.to_string_lossy().to_string();
            // Store for frontend to retrieve
            *PENDING_FILE.lock().unwrap() = Some(path_str.clone());
            // Emit event to frontend
            let _ = app.emit("file-opened", path_str);
            break; // Only handle first file
          }
        }
      }
    });
}