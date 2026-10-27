export const formatHotkey = (value: string, macos: boolean) =>
  value
    .split("+")
    .map(part => {
      const token = part.trim();
      switch (token.toLowerCase()) {
        case "commandorcontrol":
        case "commandorctrl":
        case "cmdorcontrol":
        case "cmdorctrl":
          return macos ? "Cmd" : "Ctrl";
        case "command":
        case "cmd":
        case "super":
          return macos ? "Cmd" : "Win";
        case "control":
        case "ctrl":
          return "Ctrl";
        case "alt":
        case "option":
          return "Alt";
        case "shift":
          return "Shift";
        case "backquote":
          return "`";
        default:
          return token.replace(/^Key([A-Z])$/i, "$1").replace(/^Digit([0-9])$/i, "$1");
      }
    })
    .join(" + ");
