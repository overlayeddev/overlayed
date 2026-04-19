use std::{
  ops::Deref,
  sync::{atomic::AtomicBool, Mutex},
};

use tauri::{image::Image, menu::Menu, AppHandle, Emitter, Manager, State, WebviewWindow, Wry};

use crate::{constants::*, HideTaskbarWhenPinned, Pinned, TrayMenu};

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
pub fn open_overlay_devtools(window: WebviewWindow) {
  let app = window.app_handle();
  if let Some(main_window) = app.get_webview_window(MAIN_WINDOW_NAME) {
    main_window.open_devtools();
  }
}

#[tauri::command]
pub fn simulate_error_screen(window: WebviewWindow) {
  let app = window.app_handle();

  if let Some(main_window) = app.get_webview_window(MAIN_WINDOW_NAME) {
    let _ = main_window.eval("window.location.hash = '#/error';");
    let _ = main_window.show();
    let _ = main_window.set_focus();
  }

  if let Some(settings_window) = app.get_webview_window(SETTINGS_WINDOW_NAME) {
    let _ = settings_window.hide();
  }
}

#[tauri::command]
pub fn toggle_pin(
  window: WebviewWindow,
  pin: State<Pinned>,
  menu: State<TrayMenu>,
  hide_taskbar: State<HideTaskbarWhenPinned>,
) {
  let app = window.app_handle();
  let value = !get_pin(app.state::<Pinned>());

  // Always target the main overlay window so pinning from other windows
  // (e.g., settings) does not affect those windows.
  if let Some(main_win) = app.get_webview_window(MAIN_WINDOW_NAME) {
    _set_pin(value, &main_win, pin, menu, hide_taskbar);
  }
}

#[tauri::command]
pub fn set_pin(
  window: WebviewWindow,
  pin: State<Pinned>,
  menu: State<TrayMenu>,
  hide_taskbar: State<HideTaskbarWhenPinned>,
  value: bool,
) {
  if let Some(main_win) = window.app_handle().get_webview_window(MAIN_WINDOW_NAME) {
    _set_pin(value, &main_win, pin, menu, hide_taskbar);
  }
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

impl Deref for HideTaskbarWhenPinned {
  type Target = AtomicBool;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

fn apply_taskbar_visibility(app: &AppHandle, pinned: bool, hide_taskbar_when_pinned: bool) {
  let skip_taskbar = pinned && hide_taskbar_when_pinned;

  if let Some(main_window) = app.get_webview_window(MAIN_WINDOW_NAME) {
    #[cfg(target_os = "windows")]
    main_window.set_skip_taskbar(skip_taskbar).ok();
  }

  #[cfg(target_os = "macos")]
  {
    use tauri::ActivationPolicy;
    app.set_activation_policy(if skip_taskbar {
      ActivationPolicy::Accessory
    } else {
      ActivationPolicy::Regular
    })
    .ok();
  }
}

fn _set_pin(
  value: bool,
  window: &WebviewWindow,
  pinned: State<Pinned>,
  menu: State<TrayMenu>,
  hide_taskbar: State<HideTaskbarWhenPinned>,
) {
  // @d0nutptr cooked here
  pinned.store(value, std::sync::atomic::Ordering::Relaxed);

  // emit to the main window and also broadcast to all webviews so other
  // windows (like settings) can react to the change.
  window.emit(TRAY_TOGGLE_PIN, value).unwrap();

  // Broadcast the pin change to all webviews so other
  // windows (like settings) can react to the change.
  let app_handle = window.app_handle();
  if let Some(main_win) = app_handle.get_webview_window(MAIN_WINDOW_NAME) {
    let _ = main_win.emit(TRAY_TOGGLE_PIN, value);
  }
  if let Some(settings_win) = app_handle.get_webview_window(SETTINGS_WINDOW_NAME) {
    let _ = settings_win.emit(TRAY_TOGGLE_PIN, value);
  }

  // invert the label for the tray
  if let Some(toggle_pin_menu_item) = menu.lock().ok().and_then(|m| m.get(TRAY_TOGGLE_PIN)) {
    let enable_or_disable = if value { "Unpin" } else { "Pin" };
    toggle_pin_menu_item
      .as_menuitem_unchecked()
      .set_text(enable_or_disable);
  }

  #[cfg(target_os = "macos")]
  window.with_webview(move |webview| unsafe {
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

  window.set_ignore_cursor_events(value);

  apply_taskbar_visibility(
    &window.app_handle(),
    value,
    hide_taskbar.load(std::sync::atomic::Ordering::Relaxed),
  );

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

#[tauri::command]
pub fn set_hide_taskbar_when_pinned(
  window: WebviewWindow,
  hide_taskbar_when_pinned: bool,
  pinned: State<Pinned>,
  hide_taskbar: State<HideTaskbarWhenPinned>,
) {
  hide_taskbar.store(
    hide_taskbar_when_pinned,
    std::sync::atomic::Ordering::Relaxed,
  );

  apply_taskbar_visibility(
    &window.app_handle(),
    pinned.load(std::sync::atomic::Ordering::Relaxed),
    hide_taskbar_when_pinned,
  );
}
