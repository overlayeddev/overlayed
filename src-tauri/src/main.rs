#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]
#![allow(unused_must_use)]

#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

use tauri::{
  generate_handler, ActivationPolicy, App, CustomMenuItem, Manager, RunEvent, State, SystemTray,
  SystemTrayEvent, SystemTrayMenu, Window,
};

#[cfg(target_os = "macos")]
use window_custom::WindowExt as _;
mod window_custom;

use std::sync::atomic::AtomicBool;

struct Clickthrough(AtomicBool);

const MAIN_WINDOW_NAME: &str = "main";

/// for the emit of the clickthrough event
const TOGGLE_CLICKTHROUGH: &str = "toggle_clickthrough";

/// for the tray events
const TRAY_TOGGLE_CLICKTHROUGH: &str = "toggle_clickthrough";
const TRAY_SHOW_APP: &str = "show_app";
const TRAY_RELOAD: &str = "reload";
const TRAY_OPEN_DEVTOOLS: &str = "open_devtools";
const TRAY_QUIT: &str = "quit";

#[tauri::command]
fn toggle_clickthrough(window: Window, clickthrough: State<'_, Clickthrough>) {
  let clickthrough_value = !clickthrough.0.load(std::sync::atomic::Ordering::Relaxed);

  clickthrough
    .0
    .store(clickthrough_value, std::sync::atomic::Ordering::Relaxed);

  // let the client know
  window
    .emit(TOGGLE_CLICKTHROUGH, clickthrough_value)
    .unwrap();

  #[cfg(target_os = "macos")]
  window.with_webview(move |webview| {
    #[cfg(target_os = "macos")]
    unsafe {
      let _: () = msg_send![webview.ns_window(), setIgnoresMouseEvents: clickthrough_value];
    }
  });
}

#[tauri::command]
fn get_clickthrough(clickthrough: State<'_, Clickthrough>) -> bool {
  clickthrough.0.load(std::sync::atomic::Ordering::Relaxed)
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
        "Toogle Clickthrough",
      ))
      .add_item(CustomMenuItem::new(TRAY_SHOW_APP, "Show Overlayed"))
      .add_item(CustomMenuItem::new(TRAY_RELOAD, "Reload App"))
      .add_item(CustomMenuItem::new(TRAY_OPEN_DEVTOOLS, "Open Devtools"))
      .add_native_item(tauri::SystemTrayMenuItem::Separator)
      .add_item(CustomMenuItem::new(TRAY_QUIT, "Quit")),
  );

  let app = tauri::Builder::default()
    .plugin(tauri_plugin_window_state::Builder::default().build())
    .plugin(tauri_plugin_websocket::init())
    .manage(Clickthrough(AtomicBool::new(false)))
    .setup(|app| {
      let window = app.get_window(MAIN_WINDOW_NAME).unwrap();

      window.set_always_on_top(true);

      // add mac things
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
          let clickthrough = !app
            .state::<Clickthrough>()
            .0
            .load(std::sync::atomic::Ordering::Relaxed);

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
          window.emit(TOGGLE_CLICKTHROUGH, clickthrough).unwrap();
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
        TRAY_OPEN_DEVTOOLS => {
          let window = app.get_window(MAIN_WINDOW_NAME).unwrap();
          window.open_devtools();
        }
        TRAY_QUIT => std::process::exit(0),
        _ => {}
      },
      _ => {}
    })
    .invoke_handler(generate_handler![toggle_clickthrough, get_clickthrough])
    .build(tauri::generate_context!())
    .expect("An error occured while running the app!");

  app.run(|_app_handle, e| match e {
    RunEvent::Ready => {}
    _ => {}
  })
}
