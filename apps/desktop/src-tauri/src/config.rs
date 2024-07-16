use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::{AppHandle, Manager};
use tauri_plugin_store::StoreBuilder;

#[derive(Deserialize, Serialize, Debug)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum WindowLayout {
  Left,
  Right,
  Center,
}

#[derive(Deserialize, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Config {
  pub pin: bool,
  pub placment: WindowLayout,
  pub telemetry: bool,
  pub join_history_notifications: bool,
  pub show_only_talking_users: bool,
}

// create a helper function to seed the config with values
pub fn create_config(app: &AppHandle) {
  // create the store
  let mut appdir = app.path_resolver().app_data_dir().unwrap();
  appdir.push("config_v2.json");

  let mut store = StoreBuilder::new(app.app_handle(), appdir).build();
  store.insert("pin".to_string(), json!(false));
  store.insert("placement".to_string(), json!(WindowLayout::Center));
  store.insert("telemetry".to_string(), json!(true));
  store.insert("join_history_notifications".to_string(), json!(true));
  store.insert("show_only_talking_users".to_string(), json!(true));

  store.save();
  println!("ayo");
}
