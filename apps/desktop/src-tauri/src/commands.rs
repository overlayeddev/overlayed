use tauri::{Manager, State, Window};

use crate::{constants::*, Storage};

#[tauri::command]
pub fn sync_theme(storage: State<Storage>, value: String) {
  let mut theme = storage.theme.lock().unwrap();
  match value.as_str() {
    "light" => *theme = ThemeType::Light,
    "dark" => *theme = ThemeType::Dark,
    _ => {}
  };

  println!("Theme: {:?}", theme);

  // update the
}

#[tauri::command]
pub fn get_clickthrough(storage: State<Storage>) -> bool {
  let clickthrough = storage.clickthrough.lock().unwrap();
  *clickthrough
}

#[tauri::command]
pub fn open_devtools(window: Window) {
  window.open_devtools();
}

#[tauri::command]
pub fn toggle_clickthrough(window: Window, storage: State<Storage>) {
  let mut clickthrough = storage.clickthrough.lock().unwrap();
  // NOTE: This will mutate
  *clickthrough = !*clickthrough;

  println!("Clickthrough: {:?}", clickthrough);

  // convert mutex guard to a regular reference
  let clickthrough = *clickthrough;

  let storage = storage.clone();
  set_clickthrough(clickthrough, &window, storage);
}

pub fn set_clickthrough(value: bool, window: &Window, storage: State<Storage>) {
  let theme = storage.theme.lock().unwrap();

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

  let app = window.app_handle();
  let icon = if value {
    tauri::Icon::Raw(include_bytes!("../icons/tray-icon-pinned.png").to_vec())
  } else {
    tauri::Icon::Raw(include_bytes!("../icons/tray-icon.png").to_vec())
  };
  app.tray_handle().set_icon(icon).unwrap();
}
