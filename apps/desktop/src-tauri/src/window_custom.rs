#[cfg(target_os = "macos")]
pub mod macos {
  use cocoa::appkit::{
    NSWindow, NSWindowButton, NSWindowCollectionBehavior, NSWindowStyleMask,
    NSWindowTitleVisibility,
  };
  use objc::{msg_send, runtime::YES};
  use tauri::{Runtime, Window};
  use tauri_nspanel::WindowExt;

  pub trait WindowExtMacos {
    fn set_transparent_titlebar(&self, title_transparent: bool, remove_toolbar: bool);
    fn set_float_panel(&self, level: i32);
  }

  impl<R: Runtime> WindowExtMacos for Window<R> {
    fn set_transparent_titlebar(&self, title_transparent: bool, remove_tool_bar: bool) {
      unsafe {
        let id = self.ns_window().unwrap() as cocoa::base::id;
        NSWindow::setTitlebarAppearsTransparent_(id, cocoa::base::YES);
        let mut style_mask = id.styleMask();
        style_mask.set(
          NSWindowStyleMask::NSFullSizeContentViewWindowMask,
          title_transparent,
        );
        id.setStyleMask_(style_mask);
        if remove_tool_bar {
          let close_button = id.standardWindowButton_(NSWindowButton::NSWindowCloseButton);
          let _: () = msg_send![close_button, setHidden: YES];
          let min_button = id.standardWindowButton_(NSWindowButton::NSWindowMiniaturizeButton);
          let _: () = msg_send![min_button, setHidden: YES];
          let zoom_button = id.standardWindowButton_(NSWindowButton::NSWindowZoomButton);
          let _: () = msg_send![zoom_button, setHidden: YES];
        }
        id.setTitleVisibility_(if title_transparent {
          NSWindowTitleVisibility::NSWindowTitleHidden
        } else {
          NSWindowTitleVisibility::NSWindowTitleVisible
        });

        #[cfg(target_arch = "aarch64")]
        id.setHasShadow_(false);

        #[cfg(target_arch = "x86_64")]
        id.setHasShadow_(0);

        id.setTitlebarAppearsTransparent_(if title_transparent {
          cocoa::base::YES
        } else {
          cocoa::base::NO
        });
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
          | NSWindowCollectionBehavior::NSWindowCollectionBehaviorStationary
          | NSWindowCollectionBehavior::NSWindowCollectionBehaviorFullScreenAuxiliary,
      );
    }
  }
}

use tauri::{Runtime, Window};

pub trait WindowExt {
  fn set_document_title(&self, url: &str);
}

impl<R: Runtime> WindowExt for Window<R> {
  fn set_document_title(&self, title: &str) {
    let str = format!("document.title = '{:}'", title);
    self.eval(&str).unwrap();
  }
}
