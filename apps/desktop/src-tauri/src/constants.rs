pub const MAIN_WINDOW_NAME: &str = "main";
pub const SETTINGS_WINDOW_NAME: &str = "settings";

/// for the tray events
pub const TRAY_TOGGLE_CLICKTHROUGH: &str = "toggle_clickthrough";
pub const TRAY_SHOW_APP: &str = "show_app";
pub const TRAY_RELOAD: &str = "reload";
pub const TRAY_SETTINGS: &str = "show_settings";
pub const TRAY_OPEN_DEVTOOLS_MAIN: &str = "open_devtools_main";
pub const TRAY_OPEN_DEVTOOLS_SETTINGS: &str = "open_devtools_settings";
pub const TRAY_QUIT: &str = "quit";

/// random events
pub const SHOW_UPDATE_MODAL: &str = "show_update_modal";

#[derive(PartialEq, Copy, Clone, Debug)]
pub enum ThemeType {
  Light,
  Dark,
}
