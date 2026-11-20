//! Wayland layer-shell mode for the overlay window (Linux only).
//!
//! On Wayland a normal toplevel can't hide itself from the taskbar, place
//! itself, or read its own position. A wlr-layer-shell surface can do all
//! three: it never shows up in a window list, and its position is just the
//! margins we give it. So when the compositor supports layer-shell the
//! overlay is made a layer surface for its whole life, anchored to the top
//! left corner, and the frontend moves it by changing the margins.
//!
//! The window has to be turned into a layer surface before GTK realizes it,
//! which is why the main window is created from `setup` (`"create": false`
//! in tauri.conf.json), hidden when layer-shell will be used, and shown once
//! it is a layer surface.

#[cfg(target_os = "linux")]
mod imp {
  use std::{
    cell::RefCell,
    collections::VecDeque,
    path::PathBuf,
    sync::{
      atomic::{AtomicBool, Ordering},
      Mutex,
    },
  };

  use gtk::prelude::*;
  use gtk_layer_shell::{Edge, KeyboardMode, Layer, LayerShell};
  use serde::{Deserialize, Serialize};
  use tauri::{AppHandle, Manager, WebviewWindow};

  const NAMESPACE: &str = "overlayed";
  const POSITION_FILE: &str = "layer-position.json";
  const DEFAULT_POSITION: Position = Position { x: 100, y: 100 };

  #[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
  pub struct Position {
    x: i32,
    y: i32,
  }

  #[derive(Default)]
  pub struct LayerState {
    active: AtomicBool,
    position: Mutex<Option<Position>>,
  }

  impl LayerState {
    pub fn is_active(&self) -> bool {
      self.active.load(Ordering::Relaxed)
    }
  }

  fn wayland_session() -> bool {
    let wayland = std::env::var_os("WAYLAND_DISPLAY").is_some_and(|value| !value.is_empty());
    let forced_x11 =
      std::env::var("GDK_BACKEND").is_ok_and(|value| value.trim().eq_ignore_ascii_case("x11"));
    let disabled = std::env::var("OVERLAYED_NO_LAYER_SHELL").is_ok_and(|value| value == "1");
    wayland && !forced_x11 && !disabled
  }

  fn position_path(app: &AppHandle) -> Option<PathBuf> {
    app
      .path()
      .app_config_dir()
      .ok()
      .map(|dir| dir.join(POSITION_FILE))
  }

  fn load_position(app: &AppHandle) -> Position {
    position_path(app)
      .and_then(|path| std::fs::read_to_string(path).ok())
      .and_then(|text| serde_json::from_str(&text).ok())
      .unwrap_or(DEFAULT_POSITION)
  }

  fn save_position(app: &AppHandle, position: Position) {
    let Some(path) = position_path(app) else {
      return;
    };
    if let Some(dir) = path.parent() {
      let _ = std::fs::create_dir_all(dir);
    }
    match serde_json::to_string(&position) {
      Ok(text) => {
        if let Err(error) = std::fs::write(&path, text) {
          log::warn!("Could not save the overlay position: {error}");
        }
      }
      Err(error) => log::warn!("Could not encode the overlay position: {error}"),
    }
  }

  fn apply_margins(window: &gtk::ApplicationWindow, position: Position) {
    window.set_layer_shell_margin(Edge::Left, position.x);
    window.set_layer_shell_margin(Edge::Top, position.y);
  }

  fn apply_size(window: &gtk::ApplicationWindow, width: i32, height: i32) {
    let (width, height) = (width.max(1), height.max(1));
    window.set_size_request(width, height);
    // also shrink the window itself when the request goes down
    window.resize(width, height);
  }

  /// Sizes the overlay in layer mode. Returns false when it isn't a layer
  /// surface, so the caller falls back to `set_size`.
  pub fn set_size(window: &WebviewWindow, size: tauri::Size) -> bool {
    if !window.app_handle().state::<LayerState>().is_active() {
      return false;
    }
    let Ok(gtk_window) = window.gtk_window() else {
      return false;
    };
    let scale = window.scale_factor().unwrap_or(1.0);
    let logical = size.to_logical::<f64>(scale);
    apply_size(
      &gtk_window,
      logical.width.round() as i32,
      logical.height.round() as i32,
    );
    true
  }

