#[cfg(target_os = "macos")]
pub mod macos {
  use cocoa::appkit::{NSWindow, NSWindowCollectionBehavior};
  use tauri::{Runtime, WebviewWindow};
  use tauri_nspanel::WebviewWindowExt;

  pub trait WebviewWindowExtMacos {
    fn remove_shadow(&self);

    fn set_float_panel(&self, level: i32);
  }

  impl<R: Runtime> WebviewWindowExtMacos for WebviewWindow<R> {
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

use tauri::{Runtime, WebviewWindow};

pub trait WebviewWindowExt {
  fn set_document_title(&self, url: &str);
}

impl<R: Runtime> WebviewWindowExt for WebviewWindow<R> {
  fn set_document_title(&self, title: &str) {
    let str = format!("document.title = '{:}'", title);
    self.eval(&str).unwrap();
  }
}
