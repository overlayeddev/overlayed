use tauri::{Manager, State, SystemTrayHandle, Window};

use crate::{constants::*, Clickthrough, Storage};

#[tauri::command]
pub fn sync_theme(window: Window, storage: State<Storage>, value: String) {
  let mut theme = storage.theme.lock().unwrap();
  match value.as_str() {
    "light" => *theme = ThemeType::Light,
    "dark" => *theme = ThemeType::Dark,
    _ => {}
  };

  // update the tray icon
  let app = window.app_handle();
  let clickthrough = get_clickthrough(app.state::<Clickthrough>());
  let tray_handle = app.tray_handle();
  let theme = *theme;

  update_tray_icon(tray_handle, theme, clickthrough);
}

#[tauri::command]
pub fn open_settings(window: Window, update: bool) {
  let app = window.app_handle();
  let settings_windows = app.get_window(SETTINGS_WINDOW_NAME);
  if let Some(settings_windows) = settings_windows {
    settings_windows.show();
    settings_windows.set_focus();
    if update {
      println!("showing update modal");
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
    *window.app_handle().state::<Storage>().theme.lock().unwrap(),
    value,
  );
}

// BUG: there is a bug if you have an inverted menubar it will be dark and we still load the wrong
// icon
fn update_tray_icon(tray: SystemTrayHandle, theme: ThemeType, clickthrough: bool) {
  let icon = if theme == ThemeType::Dark {
    if clickthrough {
      tauri::Icon::Raw(include_bytes!("../icons/tray-icon-pinned.png").to_vec())
    } else {
      tauri::Icon::Raw(include_bytes!("../icons/tray-icon.png").to_vec())
    }
  } else {
    if clickthrough {
      tauri::Icon::Raw(include_bytes!("../icons/tray-icon-pinned-dark.png").to_vec())
    } else {
      tauri::Icon::Raw(include_bytes!("../icons/tray-icon-dark.png").to_vec())
    }
  };

  tray.set_icon(icon).unwrap();
}
