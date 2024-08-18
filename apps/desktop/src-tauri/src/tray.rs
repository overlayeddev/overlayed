use std::sync::Mutex;

use tauri::{
  menu::{Menu, MenuBuilder, MenuEvent},
  tray::TrayIconBuilder,
  AppHandle, LogicalSize, Manager, Wry,
};

use anyhow::Result;
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

use crate::{
  commands, toggle_pin, Pinned, TrayMenu, MAIN_WINDOW_NAME, OVERLAYED, SETTINGS_WINDOW_NAME,
  TRAY_OPEN_DEVTOOLS_MAIN, TRAY_OPEN_DEVTOOLS_SETTINGS, TRAY_QUIT, TRAY_RELOAD, TRAY_SETTINGS,
  TRAY_SHOW_APP, TRAY_TOGGLE_PIN,
};

pub struct Tray;

impl Tray {
  pub fn create_tray_menu(app_handle: &AppHandle) -> Result<Menu<Wry>, tauri::Error> {
    let version = app_handle.package_info().version.to_string();
    MenuBuilder::new(app_handle)
      .text(TRAY_TOGGLE_PIN, "Pin")
      .text(TRAY_SHOW_APP, "Show Overlayed")
      .text(TRAY_RELOAD, "Reload App")
      .text(TRAY_OPEN_DEVTOOLS_MAIN, "Open Devtools (main window)")
      .text(
        TRAY_OPEN_DEVTOOLS_SETTINGS,
        "Open Devtools (settings window)",
      )
      .text(TRAY_SETTINGS, "Settings")
      .separator()
      .text(OVERLAYED, format!("Overlayed v{version}"))
      .text(TRAY_QUIT, "Quit")
      .build()
  }

  pub fn update_tray(app_handle: &AppHandle) -> Result<()> {
    let menu = Tray::create_tray_menu(app_handle)?;
    let _ = TrayIconBuilder::with_id(OVERLAYED)
      .menu(&menu)
      .on_menu_event(Self::handle_menu_events)
      .build(app_handle)?;
    app_handle.manage(TrayMenu(Mutex::new(menu)));
    commands::update_tray_icon(app_handle, false);
    Ok(())
  }

  pub fn handle_menu_events(app: &AppHandle, event: MenuEvent) {
    match event.id().as_ref() {
      TRAY_TOGGLE_PIN => {
        let window = app.get_webview_window(MAIN_WINDOW_NAME).unwrap();

        toggle_pin(window, app.state::<Pinned>(), app.state::<TrayMenu>())
      }
      TRAY_SHOW_APP => {
        let window = app.get_webview_window(MAIN_WINDOW_NAME).unwrap();
        window.show().unwrap();

        // center and resize the window
        window.center();
        window.set_size(LogicalSize::new(400, 700)).unwrap();

        window.set_focus().unwrap();
      }
      TRAY_RELOAD => {
        let window = app.get_webview_window(MAIN_WINDOW_NAME).unwrap();
        window.eval("window.location.reload();").unwrap();
      }
      TRAY_SETTINGS => {
        // find the settings window and show it
        let settings_window = app.get_webview_window(SETTINGS_WINDOW_NAME).unwrap();
        settings_window.show().unwrap();
        settings_window.set_focus().unwrap();
      }
      TRAY_OPEN_DEVTOOLS_MAIN => {
        let window = app.get_webview_window(MAIN_WINDOW_NAME).unwrap();
        window.open_devtools();
        window.show().unwrap();
      }
      TRAY_OPEN_DEVTOOLS_SETTINGS => {
        let window = app.get_webview_window(SETTINGS_WINDOW_NAME).unwrap();
        window.open_devtools();
        window.show().unwrap();
      }
      TRAY_QUIT => {
        app.save_window_state(StateFlags::all()); // will save the state of all open windows to disk
        std::process::exit(0)
      }
      _ => {}
    }
  }
}
