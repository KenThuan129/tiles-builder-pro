import React, { useState, useEffect, useMemo } from 'react';
import {
  Play, Square, Trash2, Layers, Pickaxe, Eye, Link,
  Lock, ShieldAlert, Settings, Info, Box, Star, Heart,
  Sun, Moon, Flower, Fish, Cloud, Flame, Zap, Droplet, Shuffle, Edit3, X, Check, RefreshCw,
  Activity, HelpCircle, Boxes, Leaf, Download, Copy, Sliders,
  Upload, FileJson, AlertCircle, Gift
} from 'lucide-react';

// --- CONFIGURATION & WEIGHTS ---
const WEIGHTS = {
  tileCount: { base: 0.05, earlyLevel: 0.03, highCount: 0.08 },
  iconCount: { theme: 1.50, color: 0.80 },
  layerCount: { diagonal: 1.00, stack: 1.80 },
  mai: { base: 0.50, dangerMultiplier: 2.00, sweetSpot: 3.50, dangerThreshold: 2.00 },
  mechanics: {
    normal: 0,
    chained1: 1.60,
    chained2: 2.10,
    ice2: 1.20,
    ice3: 2.20,
    combined: 1.40,
    hidden: 0.03,
    eventItem: 2.50,
    gift2x1: 0,   
    gift2x2: 0,
    gift2x3: 0,
  }
};

const ICONS = { Star, Heart, Sun, Moon, Flower, Fish, Cloud, Flame, Zap, Droplet };
const COLORS = [
  { id: 'red', class: 'text-red-500', bg: 'bg-red-100', border: 'border-red-300' },
  { id: 'blue', class: 'text-blue-500', bg: 'bg-blue-100', border: 'border-blue-300' },
  { id: 'green', class: 'text-green-500', bg: 'bg-green-100', border: 'border-green-300' },
  { id: 'yellow', class: 'text-yellow-500', bg: 'bg-yellow-100', border: 'border-yellow-300' },
  { id: 'purple', class: 'text-purple-500', bg: 'bg-purple-100', border: 'bg-purple-300' }
];

const MECHANICS = [
  { id: 'normal', label: 'Normal', icon: Box },
  { id: 'chained1', label: 'Chain Lv1', icon: Link },
  { id: 'chained2', label: 'Chain Lv2', icon: Link },
  { id: 'ice2', label: 'Ice (2-Match)', icon: Layers },
  { id: 'ice3', label: 'Ice (3-Match)', icon: Layers },
  { id: 'combined', label: 'Combined', icon: Boxes },
  { id: 'hidden', label: 'Hidden', icon: Eye },
  { id: 'eventItem', label: 'Event Item', icon: Leaf },
  { id: 'gift2x1', label: 'Gift 2x1', icon: Gift },
  { id: 'gift2x2', label: 'Gift 2x2', icon: Gift },
  { id: 'gift2x3', label: 'Gift 2x3', icon: Gift },
];

const INITIAL_DIFFICULTY_MODS = {
  modEasy: { label: 'Easy (Relaxed Flow)', multiplier: 0.8, variants: 6, startingMatches: 4, targetMAI: '> 3.50' },
  modMedium: { label: 'Medium (Balanced)', multiplier: 1.0, variants: 12, startingMatches: 3, targetMAI: '3.0 - 3.5' },
  modHard: { label: 'Tight Pacing', multiplier: 1.25, variants: 18, startingMatches: 2, targetMAI: '2.0 - 2.9' },
  modVeryHard: { label: 'Scarcity', multiplier: 1.5, variants: 26, startingMatches: 1, targetMAI: '1.5 - 1.9' },
  modExpert: { label: 'Danger Zone', multiplier: 1.8, variants: 35, startingMatches: 0, targetMAI: '< 1.50' }
};

const DISTRIBUTION_PATTERNS = {
  themeFocus: { label: 'Theme Focus', iconWeightFactor: 1.1, defaultRatio: { themeIconRatio: 85, colorIconRatio: 15 } },
  colorScatter: { label: 'Color Scatter', iconWeightFactor: 1.3, defaultRatio: { themeIconRatio: 30, colorIconRatio: 70 } },
  heavyStack: { label: 'Heavy Stacking', iconWeightFactor: 1.0, defaultRatio: { themeIconRatio: 60, colorIconRatio: 40 } },
  pyramidCascades: { label: 'Pyramid Cascades', iconWeightFactor: 1.0, defaultRatio: { themeIconRatio: 75, colorIconRatio: 25 } },
  hybrid: { label: 'Hybrid (Blend 2)', iconWeightFactor: 1.2, defaultRatio: { themeIconRatio: 50, colorIconRatio: 50 } },
  random: { label: 'Random (Pure Stochastic)', iconWeightFactor: 1.0, defaultRatio: { themeIconRatio: 50, colorIconRatio: 50 } }
};

const COMBINE_SHAPES = [
  { size: 2, name: '2-Horizontal', offsets: [{ dx: 0, dy: 0 }, { dx: 2, dy: 0 }] },
  { size: 2, name: '2-Vertical', offsets: [{ dx: 0, dy: 0 }, { dx: 0, dy: 2 }] },
  { size: 3, name: '3-Horizontal', offsets: [{ dx: 0, dy: 0 }, { dx: 2, dy: 0 }, { dx: 4, dy: 0 }] },
  { size: 3, name: '3-Vertical', offsets: [{ dx: 0, dy: 0 }, { dx: 0, dy: 2 }, { dx: 0, dy: 4 }] },
  { size: 3, name: '3-L-Left', offsets: [{ dx: 0, dy: 0 }, { dx: 0, dy: 2 }, { dx: -2, dy: 2 }] },
  { size: 3, name: '3-L-Right', offsets: [{ dx: 0, dy: 0 }, { dx: 0, dy: 2 }, { dx: 2, dy: 2 }] },
  { size: 4, name: '4-Square', offsets: [{ dx: 0, dy: 0 }, { dx: 2, dy: 0 }, { dx: 0, dy: 2 }, { dx: 2, dy: 2 }] },
  { size: 4, name: '4-Horizontal', offsets: [{ dx: 0, dy: 0 }, { dx: 2, dy: 0 }, { dx: 4, dy: 0 }, { dx: 6, dy: 0 }] },
  { size: 4, name: '4-Vertical', offsets: [{ dx: 0, dy: 0 }, { dx: 0, dy: 2 }, { dx: 0, dy: 4 }, { dx: 0, dy: 6 }] },
  { size: 4, name: '4-L-Left', offsets: [{ dx: 0, dy: 0 }, { dx: 0, dy: 2 }, { dx: 0, dy: 4 }, { dx: -2, dy: 4 }] },
  { size: 4, name: '4-L-Right', offsets: [{ dx: 0, dy: 0 }, { dx: 0, dy: 2 }, { dx: 0, dy: 4 }, { dx: 2, dy: 4 }] },
  { size: 4, name: '4-Zigzag', offsets: [{ dx: 0, dy: 0 }, { dx: 0, dy: 2 }, { dx: 2, dy: -2 }, { dx: 2, dy: 0 }] },
  { size: 5, name: '5-Cross', offsets: [{ dx: 0, dy: 0 }, { dx: 2, dy: 0 }, { dx: -2, dy: 0 }, { dx: 0, dy: 2 }, { dx: 0, dy: -2 }] },
  { size: 5, name: '5-X', offsets: [{ dx: 0, dy: 0 }, { dx: 2, dy: 2 }, { dx: -2, dy: 2 }, { dx: 2, dy: -2 }, { dx: -2, dy: -2 }] },
  { size: 5, name: '5-Star', offsets: [{ dx: 0, dy: 0 }, { dx: 0, dy: -4 }, { dx: -4, dy: 2 }, { dx: 4, dy: 2 }, { dx: 0, dy: 2 }] },
];

const GIFT_SIZES = {
  gift2x1: { cols: 2, rows: 1, name: 'Gift 2x1' },
  gift2x2: { cols: 2, rows: 2, name: 'Gift 2x2' },
  gift2x3: { cols: 2, rows: 3, name: 'Gift 2x3' }
};

const GIFT_LAYERS = [0.5, 1.5, 2.5, 3.5, 4.5];
const BYTES_VERSION = "1.0";
const BYTES_ID_RANGE_START = 1001;
const BYTES_ID_RANGE_END = 1020;

const generateId = () => Math.random().toString(36).substr(2, 9);

const isOverlapping = (t1, t2) => {
  const dx = Math.abs(t1.x - t2.x);
  const dy = Math.abs(t1.y - t2.y);
  return dx < 2 && dy < 2;
};

const getCoverType = (t1, t2) => {
  if (t2.z <= t1.z) return null;
  const dx = Math.abs(t1.x - t2.x);
  const dy = Math.abs(t1.y - t2.y);
  if (dx < 2 && dy < 2) {
    if (dx === 0 && dy === 0) return 'stack';
    return 'diagonal';
  }
  return null;
};

const isTileCoveredByOther = (tile, allTiles) => {
  return allTiles.some(t2 => {
    if (t2.z <= tile.z) return false;
    const dx = Math.abs(tile.x - t2.x);
    const dy = Math.abs(tile.y - t2.y);
    return dx < 2 && dy < 2;
  });
};

const isChainLocked = (tile) => {
  if (tile.mechanic !== 'chained1' && tile.mechanic !== 'chained2') return false;
  return (tile.chainClearedCount || 0) < (tile.chainLevel || 1);
};

const isIceFrozen = (tile) => {
  if (tile.mechanic !== 'ice2' && tile.mechanic !== 'ice3') return false;
  const req = tile.mechanic === 'ice3' ? 3 : 2;
  return (tile.iceMatchesRemaining ?? req) > 0;
};

const isTileFree = (tile, allTiles) => {
  if (isTileCoveredByOther(tile, allTiles)) return false;
  if (isChainLocked(tile)) return false;
  
  if (tile.mechanic === 'ice2' || tile.mechanic === 'ice3') {
    const req = tile.mechanic === 'ice3' ? 3 : 2;
    if ((tile.iceMatchesRemaining ?? req) > 0) return false;
  }

  if (tile.mechanic === 'combined' && tile.combineGroupId) {
    const groupMates = allTiles.filter(t => t.combineGroupId === tile.combineGroupId);
    return groupMates.every(t => !isTileCoveredByOther(t, allTiles) && !isChainLocked(t) && !isIceFrozen(t));
  }
  return true;
};

// A gift is "blocked" if any tile ABOVE its layer overlaps its bounding box.
// Gifts on the same layer never block each other.
const isGiftBlocked = (gift, allTiles) => {
  const size = GIFT_SIZES[gift.mechanic];
  if (!size) return false;

  const gEndX = gift.x + (size.cols - 1) * 2;
  const gEndY = gift.y + (size.rows - 1) * 2;

  return allTiles.some(t => {
    if (t.isGift) return false;
    if (t.z <= gift.z) return false;
    return !(
      t.x > gEndX ||
      t.x < gift.x ||
      t.y > gEndY ||
      t.y < gift.y
    );
  });
};

const CHAIN_NEIGHBOR_OFFSETS = [{ dx: 2, dy: 0 }, { dx: -2, dy: 0 }, { dx: 0, dy: 2 }, { dx: 0, dy: -2 }];

const resolveSpecialMechanics = (rawTiles) => {
  let workingTiles = rawTiles.map(t => ({ ...t }));

  workingTiles = workingTiles.filter(t => !t.isGift);

  workingTiles.forEach(tile => {
    if ((tile.mechanic === 'chained1' || tile.mechanic === 'chained2') && (!tile.chainLinks || tile.chainLinks.length < 2)) {
      const levelRequired = tile.mechanic === 'chained2' ? 2 : 1;
      const sameLayerNeighbors = CHAIN_NEIGHBOR_OFFSETS
        .map(o => workingTiles.find(t2 =>
          t2.z === tile.z && t2.x === tile.x + o.dx && t2.y === tile.y + o.dy && t2.id !== tile.id
        ))
        .filter(Boolean);

      if (sameLayerNeighbors.length >= levelRequired) {
        const picked = [...sameLayerNeighbors].sort(() => Math.random() - 0.5).slice(0, levelRequired);
        tile.chainLinks = picked.map(t => t.id);
        tile.chainLevel = levelRequired;
      } else {
        tile.mechanic = 'normal';
        delete tile.chainLinks;
        delete tile.chainLevel;
      }
    }
    if (tile.mechanic === 'chained1' || tile.mechanic === 'chained2') {
      tile.chainClearedCount = tile.chainClearedCount || 0;
    }

    if (tile.mechanic === 'eventItem') {
      tile.movesRemaining = tile.movesRemaining ?? 4;
      tile.isEventItemActive = true;
    }
  });

  const visited = new Set();
  workingTiles.forEach(tile => {
    if (tile.mechanic === 'combined' && !tile.combineGroupId && !visited.has(tile.id)) {
      const groupId = `combo-${tile.id}`;
      const stack = [tile];
      const group = [];
      visited.add(tile.id);
      while (stack.length) {
        const cur = stack.pop();
        group.push(cur);
        CHAIN_NEIGHBOR_OFFSETS.forEach(o => {
          const neighbor = workingTiles.find(t2 =>
            t2.z === cur.z && t2.x === cur.x + o.dx && t2.y === cur.y + o.dy &&
            t2.mechanic === 'combined' && !t2.combineGroupId && !visited.has(t2.id)
          );
          if (neighbor) { visited.add(neighbor.id); stack.push(neighbor); }
        });
      }
      group.forEach(t => { t.combineGroupId = groupId; });
    }
  });

  workingTiles.forEach(tile => {
    if (tile.mechanic === 'ice2') tile.iceMatchesRemaining = tile.iceMatchesRemaining ?? 2;
    if (tile.mechanic === 'ice3') tile.iceMatchesRemaining = tile.iceMatchesRemaining ?? 3;
  });

  return workingTiles;
};

// ============================================================
// BYTES EXPORT — Helper Functions
// ============================================================
// Các function dưới đây port từ Python convert_level.py để đảm
// bảo output .bytes khớp 100% với format dev cần.

