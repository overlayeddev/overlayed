// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_websocket::init())
    .setup(|app| {
      // TODO: how to fix the shadowing / artfact issue?
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
