import { RPCCommand } from "./command";

export enum RPCEvent {
  /** non-subscription event sent immediately after connecting, contains server information */
  READY = "READY",
  /** non-subscription event sent when there is an error, including command responses */
  ERROR = "ERROR",
  /** sent when a user in a subscribed voice channel speaks */
  SPEAKING_START = "SPEAKING_START",
  /** sent when a user in a subscribed voice channel stops speaking */
  SPEAKING_STOP = "SPEAKING_STOP",
  /**	sent when a user joins a subscribed voice channel */
  VOICE_STATE_CREATE = "VOICE_STATE_CREATE",
  /** sent when a user joins a subscribed voice channel */
  VOICE_STATE_DELETE = "VOICE_STATE_DELETE",
  /** sent when a user's voice state changes in a subscribed voice channel (mute, volume, etc.) */
  VOICE_STATE_UPDATE = "VOICE_STATE_UPDATE",
  /** sent when the client joins a voice channel */
  VOICE_CHANNEL_SELECT = "VOICE_CHANNEL_SELECT",
  /** sent when the client's voice connection status changes */
  VOICE_CONNECTION_STATUS = "VOICE_CONNECTION_STATUS",
}

/**
 *
 * @returns Returns a payload for SPEAKING_START event
 */
export function speakingStart(id: String) {
  return {
    cmd: RPCCommand.SUBSCRIBE,
    evt: RPCEvent.SPEAKING_START,
    args: {
      channel_id: id,
    },
  };
}

/**
 *
 * @returns Returns a payload for SPEAKING_STOP event
 */
export function speakingStop(id: String) {
  return {
    cmd: RPCCommand.SUBSCRIBE,
    evt: RPCEvent.SPEAKING_STOP,
    args: {
      channel_id: id,
    },
  };
}

/**
 *
 * @returns Returns a payload for VOICE_STATE_UPDATE event
 */
export function voiceStateUpdate(id: String) {
  return {
    cmd: RPCCommand.SUBSCRIBE,
    evt: RPCEvent.VOICE_STATE_UPDATE,
    args: {
      channel_id: id,
    },
  };
}

/**
 *
 * @returns Returns a payload for VOICE_STATE_CREATE event
 */
export function voiceStateCreate(id: String) {
  return {
    cmd: RPCCommand.SUBSCRIBE,
    evt: RPCEvent.VOICE_STATE_CREATE,
    args: {
      channel_id: id,
    },
  };
}

/**
 *
 * @returns Returns a payload for VOICE_STATE_DELETE event
 */
export function voiceStateDelete(id: String) {
  return {
    cmd: RPCCommand.SUBSCRIBE,
    evt: RPCEvent.VOICE_STATE_DELETE,
    args: {
      channel_id: id,
    },
  };
}
/**
 *
 * @returns Returns a payload for VOICE_CHANNEL_SELECT event
 */
export function voiceChannelSelect() {
  return {
    cmd: RPCCommand.SUBSCRIBE,
    evt: RPCEvent.VOICE_CHANNEL_SELECT,
  };
}
