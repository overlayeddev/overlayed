use log::debug;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::{AppHandle, Manager};
use tauri_plugin_store::StoreBuilder;

#[derive(Deserialize, Serialize, Debug, Copy, Clone)]
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

  // if the file exists we don't want to overwrite it
  if appdir.exists() {
    debug!("Config file already exists, skipping creation");
    return;
  }

  let mut store = StoreBuilder::new(app.app_handle(), appdir).build();
  store.insert("pin".to_string(), json!(false));
  store.insert("placement".to_string(), json!(WindowLayout::Center));
  store.insert("telemetry".to_string(), json!(true));
  store.insert("join_history_notifications".to_string(), json!(true));
  store.insert("show_only_talking_users".to_string(), json!(true));

  store.save();
  debug!("Config file created successfully");
}

// TODO: what i reallly want is a util method to allow me to do like
// config.set(ConfigKey::Pin, json!(false))
// config.get(ConfigKey::Pin)
