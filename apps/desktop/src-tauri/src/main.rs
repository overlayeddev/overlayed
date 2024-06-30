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
use std::sync::atomic::AtomicBool;
use tauri::{generate_handler, Manager, SystemTray};
use tauri_plugin_window_state::StateFlags;
use tray::Tray;
use window_custom::WindowExt;

#[cfg(target_os = "macos")]
use window_custom::window_custom_macos::WindowExtMacos;

#[cfg(target_os = "macos")]
use tauri::Window;

pub struct Pinned(AtomicBool);

#[cfg(target_os = "macos")]
fn apply_macos_specifics(window: &Window) {
  window.set_visisble_on_all_workspaces(true);
  window.set_transparent_titlebar(true, true);
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
    .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
      println!("{}, {argv:?}, {cwd}", app.package_info().name);
    }))
    .manage(Pinned(AtomicBool::new(false)))
    .setup(|app| {
      let window = app.get_window(MAIN_WINDOW_NAME).unwrap();
      let settings = app.get_window(SETTINGS_WINDOW_NAME).unwrap();

      // the window should always be on top
      #[cfg(not(target_os = "macos"))]
      window.set_always_on_top(true);

      // set the document title for the main window
      // TODO: we could just get the tauri window title in js as an alternative?
      window.set_document_title("Overlayed - Main");

      // set the document title for the settings window
      settings.set_document_title("Overlayed - Settings");

      // setting this seems to fix windows somehow
      // NOTE: this might be a bug?
      window.set_decorations(false);

      // add mac things
      #[cfg(target_os = "macos")]
      apply_macos_specifics(&window);

      // Open dev tools only when in dev mode
      #[cfg(debug_assertions)]
      {
        window.open_devtools();
        settings.open_devtools();
      }

      // update the system tray
      Tray::update_tray(&app.app_handle());

      Ok(())
    })
    // Add the system tray
    .system_tray(SystemTray::new())
    // Handle system tray events
    .on_system_tray_event(tray::Tray::handle_tray_events)
    .invoke_handler(generate_handler![
      toggle_pin,
      get_pin,
      set_pin,
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
