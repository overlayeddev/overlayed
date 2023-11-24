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

  println!("Theme: {:?}", theme);

  // get the current clickthrough value
  let clickthrough = window.app_handle().state::<Clickthrough>().0.load(std::sync::atomic::Ordering::Relaxed);
  // update the tray icon
  // update_tray_icon(
  //   window.app_handle().tray_handle(),
  //   *window.app_handle().state::<Storage>().theme.lock().unwrap(),
  //   clickthrough,
  // );
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

  set_clickthrough(value, &window, clickthrough);
}

pub fn set_clickthrough(value: bool, window: &Window, clickthrough: State<Clickthrough>) {
  println!("Clickthrough: {}", value);
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
