# Anywhere Roleplay — Engineering Roadmap

## Phase 0 — safety net and world fixes
- [x] Use canonical NEW MAP bounds instead of the legacy +/-88 movement clamp.
- [x] Add NEW MAP collision checks for map edges, building footprints, lake and harbour water.
- [x] Fix shop-sign instance capacity, airport signage, duplicate traffic layers and duplicate Umuahia labels.
- [x] Keep the NEW MAP sky within the camera far plane and support `?hd=0`.
- [x] Reuse the day/night background colour instead of allocating a new colour every frame.
- [x] Detect a default graphics tier while preserving the player's saved manual quality choice.
- [x] Add a development-only FPS/draw-call/triangle/texture-count overlay.
- [x] Add NEW MAP collision regression coverage.
- [ ] Browser-test walking and driving around the airport, port, lake, university and all four boundaries.

## Phase 1 — rendering foundation
- [x] Add shared low/medium/high graphics profiles with renderer pixel-ratio, shadow, environment, rain, traffic and culling budgets.
- [x] Apply quality-aware device pixel ratio, antialiasing, shadows, ACES tone mapping and environment resolution.
- [x] Adapt renderer pixel ratio from observed frame rate without overriding the saved quality selection.
- [x] Follow the active player with the directional-light target/shadow camera.
- [x] Synchronize the NEW MAP custom sky colour with the in-game day/night cycle.
- [x] Scale rainfall particles to the active world's coordinate scale.
- [ ] Browser-check day/night transitions, rain, outages, shadow stability and quality changes on Android and desktop.

## Phase 2 — city world and NEW MAP
- [x] Add distance-based building visibility for Lagos, Umuahia and NEW MAP based on graphics tier.
- [x] Use the active city's canonical building-door data for interaction prompts instead of falling back to Lagos coordinates.
- [x] Show GPS guidance on NEW MAP as well as Lagos/Umuahia.
- [x] Keep existing NEW MAP airport, port, lake, university, market, road, district and residential layouts.
- [ ] Replace remaining procedural placeholder facades/props with reviewed PBR/GLB assets when supplied.
- [ ] Verify the visual result and collision/navigation of each major destination in a browser session.

## Phase 3 — characters and vehicles
- [x] Keep the existing rigged character and vehicle models with procedural Danfo/Keke/bike fallbacks.
- [x] Apply quality-tier shadow and renderer budgets to character/vehicle scenes.
- [x] Smooth remote-player movement without allocating a new vector every render frame.
- [x] Scale remote player avatars correctly in NEW MAP.
- [ ] Verify vehicle model orientation, wheels, collisions, entry/exit and character animation on real devices.
- [ ] Review/upload improved character, animation and vehicle assets if the current GLBs are not visually sufficient.

## Phase 4 — interiors
- [x] Keep the existing named interior definitions, grouped prop batches, hotspots and exit markers.
- [x] Give plant, stove, pool and seat batches more appropriate primitive geometry.
- [x] Add lightweight ambient movement/dialogue to interior NPCs.
- [x] Cap interior NPC count by graphics tier.
- [ ] Browser-test entry/exit, door placement, hotspot actions, room bounds and save restoration after leaving an interior.
- [ ] Replace placeholder box props with authored furniture/fixtures as assets become available.

## Phase 5 — multiplayer foundation
- [x] Keep the existing authenticated Supabase Realtime presence/broadcast channel; no database schema or RLS changes were made.
- [x] Display remote players in all three cities, including NEW MAP, and smooth their position updates.
- [ ] Test with two signed-in browser/device sessions and confirm presence removal on disconnect.
- [ ] Treat this as client-broadcast multiplayer, not authoritative server simulation: server-authoritative movement, anti-cheat, matchmaking and persistence need a separate backend design and explicit schema/security review.

## Phase 6 — NPC and traffic behaviour
- [x] Keep traffic and pedestrian actor counts bounded by graphics quality and hide distant actors.
- [x] Keep NEW MAP traffic on a single selected traffic representation.
- [x] Add low-cost wandering to interior NPCs while preserving their existing dialogue/hotspots.
- [x] Keep NEW MAP city pedestrians, traffic, aircraft, boats and stadium crowd behind existing quality/scene conditions.
- [ ] Test traffic/pedestrian intersections, collision interactions, NPC density and frame rate in the browser.
- [ ] Advanced schedules, persistent NPC state and behaviour-tree AI remain future work rather than simulated as server-grade AI.

## Phase 7 — polish and optimisation
- [x] Add reusable graphics profiles and profile regression tests.
- [x] Add adaptive pixel ratio and development performance telemetry.
- [x] Add distance culling in all city scenes.
- [x] Preserve the existing save-data shapes, save key, Supabase schema, authentication and RLS policies.
- [ ] Run end-to-end mobile and desktop play tests.
- [ ] Resolve the existing repository-wide lint backlog without mass-formatting unrelated files. Previous `bun run lint` reported 3,218 Prettier errors and 7 warnings.
- [ ] Review measured renderer budgets on representative mobile and desktop hardware; do not infer draw-call or memory budgets from source alone.

## Verification status
- Phase 0 source changes previously passed GitHub Actions typecheck, build and tests.
- The latest changes are being re-verified by GitHub Actions. Use the workflow run attached to the latest `main` commit for the definitive result.
- Manual browser/device tests cannot be truthfully marked complete from repository inspection alone.

## Persistence and security constraints
Signed-in players' game state is periodically written to `public.player_save` using their authenticated user ID. Row-level security restricts each player to their own save. Guest progress is stored in browser localStorage and does not transfer between devices. Cloud sync remains best-effort until end-to-end tests pass.

The `public.handle_new_user()` function remains SECURITY DEFINER because it creates a profile from the Auth user trigger. Its direct EXECUTE privileges were revoked from PUBLIC, anon and authenticated; the trigger continues to call it. Re-check Supabase security advisors after any future schema or function changes.

## Asset status
See [docs/ASSET_MANIFEST.md](docs/ASSET_MANIFEST.md) for the current model files and the exact additional assets that would improve the remaining placeholder art.
