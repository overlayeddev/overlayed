---
title: About 
description: Read why Overlayed was created and why Discord is gatekeeping  
---
# About Overlayed 

## 🤔 Why does Overlayed exist
Overlayed was created because there is not an official "out of game" overlay for Discord. I created Overlayed to be able to see the voice chat for occasions other than gaming or if you are on a platform that doesn't support the native overlay.

## 📔 Backstory on the [Official Discord Game Overlay](https://support.discord.com/hc/en-us/articles/217659737-Game-Overlay-101)
The way the Official game overlay works is very similar to how game hacking works. It will find the process that it wants to inject a browser rendering engine. 

Keep in mind the Discord overlay only works on Windows so if you are on Linux or macOS there is no support for you. Also, the game overlay requires Discord themselves to reverse engineer every game which is why they have a limited list of supported games.

## 🔍 How does it work
TL;DR the Discord client exposes a websocket on port range `6463-6472` and you can use the [Discord RPC API](https://discord.com/developers/docs/topics/rpc) to interface with the desktop client.

## 🦺 Is this safe to use

Probably not "fully ToS compliant" but you're unlikely to get banned for using it. I've tried to contact Discord several times to get an approved application but they refused to give me any help.

Latest Discord Support thread 🍿
![my ticket request](/img/discord/my-request.png)
![discord support 1](/img/discord/support-1.png)
![my response](/img/discord/my-response.png)
![discord support 2](/img/discord/support-2.png)
