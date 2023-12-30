#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]
#![allow(unused_must_use)]

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

mod commands;
mod constants;
mod tray;
mod window_custom;

use crate::commands::*;
use constants::*;
use std::sync::{atomic::AtomicBool, Mutex};
use tauri::{generate_handler, Manager, RunEvent};
use tray::{create_tray_items, handle_tray_events};

#[cfg(target_os = "macos")]
use tauri::{ActivationPolicy, App};

#[cfg(target_os = "macos")]
use window_custom::WindowExt as _;

#[cfg(target_os = "macos")]
use tauri::Window;

pub struct Clickthrough(AtomicBool);

// play with a struct with interior mutability
#[derive(Debug)]
struct Storage {
  theme: Mutex<ThemeType>,
}

#[cfg(target_os = "macos")]
fn apply_macos_specifics(app: &mut App, window: &Window) {
  window.set_visisble_on_all_workspaces(true);
  window.set_transparent_titlebar(true, true);
  app.set_activation_policy(ActivationPolicy::Accessory);
}

fn main() {
  let app = tauri::Builder::default()
    // TODO: this should work on windows
    .plugin(tauri_plugin_window_state::Builder::default().build())
    .plugin(tauri_plugin_websocket::init())
    .manage(Clickthrough(AtomicBool::new(false)))
    .manage(Storage {
      theme: Mutex::new(ThemeType::Dark),
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

      let mode = dark_light::detect();
      let mode_string = match mode {
        dark_light::Mode::Dark => "dark",
        dark_light::Mode::Light => "light",
        _ => "dark",
      };

      // sync the theme
      sync_theme(window, app.state::<Storage>(), mode_string.to_string());

      Ok(())
    })
    // Add the system tray
    .system_tray(create_tray_items())
    // Handle system tray events
    .on_system_tray_event(|app, event| handle_tray_events(app, event))
    .invoke_handler(generate_handler![
      toggle_clickthrough,
      get_clickthrough,
      set_clickthrough,
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
