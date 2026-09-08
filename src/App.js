import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, Square, Trash2, Layers, Pickaxe, Eye, Link, 
  Lock, ShieldAlert, Settings, Info, Box, Star, Heart, 
  Sun, Moon, Flower, Fish, Cloud, Flame, Zap, Droplet, Shuffle, Edit3, X, Check, RefreshCw
} from 'lucide-react';

// --- CONFIGURATION & WEIGHTS ---
const WEIGHTS = {
  tileCount: { base: 0.05, earlyLevel: 0.03, highCount: 0.08 },
  iconCount: { theme: 1.50, color: 0.80 },
  layerCount: { diagonal: 1.00, stack: 1.80 },
  mai: { base: 0.50, dangerMultiplier: 2.00, sweetSpot: 3.50, dangerThreshold: 2.00 },
  mechanics: {
    normal: 0,
    chained: 1.60,
    ice2: 1.20,
    ice3: 2.20,
    blocker: 1.40,
    hidden: 0.03
  }
};

const ICONS = { Star, Heart, Sun, Moon, Flower, Fish, Cloud, Flame, Zap, Droplet };
const COLORS = [
  { id: 'red', class: 'text-red-500', bg: 'bg-red-100', border: 'border-red-300' },
  { id: 'blue', class: 'text-blue-500', bg: 'bg-blue-100', border: 'border-blue-300' },
  { id: 'green', class: 'text-green-500', bg: 'bg-green-100', border: 'border-green-300' },
  { id: 'yellow', class: 'text-yellow-500', bg: 'bg-yellow-100', border: 'border-yellow-300' },
  { id: 'purple', class: 'text-purple-500', bg: 'bg-purple-100', border: 'border-purple-300' }
];

const MECHANICS = [
  { id: 'normal', label: 'Normal', icon: Box },
  { id: 'chained', label: 'Chained', icon: Link },
  { id: 'ice2', label: 'Ice (2-Match)', icon: Layers },
  { id: 'ice3', label: 'Ice (3-Match)', icon: Layers },
  { id: 'blocker', label: 'Blocker', icon: ShieldAlert },
  { id: 'hidden', label: 'Hidden', icon: Eye }
];

const INITIAL_DIFFICULTY_MODS = {
  modEasy: { label: 'Easy (Relaxed Flow)', multiplier: 0.8, variants: 4, startingMatches: 3 },
  modMedium: { label: 'Medium (Balanced)', multiplier: 1.0, variants: 8, startingMatches: 2 },
  modHard: { label: 'Hard (Tight Pacing)', multiplier: 1.25, variants: 14, startingMatches: 1 },
  modVeryHard: { label: 'Very Hard (Scarcity)', multiplier: 1.5, variants: 22, startingMatches: 0 },
  modExpert: { label: 'Expert (Danger Zone)', multiplier: 1.8, variants: 30, startingMatches: 0 }
};

const DISTRIBUTION_PATTERNS = {
  themeFocus: { label: 'Theme Focus', iconWeightFactor: 1.1 },
  colorScatter: { label: 'Color Scatter', iconWeightFactor: 1.3 },
  heavyStack: { label: 'Heavy Stacking', iconWeightFactor: 1.0 },
  pyramidCascades: { label: 'Pyramid Cascades', iconWeightFactor: 1.0 },
  hybrid: { label: 'Hybrid (Blend 2)', iconWeightFactor: 1.2 },
  random: { label: 'Random (Pure Stochastic)', iconWeightFactor: 1.0 }
};

const generateId = () => Math.random().toString(36).substr(2, 9);

const isOverlapping = (t1, t2) => {
  const dx = Math.abs(t1.x - t2.x);
  const dy = Math.abs(t1.y - t2.y);
  return dx < 2 && dy < 2;
};

const getCoverType = (t1, t2) => {
  if (t2.z <= t1.z) return null;
  if (!isOverlapping(t1, t2)) return null;
  if (t1.x === t2.x && t1.y === t2.y) return 'stack';
  return 'diagonal';
};

const isTileFree = (tile, allTiles) => {
  return !allTiles.some(t2 => t2.z > tile.z && isOverlapping(tile, t2));
};

