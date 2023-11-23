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

#[cfg(target_os = "macos")]
use tauri::{ActivationPolicy, App};

#[cfg(target_os = "macos")]
use window_custom::WindowExt as _;
mod window_custom;

use std::sync::atomic::AtomicBool;
use std::sync::{Mutex, MutexGuard};

#[derive(PartialEq)]
#[derive(Debug)]
enum ThemeType {
  Light,
  Dark,
}

// play with a struct with interior mutability
struct Storage {
  theme: Mutex<ThemeType>,
  clickthrough: Mutex<bool>,
}

const MAIN_WINDOW_NAME: &str = "main";

/// for the emit of the clickthrough event
const TOGGLE_CLICKTHROUGH: &str = "toggle_clickthrough";

/// for the tray events
const TRAY_TOGGLE_CLICKTHROUGH: &str = "toggle_clickthrough";
const TRAY_SHOW_APP: &str = "show_app";
const TRAY_RELOAD: &str = "reload";
const TRAY_SETTINGS: &str = "show_settings";
const TRAY_OPEN_DEVTOOLS: &str = "open_devtools";
const TRAY_QUIT: &str = "quit";

#[cfg(target_os = "macos")]
fn apply_macos_specifics(app: &mut App, window: &Window) {
  window.set_transparent_titlebar(true, true);
  app.set_activation_policy(ActivationPolicy::Accessory);
}

#[tauri::command]
fn toggle_clickthrough(window: Window, storage: State<Storage>) {
  let clickthrough = storage.clickthrough.lock().unwrap();
  let clickthrough_value = !*clickthrough;

  set_clickthrough(clickthrough_value, &window, clickthrough);
}

#[tauri::command]
fn sync_theme(storage: State<Storage>, value: String) {
  let mut theme = storage.theme.lock().unwrap();
  match value.as_str() {
    "light" => *theme = ThemeType::Light,
    "dark" => *theme = ThemeType::Dark,
    _ => {}
  };

  println!("Theme: {:?}", theme);
}

#[tauri::command]
fn get_clickthrough(storage: State<Storage>) -> bool {
  let clickthrough = storage.clickthrough.lock().unwrap();
  *clickthrough
}

#[tauri::command]
fn open_devtools(window: Window) {
  window.open_devtools();
}

fn set_clickthrough(value: bool, window: &Window, mut clickthrough: MutexGuard<'_, bool>) {

  *clickthrough = value;

  // let the client know
  window.emit(TOGGLE_CLICKTHROUGH, value).unwrap();

  // invert the label for the tray
  let tray_handle = window.app_handle().tray_handle();
  let enable_or_disable = if value { "Disable" } else { "Enable" };
  tray_handle
    .get_item(TRAY_TOGGLE_CLICKTHROUGH)
    .set_title(format!("{} Clickthrough", enable_or_disable));

  #[cfg(target_os = "macos")]
  window.with_webview(move |webview| {
    #[cfg(target_os = "macos")]
    unsafe {
      let _: () = msg_send![webview.ns_window(), setIgnoresMouseEvents: value];
    }
  });

  window.set_ignore_cursor_events(value);

  // TODO: get system theme so we can switch to the proper icon at runtime

  let app = window.app_handle();
  let icon = if value {
    tauri::Icon::Raw(include_bytes!("../icons/tray-icon-pinned.png").to_vec())
  } else {
    tauri::Icon::Raw(include_bytes!("../icons/tray-icon.png").to_vec())
  };
  app.tray_handle().set_icon(icon).unwrap();
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

          toggle_clickthrough(window, app.state::<Storage>())
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
          let clickthrough = storage.clickthrough.lock().unwrap();

          set_clickthrough(false, &window, clickthrough);

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
