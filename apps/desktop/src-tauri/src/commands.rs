use std::{
  ops::Deref,
  sync::{atomic::AtomicBool, Mutex},
};

use serde_json::json;
use tauri::{image::Image, menu::Menu, AppHandle, Emitter, Manager, State, WebviewWindow, Wry};
use tauri_plugin_store::StoreExt;

use crate::{constants::*, Pinned, TrayMenu};

#[tauri::command]
pub fn open_settings(window: WebviewWindow, update: bool) {
  let app = window.app_handle();
  let settings_windows = app.get_webview_window(SETTINGS_WINDOW_NAME);
  if let Some(settings_windows) = settings_windows {
    let _ = settings_windows.show();
    let _ = settings_windows.set_focus();
    if update {
      // emit to the settings window to show update
      settings_windows
        .emit_to(SETTINGS_WINDOW_NAME, SHOW_UPDATE_MODAL, ())
        .unwrap();
    }
  }
}

#[tauri::command]
pub fn close_settings(window: WebviewWindow) {
  let app = window.app_handle();
  let settings_windows = app.get_webview_window(SETTINGS_WINDOW_NAME);
  if let Some(settings_windows) = settings_windows {
    let _ = settings_windows.hide();
  }
}

#[tauri::command]
pub fn get_pin(storage: State<Pinned>) -> bool {
  storage.0.load(std::sync::atomic::Ordering::Relaxed)
}

#[tauri::command]
pub fn open_devtools(window: WebviewWindow) {
  window.open_devtools();
}

#[tauri::command]
pub fn toggle_pin(window: WebviewWindow, pin: State<Pinned>, menu: State<TrayMenu>) {
  let app = window.app_handle();
  let main_window = app.get_webview_window(MAIN_WINDOW_NAME).unwrap();
  let value = !get_pin(app.state::<Pinned>());

  _set_pin(value, &main_window, pin, menu);
}

#[tauri::command]
pub fn set_pin(window: WebviewWindow, pin: State<Pinned>, menu: State<TrayMenu>, value: bool) {
  let app = window.app_handle();
  let main_window = app.get_webview_window(MAIN_WINDOW_NAME).unwrap();

  _set_pin(value, &main_window, pin, menu);
}

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
  let store = app.store(CONFIG_FILE).unwrap();
  store.set("pinned", json!(value));

  // invert the label for the tray
  if let Some(toggle_pin_menu_item) = menu.lock().ok().and_then(|m| m.get(TRAY_TOGGLE_PIN)) {
    let enable_or_disable = if value { "Unpin" } else { "Pin" };
    let _ = toggle_pin_menu_item
      .as_menuitem_unchecked()
      .set_text(enable_or_disable);
  }

  #[cfg(target_os = "macos")]
  let _ = window.with_webview(move |webview| unsafe {
    #[cfg(target_os = "macos")]
    use cocoa::appkit::NSWindow;
    let id = webview.ns_window() as cocoa::base::id;

    #[cfg(target_arch = "aarch64")]
    id.setIgnoresMouseEvents_(value);

    // convert bool into number
    #[cfg(target_arch = "x86_64")]
    {
      let value = if value { 1 } else { 0 };
      id.setHasShadow_(value);
    }
  });

  let _ = window.set_ignore_cursor_events(value);

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
      let _ = tray.set_icon(Some(icon));
    }
  }
}
