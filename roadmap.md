# Roadmap — Anywhere Roleplay

## Implemented in source (browser verification still required)
- [x] Expanded NEW MAP inner-city district with eight named shops and food landmarks, included in the canonical POI dataset
- [x] Fixed phone-map pinch gestures so zooming cannot accidentally place a GPS waypoint; pointer capture cleanup and multi-touch drag isolation improved
- [x] Added a regression test for the new landmarks and their map POI entries
- [x] Three.js / React Three Fiber open-world Nigerian city scene
- [x] Player movement, third-person follow camera, collision helpers and touch joystick
- [x] Driveable vehicles, enter/exit interactions, vehicle HUD and dealership
- [x] Smartphone UI for bank, jobs, garage, inventory, map and radio
- [x] Cash/bank system, ATM interactions and roleplay job flows
- [x] Main menu replaces the generated blank-page placeholder
- [x] Email/password sign-up and sign-in UI wired to the connected Supabase project
- [x] Profile and player-save tables exist with row-level security enabled
- [x] Authenticated cloud-save synchronization wired to the player_save table
- [x] Local browser save fallback for guest play and temporary network failures
- [x] Save data includes active job and spawned owned vehicles
- [x] Transaction amount validation and tests for money movement, job progression and save restoration added
- [x] Signup trigger execute privileges revoked from public, anon and authenticated roles; verified by SQL privilege check
- [x] Optimized profile/save RLS policies with scalar auth.uid() checks; Supabase security and performance advisors now return no findings
- [x] Recorded the RLS policy optimization in supabase/migrations/

## Phase 0 — safety net and world fixes
- [x] Correct NEW MAP walking/vehicle bounds to use the canonical +/-180 world limits instead of the old +/-88 clamp
- [x] Add NEW MAP collision checks for building footprints, lake/harbour water and map boundaries
- [x] Fix residential shop-sign instance capacity and correct the airport sign
- [x] Reduce duplicate NEW MAP traffic rendering to one visible traffic layer
- [x] Keep the NEW MAP sky inside the camera far plane; allow `?hd=0` to disable the HD sky
- [x] Reuse the day/night background color instead of allocating a new color on every frame
- [x] Remove duplicate Umuahia building labels
- [x] Auto-select a starting graphics quality from device memory, CPU cores and screen size while preserving the saved manual override
- [x] Add a development-only renderer overlay for FPS, draw calls, triangles and texture count
- [x] Run typecheck, tests and production build in GitHub Actions (all passed for the Phase 0 source changes)\n- [ ] Resolve the repository-wide lint baseline: `bun run lint` currently reports 3,218 Prettier errors and 7 warnings across existing files; avoid mass-formatting unrelated files as part of Phase 0
- [ ] Browser-test NEW MAP airport, port, lake, university and boundary movement on foot and in vehicles

## Remaining work
- [ ] Confirm email sign-up behavior against the project's actual Auth provider configuration
- [ ] Run the latest build, lint and unit tests after the account/cloud-save changes
- [ ] Fix all lint/test/build failures surfaced by CI
- [ ] Test sign-up, email confirmation, sign-in, sign-out, cloud-save creation and cloud-save restoration in browser
- [ ] Verify cloud saves across two separate browser/device sessions using the same account
- [ ] Verify new-game flow safely replaces an existing cloud save
- [ ] Test gameplay on mobile and desktop, including vehicle delivery, jobs, banking and asset loading
- [ ] Confirm the Supabase security advisor is clean after the latest privilege change
- [ ] Add/maintain reproducible database migration files in the repository for schema setup

## Persistence behavior
Signed-in players' game state is periodically written to `public.player_save` using their authenticated user ID. Row-level security restricts each player to their own save. Guest progress is stored in browser localStorage and does not transfer between devices. Cloud sync is best-effort and should be treated as unverified until end-to-end tests pass.

## Security notes
The `public.handle_new_user()` function remains SECURITY DEFINER because it creates a profile from the Auth user trigger. Its direct EXECUTE privileges were revoked from PUBLIC, anon and authenticated; the trigger continues to call it. Re-check Supabase security advisors after schema or function changes.
