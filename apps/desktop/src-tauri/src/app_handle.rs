#[cfg(target_os = "macos")]
use tauri::{AppHandle, Runtime};

#[cfg(target_os = "macos")]
use tauri_nspanel::{
  cocoa::base::id,
  objc::{class, msg_send, sel, sel_impl},
};

#[cfg(target_os = "macos")]
fn nsstring_to_string(ns_string: id) -> Option<String> {
  use std::ffi::{c_char, CStr};

  let utf8: id = unsafe { msg_send![ns_string, UTF8String] };

  if !utf8.is_null() {
    Some(unsafe {
      {
        CStr::from_ptr(utf8 as *const c_char)
          .to_string_lossy()
          .into_owned()
      }
    })
  } else {
    None
  }
}

#[cfg(target_os = "macos")]
pub trait AppHandleExt {
  fn frontmost_application_bundle_id() -> Option<String>;
}

#[cfg(target_os = "macos")]
impl<R: Runtime> AppHandleExt for AppHandle<R> {
  fn frontmost_application_bundle_id() -> Option<String> {
    let workspace: id = unsafe { msg_send![class!(NSWorkspace), sharedWorkspace] };

    let frontmost_application: id = unsafe { msg_send![workspace, frontmostApplication] };

    let bundle_id: id = unsafe { msg_send![frontmost_application, bundleIdentifier] };

    nsstring_to_string(bundle_id)
  }
}
