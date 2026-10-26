# Roadmap — Anywhere Roleplay (3D open-world Nigerian roleplay game)

## Implemented in source (not yet fully browser-verified)
- [x] React Three Fiber / Drei scene stack and 3D city layout
- [x] City ground, roads, buildings, lamps, trees and day/night cycle
- [x] Animated player character, camera-relative movement and collision helpers
- [x] Vehicle catalog, arcade driving, enter/exit controls and speed HUD
- [x] Mobile joystick, sprint toggle, keyboard controls and interaction prompts
- [x] Phone overlay: bank, jobs, garage, inventory, map and city radio
- [x] Cash/bank state, ATMs, dealership, job flows and localStorage save routine
- [x] Main menu route now mounts the existing game after starting/continuing

## Remaining / verification required
- [ ] Run build, lint and automated tests against the current branch
- [ ] Verify the first-load, new-game and continue-save flows in a browser
- [ ] Test mobile controls, vehicle interactions, jobs, banking and asset loading
- [ ] Add focused tests for transfers, purchases, job completion and save/load
- [ ] Review collision/spawn edge cases and prevent repeated job-stage activation
- [ ] Online accounts and cross-device cloud saves (previously blocked by Lovable workspace credits; localStorage remains device/browser-specific)

## Save limitation
Current progress is stored in the browser's localStorage on the current device/browser. It is not synced to a user account and does not follow the player to another device. Do not describe cloud saves or online authentication as available until a backend is configured and verified.
