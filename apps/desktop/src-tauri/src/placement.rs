use serde::{Deserialize, Serialize};
use std::sync::{
  atomic::{AtomicBool, Ordering},
  Mutex,
};
#[cfg(any(target_os = "macos", test))]
use tauri::LogicalPosition;
use tauri::{LogicalSize, Manager, Monitor, PhysicalPosition, PhysicalSize, State, WebviewWindow};

use crate::constants::MAIN_WINDOW_NAME;

// Mirrors the main window minimum in tauri.conf.json.
const MANUAL_MIN_SIZE: LogicalSize<f64> = LogicalSize {
  width: 64.0,
  height: 106.0,
};

#[derive(Clone, Copy, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Anchor {
  TopLeft,
  TopCenter,
  TopRight,
  MiddleLeft,
  Center,
  MiddleRight,
  BottomLeft,
  BottomCenter,
  BottomRight,
}

#[derive(Clone)]
struct PlacementRequest {
  monitor: Option<String>,
  anchor: Anchor,
  offset_x: f64,
  offset_y: f64,
  width: f64,
  height: f64,
}

#[derive(Default)]
pub struct PlacementState {
  request: Mutex<Option<PlacementRequest>>,
  active: AtomicBool,
}

impl PlacementState {
  pub fn is_active(&self) -> bool {
    self.active.load(Ordering::Acquire)
  }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MonitorInfo {
  name: String,
  x: i32,
  y: i32,
  width: u32,
  height: u32,
  scale_factor: f64,
  primary: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MonitorsResponse {
  monitors: Vec<MonitorInfo>,
  positioning_supported: bool,
}

fn positioning_supported() -> bool {
  let wayland = std::env::var_os("WAYLAND_DISPLAY").is_some_and(|value| !value.is_empty());
  let x11 =
    std::env::var("GDK_BACKEND").is_ok_and(|value| value.trim().eq_ignore_ascii_case("x11"));
  !cfg!(target_os = "linux") || !wayland || x11
}

fn monitor_name(monitor: &Monitor) -> String {
  monitor.name().cloned().unwrap_or_default()
}

#[tauri::command]
pub fn get_monitors(window: WebviewWindow) -> Result<MonitorsResponse, String> {
  let primary = window
    .primary_monitor()
    .map_err(|error| error.to_string())?;
  let monitors = window
    .available_monitors()
    .map_err(|error| error.to_string())?
    .into_iter()
    .map(|monitor| MonitorInfo {
      name: monitor_name(&monitor),
      x: monitor.position().x,
      y: monitor.position().y,
      width: monitor.size().width,
      height: monitor.size().height,
      scale_factor: monitor.scale_factor(),
      primary: primary.as_ref().is_some_and(|primary| {
        primary.position() == monitor.position() && primary.size() == monitor.size()
      }),
    })
    .collect();

  Ok(MonitorsResponse {
    monitors,
    positioning_supported: positioning_supported(),
  })
}

fn resolve_monitor(window: &WebviewWindow, name: Option<&str>) -> Result<Monitor, String> {
  if let Some(name) = name {
    if let Some(monitor) = window
      .available_monitors()
      .map_err(|error| error.to_string())?
      .into_iter()
      .find(|monitor| monitor_name(monitor) == name)
    {
      return Ok(monitor);
    }
  }

  if let Some(monitor) = window
    .primary_monitor()
    .map_err(|error| error.to_string())?
  {
    return Ok(monitor);
  }

  window
    .current_monitor()
    .map_err(|error| error.to_string())?
    .ok_or_else(|| "No monitor is available for placement".to_string())
}

fn axis_position(start: i32, length: u32, size: u32, offset: f64, anchor: u8) -> i32 {
  let available = f64::from(length.saturating_sub(size));
  let relative = match anchor {
    0 => offset,
    1 => available / 2.0,
    _ => available - offset,
  };
  (f64::from(start) + relative.clamp(0.0, available)).round() as i32
}

fn geometry(
  request: &PlacementRequest,
  position: PhysicalPosition<i32>,
  bounds: PhysicalSize<u32>,
  scale: f64,
) -> Result<(PhysicalPosition<i32>, PhysicalSize<u32>), String> {
  if !request.width.is_finite()
    || !request.height.is_finite()
    || request.width <= 0.0
    || request.height <= 0.0
    || !request.offset_x.is_finite()
    || !request.offset_y.is_finite()
    || request.offset_x < 0.0
    || request.offset_y < 0.0
    || !scale.is_finite()
    || scale <= 0.0
    || bounds.width == 0
    || bounds.height == 0
  {
    return Err("Invalid placement dimensions or monitor bounds".to_string());
  }

  let size = PhysicalSize::new(
    (request.width * scale)
      .ceil()
      .clamp(1.0, f64::from(bounds.width)) as u32,
    (request.height * scale)
      .ceil()
      .clamp(1.0, f64::from(bounds.height)) as u32,
  );
  let (horizontal, vertical) = match request.anchor {
    Anchor::TopLeft => (0, 0),
    Anchor::TopCenter => (1, 0),
    Anchor::TopRight => (2, 0),
    Anchor::MiddleLeft => (0, 1),
    Anchor::Center => (1, 1),
    Anchor::MiddleRight => (2, 1),
    Anchor::BottomLeft => (0, 2),
    Anchor::BottomCenter => (1, 2),
    Anchor::BottomRight => (2, 2),
  };

  Ok((
    PhysicalPosition::new(
      axis_position(
        position.x,
        bounds.width,
        size.width,
        request.offset_x * scale,
        horizontal,
      ),
      axis_position(
        position.y,
        bounds.height,
        size.height,
        request.offset_y * scale,
        vertical,
      ),
    ),
    size,
  ))
}

#[cfg(any(not(target_os = "macos"), test))]
fn needs_resize(
  current_size: PhysicalSize<u32>,
  target_size: PhysicalSize<u32>,
  same_monitor: bool,
) -> bool {
  current_size != target_size || !same_monitor
}

#[cfg(any(target_os = "macos", test))]
fn logical_geometry(
  position: PhysicalPosition<i32>,
  size: PhysicalSize<u32>,
  target_scale: f64,
) -> (LogicalPosition<f64>, LogicalSize<f64>) {
  (
    position.to_logical(target_scale),
    size.to_logical(target_scale),
  )
}

fn apply_request(
  window: &WebviewWindow,
  state: &PlacementState,
  request: PlacementRequest,
) -> Result<(), String> {
  if !positioning_supported() {
    return Err("Fixed placement is not supported on Wayland".to_string());
  }

  let monitor = resolve_monitor(window, request.monitor.as_deref())?;
  let (position, size) = geometry(
    &request,
    *monitor.position(),
    *monitor.size(),
    monitor.scale_factor(),
  )?;
  #[cfg(not(target_os = "macos"))]
  let resize = {
    let current_monitor = window
      .current_monitor()
      .map_err(|error| error.to_string())?;
    let same_monitor = current_monitor.as_ref().is_some_and(|current| {
      current.name() == monitor.name()
        && current.position() == monitor.position()
        && current.size() == monitor.size()
        && current.scale_factor() == monitor.scale_factor()
    });
    needs_resize(
      window.inner_size().map_err(|error| error.to_string())?,
      size,
      same_monitor,
    )
  };
  #[cfg(target_os = "macos")]
  let (position, size) = logical_geometry(position, size, monitor.scale_factor());
  *state.request.lock().map_err(|error| error.to_string())? = Some(request);
  let entering = !state.active.swap(true, Ordering::AcqRel);

  let result = (|| -> tauri::Result<()> {
    if entering {
      window.set_resizable(false)?;
      window.set_min_size(None::<LogicalSize<f64>>)?;
    }
    #[cfg(target_os = "macos")]
    {
      // macOS queues logical frame updates; convert with the target monitor's scale.
      window.set_position(position)?;
      window.set_size(size)?;
      window.set_position(position)?;
    }
    #[cfg(not(target_os = "macos"))]
    {
      // Windows/Linux use physical bounds; restore the anchor after resizing.
      window.set_position(position)?;
      if resize {
        window.set_size(size)?;
        window.set_position(position)?;
      }
    }
    Ok(())
  })();

  if let Err(error) = result {
    if let Err(release_error) = release(window, state) {
      log::warn!("Could not release failed placement: {release_error}");
    }
    return Err(error.to_string());
  }
  Ok(())
}

#[tauri::command]
pub fn apply_placement(
  window: WebviewWindow,
  state: State<PlacementState>,
  monitor: Option<String>,
  anchor: Anchor,
  offset_x: f64,
  offset_y: f64,
  width: f64,
  height: f64,
) -> Result<(), String> {
  let window = window
    .app_handle()
    .get_webview_window(MAIN_WINDOW_NAME)
    .ok_or_else(|| "The overlay window is unavailable".to_string())?;
  apply_request(
    &window,
    &state,
    PlacementRequest {
      monitor,
      anchor,
      offset_x,
      offset_y,
      width,
      height,
    },
  )
}

fn release(window: &WebviewWindow, state: &PlacementState) -> Result<(), String> {
  *state.request.lock().map_err(|error| error.to_string())? = None;
  if !state.active.swap(false, Ordering::AcqRel) {
    return Ok(());
  }
  let resizable = window.set_resizable(true);
  let min_size = window.set_min_size(Some(MANUAL_MIN_SIZE));
  resizable.map_err(|error| error.to_string())?;
  min_size.map_err(|error| error.to_string())
}

#[tauri::command]
pub fn release_placement(
  window: WebviewWindow,
  state: State<PlacementState>,
) -> Result<(), String> {
  let window = window
    .app_handle()
    .get_webview_window(MAIN_WINDOW_NAME)
    .ok_or_else(|| "The overlay window is unavailable".to_string())?;
  release(&window, &state)
}

pub fn reapply(window: &WebviewWindow, state: &PlacementState) -> Result<(), String> {
  let request = state
    .request
    .lock()
    .map_err(|error| error.to_string())?
    .clone();
  if let Some(request) = request {
    apply_request(window, state, request)?;
  }
  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;

  fn request(anchor: Anchor) -> PlacementRequest {
    PlacementRequest {
      monitor: None,
      anchor,
      offset_x: 16.0,
      offset_y: 16.0,
      width: 200.0,
      height: 100.0,
    }
  }

  #[test]
  fn all_anchors_use_target_dpi_and_negative_monitor_origin() {
    let anchors = [
      (Anchor::TopLeft, -1888, 32),
      (Anchor::TopCenter, -1160, 32),
      (Anchor::TopRight, -432, 32),
      (Anchor::MiddleLeft, -1888, 440),
      (Anchor::Center, -1160, 440),
      (Anchor::MiddleRight, -432, 440),
      (Anchor::BottomLeft, -1888, 848),
      (Anchor::BottomCenter, -1160, 848),
      (Anchor::BottomRight, -432, 848),
    ];
    for (anchor, x, y) in anchors {
      let (position, size) = geometry(
        &request(anchor),
        PhysicalPosition::new(-1920, 0),
        PhysicalSize::new(1920, 1080),
        2.0,
      )
      .expect("valid geometry");
      assert_eq!(position, PhysicalPosition::new(x, y));
      assert_eq!(size, PhysicalSize::new(400, 200));
    }
  }

  #[test]
  fn oversized_content_and_margins_stay_on_monitor() {
    let mut request = request(Anchor::BottomRight);
    request.width = 5000.0;
    request.height = 5000.0;
    request.offset_x = 5000.0;
    request.offset_y = 5000.0;
    let (position, size) = geometry(
      &request,
      PhysicalPosition::new(1920, -500),
      PhysicalSize::new(1280, 720),
      1.5,
    )
    .expect("clamped geometry");
    assert_eq!(position, PhysicalPosition::new(1920, -500));
    assert_eq!(size, PhysicalSize::new(1280, 720));

    request.width = 201.0;
    request.height = 101.0;
    let (position, size) = geometry(
      &request,
      PhysicalPosition::new(1920, -500),
      PhysicalSize::new(1280, 720),
      1.5,
    )
    .expect("clamped margins");
    assert_eq!(position, PhysicalPosition::new(1920, -500));
    assert_eq!(size, PhysicalSize::new(302, 152));
  }

  #[test]
  fn fractional_dpi_rounds_up_without_losing_the_anchored_corner() {
    let mut request = request(Anchor::BottomRight);
    request.width = 201.0;
    request.height = 101.0;
    let (position, size) = geometry(
      &request,
      PhysicalPosition::new(1920, -500),
      PhysicalSize::new(1280, 720),
      1.25,
    )
    .expect("fractional DPI geometry");
    assert_eq!(position, PhysicalPosition::new(2928, 73));
    assert_eq!(size, PhysicalSize::new(252, 127));
    assert_eq!(position.x + size.width as i32, 3180);
    assert_eq!(position.y + size.height as i32, 200);
  }

  #[test]
  fn invalid_dimensions_are_rejected() {
    for width in [0.0, -1.0, f64::NAN, f64::INFINITY] {
      let mut request = request(Anchor::Center);
      request.width = width;
      assert!(geometry(
        &request,
        PhysicalPosition::new(0, 0),
        PhysicalSize::new(1920, 1080),
        1.0
      )
      .is_err());
    }
  }

  #[test]
  fn position_only_requires_matching_size_and_monitor() {
    let size = PhysicalSize::new(252, 127);
    assert!(!needs_resize(size, size, true));
    assert!(needs_resize(size, size, false));
    assert!(needs_resize(size, PhysicalSize::new(253, 127), true));
    assert!(needs_resize(size, PhysicalSize::new(252, 128), true));
  }

  #[test]
  fn macos_logical_geometry_uses_the_target_monitor_scale() {
    let mut request = request(Anchor::BottomRight);
    request.width = 201.0;
    request.height = 101.0;
    for target_scale in [1.0, 2.0] {
      let (position, size) = geometry(
        &request,
        LogicalPosition::new(-1440.0, 200.0).to_physical(target_scale),
        LogicalSize::new(1440.0, 900.0).to_physical(target_scale),
        target_scale,
      )
      .expect("target monitor geometry");
      let (position, size) = logical_geometry(position, size, target_scale);
      assert_eq!(position, LogicalPosition::new(-217.0, 983.0));
      assert_eq!(size, LogicalSize::new(201.0, 101.0));
    }
  }
}
