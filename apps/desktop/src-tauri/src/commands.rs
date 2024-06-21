use tauri::{Manager, State, SystemTrayHandle, Window};

use crate::{constants::*, Clickthrough};

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
pub fn get_clickthrough(storage: State<Clickthrough>) -> bool {
  storage.0.load(std::sync::atomic::Ordering::Relaxed)
}

#[tauri::command]
pub fn open_devtools(window: Window) {
  window.open_devtools();
}

#[tauri::command]
pub fn toggle_clickthrough(window: Window, clickthrough: State<Clickthrough>) {
  let app = window.app_handle();
  let value = !get_clickthrough(app.state::<Clickthrough>());

  _set_clickthrough(value, &window, clickthrough);
}

#[tauri::command]
pub fn set_clickthrough(window: Window, clickthrough: State<Clickthrough>, value: bool) {
  _set_clickthrough(value, &window, clickthrough);
}

fn _set_clickthrough(value: bool, window: &Window, clickthrough: State<Clickthrough>) {
  clickthrough
    .0
    .store(value, std::sync::atomic::Ordering::Relaxed);

  // let the client know
  window.emit(TRAY_TOGGLE_CLICKTHROUGH, value).unwrap();

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

  // update the tray icon
  update_tray_icon(
    window.app_handle().tray_handle(),
    value,
  );
}

fn update_tray_icon(tray: SystemTrayHandle, clickthrough: bool) {
  let icon;
  if clickthrough {
    icon = tauri::Icon::Raw(include_bytes!("../icons/tray/icon-pinned.png").to_vec());
  } else {
    icon = tauri::Icon::Raw(include_bytes!("../icons/tray/icon.png").to_vec());
  }

  tray.set_icon(icon);

}