  /// Puts the overlay back at the default position (tray "show app").
  pub fn reset_position(app: &AppHandle) {
    let state = app.state::<LayerState>();
    if !state.is_active() {
      return;
    }
    if let Some(window) = app.get_webview_window(crate::constants::MAIN_WINDOW_NAME) {
      if let Ok(gtk_window) = window.gtk_window() {
        *state.position.lock().unwrap() = Some(DEFAULT_POSITION);
        apply_margins(&gtk_window, DEFAULT_POSITION);
        save_position(app, DEFAULT_POSITION);
      }
    }
  }

  // ---- dragging -------------------------------------------------------
  //
  // A layer surface can't use the compositor's interactive move, so we move
  // it by changing its margins while the pointer button is held. Pointer
  // events are surface-local, and each one was measured against wherever the
  // surface was when the compositor sent it -- which lags behind the margins
  // we've just set. Taking every event as relative to the newest margin counts
  // each move twice and the overlay flies off under fast motion.
  //
  // So every margin we set is stamped with the time GTK committed it (the
  // frame clock's after-paint, which runs after GDK's wl_surface.commit), in
  // the compositor's millisecond clock (CLOCK_MONOTONIC, same as the event
  // times). An event at time t was measured against the newest margin
  // committed before t.

  const HISTORY_LIMIT: usize = 64;

  #[derive(Default)]
  struct Drag {
    active: bool,
    /// surface-local point the pointer grabbed, from the first motion event
    grab: Option<(f64, f64)>,
    /// margin in effect before any entry still in `history`
    base: Position,
    /// margins set during this drag; commit time once committed
    history: VecDeque<(Option<u32>, Position)>,
    /// newest margin we asked for
    requested: Position,
    /// set when this is a resize from an edge rather than a move
    resize: Option<Resize>,
  }

  #[derive(Clone, Copy)]
  struct Resize {
    left: bool,
    top: bool,
    right: bool,
    bottom: bool,
    /// pointer position in output coordinates when the resize started
    start: (f64, f64),
    /// surface margin and size when the resize started
    start_position: Position,
    start_size: (i32, i32),
  }

  /// how close to the overlay's edge a press resizes instead of clicking
  const RESIZE_BORDER: f64 = 6.0;
  /// tauri.conf.json minWidth / minHeight
  const MIN_SIZE: (i32, i32) = (64, 106);

  fn edges_at(window: &gtk::ApplicationWindow, x: f64, y: f64) -> Option<(bool, bool, bool, bool)> {
    if !window.is_resizable() {
      return None;
    }
    let (width, height) = window.size();
    let left = x < RESIZE_BORDER;
    let top = y < RESIZE_BORDER;
    let right = x >= width as f64 - RESIZE_BORDER;
    let bottom = y >= height as f64 - RESIZE_BORDER;
    (left || top || right || bottom).then_some((left, top, right, bottom))
  }

  thread_local! {
    // GTK and its signal handlers live on the main thread
    static DRAG: RefCell<Drag> = RefCell::new(Drag::default());
    static RESIZE_CURSOR: std::cell::Cell<bool> = const { std::cell::Cell::new(false) };
    static FRAME_HOOKED: std::cell::Cell<bool> = const { std::cell::Cell::new(false) };
  }

  fn now_ms() -> u32 {
    (gtk::glib::monotonic_time() / 1000) as u32
  }

  /// Margin the surface had when the compositor sent an event at `time`.
  fn margin_at(drag: &Drag, time: u32) -> Position {
    drag
      .history
      .iter()
      .rev()
      .find_map(|(committed, position)| match committed {
        Some(at) if time.wrapping_sub(*at) as i32 >= 0 => Some(*position),
        _ => None,
      })
      .unwrap_or(drag.base)
  }

