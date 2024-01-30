export const Event = {
  /** This is used to tell the main app to logout from the settings app */
  AuthLogout: "AuthLogout",
  /** This is used to send the auth data to the settings page from the main page */
  AuthUpdate: "AuthUpdate",
} as const;