/**
 * Derive DifficultyNew từ difficulty_mod_band.
 * "modMedium" → "MEDIUM"
 * Fallback: "EASY"
 */
const deriveDifficultyLabel = (difficultyModBand) => {
  if (!difficultyModBand) return "EASY";
  let label = difficultyModBand;
  if (label.toLowerCase().startsWith("mod")) {
    label = label.substring(3);
  }
  return label ? label.toUpperCase() : "EASY";
};

/**
 * Build mapping z → iz bằng rank-based.
 * 
 * Ví dụ:
 * Nếu z values = [0, 0.5, 1, 1.5, 2]
 * thì mapping = {0:1, 0.5:2, 1:3, 1.5:4, 2:5}
 * 
 * Guarantees:
 * - iz luôn là positive integer
 * - Thứ tự stacking giữa tiles và gifts được bảo toàn
 * - Tương thích ngược với format cũ (chỉ integer z)
 */
const buildZToIzMap = (entities) => {
  const distinctZ = [...new Set(entities.map(e => e.z))].sort((a, b) => a - b);
  const mapping = {};
  distinctZ.forEach((z, idx) => {
    mapping[z] = idx + 1;
  });
  return mapping;
};

/**
 * Build mapping (icon, color) → id.
 * 
 * ID được gán động theo thứ tự tiles xuất hiện trong file export.
 * Range: 1001-1020 (tối đa 20 combinations).
 * 
 * Lý do dùng động: Tool Builder có bộ icon riêng, không khớp
 * với bộ icon của game chính thức. Dev sẽ map ID → icon/color thực
 * ở tầng game engine.
 */
const buildIconColorIdMap = (tileEntities) => {
  const mapping = {};
  let nextId = BYTES_ID_RANGE_START;
  
  for (const tile of tileEntities) {
    const key = `${tile.icon}_${tile.color}`;
    if (!(key in mapping)) {
      if (nextId > BYTES_ID_RANGE_END) {
        throw new Error(
          `Quá nhiều cặp (icon, color): vượt quá ${BYTES_ID_RANGE_END - BYTES_ID_RANGE_START + 1} combinations. ` +
          `Max ID = ${BYTES_ID_RANGE_END}.`
        );
      }
      mapping[key] = nextId;
      nextId++;
    }
  }
  
  return mapping;
};

/**
 * Convert 1 tile entity từ export format → bytes format.
 */
const convertTileToBytes = (tile, iconColorMap, zToIzMap) => {
  const key = `${tile.icon}_${tile.color}`;
  
  const out = {
    id: iconColorMap[key],
    ix: tile.x,
    iy: tile.y,
    iz: zToIzMap[tile.z]
  };
  
  const mechanic = tile.special_mechanic;
  if (mechanic) {
    const name = mechanic.name;
    
    if (name === "hidden") {
      out.isBackUp = true;
    } else if (name === "eventItem") {
      // Event Item → Break tile với start index = 0
      // Lưu ý: hard-coded 0, bỏ qua moves_required trong source
      out.indexBreakTileStart = 0;
    }
    // ice2, ice3, combined, chained1, chained2, blocker: bỏ qua
  }
  
  return out;
};

/**
 * Convert 1 gift entity từ export format → bytes format.
 */
const convertGiftToBytes = (gift, zToIzMap) => {
  const size = gift.size || {};
  const cols = size.cols || 0;
  const rows = size.rows || 0;
  
  return {
    ix: gift.x,
    iy: gift.y,
    iz: zToIzMap[gift.z],
    visual: 0,
    size: Math.max(cols, rows)
  };
};

/**
 * Convert level export JSON → bytes object.
 * 
 * @param {Object} levelExport - output của buildExportJsonPayload
 * @returns {Object} bytes object với version marker ở đầu
 */
const convertToBytes = (levelExport) => {
  const entities = levelExport.map_info?.tiles || [];
  
  // Filter entities
  const tileEntities = entities.filter(e => 
    !e.entity_type || e.entity_type === "tile"
  );
  const giftEntities = entities.filter(e => 
    e.entity_type === "gift"
  );
  
  // Build maps
  const zToIzMap = buildZToIzMap(entities);
  const iconColorMap = buildIconColorIdMap(tileEntities);
  
  // Convert
  const outTiles = tileEntities.map(t => convertTileToBytes(t, iconColorMap, zToIzMap));
  const outGifts = giftEntities.map(g => convertGiftToBytes(g, zToIzMap));
  
  // Metadata
  const difficultyBand = levelExport.difficulty?.difficulty_mod_band;
  
  // Final output — version marker ở ĐẦU file
  return {
    bytes_version: BYTES_VERSION,
    tiles: outTiles,
    gifts: outGifts,
    DifficultyNew: deriveDifficultyLabel(difficultyBand)
  };
};