  fn hook_frame_clock(window: &gtk::ApplicationWindow) {
    if FRAME_HOOKED.with(|hooked| hooked.replace(true)) {
      return;
    }
    let Some(clock) = window
      .window()
      .and_then(|gdk_window| gdk_window.frame_clock())
    else {
      FRAME_HOOKED.with(|hooked| hooked.set(false));
      return;
    };
    clock.connect_after_paint(|_| {
      DRAG.with(|drag| {
        let mut drag = drag.borrow_mut();
        if drag.history.iter().any(|(at, _)| at.is_none()) {
          let now = now_ms();
          for entry in drag.history.iter_mut().filter(|(at, _)| at.is_none()) {
            entry.0 = Some(now);
          }
        }
      });
    });
  }

  fn finish_drag(app: &AppHandle) {
    let position = DRAG.with(|drag| {
      let mut drag = drag.borrow_mut();
      if !drag.active {
        return None;
      }
      drag.active = false;
      Some(drag.requested)
    });
    if let Some(position) = position {
      *app.state::<LayerState>().position.lock().unwrap() = Some(position);
      save_position(app, position);
    }
  }

  /// Hovering near an edge shows a resize cursor (tao's own border handling
  /// works in screen coordinates, which a layer surface doesn't have).
  fn on_hover(
    window: &gtk::ApplicationWindow,
    event: &gtk::gdk::EventMotion,
  ) -> gtk::glib::Propagation {
    let Some(gdk_window) = event.window() else {
      return gtk::glib::Propagation::Proceed;
    };
    let (x, y) = event.root();
    match edges_at(window, x, y) {
      Some(edges) => {
        let cursor = gtk::gdk::Cursor::from_name(
          &gdk_window.display(),
          crate::resize_cursor::cursor_name(edges),
        );
        gdk_window.set_cursor(cursor.as_ref());
        RESIZE_CURSOR.with(|shown| shown.set(true));
        gtk::glib::Propagation::Stop
      }
      None => {
        if RESIZE_CURSOR.with(|shown| shown.replace(false)) {
          gdk_window.set_cursor(None);
        }
        gtk::glib::Propagation::Proceed
      }
    }
  }

  fn on_motion(
    app: &AppHandle,
    window: &gtk::ApplicationWindow,
    event: &gtk::gdk::EventMotion,
  ) -> gtk::glib::Propagation {
    if !DRAG.with(|drag| drag.borrow().active) {
      return on_hover(window, event);
    }
    // the button came up somewhere we didn't see it
    if !event.state().contains(gtk::gdk::ModifierType::BUTTON1_MASK) {
      finish_drag(app);
      return gtk::glib::Propagation::Proceed;
    }

    // root coordinates: surface-local, including the webview's offset in
    // the window (a layer surface's own origin is 0,0 to GDK)
    let (x, y) = event.root();
    let update = DRAG.with(|drag| {
      let mut drag = drag.borrow_mut();
      let at = margin_at(&drag, event.time());
      // pointer in output coordinates
      let (px, py) = (at.x as f64 + x, at.y as f64 + y);

      let (target, size) = if let Some(resize) = drag.resize {
        let (dx, dy) = (
          (px - resize.start.0).round() as i32,
          (py - resize.start.1).round() as i32,
        );
        let (mut x, mut y) = (resize.start_position.x, resize.start_position.y);
        let (mut width, mut height) = resize.start_size;
        if resize.right {
          width = (width + dx).max(MIN_SIZE.0);
        }
        if resize.bottom {
          height = (height + dy).max(MIN_SIZE.1);
        }
        if resize.left {
          let dx = dx.min(width - MIN_SIZE.0).max(-x);
          x += dx;
          width -= dx;
        }
        if resize.top {
          let dy = dy.min(height - MIN_SIZE.1).max(-y);
          y += dy;
          height -= dy;
        }
        (Position { x, y }, Some((width, height)))
      } else {
        if drag.grab.is_none() {
          log::debug!(
            "overlay drag: grab {x:.0},{y:.0} at margin {},{}; event clock lag {} ms",
            at.x,
            at.y,
            now_ms().wrapping_sub(event.time()) as i32
          );
        }
        let (grab_x, grab_y) = *drag.grab.get_or_insert((x, y));
        let target = Position {
          x: (px - grab_x).round().max(0.0) as i32,
          y: (py - grab_y).round().max(0.0) as i32,
        };
        (target, None)
      };

      let moved = target != drag.requested;
      if moved {
        drag.requested = target;
        drag.history.push_back((None, target));
        while drag.history.len() > HISTORY_LIMIT {
          if let Some((_, oldest)) = drag.history.pop_front() {
            drag.base = oldest;
          }
        }
      }
      (moved.then_some(target), size)
    });

    if let (_, Some((width, height))) = update {
      if window.size() != (width, height) {
        apply_size(window, width, height);
      }
    }
    if let (Some(target), _) = update {
      apply_margins(window, target);
    }
    gtk::glib::Propagation::Stop
  }

