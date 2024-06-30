#[cfg(target_os = "macos")]
pub mod macos {
  use tauri::{Runtime, Window};
  use cocoa::{
    appkit::{
      NSMainMenuWindowLevel, NSWindow, NSWindowButton, NSWindowCollectionBehavior,
      NSWindowStyleMask, NSWindowTitleVisibility,
    },
    base::id,
    foundation::NSInteger,
  };
  use objc::{msg_send, runtime::YES};

  pub trait WindowExtMacos {
    fn set_transparent_titlebar(&self, title_transparent: bool, remove_toolbar: bool);
    fn set_visisble_on_all_workspaces(&self, enabled: bool);
  }

  impl<R: Runtime> WindowExtMacos for Window<R> {
    fn set_visisble_on_all_workspaces(&self, enabled: bool) {
      const HIGHER_LEVEL_THAN_LEAGUE: NSInteger = 1001;
      unsafe {
        let ns_win = self.ns_window().unwrap() as id;

        if enabled {
          ns_win.setLevel_(HIGHER_LEVEL_THAN_LEAGUE);
          ns_win.setCollectionBehavior_(
            NSWindowCollectionBehavior::NSWindowCollectionBehaviorCanJoinAllSpaces,
          );
        } else {
          ns_win.setLevel_(((NSMainMenuWindowLevel - 1) as u64).try_into().unwrap());
          ns_win
            .setCollectionBehavior_(NSWindowCollectionBehavior::NSWindowCollectionBehaviorDefault);
        }
      }
    }

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
