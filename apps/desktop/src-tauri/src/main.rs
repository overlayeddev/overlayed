#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]
#![allow(unused_must_use)]

#[cfg(target_os = "macos")]
extern crate objc;

mod app_handle;
mod commands;
mod constants;
mod tray;
mod window_custom;

use crate::commands::*;
use constants::*;
use log::{debug, info};
use std::{
  str::FromStr,
  sync::{atomic::AtomicBool, Mutex},
};
use tauri::{generate_handler, menu::Menu, LogicalSize, Manager, Wry};
use tauri_plugin_log::{Target, TargetKind};
use tauri_plugin_window_state::{AppHandleExt, StateFlags};
use tray::Tray;
use window_custom::WebviewWindowExt;

#[cfg(target_os = "macos")]
use app_handle::AppHandleExt;

#[cfg(target_os = "macos")]
use window_custom::macos::WebviewWindowExtMacos;

#[cfg(target_os = "macos")]
use system_notification::WorkspaceListener;

#[cfg(target_os = "macos")]
use tauri::WebviewWindow;

pub struct Pinned(AtomicBool);

pub struct TrayMenu(Mutex<Menu<Wry>>);

#[cfg(target_os = "macos")]
fn apply_macos_specifics(window: &WebviewWindow) {
  use tauri::{AppHandle, Wry};
  use tauri_nspanel::ManagerExt;

  window.remove_shadow();

  window.set_float_panel(constants::OVERLAYED_NORMAL_LEVEL);

  let app_handle = window.app_handle();

  app_handle.listen_workspace(
    "NSWorkspaceDidActivateApplicationNotification",
    |app_handle| {
      let bundle_id = AppHandle::<Wry>::frontmost_application_bundle_id();

      if let Some(bundle_id) = bundle_id {
        let is_league_of_legends = bundle_id == "com.riotgames.LeagueofLegends.GameClient";

        let panel = app_handle.get_webview_panel(MAIN_WINDOW_NAME).unwrap();

        panel.set_level(if is_league_of_legends {
          constants::HIGHER_LEVEL_THAN_LEAGUE
        } else {
          constants::OVERLAYED_NORMAL_LEVEL
        });
      }
    },
  );
}

fn main() {
  let flags = StateFlags::POSITION | StateFlags::SIZE;
  let window_state_plugin = tauri_plugin_window_state::Builder::default().with_state_flags(flags);
  let log_level = std::env::var("LOG_LEVEL").unwrap_or_else(|_| "info".to_string());

  let log_level_filter = log::LevelFilter::from_str(&log_level).unwrap_or(log::LevelFilter::Info);

  let log_plugin_builder = tauri_plugin_log::Builder::new()
    .targets([Target::new(TargetKind::LogDir { file_name: None })])
    .level_for("overlayed", log_level_filter)
    .level_for("reqwest", log_level_filter)
    .level_for("notify", log::LevelFilter::Off)
    .level_for("tokio_tungstenite", log::LevelFilter::Off)
    .level_for("tungstenite", log::LevelFilter::Off)
    .level_for("tao", log::LevelFilter::Off);

  let mut app = tauri::Builder::default()
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(window_state_plugin.build())
    .plugin(tauri_plugin_websocket::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_os::init())
    .plugin(tauri_plugin_http::init())
    .plugin(log_plugin_builder.build())
    .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
      println!("{}, {argv:?}, {cwd}", app.package_info().name);
    }));

  #[cfg(target_os = "macos")]
  {
    app = app.plugin(tauri_nspanel::init());
  }

  app = app
    .manage(Pinned(AtomicBool::new(false)))
    .setup(move |app| {
      debug!("starting app...");
      let window = app.get_webview_window(MAIN_WINDOW_NAME).unwrap();
      let settings = app.get_webview_window(SETTINGS_WINDOW_NAME).unwrap();

      info!("Log level set to: {log_level}");
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
      window.set_shadow(false);

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
      Tray::update_tray(app.app_handle());

      // NOTE: always force settings window to be a certain size
      settings.set_size(LogicalSize {
        width: SETTINGS_WINDOW_WIDTH,
        height: SETTINGS_WINDOW_HEIGHT,
      });

      Ok(())
    })
    .invoke_handler(generate_handler![
      toggle_pin,
      get_pin,
      set_pin,
      open_devtools,
      close_settings,
      open_settings,
    ]);

  app
    .build(tauri::generate_context!())
    .expect("An error occured while running the app!")
    .run(|app, event| {
      if let tauri::RunEvent::WindowEvent {
        event: tauri::WindowEvent::CloseRequested { api, .. },
        label,
        ..
      } = event
      {
        if label == SETTINGS_WINDOW_NAME {
          let win = app.get_webview_window(label.as_str()).unwrap();
          win.hide().unwrap();
        }

        if label == MAIN_WINDOW_NAME {
          app.save_window_state(StateFlags::POSITION | StateFlags::SIZE);
          std::process::exit(0);
        } else {
          api.prevent_close();
        }
      }
    });

  debug!("app started succesfully!");
}