  /// A press near an edge starts a resize (never while pinned: the overlay
  /// ignores the pointer then).
  fn on_press(
    app: &AppHandle,
    window: &gtk::ApplicationWindow,
    event: &gtk::gdk::EventButton,
  ) -> gtk::glib::Propagation {
    if event.button() != 1 || event.event_type() != gtk::gdk::EventType::ButtonPress {
      return gtk::glib::Propagation::Proceed;
    }
    let (x, y) = event.root();
    let Some((left, top, right, bottom)) = edges_at(window, x, y) else {
      return gtk::glib::Propagation::Proceed;
    };
    let state = app.state::<LayerState>();
    let position = state.position.lock().unwrap().unwrap_or(DEFAULT_POSITION);
    let resize = Resize {
      left,
      top,
      right,
      bottom,
      start: (position.x as f64 + x, position.y as f64 + y),
      start_position: position,
      start_size: window.size(),
    };
    DRAG.with(|drag| {
      *drag.borrow_mut() = Drag {
        active: true,
        grab: None,
        base: position,
        history: VecDeque::new(),
        requested: position,
        resize: Some(resize),
      };
    });
    gtk::glib::Propagation::Stop
  }

  fn hook_drag(window: &WebviewWindow) {
    let tauri_window = window.clone();
    let result = window.with_webview(move |webview| {
      let app = tauri_window.app_handle().clone();
      let Ok(gtk_window) = tauri_window.gtk_window() else {
        return;
      };
      let view = webview.inner();

      let (motion_app, motion_window) = (app.clone(), gtk_window.clone());
      view
        .connect_motion_notify_event(move |_, event| on_motion(&motion_app, &motion_window, event));

      let (press_app, press_window) = (app.clone(), gtk_window.clone());
      view.connect_button_press_event(move |_, event| on_press(&press_app, &press_window, event));

      view.connect_button_release_event(move |_, event| {
        if event.button() == 1 && DRAG.with(|drag| drag.borrow().active) {
          finish_drag(&app);
          return gtk::glib::Propagation::Stop;
        }
        gtk::glib::Propagation::Proceed
      });

      gtk_window.connect_map_event(|window, _| {
        hook_frame_clock(window);
        gtk::glib::Propagation::Proceed
      });
      if gtk_window.is_mapped() {
        hook_frame_clock(&gtk_window);
      }
    });
    if let Err(error) = result {
      log::warn!("Could not hook overlay dragging: {error}");
    }
  }

  /// Starts a drag; the frontend calls this on mousedown in a drag region.
  pub fn begin_drag(app: &AppHandle) {
    let state = app.state::<LayerState>();
    if !state.is_active() {
      return;
    }
    let position = state.position.lock().unwrap().unwrap_or(DEFAULT_POSITION);
    DRAG.with(|drag| {
      *drag.borrow_mut() = Drag {
        active: true,
        grab: None,
        base: position,
        history: VecDeque::new(),
        requested: position,
        resize: None,
      };
    });
  }

