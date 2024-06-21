use tauri::{
  AppHandle, CustomMenuItem, LogicalSize, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu,
};
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

use crate::{commands::toggle_pin, constants::*, Pin};

pub fn create_tray_items() -> SystemTray {
  // System tray configuration
  let tray = SystemTray::new().with_menu(
    SystemTrayMenu::new()
      .add_item(CustomMenuItem::new(
        TRAY_TOGGLE_PIN,
        "Enable Pin",
      ))
      .add_item(CustomMenuItem::new(TRAY_SHOW_APP, "Show Overlayed"))
      .add_item(CustomMenuItem::new(TRAY_RELOAD, "Reload App"))
      .add_item(CustomMenuItem::new(
        TRAY_OPEN_DEVTOOLS_MAIN,
        "Open Devtools (main window)",
      ))
      .add_item(CustomMenuItem::new(
        TRAY_OPEN_DEVTOOLS_SETTINGS,
        "Open Devtools (settings window)",
      ))
      .add_item(CustomMenuItem::new(TRAY_SETTINGS, "Settings"))
      .add_native_item(tauri::SystemTrayMenuItem::Separator)
      .add_item(CustomMenuItem::new(TRAY_QUIT, "Quit")),
  );

  return tray;
}
pub fn handle_tray_events(app: &AppHandle, event: SystemTrayEvent) {
  match event {
    SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
      TRAY_TOGGLE_PIN => {
        let window = app.get_window(MAIN_WINDOW_NAME).unwrap();

        toggle_pin(window, app.state::<Pin>())
      }
      TRAY_SHOW_APP => {
        let window = app.get_window(MAIN_WINDOW_NAME).unwrap();
        window.show().unwrap();

        // center and resize the window
        window.center();
        window.set_size(LogicalSize::new(400, 700)).unwrap();

        window.set_focus().unwrap();
      }
      TRAY_RELOAD => {
        let window = app.get_window(MAIN_WINDOW_NAME).unwrap();
        window.eval("window.location.reload();").unwrap();
      }
      TRAY_SETTINGS => {
        // find the settings window and show it
        let settings_window = app.get_window(SETTINGS_WINDOW_NAME).unwrap();
        settings_window.show().unwrap();
        settings_window.set_focus().unwrap();
      }
      TRAY_OPEN_DEVTOOLS_MAIN => {
        let window = app.get_window(MAIN_WINDOW_NAME).unwrap();
        window.open_devtools();
        window.show().unwrap();
      }
      TRAY_OPEN_DEVTOOLS_SETTINGS => {
        let window = app.get_window(SETTINGS_WINDOW_NAME).unwrap();
        window.open_devtools();
        window.show().unwrap();
      }
      TRAY_QUIT => {
        app.save_window_state(StateFlags::all()); // will save the state of all open windows to disk
        std::process::exit(0)
      }
      _ => {}
    },
    _ => {}
  }
}
