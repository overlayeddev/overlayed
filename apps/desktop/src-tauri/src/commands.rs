use std::{
  ops::Deref,
  sync::{atomic::AtomicBool, Mutex},
};

use tauri::{image::Image, menu::Menu, AppHandle, Emitter, Manager, State, WebviewWindow, Wry};

use crate::{constants::*, Pinned, TrayMenu};

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
}

#[tauri::command]
pub fn close_settings(window: WebviewWindow) {
  let app = window.app_handle();
  let settings_windows = app.get_webview_window(SETTINGS_WINDOW_NAME);
  if let Some(settings_windows) = settings_windows {
    settings_windows.hide();
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
  let value = !get_pin(app.state::<Pinned>());

  _set_pin(value, &window, pin, menu);
}

#[tauri::command]
pub fn set_pin(window: WebviewWindow, pin: State<Pinned>, menu: State<TrayMenu>, value: bool) {
  _set_pin(value, &window, pin, menu);
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

  // let the client know
  window.emit(TRAY_TOGGLE_PIN, value).unwrap();

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
