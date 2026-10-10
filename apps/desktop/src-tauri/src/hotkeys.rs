use serde::{Deserialize, Serialize};
use std::{
  collections::HashSet,
  sync::{
    atomic::{AtomicBool, AtomicU64, Ordering},
    Mutex,
  },
};
use tauri::{AppHandle, Emitter, Manager, State, WebviewWindow};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

use crate::{commands, constants::*, HideTaskbarWhenPinned, Pinned, TrayMenu};

const HOTKEYS_UPDATE: &str = "hotkeys_update";
pub const HOTKEY_ACTION: &str = "hotkey_action";
pub const SHOW_OVERLAY: &str = "show_overlay";

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum HotkeyCommand {
  Pin,
  ToggleVisibility,
  NextMonitor,
  OpenSettings,
}

#[derive(Clone, Deserialize)]
pub struct Binding {
  key: String,
  command: HotkeyCommand,
}

#[derive(Clone, Serialize)]
pub struct BindingResult {
  key: String,
  command: HotkeyCommand,
  ok: bool,
  error: Option<String>,
}

#[derive(Clone, Serialize)]
pub struct HotkeysStatus {
  bindings: Vec<BindingResult>,
  supported: bool,
  suspended: bool,
}

#[derive(Default)]
struct Registrations {
  bindings: Vec<Binding>,
  results: Vec<BindingResult>,
  registered: Vec<Shortcut>,
}

#[derive(Default)]
pub struct HotkeysState {
  registrations: Mutex<Registrations>,
  suspended: AtomicBool,
  generation: AtomicU64,
}

#[derive(Default)]
pub struct OverlayVisibility {
  hidden: AtomicBool,
}

impl OverlayVisibility {
  pub fn is_hidden(&self) -> bool {
    self.hidden.load(Ordering::Acquire)
  }
}

pub fn supported() -> bool {
  let wayland = std::env::var_os("WAYLAND_DISPLAY").is_some_and(|value| !value.is_empty())
    || std::env::var("XDG_SESSION_TYPE")
      .is_ok_and(|value| value.trim().eq_ignore_ascii_case("wayland"));
  !cfg!(target_os = "linux") || !wayland
}

fn parse_binding(key: &str) -> Result<Shortcut, String> {
  key.parse().map_err(|_| "Invalid shortcut".to_string())
}

fn validate_bindings(bindings: &[Binding]) -> Vec<Result<Shortcut, String>> {
  let mut seen = HashSet::new();
  bindings
    .iter()
    .map(|binding| {
      let shortcut = parse_binding(&binding.key)?;
      if !seen.insert(shortcut.id()) {
        return Err("Already used by another binding".to_string());
      }
      Ok(shortcut)
    })
    .collect()
}

fn registration_error(error: tauri_plugin_global_shortcut::Error) -> String {
  let message = error.to_string();
  if message.starts_with("HotKey already registerd:") {
    "Already in use by another app or reserved by the system".to_string()
  } else if message.starts_with("Unable to register hotkey:") {
    // The macOS backend does not preserve Carbon's error code.
    "Couldn't register shortcut. It may already be in use by another app or reserved by the system"
      .to_string()
  } else {
    format!("Couldn't register shortcut: {message}")
  }
}

fn status(state: &HotkeysState, registrations: &Registrations) -> HotkeysStatus {
  HotkeysStatus {
    bindings: registrations.results.clone(),
    supported: supported(),
    suspended: state.suspended.load(Ordering::Acquire),
  }
}

fn publish(app: &AppHandle, status: &HotkeysStatus) {
  if let Err(error) = app.emit(HOTKEYS_UPDATE, status) {
    log::warn!("Could not publish hotkey registration results: {error}");
  }
}

fn should_dispatch(state: &HotkeysState, event: ShortcutState, generation: u64) -> bool {
  event == ShortcutState::Pressed
    && !state.suspended.load(Ordering::Acquire)
    && state.generation.load(Ordering::Acquire) == generation
}

