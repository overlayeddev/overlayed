// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// #[cfg(target_os = "macos")]
// #[macro_use]
// extern crate objc;
//
// use tauri::Manager;

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_websocket::init())
    .setup(|_app| {
      // NOTE: this can let us do click through on macOS
      // let main_window = app.get_window("main").unwrap();
      // main_window.with_webview(|webview| {
      //   #[cfg(target_os = "macos")]
      //   unsafe {
      //     let () = msg_send![webview.ns_window(), setIgnoresMouseEvents: true];
      //   }
      // });
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
