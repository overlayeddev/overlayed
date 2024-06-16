# Generating the icons

It's best to place the icon somewhere on the FS and run this and it will generate them.

```
# make sure you're in the apps/desktop/src-tauri folder

# normal
cargo tauri icon ./icon.png --output icons/normal

# canary
cargo tauri icon ./canary.png --output icons/canary

```
