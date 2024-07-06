# Generating the icons

It's best to place the icon somewhere on the FS and run this and it will generate them.

### Main icons sets
```
# make sure you're in the apps/desktop/src-tauri folder

# normal
cargo tauri icon ./icon.png --output icons/normal

# canary
cargo tauri icon ./canary.png --output icons/canary

```

### Tray icon
I was running into issues on linux exporting the 32x32 directly from figma so i scaled it to 512x512 and use the `tauri-cli` as suggested from.
https://github.com/tauri-apps/tauri/issues/6117

```
# for default
cargo tauri icon icon.png -o ./default
# for pinned
cargo tauri icon icon-pinned.png -o ./pinned
```