fn reconcile_registrations(
  state: &HotkeysState,
  registrations: &mut Registrations,
  supported: bool,
  mut unregister: impl FnMut(Shortcut) -> Result<(), String>,
  mut register: impl FnMut(Shortcut, HotkeyCommand, u64) -> Result<(), String>,
) -> HotkeysStatus {
  let generation = state.generation.fetch_add(1, Ordering::AcqRel) + 1;
  let mut unregister_error = None;
  // Retain failed removals so the next update can retry them. Their old handlers
  // are inert because their generation no longer matches.
  registrations.registered.retain(|shortcut| {
    if let Err(error) = unregister(*shortcut) {
      log::warn!("Could not unregister hotkey {shortcut}: {error}");
      unregister_error = Some("Couldn't unregister previous hotkeys. Try again.".to_string());
      true
    } else {
      false
    }
  });

  registrations.results = registrations
    .bindings
    .iter()
    .zip(validate_bindings(&registrations.bindings))
    .map(|(binding, parsed)| {
      let result = if !supported {
        Err("Global hotkeys don't work on Wayland.".to_string())
      } else if let Some(error) = &unregister_error {
        Err(error.clone())
      } else {
        parsed.and_then(|shortcut| {
          if state.suspended.load(Ordering::Acquire) {
            return Ok(());
          }
          register(shortcut, binding.command, generation).map_err(|error| {
            log::warn!("Could not register hotkey {}: {error}", binding.key);
            error
          })?;
          registrations.registered.push(shortcut);
          Ok(())
        })
      };
      BindingResult {
        key: binding.key.clone(),
        command: binding.command,
        ok: result.is_ok(),
        error: result.err(),
      }
    })
    .collect();
  HotkeysStatus {
    supported,
    ..status(state, registrations)
  }
}

fn replace_registrations(
  app: &AppHandle,
  state: &HotkeysState,
  registrations: &mut Registrations,
) -> HotkeysStatus {
  let status = reconcile_registrations(
    state,
    registrations,
    supported(),
    |shortcut| {
      app
        .global_shortcut()
        .unregister(shortcut)
        .map_err(|error| error.to_string())
    },
    |shortcut, command, generation| {
      app
        .global_shortcut()
        .on_shortcut(shortcut, move |app, _, event| {
          let state = app.state::<HotkeysState>();
          if should_dispatch(&state, event.state, generation) {
            run_action(app, command);
          }
        })
        .map_err(registration_error)
    },
  );
  publish(app, &status);
  status
}

#[tauri::command]
pub async fn set_hotkeys(
  window: WebviewWindow,
  state: State<'_, HotkeysState>,
  bindings: Vec<Binding>,
) -> Result<HotkeysStatus, String> {
  if window.label() != MAIN_WINDOW_NAME {
    return Err("Only the overlay window registers hotkeys".to_string());
  }
  let mut registrations = state
    .registrations
    .lock()
    .map_err(|error| error.to_string())?;
  registrations.bindings = bindings;
  Ok(replace_registrations(
    window.app_handle(),
    &state,
    &mut registrations,
  ))
}

#[tauri::command]
pub async fn get_hotkeys(state: State<'_, HotkeysState>) -> Result<HotkeysStatus, String> {
  let registrations = state
    .registrations
    .lock()
    .map_err(|error| error.to_string())?;
  Ok(status(&state, &registrations))
}

#[tauri::command]
pub async fn suspend_hotkeys(
  app: AppHandle,
  state: State<'_, HotkeysState>,
  suspended: bool,
) -> Result<HotkeysStatus, String> {
  let mut registrations = state
    .registrations
    .lock()
    .map_err(|error| error.to_string())?;
  state.suspended.store(suspended, Ordering::Release);
  let status = replace_registrations(&app, &state, &mut registrations);
  if suspended && !registrations.registered.is_empty() {
    return Err("Couldn't suspend previous hotkeys. Try again.".to_string());
  }
  Ok(status)
}

