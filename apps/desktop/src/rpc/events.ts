import { VoiceStateUser } from "../types";

export interface GetSelectedVoiceChannelResponse {
  cmd: "GET_SELECTED_VOICE_CHANNEL";
  data: {
    id: string;
    guild_id: string;
    name: string;
    type: number;
    topic: string;
    messages: [];
    bitrate: number;
    user_limit: number;
    voice_states: VoiceStateUser[];
  };
}



export type DiscordCommand = GetSelectedVoiceChannelResponse;  