export default function App() {
  const [mode, setMode] = useState('edit');
  const [levelNum, setLevelNum] = useState(1);
  const [tiles, setTiles] = useState([]);

  const [activeLayer, setActiveLayer] = useState(0);
  const [activeGiftLayer, setActiveGiftLayer] = useState(0.5)
  const [layerViewMode, setLayerViewMode] = useState('all'); // 'all' | 'cumulative' | 'isolated'
  const [selectedTool, setSelectedTool] = useState('place');
  const [difficultyMods, setDifficultyMods] = useState(INITIAL_DIFFICULTY_MODS);
  const [difficultyMod, setDifficultyMod] = useState('modMedium');
  const [isModEditorOpen, setIsModEditorOpen] = useState(false);
  const [eventItemMisses, setEventItemMisses] = useState(0)
  const [giftPlacementMode, setGiftPlacementMode] = useState(null); // 'gift2x1' | 'gift2x2' | 'gift2x3' | null
  const [eventItemsCollected, setEventItemsCollected] = useState(0);
  const [giftsRevealed, setGiftsRevealed] = useState(0);

  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isBytesModalOpen, setIsBytesModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState(null);
  const [importPreview, setImportPreview] = useState(null);

  const [iconColorRatio, setIconColorRatio] = useState({ themeIconRatio: 85, colorIconRatio: 15 });

  const [suggestParams, setSuggestParams] = useState({
    targetTiles: 45,
    layers: 3,
    stackRatio: 30,
    diagonalRatio: 30,
    layoutShape: 'pyramid',
    hiddenPct: 10,
    chained1Pct: 5,
    chained2Pct: 5,
    icePct: 10,
    combinedPct: 5,
    combinedMaxSize: 4,
    enableeventItemLeaf: true
  });

  const [distributionPattern, setDistributionPattern] = useState('themeFocus');
  const [hybridSub1, setHybridSub1] = useState('themeFocus');
  const [hybridSub2, setHybridSub2] = useState('colorScatter');

  const [selectedMechanic, setSelectedMechanic] = useState('normal');
  const [activeTooltip, setActiveTooltip] = useState(null);

  const [playTiles, setPlayTiles] = useState([]);
  const [container, setContainer] = useState([]);
  const [gameState, setGameState] = useState('playing');

  const matchableCount = tiles.filter(t => !t.isGift).length;
  const isPlayable = matchableCount > 0 && matchableCount % 3 === 0;

  // Sync default icon ratios when distribution pattern changes
  useEffect(() => {
    if (distributionPattern === 'hybrid') {
      const r1 = DISTRIBUTION_PATTERNS[hybridSub1]?.defaultRatio || { themeIconRatio: 50, colorIconRatio: 50 };
      const r2 = DISTRIBUTION_PATTERNS[hybridSub2]?.defaultRatio || { themeIconRatio: 50, colorIconRatio: 50 };
      setIconColorRatio({
        themeIconRatio: Math.round((r1.themeIconRatio + r2.themeIconRatio) / 2),
        colorIconRatio: Math.round((r1.colorIconRatio + r2.colorIconRatio) / 2)
      });
    } else {
      const def = DISTRIBUTION_PATTERNS[distributionPattern]?.defaultRatio;
      if (def) {
        setIconColorRatio({ ...def });
      }
    }
  }, [distributionPattern, hybridSub1, hybridSub2]);

  useEffect(() => {
    executeSuggestLevel(suggestParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tryPlaceCombineCluster = (anchorX, anchorY, layerTilesSoFar, maxSize, remainingSlots) => {
    const candidates = COMBINE_SHAPES
      .filter(s => s.size <= maxSize && s.size <= remainingSlots)
      .sort(() => Math.random() - 0.5);

    for (const shape of candidates) {
      const cells = shape.offsets.map(o => ({ x: anchorX + o.dx, y: anchorY + o.dy }));
      const valid = cells.every(c =>
        c.x >= 2 && c.x <= 20 && c.y >= 2 && c.y <= 20 &&
        !layerTilesSoFar.some(t => t.x === c.x && t.y === c.y)
      );
      if (valid) return cells;
    }
    return null;
  };

  const executeSuggestLevel = (params) => {
    const generatedTiles = [];
    let id = 0;

    const numLayers = Math.min(Math.max(Number(params.layers) || 3, 2), 5);
    const targetCount = Math.min(Math.max(Number(params.targetTiles) || 30, 9), 150);
    const adjustedTarget = Math.floor(targetCount / 3) * 3;
    const stackRatioVal = Number(params.stackRatio) || 30;
    const diagonalRatioVal = Number(params.diagonalRatio) || 30;
    const shape = params.layoutShape || 'pyramid';
    const combinedMaxSize = Math.min(Math.max(Number(params.combinedMaxSize) || 4, 2), 5);

    const perLayerCount = Math.ceil(adjustedTarget / numLayers);

    for (let z = 0; z < numLayers; z++) {
      const layerTiles = [];
      let placedThisLayer = 0;
      const targetForThisLayer = (z === numLayers - 1)
        ? (adjustedTarget - generatedTiles.length)
        : Math.min(perLayerCount, adjustedTarget - generatedTiles.length);

      if (targetForThisLayer <= 0) break;

      let candidateCoords = [];
      let seedX = 10, seedY = 10;

      if (shape === 'pyramid') {
        const margin = z * 2;
        seedX = 10; seedY = 10;
        const start = 2 + margin;
        const end = 20 - margin;
        for (let y = start; y <= end; y += 2) {
          for (let x = start; x <= end; x += 2) {
            candidateCoords.push({ x, y });
          }
        }
      } else if (shape === 'clusterCluster') {
        const centers = [
          { cx: 6 + z, cy: 6 }, { cx: 14 - z, cy: 6 },
          { cx: 10, cy: 12 + (z % 2) }, { cx: 6, cy: 15 }
        ];
        const chosenCenter = centers[z % centers.length];
        seedX = chosenCenter.cx; seedY = chosenCenter.cy;
        centers.forEach(c => {
          for (let dx = -3; dx <= 3; dx += 2) {
            for (let dy = -3; dy <= 3; dy += 2) {
              const nx = Math.max(2, Math.min(20, c.cx + dx));
              const ny = Math.max(2, Math.min(20, c.cy + dy));
              candidateCoords.push({ x: nx, y: ny });
            }
          }
        });
      } else if (shape === 'spiralWave') {
        seedX = 6 + (z * 2); seedY = 10;
        for (let i = 0; i < 24; i++) {
          const x = 3 + (i * 1.5) % 15;
          const y = Math.floor(5 + Math.sin(i * 0.8 + z) * 5 + 5);
          const snappedX = Math.round(x / 2) * 2;
          const snappedY = Math.round(y / 2) * 2;
          candidateCoords.push({ x: Math.max(2, Math.min(20, snappedX)), y: Math.max(2, Math.min(20, snappedY)) });
        }
      } else {
        seedX = z % 2 === 0 ? 6 : 14; seedY = 10;
        for (let y = 4; y <= 18; y += 2) {
          for (let x = 2; x <= 20; x += 2) {
            if (Math.abs(x - 10) > 2 + z) candidateCoords.push({ x, y });
          }
        }
      }

      const coordKey = (x, y) => `${x},${y}`;
      const candidateSet = new Set(candidateCoords.map(c => coordKey(c.x, c.y)));

      let seed = candidateCoords.reduce((closest, current) => {
        const distClosest = Math.abs(closest.x - seedX) + Math.abs(closest.y - seedY);
        const distCurrent = Math.abs(current.x - seedX) + Math.abs(current.y - seedY);
        return distCurrent < distClosest ? current : closest;
      }, candidateCoords[0] || { x: 10, y: 10 });

      const chosen = [seed];
      const chosenKeys = new Set([coordKey(seed.x, seed.y)]);
      let frontier = [seed];

      const GROW_OFFSETS = [
        { dx: 2, dy: 0 }, { dx: -2, dy: 0 }, { dx: 0, dy: 2 }, { dx: 0, dy: -2 },
        { dx: 2, dy: 2 }, { dx: -2, dy: -2 }, { dx: 2, dy: -2 }, { dx: -2, dy: 2 },
        { dx: 4, dy: 0 }, { dx: -4, dy: 0 }, { dx: 0, dy: 4 }, { dx: 0, dy: -4 }
      ];

      while (chosen.length < targetForThisLayer && frontier.length > 0) {
        const idx = Math.floor(Math.random() * frontier.length);
        const current = frontier.splice(idx, 1)[0];
        const shuffledOffsets = [...GROW_OFFSETS].sort(() => Math.random() - 0.5);

        for (const offset of shuffledOffsets) {
          if (chosen.length >= targetForThisLayer) break;
          const nx = current.x + offset.dx;
          const ny = current.y + offset.dy;
          if (nx >= 2 && nx <= 20 && ny >= 2 && ny <= 20) {
            const key = coordKey(nx, ny);
            if (candidateSet.has(key) && !chosenKeys.has(key)) {
              chosen.push({ x: nx, y: ny });
              chosenKeys.add(key);
              frontier.push({ x: nx, y: ny });
            }
          }
        }
      }

      if (chosen.length < targetForThisLayer) {
        const remaining = candidateCoords
          .filter(c => !chosenKeys.has(coordKey(c.x, c.y)))
          .sort(() => Math.random() - 0.5);
        for (const c of remaining) {
          if (chosen.length >= targetForThisLayer) break;
          chosen.push(c);
          chosenKeys.add(coordKey(c.x, c.y));
        }
      }

      for (let i = 0; i < chosen.length && placedThisLayer < targetForThisLayer; i++) {
        const coord = chosen[i];
        if (layerTiles.some(t => t.x === coord.x && t.y === coord.y)) continue;

        let posX = coord.x;
        let posY = coord.y;

        if (z > 0 && generatedTiles.filter(t => t.z === z - 1).length > 0) {
          const lowerLayerTiles = generatedTiles.filter(t => t.z === z - 1);
          const baseTile = lowerLayerTiles[Math.floor(Math.random() * lowerLayerTiles.length)];

          const rollCover = Math.random() * 100;
          if (rollCover < stackRatioVal) {
            posX = baseTile.x;
            posY = baseTile.y;
          } else if (rollCover < stackRatioVal + diagonalRatioVal) {
            const offsets = [{ dx: 1, dy: 1 }, { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }];
            const offset = offsets[Math.floor(Math.random() * offsets.length)];
            posX = Math.max(2, Math.min(20, baseTile.x + offset.dx));
            posY = Math.max(2, Math.min(20, baseTile.y + offset.dy));
          }
        }

        let mech = 'normal';
        let clusterCells = null;
        const rollMech = Math.random() * 100;
        const pHidden = Number(params.hiddenPct) || 0;
        const pChained1 = Number(params.chained1Pct) || 0;
        const pChained2 = Number(params.chained2Pct) || 0;
        const pIce = Number(params.icePct) || 0;
        const pCombined = Number(params.combinedPct) || 0;

        if (z > 0 && rollMech < pHidden) {
          mech = 'hidden';
        } else if (rollMech < pHidden + pChained1) {
          mech = 'chained1';
        } else if (rollMech < pHidden + pChained1 + pChained2) {
          mech = 'chained2';
        } else if (rollMech < pHidden + pChained1 + pChained2 + pIce) {
          mech = Math.random() > 0.5 ? 'ice2' : 'ice3';
        } else if (rollMech < pHidden + pChained1 + pChained2 + pIce + pCombined) {
          const remainingSlots = targetForThisLayer - placedThisLayer;
          clusterCells = tryPlaceCombineCluster(posX, posY, layerTiles, combinedMaxSize, remainingSlots);
          mech = clusterCells ? 'combined' : 'normal';
        }

        if (clusterCells) {
          clusterCells.forEach(cell => {
            layerTiles.push({ id: `gen-${id++}`, x: cell.x, y: cell.y, z, mechanic: 'combined' });
            placedThisLayer++;
          });
        } else {
          layerTiles.push({ id: `gen-${id++}`, x: posX, y: posY, z, mechanic: mech });
          placedThisLayer++;
        }
      }

      generatedTiles.push(...layerTiles);
    }

    let remainder = generatedTiles.length % 3;
    if (remainder !== 0) {
      for (let i = generatedTiles.length - 1; i >= 0 && remainder > 0; i--) {
        generatedTiles.splice(i, 1);
        remainder--;
      }
    }

    if (params.enableeventItemLeaf) {
      const normalTiles = generatedTiles.filter(t => t.mechanic === 'normal');
      if (normalTiles.length >= 3) {
        const shuffled = [...normalTiles].sort(() => Math.random() - 0.5);
        for (let i = 0; i < 3; i++) {
          const target = generatedTiles.find(t => t.id === shuffled[i].id);
          if (target) {
            target.mechanic = 'eventItem';
            target.movesRemaining = 4;
          }
        }
      }
    }

    setTiles(generatedTiles);
    setIsSuggestModalOpen(false);
  };

  const generateRandomLayout = () => {
    executeSuggestLevel(suggestParams);
  };

  const startPlayMode = () => {
    if (!isPlayable) return;

    const resolvedTiles = resolveSpecialMechanics(tiles.filter(t => !t.isGift));

    // Split matchable vs event items
    const eventItemTiles = resolvedTiles.filter(t => t.mechanic === 'eventItem');
    const otherMatchable = resolvedTiles.filter(t => t.mechanic !== 'eventItem');
    const totalMatchable = otherMatchable.length + eventItemTiles.length;
    
    if (totalMatchable % 3 !== 0) {
      alert(`Matchable tiles (${totalMatchable}) phải chia hết cho 3.`);
      return;
    }

    const modConfig = difficultyMods[difficultyMod];
    const allPossible = [];
    Object.keys(ICONS).forEach(icon => COLORS.forEach(c => allPossible.push({ i: icon, c: c.id })));
    const shuffledVariants = [...allPossible].sort(() => Math.random() - 0.5);
    const pool = shuffledVariants.slice(0, Math.min(modConfig.variants, shuffledVariants.length));

    const triplets = [];
    const numSets = totalMatchable / 3;
    for (let i = 0; i < numSets; i++) {
      const v = pool[Math.floor(Math.random() * pool.length)];
      triplets.push(v, v, v);
    }
    triplets.sort(() => Math.random() - 0.5);

    let tIndex = 0;
    const initializedPlayTiles = resolvedTiles.map(t => {
      const assigned = triplets[tIndex++];
      return {
        ...t,
        baseIcon: assigned.i,
        color: assigned.c,
        iceMatchesRemaining: t.mechanic === 'ice3' ? 3 : t.mechanic === 'ice2' ? 2 : undefined,
        chainClearedCount: t.mechanic === 'chained1' || t.mechanic === 'chained2' ? 0 : undefined,
        isRevealed: t.mechanic !== 'hidden',
        movesRemaining: t.mechanic === 'eventItem' ? 4 : undefined,
        isEventItemActive: t.mechanic === 'eventItem'
      };
    });

    // NEW: Add gifts as-is (no icon assignment — they're objectives)
    const giftTiles = tiles.filter(t => t.isGift).map(g => ({
      ...g,
      isRevealedInPlay: false   // Track reveal state during play
    }));

    setMode('play');
    setGameState('playing');
    setContainer([]);
    setEventItemsCollected(0);
    setGiftsRevealed(0);
    setPlayTiles([...initializedPlayTiles, ...giftTiles]);
  };

  const stopPlayMode = () => {
    setMode('edit');
  };

  const handleTileClick = (tile) => {
  if (mode === 'edit') return;
  if (gameState !== 'playing') return;
  if (!isTileFree(tile, playTiles)) return;

  let workingBoard = [...playTiles];
  if (tile.mechanic === 'hidden' && !tile.isRevealed) {
    workingBoard = workingBoard.map(t => t.id === tile.id ? { ...t, isRevealed: true } : t);
    tile = { ...tile, isRevealed: true };
  }

  const groupTiles = tile.mechanic === 'combined' && tile.combineGroupId
    ? workingBoard.filter(t => t.combineGroupId === tile.combineGroupId)
    : [tile];

  workingBoard = workingBoard.filter(t => !groupTiles.some(g => g.id === t.id));
  let workingContainer = [...container];
  let anyMatchOccurred = false;
  let matchedEventItemCount = 0;
  let matchedEventItemWithinWindow = 0;

  groupTiles.forEach(gTile => {
    const matchIndex = workingContainer.findLastIndex(t => t.baseIcon === gTile.baseIcon && t.color === gTile.color);
    if (matchIndex !== -1) {
      workingContainer.splice(matchIndex + 1, 0, gTile);
    } else {
      workingContainer.push(gTile);
    }

    for (let i = 0; i <= workingContainer.length - 3; i++) {
      if (
        workingContainer[i].baseIcon === workingContainer[i + 1].baseIcon &&
        workingContainer[i].baseIcon === workingContainer[i + 2].baseIcon &&
        workingContainer[i].color === workingContainer[i + 1].color &&
        workingContainer[i].color === workingContainer[i + 2].color
      ) {
        const matchedTriplet = workingContainer.splice(i, 3);
        anyMatchOccurred = true;

        // Count event items in matched triplet
        matchedTriplet.forEach(mt => {
          if (mt.mechanic === 'eventItem') {
            matchedEventItemCount++;
            if ((mt.crackCount ?? 0) > 0) {
              matchedEventItemWithinWindow++;
            }
          }
        });
        break;
      }
    }
  });

  // Update chain links
  const removedIds = new Set(groupTiles.map(t => t.id));
    workingBoard = workingBoard.map(t => {
      if ((t.mechanic === 'chained1' || t.mechanic === 'chained2') && Array.isArray(t.chainLinks)) {
        const clearedNow = t.chainLinks.filter(id => removedIds.has(id)).length;
        if (clearedNow > 0) return { ...t, chainClearedCount: (t.chainClearedCount || 0) + clearedNow };
      }
      return t;
    });

    if (anyMatchOccurred) {
        workingBoard = workingBoard.map(t => {
          if ((t.mechanic === 'ice2' || t.mechanic === 'ice3') && (t.iceMatchesRemaining || 0) > 0) {
            const isPhysicallyFree = !isTileCoveredByOther(t, workingBoard) && !isChainLocked(t);
            if (isPhysicallyFree) {
              return { ...t, iceMatchesRemaining: t.iceMatchesRemaining - 1 };
            }
          }
          return t;
        });
      }

      // EVENT ITEM: decrement crackCount for all event items (each match ticks all of them)
      workingBoard = workingBoard.map(t => {
        if (t.mechanic === 'eventItem' && t.isEventItemActive && (t.movesRemaining ?? 0) > 0) {
          const newRemaining = (t.movesRemaining || 0) - 1;
          if (newRemaining <= 0) {
            // Time expired → turn into normal tile (icon + color retained)
            return {
              ...t,
              movesRemaining: 0,
              isEventItemActive: false,
              mechanic: 'normal'
            };
          }
          return { ...t, movesRemaining: newRemaining };
        }
        return t;
      });

    // Award event item collection points
    if (matchedEventItemCount > 0) {
      // +2 per event item collected while still active (crackCount > 0)
      // +1 per event item collected after turned normal (crackCount = 0)
      const withinWindowPoints = matchedEventItemWithinWindow * 2;
      const afterWindowPoints = (matchedEventItemCount - matchedEventItemWithinWindow) * 1;
      setEventItemsCollected(prev => prev + withinWindowPoints + afterWindowPoints);
    }
    const giftsInLevel = playTiles.filter(t => t.isGift);

    // Identify which gifts are STILL blocked after this move
    const stillBlocked = giftsInLevel.filter(g => isGiftBlocked(g, workingBoard));

    // Gifts that are NOT blocked → now free → reveal & remove
    const newlyRevealedIds = new Set(
      giftsInLevel
        .filter(g => !stillBlocked.some(b => b.id === g.id))
        .map(g => g.id)
    );

    // Sync tray counter immediately
    const revealedCount = giftsInLevel.length - stillBlocked.length;
    if (revealedCount !== giftsRevealed) {
      setGiftsRevealed(revealedCount);
    }

    // Remove revealed gifts from board (skip animation for simplicity)
    if (newlyRevealedIds.size > 0) {
      workingBoard = workingBoard.filter(t => !newlyRevealedIds.has(t.id));
    }

    setPlayTiles(workingBoard);
    setContainer(workingContainer);

    // WIN/LOSS
    const remainingTiles = workingBoard.filter(t => !t.isGift);
    const remainingGifts = workingBoard.filter(t => t.isGift);
    const totalGiftsInLevel = giftsInLevel.length;
    const allGiftsRevealed = totalGiftsInLevel > 0 && remainingGifts.length === 0;

    if (workingContainer.length >= 7) {
      setGameState('lost');
    } else if (totalGiftsInLevel > 0) {
      if (allGiftsRevealed) setGameState('won');
    } else {
      if (remainingTiles.length === 0) setGameState('won');
    }
  };

  const handleGridClick = (x, y) => {
    if (mode !== 'edit' || isSuggestModalOpen) return;

    // GIFT PLACEMENT MODE
    // GIFT PLACEMENT MODE — uses activeGiftLayer instead of activeLayer
    if (giftPlacementMode) {
      const size = GIFT_SIZES[giftPlacementMode];
      if (!size) return;

      const snappedX = Math.floor(x / 2) * 2;
      const snappedY = Math.floor(y / 2) * 2;

      const endX = snappedX + (size.cols - 1) * 2;
      const endY = snappedY + (size.rows - 1) * 2;
      if (endX > 22 || endY > 22) {
        alert(`Gift ${size.name} vượt quá biên. Chọn vị trí khác.`);
        return;
      }

      // Gifts live at z = 0.5, 1.5, 2.5, 3.5, 4.5 — always between tile layers
      const giftZ = activeGiftLayer;

      // Collision check: only check against other gifts (tiles are on separate integer layers)
      const newGift = {
        id: `gift-${generateId()}`,
        x: snappedX,
        y: snappedY,
        z: giftZ,
        mechanic: giftPlacementMode,
        giftCols: size.cols,
        giftRows: size.rows,
        isGift: true
      };

      const collides = tiles.some(t => {
        if (!t.isGift) return false;
        if (t.z !== giftZ) return false;
        const tCols = GIFT_SIZES[t.mechanic]?.cols || 1;
        const tRows = GIFT_SIZES[t.mechanic]?.rows || 1;
        const tWidth = (tCols - 1) * 2 + 1;
        const tHeight = (tRows - 1) * 2 + 1;
        const newWidth = (size.cols - 1) * 2 + 1;
        const newHeight = (size.rows - 1) * 2 + 1;
        return !(
          snappedX + newWidth <= t.x ||
          snappedX >= t.x + tWidth ||
          snappedY + newHeight <= t.y ||
          snappedY >= t.y + tHeight
        );
      });

      if (collides) {
        alert('Vị trí này đã có Gift khác trên cùng Gift Layer.');
        return;
      }

      setTiles([...tiles, newGift]);
      setGiftPlacementMode(null);
      setSelectedMechanic('normal');
      return;
    }

    // NORMAL PLACE/ERASE
    if (selectedTool === 'place') {
      const occupied = tiles.some(t => t.z === activeLayer && isOverlapping(t, { x, y }));
      if (!occupied) {
        setTiles([...tiles, {
          id: generateId(), x, y, z: activeLayer,
          mechanic: selectedMechanic,
          movesRemaining: selectedMechanic === 'eventItem' ? 4 : undefined
        }]);
      }
    } else if (selectedTool === 'erase') {
      const clickedTiles = tiles.filter(t => {
        if (t.isGift) {
          const size = GIFT_SIZES[t.mechanic];
          if (!size) return false;
          const endX = t.x + (size.cols - 1) * 2;
          const endY = t.y + (size.rows - 1) * 2;
          return x >= t.x && x <= endX && y >= t.y && y <= endY;
        }
        return isOverlapping(t, { x, y }) && t.z === activeLayer;
      }).sort((a, b) => b.z - a.z);
      if (clickedTiles.length > 0) {
        setTiles(tiles.filter(t => t.id !== clickedTiles[0].id));
      }
    }
  };

  const buildExportJsonPayload = useMemo(() => {
    const modConfig = difficultyMods[difficultyMod] || difficultyMods.modMedium;

    // ─────────────────────────────────────────────────────────────
    // STEP 1: Separate gifts from tiles
    // ─────────────────────────────────────────────────────────────
    const rawGifts = tiles.filter(t => t.isGift);
    const rawTiles = tiles.filter(t => !t.isGift);
    const resolvedTiles = resolveSpecialMechanics(rawTiles);

    // ─────────────────────────────────────────────────────────────
    // STEP 2: Build icon/color pool from variant count
    // ─────────────────────────────────────────────────────────────
    const allPossibleIcons = [];
    Object.keys(ICONS).forEach(icon =>
      COLORS.forEach(c => allPossibleIcons.push({ icon, color: c.id }))
    );
    const shuffledVariants = [...allPossibleIcons].sort(() => Math.random() - 0.5);
    const variantPool = shuffledVariants.slice(
      0,
      Math.min(modConfig.variants, shuffledVariants.length)
    );

    // ─────────────────────────────────────────────────────────────
    // STEP 3: Assign triplets to tiles (event items still consume a triplet)
    // ─────────────────────────────────────────────────────────────
    const matchableTiles = resolvedTiles.filter(t => t.mechanic !== 'eventItem');
    const totalMatchable = matchableTiles.length;
    const tripletCount = Math.floor(totalMatchable / 3);

    const poolTriplets = [];
    for (let i = 0; i < tripletCount; i++) {
      const chosenVariant = variantPool[Math.floor(Math.random() * variantPool.length)];
      poolTriplets.push(chosenVariant, chosenVariant, chosenVariant);
    }

    const shuffledTriplets = [...poolTriplets].sort(() => Math.random() - 0.5);

    // ─────────────────────────────────────────────────────────────
    // STEP 4: Serialize tiles (no gifts in this loop)
    // ─────────────────────────────────────────────────────────────
    let tripletIdx = 0;
    const serializedTileItems = resolvedTiles.map(tile => {
      const assigned = shuffledTriplets[tripletIdx++];
      const iconInfo = assigned || { icon: 'Star', color: 'red' };

      const item = {
        entity_type: 'tile',
        tile_id: tile.id,
        x: tile.x,
        y: tile.y,
        z: tile.z,               // Integer for tiles
        icon: iconInfo.icon,
        color: iconInfo.color
      };

      if (tile.mechanic && tile.mechanic !== 'normal') {
        const mechanicData = { name: tile.mechanic };

        if (tile.mechanic === 'chained1' || tile.mechanic === 'chained2') {
          mechanicData.chain_level = tile.chainLevel || (tile.mechanic === 'chained2' ? 2 : 1);
          mechanicData.chain_links = tile.chainLinks || [];
        } else if (tile.mechanic === 'ice2' || tile.mechanic === 'ice3') {
          mechanicData.ice_matches_required = tile.mechanic === 'ice3' ? 3 : 2;
        } else if (tile.mechanic === 'combined') {
          mechanicData.combine_group_id = tile.combineGroupId || null;
        } else if (tile.mechanic === 'eventItem') {
          mechanicData.moves_required = 4;
          mechanicData.collect_value_within_window = 2;
          mechanicData.collect_value_after_window = 1;
        }

        item.special_mechanic = mechanicData;
      }

      return item;
  });

  // ─────────────────────────────────────────────────────────────
  // STEP 5: Serialize gifts (separate from tiles, fractional z)
  // ─────────────────────────────────────────────────────────────
  const serializedGiftItems = rawGifts.map(gift => {
    const size = GIFT_SIZES[gift.mechanic] || { cols: 2, rows: 1 };
    return {
      entity_type: 'gift',
      gift_id: gift.id,
      x: gift.x,
      y: gift.y,
      z: gift.z,               // Fractional (0.5, 1.5, 2.5, 3.5, 4.5)
      size: { cols: size.cols, rows: size.rows }
    };
  });

  // ─────────────────────────────────────────────────────────────
  // STEP 6: Combine + sort (by z ascending, specials last within same z)
  // ─────────────────────────────────────────────────────────────
  const combined = [...serializedTileItems, ...serializedGiftItems];

  const sortedSerializedItems = combined.sort((a, b) => {
    if (a.z !== b.z) return a.z - b.z;

    const aIsSpecial = !!a.special_mechanic;
    const bIsSpecial = !!b.special_mechanic;
    if (aIsSpecial !== bIsSpecial) {
      return aIsSpecial ? 1 : -1;
    }
    return 0;
  });

  // ─────────────────────────────────────────────────────────────
  // STEP 7: Compute metadata
  // ─────────────────────────────────────────────────────────────
  const totalTilesCount = serializedTileItems.length;
  const totalGiftsCount = serializedGiftItems.length;
  const totalEventItemsCount = resolvedTiles.filter(t => t.mechanic === 'eventItem').length;
  const maxZ = sortedSerializedItems.length > 0
    ? Math.max(...sortedSerializedItems.map(t => t.z))
    : 0;

  // ─────────────────────────────────────────────────────────────
  // STEP 8: Return payload
  // ─────────────────────────────────────────────────────────────
  return {
    level_id: levelNum,
    difficulty: {
      difficulty_mod_band: difficultyMod,
      variants_pool_size: modConfig.variants,
      distribution_pattern: distributionPattern,
      icon_color_ratios: iconColorRatio,
      initial_matches_on_start: modConfig.startingMatches,
      multiplier: modConfig.multiplier
    },
    map_info: {
      total_tiles: totalTilesCount,
      total_gifts: totalGiftsCount,
      total_event_items: totalEventItemsCount,
      max_z_layers: maxZ + 1,     // +1 because z is 0-indexed (max z=4 → 5 layers)
      tiles: sortedSerializedItems
    },
    dev_note: "Generated via TilesBuilderTester Engine. Gifts are separate goal entities on fractional gift layers (0.5, 1.5, ...). Tiles use integer layers. Event Items require 4 matches; award 2 points while active, 1 point after."
  };
}, [tiles, levelNum, difficultyMod, difficultyMods, distributionPattern, iconColorRatio]);

  const buildBytesPayload = useMemo(() => {
    try {
      return convertToBytes(buildExportJsonPayload);
    } catch (err) {
      console.error("Bytes conversion error:", err);
      return {
        bytes_version: BYTES_VERSION,
        tiles: [],
        gifts: [],
        DifficultyNew: "EASY",
        _error: err.message
      };
    }
  }, [buildExportJsonPayload]);
  
  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(buildExportJsonPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `level_${levelNum}_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyJson = () => {
    const jsonString = JSON.stringify(buildExportJsonPayload, null, 2);
    const textarea = document.createElement('textarea');
    textarea.value = jsonString;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      alert('Đã copy toàn bộ JSON Level vào clipboard!');
    } catch (err) {
      console.error('Copy failed', err);
    }
    document.body.removeChild(textarea);
  };

  const handleDownloadBytes = () => {
    if (buildBytesPayload._error) {
      alert(`Không thể export .bytes:\n${buildBytesPayload._error}`);
      return;
    }
    
    const jsonString = JSON.stringify(buildBytesPayload, null, 2);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonString);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Level${levelNum}.bytes`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyBytes = () => {
    if (buildBytesPayload._error) {
      alert(`Không thể copy .bytes:\n${buildBytesPayload._error}`);
      return;
    }
    
    const jsonString = JSON.stringify(buildBytesPayload, null, 2);
    const textarea = document.createElement('textarea');
    textarea.value = jsonString;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      alert(`Đã copy .bytes (Level ${levelNum}) vào clipboard!\n` +
            `Tiles: ${buildBytesPayload.tiles.length}\n` +
            `Gifts: ${buildBytesPayload.gifts.length}\n` +
            `Difficulty: ${buildBytesPayload.DifficultyNew}`);
    } catch (err) {
      console.error('Copy failed', err);
    }
    document.body.removeChild(textarea);
  };

  const difficultyStats = useMemo(() => {
    const allTiles = mode === 'play' ? playTiles : tiles;
    const activeTiles = allTiles.filter(t => !t.isGift);
    const defaultStats = {
      total: 0, staticTotal: 0, coreSubtotal: 0, specialSubtotal: 0,
      breakdown: { tileCount: 0, icons: 0, colors: 0, stackCovers: 0, diagCovers: 0, mechanics: 0, maiPenalty: 0 },
      mai: WEIGHTS.mai.sweetSpot.toFixed(2),
      startingMatchesCount: 0, stackCoversCount: 0, diagCoversCount: 0,
      iconQuantities: {}, colorQuantities: {}, mechanicCounts: {}
    };

    if (!activeTiles || activeTiles.length === 0) return defaultStats;

    const breakdown = { tileCount: 0, icons: 0, colors: 0, stackCovers: 0, diagCovers: 0, mechanics: 0, maiPenalty: 0 };
    const mechanicCounts = {};

    const tCount = activeTiles.length;
    let tWeight = WEIGHTS.tileCount.base;
    if (tCount > 100) tWeight = WEIGHTS.tileCount.highCount;
    else if (levelNum <= 10) tWeight = WEIGHTS.tileCount.earlyLevel;
    breakdown.tileCount = tCount * tWeight;

    const modConfig = difficultyMods[difficultyMod] || difficultyMods.modMedium;

    let patFactor = 1.0;
    if (distributionPattern === 'hybrid') {
      const f1 = DISTRIBUTION_PATTERNS[hybridSub1]?.iconWeightFactor || 1.1;
      const f2 = DISTRIBUTION_PATTERNS[hybridSub2]?.iconWeightFactor || 1.3;
      patFactor = (f1 + f2) / 2;
    } else if (distributionPattern === 'random') {
      patFactor = 1.2;
    } else {
      patFactor = DISTRIBUTION_PATTERNS[distributionPattern]?.iconWeightFactor || 1.1;
    }

    const iconQuantities = {};
    const colorQuantities = {};
    activeTiles.forEach(t => {
      const iconKey = t.baseIcon || 'Star';
      const colorKey = t.color || 'red';
      if (t.mechanic !== 'eventItem') {
        iconQuantities[iconKey] = (iconQuantities[iconKey] || 0) + 1;
        colorQuantities[colorKey] = (colorQuantities[colorKey] || 0) + 1;
      }
      mechanicCounts[t.mechanic] = (mechanicCounts[t.mechanic] || 0) + 1;
    });

    const activeIconKeysCount = Object.keys(iconQuantities).length > 0 ? Object.keys(iconQuantities).length : Math.min(modConfig.variants, Object.keys(ICONS).length);
    const activeColorKeysCount = Object.keys(colorQuantities).length > 0 ? Object.keys(colorQuantities).length : Math.max(0, modConfig.variants - Object.keys(ICONS).length);

    breakdown.icons = activeIconKeysCount * WEIGHTS.iconCount.theme * patFactor * (iconColorRatio.themeIconRatio / 100);
    breakdown.colors = activeColorKeysCount * WEIGHTS.iconCount.color * (iconColorRatio.colorIconRatio / 100);

    let stackCoversCount = 0;
    let diagCoversCount = 0;
    activeTiles.forEach(t1 => {
      let isStacked = false;
      let isDiag = false;
      activeTiles.forEach(t2 => {
        const coverType = getCoverType(t1, t2);
        if (coverType === 'stack') isStacked = true;
        if (coverType === 'diagonal') isDiag = true;
      });
      if (isStacked) stackCoversCount++;
      else if (isDiag) diagCoversCount++;
    });

    breakdown.stackCovers = stackCoversCount * WEIGHTS.layerCount.stack;
    breakdown.diagCovers = diagCoversCount * WEIGHTS.layerCount.diagonal;

    let mechScoreTotal = 0;
    Object.entries(mechanicCounts).forEach(([mechKey, count]) => {
      const perUnitWeight = WEIGHTS.mechanics[mechKey] || 0;
      mechScoreTotal += count * perUnitWeight;
    });
    breakdown.mechanics = mechScoreTotal;

    const coreSubtotal = breakdown.tileCount + breakdown.icons + breakdown.colors + breakdown.stackCovers + breakdown.diagCovers;
    const specialSubtotal = breakdown.mechanics;
    const staticTotal = coreSubtotal + specialSubtotal;

    const freeTiles = activeTiles.filter(t => isTileFree(t, activeTiles));
    const estimatedFreeVariants = Math.min(freeTiles.length, modConfig.variants);
    let mai = estimatedFreeVariants === 0 ? WEIGHTS.mai.sweetSpot : freeTiles.length / estimatedFreeVariants;

    if (mai < WEIGHTS.mai.sweetSpot) {
      const shortfall = WEIGHTS.mai.sweetSpot - mai;
      if (mai >= WEIGHTS.mai.dangerThreshold) {
        breakdown.maiPenalty = shortfall * WEIGHTS.mai.base;
      } else {
        const dangerShortfall = WEIGHTS.mai.dangerThreshold - mai;
        const baseShortfall = WEIGHTS.mai.sweetSpot - WEIGHTS.mai.dangerThreshold;
        breakdown.maiPenalty = (baseShortfall * WEIGHTS.mai.base) +
          (dangerShortfall * WEIGHTS.mai.base * WEIGHTS.mai.dangerMultiplier);
      }
    }

    const totalRaw = staticTotal + breakdown.maiPenalty;
    const finalScore = totalRaw * modConfig.multiplier;

    return {
      total: finalScore, staticTotal, coreSubtotal, specialSubtotal, breakdown,
      mai: mai.toFixed(2),
      startingMatchesCount: modConfig.startingMatches,
      stackCoversCount, diagCoversCount, iconQuantities, colorQuantities, mechanicCounts
    };
  }, [tiles, playTiles, mode, levelNum, difficultyMod, difficultyMods, distributionPattern, hybridSub1, hybridSub2, iconColorRatio]);

    const validateImportJson = (jsonString) => {
      const errors = [];
      let parsed = null;

      // 1. Parse JSON
      try {
        parsed = JSON.parse(jsonString);
      } catch (e) {
        return { valid: false, errors: [`Invalid JSON syntax: ${e.message}`], data: null };
      }

      // 2. Check top-level structure
      if (!parsed.map_info || !Array.isArray(parsed.map_info.tiles)) {
        errors.push('Missing or invalid "map_info.tiles" array');
        return { valid: false, errors, data: null };
      }

      const rawEntries = parsed.map_info.tiles;
      if (rawEntries.length === 0) {
        errors.push('Tile array is empty');
        return { valid: false, errors, data: null };
      }

      // Split entries by entity_type so we can validate each properly
      const rawGiftEntries = rawEntries.filter(e => e.entity_type === 'gift');
      const rawTileEntries = rawEntries.filter(e => e.entity_type !== 'gift');

      // Divisible-by-3 rule applies ONLY to tiles (gifts are objectives, not matchable)
      if (rawTileEntries.length % 3 !== 0) {
        errors.push(`Tile count (${rawTileEntries.length}) must be divisible by 3 (gifts excluded — found ${rawGiftEntries.length} gifts)`);
      }

      // 3. Validate each tile
      // 3. Validate each entry — split tiles and gifts
      const validMechanics = ['chained1', 'chained2', 'ice2', 'ice3', 'combined', 'hidden', 'eventItem'];
      const validGiftTypes = ['gift2x1', 'gift2x2', 'gift2x3'];
      const validatedTiles = [];
      const validatedGifts = [];
      const tileIdMap = new Map();

      rawEntries.forEach((t, idx) => {
        // ─────────────────────────────────────────────────────────────
        // GIFT ENTITY
        // ─────────────────────────────────────────────────────────────
        if (t.entity_type === 'gift') {
          const prefix = `Gift[${idx}] (id=${t.gift_id ?? 'missing'})`;

          if (typeof t.gift_id === 'undefined') errors.push(`${prefix}: missing gift_id`);
          if (typeof t.x !== 'number' || t.x < 0 || t.x > 22) errors.push(`${prefix}: invalid x (${t.x})`);
          if (typeof t.y !== 'number' || t.y < 0 || t.y > 22) errors.push(`${prefix}: invalid y (${t.y})`);
          if (typeof t.z !== 'number' || t.z < 0 || t.z > 5) errors.push(`${prefix}: invalid z (${t.z})`);
          
          // Gift z must be fractional (0.5, 1.5, ...)
          if (typeof t.z === 'number' && t.z % 1 !== 0.5) {
            errors.push(`${prefix}: gift z must be a fractional layer (X.5), got ${t.z}`);
          }

          // Validate size
          if (!t.size || typeof t.size.cols !== 'number' || typeof t.size.rows !== 'number') {
            errors.push(`${prefix}: missing or invalid size { cols, rows }`);
          } else {
            const { cols, rows } = t.size;
            const validSizes = [
              { cols: 2, rows: 1 },
              { cols: 2, rows: 2 },
              { cols: 2, rows: 3 }
            ];
            const matchesValidSize = validSizes.some(s => s.cols === cols && s.rows === rows);
            if (!matchesValidSize) {
              errors.push(`${prefix}: unsupported gift size ${cols}×${rows} (must be 2×1, 2×2, or 2×3)`);
            }
          }

          validatedGifts.push({
            entity_type: 'gift',
            gift_id: t.gift_id,
            x: t.x,
            y: t.y,
            z: t.z,
            size: t.size
          });
          return; // Skip tile validation
        }

        // ─────────────────────────────────────────────────────────────
        // TILE ENTITY (existing logic)
        // ─────────────────────────────────────────────────────────────
        const prefix = `Tile[${idx}] (id=${t.tile_id ?? 'missing'})`;

        // Required fields
        if (typeof t.tile_id === 'undefined') errors.push(`${prefix}: missing tile_id`);
        if (typeof t.x !== 'number' || t.x < 0 || t.x > 22) errors.push(`${prefix}: invalid x (${t.x})`);
        if (typeof t.y !== 'number' || t.y < 0 || t.y > 22) errors.push(`${prefix}: invalid y (${t.y})`);
        if (typeof t.z !== 'number' || t.z < 0 || t.z > 5) errors.push(`${prefix}: invalid z (${t.z})`);

        // Tile z must be integer
        if (typeof t.z === 'number' && t.z % 1 !== 0) {
          errors.push(`${prefix}: tile z must be an integer, got ${t.z}`);
        }

        // Icon/color are optional — will be replaced with placeholders
        if (t.icon !== undefined && typeof t.icon !== 'string') errors.push(`${prefix}: icon must be string`);
        if (t.color !== undefined && typeof t.color !== 'string') errors.push(`${prefix}: color must be string`);

        // Validate special_mechanic if present
        let mechanic = 'normal';
        let mechanicData = null;

        if (t.special_mechanic) {
          if (!t.special_mechanic.name) {
            errors.push(`${prefix}: special_mechanic missing "name"`);
          } else if (!validMechanics.includes(t.special_mechanic.name)) {
            errors.push(`${prefix}: unknown mechanic "${t.special_mechanic.name}"`);
          } else {
            mechanic = t.special_mechanic.name;
            mechanicData = t.special_mechanic;

            if (mechanic === 'chained1' || mechanic === 'chained2') {
              if (!Array.isArray(mechanicData.chain_links) || mechanicData.chain_links.length === 0) {
                errors.push(`${prefix}: chained tile requires "chain_links" array`);
              }
            }
            if (mechanic === 'combined' && !mechanicData.combine_group_id) {
              errors.push(`${prefix}: combined tile requires "combine_group_id"`);
            }
            if (mechanic === 'eventItem') {
              const movesReq = mechanicData.moves_required ?? mechanicData.matches_required;
              if (typeof movesReq !== 'number' || movesReq < 1) {
                errors.push(`${prefix}: eventItem requires "moves_required" (number ≥ 1)`);
              }
            }
          }
        }

        tileIdMap.set(t.tile_id, { ...t, mechanic, mechanicData });
        validatedTiles.push({ ...t, mechanic, mechanicData });
      });

      // 4. Validate chain_links reference existing tile_ids
      validatedTiles.forEach(t => {
        if ((t.mechanic === 'chained1' || t.mechanic === 'chained2') && t.mechanicData?.chain_links) {
          t.mechanicData.chain_links.forEach(linkId => {
            if (!tileIdMap.has(linkId)) {
              errors.push(`Tile[${t.tile_id}]: chain link references missing tile_id "${linkId}"`);
            }
          });
        }
      });

      // 5. Validate eventItem leaf count = 3 if any
      const eventItemCount = validatedTiles.filter(t => t.mechanic === 'eventItem').length;
      if (eventItemCount !== 0 && eventItemCount !== 3) {
        errors.push(`eventItem Leaf tiles must be exactly 0 or 3 (found ${eventItemCount})`);
      }

      if (errors.length > 0) {
        return { valid: false, errors, data: null };
      }

      return { 
        valid: true, 
        errors: [], 
        data: { 
          parsed, 
          tiles: validatedTiles,
          gifts: validatedGifts   // ← Add gifts separately
        }
    };
  };

  // --- JSON IMPORT: CONVERT TO INTERNAL FORMAT ---
  const convertImportedToInternalFormat = (validatedTiles, validatedGifts = []) => {
    // Assign placeholder icons/colors — will be overwritten on Play
    const allPossible = [];
    Object.keys(ICONS).forEach(icon => COLORS.forEach(c => allPossible.push({ i: icon, c: c.id })));

    const convertedTiles = validatedTiles.map((t, idx) => {
      const placeholder = allPossible[idx % allPossible.length];

      const base = {
        id: t.tile_id || `import-${idx}`,
        x: t.x,
        y: t.y,
        z: t.z,
        mechanic: t.mechanic,
        baseIcon: placeholder.i,
        color: placeholder.c,
      };

      // Mechanic-specific fields
      if (t.mechanic === 'chained1' || t.mechanic === 'chained2') {
        base.chainLinks = t.mechanicData.chain_links || [];
        base.chainLevel = t.mechanicData.chain_level || (t.mechanic === 'chained2' ? 2 : 1);
        base.chainClearedCount = 0;
      }
      if (t.mechanic === 'ice2' || t.mechanic === 'ice3') {
        base.iceMatchesRemaining = t.mechanicData.ice_matches_required || (t.mechanic === 'ice3' ? 3 : 2);
      }
      if (t.mechanic === 'combined') {
        base.combineGroupId = t.mechanicData.combine_group_id;
      }
      if (t.mechanic === 'eventItem') {
        base.movesRemaining = t.mechanicData.moves_required ?? 4;
        base.hitCount = 0;
      }
      if (t.mechanic === 'hidden') {
        base.isRevealed = false;
      }

      return base;
    });

    // Convert gifts
    const convertedGifts = validatedGifts.map(g => {
      // Map size back to mechanic ID
      let mechanic = 'gift2x1';
      if (g.size.cols === 2 && g.size.rows === 2) mechanic = 'gift2x2';
      if (g.size.cols === 2 && g.size.rows === 3) mechanic = 'gift2x3';
      if (g.size.cols === 2 && g.size.rows === 1) mechanic = 'gift2x1';

      return {
        id: g.gift_id || `import-gift-${generateId()}`,
        x: g.x,
        y: g.y,
        z: g.z,
        mechanic,
        giftCols: g.size.cols,
        giftRows: g.size.rows,
        isGift: true
      };
    });

    return [...convertedTiles, ...convertedGifts];
  };

  // --- JSON IMPORT: HANDLE FILE UPLOAD ---
  const handleImportFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      setImportJsonText(text);
      const result = validateImportJson(text);
      if (result.valid) {
        setImportError(null);
        setImportPreview(result.data);
      } else {
        setImportError(result.errors);
        setImportPreview(null);
      }
    };
    reader.readAsText(file);
  };

  // --- JSON IMPORT: HANDLE TEXT PASTE ---
  const handleImportText = (text) => {
    setImportJsonText(text);
    if (!text.trim()) {
      setImportError(null);
      setImportPreview(null);
      return;
    }
    const result = validateImportJson(text);
    if (result.valid) {
      setImportError(null);
      setImportPreview(result.data);
    } else {
      setImportError(result.errors);
      setImportPreview(null);
    }
  };

  // --- JSON IMPORT: EXECUTE LOAD ---
  const handleExecuteImport = () => {
    if (!importPreview) return;

    const internalTiles = convertImportedToInternalFormat(
      importPreview.tiles,
      importPreview.gifts || []
    );

    // Set level number if provided
    if (importPreview.parsed.level_id) {
      setLevelNum(importPreview.parsed.level_id);
    }

    // Set difficulty mod if provided
    if (importPreview.parsed.difficulty?.difficulty_mod_band) {
      const modKey = importPreview.parsed.difficulty.difficulty_mod_band;
      if (difficultyMods[modKey]) {
        setDifficultyMod(modKey);
      }
    }

  setTiles(internalTiles);
  setIsImportModalOpen(false);
  setImportJsonText('');
  setImportError(null);
  setImportPreview(null);
};

  const renderTile = (tile, isPlayMode = false) => {
    const isFree = isPlayMode ? isTileFree(tile, playTiles) : isTileFree(tile, tiles);
    const isEdit = mode === 'edit';

    const isHiddenByLayerView = isEdit && (
      (layerViewMode === 'cumulative' && tile.z > activeLayer) ||
      (layerViewMode === 'isolated' && tile.z !== activeLayer)
    );

    if (isHiddenByLayerView) return null;

    let content = null;
    let bgColor = isEdit ? 'bg-slate-600' : '';
    let borderColor = isEdit ? 'border-slate-800' : '';

    // GIFT RENDERING (separate entity, not affected by layer view dimming)
    if (tile.isGift) {
      const size = GIFT_SIZES[tile.mechanic] || { cols: 2, rows: 1 };
      const activeBoard = isPlayMode ? playTiles : tiles;
      const isCovered = isGiftBlocked(tile, activeBoard);

      // ─────────────────────────────────────────────────────────────
      // EDITOR MODE: layer view filtering
      // ─────────────────────────────────────────────────────────────
      if (!isPlayMode) {
        const isHiddenByLayerView = (() => {
          if (giftPlacementMode) {
            if (layerViewMode === 'cumulative') return tile.z > activeGiftLayer;
            if (layerViewMode === 'isolated') return tile.z !== activeGiftLayer;
            return false;
          } else {
            if (layerViewMode === 'isolated') return tile.z !== activeLayer - 0.5;
            if (layerViewMode === 'cumulative') return tile.z > activeLayer;
            return false;
          }
        })();
        if (isHiddenByLayerView) return null;
      }

      const widthPx = (size.cols - 1) * 20 + 40 - 4;
      const heightPx = (size.rows - 1) * 20 + 40 - 4;
      const baseZIndex = Math.floor(tile.z) * 10 + 5;

      // ─────────────────────────────────────────────────────────────
      // EDITOR MODE RENDERING
      // ─────────────────────────────────────────────────────────────
      if (!isPlayMode) {
        return (
          <div
            key={tile.id}
            onClick={(e) => {
              e.stopPropagation();
              if (selectedTool === 'erase') {
                setTiles(tiles.filter(t => t.id !== tile.id));
              }
            }}
            className={`absolute rounded-lg shadow-lg flex items-center justify-center transition-all cursor-pointer
              ${isCovered
                ? 'bg-amber-950/70 border-2 border-amber-900 border-dashed'
                : 'bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-yellow-300'}
              ${giftPlacementMode && tile.z !== activeGiftLayer ? 'opacity-50' : ''}
              ${!giftPlacementMode && tile.z !== activeLayer - 0.5 && tile.z !== activeLayer ? 'opacity-60' : ''}
            `}
            style={{
              left: `${tile.x * 20 + 2}px`,
              top: `${tile.y * 20 + 2}px`,
              width: `${widthPx}px`,
              height: `${heightPx}px`,
              zIndex: baseZIndex
            }}
          >
            <Gift className={`w-6 h-6 ${isCovered ? 'text-amber-700/60' : 'text-white'}`} />
            <span className={`absolute bottom-0.5 right-0.5 text-[9px] font-bold ${isCovered ? 'text-amber-500/60' : 'text-white/90'}`}>
              {size.cols}×{size.rows}
            </span>
            <span className="absolute top-0.5 left-0.5 text-[8px] font-bold text-white/70">
              L{tile.z}
            </span>

            {/* Locked overlay badge */}
            {isCovered && (
              <div className="absolute -top-2 -right-2 bg-slate-900 rounded-full p-1 border border-amber-800 shadow">
                <Lock className="w-3 h-3 text-amber-600" />
              </div>
            )}
          </div>
        );
      }

      // ─────────────────────────────────────────────────────────────
      // PLAY MODE: BLOCKED (still hidden behind tiles)
      // ─────────────────────────────────────────────────────────────
      if (isCovered) {
        return (
          <div
            key={tile.id}
            className="absolute rounded-lg pointer-events-none
              border-2 border-dashed border-amber-950/50 
              bg-slate-950/80 backdrop-blur-[2px]"
            style={{
              left: `${tile.x * 20 + 2}px`,
              top: `${tile.y * 20 + 2}px`,
              width: `${widthPx}px`,
              height: `${heightPx}px`,
              zIndex: baseZIndex,
              // Darkened: user sees "something is here, but it's not ready"
              filter: 'brightness(0.3) saturate(0.5)'
            }}
          >
            <Gift className="w-6 h-6 text-slate-800 mx-auto mt-1" />
            <span className="absolute bottom-0.5 right-0.5 text-[9px] font-bold text-slate-700">
              {size.cols}×{size.rows}
            </span>
          </div>
        );
      }

      // ─────────────────────────────────────────────────────────────
      // PLAY MODE: FREE (all surrounding tiles cleared → GOAL COMPLETE)
      // ─────────────────────────────────────────────────────────────
      return (
        <div
          key={tile.id}
          className="absolute rounded-lg shadow-2xl flex items-center justify-center pointer-events-none
            bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 
            border-2 border-yellow-200
            animate-pulse"
          style={{
            left: `${tile.x * 20 + 2}px`,
            top: `${tile.y * 20 + 2}px`,
            width: `${widthPx}px`,
            height: `${heightPx}px`,
            zIndex: baseZIndex,
            boxShadow: '0 0 30px rgba(251, 191, 36, 0.95), 0 0 60px rgba(251, 191, 36, 0.5), 0 0 90px rgba(251, 191, 36, 0.3)'
          }}
        >
          {/* Sparkle icons radiating out */}
          <div className="absolute -top-2 -left-2 text-yellow-200 text-lg animate-ping">✦</div>
          <div className="absolute -top-2 -right-2 text-yellow-200 text-lg animate-ping" style={{ animationDelay: '150ms' }}>✦</div>
          <div className="absolute -bottom-2 -left-2 text-yellow-200 text-lg animate-ping" style={{ animationDelay: '300ms' }}>✦</div>
          <div className="absolute -bottom-2 -right-2 text-yellow-200 text-lg animate-ping" style={{ animationDelay: '450ms' }}>✦</div>

          <Gift className="w-8 h-8 text-white drop-shadow-lg relative z-10" strokeWidth={2.5} />
          <span className="absolute bottom-1 right-1 text-[10px] font-black text-white drop-shadow z-10">
            {size.cols}×{size.rows}
          </span>
        </div>
      );
    }

    if (isPlayMode && tile.mechanic === 'hidden' && !tile.isRevealed) {
      content = <span className="text-xl font-bold text-gray-500">?</span>;
      bgColor = 'bg-slate-700';
      borderColor = 'border-slate-600';
    } else if (tile.baseIcon && tile.color) {
      const IconCmp = ICONS[tile.baseIcon];
      const colorStyle = COLORS.find(c => c.id === tile.color);
      if (IconCmp && colorStyle) {
        content = <IconCmp className={`w-6 h-6 ${colorStyle.class}`} />;
        bgColor = colorStyle.bg;
        borderColor = colorStyle.border;
      }
    }

    let overlay = null;

    if (tile.mechanic === 'ice2' || tile.mechanic === 'ice3') {
      const req = tile.mechanic === 'ice3' ? 3 : 2;
      const remaining = isPlayMode ? (tile.iceMatchesRemaining ?? req) : req;
      if (remaining > 0) {
        overlay = (
          <div className="absolute inset-0 bg-cyan-200/60 backdrop-blur-sm border-2 border-cyan-400 rounded-lg flex items-center justify-center z-10">
            <span className="text-cyan-800 font-bold text-xs">{remaining}❄</span>
          </div>
        );
      }
    }

    if (tile.mechanic === 'chained1' || tile.mechanic === 'chained2') {
      const locked = isPlayMode ? isChainLocked(tile) : true;
      if (locked) {
        overlay = (
          <div className="absolute inset-0 border-4 border-gray-800 border-dashed rounded-lg opacity-70 z-10 pointer-events-none flex items-end justify-center pb-0.5">
            <span className="text-[9px] font-bold text-gray-200 bg-slate-900/70 px-1 rounded">
              {isPlayMode ? `${tile.chainClearedCount || 0}/${tile.chainLevel || 1}` : (tile.mechanic === 'chained2' ? 'Lv2' : 'Lv1')}
            </span>
          </div>
        );
      }
    }

    if (tile.mechanic === 'combined') {
      overlay = (
        <div className="absolute inset-0 border-2 border-teal-400 border-dotted rounded-lg z-10 pointer-events-none flex items-start justify-end p-0.5">
          <Boxes className="w-3 h-3 text-teal-300" />
        </div>
      );
    }

    if (isPlayMode && !tile.isGift) {
      const coveringGift = playTiles.find(g => 
        g.isGift && 
        g.z < tile.z && 
        tile.x >= g.x && tile.x <= g.x + (GIFT_SIZES[g.mechanic]?.cols - 1) * 2 &&
        tile.y >= g.y && tile.y <= g.y + (GIFT_SIZES[g.mechanic]?.rows - 1) * 2
      );
      if (coveringGift) {
        overlay = (
          <>
            {overlay}
            <div className="absolute top-0.5 left-0.5 z-20">
              <Lock className="w-2.5 h-2.5 text-amber-400/70" />
            </div>
          </>
        );
      }
    }

    return (
      <div
        key={tile.id}
        onClick={() => handleTileClick(tile)}
        className={`absolute w-10 h-10 rounded-lg shadow-md flex items-center justify-center cursor-pointer transition-all duration-200
          ${bgColor} ${borderColor} border-b-4
          ${isEdit && tile.z !== activeLayer ? 'opacity-40 grayscale' : 'opacity-100'}
          ${isPlayMode && !isFree ? 'brightness-50 shadow-none border-b-2' : 'hover:brightness-110 hover:-translate-y-1'}
        `}
        style={{
          left: `${tile.x * 20}px`,
          top: `${tile.y * 20}px`,
          zIndex: tile.z * 10,
          transform: `translate(${tile.z * -2}px, ${tile.z * -2}px)`
        }}
      >
        {content}
        {overlay}
        {tile.mechanic === 'eventItem' && (tile.movesRemaining ?? 0) > 0 && (
          <div className={`absolute -top-1 -right-1 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center z-20 border shadow ${
            (tile.movesRemaining ?? 0) <= 1
              ? 'bg-red-600 border-red-300 animate-pulse'
              : 'bg-amber-600 border-yellow-300'
          }`}>
            {tile.movesRemaining}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex overflow-hidden">
      <div className={`w-80 bg-slate-800/95 backdrop-blur-md border-r border-slate-700/80 p-4 flex flex-col gap-4 transition-all overflow-y-auto ${mode === 'play' ? '-ml-80' : 'ml-0'}`}>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Pickaxe className="w-4 h-4 text-amber-400" /> Builder Tools</h2>
            <div className="flex gap-1">
              <button onClick={generateRandomLayout} title="Generate New Random Layout"
                className="flex items-center justify-center bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 p-1.5 rounded-lg text-xs font-semibold transition-all">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setIsSuggestModalOpen(true)} title="Configure Generator Settings"
                className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 px-2 py-1 rounded-lg text-xs font-semibold transition-all">
                <Shuffle className="w-3 h-3" /> Suggest Level
              </button>
            </div>
          </div>

          <div className="flex bg-slate-900/80 rounded-lg p-1 mb-3 border border-slate-700/50">
            <button onClick={() => setSelectedTool('place')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium text-xs transition-colors ${selectedTool === 'place' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'}`}>
              <Square className="w-3.5 h-3.5" /> Place
            </button>
            <button onClick={() => setSelectedTool('erase')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium text-xs transition-colors ${selectedTool === 'erase' ? 'bg-red-500 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}>
              <Trash2 className="w-3.5 h-3.5" /> Erase
            </button>
          </div>
        </div>

        <div className="space-y-3.5 pr-0.5 pb-6">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase mb-1 block">Level Target</label>
              <input type="number" min="1" max="9999" value={levelNum} onChange={e => setLevelNum(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-500 outline-none text-xs" />
            </div>
            <div className="col-span-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase mb-1 block">
                {giftPlacementMode ? '🎁 Gift Layer' : 'Z-Layer'}
              </label>
              
              {giftPlacementMode ? (
                // Gift layer selector
                <div className="flex gap-0.5 bg-slate-900 p-1 rounded border border-amber-600/50 mb-1.5">
                  {GIFT_LAYERS.map(z => (
                    <button key={z} onClick={() => setActiveGiftLayer(z)}
                      className={`flex-1 py-1 rounded text-xs font-bold transition-colors ${
                        activeGiftLayer === z 
                          ? 'bg-amber-500 text-slate-950' 
                          : 'text-amber-300/60 hover:bg-slate-800'
                      }`}>
                      {z}
                    </button>
                  ))}
                </div>
              ) : (
                // Tile layer selector
                <div className="flex gap-0.5 bg-slate-900 p-1 rounded border border-slate-700 mb-1.5">
                  {[0, 1, 2, 3, 4, 5].map(z => (
                    <button key={z} onClick={() => setActiveLayer(z)}
                      className={`flex-1 py-1 rounded text-xs font-bold transition-colors ${
                        activeLayer === z ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800'
                      }`}>
                      {z}
                    </button>
                  ))}
                </div>
              )}

              {/* Layer View Mode Toggle */}
              <div className="flex bg-slate-900/80 rounded-md p-0.5 border border-slate-700/50">
                <button 
                  onClick={() => setLayerViewMode('all')}
                  title="Show all layers with active layer highlighted"
                  className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors ${layerViewMode === 'all' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
                  All
                </button>
                <button 
                  onClick={() => setLayerViewMode('cumulative')}
                  title="Show layers up to active (view build-up)"
                  className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors ${layerViewMode === 'cumulative' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
                  Stack
                </button>
                <button 
                  onClick={() => setLayerViewMode('isolated')}
                  title="Show ONLY the active layer (clean check)"
                  className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors ${layerViewMode === 'isolated' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
                  Solo
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wide">Difficulty Mod Band</label>
              <button onClick={() => setIsModEditorOpen(!isModEditorOpen)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold">
                <Edit3 className="w-3 h-3" /> {isModEditorOpen ? 'Close Editor' : 'Tune Bands'}
              </button>
            </div>
            <select value={difficultyMod} onChange={(e) => setDifficultyMod(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white outline-none focus:border-amber-500 text-xs font-medium">
              {Object.entries(difficultyMods).map(([k, v]) => (<option key={k} value={k}>{v.label} (Var: {v.variants})</option>))}
            </select>

            {isModEditorOpen && (
              <div className="space-y-2 pt-2 border-t border-slate-800 mt-2">
                <p className="text-[10px] text-slate-400 font-medium">Customize starting match quota & variants pool per tier:</p>
                {Object.entries(difficultyMods).map(([key, mod]) => (
                  <div key={key} className="bg-slate-800/80 p-2 rounded border border-slate-700 flex items-center justify-between gap-2">
                    <div className="flex-1 truncate">
                      <p className="text-xs font-bold text-slate-200 truncate">{mod.label.split('(')[0]}</p>
                      <span className="text-[10px] text-slate-400">Mult: {mod.multiplier}x | Target MAI: {mod.targetMAI}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] text-slate-400">Var</span>
                        <input type="number" min="2" max="35" value={mod.variants}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseInt(e.target.value);
                            setDifficultyMods(prev => ({ ...prev, [key]: { ...prev[key], variants: val === '' ? 4 : val } }));
                          }}
                          className="w-10 bg-slate-900 border border-slate-700 rounded py-0.5 px-1 text-cyan-400 font-bold text-center text-xs outline-none" />
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] text-slate-400">Starts</span>
                        <input type="number" min="0" max="10" value={mod.startingMatches}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseInt(e.target.value);
                            setDifficultyMods(prev => ({ ...prev, [key]: { ...prev[key], startingMatches: val === '' ? 0 : val } }));
                          }}
                          className="w-10 bg-slate-900 border border-slate-700 rounded py-0.5 px-1 text-amber-400 font-bold text-center text-xs outline-none" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase mb-1 block">Distribution Pattern</label>
            <select value={distributionPattern} onChange={(e) => setDistributionPattern(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white outline-none focus:border-amber-500 text-xs mb-2">
              {Object.entries(DISTRIBUTION_PATTERNS).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
            </select>
            {distributionPattern === 'hybrid' && (
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-700 space-y-2 mb-2">
                <p className="text-[10px] uppercase font-bold text-amber-400">Hybrid Blend Sub-Patterns</p>
                <div className="grid grid-cols-2 gap-2">
                  <select value={hybridSub1} onChange={(e) => setHybridSub1(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px] text-white">
                    {Object.entries(DISTRIBUTION_PATTERNS).filter(([k]) => k !== 'hybrid' && k !== 'random').map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
                  </select>
                  <select value={hybridSub2} onChange={(e) => setHybridSub2(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px] text-white">
                    {Object.entries(DISTRIBUTION_PATTERNS).filter(([k]) => k !== 'hybrid' && k !== 'random').map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
                  </select>
                </div>
              </div>
            )}

            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-300 flex items-center gap-1"><Sliders className="w-3 h-3 text-cyan-400" /> Icon Ratios</span>
                <span className="text-cyan-400 font-mono">T: {iconColorRatio.themeIconRatio}% | C: {iconColorRatio.colorIconRatio}%</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Theme Icons Ratio</span>
                  <input type="number" min="0" max="100" value={iconColorRatio.themeIconRatio}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                      setIconColorRatio({ themeIconRatio: val, colorIconRatio: 100 - val });
                    }}
                    className="w-12 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-white font-mono text-center" />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Color Theme Icons Ratio</span>
                  <input type="number" min="0" max="100" value={iconColorRatio.colorIconRatio}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                      setIconColorRatio({ themeIconRatio: 100 - val, colorIconRatio: val });
                    }}
                    className="w-12 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-white font-mono text-center" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase mb-1 block">Special Mechanic</label>
            <div className="grid grid-cols-2 gap-1.5">
              {MECHANICS.map(mech => (
                <button 
                  key={mech.id} 
                  onClick={() => {
                    if (mech.id.startsWith('gift')) {
                      setGiftPlacementMode(mech.id);
                      setSelectedMechanic(mech.id);
                    } else {
                      setSelectedMechanic(mech.id);
                      setGiftPlacementMode(null);
                    }
                  }}
                  className={`px-2 py-1.5 rounded text-xs font-bold border flex items-center gap-2 transition-all ${
                    selectedMechanic === mech.id 
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300' 
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}>
                  <mech.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{mech.label}</span>
                </button>
              ))}
            </div>

            {giftPlacementMode && (
              <div className="mt-2 bg-amber-950/50 border border-amber-600/50 p-2 rounded text-[10px] text-amber-300 font-bold">
                🎁 Click on grid to place {GIFT_SIZES[giftPlacementMode]?.name}. Press another mechanic to cancel.
              </div>
            )}

            {selectedMechanic === 'eventItem' && (
              <div className="mt-2 bg-slate-900/80 p-2 rounded border border-slate-700 text-[10px] text-amber-300">
                Event Item: <strong>4 moves</strong> to collect. Expires → turns into normal tile (icon + color retained).
              </div>
            )}
          </div>

          <button onClick={() => setTiles([])} className="w-full mt-1 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded border border-red-900/50 transition-colors font-medium">
            Clear Board
          </button>

          {!isPlayable && (
            <div className="text-[11px] text-red-400 font-bold bg-red-950/30 p-2 rounded border border-red-900/50">
              Matchable tiles ({matchableCount}) must be a multiple of 3 to test.
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-900 relative">
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-800/50 backdrop-blur">
          <h1 className="text-xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent tracking-tight">
            TILES MATCH TOOL
          </h1>
          {mode === 'play' && (
            <div className="flex-1 flex justify-center mx-8">
              <div className="flex items-center gap-2 bg-slate-700 p-2 rounded-xl border-b-4 border-slate-900 shadow-inner min-w-[320px] justify-start">
                
                {/* 7-slot grid */}
                <div className="flex gap-2">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="w-10 h-10 bg-slate-800 rounded shadow-inner border border-slate-900 relative">
                      {container[i] && (
                        container[i].mechanic === 'eventItem' ? (
                          <div className="absolute inset-0 rounded flex items-center justify-center bg-yellow-100 border-yellow-400 border-b-4">
                            <Leaf className="w-6 h-6 text-yellow-600" />
                          </div>
                        ) : (
                          <div className={`absolute inset-0 rounded flex items-center justify-center 
                            ${COLORS.find(c => c.id === container[i].color)?.bg} 
                            ${COLORS.find(c => c.id === container[i].color)?.border} border-b-4`}>
                            {ICONS[container[i].baseIcon] && React.createElement(ICONS[container[i].baseIcon], {
                              className: `w-6 h-6 ${COLORS.find(c => c.id === container[i].color)?.class}`
                            })}
                          </div>
                        )
                      )}
                    </div>
                  ))}
                </div>

                {/* NEW: Gift & Event Item counters */}
                {(tiles.some(t => t.isGift) || tiles.some(t => t.mechanic === 'eventItem')) && (
                  <div className="flex flex-col gap-1 ml-2 pl-2 border-l border-slate-600">
                    {tiles.some(t => t.isGift) && (
                      <div className="flex items-center gap-1.5 bg-amber-900/40 border border-amber-600/50 rounded px-2 py-0.5">
                        <Gift className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[11px] font-bold text-amber-200">
                          {giftsRevealed} / {tiles.filter(t => t.isGift).length}
                        </span>
                      </div>
                    )}
                    {tiles.some(t => t.mechanic === 'eventItem') && (
                      <div className="flex items-center gap-1.5 bg-emerald-900/40 border border-emerald-600/50 rounded px-2 py-0.5">
                        <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[11px] font-bold text-emerald-200">
                          {eventItemsCollected} / {tiles.filter(t => t.mechanic === 'eventItem').length * 2}
                        </span>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}
          <div className="flex gap-3 items-center">
            <button onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 bg-purple-500/20 border border-purple-500/40 hover:bg-purple-500/30 text-purple-300 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow">
              <Upload className="w-4 h-4" /> Import JSON
            </button>
            <button onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 bg-cyan-500/20 border border-cyan-500/40 hover:bg-cyan-500/30 text-cyan-300 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow">
              <Download className="w-4 h-4" /> Export Level JSON
            </button>
            <button onClick={() => setIsBytesModalOpen(true)}
              className="flex items-center gap-1.5 bg-orange-500/20 border border-orange-500/40 hover:bg-orange-500/30 text-orange-300 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow">
              <Download className="w-4 h-4" /> Export .bytes
            </button>
            {mode === 'edit' ? (
              <button onClick={isPlayable ? startPlayMode : undefined}
                className={`flex items-center gap-2 font-bold px-6 py-2 rounded-lg transition-all ${isPlayable ? 'bg-green-500 hover:bg-green-400 text-slate-900 shadow-lg shadow-green-500/20' : 'bg-slate-600 text-slate-400 cursor-not-allowed'}`}>
                <Play className="w-4 h-4" /> Test Level
              </button>
            ) : (
              <button onClick={stopPlayMode} className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white font-bold px-6 py-2 rounded-lg shadow-lg transition-all">
                <Square className="w-4 h-4" /> Stop Testing
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto flex items-center justify-center relative p-8">
          {mode === 'play' && gameState !== 'playing' && (
            <div className="absolute inset-0 z-[110] bg-slate-900/80 backdrop-blur flex items-center justify-center">
              <div className="bg-slate-800 p-8 rounded-2xl border-2 border-slate-700 text-center shadow-2xl max-w-sm w-full">
                <h2 className={`text-4xl font-black mb-4 ${gameState === 'won' ? 'text-green-400' : 'text-red-500'}`}>
                  {gameState === 'won' ? 'LEVEL CLEARED!' : 'GAME OVER'}
                </h2>
                <p className="text-slate-400 mb-8">
                  {gameState === 'won' ? 'Perfect balance achieved.' : 'Container full. Review your difficulty score.'}
                </p>
                <button onClick={stopPlayMode} className="w-full bg-amber-500 text-slate-900 font-bold py-3 rounded-lg hover:bg-amber-400">
                  Return to Editor
                </button>
              </div>
            </div>
          )}

          <div className="relative shadow-2xl"
            style={{ width: '480px', height: '480px', backgroundImage: 'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundColor: '#0f172a' }}>
            {mode === 'edit' && (
              <div className="absolute inset-0 z-50"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.floor((e.clientX - rect.left) / 20);
                  const y = Math.floor((e.clientY - rect.top) / 20);
                  if (x <= 22 && y <= 22) handleGridClick(x, y);
                }} />
            )}
            {(mode === 'play' ? playTiles : tiles).map(tile => renderTile(tile, mode === 'play'))}
          </div>
        </div>
      </div>

      <div className="w-80 bg-slate-900 border-l border-slate-800 p-5 flex flex-col h-full overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Balance Analytics</h2>
        </div>

        <div className="bg-slate-800/90 border border-cyan-500/30 rounded-xl p-3.5 mb-4 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-xs font-black text-cyan-300 uppercase tracking-wider">MAI Live</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              {mode === 'play' ? 'Runtime Mode' : 'Editor Mode'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center bg-slate-900/70 p-2.5 rounded-lg border border-slate-700/60">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Theoretical MAI</p>
              <p className="text-sm font-mono font-bold text-slate-200">{difficultyStats.mai}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Actual Live MAI</p>
              <p className={`text-sm font-mono font-bold ${
                Math.abs(parseFloat(mode === 'play' ? (playTiles.filter(t => isTileFree(t, playTiles)).length / Math.max(1, difficultyMods[difficultyMod].variants)).toFixed(2) : difficultyStats.mai) - parseFloat(difficultyStats.mai)) > 0.5
                  ? 'text-orange-400' : 'text-green-400'
              }`}>
                {mode === 'play'
                  ? (playTiles.filter(t => isTileFree(t, playTiles)).length / Math.max(1, difficultyMods[difficultyMod].variants)).toFixed(2)
                  : difficultyStats.mai}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 mb-5 border border-slate-700 shadow-lg relative overflow-hidden">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Difficulty Score</p>
          <p className="text-4xl font-black text-cyan-400 drop-shadow-sm">{difficultyStats.total.toFixed(2)}</p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/60 text-[11px] text-slate-400">
            <span>Pool Variants: <strong className="text-white">{difficultyMods[difficultyMod].variants}</strong></span>
            <span>MAI Index: <strong className="text-white">{difficultyStats.mai}</strong></span>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase border-b border-slate-800 pb-1">Detailed Metrics</h3>
          
          <MetricRow 
            label="Tile Count Weight" 
            value={difficultyStats.breakdown.tileCount} 
            detail={`${(mode === 'play' ? playTiles : tiles).filter(t => !t.isGift).length} total tiles`} 
          />
          
          <MetricRowWithTooltip 
            label="Theme Icons Weight" 
            value={difficultyStats.breakdown.icons} 
            detail={`Ratio: ${iconColorRatio.themeIconRatio}%`}
            isOpen={activeTooltip === 'icons'}
            onToggle={() => setActiveTooltip(activeTooltip === 'icons' ? null : 'icons')}
          >
            <div className="space-y-1">
              {Object.keys(difficultyStats.iconQuantities).length === 0 ? (
                <p className="text-slate-400 italic">No theme icons placed yet.</p>
              ) : (
                Object.entries(difficultyStats.iconQuantities).map(([iconName, qty]) => {
                  const subScore = qty * WEIGHTS.iconCount.theme * (DISTRIBUTION_PATTERNS[distributionPattern]?.iconWeightFactor || 1.1) * (iconColorRatio.themeIconRatio / 100);
                  return (
                    <div key={iconName} className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-300 font-medium">{iconName} ({qty}x)</span>
                      <span className="font-mono text-amber-400">+{subScore.toFixed(2)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </MetricRowWithTooltip>

          <MetricRowWithTooltip 
            label="Color Variants Weight" 
            value={difficultyStats.breakdown.colors} 
            detail={`Ratio: ${iconColorRatio.colorIconRatio}%`}
            isOpen={activeTooltip === 'colors'}
            onToggle={() => setActiveTooltip(activeTooltip === 'colors' ? null : 'colors')}
          >
            <div className="space-y-1">
              {Object.keys(difficultyStats.colorQuantities).length === 0 ? (
                <p className="text-slate-400 italic">No color variants placed yet.</p>
              ) : (
                Object.entries(difficultyStats.colorQuantities).map(([colorName, qty]) => {
                  const subScore = qty * WEIGHTS.iconCount.color * (iconColorRatio.colorIconRatio / 100);
                  return (
                    <div key={colorName} className="flex justify-between items-center text-[11px] capitalize">
                      <span className="text-slate-300 font-medium">{colorName} ({qty}x)</span>
                      <span className="font-mono text-cyan-400">+{subScore.toFixed(2)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </MetricRowWithTooltip>

          <MetricRow label="Diagonal Covers (Soft)" value={difficultyStats.breakdown.diagCovers} detail={`${difficultyStats.diagCoversCount} diagonal blocks`} />
          <MetricRow label="Stack Covers (Hard)" value={difficultyStats.breakdown.stackCovers} detail={`${difficultyStats.stackCoversCount} direct vertical stacks`} />

          <MetricRowWithTooltip 
            label="Special Mechanics" 
            value={difficultyStats.breakdown.mechanics} 
            detail="Ice, Chains, Hidden, eventItem"
            isOpen={activeTooltip === 'mechanics'}
            onToggle={() => setActiveTooltip(activeTooltip === 'mechanics' ? null : 'mechanics')}
          >
            <div className="space-y-1">
              {Object.keys(difficultyStats.mechanicCounts).length === 0 ? (
                <p className="text-slate-400 italic">No special mechanics active.</p>
              ) : (
                Object.entries(difficultyStats.mechanicCounts).map(([mechKey, qty]) => {
                  const perUnit = WEIGHTS.mechanics[mechKey] || 0;
                  const subScore = qty * perUnit;
                  return (
                    <div key={mechKey} className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-300 font-medium uppercase">{mechKey} ({qty}x)</span>
                      <span className="font-mono text-purple-400">+{subScore.toFixed(2)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </MetricRowWithTooltip>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] space-y-1 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
          <div className="flex justify-between text-slate-400">
            <span>Core Subtotal:</span>
            <span className="font-mono text-slate-200">+{difficultyStats.coreSubtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Special Subtotal:</span>
            <span className="font-mono text-slate-200">+{difficultyStats.specialSubtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-slate-300 pt-1 border-t border-slate-800">
            <span>Static Total:</span>
            <span className="font-mono text-cyan-400">{difficultyStats.staticTotal.toFixed(2)}</span>
          </div>
        </div>

        {difficultyStats.breakdown.maiPenalty > 0 && (
          <div className="mt-3 bg-orange-950/30 border border-orange-900/50 p-3 rounded-lg text-xs">
            <div className="flex justify-between font-bold text-orange-400 mb-0.5">
              <span>MAI Pacing Penalty</span>
              <span className="font-mono">+{difficultyStats.breakdown.maiPenalty.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-orange-300/80">Applied when match availability falls beneath the Sweet Spot threshold.</p>
          </div>
        )}
      </div>

      {isSuggestModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer" onClick={() => setIsSuggestModalOpen(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative cursor-default animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsSuggestModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Shuffle className="w-5 h-5 text-amber-400" /> Suggest Level Generator</h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Target Tile Count (Multiple of 3)</label>
                <input type="number" step="3" min="9" max="150" value={suggestParams.targetTiles}
                  onChange={(e) => setSuggestParams(prev => ({ ...prev, targetTiles: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono outline-none focus:border-amber-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Z-Layers (2-5)</label>
                  <input type="number" min="2" max="5" value={suggestParams.layers}
                    onChange={(e) => setSuggestParams(prev => ({ ...prev, layers: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Layout Shape</label>
                  <select value={suggestParams.layoutShape}
                    onChange={(e) => setSuggestParams(prev => ({ ...prev, layoutShape: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-2 text-white outline-none focus:border-amber-500">
                    <option value="pyramid">Pyramid Cascades</option>
                    <option value="clusterCluster">Cluster Islands</option>
                    <option value="spiralWave">Spiral Wave</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Stack Cover Ratio (%)</label>
                  <input type="number" min="0" max="100" value={suggestParams.stackRatio}
                    onChange={(e) => setSuggestParams(prev => ({ ...prev, stackRatio: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Diagonal Cover Ratio (%)</label>
                  <input type="number" min="0" max="100" value={suggestParams.diagonalRatio}
                    onChange={(e) => setSuggestParams(prev => ({ ...prev, diagonalRatio: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono outline-none focus:border-amber-500" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Hidden %</label>
                  <input type="number" min="0" max="100" value={suggestParams.hiddenPct}
                    onChange={(e) => setSuggestParams(prev => ({ ...prev, hiddenPct: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white font-mono" />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Chain Lv1 %</label>
                  <input type="number" min="0" max="100" value={suggestParams.chained1Pct}
                    onChange={(e) => setSuggestParams(prev => ({ ...prev, chained1Pct: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white font-mono" />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Chain Lv2 %</label>
                  <input type="number" min="0" max="100" value={suggestParams.chained2Pct}
                    onChange={(e) => setSuggestParams(prev => ({ ...prev, chained2Pct: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white font-mono" />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Ice %</label>
                  <input type="number" min="0" max="100" value={suggestParams.icePct}
                    onChange={(e) => setSuggestParams(prev => ({ ...prev, icePct: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white font-mono" />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Combined %</label>
                  <input type="number" min="0" max="100" value={suggestParams.combinedPct}
                    onChange={(e) => setSuggestParams(prev => ({ ...prev, combinedPct: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white font-mono" />
                </div>
                <div className="flex items-center pt-4">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-medium">
                    <input type="checkbox" checked={suggestParams.enableeventItemLeaf}
                      onChange={(e) => setSuggestParams(prev => ({ ...prev, enableeventItemLeaf: e.target.checked }))}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0" />
                    eventItem Leaf (3)
                  </label>
                </div>
              </div>

              <button onClick={() => executeSuggestLevel(suggestParams)}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl mt-4 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Generate & Spawn Level
              </button>
            </div>
          </div>
        </div>
      )}

      {isExportModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer" onClick={() => setIsExportModalOpen(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative cursor-default animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Download className="w-5 h-5 text-cyan-400" /> Export Level JSON Preview</h3>
              <button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Cấu trúc JSON đã được cập nhật: Các tile normal nằm trước, tile special mechanic nằm phía sau theo từng layer từ 0 đến cao nhất. `special_mechanic` là optional (bỏ qua với normal tile).
            </p>

            <div className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-3 font-mono text-[11px] text-cyan-300 overflow-y-auto max-h-[350px] select-all whitespace-pre-wrap">
              {JSON.stringify(buildExportJsonPayload, null, 2)}
            </div>

            <div className="flex gap-3 mt-4 pt-3 border-t border-slate-700">
              <button onClick={handleCopyJson}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl transition-all text-xs">
                <Copy className="w-4 h-4" /> Copy to Clipboard
              </button>
              <button onClick={handleDownloadJson}
                className="flex-1 flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-xl transition-all text-xs shadow-lg shadow-cyan-500/20">
                <Download className="w-4 h-4" /> Download .JSON File
              </button>
            </div>
          </div>
        </div>
      )}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer" onClick={() => setIsImportModalOpen(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl p-6 shadow-2xl relative cursor-default animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-400" /> Import Level JSON
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Import a previously exported level JSON. Icon and color fields will be <span className="text-amber-400 font-bold">ignored</span> — they'll be regenerated when you press <span className="text-green-400 font-bold">Test Level</span>. Structure and mechanics are validated.
            </p>

            {/* File Upload */}
            <div className="mb-3">
              <label className="flex items-center justify-center gap-2 bg-slate-900 border-2 border-dashed border-slate-600 hover:border-purple-500 rounded-xl py-4 cursor-pointer transition-colors">
                <FileJson className="w-5 h-5 text-purple-400" />
                <span className="text-xs font-bold text-slate-300">Click to upload .json file</span>
                <input type="file" accept=".json,application/json" onChange={handleImportFile} className="hidden" />
              </label>
            </div>

            {/* Or Paste */}
            <div className="mb-3">
              <label className="text-[11px] font-bold text-slate-400 uppercase mb-1 block">Or paste JSON here:</label>
              <textarea
                value={importJsonText}
                onChange={(e) => handleImportText(e.target.value)}
                placeholder='{"level_id": 1, "map_info": {"tiles": [...]}}'
                className="w-full h-40 bg-slate-950 border border-slate-700 rounded-lg p-3 font-mono text-[11px] text-cyan-300 outline-none focus:border-purple-500 resize-none"
              />
            </div>

            {/* Error Display */}
            {importError && (
              <div className="mb-3 bg-red-950/40 border border-red-800 rounded-lg p-3 max-h-32 overflow-y-auto">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-bold text-red-400 uppercase">Validation Failed ({importError.length} error{importError.length > 1 ? 's' : ''})</span>
                </div>
                <ul className="space-y-0.5 text-[10px] text-red-300 font-mono">
                  {importError.slice(0, 20).map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                  {importError.length > 20 && (
                    <li className="italic text-red-400/70">... and {importError.length - 20} more</li>
                  )}
                </ul>
              </div>
            )}

            {/* Preview */}
            {importPreview && (
              <div className="mb-3 bg-green-950/30 border border-green-800 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-bold text-green-400 uppercase">Valid — Ready to Import</span>
                </div>
                <div className="grid grid-cols-5 gap-2 text-[10px]">
                  <div className="bg-slate-900/60 p-2 rounded">
                    <p className="text-slate-500 uppercase font-bold">Level</p>
                    <p className="text-white font-mono text-sm">{importPreview.parsed.level_id ?? '—'}</p>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded">
                    <p className="text-slate-500 uppercase font-bold">Tiles</p>
                    <p className="text-white font-mono text-sm">{importPreview.tiles.length}</p>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded">
                    <p className="text-slate-500 uppercase font-bold">Gifts</p>
                    <p className="text-amber-400 font-mono text-sm">{importPreview.gifts?.length || 0}</p>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded">
                    <p className="text-slate-500 uppercase font-bold">Max Layer</p>
                    <p className="text-white font-mono text-sm">
                      {Math.max(...importPreview.tiles.map(t => t.z), 0) + 1}
                    </p>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded">
                    <p className="text-slate-500 uppercase font-bold">Mod Band</p>
                    <p className="text-white font-mono text-sm truncate">
                      {importPreview.parsed.difficulty?.difficulty_mod_band ?? '—'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-auto pt-3 border-t border-slate-700">
              <button 
                onClick={() => { setIsImportModalOpen(false); setImportJsonText(''); setImportError(null); setImportPreview(null); }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl transition-all text-xs">
                Cancel
              </button>
              <button 
                onClick={handleExecuteImport}
                disabled={!importPreview}
                className={`flex-1 flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl transition-all text-xs ${
                  importPreview 
                    ? 'bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-lg shadow-purple-500/20' 
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}>
                <Upload className="w-4 h-4" /> Load into Builder
              </button>
            </div>
          </div>
        </div>
      )}

       {isBytesModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer" onClick={() => setIsBytesModalOpen(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative cursor-default animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-orange-400" /> Export .bytes for Game Engine
              </h3>
              <button onClick={() => setIsBytesModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Format này tuân theo đúng khung của dev để bỏ thẳng vào game engine. 
              <span className="text-amber-400 font-bold"> Ice, Combined, Chained bị bỏ qua</span> (chưa implement trong engine).
              <span className="text-emerald-400 font-bold"> Hidden → isBackUp</span>,
              <span className="text-emerald-400 font-bold"> EventItem → indexBreakTileStart:0</span>.
            </p>

            {/* Summary bar */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="bg-slate-900/60 p-2 rounded border border-slate-700">
                <p className="text-slate-500 uppercase font-bold text-[10px]">Version</p>
                <p className="text-orange-400 font-mono text-sm font-bold">{buildBytesPayload.bytes_version}</p>
              </div>
              <div className="bg-slate-900/60 p-2 rounded border border-slate-700">
                <p className="text-slate-500 uppercase font-bold text-[10px]">Tiles</p>
                <p className="text-white font-mono text-sm">{buildBytesPayload.tiles.length}</p>
              </div>
              <div className="bg-slate-900/60 p-2 rounded border border-slate-700">
                <p className="text-slate-500 uppercase font-bold text-[10px]">Gifts</p>
                <p className="text-amber-400 font-mono text-sm">{buildBytesPayload.gifts.length}</p>
              </div>
              <div className="bg-slate-900/60 p-2 rounded border border-slate-700">
                <p className="text-slate-500 uppercase font-bold text-[10px]">Difficulty</p>
                <p className="text-cyan-400 font-mono text-sm font-bold">{buildBytesPayload.DifficultyNew}</p>
              </div>
            </div>

            {/* Error display */}
            {buildBytesPayload._error && (
              <div className="mb-3 bg-red-950/40 border border-red-800 rounded-lg p-3">
                <p className="text-xs font-bold text-red-400 mb-1">⚠️ Conversion Error</p>
                <p className="text-[10px] text-red-300 font-mono">{buildBytesPayload._error}</p>
              </div>
            )}

            {/* Preview */}
            <div className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-3 font-mono text-[11px] text-orange-300 overflow-y-auto max-h-[350px] select-all whitespace-pre-wrap">
              {JSON.stringify(buildBytesPayload, null, 2)}
            </div>

            <div className="flex gap-3 mt-4 pt-3 border-t border-slate-700">
              <button 
                onClick={handleCopyBytes}
                disabled={!!buildBytesPayload._error}
                className={`flex-1 flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl transition-all text-xs ${
                  buildBytesPayload._error 
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}>
                <Copy className="w-4 h-4" /> Copy to Clipboard
              </button>
              <button 
                onClick={handleDownloadBytes}
                disabled={!!buildBytesPayload._error}
                className={`flex-1 flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl transition-all text-xs ${
                  buildBytesPayload._error 
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                    : 'bg-orange-500 hover:bg-orange-400 text-slate-950 shadow-lg shadow-orange-500/20'
                }`}>
                <Download className="w-4 h-4" /> Download Level{levelNum}.bytes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricRow({ label, value, detail }) {
  return (
    <div className="flex items-center justify-between group">
      <div>
        <p className="text-xs font-medium text-slate-300 group-hover:text-amber-200 transition-colors">{label}</p>
        <p className="text-[10px] text-slate-500">{detail}</p>
      </div>
      <div className="font-mono text-xs font-bold text-amber-400">
        {value > 0 ? `+${value.toFixed(2)}` : '0.00'}
      </div>
    </div>
  );
}

function MetricRowWithTooltip({ label, value, detail, isOpen, onToggle, children }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between group">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium text-slate-300 group-hover:text-amber-200 transition-colors">{label}</p>
            <button onClick={onToggle} className="text-slate-400 hover:text-amber-400 transition-colors">
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-slate-500">{detail}</p>
        </div>
        <div className="font-mono text-xs font-bold text-amber-400">
          {value > 0 ? `+${value.toFixed(2)}` : '0.00'}
        </div>
      </div>
      {isOpen && (
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 space-y-1.5 my-1 animate-in fade-in duration-150">
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Item Breakdown</p>
          {children}
        </div>
      )}
    </div>
  );
}