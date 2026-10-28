# Asset Manifest — Anywhere Roleplay

This list is a handoff for future art integration. No new binary art was authored or hotlinked in this change set. Keep procedural geometry as a fallback and review each asset's license before committing it.

## Models already in the repository

| Path | Current use |
| --- | --- |
| `public/models/character.glb` | Rigged player/pedestrian character used by the existing character renderer |
| `public/models/sedan.glb` | Sedan vehicle |
| `public/models/sports.glb` | Sports vehicle |
| `public/models/taxi.glb` | Taxi vehicle |
| `public/models/suv.glb` | SUV vehicle |
| `public/models/police.glb` | Police vehicle |
| `public/models/danfo.glb` | Existing asset file; the gameplay renderer currently uses a procedural Danfo mesh |

## Recommended additions for visual quality

Upload licensed, optimized GLB files to these exact paths when available. If an asset is missing, keep the current procedural placeholder and do not add a remote URL dependency.

### Buildings
- `public/models/buildings/nigerian-shop-row.glb` — modular one- and two-storey shopfront row.
- `public/models/buildings/lagos-bungalow.glb` — Nigerian bungalow with porch and compound wall.
- `public/models/buildings/apartment-block.glb` — 4–8 storey residential apartment block.
- `public/models/buildings/office-tower.glb` — glass-and-concrete business tower.
- `public/models/buildings/police-station.glb` — station facade and entrance canopy.
- `public/models/buildings/hospital.glb` — hospital facade with a clear entrance.
- `public/models/buildings/university-block.glb` — lecture/admissions block.
- `public/models/buildings/airport-terminal.glb` — terminal frontage with glass curtain wall.
- `public/models/buildings/port-crane.glb` — container crane.
- `public/models/buildings/market-hall.glb` — covered market hall and stalls.

### Street props
- `public/models/props/bus-stop.glb`
- `public/models/props/market-stall.glb`
- `public/models/props/roadside-kiosk.glb`
- `public/models/props/streetlight.glb`
- `public/models/props/traffic-light.glb`
- `public/models/props/generator.glb`
- `public/models/props/water-tank.glb`
- `public/models/props/palm-tree.glb`
- `public/models/props/road-barrier.glb`

### Character and vehicle upgrades
- `public/models/characters/civilian-male.glb` — rigged, animated and mobile-optimized.
- `public/models/characters/civilian-female.glb` — rigged, animated and mobile-optimized.
- `public/models/characters/security-officer.glb` — rigged uniformed character.
- `public/models/vehicles/keke.glb` — optional replacement for the procedural Keke.
- `public/models/vehicles/danfo.glb` — optional replacement only after checking the existing root-level Danfo asset and orientation.

### Surface materials (prefer packed/embedded GLB materials where practical)
- `public/textures/road/asphalt-1k.webp`
- `public/textures/road/asphalt-normal-1k.webp`
- `public/textures/concrete/concrete-1k.webp`
- `public/textures/concrete/concrete-normal-1k.webp`
- `public/textures/facade/painted-plaster-1k.webp`
- `public/textures/facade/glass-roughness-1k.webp`
- `public/textures/ground/soil-grass-1k.webp`

## Acceptance requirements for supplied assets

- Prefer CC0 or another explicitly compatible license; include source and license in a small attribution note.
- Keep mobile textures at 1024 px or less per side; avoid uncompressed 4K textures.
- Use optimized GLB, shared materials, sensible pivots and real-world scale.
- Avoid duplicate hidden meshes, excessive material slots and unnecessary animation tracks.
- Verify vehicle forward axis, character rig compatibility, scale, origin and collision footprint before integration.
- Keep a procedural fallback for every optional model so a missing asset never blocks loading.
- Do not add assets by hotlinking third-party URLs at runtime.
