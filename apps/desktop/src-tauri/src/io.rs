use rdev::{Event, EventType};
use serde_json::json;
use tauri::{AppHandle, Manager, Runtime};

type IoCallbacks<R> = Vec<Box<dyn Fn(Event, AppHandle<R>)>>;

pub trait ManagerExt<R: Runtime> {
  fn setup_io_event_handlers(&self, callbacks: IoCallbacks<R>);
}

impl<R: Runtime, T: Manager<R>> ManagerExt<R> for T {
  fn setup_io_event_handlers(&self, callbacks: IoCallbacks<R>) {
    let handle = self.app_handle();

    let callback = move |event: Event| {
      for callback in callbacks.iter() {
        callback(event.clone(), handle.clone());
      }
    };

    if let Err(error) = rdev::listen(callback) {
      println!(
        "[error]: Unable to listen to keyboard and mouse events: {:?}",
        error
      )
    }
  }
}

#[macro_export]
macro_rules! iohook {
  ($app_handle:expr, $($callback:expr),*) => {
      let app_handle = $app_handle.app_handle();

      tauri::async_runtime::spawn(async move {
          let handle = app_handle.app_handle();

          app_handle.run_on_main_thread(move || {
            let callbacks: Vec<Box<dyn Fn(rdev::Event, tauri::AppHandle)>> = vec![
                $(Box::new($callback)),*
            ];

            handle.setup_io_event_handlers(callbacks);
          }).unwrap();
      });
  }
}

pub fn listen_for_mouse_events(event: Event, handle: AppHandle) {
  if let EventType::MouseMove { x, y } = event.event_type {
    handle.trigger_global("mouse-move", Some(json!((x, y)).to_string()));
  }
}
