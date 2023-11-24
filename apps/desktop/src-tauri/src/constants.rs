pub const MAIN_WINDOW_NAME: &str = "main";

/// for the tray events
pub const TRAY_TOGGLE_CLICKTHROUGH: &str = "toggle_clickthrough";
pub const TRAY_SHOW_APP: &str = "show_app";
pub const TRAY_RELOAD: &str = "reload";
pub const TRAY_SETTINGS: &str = "show_settings";
pub const TRAY_OPEN_DEVTOOLS: &str = "open_devtools";
pub const TRAY_QUIT: &str = "quit";

#[derive(PartialEq, Copy, Clone, Debug)]
pub enum ThemeType {
  Light,
  Dark,
}
