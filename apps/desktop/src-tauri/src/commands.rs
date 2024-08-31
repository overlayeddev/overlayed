use std::{
  ops::Deref,
  sync::{atomic::AtomicBool, Mutex},
};

use log::debug;
use serde_json::json;
use tauri::{Manager, State, SystemTrayHandle, Window};
use tauri_plugin_store::StoreBuilder;

use crate::{constants::*, Pinned, StoreWrapper};

#[tauri::command]
pub fn open_settings(window: WebviewWindow, update: bool) {
  let app = window.app_handle();
  let settings_windows = app.get_webview_window(SETTINGS_WINDOW_NAME);
  if let Some(settings_windows) = settings_windows {
    settings_windows.show();
    settings_windows.set_focus();
    if update {
      // emit to the settings window to show update
      settings_windows
        .emit_to(SETTINGS_WINDOW_NAME, SHOW_UPDATE_MODAL, ())
        .unwrap();
    }
  }

  debug!("Ran open settings command");
}

#[tauri::command]
pub fn close_settings(window: WebviewWindow) {
  let app = window.app_handle();
  let settings_windows = app.get_webview_window(SETTINGS_WINDOW_NAME);
  if let Some(settings_windows) = settings_windows {
    settings_windows.hide();
  }

  debug!("Ran close settings command");
}

#[tauri::command]
pub fn get_pin(storage: State<Pinned>) -> bool {
  let pinned = storage.0.load(std::sync::atomic::Ordering::Relaxed);
  debug!("Ran get_pinned command");

  return pinned;
}

#[tauri::command]
pub fn open_devtools(window: WebviewWindow) {
  window.open_devtools();
  debug!("Ran open_devtools command");
}

#[tauri::command]
pub fn toggle_pin(window: WebviewWindow, pin: State<Pinned>, menu: State<TrayMenu>) {
  let app = window.app_handle();
  let value = !get_pin(app.state::<Pinned>());

  _set_pin(value, &window, pin, menu);
}

#[tauri::command]
pub fn set_pin(window: WebviewWindow, pin: State<Pinned>, menu: State<TrayMenu>, value: bool) {
  _set_pin(value, &window, pin, menu);
}

// @d0nutptr cooked here to make it more concise to access the AtomicBool
impl Deref for Pinned {
  type Target = AtomicBool;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

impl Deref for TrayMenu {
  type Target = Mutex<Menu<Wry>>;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

fn _set_pin(value: bool, window: &WebviewWindow, pinned: State<Pinned>, menu: State<TrayMenu>) {
  // @d0nutptr cooked here
  pinned.store(value, std::sync::atomic::Ordering::Relaxed);

  let app = window.app_handle();

  // let the client know
  window.emit(TRAY_TOGGLE_PIN, value).unwrap();

  // persist to disk
  store.insert("pin".to_string(), json!(value));

  // invert the label for the tray
  if let Some(toggle_pin_menu_item) = menu.lock().ok().and_then(|m| m.get(TRAY_TOGGLE_PIN)) {
    let enable_or_disable = if value { "Unpin" } else { "Pin" };
    toggle_pin_menu_item
      .as_menuitem_unchecked()
      .set_text(enable_or_disable);
  }

  #[cfg(target_os = "macos")]
  window.with_webview(move |webview| {
    #[cfg(target_os = "macos")]
    unsafe {
      let _: () = msg_send![webview.ns_window(), setIgnoresMouseEvents: value];
    }
  });

  window.set_ignore_cursor_events(value);

  // update the tray icon
  update_tray_icon(window.app_handle(), value);
}

pub fn update_tray_icon(app: &AppHandle, pinned: bool) {
  let icon_bytes = if pinned {
    include_bytes!("../icons/tray/icon-pinned.ico").as_slice()
  } else {
    include_bytes!("../icons/tray/icon.ico").as_slice()
  };

  if let Some(tray) = app.tray_by_id(OVERLAYED) {
    if let Ok(icon) = Image::from_bytes(icon_bytes) {
      tray.set_icon(Some(icon));
    }
  }
}
