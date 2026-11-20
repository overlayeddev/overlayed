//! Resize cursors on the overlay's edges (Linux).
//!
//! The overlay window is undecorated; tao resizes it from a 5px (times scale)
//! band along its edges and sets a resize cursor for that band on the
//! GtkWindow, but the webview's own cursor covers the whole window, so the
//! cursor never shows. This sets it on the webview instead.

use std::{cell::Cell, sync::atomic::Ordering};

use gtk::prelude::*;
use tauri::{AppHandle, Manager, WebviewWindow};

thread_local! {
  // GTK and its signal handlers live on the main thread
  static RESIZE_CURSOR: Cell<bool> = const { Cell::new(false) };
}

/// The resize cursor for the edges a point is on (as tao names them).
pub fn cursor_name((left, top, right, bottom): (bool, bool, bool, bool)) -> &'static str {
  match (left, top, right, bottom) {
    (true, true, _, _) => "nw-resize",
    (_, true, true, _) => "ne-resize",
    (true, _, _, true) => "sw-resize",
    (_, _, true, true) => "se-resize",
    (true, _, _, _) => "w-resize",
    (_, _, true, _) => "e-resize",
    (_, true, _, _) => "n-resize",
    _ => "s-resize",
  }
}

/// A normal (X11, XWayland, non-layer-shell Wayland) overlay window is
/// undecorated, and tao resizes it from a 5px (times scale) band along its
/// edges, setting a resize cursor for it on the GtkWindow. The webview's own
/// cursor covers the whole window though, so that cursor never shows. Set
/// it on the webview instead, for the same band.
pub fn hook(app: &AppHandle, window: &WebviewWindow) {
  let handle = app.clone();
  let result = window.with_webview(move |webview| {
    let view = webview.inner();
    view.connect_motion_notify_event(move |view, event| {
      let Some(gdk_window) = event.window() else {
        return gtk::glib::Propagation::Proceed;
      };
      let pinned = handle.state::<crate::Pinned>().load(Ordering::Relaxed);
      let edges = view
        .toplevel()
        .and_downcast::<gtk::Window>()
        .filter(|window| {
          !pinned && !window.is_decorated() && window.is_resizable() && !window.is_maximized()
        })
        .and_then(|window| {
          let toplevel = window.window()?;
          // pointer relative to the toplevel, on any backend
          let (_, origin_x, origin_y) = toplevel.origin();
          let (root_x, root_y) = event.root();
          let (x, y) = (root_x - origin_x as f64, root_y - origin_y as f64);
          let border = (window.scale_factor() * 5) as f64;
          let (width, height) = (toplevel.width() as f64, toplevel.height() as f64);
          let edges = (
            x < border,
            y < border,
            x >= width - border,
            y >= height - border,
          );
          (edges.0 || edges.1 || edges.2 || edges.3).then_some(edges)
        });
      match edges {
        Some(edges) => {
          let cursor = gtk::gdk::Cursor::from_name(&gdk_window.display(), cursor_name(edges));
          gdk_window.set_cursor(cursor.as_ref());
          RESIZE_CURSOR.with(|shown| shown.set(true));
          gtk::glib::Propagation::Stop
        }
        None => {
          // hand the cursor back to WebKit
          if RESIZE_CURSOR.with(|shown| shown.replace(false)) {
            gdk_window.set_cursor(None);
          }
          gtk::glib::Propagation::Proceed
        }
      }
    });
  });
  if let Err(error) = result {
    log::warn!("Could not hook the overlay's resize cursors: {error}");
  }
}
