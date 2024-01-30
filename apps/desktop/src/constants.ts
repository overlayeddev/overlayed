export const Event = {
  /** This is used to tell the main app to logout from the settings app */
  AuthLogout: "AuthLogout",
  /** This is used to send the auth data to the settings page from the main page */
  AuthUpdate: "AuthUpdate",
  /** This is used to sync the settings page auth data from the main page */
  AuthSync: "AuthSync",
} as const;