export default function App() {
  const [mode, setMode] = useState('edit'); // 'edit' or 'play'
  const [levelNum, setLevelNum] = useState(1);
  const [tiles, setTiles] = useState([]);
  
  // Editor State
  const [activeLayer, setActiveLayer] = useState(0);
  const [selectedTool, setSelectedTool] = useState('place');
  const [difficultyMods, setDifficultyMods] = useState(INITIAL_DIFFICULTY_MODS);
  const [difficultyMod, setDifficultyMod] = useState('modMedium');
  const [isModEditorOpen, setIsModEditorOpen] = useState(false);
  
  // Suggest Level Modal State & Saved Parameters
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [suggestParams, setSuggestParams] = useState({
    targetTiles: 45,
    layers: 3,
    stackRatio: 0, // Default to 0% as requested
    diagRatio: 40,
    hiddenPct: 10,
    chainedPct: 5,
    icePct: 10,
    blockerPct: 5
  });

  const [distributionPattern, setDistributionPattern] = useState('themeFocus');
  const [hybridSub1, setHybridSub1] = useState('themeFocus');
  const [hybridSub2, setHybridSub2] = useState('colorScatter');

  const [selectedMechanic, setSelectedMechanic] = useState('normal');

  // Play State
  const [playTiles, setPlayTiles] = useState([]);
  const [container, setContainer] = useState([]);
  const [gameState, setGameState] = useState('playing');

  const matchableCount = tiles.filter(t => t.mechanic !== 'blocker').length;
  const isPlayable = matchableCount > 0 && matchableCount % 3 === 0;

  // --- INITIAL LEVEL GENERATION ---
  useEffect(() => {
    executeSuggestLevel(suggestParams);
  }, []);

  const executeSuggestLevel = (params) => {
    const generatedTiles = [];
    let id = 0;
    
    const numLayers = Math.min(Math.max(Number(params.layers) || 3, 2), 5);
    const targetCount = Math.min(Math.max(Number(params.targetTiles) || 30, 9), 150);

    const adjustedTarget = Math.floor(targetCount / 3) * 3;
    const perLayerTarget = Math.ceil(adjustedTarget / numLayers);

    const stackRatioVal = Number(params.stackRatio) || 0;

    for (let z = 0; z < numLayers; z++) {
      let placedOnLayer = 0;
      const startCoord = 4 + (z * 2);
      const endCoord = 18 - (z * 2);

      for (let y = startCoord; y <= endCoord; y += 2) {
        for (let x = startCoord; x <= endCoord; x += 2) {
          if (placedOnLayer >= perLayerTarget || generatedTiles.length >= adjustedTarget) break;

          let mech = 'normal';
          const roll = Math.random() * 100;
          
          if (z > 0 && roll < Number(params.hiddenPct)) mech = 'hidden';
          else if (roll < Number(params.hiddenPx) + Number(params.chainedPct) || roll < Number(params.hiddenPct) + Number(params.chainedPct)) {
            // keep standard mechanic check
          }
          
          // Re-evaluate mechanic selection cleanly
          if (z > 0 && roll < Number(params.hiddenPct)) mech = 'hidden';
          else if (roll < Number(params.hiddenPct) + Number(params.chainedPct)) mech = 'chained';
          else if (roll < Number(params.hiddenPct) + Number(params.chainedPct) + Number(params.icePct)) mech = Math.random() > 0.5 ? 'ice2' : 'ice3';
          else if (roll < Number(params.hiddenPct) + Number(params.chainedPct) + Number(params.icePct) + Number(params.blockerPct)) mech = 'blocker';

          let posX = x;
          let posY = y;

          if (z > 0) {
            const lowerLayerTiles = generatedTiles.filter(t => t.z === z - 1);
            if (lowerLayerTiles.length > 0) {
              const baseTile = lowerLayerTiles[Math.floor(Math.random() * lowerLayerTiles.length)];
              
              // Strict check: if stackRatioVal is 0, DO NOT allow direct stack. Force an offset.
              const rollStack = Math.random() * 100;
              if (stackRatioVal > 0 && rollStack < stackRatioVal) {
                posX = baseTile.x;
                posY = baseTile.y;
              } else {
                // Pick a strictly offset position so it never shares exact x,y with baseTile
                const diagonalOffsets = [
                  { dx: 2, dy: 0 }, { dx: -2, dy: 0 },
                  { dx: 0, dy: 2 }, { dx: 0, dy: -2 },
                  { dx: 2, dy: 2 }, { dx: -2, dy: -2 },
                  { dx: 2, dy: -2 }, { dx: -2, dy: 2 }
                ];
                
                // Filter out any offset that results in zero displacement
                const validOffsets = diagonalOffsets.filter(o => (baseTile.x + o.dx !== baseTile.x) || (baseTile.y + o.dy !== baseTile.y));
                const offset = validOffsets[Math.floor(Math.random() * validOffsets.length)] || { dx: 2, dy: 2 };
                
                posX = Math.max(2, Math.min(20, baseTile.x + offset.dx));
                posY = Math.max(2, Math.min(20, baseTile.y + offset.dy));

                // Extra guard: if it accidentally matched any existing tile on the same layer, nudge it or check overlap
                let attempts = 0;
                while (generatedTiles.some(t => t.z === z && t.x === posX && t.y === posY) && attempts < 5) {
                  const altO = diagonalOffsets[Math.floor(Math.random() * diagonalOffsets.length)];
                  posX = Math.max(2, Math.min(20, baseTile.x + altO.dx));
                  posY = Math.max(2, Math.min(20, baseTile.y + altO.dy));
                  attempts++;
                }
              }
            }
          }

          generatedTiles.push({
            id: `gen-${id++}`,
            x: posX,
            y: posY,
            z: z,
            mechanic: mech
          });
          placedOnLayer++;
        }
        if (placedOnLayer >= perLayerTarget || generatedTiles.length >= adjustedTarget) break;
      }
    }

    let currentMatchableCount = generatedTiles.filter(t => t.mechanic !== 'blocker').length;
    let remainder = currentMatchableCount % 3;
    
    if (remainder !== 0) {
      for (let i = generatedTiles.length - 1; i >= 0 && remainder > 0; i--) {
        if (generatedTiles[i].mechanic !== 'blocker') {
          generatedTiles.splice(i, 1);
          remainder--;
        }
      }
    }

    setTiles(generatedTiles);
    setIsSuggestModalOpen(false);
  };

  const generateRandomLayout = () => {
    executeSuggestLevel(suggestParams);
  };

  // --- PLAY MODE LOGIC ---
  const startPlayMode = () => {
    if (!isPlayable) return;

    const matchable = tiles.filter(t => t.mechanic !== 'blocker');
    const modConfig = difficultyMods[difficultyMod];
    const allPossible = [];
    
    Object.keys(ICONS).forEach(icon => COLORS.forEach(c => allPossible.push({ i: icon, c: c.id })));
    
    const shuffledVariants = [...allPossible].sort(() => Math.random() - 0.5);
    const pool = shuffledVariants.slice(0, modConfig.variants);

    const triplets = [];
    const numSets = matchable.length / 3;
    for (let i = 0; i < numSets; i++) {
      const v = pool[Math.floor(Math.random() * pool.length)];
      triplets.push(v, v, v);
    }
    triplets.sort(() => Math.random() - 0.5);

    let tIndex = 0;
    const initializedPlayTiles = tiles.map(t => {
      if (t.mechanic === 'blocker') {
         return { ...t, isRevealed: true, iceCount: 0 };
      }
      const assigned = triplets[tIndex++];
      return {
        ...t,
        baseIcon: assigned.i,
        color: assigned.c,
        iceCount: t.mechanic === 'ice3' ? 3 : t.mechanic === 'ice2' ? 2 : 0,
        isRevealed: t.mechanic !== 'hidden'
      };
    });

    setMode('play');
    setGameState('playing');
    setContainer([]);
    setPlayTiles(initializedPlayTiles);
  };

  const stopPlayMode = () => {
    setMode('edit');
  };

  const handleTileClick = (tile) => {
    if (mode === 'edit') return;
    if (gameState !== 'playing') return;

    if (!isTileFree(tile, playTiles)) return;

    if (tile.mechanic === 'chained') {
      const isChained = playTiles.some(t => 
        t.z === tile.z && t.id !== tile.id && 
        ((Math.abs(t.x - tile.x) === 2 && Math.abs(t.y - tile.y) < 2) || 
         (Math.abs(t.y - tile.y) === 2 && Math.abs(t.x - tile.x) < 2))
      );
      if (isChained) return;
    }

    if (tile.iceCount > 1) {
      setPlayTiles(playTiles.map(t => t.id === tile.id ? { ...t, iceCount: t.iceCount - 1 } : t));
      return;
    }

    if (tile.mechanic === 'blocker') {
      setPlayTiles(playTiles.filter(t => t.id !== tile.id));
      checkWinCondition(playTiles.length - 1);
      return;
    }

    const newPlayTiles = playTiles.filter(t => t.id !== tile.id);
    
    let newContainer = [...container];
    const matchIndex = newContainer.findLastIndex(t => t.baseIcon === tile.baseIcon && t.color === tile.color);
    if (matchIndex !== -1) {
      newContainer.splice(matchIndex + 1, 0, tile);
    } else {
      newContainer.push(tile);
    }

    for (let i = 0; i <= newContainer.length - 3; i++) {
      if (
        newContainer[i].baseIcon === newContainer[i+1].baseIcon && 
        newContainer[i].baseIcon === newContainer[i+2].baseIcon &&
        newContainer[i].color === newContainer[i+1].color &&
        newContainer[i].color === newContainer[i+2].color
      ) {
        newContainer.splice(i, 3);
        break;
      }
    }

    setPlayTiles(newPlayTiles);
    setContainer(newContainer);

    const updatedReveals = newPlayTiles.map(t => {
      if (t.mechanic === 'hidden' && !t.isRevealed && isTileFree(t, newPlayTiles)) {
        return { ...t, isRevealed: true };
      }
      return t;
    });
    setPlayTiles(updatedReveals);

    if (newContainer.length >= 7) {
      setGameState('lost');
    } else if (updatedReveals.filter(t => t.mechanic !== 'blocker').length === 0) {
      setGameState('won');
    }
  };

  const checkWinCondition = (remainingTilesCount) => {
    if (remainingTilesCount === 0 && container.length === 0) setGameState('won');
  };

  const handleGridClick = (x, y) => {
    if (mode !== 'edit' || isSuggestModalOpen) return;

    if (selectedTool === 'place') {
      const occupied = tiles.some(t => t.z === activeLayer && isOverlapping(t, {x, y}));
      if (!occupied) {
        setTiles([...tiles, {
          id: generateId(), x, y, z: activeLayer,
          mechanic: selectedMechanic
        }]);
      }
    } else if (selectedTool === 'erase') {
      const clickedTiles = tiles.filter(t => isOverlapping(t, {x, y})).sort((a, b) => b.z - a.z);
      if (clickedTiles.length > 0) {
        setTiles(tiles.filter(t => t.id !== clickedTiles[0].id));
      }
    }
  };

  const difficultyStats = useMemo(() => {
    const defaultStats = { 
      total: 0, 
      staticTotal: 0,
      coreSubtotal: 0,
      specialSubtotal: 0,
      breakdown: { tileCount: 0, icons: 0, colors: 0, stackCovers: 0, diagCovers: 0, mechanics: 0, maiPenalty: 0 },
      mai: WEIGHTS.mai.sweetSpot.toFixed(2),
      startingMatchesCount: 0,
      stackCoversCount: 0,
      diagCoversCount: 0
    };

    if (!tiles || tiles.length === 0) return defaultStats;

    const breakdown = { tileCount: 0, icons: 0, colors: 0, stackCovers: 0, diagCovers: 0, mechanics: 0, maiPenalty: 0 };

    const tCount = tiles.length;
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

    let baseIconsCount = Math.min(modConfig.variants, Object.keys(ICONS).length);
    let colorVarsCount = Math.max(0, modConfig.variants - Object.keys(ICONS).length);

    breakdown.icons = baseIconsCount * WEIGHTS.iconCount.theme * patFactor;
    breakdown.colors = colorVarsCount * WEIGHTS.iconCount.color;

    let stackCoversCount = 0;
    let diagCoversCount = 0;
    tiles.forEach(t1 => {
      let isStacked = false;
      let isDiag = false;
      tiles.forEach(t2 => {
        const coverType = getCoverType(t1, t2);
        if (coverType === 'stack') isStacked = true;
        if (coverType === 'diagonal') isDiag = true;
      });
      if (isStacked) stackCoversCount++;
      else if (isDiag) diagCoversCount++;
    });

    breakdown.stackCovers = stackCoversCount * WEIGHTS.layerCount.stack;
    breakdown.diagCovers = diagCoversCount * WEIGHTS.layerCount.diagonal;

    tiles.forEach(t => {
      breakdown.mechanics += WEIGHTS.mechanics[t.mechanic] || 0;
    });

    const coreSubtotal = breakdown.tileCount + breakdown.icons + breakdown.colors + breakdown.stackCovers + breakdown.diagCovers;
    const specialSubtotal = breakdown.mechanics;
    const staticTotal = coreSubtotal + specialSubtotal;

    const freeTiles = tiles.filter(t => isTileFree(t, tiles) && t.mechanic !== 'blocker');
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
      total: finalScore, 
      staticTotal, 
      coreSubtotal, 
      specialSubtotal, 
      breakdown, 
      mai: mai.toFixed(2),
      startingMatchesCount: modConfig.startingMatches,
      stackCoversCount,
      diagCoversCount
    };
  }, [tiles, levelNum, difficultyMod, difficultyMods, distributionPattern, hybridSub1, hybridSub2]);

  const renderTile = (tile, isPlayMode = false) => {
    const isFree = isPlayMode ? isTileFree(tile, playTiles) : isTileFree(tile, tiles);
    const isEdit = mode === 'edit';
    
    let content = null;
    let bgColor = isEdit ? 'bg-slate-600' : '';
    let borderColor = isEdit ? 'border-slate-800' : '';

    if (isPlayMode && tile.mechanic === 'hidden' && !tile.isRevealed) {
      content = <span className="text-xl font-bold text-gray-500">?</span>;
      bgColor = 'bg-slate-700';
      borderColor = 'border-slate-600';
    } else if (!isEdit && tile.baseIcon && tile.color) {
      const IconCmp = ICONS[tile.baseIcon];
      const colorStyle = COLORS.find(c => c.id === tile.color);
      content = <IconCmp className={`w-6 h-6 ${colorStyle.class}`} />;
      bgColor = colorStyle.bg;
      borderColor = colorStyle.border;
    }

    let overlay = null;

    if (tile.mechanic === 'blocker') {
      content = <ShieldAlert className="w-6 h-6 text-gray-700" />;
      bgColor = isEdit ? 'bg-slate-500' : 'bg-slate-400';
      borderColor = isEdit ? 'border-slate-700' : 'border-slate-600';
    }

    if (tile.mechanic === 'ice2' || tile.mechanic === 'ice3') {
      const iceHits = isPlayMode ? tile.iceCount : (tile.mechanic === 'ice3' ? 3 : 2);
      if (iceHits > 0) {
        overlay = (
          <div className="absolute inset-0 bg-cyan-200/60 backdrop-blur-sm border-2 border-cyan-400 rounded-lg flex items-center justify-center z-10">
            <span className="text-cyan-800 font-bold text-xs">{iceHits}❄</span>
          </div>
        );
      }
    }

    if (tile.mechanic === 'chained') {
      overlay = (
        <div className="absolute inset-0 border-4 border-gray-800 border-dashed rounded-lg opacity-70 z-10 pointer-events-none"></div>
      );
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
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex overflow-hidden">
      
      {/* RESPONSIVE LEFT SIDEBAR */}
      <div className={`w-80 bg-slate-800/95 backdrop-blur-md border-r border-slate-700/80 p-4 flex flex-col gap-4 transition-all overflow-y-auto ${mode === 'play' ? '-ml-80' : 'ml-0'}`}>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Pickaxe className="w-4 h-4 text-amber-400"/> Builder Tools</h2>
            
            <div className="flex gap-1">
              <button 
                onClick={generateRandomLayout}
                title="Generate New Random Layout (Keeps Current Settings, Different Layout)"
                className="flex items-center justify-center bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 p-1.5 rounded-lg text-xs font-semibold transition-all">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setIsSuggestModalOpen(true)}
                title="Configure Generator Settings"
                className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 px-2 py-1 rounded-lg text-xs font-semibold transition-all">
                <Shuffle className="w-3 h-3" /> Suggest Level
              </button>
            </div>
          </div>
          
          <div className="flex bg-slate-900/80 rounded-lg p-1 mb-3 border border-slate-700/50">
            <button 
              onClick={() => setSelectedTool('place')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium text-xs transition-colors ${selectedTool === 'place' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'}`}>
              <Square className="w-3.5 h-3.5"/> Place
            </button>
            <button 
              onClick={() => setSelectedTool('erase')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium text-xs transition-colors ${selectedTool === 'erase' ? 'bg-red-500 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}>
              <Trash2 className="w-3.5 h-3.5"/> Erase
            </button>
          </div>
        </div>

        <div className="space-y-3.5 pr-0.5 pb-6">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase mb-1 block">Level Target</label>
              <input 
                type="number" min="1" max="9999" value={levelNum} onChange={e => setLevelNum(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-amber-500 outline-none text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase mb-1 block">Z-Layer</label>
              <div className="flex gap-0.5 bg-slate-900 p-1 rounded border border-slate-700">
                {[0, 1, 2, 3, 4, 5].map(z => (
                  <button key={z} onClick={() => setActiveLayer(z)}
                    className={`flex-1 py-1 rounded text-xs font-bold transition-colors ${activeLayer === z ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800'}`}>
                    {z}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wide">Difficulty Mod Band</label>
              <button 
                onClick={() => setIsModEditorOpen(!isModEditorOpen)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold">
                <Edit3 className="w-3 h-3"/> {isModEditorOpen ? 'Close Editor' : 'Tune Bands'}
              </button>
            </div>

            <select
              value={difficultyMod}
              onChange={(e) => setDifficultyMod(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white outline-none focus:border-amber-500 text-xs font-medium"
            >
              {Object.entries(difficultyMods).map(([k, v]) => (
                <option key={k} value={k}>{v.label} (Matches: {v.startingMatches})</option>
              ))}
            </select>

            {isModEditorOpen && (
              <div className="space-y-2 pt-2 border-t border-slate-800 mt-2">
                <p className="text-[10px] text-slate-400 font-medium">Customize starting match quota & variants per tier:</p>
                {Object.entries(difficultyMods).map(([key, mod]) => (
                  <div key={key} className="bg-slate-800/80 p-2 rounded border border-slate-700 flex items-center justify-between gap-2">
                    <div className="flex-1 truncate">
                      <p className="text-xs font-bold text-slate-200 truncate">{mod.label.split('(')[0]}</p>
                      <span className="text-[10px] text-slate-400">Var: {mod.variants} | Mult: {mod.multiplier}x</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">Starts:</span>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={mod.startingMatches}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : parseInt(e.target.value);
                          setDifficultyMods(prev => ({
                            ...prev,
                            [key]: { ...prev[key], startingMatches: val === '' ? 0 : val }
                          }));
                        }}
                        className="w-12 bg-slate-900 border border-slate-700 rounded py-1 px-1 text-amber-400 font-bold text-center text-xs outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase mb-1 block">Distribution Pattern</label>
            <select
              value={distributionPattern}
              onChange={(e) => setDistributionPattern(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white outline-none focus:border-amber-500 text-xs mb-2"
            >
              {Object.entries(DISTRIBUTION_PATTERNS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>

            {distributionPattern === 'hybrid' && (
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-700 space-y-2">
                <p className="text-[10px] uppercase font-bold text-amber-400">Hybrid Blend Sub-Patterns</p>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={hybridSub1}
                    onChange={(e) => setHybridSub1(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px] text-white"
                  >
                    {Object.entries(DISTRIBUTION_PATTERNS).filter(([k]) => k !== 'hybrid' && k !== 'random').map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <select
                    value={hybridSub2}
                    onChange={(e) => setHybridSub2(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px] text-white"
                  >
                    {Object.entries(DISTRIBUTION_PATTERNS).filter(([k]) => k !== 'hybrid' && k !== 'random').map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase mb-1 block">Special Mechanic</label>
            <div className="grid grid-cols-2 gap-1.5">
              {MECHANICS.map(mech => (
                <button key={mech.id} onClick={() => setSelectedMechanic(mech.id)}
                  className={`px-2 py-1.5 rounded text-xs font-bold border flex items-center gap-2 transition-all ${selectedMechanic === mech.id ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
                  <mech.icon className="w-3.5 h-3.5 shrink-0"/>
                  <span className="truncate">{mech.label}</span>
                </button>
              ))}
            </div>
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

      {/* CENTER WORKSPACE */}
      <div className="flex-1 flex flex-col bg-slate-900 relative">
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-800/50 backdrop-blur">
          <h1 className="text-xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent tracking-tight">
            MATCH BUILDER PRO
          </h1>
          
          {mode === 'play' && (
            <div className="flex-1 flex justify-center mx-8">
              <div className="flex gap-2 bg-slate-700 p-2 rounded-xl border-b-4 border-slate-900 shadow-inner min-w-[320px] justify-start">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="w-10 h-10 bg-slate-800 rounded shadow-inner border border-slate-900 relative">
                    {container[i] && (
                      <div className={`absolute inset-0 rounded flex items-center justify-center 
                        ${COLORS.find(c=>c.id === container[i].color).bg} 
                        ${COLORS.find(c=>c.id === container[i].color).border} border-b-4`}>
                        {React.createElement(ICONS[container[i].baseIcon], { 
                          className: `w-6 h-6 ${COLORS.find(c=>c.id === container[i].color).class}` 
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {mode === 'edit' ? (
              <button 
                onClick={isPlayable ? startPlayMode : undefined} 
                className={`flex items-center gap-2 font-bold px-6 py-2 rounded-lg transition-all ${
                  isPlayable 
                    ? 'bg-green-500 hover:bg-green-400 text-slate-900 shadow-lg shadow-green-500/20' 
                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                }`}>
                <Play className="w-4 h-4" /> Test Level
              </button>
            ) : (
              <button onClick={stopPlayMode} className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white font-bold px-6 py-2 rounded-lg shadow-lg transition-all">
                <Square className="w-4 h-4" /> Stop Testing
              </button>
            )}
          </div>
        </div>

        {/* Canvas Area */}
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
                }}
              />
            )}
            {(mode === 'play' ? playTiles : tiles).map(tile => renderTile(tile, mode === 'play'))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR: Detailed Score Breakdown Dashboard */}
      <div className="w-80 bg-slate-900 border-l border-slate-800 p-5 flex flex-col h-full overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Balance Analytics</h2>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 mb-5 border border-slate-700 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Difficulty Score</p>
          <p className="text-4xl font-black text-cyan-400 drop-shadow-sm">
            {difficultyStats.total.toFixed(2)}
          </p>
          <div className="mt-2 text-[10px] text-slate-400 flex justify-between border-t border-slate-700/50 pt-2">
            <span>Starting Matches: <strong className="text-amber-300">{difficultyStats.startingMatchesCount}</strong></span>
            <span>MAI Index: <strong className="text-white">{difficultyStats.mai}</strong></span>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase border-b border-slate-800 pb-1">Detailed Metrics</h3>
          
          <MetricRow 
            label="Tile Count Weight" 
            value={difficultyStats.breakdown.tileCount} 
            detail={`${tiles.length} total tiles`} 
          />
          <MetricRow 
            label="Theme Icons Weight" 
            value={difficultyStats.breakdown.icons} 
            detail="Base subject diversity" 
          />
          <MetricRow 
            label="Color Variants Weight" 
            value={difficultyStats.breakdown.colors} 
            detail="Secondary color sub-targets" 
          />
          <MetricRow 
            label="Diagonal Covers (Soft)" 
            value={difficultyStats.breakdown.diagCovers} 
            detail={`${difficultyStats.diagCoversCount} diagonal blocks`} 
          />
          <MetricRow 
            label="Stack Covers (Hard)" 
            value={difficultyStats.breakdown.stackCovers} 
            detail={`${difficultyStats.stackCoversCount} direct vertical stacks`} 
          />
          <MetricRow 
            label="Special Mechanics" 
            value={difficultyStats.breakdown.mechanics} 
            detail="Ice, Chains, Hidden, etc." 
          />
          
          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 space-y-1 mt-2">
            <div className="flex justify-between text-xs font-semibold text-slate-400">
              <span>Core Subtotal:</span>
              <span className="font-mono text-white">+{difficultyStats.coreSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-slate-400">
              <span>Special Subtotal:</span>
              <span className="font-mono text-white">+{difficultyStats.specialSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-slate-400 border-t border-slate-700 pt-1">
              <span>Static Total:</span>
              <span className="font-mono text-cyan-300">{difficultyStats.staticTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className={`p-3 rounded-lg border ${difficultyStats.breakdown.maiPenalty > 0 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-green-500/10 border-green-300/30'}`}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-slate-300">MAI Pacing Penalty</span>
              <span className={`font-mono font-bold text-xs ${difficultyStats.breakdown.maiPenalty > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                +{difficultyStats.breakdown.maiPenalty.toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Applied when match availability falls beneath the Sweet Spot ceiling (3.50).
            </p>
          </div>
        </div>

        <div className="mt-auto pt-4">
          <div className="bg-slate-800 rounded p-3 text-[11px] text-slate-400 leading-relaxed border border-slate-700">
            <p className="flex gap-1.5 mb-1 font-bold text-slate-300"><Info className="w-3.5 h-3.5 text-blue-400 inline"/> Multi-Tier Architecture</p>
            Static Difficulty × Distribution Pattern × Pacing Mods determine final player progression balance.
          </div>
        </div>
      </div>

      {/* SUGGEST LEVEL CONFIGURATION MODAL */}
      {isSuggestModalOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setIsSuggestModalOpen(false)}
        >
          <div 
            className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative cursor-default animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} 
          >
            <button 
              onClick={() => setIsSuggestModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors">
              <X className="w-5 h-5"/>
            </button>

            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Shuffle className="w-5 h-5 text-amber-400" /> Suggest Level Generator
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Target Tile Count (Multiple of 3)</label>
                <input 
                  type="number" step="3" min="9" max="150"
                  value={suggestParams.targetTiles}
                  onChange={(e) => setSuggestParams(prev => ({...prev, targetTiles: e.target.value}))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Z-Layers (2-5)</label>
                  <input 
                    type="number" min="2" max="5"
                    value={suggestParams.layers}
                    onChange={(e) => setSuggestParams(prev => ({...prev, layers: e.target.value}))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Stack Cover Ratio (%)</label>
                  <input 
                    type="number" min="0" max="100"
                    value={suggestParams.stackRatio}
                    onChange={(e) => setSuggestParams(prev => ({...prev, stackRatio: e.target.value}))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="border-t border-slate-700 pt-3">
                <p className="font-bold text-amber-400 mb-2 uppercase tracking-wide">Special Mechanics Spawn Quotas (%)</p>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Hidden Tiles %</label>
                    <input 
                      type="number" min="0" max="50"
                      value={suggestParams.hiddenPct}
                      onChange={(e) => setSuggestParams(prev => ({...prev, hiddenPct: e.target.value}))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Chained Tiles %</label>
                    <input 
                      type="number" min="0" max="50"
                      value={suggestParams.chainedPct}
                      onChange={(e) => setSuggestParams(prev => ({...prev, chainedPct: e.target.value}))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Ice Tiles %</label>
                    <input 
                      type="number" min="0" max="50"
                      value={suggestParams.icePct}
                      onChange={(e) => setSuggestParams(prev => ({...prev, icePct: e.target.value}))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Blocker Tiles %</label>
                    <input 
                      type="number" min="0" max="50"
                      value={suggestParams.blockerPct}
                      onChange={(e) => setSuggestParams(prev => ({...prev, blockerPct: e.target.value}))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={() => executeSuggestLevel(suggestParams)}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl mt-4 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Generate & Spawn Level (Configured Layout)
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