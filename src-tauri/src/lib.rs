use std::sync::Mutex;
use tauri::{command, Emitter, Listener};

// Store the file path to be opened
static PENDING_FILE: Mutex<Option<String>> = Mutex::new(None);

#[command]
fn get_pending_file() -> Option<String> {
  PENDING_FILE.lock().unwrap().take()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .invoke_handler(tauri::generate_handler![get_pending_file])
    .setup(|app| {
      let app_handle = app.handle().clone();

      // Handle files opened via right-click "Open with" (command line args)
      let args: Vec<String> = std::env::args().collect();
      if args.len() > 1 {
        let file_path = args[1].clone();
        *PENDING_FILE.lock().unwrap() = Some(file_path);
      }

      // Listen for file-drop event (handles file opening on macOS)
      app.listen("tauri://drag-drop", move |event| {
        // Payload is a JSON array of file paths
        let payload = event.payload();
        // Parse the paths
        if let Ok(paths) = serde_json::from_str::<Vec<String>>(payload) {
          if let Some(first_path) = paths.first() {
            app_handle.emit("file-opened", first_path.clone()).ok();
          }
        }
      });

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