  /// Whether `init` will make the overlay a layer surface (GTK is up by the
  /// time the app's setup runs).
  pub fn will_use_layer_shell() -> bool {
    wayland_session() && gtk_layer_shell::is_supported()
  }

  /// Turns the (still hidden, unrealized) main window into a layer surface
  /// when we're on Wayland and the compositor offers layer-shell. Returns
  /// whether it did; when it didn't, the window stays a normal toplevel.
  pub fn init(app: &AppHandle, window: &WebviewWindow) -> bool {
    if !will_use_layer_shell() {
      return false;
    }

    let Ok(gtk_window) = window.gtk_window() else {
      return false;
    };

    if gtk_window.is_realized() {
      log::warn!("Main window is already realized; can't make it a layer surface");
      return false;
    }

    gtk_window.init_layer_shell();
    gtk_window.set_namespace(NAMESPACE);
    gtk_window.set_layer(Layer::Overlay);
    gtk_window.set_anchor(Edge::Top, true);
    gtk_window.set_anchor(Edge::Left, true);
    gtk_window.set_exclusive_zone(0);
    // unpinned: clicking the overlay can give it keyboard focus (settings
    // shortcuts, devtools); pinned switches this off, see `set_pinned`
    gtk_window.set_keyboard_mode(KeyboardMode::OnDemand);

    let position = load_position(app);
    apply_margins(&gtk_window, position);

    // A layer surface is as big as its content asks for; the window's default
    // size doesn't count. Without this the overlay maps as 0x0.
    let (width, height) = gtk_window.size();
    apply_size(&gtk_window, width, height);

    let state = app.state::<LayerState>();
    *state.position.lock().unwrap() = Some(position);
    state.active.store(true, Ordering::Relaxed);

    hook_drag(window);

    log::info!(
      "Overlay is a layer surface (gtk-layer-shell {}.{}.{}, protocol v{}) at {},{}",
      gtk_layer_shell::major_version(),
      gtk_layer_shell::minor_version(),
      gtk_layer_shell::micro_version(),
      gtk_layer_shell::protocol_version(),
      position.x,
      position.y
    );
    true
  }

  /// Pinned overlays never take the keyboard.
  pub fn set_pinned(window: &WebviewWindow, pinned: bool) {
    if !window.app_handle().state::<LayerState>().is_active() {
      return;
    }
    if let Ok(gtk_window) = window.gtk_window() {
      gtk_window.set_keyboard_mode(if pinned {
        KeyboardMode::None
      } else {
        KeyboardMode::OnDemand
      });
    }
  }

  pub fn layer_shell_active(app: AppHandle) -> bool {
    app.state::<LayerState>().is_active()
  }

  // ---- taskbar stand-in ------------------------------------------------
  //
  // A layer surface never shows in a window list. To still give the
  // unpinned overlay a taskbar (and Alt-Tab) entry, a normal toplevel stands
  // in for it: same application (so the same app id and icon), fully
  // transparent, 1x1 and click-through, so it can't be seen or hit. Its
  // only job is the entry; closing it quits the app. The overlay itself
  // stays the layer surface, realized once, which WebKit's GL drawing needs.

  thread_local! {
    static STAND_IN: RefCell<Option<gtk::Window>> = const { RefCell::new(None) };
  }

