#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]
#![allow(unused_must_use)]

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

use tauri::{
  generate_handler, CustomMenuItem, Manager, RunEvent, State, SystemTray, SystemTrayEvent,
  SystemTrayMenu, Window,
};
use window_custom::WindowExt as _;
mod window_custom;

use std::sync::atomic::AtomicBool;

struct Clickthrough(AtomicBool);

#[tauri::command]
fn toggle_clickthrough(window: Window, clickthrough: State<'_, Clickthrough>) {
  let clickthrough_value = !clickthrough.0.load(std::sync::atomic::Ordering::Relaxed);

  clickthrough
    .0
    .store(clickthrough_value, std::sync::atomic::Ordering::Relaxed);

  // let the client know
  window
    .emit("toggle_clickthrough", clickthrough_value)
    .unwrap();

  #[cfg(target_os = "macos")]
  window.with_webview(move |webview| {
    #[cfg(target_os = "macos")]
    unsafe {
      let _: () = msg_send![webview.ns_window(), setIgnoresMouseEvents: clickthrough_value];
    }
  });
}

fn main() {
  // System tray configuration
  let tray = SystemTray::new().with_menu(
    SystemTrayMenu::new()
      .add_item(CustomMenuItem::new(
        "toggle_clickthrough",
        "Toogle Clickthrough",
      ))
      .add_item(CustomMenuItem::new("show_app", "Show Overlayed"))
      // add seperator
      .add_native_item(tauri::SystemTrayMenuItem::Separator)
      .add_item(CustomMenuItem::new("quit", "Quit")),
  );

  let app = tauri::Builder::default()
    .plugin(tauri_plugin_websocket::init())
    .manage(Clickthrough(AtomicBool::new(false)))
    .setup(|app| {
      let window = app.get_window("main").unwrap();

      #[cfg(target_os = "macos")]
      window.set_transparent_titlebar(true, true);

      // Open dev tools only when in dev mode
      #[cfg(debug_assertions)]
      window.open_devtools();
      Ok(())
    })
    // Add the system tray
    .system_tray(tray)
    // Handle system tray events
    .on_system_tray_event(|app, event| match event {
      SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
        "toggle_clickthrough" => {
          let window = app.get_window("main").unwrap();
          let clickthrough = !app
            .state::<Clickthrough>()
            .0
            .load(std::sync::atomic::Ordering::Relaxed);

          println!("Setting clickthrough to {}", clickthrough);
          app
            .state::<Clickthrough>()
            .0
            .store(clickthrough, std::sync::atomic::Ordering::Relaxed);

          #[cfg(target_os = "macos")]
          window.with_webview(move |webview| {
            #[cfg(target_os = "macos")]
            unsafe {
              let _: () = msg_send![webview.ns_window(), setIgnoresMouseEvents: clickthrough];
            }
          });
          // we might want to knokw on the client
          window.emit("toggle_clickthrough", clickthrough).unwrap();
        }
        "quit" => std::process::exit(0),
        "show_app" => {
          let window = app.get_window("main").unwrap();
          window.show().unwrap();
          window.set_focus().unwrap();
        }
        _ => {}
      },
      _ => {}
    })
    .invoke_handler(generate_handler![toggle_clickthrough])
    .build(tauri::generate_context!())
    .expect("An error occured while running the app!");

  app.run(|_app_handle, e| match e {
    RunEvent::Ready => {}
    _ => {}
  })
}
