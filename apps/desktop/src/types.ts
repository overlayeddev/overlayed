import type { CHANNEL_TYPES } from "@/constants";

/** This is the custom object we use for our state */
export interface OverlayedUser {
  /**
   * @property {string} id - user's id
   */
  id: string;

  /**
   * @property {string} username - username
   */
  username: string;

  /**
   * @property {string} username - the nickname of the user discord wide
   */
  globalUsername: string;

  /**
   * @property {string} avatarHash - hash of the users avatar
   */
  avatarHash: string;

  avatarDecorationData: unknown;

  /**
   * @property {boolean} talking - flag to indicate if the user is talking
   */
  talking: boolean;

  /**
   * @property {boolean} deafened - flag to indicate if the user is deafened
   */
  deafened: boolean;

  /**
   * @property {boolean} muted - flag to indicate if the user is muted, not by themself
   */
  muted: boolean;

  /**
   * @property {boolean} suppress - flag to indicate if the user is suppressed (maybe no voice channels?)
   */
  suppressed: boolean;

  /**
   * @property {boolean} selfDeafened - flag to indicate if the user is self deafened
   */
  selfDeafened: boolean;

  /**
   * @property {boolean} selfMuted - flag to indicate if the user is self muted
   */
  selfMuted: boolean;

  /**
   * @property {number} volume - level to indicate the users volume you have set
   */
  volume: number;

  /**
   * @property {boolean} bot - is a bot?
   */
  bot: boolean;

  /**
   * @property {number} bot - premium level
   */
  premium?: number | null;

  /**
   * @property {number} flags - flags?
   */
  flags: number;

  /**
   * @property {string} discriminator - discriminator like #1234
   */
  discriminator: string;

  /**
   * @property {number} lastUpdate - when we last updated the user ob
   */
  lastUpdate: number;
}

export interface CurrentChannel {
  id: string;
  name: string;
  /**
   * @property {ChannelType} type - current channel type {@link https://discord.com/developers/docs/resources/channel#channel-object-channel-types}
   */
  type: ChannelType;
}

export interface VoiceStateData {
  nick: string;
  mute: boolean;
  volume: number;
  pan: Pan;
  voice_state: VoiceState;
  user: VoiceStateUser;
}

export interface ChannelJoinEvent {
  id: string;
  name: string;
  type: number;
  topic: string;
  bitrate: number;
  user_limit: string;
  guild_id: string;
  position: number;
  messages: unknown[];
  voice_states: VoiceStateData[];
}

interface Pan {
  left: number;
  right: number;
}

interface VoiceState {
  mute: boolean;
  deaf: boolean;
  self_mute: boolean;
  self_deaf: boolean;
  suppress: boolean;
}

// TODO: name these better
export interface VoiceUser {
  avatar: string;
  avatar_decoration_data: unknown;
  bot: boolean;
  discriminator: string;
  flags: number;
  global_name: string;
  id: string;
  premium_type: number;
  username: string;
}

export interface VoiceStateUser {
  nick: string;
  mute: boolean;
  volume: number;
  pan: Pan;
  voice_state: VoiceState;
  user: VoiceUser;
}

export interface JoinHistoryLogUser extends OverlayedUser {
  event: "join" | "leave";
  timestamp: number;
}

export type ChannelType = (typeof CHANNEL_TYPES)[keyof typeof CHANNEL_TYPES];

export interface DiscordProfile {
  accent_color: number;
  avatar: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  avatar_decoration_data: any;
  banner: string;
  banner_color: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clan: any;
  discriminator: string;
  flags: number;
  global_name: string;
  id: string;
  locale: string;
  mfa_enabled: boolean;
  premium_type: number;
  public_flags: number;
  username: string;
}

export interface TokenResponse {
  authdata: Authdata;
  userdata: DiscordProfile;
}

export interface Authdata {
  accessToken: string;
  accessTokenExpiry: string;
  refreshToken: string;
}
