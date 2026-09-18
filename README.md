# 🧩 Tiles Match Tool

A React-based level design and balance analytics tool for a tile-matching puzzle game. Build tile layouts, place special mechanics, generate levels procedurally, playtest with boosters, and export structured JSON / `.bytes` payloads for game engine integration and difficulty spreadsheets.

---

## Table of Contents

- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Workflow 1 — Create a Level](#workflow-1--create-a-level-add-special-mechanics-get-a-suggested-level)
- [Workflow 2 — Playtest & Live Difficulty](#workflow-2--playtest-and-track-live-difficulty)
- [Workflow 3 — Export for Difficulty Analysis](#workflow-3--export-into-json-for-difficulty-analysis-sheets)
- [Special Mechanics Reference](#special-mechanics-reference)
- [Booster System Reference](#booster-system-reference)
- [Difficulty Analytics Reference](#difficulty-analytics-reference)
- [Export Formats](#export-formats)
- [Tips & Best Practices](#tips--best-practices)

---

## Overview

The Tiles Match Tool is a single-page builder with three panels:

<img width="1916" height="980" alt="image" src="https://github.com/user-attachments/assets/7706555e-d5cd-4ac2-a9ac-f17bc50f6c76" />


| Panel | Purpose |
|---|---|
| **Left — Builder Tools** | Place tiles, gifts, special mechanics; configure difficulty mods, distribution patterns, icon ratios, and boosters. |
| **Center — Board** | The 480×480 logical grid (20 px per cell). Edit mode places/erases tiles. Play mode tests the level. |
| **Right — Balance Analytics** | Live and theoretical difficulty scoring (MAI, Total Score, Booster Impact). |

The tool has two modes:

- **Edit mode** — design the level.
- **Play mode** — test the level with a 7-slot tray and booster inventory.

Tiles sit on integer layers (`z = 0, 1, 2, 3, 4, 5`). Gifts sit on fractional layers (`z = 0.5, 1.5, 2.5, 3.5, 4.5`), always sandwiched between tile layers.

---

## Core Concepts

### Tile grid

- Logical grid: **24 columns × 24 rows** (`x, y` from 2 to 22 recommended).
- Each placed tile occupies a **2×2** logical footprint (drawn as 40×40 px).
- **Overlap rule:** two tiles overlap if `|dx| < 2 && |dy| < 2`.
- **Stack cover:** same `(x, y)`, higher `z`.
- **Diagonal cover:** offset by `(1, 1)`, `(1, 0)`, etc., higher `z`.

### Free vs. covered

A tile is **free** (tappable) when:

1. No higher tile covers it, **and**
2. It is not chain-locked (`chained1`/`chained2` with uncleared links), **and**
3. It is not ice-frozen (`ice2`/`ice3` with `iceMatchesRemaining > 0`).

### Matchable count

The number of non-gift tiles must be divisible by 3 (`matchableCount % 3 === 0`) to enable **Test Level**.

---

## Workflow 1 — Create a Level, Add Special Mechanics, Get a Suggested Level

### 1.1 Configure the generator (Suggest Level)

Click **Suggest Level** in the top-left of the Builder Tools panel, then set parameters:

<img width="1917" height="971" alt="image" src="https://github.com/user-attachments/assets/ebda72d5-c94e-460e-9c2a-ed06db645f99" />


| Field | Meaning | Recommended |
|---|---|---|
| Target Tile Count | Total matchable tiles (auto-floored to multiple of 3) | 30–60 |
| Z-Layers (2–5) | Number of stacked layers | 3 |
| Layout Shape | Pyramid Cascades, Cluster Islands, Spiral Wave | Pyramid |
| Stack Cover Ratio % | How often a tile lands directly on top of a lower tile | 25–40 |
| Diagonal Cover Ratio % | How often a tile lands diagonally offset | 20–35 |
| Hidden % | Chance to become a hidden tile (`?` until tapped) | 5–15 |
| Chain Lv1 % / Lv2 % | Chance of chained mechanics | 5–10 each |
| Ice % | Chance of ice tiles (2 or 3 match required) | 5–15 |
| Combined % | Chance of combined multi-tile clusters | 3–8 |
| eventItem Leaf (3) | If checked, exactly 3 tiles become event items | On |

Click **Generate & Spawn Level**.

> **Note:** The generator enforces `targetTiles` divisible by 3 and cleans up any remainder. If eventItem Leaf is on, exactly 3 normal tiles are converted to event items.
>
> Use the **↻ (Refresh)** button next to Suggest Level to instantly regenerate with the same parameters.

### 1.2 Fine-tune manually

Use the layer controls and tool selector:

<img width="403" height="135" alt="image" src="https://github.com/user-attachments/assets/8a6ad044-2b76-496c-b0df-2b42c0eb0cbe" />

- **Z-Layer selector (0–5)** — choose which layer to edit.
- **Layer View Mode:**
  - `All` — show every layer, active layer highlighted.
<img width="1487" height="735" alt="image" src="https://github.com/user-attachments/assets/4390920b-8c19-417b-8361-7d5176b1d1ea" />

  - `Stack` (cumulative) — show layers ≤ active layer (build-up preview).
<img width="1491" height="573" alt="image" src="https://github.com/user-attachments/assets/fd46c2d9-bfc5-456d-8d4c-8434272e3959" />

  - `Solo` (isolated) — show only the active layer (clean check).
<img width="1452" height="562" alt="image" src="https://github.com/user-attachments/assets/8b580ebf-9af8-4546-9d5d-d6938110cf37" />

- **Place / Erase toggle** — click the grid to add/remove tiles.
<img width="395" height="61" alt="image" src="https://github.com/user-attachments/assets/6e43e8c0-047d-44ff-a636-cefbdd323f34" />
  
- **Special Mechanic grid** — pick a mechanic before placing. The next tile placed gets that mechanic.
<img width="397" height="306" alt="image" src="https://github.com/user-attachments/assets/f850d12f-697c-42e6-aed8-5b22c2277803" />

### 1.3 Place special mechanics

1. Select a mechanic from the Special Mechanic grid (e.g. Ice (3-Match), Chain Lv2, Combined).
2. Click a grid cell on the active layer.
3. Mechanics that need neighbours (Chain, Combined) resolve when you press **Test Level**:
   - **Chained** tiles auto-link to orthogonal neighbours (`±2, 0` or `0, ±2`) on the same layer. If not enough neighbours exist, the tile downgrades to normal.
   - **Combined** tiles flood-fill into a `combineGroupId` cluster.
   - **eventItem** tiles get `movesRemaining = 4`.

### 1.4 Place Gifts (separate objective entities)

1. Select a gift type (Gift 2x1, Gift 2x2, Gift 2x3).
2. The Z-Layer selector switches to a **Gift Layer** selector (0.5 – 4.5).
3. Click the grid. The gift snaps to even `(x, y)` coordinates.

Collision is checked only against other gifts on the same gift layer — tiles never block placement, only gameplay.

A gift is **revealed** (goal complete) only when no tile above its layer overlaps its bounding box. Revealed gifts are removed from the board and counted in the tray header.

### 1.5 Clear / reset

**Clear Board** — removes all tiles and gifts.

---

## Workflow 2 — Playtest and Track Live Difficulty

### 2.1 Start a playtest

1. Ensure the matchable tile count is a multiple of 3 (the red warning disappears).
2. Click **Test Level** (green button).

<img width="1917" height="977" alt="image" src="https://github.com/user-attachments/assets/29e571e5-7eb6-44cb-abd8-b25c47c40975" />

The builder then:

1. Resolves all special mechanics.
2. Builds a pool of `(icon, color)` variants sized by the current Difficulty Mod Band.
3. Assigns triplets to all matchable tiles (event items still consume a triplet).
4. Initialises booster inventory from the current Booster Preset.
5. Switches to play mode; the left panel slides out.

### 2.2 The tray

- The tray sits in the header and has **7 slots** (upgradeable to `7 + slotExpandUsed` via the Slot+ booster).
- Tapping a free tile moves it into the tray.
- Three consecutive identical `(icon, color)` tiles are auto-removed and score a match.
- If the tray reaches its max capacity → **GAME OVER**.
- Clearing all tiles (and revealing all gifts, if any) → **LEVEL CLEARED**.

### 2.3 Booster bar

| Booster | Behaviour |
|---|---|
| **Undo** | Moves the last tile from the tray back to the board. |
| **Magnet** | Pulls board tiles to complete a match. Works even with an empty tray. |
| **Swap** | Shuffles all icon/color assignments while keeping the layout; guarantees at least `currentMatches - 2` initial matches. |
| **Slot+** | Permanently adds +1 tray slot for the rest of the level. |

Each press decrements the corresponding counter.

### 2.4 Live difficulty tracking

The right panel remains visible during play (toggle with Show / Hide):

<img width="425" height="973" alt="image" src="https://github.com/user-attachments/assets/a2489b31-3707-40ab-b724-2b362e715545" />

- **MAI Live card** shows two values:
  - `Theory` — `difficultyStats.mai` computed from the current board.
  - `Live` — `freeTiles / variants` recomputed every move. If it diverges from Theory by more than 0.5, it turns orange as a warning.
- **Total Score**, **Detailed Metrics**, and **Booster Impact** update in real time.

### 2.5 Win / loss overlay

A modal appears with:

- ✅ **LEVEL CLEARED!** (green) — all tiles cleared, all gifts revealed.
- ❌ **GAME OVER** (red) — tray full.

Click **Return to Editor** to go back to edit mode.

---

## Workflow 3 — Export into JSON for Difficulty Analysis Sheets

There are three export paths, all found in the top bar during edit mode.

### 3.1 Export Level JSON

Opens a modal with the full structured payload.

**Structure overview:**

```jsonc
{
  "level_id": 12,
  "difficulty": {
    "difficulty_mod_band": "modMedium",
    "variants_pool_size": 12,
    "distribution_pattern": "themeFocus",
    "icon_color_ratios": { "themeIconRatio": 85, "colorIconRatio": 15 },
    "initial_matches_on_start": 3,
    "multiplier": 1.0
  },
  "boosters": {
    "preset": "balance",
    "availability": { "undo": 2, "magnet": 1, "swap": 1, "slotExpand": 1 },
    "band": "11-30",
    "economy": {
      "cap":    { "undo": 5, "magnet": 3, "swap": 3, "slotExpand": 2 },
      "median": { "undo": 1, "magnet": 0, "swap": 0, "slotExpand": 0 },
      "rewardEasyMedium": { "undo": 1 },
      "rewardHardPlus":   { "magnet": 1, "swap": 1 }
    }
  },
  "map_info": {
    "total_tiles": 45,
    "total_gifts": 2,
    "total_event_items": 3,
    "max_z_layers": 4,
    "tiles": [
      // Ordered: ascending z; normal tiles before specials within the same z.
      {
        "entity_type": "tile",
        "tile_id": "gen-0",
        "x": 10, "y": 10, "z": 0,
        "icon": "Star", "color": "red"
      },
      {
        "entity_type": "tile",
        "tile_id": "gen-7",
        "x": 12, "y": 10, "z": 0,
        "icon": "Heart", "color": "blue",
        "special_mechanic": { "name": "chained1", "chain_level": 1, "chain_links": ["gen-8"] }
      },
      {
        "entity_type": "gift",
        "gift_id": "gift-abc123",
        "x": 8, "y": 8, "z": 0.5,
        "size": { "cols": 2, "rows": 2 }
      }
    ]
  },
  "dev_note": "..."
}
```

**Buttons:**

- `Copy to Clipboard` — copies the full JSON.
- `Download .JSON File` — downloads `level_<N>_export.json`.

### 3.2 Export .bytes

A slimmer payload targeted at the game engine. It:

- Derives `DifficultyNew` from `difficulty_mod_band` (e.g. `modMedium` → `MEDIUM`).
- Maps every `(icon, color)` pair to a numeric id starting at `1001` (max `1020`).
- Maps every distinct `z` to a rank-based `iz` (1..n) so gifts and tiles retain correct stacking order.
- Applies engine-specific translations:
  - `hidden` → `isBackUp: true`
  - `eventItem` → `indexBreakTileStart: 0`
  - `ice2`, `ice3`, `combined`, `chained1`, `chained2` → **dropped** (not implemented in engine).

**Output example:**

```json
{
  "bytes_version": "1.0",
  "tiles": [
    { "id": 1001, "ix": 10, "iy": 10, "iz": 1 },
    { "id": 1002, "ix": 12, "iy": 10, "iz": 1 },
    { "id": 1001, "ix": 10, "iy": 10, "iz": 2, "isBackUp": true }
  ],
  "gifts": [
    { "ix": 8, "iy": 8, "iz": 2, "visual": 0, "size": 2 }
  ],
  "DifficultyNew": "MEDIUM"
}
```

**Buttons:** `Copy to Clipboard`, `Download Level<N>.bytes`.

### 3.3 Import JSON

Reverse of the export. Upload or paste a previously exported JSON:

1. Upload a `.json` file or paste text.
2. The validator reports errors (up to 20 shown) or a green preview card with: Level id, tile count, gift count, max layer, mod band.
3. Click **Load into Builder** to load the structure.

> Icon and color fields are intentionally **ignored on import** — they regenerate when you press Test Level, ensuring you always re-roll variants for a fresh test.

### 3.4 Using the export in a difficulty spreadsheet

Because the JSON is fully deterministic in structure (not in random icons), you can parse it directly with a script:

| Column in sheet | Source field |
|---|---|
| Level ID | `level_id` |
| Difficulty band | `difficulty.difficulty_mod_band` |
| Variants pool | `difficulty.variants_pool_size` |
| Multiplier | `difficulty.multiplier` |
| Tile count | `map_info.total_tiles` |
| Gift count | `map_info.total_gifts` |
| Event item count | `map_info.total_event_items` |
| Layer depth | `map_info.max_z_layers` |
| Booster relief | compute from `boosters.availability` using the weight table in the app |
| Mechanics mix | count `special_mechanic.name` occurrences |

**Suggested pseudo-pipeline:**

```text
Export Level JSON  →  Paste / upload into sheet  →  Parse with formulas or script
                  →  Compute static score + booster multiplier
                  →  Chart MAI vs. band target
```

**Example Python snippet:**

```python
import json, collections

WEIGHTS = {"chained1":1.6,"chained2":2.1,"ice2":1.2,"ice3":2.2,
           "combined":1.4,"hidden":0.03,"eventItem":2.5}

with open("level_12_export.json") as f:
    lvl = json.load(f)

tiles = [t for t in lvl["map_info"]["tiles"] if t["entity_type"] == "tile"]
mechs = collections.Counter(t.get("special_mechanic", {}).get("name")
                            for t in tiles if t.get("special_mechanic"))

mech_score = sum(WEIGHTS.get(k, 0) * v for k, v in mechs.items())
print("Tiles:", len(tiles), "Mech score:", mech_score)
```

---

## Special Mechanics Reference

| Mechanic | Weight | Behaviour |
|---|---|---|
| `normal` | 0 | Baseline tile. |
| `chained1` | 1.6 | Locked until its 1 linked neighbour is cleared. |
| `chained2` | 2.1 | Locked until its 2 linked neighbours are cleared. |
| `ice2` | 1.2 | Requires 2 matches to thaw before it can be tapped. |
| `ice3` | 2.2 | Requires 3 matches to thaw. |
| `combined` | 1.4 | Moves as a cluster (`combineGroupId`); all group tiles must be free. |
| `hidden` | 0.03 | Displays `?` until tapped once; exported as `isBackUp: true`. |
| `eventItem` | 2.5 | 4-move window; +2 pts while active, +1 pt after expiry; must exist in groups of exactly 3. |
| `gift2x1` / `2x2` / `2x3` | — | Objective entity on fractional layers, not matchable. |

---

## Booster System Reference

### Presets

| Preset | undo | magnet | swap | slotExpand |
|---|---|---|---|---|
| None (Levels 1–10) | 0 | 0 | 0 | 0 |
| Forgiving | 3 | 2 | 2 | 2 |
| Balance | 2 | 1 | 1 | 1 |
| Try-hard | 1 | 1 | 1 | 0 |
| Standard (Levels 31+) | 2 | 1 | 1 | 0 |
| Custom | user-defined | | | |

### Relief model

Each booster contributes a relief value:

| Booster | Weight | Diminishing? |
|---|---|---|
| Undo | −0.4 | No |
| Magnet | −0.8 | No |
| Swap | −1.5 | Yes (× √count) |
| Slot Expand | −1.2 | No |

The **Booster Multiplier** is `1 + (relief / 10)`.

The panel shows three multipliers:

- **Base** — using the level's configured availability.
- **Median** — assuming an average player enters with the median inventory for the level band.
- **Cap** — assuming a grinder enters with the maximum inventory.

### Bands

| Band | Cap (undo/magnet/swap/slot) | Median (undo/magnet/swap/slot) |
|---|---|---|
| 11–30 | 5 / 3 / 3 / 2 | 1 / 0 / 0 / 0 |
| 31–50 | 7 / 4 / 4 / 3 | 3 / 1 / 1 / 0 |
| 51–80 | 10 / 6 / 6 / 4 | 5 / 2 / 2 / 1 |
| 81–120 | 15 / 8 / 8 / 5 | 8 / 4 / 3 / 2 |
| 121+ | 20 / 10 / 10 / 6 | 10 / 5 / 4 / 3 |

---

## Difficulty Analytics Reference

### MAI (Match Availability Index)

```text
MAI = free_tiles / variants_in_pool
```

- Sweet spot: **3.50**
- Danger threshold: **2.00**

If `MAI < sweetSpot`, a penalty is applied:

- Between danger and sweet spot: linear penalty.
- Below danger: additional 2× danger multiplier.

### Total Score

```text
staticTotal   = tileCount + icons + colors + stackCovers + diagCovers + mechanics
staticWithMod = (staticTotal + maiPenalty) × difficultyMultiplier
baseScore     = staticWithMod × baseMultiplier
medianScore   = staticWithMod × medianMultiplier
capScore      = staticWithMod × capMultiplier
```

The header **Total Score** displays `staticWithMod` (backwards-compatible). The **Booster Impact** card shows all three booster-adjusted scores.

### Icon / Color ratios

Controlled via two sliders:

- **Theme Icons Ratio** — how much weight theme icons get.
- **Color Theme Icons Ratio** — how much weight color variants get.

They always sum to 100. Changing the Distribution Pattern resets them to the pattern's defaults; for Hybrid, the average of the two sub-patterns is used.

---

## Export Formats

### Level JSON (for analytics / re-import)

- Rounded, human-readable, with `entity_type` discriminated union (`tile` / `gift`).
- Preserves fractional `z` for gifts.
- Full difficulty and boosters metadata blocks.

### .bytes (for game engine)

- Compact, integer IDs.
- `iz` is rank-based (1..n) to preserve stacking.
- Engine-specific flags: `isBackUp`, `indexBreakTileStart`, `visual`, `size`.
- Includes a top-level `bytes_version: "1.0"` marker.

---

## Tips & Best Practices

- ✅ **Keep target tiles divisible by 3** — the generator enforces this, but manual edits can break it. Watch the red warning.
- 👁️ **Use Solo layer view before playtesting** — it reveals accidental overlaps that inflate the stack-cover score.
- 📈 **Aim for MAI ≥ 3.5 in editor** to leave headroom for the tray fill-rate during play.
- ⚖️ **Balance the three booster multipliers** — if `baseMultiplier ≈ capMultiplier`, boosters barely matter; if they diverge widely, the level is highly booster-dependent.
- 🧩 **Combine > 5-shape clusters are rejected** — the generator falls back to normal if the shape doesn't fit.
- 🎯 **Event items must be exactly 0 or 3** — the import validator enforces this.
- 🎁 **Gift layers never collide with tiles** — but a gift blocked by a tile above it won't reveal until that tile is cleared. Place gifts under high stacks for delayed objectives.
- 🔄 **Import ignores icon/color** — it re-rolls variants on each playtest, giving you fresh variance checks.
- 💾 **Save both `.json` and `.bytes`** — JSON is for design iteration and analytics; `.bytes` is the final engine deliverable.
- 📊 **Use the MAI Live card during play** — if it drifts > 0.5 from Theory, the level is pacing differently than designed (often due to chained/ice locks hiding matches).

---

*Generated for the Tiles Match Tool. For engine integration details on the `.bytes` format, coordinate with the engine team on the `(icon, color) → id` remapping table (range 1001–1020).*
