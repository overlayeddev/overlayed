#[cfg(target_os = "macos")]
use objc2_app_kit::NSWorkspace;
#[cfg(target_os = "macos")]
use tauri::{AppHandle, Runtime};

#[cfg(target_os = "macos")]
pub trait AppHandleExt {
  fn frontmost_application_bundle_id() -> Option<String>;
}

#[cfg(target_os = "macos")]
impl<R: Runtime> AppHandleExt for AppHandle<R> {
  fn frontmost_application_bundle_id() -> Option<String> {
    // SAFETY: These read-only AppKit queries have no additional preconditions.
    // Retained objects keep the application and identifier alive during conversion.
    unsafe {
      let workspace = NSWorkspace::sharedWorkspace();
      let application = workspace.frontmostApplication()?;
      // Applications launched outside a bundle may not have a bundle identifier.
      let bundle_id = application.bundleIdentifier()?;
      Some(bundle_id.to_string())
    }
  }
}
