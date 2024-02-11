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
use tauri::{generate_handler, App, Manager, Window};
use tauri_plugin_window_state::StateFlags;
use tray::{create_tray_items, handle_tray_events};

// TODO: make this configurable
// #[cfg(target_os = "macos")]
// use tauri::{ActivationPolicy};

#[cfg(target_os = "macos")]
use window_custom::WindowExt as _;

pub struct Clickthrough(AtomicBool);

// play with a struct with interior mutability
#[derive(Debug)]
pub struct Storage {
  theme: Mutex<ThemeType>,
}

#[cfg(target_os = "macos")]
fn apply_macos_specifics(_app: &mut App, window: &Window) {
  window.set_visisble_on_all_workspaces(true);
  window.set_transparent_titlebar(true, true);

  // TODO: disabling this makes it hard to tab to settings window?
  // app.set_activation_policy(ActivationPolicy::Accessory);
}

fn main() {
  let mut flags = StateFlags::all();
  // NOTE: we don't care about the visible flag
  flags.remove(StateFlags::VISIBLE);

  let window_state_plugin = tauri_plugin_window_state::Builder::default().with_state_flags(flags);
  let app = tauri::Builder::default()
    // TODO: this should work on windows
    .plugin(window_state_plugin.build())
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
      // TODO: disabling this makes it hard to tab to settings window?
      // make configurable?
      // window.set_skip_taskbar(true);

      // setting this seems to fix windows somehow
      // NOTE: this might be a bug?
      window.set_decorations(false);

      // add mac things
      #[cfg(target_os = "macos")]
      apply_macos_specifics(app, &window);

      // Open dev tools only when in dev mode
      #[cfg(debug_assertions)]
      {
        let settings = app.get_window(SETTINGS_WINDOW_NAME).unwrap();
        window.open_devtools();
        settings.open_devtools();
      }

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
      open_devtools,
      close_settings,
      open_settings
    ])
    .build(tauri::generate_context!())
    .expect("An error occured while running the app!");

  app.run(|app, event| match event {
    tauri::RunEvent::WindowEvent {
      label,
      event: win_event,
      ..
    } => match win_event {
      // NOTE: prevent destroying the window
      tauri::WindowEvent::CloseRequested { api, .. } => {
        let win = app.get_window(label.as_str()).unwrap();
        win.hide().unwrap();
        api.prevent_close();
      }
      _ => {}
    },
    _ => {}
  })
}
