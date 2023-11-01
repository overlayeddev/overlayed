import { RPCCommand } from "./command";

export enum RPCEvent {
  READY = "READY",
  SPEAKING_START = "SPEAKING_START",
  SPEAKING_STOP = "SPEAKING_STOP",
  VOICE_STATE_CREATE = "VOICE_STATE_CREATE",
  VOICE_STATE_DELETE = "VOICE_STATE_DELETE",
  VOICE_STATE_UPDATE = "VOICE_STATE_UPDATE",
  VOICE_CHANNEL_SELECT = "VOICE_CHANNEL_SELECT",
};


/**
 * 
 * @returns Returns a payload for SPEAKING_START event
 */
export function speakingStart(id: String) {
  return {
    cmd: RPCCommand.SUBSCRIBE,
    evt: RPCEvent.SPEAKING_START,
    args: {
      channel_id: id
    }
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
      channel_id: id
    }
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
      channel_id: id
    }
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
      channel_id: id
    }
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
      channel_id: id
    }
  };
}
/**
 * 
 * @returns Returns a payload for VOICE_CHANNEL_SELECT event
 */
export function voiceChannelSelect() {
  return {
    cmd: RPCCommand.SUBSCRIBE,
    evt: RPCEvent.VOICE_CHANNEL_SELECT
  };
}