fn run_action(app: &AppHandle, command: HotkeyCommand) {
  let result = match command {
    HotkeyCommand::Pin => toggle_overlay_pin(app),
    HotkeyCommand::OpenSettings => {
      if let Some(settings) = app.get_webview_window(SETTINGS_WINDOW_NAME) {
        for result in [settings.show(), settings.unminimize(), settings.set_focus()] {
          if let Err(error) = result {
            log::warn!("Could not open settings from hotkey: {error}");
          }
        }
        Ok(())
      } else {
        Err("The settings window is unavailable".to_string())
      }
    }
    _ => app
      .emit_to(MAIN_WINDOW_NAME, HOTKEY_ACTION, command)
      .map_err(|error| error.to_string()),
  };
  if let Err(error) = result {
    log::warn!("Could not run hotkey {command:?}: {error}");
  }
}

fn update_pin(app: &AppHandle, value: Option<bool>) -> Result<(), String> {
  let app_handle = app.clone();
  app
    .run_on_main_thread(move || {
      let Some(window) = app_handle.get_webview_window(MAIN_WINDOW_NAME) else {
        log::warn!("Could not change pin: the overlay window is unavailable");
        return;
      };
      let pinned = app_handle.state::<Pinned>();
      let menu = app_handle.state::<TrayMenu>();
      let taskbar = app_handle.state::<HideTaskbarWhenPinned>();
      match value {
        Some(value) => commands::set_pin(window.clone(), pinned, menu, taskbar, value),
        None => commands::toggle_pin(window.clone(), pinned, menu, taskbar),
      }
      // Batch the existing pin path and hidden override on the UI thread, before
      // another mouse event can be dispatched. Do not change the logical pin state.
      if app_handle.state::<OverlayVisibility>().is_hidden() {
        if let Err(error) = window.set_ignore_cursor_events(true) {
          log::warn!("Could not keep the hidden overlay click-through: {error}");
        }
      }
    })
    .map_err(|error| error.to_string())
}

pub fn toggle_overlay_pin(app: &AppHandle) -> Result<(), String> {
  update_pin(app, None)
}

// Keep the existing IPC names/callers, but make every pin entrypoint respect
// temporary visibility without changing commands.rs or persisting a fake pin.
#[tauri::command]
pub fn guarded_toggle_pin(app: AppHandle) -> Result<(), String> {
  toggle_overlay_pin(&app)
}

#[tauri::command]
pub fn guarded_set_pin(app: AppHandle, value: bool) -> Result<(), String> {
  update_pin(&app, Some(value))
}

// Tauri exports command macros at crate root, so guards need distinct Rust
// names. Aliases keep the existing IPC names and all callers unchanged.
pub use __cmd__guarded_set_pin as __cmd__set_pin;
pub use __cmd__guarded_toggle_pin as __cmd__toggle_pin;
pub use guarded_set_pin as set_pin;
pub use guarded_toggle_pin as toggle_pin;

fn ignore_cursor_events(visible: bool, pinned: bool) -> bool {
  !visible || pinned
}

