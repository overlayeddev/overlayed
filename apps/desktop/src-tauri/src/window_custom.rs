#[cfg(target_os = "macos")]
pub mod macos {
  use cocoa::appkit::{NSWindow, NSWindowCollectionBehavior};
  use tauri::{Runtime, Window};
  use tauri_nspanel::WindowExt;

  pub trait WindowExtMacos {
    fn remove_shadow(&self);

    fn set_float_panel(&self, level: i32);
  }

  impl<R: Runtime> WindowExtMacos for Window<R> {
    fn remove_shadow(&self) {
      unsafe {
        let id = self.ns_window().unwrap() as cocoa::base::id;

        #[cfg(target_arch = "aarch64")]
        id.setHasShadow_(false);

        #[cfg(target_arch = "x86_64")]
        id.setHasShadow_(0);
      }
    }

    fn set_float_panel(&self, level: i32) {
      let panel = self.to_panel().unwrap();

      panel.set_level(level);

      #[allow(non_upper_case_globals)]
      const NSWindowStyleMaskNonActivatingPanel: i32 = 1 << 7;

      #[allow(non_upper_case_globals)]
      const NSResizableWindowMask: i32 = 1 << 3;

      panel.set_style_mask(NSWindowStyleMaskNonActivatingPanel + NSResizableWindowMask);

      panel.set_collection_behaviour(
        NSWindowCollectionBehavior::NSWindowCollectionBehaviorCanJoinAllSpaces
          | NSWindowCollectionBehavior::NSWindowCollectionBehaviorFullScreenAuxiliary,
      );
    }
  }
}

use tauri::{Manager, Runtime, Window};

use crate::{get_pin, Pinned};

pub trait WindowExt {
  fn set_document_title(&self, url: &str);

  fn set_inactive_on_mouse_hover(&self);
}

impl<R: Runtime> WindowExt for Window<R> {
  fn set_document_title(&self, title: &str) {
    let str = format!("document.title = '{:}'", title);
    self.eval(&str).unwrap();
  }

  fn set_inactive_on_mouse_hover(&self) {
    let window = self.clone();

    self.listen_global("mouse-move", move |event| {
      let is_pinned = get_pin(window.state::<Pinned>());

      if !is_pinned {
        return;
      }

      let (x, y): (f64, f64) = serde_json::from_str(event.payload().unwrap()).unwrap();

      let scale_factor = window.scale_factor().unwrap();

      let window_position = window
        .inner_position()
        .unwrap()
        .to_logical::<f64>(scale_factor);

      let window_size = window.inner_size().unwrap().to_logical::<f64>(scale_factor);

      let intersects = {
        let window_x = window_position.x;
        let window_y = window_position.y;
        let window_width = window_size.width;
        let window_height = window_size.height;

        x >= window_x
          && x <= window_x + window_width
          && y >= window_y
          && y <= window_y + window_height
      };

      let is_visible = window.is_visible().unwrap();

      if intersects && is_visible {
        window.hide().unwrap();
      }

      if !intersects && !is_visible {
        window.show().unwrap();
      }
    });
  }
}
