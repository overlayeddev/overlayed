#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

mod window_custom;

use tauri::{
  CustomMenuItem, Manager, RunEvent, SystemTray, SystemTrayEvent,
  SystemTrayMenu,
};
use window_custom::WindowExt as _;

fn main() {
  // System tray configuration
  let tray = SystemTray::new().with_menu(
    SystemTrayMenu::new()
      .add_item(CustomMenuItem::new("show_overlayed", "Show Overlayed"))
      .add_item(CustomMenuItem::new("quit", "Quit"))
  );

  let app = tauri::Builder::default()
    .plugin(tauri_plugin_websocket::init())
    .setup(|app| {
      let window = app.get_window("main").unwrap();
      #[cfg(target_os = "macos")]
      window.set_transparent_titlebar(true, true);
      // Move the window to the center of the screen
      window.center().expect("Cannot move window!");

      // Open dev tools
      #[cfg(debug_assertions)]
      window.open_devtools();
      Ok(())
    })
    // Add the system tray
    .system_tray(tray)
    // Handle system tray events
    .on_system_tray_event(|app, event| match event {
      SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
        "quit" => std::process::exit(0),
        "show_overlayed" => {
          let window = app.get_window("main").unwrap();
          window.show().unwrap();
          window.set_focus().unwrap();
        }
        _ => {}
      },
      _ => {}
    })
    .build(tauri::generate_context!())
    .expect("An error occured while running the app!");

  app.run(|_app_handle, e| match e {
    RunEvent::Ready => {
    }
    _ => {}
  })
}
