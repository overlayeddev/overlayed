use log::debug;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::{AppHandle, Manager, Wry};
use tauri_plugin_store::{Store, StoreBuilder};

#[derive(Deserialize, Serialize, Debug, Copy, Clone)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum WindowLayout {
  Left,
  Right,
  Center,
}

#[derive(Deserialize, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct FeatureFlags {
  hide_overlay_on_mouseover: bool,
}

#[derive(Deserialize, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Config {
  pub pin: bool,
  pub placment: WindowLayout,
  pub telemetry: bool,
  pub join_history_notifications: bool,
  pub show_only_talking_users: bool,
  pub feature_flags: FeatureFlags,
}

const CONFIG_FILE_NAME: &str = "expirmental_config_v2.json";
// create a helper function to seed the config with values
pub fn create_or_get_config(app: &AppHandle) -> Store<Wry> {
  debug!("Creating or getting config...");
  // create the store
  let mut appdir = app
    .path()
    .app_data_dir()
    .expect("failed to get app data dir");
  appdir.push(CONFIG_FILE_NAME);
  let config_exists = (appdir.clone()).exists();

  let mut store = StoreBuilder::new(CONFIG_FILE_NAME)
    .serialize(|cache| serde_json::to_vec_pretty(&cache).map_err(Into::into))
    .build(app.app_handle().clone());

  // if the file exists we don't want to overwrite it
  if config_exists {
    debug!("Config file already exists, loading from file");
    store.load();
  } else {
    store.insert("pin".to_string(), json!(false));
    store.insert("placement".to_string(), json!(WindowLayout::Center));
    store.insert("telemetry".to_string(), json!(true));
    store.insert("joinHistoryNotifications".to_string(), json!(true));
    store.insert("showOnlyTalkingUsers".to_string(), json!(true));
    store.insert("featureFlags".to_string(), json!({}));

    store.save();
    debug!("Config file created successfully");
  }

  store
}
