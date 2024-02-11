export const Event = {
  /** This is used to tell the main app to logout from the settings app */
  AuthLogout: "AuthLogout",
  /** This is used to send the auth data to the settings page from the main page */
  AuthUpdate: "AuthUpdate",
  /** Used to tell the settings window a user joins */
  UserJoin: "UserJoin",
  /** Used to tell the settings window a user leaves */
  UserLeave: "UserLeave",
} as const;
