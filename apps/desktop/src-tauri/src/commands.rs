use std::{ops::Deref, sync::atomic::AtomicBool};

use cocoa::appkit::NSApplicationActivationPolicy;
use tauri::{Manager, State, SystemTrayHandle, Window};

use crate::{constants::*, window_custom::set_activation_policy, Pinned};

#[tauri::command]
pub fn open_settings(window: Window, update: bool) {
  let app = window.app_handle();
  let settings_windows = app.get_window(SETTINGS_WINDOW_NAME);
  if let Some(settings_windows) = settings_windows {
    settings_windows.show();
    settings_windows.set_focus();
    if update {
      // emit to the settings window to show update
      settings_windows.emit(SHOW_UPDATE_MODAL, ()).unwrap();
    }
  }
}

#[tauri::command]
pub fn close_settings(window: Window) {
  let app = window.app_handle();
  let settings_windows = app.get_window(SETTINGS_WINDOW_NAME);
  if let Some(settings_windows) = settings_windows {
    settings_windows.hide();
  }
}

#[tauri::command]
pub fn get_pin(storage: State<Pinned>) -> bool {
  storage.0.load(std::sync::atomic::Ordering::Relaxed)
}

#[tauri::command]
pub fn set_accessory_mode(state: bool) {
  if state {
    set_activation_policy(NSApplicationActivationPolicy::NSApplicationActivationPolicyAccessory);
  } else {
    set_activation_policy(NSApplicationActivationPolicy::NSApplicationActivationPolicyRegular);
  }
}

#[tauri::command]
pub fn open_devtools(window: Window) {
  window.open_devtools();
}

#[tauri::command]
pub fn toggle_pin(window: Window, pin: State<Pinned>) {
  let app = window.app_handle();
  let value = !get_pin(app.state::<Pinned>());

  _set_pin(value, &window, pin);
}

#[tauri::command]
pub fn set_pin(window: Window, pin: State<Pinned>, value: bool) {
  _set_pin(value, &window, pin);
}

impl Deref for Pinned {
  type Target = AtomicBool;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

fn _set_pin(value: bool, window: &Window, pinned: State<Pinned>) {
  // @d0nutptr cooked here
  pinned.store(value, std::sync::atomic::Ordering::Relaxed);

  // let the client know
  window.emit(TRAY_TOGGLE_PIN, value).unwrap();

  // invert the label for the tray
  let tray_handle = window.app_handle().tray_handle();
  let enable_or_disable = if value { "Unpin" } else { "Pin" };
  tray_handle
    .get_item(TRAY_TOGGLE_PIN)
    .set_title(format!("{}", enable_or_disable));

  #[cfg(target_os = "macos")]
  window.with_webview(move |webview| {
    #[cfg(target_os = "macos")]
    unsafe {
      let _: () = msg_send![webview.ns_window(), setIgnoresMouseEvents: value];
    }
  });

  window.set_ignore_cursor_events(value);

  // update the tray icon
  update_tray_icon(window.app_handle().tray_handle(), value);
}

fn update_tray_icon(tray: SystemTrayHandle, pinned: bool) {
  let icon;
  if pinned {
    icon = tauri::Icon::Raw(include_bytes!("../icons/tray/icon-pinned.png").to_vec());
  } else {
    icon = tauri::Icon::Raw(include_bytes!("../icons/tray/icon.png").to_vec());
  }

  tray.set_icon(icon);
}
