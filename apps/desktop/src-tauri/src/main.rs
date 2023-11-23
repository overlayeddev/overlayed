#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]
#![allow(unused_must_use)]

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

mod constants;
mod commands;

use constants::*;

use tauri::{
  generate_handler, CustomMenuItem, Manager, RunEvent, SystemTray, SystemTrayEvent,
  SystemTrayMenu, Window,
};

#[cfg(target_os = "macos")]
use tauri::{ActivationPolicy, App};

#[cfg(target_os = "macos")]
use window_custom::WindowExt as _;
mod window_custom;

use std::sync::Mutex;

use crate::commands::*;

// play with a struct with interior mutability
#[derive(Debug)]
struct Storage {
  theme: Mutex<ThemeType>,
  clickthrough: Mutex<bool>,
}

#[cfg(target_os = "macos")]
fn apply_macos_specifics(app: &mut App, window: &Window) {
  window.set_transparent_titlebar(true, true);
  app.set_activation_policy(ActivationPolicy::Accessory);
}


fn main() {
  // System tray configuration
  let tray = SystemTray::new().with_menu(
    SystemTrayMenu::new()
      .add_item(CustomMenuItem::new(
        TRAY_TOGGLE_CLICKTHROUGH,
        "Enable Clickthrough",
      ))
      .add_item(CustomMenuItem::new(TRAY_SHOW_APP, "Show Overlayed"))
      .add_item(CustomMenuItem::new(TRAY_RELOAD, "Reload App"))
      .add_item(CustomMenuItem::new(TRAY_OPEN_DEVTOOLS, "Open Devtools"))
      .add_item(CustomMenuItem::new(TRAY_SETTINGS, "Settings"))
      .add_native_item(tauri::SystemTrayMenuItem::Separator)
      .add_item(CustomMenuItem::new(TRAY_QUIT, "Quit")),
  );

  let app = tauri::Builder::default()
    // TODO: this should work on windows
    .plugin(tauri_plugin_window_state::Builder::default().build())
    .plugin(tauri_plugin_websocket::init())
    .manage(Storage {
      theme: Mutex::new(ThemeType::Dark),
      clickthrough: Mutex::new(false),
    })
    .setup(|app| {
      let window = app.get_window(MAIN_WINDOW_NAME).unwrap();

      // the window should always be on top
      window.set_always_on_top(true);

      // skip on windows
      window.set_skip_taskbar(true);

      // setting this seems to fix windows somehow
      // NOTE: this might be a bug?
      window.set_decorations(false);

      // add mac things
      #[cfg(target_os = "macos")]
      apply_macos_specifics(app, &window);

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
        TRAY_TOGGLE_CLICKTHROUGH => {
          let window = app.get_window(MAIN_WINDOW_NAME).unwrap();
          let storage = app.state::<Storage>();

          toggle_clickthrough(window, &storage)
        }
        TRAY_SHOW_APP => {
          let window = app.get_window(MAIN_WINDOW_NAME).unwrap();
          window.show().unwrap();
          window.set_focus().unwrap();
        }
        TRAY_RELOAD => {
          let window = app.get_window(MAIN_WINDOW_NAME).unwrap();
          window.eval("window.location.reload();").unwrap();
        }
        TRAY_SETTINGS => {
          let window = app.get_window(MAIN_WINDOW_NAME).unwrap();
          let storage = app.state::<Storage>();

          set_clickthrough(false, &window, &storage);

          window
            .eval("window.location.href = 'http://localhost:1420/#/settings'")
            .unwrap();
        }
        TRAY_OPEN_DEVTOOLS => {
          let window = app.get_window(MAIN_WINDOW_NAME).unwrap();
          window.open_devtools();
        }
        TRAY_QUIT => std::process::exit(0),
        _ => {}
      },
      _ => {}
    })
    .invoke_handler(generate_handler![
      toggle_clickthrough,
      get_clickthrough,
      sync_theme,
      open_devtools
    ])
    .build(tauri::generate_context!())
    .expect("An error occured while running the app!");

  app.run(|_app_handle, e| match e {
    RunEvent::Ready => {}
    _ => {}
  })
}