  fn create_stand_in(app: &AppHandle, main: &gtk::ApplicationWindow) -> gtk::Window {
    let window = gtk::Window::new(gtk::WindowType::Toplevel);
    if let Some(application) = main.application() {
      window.set_application(Some(&application));
    }
    window.set_title("Overlayed");
    if let Some(icon) = main.icon() {
      window.set_icon(Some(&icon));
    }
    window.set_decorated(false);
    window.set_resizable(false);
    window.set_default_size(1, 1);
    window.set_focus_on_map(false);
    if let Some(visual) = GtkWindowExt::screen(&window).and_then(|screen| screen.rgba_visual()) {
      window.set_visual(Some(&visual));
    }
    window.set_app_paintable(true);
    window.connect_draw(|_, cr| {
      cr.set_operator(gtk::cairo::Operator::Source);
      cr.set_source_rgba(0.0, 0.0, 0.0, 0.0);
      let _ = cr.paint();
      gtk::glib::Propagation::Stop
    });
    window.input_shape_combine_region(Some(&gtk::cairo::Region::create()));

    // closing the entry (taskbar menu, Alt+F4) quits, like closing the overlay
    let handle = app.clone();
    window.connect_delete_event(move |_, _| {
      handle.exit(0);
      gtk::glib::Propagation::Stop
    });
    window
  }

  /// Shows or hides the taskbar entry. Returns false when the overlay isn't a
  /// layer surface, so the caller uses `set_skip_taskbar`.
  pub fn set_taskbar_entry(app: &AppHandle, visible: bool) -> bool {
    if !app.state::<LayerState>().is_active() {
      return false;
    }
    let handle = app.clone();
    let result = app.run_on_main_thread(move || {
      let existing = STAND_IN.with(|stand_in| stand_in.borrow().clone());
      let stand_in = match existing {
        Some(window) => window,
        None => {
          let Some(main) = handle
            .get_webview_window(crate::constants::MAIN_WINDOW_NAME)
            .and_then(|window| window.gtk_window().ok())
          else {
            return;
          };
          let window = create_stand_in(&handle, &main);
          STAND_IN.with(|stand_in| *stand_in.borrow_mut() = Some(window.clone()));
          window
        }
      };
      if visible {
        stand_in.show_all();
      } else {
        stand_in.hide();
      }
      log::debug!(
        "taskbar stand-in {}",
        if visible { "shown" } else { "hidden" }
      );
    });
    if let Err(error) = result {
      log::warn!("Could not update the taskbar entry: {error}");
    }
    true
  }
}

#[cfg(target_os = "linux")]
pub use imp::{
  init, reset_position, set_pinned, set_size, set_taskbar_entry, will_use_layer_shell, LayerState,
};

#[cfg(not(target_os = "linux"))]
#[derive(Default)]
pub struct LayerState;

#[cfg(not(target_os = "linux"))]
pub fn set_size(_window: &tauri::WebviewWindow, _size: tauri::Size) -> bool {
  false
}

#[cfg(not(target_os = "linux"))]
pub fn reset_position(_app: &tauri::AppHandle) {}

#[cfg(not(target_os = "linux"))]
pub fn set_taskbar_entry(_app: &tauri::AppHandle, _visible: bool) -> bool {
  false
}

/// Resizes the overlay from the frontend; in layer mode through a size
/// request, otherwise like `setSize`. Takes physical pixels like `setSize`.
#[tauri::command]
pub fn layer_set_size(window: tauri::WebviewWindow, width: f64, height: f64) -> Result<(), String> {
  let size: tauri::Size = tauri::PhysicalSize::new(width, height).into();
  if set_size(&window, size) {
    return Ok(());
  }
  window.set_size(size).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn layer_shell_active(app: tauri::AppHandle) -> bool {
  #[cfg(target_os = "linux")]
  return imp::layer_shell_active(app);
  #[cfg(not(target_os = "linux"))]
  {
    let _ = app;
    false
  }
}

/// Starts dragging the overlay (layer mode); the drag itself runs in GTK
/// until the button comes up.
#[tauri::command]
pub fn layer_drag_begin(app: tauri::AppHandle) {
  #[cfg(target_os = "linux")]
  {
    let handle = app.clone();
    if let Err(error) = app.run_on_main_thread(move || imp::begin_drag(&handle)) {
      log::warn!("Could not start dragging the overlay: {error}");
    }
  }
  #[cfg(not(target_os = "linux"))]
  let _ = app;
}