#[tauri::command]
pub async fn set_overlay_visible(app: AppHandle, visible: bool) -> Result<(), String> {
  let (send, receive) = tokio::sync::oneshot::channel();
  let app_handle = app.clone();
  app
    .run_on_main_thread(move || {
      let result = (|| {
        let window = app_handle
          .get_webview_window(MAIN_WINDOW_NAME)
          .ok_or_else(|| "The overlay window is unavailable".to_string())?;
        let pinned = commands::get_pin(app_handle.state::<Pinned>());
        window
          .set_ignore_cursor_events(ignore_cursor_events(visible, pinned))
          .map_err(|error| error.to_string())?;
        app_handle
          .state::<OverlayVisibility>()
          .hidden
          .store(!visible, Ordering::Release);
        Ok(())
      })();
      if let Err(error) = &result {
        log::warn!("Could not change overlay visibility: {error}");
      }
      let _ = send.send(result);
    })
    .map_err(|error| error.to_string())?;
  receive.await.map_err(|error| error.to_string())?
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordedKey {
  code: String,
  ctrl: bool,
  alt: bool,
  shift: bool,
  super_key: bool,
}

fn accelerator(key: &RecordedKey) -> Result<String, String> {
  let function_key = key
    .code
    .strip_prefix('F')
    .and_then(|number| number.parse::<u8>().ok())
    .is_some_and(|number| (1..=24).contains(&number));
  if !(key.ctrl || key.alt || key.shift || key.super_key || function_key) {
    return Err("Use at least one modifier, or an F-key.".to_string());
  }
  let mut parts = Vec::new();
  for (enabled, name) in [
    (key.ctrl, "Ctrl"),
    (key.alt, "Alt"),
    (key.shift, "Shift"),
    (key.super_key, "Super"),
  ] {
    if enabled {
      parts.push(name);
    }
  }
  parts.push(&key.code);
  let value = parts.join("+");
  parse_binding(&value)?;
  Ok(value)
}

#[tauri::command]
pub fn record_hotkey(
  key: RecordedKey,
  bindings: Vec<Binding>,
  command: HotkeyCommand,
) -> Result<String, String> {
  let value = accelerator(&key)?;
  let shortcut = parse_binding(&value)?;
  if bindings.iter().any(|binding| {
    binding.command != command && parse_binding(&binding.key).is_ok_and(|other| other == shortcut)
  }) {
    return Err("Already used by another command.".to_string());
  }
  Ok(value)
}

#[cfg(test)]
mod tests {
  use super::*;
  use tauri_plugin_global_shortcut::{Code, Modifiers};

  fn key(code: &str, ctrl: bool, alt: bool, shift: bool, super_key: bool) -> RecordedKey {
    RecordedKey {
      code: code.to_string(),
      ctrl,
      alt,
      shift,
      super_key,
    }
  }

  #[test]
  fn recorded_codes_produce_accelerators_accepted_by_the_real_parser() {
    for (input, expected, code, modifiers) in [
      (
        key("KeyH", true, false, true, false),
        "Ctrl+Shift+KeyH",
        Code::KeyH,
        Modifiers::CONTROL | Modifiers::SHIFT,
      ),
      (
        key("Digit1", false, true, false, false),
        "Alt+Digit1",
        Code::Digit1,
        Modifiers::ALT,
      ),
      (
        key("F1", false, false, false, false),
        "F1",
        Code::F1,
        Modifiers::empty(),
      ),
      (
        key("F24", false, false, false, false),
        "F24",
        Code::F24,
        Modifiers::empty(),
      ),
      (
        key("Backquote", true, false, false, false),
        "Ctrl+Backquote",
        Code::Backquote,
        Modifiers::CONTROL,
      ),
      (
        key("KeyZ", true, true, true, true),
        "Ctrl+Alt+Shift+Super+KeyZ",
        Code::KeyZ,
        Modifiers::CONTROL | Modifiers::ALT | Modifiers::SHIFT | Modifiers::SUPER,
      ),
    ] {
      let value = accelerator(&input).expect("valid recorded key");
      assert_eq!(value, expected);
      let shortcut = parse_binding(&value).expect("crate parser accepts output");
      assert_eq!(shortcut.key, code);
      assert_eq!(shortcut.mods, modifiers);
    }
  }

  #[test]
  fn unsafe_unmodified_keys_and_unsupported_codes_are_rejected() {
    for input in [
      key("KeyA", false, false, false, false),
      key("Digit1", false, false, false, false),
      key("F25", false, false, false, false),
      key("ControlLeft", true, false, false, false),
      key("IntlBackslash", true, false, false, false),
    ] {
      assert!(accelerator(&input).is_err());
    }
  }

  #[test]
  fn duplicate_detection_uses_parsed_identity_not_spelling() {
    let bindings = vec![
      Binding {
        key: "CommandOrControl+Shift+H".to_string(),
        command: HotkeyCommand::Pin,
      },
      Binding {
        key: "Shift+CommandOrControl+KeyH".to_string(),
        command: HotkeyCommand::NextMonitor,
      },
    ];
    assert!(validate_bindings(&bindings)[0].is_ok());
    assert!(validate_bindings(&bindings)[1].is_err());
    let primary = cfg!(target_os = "macos");
    let recorded = key("KeyH", !primary, false, true, primary);
    assert!(record_hotkey(recorded, bindings.clone(), HotkeyCommand::OpenSettings).is_err());
    assert!(record_hotkey(
      key("KeyH", !primary, false, true, primary),
      vec![bindings[0].clone()],
      HotkeyCommand::Pin
    )
    .is_ok());
    let aliases = vec![
      Binding {
        key: "Ctrl+Shift+H".to_string(),
        command: HotkeyCommand::Pin,
      },
      Binding {
        key: "shift+control+KeyH".to_string(),
        command: HotkeyCommand::OpenSettings,
      },
    ];
    assert!(validate_bindings(&aliases)[1].is_err());
  }

  fn binding(key: &str, command: HotkeyCommand) -> Binding {
    Binding {
      key: key.to_string(),
      command,
    }
  }

  #[test]
  fn replacing_bindings_removes_owned_shortcuts_before_registering_the_new_set() {
    let state = HotkeysState::default();
    let old = parse_binding("Ctrl+Shift+H").expect("old shortcut");
    let new = parse_binding("Alt+F2").expect("new shortcut");
    let mut registrations = Registrations {
      bindings: vec![binding("Alt+F2", HotkeyCommand::NextMonitor)],
      registered: vec![old],
      ..Registrations::default()
    };
    let operations = std::cell::RefCell::new(Vec::new());
    let result = reconcile_registrations(
      &state,
      &mut registrations,
      true,
      |shortcut| {
        operations.borrow_mut().push(("remove", shortcut));
        Ok(())
      },
      |shortcut, command, generation| {
        assert_eq!(command, HotkeyCommand::NextMonitor);
        assert_eq!(generation, 1);
        operations.borrow_mut().push(("add", shortcut));
        Ok(())
      },
    );
    assert_eq!(*operations.borrow(), vec![("remove", old), ("add", new)]);
    assert_eq!(registrations.registered, vec![new]);
    assert!(result.bindings[0].ok);
    assert!(!should_dispatch(&state, ShortcutState::Pressed, 0));
    registrations.bindings.clear();
    let result = reconcile_registrations(
      &state,
      &mut registrations,
      true,
      |shortcut| {
        assert_eq!(shortcut, new);
        Ok(())
      },
      |_, _, _| panic!("clearing must not register anything"),
    );
    assert!(result.bindings.is_empty());
    assert!(registrations.registered.is_empty());
  }

  #[test]
  fn suspension_removes_bindings_and_resumption_restores_them() {
    let state = HotkeysState::default();
    let shortcut = parse_binding("Ctrl+Shift+H").expect("shortcut");
    let mut registrations = Registrations {
      bindings: vec![binding("Ctrl+Shift+H", HotkeyCommand::Pin)],
      registered: vec![shortcut],
      ..Registrations::default()
    };
    state.suspended.store(true, Ordering::Release);
    let suspended = reconcile_registrations(
      &state,
      &mut registrations,
      true,
      |removed| {
        assert_eq!(removed, shortcut);
        Ok(())
      },
      |_, _, _| panic!("suspended bindings must not register"),
    );
    assert!(suspended.suspended);
    assert!(registrations.registered.is_empty());
    assert_eq!(registrations.bindings.len(), 1);
    state.suspended.store(false, Ordering::Release);
    let resumed = reconcile_registrations(
      &state,
      &mut registrations,
      true,
      |_| panic!("nothing remains registered"),
      |added, command, _| {
        assert_eq!(added, shortcut);
        assert_eq!(command, HotkeyCommand::Pin);
        Ok(())
      },
    );
    assert!(!resumed.suspended);
    assert!(resumed.bindings[0].ok);
    assert_eq!(registrations.registered, vec![shortcut]);
  }

  #[test]
  fn invalid_duplicates_and_registration_failures_have_per_binding_results() {
    let state = HotkeysState::default();
    let mut registrations = Registrations {
      bindings: vec![
        binding("Ctrl+Shift+H", HotkeyCommand::Pin),
        binding("Shift+Control+KeyH", HotkeyCommand::NextMonitor),
        binding("not-a-key", HotkeyCommand::OpenSettings),
        binding("Alt+F2", HotkeyCommand::ToggleVisibility),
      ],
      ..Registrations::default()
    };
    let mut attempts = Vec::new();
    let result = reconcile_registrations(
      &state,
      &mut registrations,
      true,
      |_| panic!("no previous registrations"),
      |shortcut, command, _| {
        attempts.push(command);
        if command == HotkeyCommand::ToggleVisibility {
          Err("Already in use by another app".to_string())
        } else {
          assert_eq!(shortcut.key, tauri_plugin_global_shortcut::Code::KeyH);
          Ok(())
        }
      },
    );
    assert_eq!(
      attempts,
      vec![HotkeyCommand::Pin, HotkeyCommand::ToggleVisibility]
    );
    assert_eq!(result.bindings.len(), 4);
    assert!(result.bindings[0].ok);
    assert_eq!(
      result.bindings[1].error.as_deref(),
      Some("Already used by another binding")
    );
    assert_eq!(
      result.bindings[2].error.as_deref(),
      Some("Invalid shortcut")
    );
    assert_eq!(
      result.bindings[3].error.as_deref(),
      Some("Already in use by another app")
    );
    assert_eq!(registrations.registered.len(), 1);
  }

  #[test]
  fn failed_removals_are_inert_retained_and_retried() {
    let state = HotkeysState::default();
    let old = parse_binding("Ctrl+Shift+H").expect("shortcut");
    let mut registrations = Registrations {
      bindings: vec![binding("Alt+F2", HotkeyCommand::Pin)],
      registered: vec![old],
      ..Registrations::default()
    };
    let result = reconcile_registrations(
      &state,
      &mut registrations,
      true,
      |_| Err("native removal failed".to_string()),
      |_, _, _| panic!("don't add shortcuts while old registrations remain"),
    );
    assert!(!result.bindings[0].ok);
    assert_eq!(registrations.registered, vec![old]);
    assert!(!should_dispatch(&state, ShortcutState::Pressed, 0));
    let result = reconcile_registrations(
      &state,
      &mut registrations,
      true,
      |removed| {
        assert_eq!(removed, old);
        Ok(())
      },
      |_, _, generation| {
        assert_eq!(generation, 2);
        Ok(())
      },
    );
    assert!(result.bindings[0].ok);
    assert_eq!(
      registrations.registered,
      vec![parse_binding("Alt+F2").expect("new shortcut")]
    );
  }

  #[test]
  fn wayland_rejects_every_binding_without_entering_the_plugin() {
    let state = HotkeysState::default();
    let mut registrations = Registrations {
      bindings: vec![
        binding("Ctrl+Shift+H", HotkeyCommand::Pin),
        binding("invalid", HotkeyCommand::OpenSettings),
      ],
      ..Registrations::default()
    };
    let result = reconcile_registrations(
      &state,
      &mut registrations,
      false,
      |_| panic!("the plugin is absent on Wayland"),
      |_, _, _| panic!("the plugin is absent on Wayland"),
    );
    assert!(!result.supported);
    assert_eq!(result.bindings.len(), 2);
    assert!(result.bindings.iter().all(|binding| !binding.ok
      && binding.error.as_deref() == Some("Global hotkeys don't work on Wayland.")));
    assert!(registrations.registered.is_empty());
  }

  #[test]
  fn only_current_unsuspended_key_presses_dispatch() {
    let state = HotkeysState::default();
    assert!(should_dispatch(&state, ShortcutState::Pressed, 0));
    assert!(!should_dispatch(&state, ShortcutState::Released, 0));
    state.suspended.store(true, Ordering::Release);
    assert!(!should_dispatch(&state, ShortcutState::Pressed, 0));
    state.suspended.store(false, Ordering::Release);
    state.generation.store(1, Ordering::Release);
    assert!(!should_dispatch(&state, ShortcutState::Pressed, 0));
    assert!(should_dispatch(&state, ShortcutState::Pressed, 1));
  }

  #[test]
  fn hidden_is_click_through_and_visible_restores_the_actual_pin() {
    assert!(ignore_cursor_events(false, false));
    assert!(ignore_cursor_events(false, true));
    assert!(!ignore_cursor_events(true, false));
    assert!(ignore_cursor_events(true, true));
  }
}
