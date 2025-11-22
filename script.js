console.log('JavaScript file is loading...');

// Stone Visualizer JavaScript - Complete Version with All Bug Fixes and Improvements

// ============= PRESET SYSTEM - STEP 1 ONLY =============
let housePresets = {};

// Load all presets from localStorage
function loadAllPresets() {
    try {
        const saved = localStorage.getItem('housePresets');
        housePresets = saved ? JSON.parse(saved) : {};
        console.log('Loaded presets:', Object.keys(housePresets));
    } catch (e) {
        console.warn('Could not load presets:', e);
        housePresets = {};
    }
}

// Save all presets to localStorage
function saveAllPresets() {
    try {
        localStorage.setItem('housePresets', JSON.stringify(housePresets));
        console.log('Saved presets for houses:', Object.keys(housePresets));
    } catch (e) {
        console.warn('Could not save presets:', e);
    }
}

// Get a clean house name for preset keys
function getHouseKey(housePath) {
    if (!housePath) return null;
    return housePath.split('/').pop().split('.')[0];
}

// Auto-save current canvas state for the current house
function autoSaveCurrentHouse() {
    const houseSelect = document.getElementById('house-select');
    if (!houseSelect) return;
    
    const houseKey = getHouseKey(houseSelect.value);
    if (!houseKey) return;
    
    // Only save if there are actually mapped areas
    const hasContent = areas.length > 0 || depthEdges.length > 0 || sills.length > 0 || 
                      brickRows.length > 0 || decorations.length > 0 || accents.length > 0;
    
    if (hasContent) {
        housePresets[houseKey] = {
            areas: JSON.parse(JSON.stringify(areas)),
            depthEdges: JSON.parse(JSON.stringify(depthEdges)),
            sills: JSON.parse(JSON.stringify(sills)),
            brickRows: JSON.parse(JSON.stringify(brickRows)),
            decorations: JSON.parse(JSON.stringify(decorations)),
            accents: JSON.parse(JSON.stringify(accents)),
            lastModified: Date.now(),
            housePath: houseSelect.value
        };
        saveAllPresets();
        console.log(`Auto-saved preset for: ${houseKey}`);
    }
}

// Manually save current state as a named preset
function saveNamedPreset() {
    const houseSelect = document.getElementById('house-select');
    if (!houseSelect) {
        showMessage('No house selected');
        return;
    }
    
    const houseKey = getHouseKey(houseSelect.value);
    if (!houseKey) {
        showMessage('Invalid house selection');
        return;
    }
    
    const hasContent = areas.length > 0 || depthEdges.length > 0 || sills.length > 0 || 
                      brickRows.length > 0 || decorations.length > 0 || accents.length > 0;
    
    if (!hasContent) {
        showMessage('No mapped areas to save');
        return;
    }
    
    const presetName = prompt(`Save preset for ${houseKey}:`, `${houseKey} - ${new Date().toLocaleDateString()}`);
    if (!presetName) return;
    
    const presetKey = `${houseKey}_${Date.now()}`;
    housePresets[presetKey] = {
        name: presetName,
        areas: JSON.parse(JSON.stringify(areas)),
        depthEdges: JSON.parse(JSON.stringify(depthEdges)),
        sills: JSON.parse(JSON.stringify(sills)),
        brickRows: JSON.parse(JSON.stringify(brickRows)),
        decorations: JSON.parse(JSON.stringify(decorations)),
        accents: JSON.parse(JSON.stringify(accents)),
        lastModified: Date.now(),
        housePath: houseSelect.value,
        baseHouse: houseKey
    };
    
    saveAllPresets();
    updatePresetsList();
    showMessage(`Preset "${presetName}" saved!`);
}

// Load a specific named preset
function loadNamedPreset(presetKey) {
    if (!presetKey || !housePresets[presetKey]) {
        showMessage('Preset not found');
        return;
    }
    
    const preset = housePresets[presetKey];
    
    // Switch to the correct house first if needed
    const houseSelect = document.getElementById('house-select');
    if (houseSelect && preset.housePath && houseSelect.value !== preset.housePath) {
        houseSelect.value = preset.housePath;
        loadHouseImage(preset.housePath);
    }
    
    // Load the preset data
    areas = preset.areas || [];
    depthEdges = preset.depthEdges || [];
    sills = preset.sills || [];
    brickRows = preset.brickRows || [];
    decorations = preset.decorations || [];
    accents = preset.accents || [];
    
    // Update UI
    updateAreasList();
    updateDepthList();
    updateSillsList();
    updateBrickRowsList();
    updateDecorationsList();
    updateAccentsList();
    
    selectedAreaIndex = -1;
    selectedDepthEdgeIndex = -1;
    selectedSillIndex = -1;
    selectedBrickRowIndex = -1;
    selectedDecorationIndex = -1;
    selectedAccentIndex = -1;
    
    disableMainAreaControls();
    drawCanvas();
    
    const name = preset.name || presetKey;
    showMessage(`Loaded preset: "${name}"`);
}

// Delete a preset
function deletePreset(presetKey) {
    if (!presetKey || !housePresets[presetKey]) return;
    
    const preset = housePresets[presetKey];
    const name = preset.name || presetKey;
    
    if (confirm(`Delete preset "${name}"?`)) {
        delete housePresets[presetKey];
        saveAllPresets();
        updatePresetsList();
        showMessage(`Deleted preset "${name}"`);
    }
}

// Update the presets list UI
function updatePresetsList() {
    const presetsList = document.getElementById('presets-list');
    if (!presetsList) return;
    
    const houseSelect = document.getElementById('house-select');
    const currentHouseKey = houseSelect ? getHouseKey(houseSelect.value) : null;
    
    // Get presets for current house
    const relevantPresets = Object.entries(housePresets).filter(([key, preset]) => {
        return currentHouseKey && (key === currentHouseKey || preset.baseHouse === currentHouseKey);
    });
    
    if (relevantPresets.length === 0) {
        presetsList.innerHTML = '<div class="empty-state">No presets saved for this house</div>';
        return;
    }
    
    presetsList.innerHTML = relevantPresets.map(([key, preset]) => {
        const isAuto = key === currentHouseKey;
        const name = isAuto ? `🔄 Auto-saved` : (preset.name || key);
        const date = new Date(preset.lastModified).toLocaleDateString();
        
        return `
            <div class="preset-item ${isAuto ? 'auto-preset' : ''}">
                <div class="preset-info">
                    <div class="preset-name">${name}</div>
                    <div class="preset-date">${date}</div>
                </div>
                <div class="preset-actions">
                    <button onclick="loadNamedPreset('${key}')" class="preset-btn load-btn" title="Load Preset">📁</button>
                    ${!isAuto ? `<button onclick="deletePreset('${key}')" class="preset-btn delete-btn" title="Delete Preset">🗑️</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// --- Global Configuration & State Variables ---
let GLOBAL_STONE_SCALE = 100; // Default scale set to 200% (middle of new range)
let TEXTURE_MODE = 'stone_linear';
let currentBrickPattern = 'running'; // 'running', 'soldier', 'rowlock', 'header'
let customBrickColor = '#AD4F4F'; // Default custom brick color
let CANVAS_ORIENTATION = 'landscape'; // 'landscape' or 'portrait'
let customMortarColor = '#696969'; // Default custom mortar color
let previousHouseValue = null; // Track previous house for saving


// Filter state variables
let activeFilters = {};
let filteredStones = [];


// --- Canvas & Context ---
let ctx;
let canvas;
let drawingCtx;
let drawingCanvas;
let originalCanvasWidth, originalCanvasHeight;
// ADD this function anywhere after your global variables but before other functions:

function scaleToBrickSize(scale) {
    // Brick-specific scaling (smaller minimum)
    // 10% = tiniest bricks (~0.0375x original)
    // 800% = largest bricks (~1.8x original)
    const minScale = 10;
    const maxScale = 800;
    const minSize = 0.0375; // was 0.075
    const maxSize = 1.8;

    const clampedScale = Math.max(minScale, Math.min(maxScale, scale));
    const normalizedScale = (clampedScale - minScale) / (maxScale - minScale);
    return minSize + (normalizedScale * (maxSize - minSize));
}

// --- Image & Element Data ---
let currentImage = null;
let imageScale = 1;
let imagePosition = { x: 0, y: 0 };
let originalImageDimensions = { width: 0, height: 0 };
let currentStone = null;
let areas = [];
let depthEdges = [];
let sills = [];
let brickRows = [];
let decorations = [];
let areaDrawingMode = 'freehand'; // 'freehand' or 'rectangle'
let rectangleStartPoint = null;

// --- Caches ---
let stoneImages = {};
let stonePatterns = {};
let processedSingleImages = {};
let decorationImages = {};

// --- UI Interaction State ---
let selectedAreaIndex = -1;
let selectedDepthEdgeIndex = -1;
let selectedSillIndex = -1;
let selectedBrickRowIndex = -1;
let selectedDecorationIndex = -1;


let accents = [];
let selectedAccentIndex = -1;
let isDrawingAccent = false;
let currentAccentPoints = [];
let currentAccentType = 'strip-flashing';
let currentFlashingColor = '#808080'; // Default gray
let nextCustomAccentId = 1;

// --- Stone Scale Memory ---
let stoneScaleMemory = {}; // Store scale per stone URL: { stoneUrl: scaleValue }

let isDrawingArea = false;
let currentPoints = [];
let isSubtractMode = false;


let isDrawingDepthEdge = false;
let currentDepthEdgePoints = [];
let depthEffectIntensity = 20;
let depthEdgeMode = 'line'; // 'line' or 'area'

let isDrawingSill = false;
let currentSillPoints = [];
let currentSillType = 'stone'; 
let currentSillTexture = 'smooth'; 
let currentSillColor = 'grey'; 
let sillThickness = 10;
let currentSillLength = 4; 
let currentSillMortarColor = '#8B8B8B'; 
let currentSillMortarThickness = 5; 
let currentSillJointStyle = 'standard';

// --- Brick Row Drawing State & Defaults ---
let isDrawingBrickRow = false;
let currentBrickRowPoints = [];
let currentBrickColor = 'red3';
let currentBrickTexture = 'smooth';
let currentBrickMortarColor = '#696969';
// Color fill mode variables
let currentFillColor = '#A0A0A0';
let currentFillOpacity = 1.0;
// Texture management
let loadedTextures = {};
let textureList = [
    { name: 'None', value: null },
    { name: 'Rough Brick', value: 'rough-brick', file: null }, // Will be your uploaded image
    { name: 'Weathered', value: 'weathered', file: null },
    { name: 'Smooth', value: 'smooth', file: null }
];

// Texture loading function
function loadTexture(textureFile, textureName) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            loadedTextures[textureName] = img;
            resolve(img);
        };
        img.onerror = reject;
        img.src = textureFile;
    });
}

// Function to apply texture to canvas context

// REPLACE your createTexturePattern function with this scaled version:

function createTexturePattern(texture, color, scale = 1, contrast = 1) {
    if (!texture || !loadedTextures[texture]) return null;
    
    // Return the original texture image for manual tiling (no patterns)
    return loadedTextures[texture];
}
let brickRowHeight = 40;
let brickMortarThickness = 2;

// --- Decoration State ---
let isAddingDecoration = false;
let currentDecoration = null;
let nextCustomDecorationId = 1;

// --- Accent State Variables ---


// --- Decoration Resizing State - FIXED ---
let isResizingDecoration = false;
let decorationResizeHandle = null; // 'nw', 'ne', 'sw', 'se' for corner handles
let decorationResizeStartSize = 0;
let decorationResizeStartMouse = { x: 0, y: 0 };

// --- Dragging State ---
let isDragging = false;
let draggedElementType = null; 
let draggedElementIndex = -1;
let dragStartX, dragStartY; 
let dragElementStartPoints = []; 
let isResizingSill = false;
let resizingEndpoint = null;
let isDraggingVertex = false;
let draggedVertexIndex = -1;
let isResizingDepthEdge = false; 

// --- Undo/Redo System ---
let undoStack = [];
let redoStack = [];
const MAX_UNDO_STEPS = 20;

// --- Upload Counters ---
let nextCustomStoneId = 1;
let nextCustomHouseId = 1;

// --- Mouse Position ---
let lastMousePosition = null;

// --- Clipboard State ---
let clipboardData = null;

// --- Drawing State Control ---
let isInDrawingMode = false;

// --- Drawing Tools State - FIXED ---
let isDrawingToolsActive = false;
let currentDrawingTool = 'pointer';
let drawingColor = '#ff0000';
let strokeWidth = 2;
let fontSize = 16;
let isDrawingAnnotation = false;
let drawingStartPoint = null;
let currentAnnotationPath = [];
let annotations = [];
let selectedAnnotation = null;
let editingTextAnnotation = null;

// NEW: Annotation dragging state
let isDraggingAnnotation = false;
let dragStartAnnotation = null;
let dragOriginalAnnotation = null;

// --- Material Definitions ---
const sillTextures = {
    stone: {
        smooth: { pattern: 'solid', roughness: 0.1 }, 
        granite: { pattern: 'speckled', roughness: 0.3 },
        slate: { pattern: 'linear', roughness: 0.5 }, 
        rough: { pattern: 'noise', roughness: 0.8 },
        buff: { pattern: 'sandy', roughness: 0.4 }, 
        glossy: { pattern: 'solid', roughness: 0, shine: true },
        weathered: { pattern: 'aged', roughness: 0.7 }
    },
    concrete: {
        smooth: { pattern: 'solid', roughness: 0.1 }, 
        sandblasted: { pattern: 'dotted', roughness: 0.4 },
        rough: { pattern: 'noise', roughness: 0.6 }, 
        'split-faced': { pattern: 'striated', roughness: 0.9 }
    },
    wood: {
        oak: { pattern: 'grain', color: '#8B6F47' },
        walnut: { pattern: 'grain', color: '#3C2414' },
        cherry: { pattern: 'grain', color: '#A0522D' },
        pine: { pattern: 'grain', color: '#DEB887' },
        mahogany: { pattern: 'grain', color: '#420C09' }
    }
};

const sillColors = {
    grey: '#8B8B8B', 
    charcoal: '#36454F', 
    tan: '#D2B48C',
    buff: '#F0DC82', 
    black: '#1C1C1C', 
    white: '#FAFAFA'
};

const brickStandardColors = {
    red1: '#AD4F4F',
    red2: '#9A3E49',
    red3: '#7B3B3C',
    red4: '#A85C5C',
    brown1: '#8B4513', 
    brown2: '#5C4033', 
    black1: '#2F4F4F', 
    black2: '#1A1A1A', 
    white1: '#FFF8DC', 
    white2: '#F5F5F5'  
};

const brickTextures = { 
    smooth: {}, 
    wired: { lines: true }, 
    textured: { noise: 0.1 },
    rigid: { grooves: true }, 
    glossy: { shine: 0.5 }, 
    splitfaced: { roughness: 0.7 }
};

// Updated stone materials with local image paths - REPLACE your existing STONE_MATERIALS array
const STONE_MATERIALS = [
    // Eldorado Stone - Bluffstone
    { name: 'Bodega', url: './Images/Eldorado Stone/Bluffstone/Profile-Bluffstone-Bodega.jpg', manufacturer: 'eldorado-stone', profile: 'bluffstone' },
    { name: 'Mineret', url: './Images/Eldorado Stone/Bluffstone/Profile-Bluffstone-Mineret.jpg', manufacturer: 'eldorado-stone', profile: 'bluffstone' },
    { name: 'Prescott', url: './Images/Eldorado Stone/Bluffstone/Profile-Bluffstone-Prescott.jpg', manufacturer: 'eldorado-stone', profile: 'bluffstone' },
    
    // Eldorado Stone - Cliffstone
    { name: 'Barley', url: './Images/Eldorado Stone/Cliffstone/Profile-Cliffstone_Barley.jpg', manufacturer: 'eldorado-stone', profile: 'cliffstone' },
    { name: 'Cambria', url: './Images/Eldorado Stone/Cliffstone/Profile-Cliffstone_Cambria.jpg', manufacturer: 'eldorado-stone', profile: 'cliffstone' },
    { name: 'Lantana', url: './Images/Eldorado Stone/Cliffstone/Profile-Cliffstone_Lantana.jpg', manufacturer: 'eldorado-stone', profile: 'cliffstone' },
    { name: 'Mesquite', url: './Images/Eldorado Stone/Cliffstone/Profile-Cliffstone_Mesquite.jpg', manufacturer: 'eldorado-stone', profile: 'cliffstone' },
    { name: 'Banff Springs', url: './Images/Eldorado Stone/Cliffstone/Profile-Cliffstone-Banff_Springs.jpg', manufacturer: 'eldorado-stone', profile: 'cliffstone' },
    { name: 'Boardwalk', url: './Images/Eldorado Stone/Cliffstone/Profile-Cliffstone-Boardwalk.jpg', manufacturer: 'eldorado-stone', profile: 'cliffstone' },
    { name: 'Manzanita', url: './Images/Eldorado Stone/Cliffstone/Profile-Cliffstone-Manzanita.jpg', manufacturer: 'eldorado-stone', profile: 'cliffstone' },
    { name: 'Montecito', url: './Images/Eldorado Stone/Cliffstone/Profile-Cliffstone-Montecito.jpg', manufacturer: 'eldorado-stone', profile: 'cliffstone' },
    { name: 'Nordic Peak', url: './Images/Eldorado Stone/Cliffstone/Profile-Cliffstone-Nordic_Peak.jpg', manufacturer: 'eldorado-stone', profile: 'cliffstone' },
    { name: 'Whitebark', url: './Images/Eldorado Stone/Cliffstone/Profile-Cliffstone-Whitebark.jpg', manufacturer: 'eldorado-stone', profile: 'cliffstone' },
    
    // Eldorado Stone - Coastal Reef
    { name: 'Pearl White', url: './Images/Eldorado Stone/CoastalReef/Profile-CoastalReef-Pearl_White.jpg', manufacturer: 'eldorado-stone', profile: 'coastal-reef' },
    { name: 'Sanibel', url: './Images/Eldorado Stone/CoastalReef/Profile-CoastalReef-Sanibel.jpg', manufacturer: 'eldorado-stone', profile: 'coastal-reef' },
    
    // Eldorado Stone - Country Rubble
    { name: 'Bella', url: './Images/Eldorado Stone/Country Rubble/Profile-Country_Rubble-Bella.jpg', manufacturer: 'eldorado-stone', profile: 'country-rubble' },
    { name: 'Cognac', url: './Images/Eldorado Stone/Country Rubble/Profile-Country_Rubble-Cognac.jpg', manufacturer: 'eldorado-stone', profile: 'country-rubble' },
    { name: 'Millstream', url: './Images/Eldorado Stone/Country Rubble/Profile-Country_Rubble-Millstream.jpg', manufacturer: 'eldorado-stone', profile: 'country-rubble' },
    { name: 'Polermo', url: './Images/Eldorado Stone/Country Rubble/Profile-Country_Rubble-Polermo.jpg', manufacturer: 'eldorado-stone', profile: 'country-rubble' },
    
    // NEW: Eldorado Stone - Cypress Ridge
    { name: 'Catania', url: './Images/Eldorado Stone/Cypress Ridge/Profile-Cypress_Ridge-Catania.jpg', manufacturer: 'eldorado-stone', profile: 'cypress-ridge' },
    { name: 'Orchard', url: './Images/Eldorado Stone/Cypress Ridge/Profile-Cypress_Ridge-Orchard.jpg', manufacturer: 'eldorado-stone', profile: 'cypress-ridge' },
    
    // NEW: Eldorado Stone - European Ledge
    { name: 'Cottonwood', url: './Images/Eldorado Stone/European Ledge/Profile-European_Ledge-Cottonwood.jpg', manufacturer: 'eldorado-stone', profile: 'european-ledge' },
    { name: 'Glacier', url: './Images/Eldorado Stone/European Ledge/Profile-European_Ledge-Glacier.jpg', manufacturer: 'eldorado-stone', profile: 'european-ledge' },
    { name: 'Iron Mill', url: './Images/Eldorado Stone/European Ledge/Profile-European_Ledge-Iron_Mill.jpg', manufacturer: 'eldorado-stone', profile: 'european-ledge' },
    { name: 'Linen', url: './Images/Eldorado Stone/European Ledge/Profile-European_Ledge-Linen.jpg', manufacturer: 'eldorado-stone', profile: 'european-ledge' },
    { name: 'Sea Cliff', url: './Images/Eldorado Stone/European Ledge/Profile-European_ledge-sea_cliff.jpg', manufacturer: 'eldorado-stone', profile: 'european-ledge' },
    { name: 'Sidewalk', url: './Images/Eldorado Stone/European Ledge/Profile-European_Ledge-Sidewalk.jpg', manufacturer: 'eldorado-stone', profile: 'european-ledge' },
    { name: 'Zinc', url: './Images/Eldorado Stone/European Ledge/Profile-European_Ledge-Zinc.jpg', manufacturer: 'eldorado-stone', profile: 'european-ledge' },
    
    // NEW: Eldorado Stone - Fieldledge
    { name: 'Veneto', url: './Images/Eldorado Stone/Fieldledge/Profile-Fieldledge_Veneto.jpg', manufacturer: 'eldorado-stone', profile: 'fieldledge' },
    { name: 'Andante', url: './Images/Eldorado Stone/Fieldledge/Profile-Fieldledge-Andante.jpg', manufacturer: 'eldorado-stone', profile: 'fieldledge' },
    { name: 'Meseta', url: './Images/Eldorado Stone/Fieldledge/Profile-Fieldledge-Meseta.jpg', manufacturer: 'eldorado-stone', profile: 'fieldledge' },
    { name: 'Padova', url: './Images/Eldorado Stone/Fieldledge/Profile-Fieldledge-Padova.jpg', manufacturer: 'eldorado-stone', profile: 'fieldledge' },
    { name: 'Ranchers Ridge', url: './Images/Eldorado Stone/Fieldledge/Profile-Fieldledge-Ranchers_Ridge.jpg', manufacturer: 'eldorado-stone', profile: 'fieldledge' },
    
    // NEW: Eldorado Stone - Limestone
    { name: 'Grand Banks', url: './Images/Eldorado Stone/Limestone/Profile-Limestone-Grand_Banks.jpg', manufacturer: 'eldorado-stone', profile: 'limestone' },
    { name: 'New Haven Eastern', url: './Images/Eldorado Stone/Limestone/Profile-Limestone-New_Haven_Eastern.jpg', manufacturer: 'eldorado-stone', profile: 'limestone' },
    { name: 'San Marino', url: './Images/Eldorado Stone/Limestone/Profile-Limestone-San_Marino.jpg', manufacturer: 'eldorado-stone', profile: 'limestone' },
    { name: 'Shilo Western', url: './Images/Eldorado Stone/Limestone/Profile-Limestone-Shilo_Western.jpg', manufacturer: 'eldorado-stone', profile: 'limestone' },
    { name: 'York', url: './Images/Eldorado Stone/Limestone/Profile-Limestone-York.jpg', manufacturer: 'eldorado-stone', profile: 'limestone' },
    
    // NEW: Eldorado Stone - Mountain Ledge
    { name: 'Asheville', url: './Images/Eldorado Stone/Mountain Ledge/Profile-Mountain_Ledge-Asheville.jpg', manufacturer: 'eldorado-stone', profile: 'mountain-ledge' },
    { name: 'Charleston', url: './Images/Eldorado Stone/Mountain Ledge/Profile-Mountain_Ledge-Charleston.jpg', manufacturer: 'eldorado-stone', profile: 'mountain-ledge' },
    { name: 'Durango', url: './Images/Eldorado Stone/Mountain Ledge/Profile-Mountain_Ledge-Durango.jpg', manufacturer: 'eldorado-stone', profile: 'mountain-ledge' },
    { name: 'Lexington', url: './Images/Eldorado Stone/Mountain Ledge/Profile-Mountain_Ledge-Lexington.jpg', manufacturer: 'eldorado-stone', profile: 'mountain-ledge' },
    { name: 'Sierra', url: './Images/Eldorado Stone/Mountain Ledge/Profile-Mountain_Ledge-Sierra.jpg', manufacturer: 'eldorado-stone', profile: 'mountain-ledge' },
    { name: 'Yukon', url: './Images/Eldorado Stone/Mountain Ledge/Profile-Mountain_Ledge-Yukon.jpg', manufacturer: 'eldorado-stone', profile: 'mountain-ledge' },
    
    // NEW: Eldorado Stone - River Rock
    { name: 'Colorado', url: './Images/Eldorado Stone/River Rock/Profile-River_Rock-Colorado.jpg', manufacturer: 'eldorado-stone', profile: 'river-rock' },
    { name: 'Rio Grande', url: './Images/Eldorado Stone/River Rock/Profile-River_Rock-Rio_Grande.jpg', manufacturer: 'eldorado-stone', profile: 'river-rock' },
    { name: 'Yakima', url: './Images/Eldorado Stone/River Rock/Profile-River_Rock-Yakima.jpg', manufacturer: 'eldorado-stone', profile: 'river-rock' },
    
    // NEW: Eldorado Stone - Roughcut
    { name: 'Autumn Leaf', url: './Images/Eldorado Stone/Roughcut/Profile-RoughCut-Autumn_Leaf.jpg', manufacturer: 'eldorado-stone', profile: 'roughcut' },
    { name: 'Casa Blanca', url: './Images/Eldorado Stone/Roughcut/Profile-RoughCut-Casa_Blanca.jpg', manufacturer: 'eldorado-stone', profile: 'roughcut' },
    { name: 'Loire Valley', url: './Images/Eldorado Stone/Roughcut/Profile-RoughCut-Loire_Valley.jpg', manufacturer: 'eldorado-stone', profile: 'roughcut' },
    { name: 'Moonlight', url: './Images/Eldorado Stone/Roughcut/Profile-RoughCut-Moonlight.jpg', manufacturer: 'eldorado-stone', profile: 'roughcut' },
    { name: 'Ranchers Ridge', url: './Images/Eldorado Stone/Roughcut/Profile-Roughcut-Ranchers_Ridge.jpg', manufacturer: 'eldorado-stone', profile: 'roughcut' },
    { name: 'Vineyard Trail', url: './Images/Eldorado Stone/Roughcut/Profile-Roughcut-Vineyard_Trail.jpg', manufacturer: 'eldorado-stone', profile: 'roughcut' },
    { name: 'Wheatfield', url: './Images/Eldorado Stone/Roughcut/Profile-RoughCut-Wheatfield.jpg', manufacturer: 'eldorado-stone', profile: 'roughcut' },
    
    // NEW: Eldorado Stone - Stacked Stone
    { name: 'Alderwood', url: './Images/Eldorado Stone/Stacked Stone/Profile-Stacked_Stone-Alderwood.jpg', manufacturer: 'eldorado-stone', profile: 'stacked-stone' },
    { name: 'Black River', url: './Images/Eldorado Stone/Stacked Stone/Profile-Stacked_Stone-Black_River.jpg', manufacturer: 'eldorado-stone', profile: 'stacked-stone' },
    { name: 'Castaway', url: './Images/Eldorado Stone/Stacked Stone/Profile-Stacked_Stone-Castaway.jpg', manufacturer: 'eldorado-stone', profile: 'stacked-stone' },
    { name: 'Chapel Hill', url: './Images/Eldorado Stone/Stacked Stone/Profile-Stacked_Stone-Chapel_Hill.jpg', manufacturer: 'eldorado-stone', profile: 'stacked-stone' },
    { name: 'Dark Rundle', url: './Images/Eldorado Stone/Stacked Stone/Profile-Stacked_Stone-Dark_Rundle.jpg', manufacturer: 'eldorado-stone', profile: 'stacked-stone' },
    { name: 'Daybreak', url: './Images/Eldorado Stone/Stacked Stone/Profile-Stacked_Stone-Daybreak.jpg', manufacturer: 'eldorado-stone', profile: 'stacked-stone' },
    { name: 'Dry Creek', url: './Images/Eldorado Stone/Stacked Stone/Profile-Stacked_Stone-Dry_Creek.jpg', manufacturer: 'eldorado-stone', profile: 'stacked-stone' },
    { name: 'Koryak Ridge', url: './Images/Eldorado Stone/Stacked Stone/Profile-Stacked_Stone-Koryak_Ridge.jpg', manufacturer: 'eldorado-stone', profile: 'stacked-stone' },
    { name: 'Nantucket', url: './Images/Eldorado Stone/Stacked Stone/Profile-Stacked_Stone-Nantucket.jpg', manufacturer: 'eldorado-stone', profile: 'stacked-stone' },
    { name: 'Silver Lining', url: './Images/Eldorado Stone/Stacked Stone/Profile-Stacked_Stone-Silver_Lining.jpg', manufacturer: 'eldorado-stone', profile: 'stacked-stone' },
    { name: 'Slate Gray', url: './Images/Eldorado Stone/Stacked Stone/Profile-Stacked_Stone-Slate_Gray.jpg', manufacturer: 'eldorado-stone', profile: 'stacked-stone' },
    
    // NEW: Casa Di Sassi - Blend
    { name: 'Bolzano', url: './Images/Casa Di Sassi/Blend/Blend-Bolzano-2-1.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-blend' },
    { name: 'Bella', url: './Images/Casa Di Sassi/Blend/casa-profile-blends-bella.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-blend' },
    { name: 'Bianco', url: './Images/Casa Di Sassi/Blend/casa-profile-blends-bianco.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-blend' },
    { name: 'Cremona', url: './Images/Casa Di Sassi/Blend/casa-profile-blends-cremona.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-blend' },
    { name: 'Polare', url: './Images/Casa Di Sassi/Blend/casa-profile-blends-polare.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-blend' },
    { name: 'Terracina', url: './Images/Casa Di Sassi/Blend/casa-profile-blends-terracina.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-blend' },
    
    // NEW: Casa Di Sassi - Brick
    { name: 'Carbone', url: './Images/Casa Di Sassi/Brick/Carbone-Brick.jpeg', manufacturer: 'casa-di-sassi', profile: 'casa-brick' },
    { name: 'Neve', url: './Images/Casa Di Sassi/Brick/casa-profile-brick-neve.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-brick' },
    { name: 'Niveo', url: './Images/Casa Di Sassi/Brick/casa-profile-brick-niveo.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-brick' },
    
    // NEW: Casa Di Sassi - Country Rubble
    { name: 'Matera', url: './Images/Casa Di Sassi/Country Rubble/casa-profile-countryRubble-matera.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-country-rubble' },
    { name: 'Murano', url: './Images/Casa Di Sassi/Country Rubble/casa-profile-countryRubble-murano.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-country-rubble' },
    { name: 'Turin', url: './Images/Casa Di Sassi/Country Rubble/casa-profile-countryRubble-turin.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-country-rubble' },
    { name: 'Osso', url: './Images/Casa Di Sassi/Country Rubble/Osso-Updated-CountryRubble.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-country-rubble' },
    
    // Casa Di Sassi - EZ Ledge (existing)
    { name: 'Carbone', url: './Images/Casa Di Sassi/EZ Ledge/Carbone-Updated-EZLedge.jpg', manufacturer: 'casa-di-sassi', profile: 'ez-ledge' },
    { name: 'Cremona', url: './Images/Casa Di Sassi/EZ Ledge/casa-profile-EZLedge-cremona.jpg', manufacturer: 'casa-di-sassi', profile: 'ez-ledge' },
    { name: 'Gola', url: './Images/Casa Di Sassi/EZ Ledge/casa-profile-EZLedge-gola.jpg', manufacturer: 'casa-di-sassi', profile: 'ez-ledge' },
    { name: 'Matera', url: './Images/Casa Di Sassi/EZ Ledge/casa-profile-EZLedge-matera.jpg', manufacturer: 'casa-di-sassi', profile: 'ez-ledge' },
    { name: 'Niveo EZ', url: './Images/Casa Di Sassi/EZ Ledge/casa-profile-EZLedge-niveo.jpg', manufacturer: 'casa-di-sassi', profile: 'ez-ledge' },
    
    // NEW: Casa Di Sassi - Fieldstone
    { name: 'Gola', url: './Images/Casa Di Sassi/Fieldstone/casa-profile-fieldstone-gola.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-fieldstone' },
    { name: 'Legno', url: './Images/Casa Di Sassi/Fieldstone/casa-profile-fieldstone-legno.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-fieldstone' },
    
    // NEW: Casa Di Sassi - Kwik Stack
    { name: 'Carbone', url: './Images/Casa Di Sassi/Kwik Stack/casa-profile-kwikStack-carbone.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-kwik-stack' },
    { name: 'Matera', url: './Images/Casa Di Sassi/Kwik Stack/casa-profile-kwikStack-matera.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-kwik-stack' },
    { name: 'Niveo', url: './Images/Casa Di Sassi/Kwik Stack/casa-profile-kwikStack-niveo.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-kwik-stack' },
    { name: 'Ardesia', url: './Images/Casa Di Sassi/Kwik Stack/Kwik-Stack-Ardesia-2-1.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-kwik-stack' },
    { name: 'Lucca', url: './Images/Casa Di Sassi/Kwik Stack/Kwik-Stack-Lucca-2-compressor.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-kwik-stack' },
    
    // NEW: Casa Di Sassi - Ledgestone
    { name: 'Bella', url: './Images/Casa Di Sassi/Ledgestone/casa-profile-ledgestone-bella.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-ledgestone' },
    { name: 'Carbone', url: './Images/Casa Di Sassi/Ledgestone/casa-profile-ledgestone-carbone.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-ledgestone' },
    { name: 'Cremona', url: './Images/Casa Di Sassi/Ledgestone/casa-profile-ledgestone-cremona.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-ledgestone' },
    { name: 'Gola', url: './Images/Casa Di Sassi/Ledgestone/casa-profile-ledgestone-gola.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-ledgestone' },
    { name: 'Matera', url: './Images/Casa Di Sassi/Ledgestone/casa-profile-ledgestone-matera.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-ledgestone' },
    { name: 'Turin', url: './Images/Casa Di Sassi/Ledgestone/casa-profile-ledgestone-turin.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-ledgestone' },
    
    // NEW: Casa Di Sassi - Old World
    { name: 'Bella', url: './Images/Casa Di Sassi/Old World/casa-profile-oldWorld-bella.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-old-world' },
    { name: 'Euro', url: './Images/Casa Di Sassi/Old World/casa-profile-oldWorld-euro.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-old-world' },
    { name: 'Grigio', url: './Images/Casa Di Sassi/Old World/casa-profile-oldWorld-grigio.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-old-world' },
    { name: 'Niveo', url: './Images/Casa Di Sassi/Old World/casa-profile-oldWorld-niveo.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-old-world' },
    { name: 'Turin', url: './Images/Casa Di Sassi/Old World/casa-profile-oldWorld-turin.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-old-world' },
    
    // NEW: Casa Di Sassi - Quartz Ledgestone
    { name: 'Ardesia', url: './Images/Casa Di Sassi/Quartz Ledgestone/Quartz-Ledge-Ardesia-2-1.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-quartz-ledgestone' },
    { name: 'Dente', url: './Images/Casa Di Sassi/Quartz Ledgestone/Quartz-Ledge-Dente-2-1.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-quartz-ledgestone' },
    { name: 'Osso', url: './Images/Casa Di Sassi/Quartz Ledgestone/Quartz-Ledge-Osso-2-1.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-quartz-ledgestone' },
    
    // NEW: Casa Di Sassi - Viso Limestone
    { name: 'Ardesia', url: './Images/Casa Di Sassi/Viso Limestone/Viso-Lime-Ardesia-2-compressed.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-viso-limestone' },
    { name: 'Soia', url: './Images/Casa Di Sassi/Viso Limestone/Viso-Lime-Soia-2-compressed.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-viso-limestone' },
    
    // Casa Di Sassi - Volterra (existing)
    { name: 'Genoa', url: './Images/Casa Di Sassi/Volterra/casa-profile-genoa.jpg', manufacturer: 'casa-di-sassi', profile: 'volterra' },
    { name: 'Osso', url: './Images/Casa Di Sassi/Volterra/casa-profile-osso.jpg', manufacturer: 'casa-di-sassi', profile: 'volterra' },
    { name: 'Niveo', url: './Images/Casa Di Sassi/Volterra/casa-profile-volterra-niveo.jpg', manufacturer: 'casa-di-sassi', profile: 'volterra' },
    { name: 'Terracina', url: './Images/Casa Di Sassi/Volterra/casa-profile-volterra-terracina.jpg', manufacturer: 'casa-di-sassi', profile: 'volterra' },
    
    // NEW: Casa Di Sassi - Yorkshire
    { name: 'Sombre', url: './Images/Casa Di Sassi/Yorkshire/casa-profile-yorkshire-sombre.jpg', manufacturer: 'casa-di-sassi', profile: 'casa-yorkshire' },

    // NEW: Rocky Mountain Stoneworks - Prostack Profile
    { name: 'Black Comb Prostack', url: './Images/Rocky Mountain Stoneworks/Prostack/Black-Comb-Prostack-4.jpg', manufacturer: 'rocky-mountain-stoneworks', profile: 'prostack' },
    { name: 'Black Tusk Prostack', url: './Images/Rocky Mountain Stoneworks/Prostack/Black-Tusk-Prostack.webp', manufacturer: 'rocky-mountain-stoneworks', profile: 'prostack' },
    { name: 'Silverstone PS', url: './Images/Rocky Mountain Stoneworks/Prostack/silverstone-ps.webp', manufacturer: 'rocky-mountain-stoneworks', profile: 'prostack' },
    { name: 'White Quartzite', url: './Images/Rocky Mountain Stoneworks/Prostack/White Quartzite.jpg', manufacturer: 'rocky-mountain-stoneworks', profile: 'prostack' },

    // NEW: Rocky Mountain Stoneworks - Random Ledge Profile
    { name: 'Alpine Grey Random Ledge', url: './Images/Rocky Mountain Stoneworks/Random Ledge/Alpine-Grey-Random-Ledge.jpg', manufacturer: 'rocky-mountain-stoneworks', profile: 'random-ledge' },
    { name: 'Frosted Coal Random Ledge', url: './Images/Rocky Mountain Stoneworks/Random Ledge/Frosted-Coal-Random-Ledge.jpg', manufacturer: 'rocky-mountain-stoneworks', profile: 'random-ledge' },
    { name: 'Black Tusk Random Ledge', url: './Images/Rocky Mountain Stoneworks/Random Ledge/rms-black-tusk-random-ledge.png', manufacturer: 'rocky-mountain-stoneworks', profile: 'random-ledge' },
    { name: 'Pure White Random Ledge', url: './Images/Rocky Mountain Stoneworks/Random Ledge/rms-pure-white-random-ledge.png', manufacturer: 'rocky-mountain-stoneworks', profile: 'random-ledge' }
    
];



const DUTCH_QUALITY_MATERIALS = [
    // Dry Stack Profile
    { name: 'Ashen', profile: 'dry-stack', url: 'Images/Dutch Quality/Dry Stack/Ashen-Dry-Stack.jpg', manufacturer: 'dutch-quality' },
    { name: 'Coal Crest', profile: 'dry-stack', url: 'Images/Dutch Quality/Dry Stack/DQ_Profile_Coal-Crest_Drystack.jpg', manufacturer: 'dutch-quality' },
    { name: 'Arizona', profile: 'dry-stack', url: 'Images/Dutch Quality/Dry Stack/DQ_Profile_Dry-Stack_Arizona.jpg', manufacturer: 'dutch-quality' },
    { name: 'Pennsylvania', profile: 'dry-stack', url: 'Images/Dutch Quality/Dry Stack/DQ_Profile_Dry-Stack_Pennsylvania.jpg', manufacturer: 'dutch-quality' },
    { name: 'Prestige', profile: 'dry-stack', url: 'Images/Dutch Quality/Dry Stack/DQ_Profile_Dry-Stack_Prestige.jpg', manufacturer: 'dutch-quality' },
    { name: 'Sienna', profile: 'dry-stack', url: 'Images/Dutch Quality/Dry Stack/DQ_Profile_Dry-Stack_Sienna.jpg', manufacturer: 'dutch-quality' },
    { name: 'Winter Point', profile: 'dry-stack', url: 'Images/Dutch Quality/Dry Stack/DQ-Profile-Weather-Ledge-Winter-Point.jpg', manufacturer: 'dutch-quality' },
    
    // Fieldstone Profile
    { name: 'Kentucky', profile: 'fieldstone', url: 'Images/Dutch Quality/Fieldstone/DQ_Profile_Fieldstone_Kentucky.jpg', manufacturer: 'dutch-quality' },
    { name: 'Pennsylvania', profile: 'fieldstone', url: 'Images/Dutch Quality/Fieldstone/DQ_Profile_Fieldstone_Pennsylvania.jpg', manufacturer: 'dutch-quality' },
    { name: 'Sienna', profile: 'fieldstone', url: 'Images/Dutch Quality/Fieldstone/Sienna-Fieldstone.jpg', manufacturer: 'dutch-quality' },
    
    // Ledgestone Profile
    { name: 'Pennsylvania', profile: 'ledgestone', url: 'Images/Dutch Quality/Ledgestone/DQ_Profile_Ledgestone_Pennsylvania.jpg', manufacturer: 'dutch-quality' },
    { name: 'Quail Grey', profile: 'ledgestone', url: 'Images/Dutch Quality/Ledgestone/DQ_Profile_Ledgestone_Quail-Grey.jpg', manufacturer: 'dutch-quality' },
    { name: 'Natural Blend', profile: 'ledgestone', url: 'Images/Dutch Quality/Ledgestone/DQ-Profile-Ledgestone-Natural-Blend.jpg', manufacturer: 'dutch-quality' },
    { name: 'Prestige', profile: 'ledgestone', url: 'Images/Dutch Quality/Ledgestone/DQ-Profile-Ledgestone-Prestige.jpg', manufacturer: 'dutch-quality' },
    { name: 'Sagewood', profile: 'ledgestone', url: 'Images/Dutch Quality/Ledgestone/Sagewood-Ledgestone.jpg', manufacturer: 'dutch-quality' },
    { name: 'Sienna', profile: 'ledgestone', url: 'Images/Dutch Quality/Ledgestone/Sienna-Ledgestone.jpg', manufacturer: 'dutch-quality' },
    
    // ADD THE REMAINING PROFILES HERE - INSIDE THE ARRAY:
    
    // Limestone Profile
    { name: 'Charcoal', profile: 'limestone', url: 'Images/Dutch Quality/Limestone/Charcoal-Limestone.jpg', manufacturer: 'dutch-quality' },
    { name: 'Greystone Rough Ashlar', profile: 'limestone', url: 'Images/Dutch Quality/Limestone/DQ_Profile_Greystone_Rough-Ashlar.jpg', manufacturer: 'dutch-quality' },
    { name: 'Columbus Blend', profile: 'limestone', url: 'Images/Dutch Quality/Limestone/DQ_Profile_Limestone_Columbus-Blend.jpg', manufacturer: 'dutch-quality' },
    { name: 'Great Lakes', profile: 'limestone', url: 'Images/Dutch Quality/Limestone/DQ_Profile_Limestone_Great-Lakes.jpg', manufacturer: 'dutch-quality' },
    { name: 'Ohio Tan', profile: 'limestone', url: 'Images/Dutch Quality/Limestone/DQ_Profile_Limestone_Ohio-Tan.jpg', manufacturer: 'dutch-quality' },
    { name: 'Trailhead Rough Ashlar', profile: 'limestone', url: 'Images/Dutch Quality/Limestone/DQ_Profile_Trailhead_Rough-Ashlar.jpg', manufacturer: 'dutch-quality' },
    { name: 'Winter Point Rough Ashlar', profile: 'limestone', url: 'Images/Dutch Quality/Limestone/DQ_Profile_Winter-Point_Rough-Ashlar.jpg', manufacturer: 'dutch-quality' },
    { name: 'Oak Blend', profile: 'limestone', url: 'Images/Dutch Quality/Limestone/DQ-Profile_Oak-Blend_Limestone.jpg', manufacturer: 'dutch-quality' },
    { name: 'Autumn Blend', profile: 'limestone', url: 'Images/Dutch Quality/Limestone/DQ-Profile-Limestone-Autumn-Blend.jpg', manufacturer: 'dutch-quality' },
    { name: 'Kentucky Blend', profile: 'limestone', url: 'Images/Dutch Quality/Limestone/Kentucky-Blend-Limestone.jpg', manufacturer: 'dutch-quality' },
    { name: 'Pennsylvania', profile: 'limestone', url: 'Images/Dutch Quality/Limestone/Pennsylvania-Limestone.jpg', manufacturer: 'dutch-quality' },

    // Stack Ledge Profile
    { name: 'Autumn Blend', profile: 'stack-ledge', url: 'Images/Dutch Quality/Stack Ledge/DQ_Profile_Stack-Ledge_Autumn-Blend.jpg', manufacturer: 'dutch-quality' },
    { name: 'Sagewood', profile: 'stack-ledge', url: 'Images/Dutch Quality/Stack Ledge/DQ_Profile_Stack-Ledge_Sagewood.jpg', manufacturer: 'dutch-quality' },
    { name: 'Sienna', profile: 'stack-ledge', url: 'Images/Dutch Quality/Stack Ledge/DQ_Profile_Stack-Ledge_Sienna.jpg', manufacturer: 'dutch-quality' },
    { name: 'Oak Blend', profile: 'stack-ledge', url: 'Images/Dutch Quality/Stack Ledge/DQ-Profile_Oak-Blend_Stack-Ledge.jpg', manufacturer: 'dutch-quality' },
    { name: 'Fallbrook', profile: 'stack-ledge', url: 'Images/Dutch Quality/Stack Ledge/Fallbrook-Stack-Ledge.jpg', manufacturer: 'dutch-quality' },
    
    // Tuscan Ridge Profile
    { name: 'Elkwood', profile: 'tuscan-ridge', url: 'Images/Dutch Quality/Tuscan Ridge/Elkwood-Tuscan-Ridge.jpg', manufacturer: 'dutch-quality' },
    { name: 'Natural Blend', profile: 'tuscan-ridge', url: 'Images/Dutch Quality/Tuscan Ridge/Natural-Blend-Tuscan-Ridge.jpg', manufacturer: 'dutch-quality' },
    { name: 'Sienna', profile: 'tuscan-ridge', url: 'Images/Dutch Quality/Tuscan Ridge/Sienna-Tuscan-Ridge.jpg', manufacturer: 'dutch-quality' },
    { name: 'Winter Point', profile: 'tuscan-ridge', url: 'Images/Dutch Quality/Tuscan Ridge/Winter-Point-Tuscan-Ridge.jpg', manufacturer: 'dutch-quality' },
    
    // Weather Ledge Profile
    { name: 'Ashen', profile: 'weather-ledge', url: 'Images/Dutch Quality/Weather Ledge/Ashen-Weather-Ledge.jpg', manufacturer: 'dutch-quality' },
    { name: 'Coal Crest', profile: 'weather-ledge', url: 'Images/Dutch Quality/Weather Ledge/DQ_Profile_Coal-Crest_Weather-Ledge.jpg', manufacturer: 'dutch-quality' },
    { name: 'Pennsylvania', profile: 'weather-ledge', url: 'Images/Dutch Quality/Weather Ledge/DQ_Profile_Weather-Ledge_Pennsylvania.jpg', manufacturer: 'dutch-quality' },
    { name: 'Prestige', profile: 'weather-ledge', url: 'Images/Dutch Quality/Weather Ledge/DQ_Profile_Weather-Ledge_Prestige.jpg', manufacturer: 'dutch-quality' },
    { name: 'Quail Grey', profile: 'weather-ledge', url: 'Images/Dutch Quality/Weather Ledge/DQ_Profile_Weather-Ledge_Quail-Grey.jpg', manufacturer: 'dutch-quality' },
    { name: 'Winter Point', profile: 'weather-ledge', url: 'Images/Dutch Quality/Weather Ledge/DQ-Profile-Weather-Ledge-Winter-Point.jpg', manufacturer: 'dutch-quality' },
    { name: 'Elkwood', profile: 'weather-ledge', url: 'Images/Dutch Quality/Weather Ledge/Elkwood-Weather-Ledge.jpg', manufacturer: 'dutch-quality' },
    
    // Weathered Plank Profile
    { name: 'Industrial Grey', profile: 'weathered-plank', url: 'Images/Dutch Quality/Weathered Plank/Industrial-Grey-Weathered-Plank.jpg', manufacturer: 'dutch-quality' },
    { name: 'Winesburg', profile: 'weathered-plank', url: 'Images/Dutch Quality/Weathered Plank/Winesburg-Weathered-Plank.jpg', manufacturer: 'dutch-quality' }

]; 

// Endicott Thin Brick Materials
const ENDICOTT_MATERIALS = [
    // Smooth Profile
    { name: 'Autumn Sands', profile: 'smooth', url: 'Images/Thin Brick/Endicott/Autumn-Sands-Heritage-Thinbrick.jpg', manufacturer: 'endicott' },
    { name: 'Bordeaux Blend', profile: 'smooth', url: 'Images/Thin Brick/Endicott/Bordeaux-Blend-Smooth-Thinbrick.jpg', manufacturer: 'endicott' },
    { name: 'Burgundy Blend', profile: 'smooth', url: 'Images/Thin Brick/Endicott/Burgundy-Blend-Smooth-Thinbrick.jpg', manufacturer: 'endicott' },
    { name: 'Copper Canyon', profile: 'smooth', url: 'Images/Thin Brick/Endicott/Copper-Canyon-Smooth-Thinbrick.jpg', manufacturer: 'endicott' },
    { name: 'Coppertone', profile: 'smooth', url: 'Images/Thin Brick/Endicott/Coppertone-Smooth-Thinbrick.jpg', manufacturer: 'endicott' },
    { name: 'Dark Ironspot', profile: 'smooth', url: 'Images/Thin Brick/Endicott/Dark-Ironspot-Smooth-Thinbrick.jpg', manufacturer: 'endicott' },
    { name: 'Dark Sandstone', profile: 'smooth', url: 'Images/Thin Brick/Endicott/Dark-Sandstone-Smooth-Thinbrick.jpg', manufacturer: 'endicott' },
    { name: 'Desert Ironspot Dark', profile: 'smooth', url: 'Images/Thin Brick/Endicott/Desert-Ironspot-Dark-Smooth-Thinbrick.jpg', manufacturer: 'endicott' },
    { name: 'Desert Ironspot Light', profile: 'smooth', url: 'Images/Thin Brick/Endicott/Desert-Ironspot-Light-Smooth-Thinbrick.jpg', manufacturer: 'endicott' },
    { name: 'Executive Ironspot', profile: 'smooth', url: 'Images/Thin Brick/Endicott/Executive-Ironspot-Smooth-Thinbrick.jpg', manufacturer: 'endicott' },
    { name: 'Golden Buff', profile: 'smooth', url: 'Images/Thin Brick/Endicott/Golden-Buff-Smooth-Thinbrick.jpg', manufacturer: 'endicott' },
    { name: 'Graphite', profile: 'smooth', url: 'Images/Thin Brick/Endicott/Graphite-Smooth-Thinbrick.jpg', manufacturer: 'endicott' },
    { name: 'Gray Blend', profile: 'smooth', url: 'Images/Thin Brick/Endicott/Gray-Blend-Smooth-Thinbrick.jpg', manufacturer: 'endicott' },
    { name: 'Gray Sands', profile: 'smooth', url: 'Images/Thin Brick/Endicott/Gray-Sands-Square-Edge-No-Texture-Thinbrick.jpg', manufacturer: 'endicott' },
    { name: 'Light Gray', profile: 'smooth', url: 'Images/Thin Brick/Endicott/Light-Gray-Blend-Smooth-Thinbrick.jpg', manufacturer: 'endicott' },
    { name: 'Light Sandstone', profile: 'smooth', url: 'Images/Thin Brick/Endicott/Light-Sandstone-Smooth-Thinbrick.jpg', manufacturer: 'endicott' },
    { name: 'Manganese Ironspot', profile: 'smooth', url: 'Images/Thin Brick/Endicott/Manganese-Ironspot-Smooth-Thinbrick.jpg', manufacturer: 'endicott' },
    { name: 'Medium Ironspot 46', profile: 'smooth', url: 'Images/Thin Brick/Endicott/Medium-Ironspot-46-Smooth-Thinbrick.jpg', manufacturer: 'endicott' },
    { name: 'Medium Ironspot 77', profile: 'smooth', url: 'Images/Thin Brick/Endicott/Medium-Ironspot-77-Smooth-Thinbrick.jpg', manufacturer: 'endicott' },
    { name: 'Merlot Sands', profile: 'smooth', url: 'Images/Thin Brick/Endicott/Merlot-Sands-Square-Edge-No-Texture-Thinbrick.jpg', manufacturer: 'endicott' },
    { name: 'Orleans Sands', profile: 'smooth', url: 'Images/Thin Brick/Endicott/Orleans-Sands-Heritage-Thinbrick.jpg', manufacturer: 'endicott' },
    { name: 'Red Blend', profile: 'smooth', url: 'Images/Thin Brick/Endicott/Red-Blend-Smooth-Thinbrick.jpg', manufacturer: 'endicott' },
    { name: 'Red Ironspot', profile: 'smooth', url: 'Images/Thin Brick/Endicott/Red-Ironspot-Smooth-Thinbrick.jpg', manufacturer: 'endicott' },
    { name: 'Rose Blend', profile: 'smooth', url: 'Images/Thin Brick/Endicott/Rose-Blend-Smooth-Thinbrick.jpg', manufacturer: 'endicott' },
    { name: 'Ruby Red', profile: 'smooth', url: 'Images/Thin Brick/Endicott/Ruby-Red-Smooth-Thinbrick.jpg', manufacturer: 'endicott' },
    { name: 'Sahara Sands', profile: 'smooth', url: 'Images/Thin Brick/Endicott/Sahara-Sands-Square-Edge-No-Texture-Thinbrick.jpg', manufacturer: 'endicott' },
    { name: 'Sienna Ironspot', profile: 'smooth', url: 'Images/Thin Brick/Endicott/Sienna-Ironspot-Smooth-Thinbrick.jpg', manufacturer: 'endicott' }
];

function titleCaseBrand(slug){
  if(!slug) return '';
  return slug.split('-').map(s => s.charAt(0).toUpperCase()+s.slice(1)).join(' ');
}

function findStoneByUrl(url){
  if(!url) return null;
  return (STONE_MATERIALS || []).find(s => s.url === url) || null;
}

// =========================
// Download dropdown + export
// =========================
(function(){
  function onReady(fn){
    if(document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // Merge main canvas and drawing canvas into an output canvas at a target width
  function mergeCanvasesToWidth(targetWidth){
    const base = document.getElementById('main-canvas') || window.canvas;
    const overlay = document.getElementById('drawing-canvas') || window.drawingCanvas;
    const src = base; // if base is null, this will fail; we guard below
    if(!src || !src.getContext){
      alert('Canvas not ready to export yet. Try again after the image loads.');
      return null;
    }
    const srcW = src.width;
    const srcH = src.height;
    const scale = (typeof targetWidth === 'number' && targetWidth > 0) ? (targetWidth / srcW) : 1;
    const outW = Math.round(srcW * scale);
    const outH = Math.round(srcH * scale);

    // Create output canvas
    const out = document.createElement('canvas');
    out.width = outW;
    out.height = outH;
    const octx = out.getContext('2d');

    // Draw base
    octx.drawImage(src, 0, 0, srcW, srcH, 0, 0, outW, outH);

    // Draw overlay annotations if present
    if(overlay && overlay.width && overlay.height){
      octx.drawImage(overlay, 0, 0, overlay.width, overlay.height, 0, 0, outW, outH);
    }
    return out;
  }

  function downloadCanvas(width, label){
    const out = mergeCanvasesToWidth(width);
    if(!out) return;
    // Use toBlob when available to avoid data URL size issues
    if(out.toBlob){
      out.toBlob(function(blob){
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const stamp = new Date().toISOString().replace(/[:.]/g,'-');
        a.href = url;
        a.download = `stone-visualizer-${label || (width||'orig')}-${stamp}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } else {
      const a = document.createElement('a');
      a.href = out.toDataURL('image/png');
      const stamp = new Date().toISOString().replace(/[:.]/g,'-');
      a.download = `stone-visualizer-${label || (width||'orig')}-${stamp}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }

  onReady(function(){
    const btn = document.getElementById('download-btn') || document.getElementById('download-image-btn') || document.querySelector('[data-action="download"]');
    const menu = document.getElementById('download-options') || document.querySelector('.download-options');
    const small = document.getElementById('download-small') || document.querySelector('[data-size="small"]');
    const medium = document.getElementById('download-medium') || document.querySelector('[data-size="medium"]');
    const large = document.getElementById('download-large') || document.querySelector('[data-size="large"]');
    const original = document.getElementById('download-original') || document.querySelector('[data-size="original"]');

    // Fallback: build menu if missing or empty
    (function ensureMenu(){
      const needBuild = !menu || !menu.children || menu.children.length === 0;
      if(!btn) return;
      function mk(label, id, size){
        const b = document.createElement('button');
        b.id = id; b.type = 'button';
        if(size && size !== 'specsheet') b.dataset.size = size; // do not tag specsheet as a data-size
        b.textContent = label;
        b.style.display = 'block'; b.style.width = '100%';
        b.style.textAlign = 'left'; b.style.padding = '8px 10px';
        b.style.background = 'transparent'; b.style.border = 'none';
        b.style.cursor = 'pointer'; b.style.fontSize = '14px';
        b.addEventListener('mouseenter',()=>{ b.style.background = '#f5f5f5';});
        b.addEventListener('mouseleave',()=>{ b.style.background = 'transparent';});
        return b;
      }

      if(needBuild){
        const built = document.createElement('div');
        built.id = 'download-options';
        built.className = 'download-options';
        built.setAttribute('role','menu');
        built.setAttribute('aria-hidden','true');
        built.style.position = 'fixed';
        built.style.zIndex = '999999';
        built.style.display = 'none';
        built.style.background = '#fff';
        built.style.border = '1px solid rgba(0,0,0,0.15)';
        built.style.borderRadius = '6px';
        built.style.padding = '6px';
        built.style.boxShadow = '0 6px 18px rgba(0,0,0,0.18)';

        built.appendChild(mk('Small',   'download-small',  'small'));
        built.appendChild(mk('Medium',  'download-medium', 'medium'));
        // prefer Original label if your UI uses it
        built.appendChild(mk(original ? 'Original' : 'Large', original ? 'download-original' : 'download-large', original ? 'original' : 'large'));
        // NEW: Spec Sheet option (no data-size to avoid generic size handlers)
        built.appendChild(mk('Spec Sheet (Applied Products)', 'download-specsheet', null));

        document.body.appendChild(built);

        // Position below the button using viewport coords
        const rect = btn.getBoundingClientRect();
        built.style.top = (rect.bottom + 8) + 'px';
        built.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - built.offsetWidth - 8)) + 'px';

        // Reassign refs to the built elements
        window.__dlMenu   = built;
        window.__dlSmall  = built.querySelector('#download-small');
        window.__dlMedium = built.querySelector('#download-medium');
        window.__dlLarge  = built.querySelector('#download-large');
        window.__dlOrig   = built.querySelector('#download-original');
        window.__dlSpec   = built.querySelector('#download-specsheet');
      } else {
        // Use existing DOM menu; ensure Spec Sheet exists
        const ensureSpec = () => {
          let spec = document.getElementById('download-specsheet') || menu.querySelector('#download-specsheet');
          if(!spec){
            spec = mk('Spec Sheet (Applied Products)', 'download-specsheet', null);
            menu.appendChild(spec);
          }
          return spec;
        };

        window.__dlMenu   = menu;
        window.__dlSmall  = document.getElementById('download-small')  || menu.querySelector('#download-small')  || null;
        window.__dlMedium = document.getElementById('download-medium') || menu.querySelector('#download-medium') || null;
        window.__dlLarge  = document.getElementById('download-large')  || menu.querySelector('#download-large')  || null;
        window.__dlOrig   = document.getElementById('download-original')|| menu.querySelector('#download-original')|| null;
        window.__dlSpec   = ensureSpec();
      }
    })();

    if(!btn || !window.__dlMenu){
      // No UI present; nothing to wire
      return;
    }

    // Ensure wrapper positions menu correctly
    const wrapper = btn.closest('.download-dropdown');
    if(wrapper && getComputedStyle(wrapper).position === 'static'){
      wrapper.style.position = 'relative';
    }

    // Start hidden
    window.__dlMenu.classList.remove('open');
    window.__dlMenu.setAttribute('aria-hidden','true');
    window.__dlMenu.style.display = 'none';

    // Toggle menu (portal to body, position, max z-index, etc)
    btn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      const m = window.__dlMenu; if(!m) return;

      // If the dropdown is inside a clipping container, move it to the body once
      if(m.parentElement !== document.body){
        // Remember original parent and next sibling so we could restore if needed
        if(!m.__origParent){
          m.__origParent = m.parentElement;
          m.__origNext = m.nextSibling;
        }
        document.body.appendChild(m);
        m.style.position = 'fixed';  // detach from any overflow contexts
      }

      // Toggle visibility
      const willOpen = !m.classList.contains('open');
      m.classList.toggle('open', willOpen);
      m.setAttribute('aria-hidden', willOpen ? 'false' : 'true');
      m.style.display = willOpen ? 'block' : 'none';

      // Bring to front and ensure it's not hidden by other layers
      m.style.zIndex = '2147483647';   // max practical z-index
      m.style.pointerEvents = willOpen ? 'auto' : 'none';
      m.style.background = m.style.background || '#fff';
      m.style.border = m.style.border || '1px solid rgba(0,0,0,0.15)';
      m.style.borderRadius = m.style.borderRadius || '6px';
      m.style.boxShadow = m.style.boxShadow || '0 6px 18px rgba(0,0,0,0.18)';
      m.style.minWidth = m.style.minWidth || '200px';
      m.style.maxHeight = '60vh';
      m.style.overflow = 'auto';

      // Position below the button using viewport coordinates
      if(willOpen){
        const rect = btn.getBoundingClientRect();
        const desiredLeft = Math.max(8, Math.min(rect.left, window.innerWidth - m.offsetWidth - 8));
        const desiredTop = Math.min(window.innerHeight - m.offsetHeight - 8, rect.bottom + 8);
        m.style.left = desiredLeft + 'px';
        m.style.top  = Math.max(8, desiredTop) + 'px';
      }
    });

    // Outside click closes
    document.addEventListener('click', function(e){
      const m = window.__dlMenu; if(!m) return;
      if(!m.classList.contains('open')) return;
      if(!m.contains(e.target) && e.target !== btn){
        m.classList.remove('open');
        m.setAttribute('aria-hidden','true');
        m.style.display = 'none';
        m.style.pointerEvents = 'none';
      }
    });

    // Escape closes
    document.addEventListener('keydown', function(e){
      const m = window.__dlMenu; if(!m) return;
      if(e.key === 'Escape' && m.classList.contains('open')){
        m.classList.remove('open');
        m.setAttribute('aria-hidden','true');
        m.style.display = 'none';
        m.style.pointerEvents = 'none';
      }
    });

    // Size handlers — choose sensible pixel widths
    function getDefaultWidths(){
      const base = document.getElementById('main-canvas') || window.canvas;
      const baseW = base && base.width ? base.width : 1600;
      // Define Small/Medium relative to original width but cap to reasonable sizes
      const smallW = Math.min(1024, Math.max(640, Math.round(baseW * 0.5)));  // ~50%
      const mediumW = Math.min(1600, Math.max(1200, Math.round(baseW * 0.75))); // ~75%
      const largeW = baseW; // original
      return { smallW, mediumW, largeW };
    }

    // Utility: Recompute menu position if open on resize/scroll
    function repositionMenuIfOpen(){
      const m = window.__dlMenu; if(!m || !m.classList.contains('open')) return;
      const rect = btn.getBoundingClientRect();
      const desiredLeft = Math.max(8, Math.min(rect.left, window.innerWidth - m.offsetWidth - 8));
      const desiredTop = Math.min(window.innerHeight - m.offsetHeight - 8, rect.bottom + 8);
      m.style.left = desiredLeft + 'px';
      m.style.top  = Math.max(8, desiredTop) + 'px';
    }
    window.addEventListener('resize', repositionMenuIfOpen);
    window.addEventListener('scroll', repositionMenuIfOpen, true);

    if(window.__dlSmall){ window.__dlSmall.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); downloadCanvas(getDefaultWidths().smallW, 'small'); const m=window.__dlMenu; if(m){ m.classList.remove('open'); m.setAttribute('aria-hidden','true'); m.style.display='none'; m.style.pointerEvents='none'; } }); }
    if(window.__dlMedium){ window.__dlMedium.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); downloadCanvas(getDefaultWidths().mediumW, 'medium'); const m=window.__dlMenu; if(m){ m.classList.remove('open'); m.setAttribute('aria-hidden','true'); m.style.display='none'; m.style.pointerEvents='none'; } }); }
    if(window.__dlLarge){ window.__dlLarge.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); downloadCanvas(getDefaultWidths().largeW, 'large'); const m=window.__dlMenu; if(m){ m.classList.remove('open'); m.setAttribute('aria-hidden','true'); m.style.display='none'; m.style.pointerEvents='none'; } }); }
    if(window.__dlOrig){ window.__dlOrig.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); downloadCanvas(getDefaultWidths().largeW, 'original'); const m=window.__dlMenu; if(m){ m.classList.remove('open'); m.setAttribute('aria-hidden','true'); m.style.display='none'; m.style.pointerEvents='none'; } }); }

    // -------------------------
    // Spec Sheet (Applied Products)
    // -------------------------
    const specBtn = document.getElementById('download-specsheet') || window.__dlSpec;

    function collectAppliedProducts(){
      const rows = [];
      // Attempt to gather from drawn areas with selected stones
      try {
        if (Array.isArray(areas)) {
          areas.forEach(a => {
            if(!a) return;
            const stoneUrl = a.stoneUrl || a.stone || a.materialUrl || (a.stone && a.stone.url);
            const meta = findStoneByUrl(stoneUrl);
            if(meta){
              rows.push({
                surface: a.name || a.label || 'Area',
                productName: meta.name || 'Stone',
                brand: titleCaseBrand(meta.manufacturer || ''),
                color: meta.color || '',
                sampleUrl: meta.url
              });
            }
          });
        }
      } catch(e) {}
      // Collect from any known selection caches as fallback
      try {
        if (Array.isArray(selectedAreas)) {
          selectedAreas.forEach(a => {
            if(!a) return;
            const stoneUrl = a.materialUrl || a.stoneUrl || (a.stone && a.stone.url) || a.url;
            const meta = findStoneByUrl(stoneUrl);
            if(meta){
              rows.push({
                surface: a.name || a.label || 'Area',
                productName: meta.name || 'Stone',
                brand: titleCaseBrand(meta.manufacturer || ''),
                color: meta.color || '',
                sampleUrl: meta.url
              });
            }
          });
        }
      } catch(e) {}
      // Fallback to currentStone if nothing found
      if(rows.length === 0 && currentStone){
        const meta = (typeof currentStone === 'string') ? findStoneByUrl(currentStone) : currentStone;
        if(meta){
          rows.push({
            surface: 'Wall',
            productName: meta.name || 'Stone',
            brand: titleCaseBrand(meta.manufacturer || ''),
            color: meta.color || '',
            sampleUrl: meta.url
          });
        }
      }
      // Deduplicate by product+color
      const seen = new Set();
      return rows.filter(r => {
        const key = [r.productName, r.brand, r.color, r.sampleUrl].join('|');
        if(seen.has(key)) return false; seen.add(key); return true;
      });
    }

    function loadImage(src){
      return new Promise((res, rej)=>{ const i=new Image(); i.crossOrigin='anonymous'; i.onload=()=>res(i); i.onerror=rej; i.src=src; });
    }

    async function renderSpecSheetPages(){
      const PWIDTH = 1650;   // 8.5in at ~194dpi (reasonable on web, smaller file)
      const PHEIGHT = 1275;  // landscape-friendly for page 1 image; we will still keep white margins
      // Page 1 canvas
      const page1 = document.createElement('canvas');
      page1.width = PWIDTH; page1.height = PHEIGHT;
      const p1 = page1.getContext('2d');
      // White background
      p1.fillStyle = '#FFFFFF'; p1.fillRect(0,0,PWIDTH,PHEIGHT);
      // Logo (top-left) if available via #brand-logo img, else title text
      let logoImg = null; let logoW=0, logoH=0;
      const logoEl = document.querySelector('#brand-logo img, img.brand-logo, .brand-logo img');
      if(logoEl && logoEl.src){ try { logoImg = await loadImage(logoEl.src); } catch(e){} }
      if(logoImg){
        logoH = 80; logoW = Math.round(logoImg.width * (logoH/logoImg.height));
        p1.drawImage(logoImg, 80, 60, logoW, logoH);
      } else {
        p1.fillStyle = '#000'; p1.font = 'bold 32px sans-serif'; p1.fillText('Applied Design', 80, 100);
      }
      // House hero image from merged canvas
      const hero = mergeCanvasesToWidth(PWIDTH - 240);
      if(hero){
        const hW = hero.width, hH = hero.height;
        const maxW = PWIDTH - 240; const maxH = PHEIGHT - 260;
        const scale = Math.min(maxW/hW, maxH/hH);
        const drawW = Math.round(hW*scale); const drawH = Math.round(hH*scale);
        const x = Math.round((PWIDTH - drawW)/2); const y = 160;
        p1.drawImage(hero, x, y, drawW, drawH);
      }

      // Page 2 canvas (Applied Products table)
      const page2 = document.createElement('canvas');
      page2.width = PWIDTH; page2.height = PHEIGHT;
      const p2 = page2.getContext('2d');
      p2.fillStyle = '#FFFFFF'; p2.fillRect(0,0,PWIDTH,PHEIGHT);

      // Title and top rule
      const leftMargin = 120; const rightMargin = 120; const tableTop = 220;
      p2.fillStyle = '#000000';
      p2.fillRect(leftMargin, tableTop - 40, PWIDTH - leftMargin - rightMargin, 4); // thick rule above title
      p2.font = 'bold 28px sans-serif'; p2.textAlign = 'center'; p2.fillText('Applied Products', PWIDTH/2, tableTop - 60);

      // Table columns
      const cols = [
        { key:'sample', label:'Sample', width:120 },
        { key:'surface', label:'Surface', width:220 },
        { key:'productName', label:'Product Name', width:380 },
        { key:'brand', label:'Brand', width:260 },
        { key:'color', label:'Color', width:220 }
      ];
      const colX = []; let x=leftMargin; cols.forEach(c=>{ colX.push(x); x += c.width; });
      const tableWidth = x - leftMargin; const rowH = 120;

      // Header row
      p2.font = 'bold 18px sans-serif'; p2.textAlign='left'; p2.fillStyle='#555';
      cols.forEach((c,i)=>{ p2.fillText(c.label, colX[i]+(i===0?80:12), tableTop+20); });
      // header underline
      p2.strokeStyle = 'rgba(0,0,0,0.15)'; p2.lineWidth = 1; p2.beginPath(); p2.moveTo(leftMargin, tableTop+30); p2.lineTo(leftMargin+tableWidth, tableTop+30); p2.stroke();

      // If no data, we still want to show a placeholder row
      const rows = collectAppliedProducts();
      const data = (rows && rows.length) ? rows : [{ surface:'', productName:'No applied products found', brand:'', color:'', sampleUrl:'' }];
      let y = tableTop + 30;
      for(let r=0; r<data.length; r++){
        y += rowH; // advance to next row baseline
        // row divider
        p2.strokeStyle = 'rgba(0,0,0,0.12)'; p2.beginPath(); p2.moveTo(leftMargin, y); p2.lineTo(leftMargin+tableWidth, y); p2.stroke();
        const rowTop = y - rowH + 20;
        const rec = data[r];
        // sample swatch
        try{
          if(rec.sampleUrl){
            let simg = null;
            try { simg = await loadImage(rec.sampleUrl); } catch(e) {
              try { const proxied = rec.sampleUrl + (rec.sampleUrl.includes('?') ? '&' : '?') + 'cachebust=' + Date.now(); simg = await loadImage(proxied); } catch(_) {}
            }
            if(simg){
              // draw as 80x80 with 1px border
              p2.drawImage(simg, colX[0]+20, rowTop, 80, 80);
              p2.strokeStyle = 'rgba(0,0,0,0.2)'; p2.strokeRect(colX[0]+20-0.5, rowTop-0.5, 81, 81);
            } else {
              p2.fillStyle='#ddd'; p2.fillRect(colX[0]+20, rowTop, 80, 80);
            }
          } else {
            p2.fillStyle='#ddd'; p2.fillRect(colX[0]+20, rowTop, 80, 80);
          }
        }catch(e){ p2.fillStyle='#ddd'; p2.fillRect(colX[0]+20, rowTop, 80, 80); }

        // text cells
        p2.fillStyle='#222'; p2.font='16px sans-serif';
        p2.fillText(rec.surface||'', colX[1]+12, rowTop+48);
        p2.fillText(rec.productName||'', colX[2]+12, rowTop+48);
        p2.fillText(rec.brand||'', colX[3]+12, rowTop+48);
        p2.fillText(rec.color||'', colX[4]+12, rowTop+48);
      }

      return { page1, page2 };
    }

    async function downloadSpecSheet(){
      try{
        const {page1, page2} = await renderSpecSheetPages();
        // Generate a two-page PDF using jsPDF
        // jsPDF must be included in the page for this to work
        const doc = new window.jspdf.jsPDF({
          orientation: 'landscape',
          unit: 'pt',
          format: [1650, 1275]
        });
        // Add first page (image)
        doc.addImage(page1.toDataURL('image/png'), 'PNG', 0, 0, 1650, 1275);
        // Add second page (applied products table)
        doc.addPage([1650, 1275], 'landscape');
        doc.addImage(page2.toDataURL('image/png'), 'PNG', 0, 0, 1650, 1275);
        const stamp = new Date().toISOString().replace(/[:.]/g,'-');
        doc.save(`stone-visualizer-spec-sheet-${stamp}.pdf`);
      }catch(err){
        console.error(err);
        alert('Unable to generate spec sheet yet. Try after the image and selections have loaded.');
      }
    }

    if(specBtn){
      specBtn.addEventListener('click', function(e){
        e.preventDefault(); e.stopPropagation();
        downloadSpecSheet();
        const m=window.__dlMenu; if(m){ m.classList.remove('open'); m.setAttribute('aria-hidden','true'); m.style.display='none'; m.style.pointerEvents='none'; }
      });
    }
  });
})();
// Glen-Gery Thin Brick Materials - Complete updated list with correct names and filename paths
const GLEN_GERY_MATERIALS = [
    // Various Glen-Gery brick profiles
    { name: 'Black Glazed', profile: 'glazed', url: 'Images/Thin Brick/Glen-Gery/Black_Glazed.jpg', manufacturer: 'glen-gery' },
    { name: 'Cardinal Red Glazed', profile: 'glazed', url: 'Images/Thin Brick/Glen-Gery/Cardinal-Red_Glazed.jpg', manufacturer: 'glen-gery' },
    { name: 'Aspen White', profile: 'wirecut', url: 'Images/Thin Brick/Glen-Gery/Aspen_White.jpg', manufacturer: 'glen-gery' },
    { name: 'Bermuda Blue Glazed', profile: 'glazed', url: 'Images/Thin Brick/Glen-Gery/Bermuda_blue_glazed.jpg', manufacturer: 'glen-gery' },
    { name: 'Cloud Grey Glazed', profile: 'glazed', url: 'Images/Thin Brick/Glen-Gery/Cloud-grey_glazed.jpg', manufacturer: 'glen-gery' },
    { name: 'Khaki Stone Klaycoat', profile: 'standard', url: 'Images/Thin Brick/Glen-Gery/Khaki_stone_klaycoat.jpg', manufacturer: 'glen-gery' },
    { name: 'Stone Grey Klaycoat', profile: 'standard', url: 'Images/Thin Brick/Glen-Gery/Stone-grey.jpg', manufacturer: 'glen-gery' },
    { name: 'Urban Grey Klaycoat', profile: 'standard', url: 'Images/Thin Brick/Glen-Gery/Urban-grey_klaycoat.jpg', manufacturer: 'glen-gery' },
    { name: 'White Glazed', profile: 'glazed', url: 'Images/Thin Brick/Glen-Gery/White_glazed.jpg', manufacturer: 'glen-gery' },
    { name: 'White with Speck Glazed', profile: 'speckled', url: 'Images/Thin Brick/Glen-Gery/White_with_spec_glazed.jpg', manufacturer: 'glen-gery' },
    { name: 'Charcoal Klaycoat', profile: 'standard', url: 'Images/Thin Brick/Glen-Gery/Charcoal_klaycoat.jpg', manufacturer: 'glen-gery' }
];

// Hebron Brick Materials
const HEBRON_MATERIALS = [
    // Hebron Brick collection - updated filenames with _thin suffix
    { name: 'Barrel Room', profile: 'featured', url: 'Images/Thin Brick/Hebron/Barrel-room_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Bell Tower', profile: 'standard', url: 'Images/Thin Brick/Hebron/Bell Tower_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Bootlegger', profile: 'heritage', url: 'Images/Thin Brick/Hebron/Bootlegger_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Bourbon Street', profile: 'heritage', url: 'Images/Thin Brick/Hebron/Bourbon Street_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Brandywine', profile: 'premium', url: 'Images/Thin Brick/Hebron/Brandywine_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Carriage House', profile: 'traditional', url: 'Images/Thin Brick/Hebron/Carriage House_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Castlewood', profile: 'premium', url: 'Images/Thin Brick/Hebron/Castlewood_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Dakota Common', profile: 'common', url: 'Images/Thin Brick/Hebron/Dakota Common_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Desert Common', profile: 'common', url: 'Images/Thin Brick/Hebron/Desert-Common_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Gin Mill', profile: 'heritage', url: 'Images/Thin Brick/Hebron/Gin Mill_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Harbourtown', profile: 'traditional', url: 'Images/Thin Brick/Hebron/Harbourtown_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Leos Pub', profile: 'heritage', url: 'Images/Thin Brick/Hebron/Leos Pub_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Madison', profile: 'standard', url: 'Images/Thin Brick/Hebron/Madison_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Old Broadway', profile: 'heritage', url: 'Images/Thin Brick/Hebron/Old Broadway_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Onyx', profile: 'premium', url: 'Images/Thin Brick/Hebron/Onyx_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Prairie Common', profile: 'common', url: 'Images/Thin Brick/Hebron/Prairie Common_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Prohibition', profile: 'featured', url: 'Images/Thin Brick/Hebron/Prohibition_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Red River', profile: 'featured', url: 'Images/Thin Brick/Hebron/Red River_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Rosemont', profile: 'featured', url: 'Images/Thin Brick/Hebron/Rosemont_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Route 66', profile: 'heritage', url: 'Images/Thin Brick/Hebron/Route 66_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Rum Runner', profile: 'heritage', url: 'Images/Thin Brick/Hebron/Rum-runner_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Silverado', profile: 'featured', url: 'Images/Thin Brick/Hebron/Silverado_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Slate Gray', profile: 'featured', url: 'Images/Thin Brick/Hebron/Slate Gray_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Smokehouse', profile: 'rustic', url: 'Images/Thin Brick/Hebron/Smokehouse_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Speak Easy', profile: 'heritage', url: 'Images/Thin Brick/Hebron/Speak-easy_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Sunset', profile: 'featured', url: 'Images/Thin Brick/Hebron/Sunset_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Toasted Gray', profile: 'featured', url: 'Images/Thin Brick/Hebron/Toasted Gray_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Waterford', profile: 'traditional', url: 'Images/Thin Brick/Hebron/Waterford_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Wild Rose', profile: 'premium', url: 'Images/Thin Brick/Hebron/Wild Rose_thin.jpg', manufacturer: 'hebron-brick' },
    { name: 'Winston', profile: 'traditional', url: 'Images/Thin Brick/Hebron/Winston_thin.jpg', manufacturer: 'hebron-brick' }
];

// King Klinker Thin Brick Materials
const KING_KLINKER_MATERIALS = [
    { name: 'Black Beauty', profile: 'standard', url: 'Images/Thin Brick/King Klinker/Black_Beauty.jpg', manufacturer: 'king-klinker' },
    { name: 'King Crimson', profile: 'standard', url: 'Images/Thin Brick/King Klinker/King Crimson.jpg', manufacturer: 'king-klinker' },
    { name: 'Manganese', profile: 'standard', url: 'Images/Thin Brick/King Klinker/Manganese.jpg', manufacturer: 'king-klinker' },
    { name: 'Misty Morning', profile: 'standard', url: 'Images/Thin Brick/King Klinker/Misty Morning.jpg', manufacturer: 'king-klinker' },
    { name: 'Obsidian Shadow', profile: 'standard', url: 'Images/Thin Brick/King Klinker/Obsidian Shadow.jpg', manufacturer: 'king-klinker' },
    { name: 'Pacific Pearl', profile: 'standard', url: 'Images/Thin Brick/King Klinker/Pacific Pearl.jpg', manufacturer: 'king-klinker' },
    { name: 'Urban Blend', profile: 'standard', url: 'Images/Thin Brick/King Klinker/Urban Blend.jpg', manufacturer: 'king-klinker' },
    { name: 'Valyria Stone', profile: 'standard', url: 'Images/Thin Brick/King Klinker/Valyria Stone.jpg', manufacturer: 'king-klinker' },
    { name: 'Volcanic Black', profile: 'standard', url: 'Images/Thin Brick/King Klinker/Volcanic Black.jpg', manufacturer: 'king-klinker' },
    { name: 'Winter Field', profile: 'standard', url: 'Images/Thin Brick/King Klinker/Winter Field.jpg', manufacturer: 'king-klinker' }
];

// H.C. Muddox Thin Brick Materials
const HC_MUDDOX_MATERIALS = [
    { name: 'Redwood', profile: 'standard', url: 'Images/Thin Brick/H.C Muddox/Thinbrick- Redwood.jpg', manufacturer: 'hc-muddox' },
    { name: 'California Handmold', profile: 'handformed', url: 'Images/Thin Brick/H.C Muddox/Thinbrick-California Handmold.jpg', manufacturer: 'hc-muddox' },
    { name: 'Clinker', profile: 'standard', url: 'Images/Thin Brick/H.C Muddox/Thinbrick-Clinker.jpg', manufacturer: 'hc-muddox' },
    { name: 'Folsom Gold', profile: 'standard', url: 'Images/Thin Brick/H.C Muddox/Thinbrick-Folsom_gold.jpg', manufacturer: 'hc-muddox' },
    { name: 'Mendocino', profile: 'standard', url: 'Images/Thin Brick/H.C Muddox/Thinbrick-Mendocino.jpg', manufacturer: 'hc-muddox' },
    { name: 'Placer Antique', profile: 'antique', url: 'Images/Thin Brick/H.C Muddox/Thinbrick-Placer Antique.jpg', manufacturer: 'hc-muddox' },
    { name: 'Sacramentan', profile: 'standard', url: 'Images/Thin Brick/H.C Muddox/Thinbrick-Sacramentan.jpg', manufacturer: 'hc-muddox' }
];

// Interstate Thin Brick Materials
const INTERSTATE_MATERIALS = [
    { name: 'Almond', profile: 'standard', url: 'Images/Thin Brick/Interstate/Almond.jpg', manufacturer: 'interstate-brick' },
    { name: 'Arctic White', profile: 'standard', url: 'Images/Thin Brick/Interstate/Arctic White.jpg', manufacturer: 'interstate-brick' },
    { name: 'Ash', profile: 'standard', url: 'Images/Thin Brick/Interstate/Ash.jpg', manufacturer: 'interstate-brick' },
    { name: 'BronzeStone', profile: 'standard', url: 'Images/Thin Brick/Interstate/BronzeStone.jpg', manufacturer: 'interstate-brick' },
    { name: 'Canyon Rose', profile: 'standard', url: 'Images/Thin Brick/Interstate/Canyon Rose.jpg', manufacturer: 'interstate-brick' },
    { name: 'Coal', profile: 'standard', url: 'Images/Thin Brick/Interstate/Coal.jpg', manufacturer: 'interstate-brick' },
    { name: 'Copperstone', profile: 'standard', url: 'Images/Thin Brick/Interstate/Copperstone.jpg', manufacturer: 'interstate-brick' },
    { name: 'Desert Sand', profile: 'standard', url: 'Images/Thin Brick/Interstate/Desert Sand.jpg', manufacturer: 'interstate-brick' },
    { name: 'Ironstone', profile: 'standard', url: 'Images/Thin Brick/Interstate/Ironstone.jpg', manufacturer: 'interstate-brick' },
    { name: 'Midnight Black', profile: 'standard', url: 'Images/Thin Brick/Interstate/Midnight Black.jpg', manufacturer: 'interstate-brick' },
    { name: 'Monterey', profile: 'standard', url: 'Images/Thin Brick/Interstate/Monterey.jpg', manufacturer: 'interstate-brick' },
    { name: 'Mountain Red', profile: 'standard', url: 'Images/Thin Brick/Interstate/Mountain Red.jpg', manufacturer: 'interstate-brick' },
    { name: 'Obsidian', profile: 'standard', url: 'Images/Thin Brick/Interstate/Obsidian.jpg', manufacturer: 'interstate-brick' },
    { name: 'Pewter', profile: 'standard', url: 'Images/Thin Brick/Interstate/Pewter.jpg', manufacturer: 'interstate-brick' },
    { name: 'Platinum', profile: 'standard', url: 'Images/Thin Brick/Interstate/Platinum.jpg', manufacturer: 'interstate-brick' },
    { name: 'Smokey Mountain', profile: 'standard', url: 'Images/Thin Brick/Interstate/Smokey Mountain.jpg', manufacturer: 'interstate-brick' },
    { name: 'Terracotta', profile: 'standard', url: 'Images/Thin Brick/Interstate/Terracotta.jpg', manufacturer: 'interstate-brick' },
    { name: 'Tumbleweed', profile: 'standard', url: 'Images/Thin Brick/Interstate/Tumbleweed.jpg', manufacturer: 'interstate-brick' }
];

// Dutch Quality Thin Brick Materials (separate from stone)
const DUTCH_QUALITY_THIN_BRICK_MATERIALS = [
    { name: 'Coal Crest', profile: 'handformed', url: 'Images/Thin Brick/Dutch Quality/DQ-Handformed-Brick-Coal-Crest.jpg', manufacturer: 'dutch-quality-thin-brick' },
    { name: 'Quail Grey', profile: 'handformed', url: 'Images/Thin Brick/Dutch Quality/DQ-Handformed-Brick-Quail-Grey.jpg', manufacturer: 'dutch-quality-thin-brick' },
    { name: 'Snowpack', profile: 'handformed', url: 'Images/Thin Brick/Dutch Quality/DQ-Handformed-Brick-Snowpack.jpg', manufacturer: 'dutch-quality-thin-brick' }
];

// Full Brick (Full‑Bed) — grouped by manufacturer in requested order
// Paths: Images/Full Brick/<Manufacturer>/<ImageName>

// 1) Hebron (complete list from your screenshot)
const FULL_BRICK_HEBRON = [
  { name: 'Ashton',                profile: 'full-brick', url: 'Images/Full Brick/Hebron/Ashton_full.jpg', manufacturer: 'hebron-brick' },
  { name: 'Big Horn',              profile: 'full-brick', url: 'Images/Full Brick/Hebron/Big-Horn.jpg', manufacturer: 'hebron-brick' },
  { name: 'Brampton',              profile: 'full-brick', url: 'Images/Full Brick/Hebron/Brampton.jpg', manufacturer: 'hebron-brick' },
  { name: 'Buckwheat',             profile: 'full-brick', url: 'Images/Full Brick/Hebron/Buckwheat.jpg', manufacturer: 'hebron-brick' },
  { name: 'Cascade',               profile: 'full-brick', url: 'Images/Full Brick/Hebron/Cascade.jpg', manufacturer: 'hebron-brick' },
  { name: 'Champagne',             profile: 'full-brick', url: 'Images/Full Brick/Hebron/Champagne.jpg', manufacturer: 'hebron-brick' },
  { name: 'Cherry Creek Ironspot', profile: 'full-brick', url: 'Images/Full Brick/Hebron/Cherry-Creek-Ironspot.jpg', manufacturer: 'hebron-brick' },
  { name: 'Chocolate',             profile: 'full-brick', url: 'Images/Full Brick/Hebron/Chocolate.jpg', manufacturer: 'hebron-brick' },
  { name: 'Copper Creek Ironspot', profile: 'full-brick', url: 'Images/Full Brick/Hebron/Copper-Creek-Ironspot.jpg', manufacturer: 'hebron-brick' },
  { name: 'Crimson Creek Ironspot',profile: 'full-brick', url: 'Images/Full Brick/Hebron/Crimson-Creek-Ironspot.jpg', manufacturer: 'hebron-brick' },
  { name: 'Garnet',                profile: 'full-brick', url: 'Images/Full Brick/Hebron/Garnet_full.jpg', manufacturer: 'hebron-brick' },
  { name: 'Goldenrod',             profile: 'full-brick', url: 'Images/Full Brick/Hebron/Goldenrod.jpg', manufacturer: 'hebron-brick' },
  { name: 'Ovation',        profile: 'full-brick', url: 'Images/Full Brick/Hebron/Hebron-Ovation.jpg', manufacturer: 'hebron-brick' },
  { name: 'Maple',                 profile: 'full-brick', url: 'Images/Full Brick/Hebron/Maple.jpg', manufacturer: 'hebron-brick' },
  { name: 'Maroon',                profile: 'full-brick', url: 'Images/Full Brick/Hebron/Maroon.jpg', manufacturer: 'hebron-brick' },
  { name: 'Meadow Creek',          profile: 'full-brick', url: 'Images/Full Brick/Hebron/Meadow-Creek.jpg', manufacturer: 'hebron-brick' },
  { name: 'Medora',                profile: 'full-brick', url: 'Images/Full Brick/Hebron/Medora.jpg', manufacturer: 'hebron-brick' },
  { name: 'Onyx Ironspot',         profile: 'full-brick', url: 'Images/Full Brick/Hebron/Onyx-Ironspot.jpg', manufacturer: 'hebron-brick' },
  { name: 'Opus',                  profile: 'full-brick', url: 'Images/Full Brick/Hebron/Opus.jpg', manufacturer: 'hebron-brick' },
  { name: 'Red',                   profile: 'full-brick', url: 'Images/Full Brick/Hebron/Red.jpg', manufacturer: 'hebron-brick' },
  { name: 'Sahara',                profile: 'full-brick', url: 'Images/Full Brick/Hebron/Sahara.jpg', manufacturer: 'hebron-brick' },
  { name: 'Shiloh',                profile: 'full-brick', url: 'Images/Full Brick/Hebron/Shiloh.jpg', manufacturer: 'hebron-brick' },
  { name: 'Silverado',             profile: 'full-brick', url: 'Images/Full Brick/Hebron/Silverado.jpg', manufacturer: 'hebron-brick' },
  { name: 'Slate Gray',            profile: 'full-brick', url: 'Images/Full Brick/Hebron/Slate-Gray.jpg', manufacturer: 'hebron-brick' },
  { name: 'Walnut Creek Ironspot', profile: 'full-brick', url: 'Images/Full Brick/Hebron/Walnut-Creek-Ironspot.jpg', manufacturer: 'hebron-brick' },
  { name: 'Waterford',             profile: 'full-brick', url: 'Images/Full Brick/Hebron/Waterford.jpg', manufacturer: 'hebron-brick' }
];

// 2) Interstate — add images inside this array as you populate the folder
const FULL_BRICK_INTERSTATE = [
  { name: 'Almond Brick',           profile: 'full-brick', url: 'Images/Full Brick/Interstate/Almond-Brick.jpg',              manufacturer: 'interstate-brick' },
  { name: 'Ash',                    profile: 'full-brick', url: 'Images/Full Brick/Interstate/Ash.jpg',                        manufacturer: 'interstate-brick' },
  { name: 'Coal',                   profile: 'full-brick', url: 'Images/Full Brick/Interstate/Coal.jpg',                       manufacturer: 'interstate-brick' },
  { name: 'Arctic White',           profile: 'full-brick', url: 'Images/Full Brick/Interstate/Interstate-Arctic-White.jpg',    manufacturer: 'interstate-brick' },
  { name: 'Pewter',                 profile: 'full-brick', url: 'Images/Full Brick/Interstate/Pewter.jpg',                     manufacturer: 'interstate-brick' },
  { name: 'Platinum',               profile: 'full-brick', url: 'Images/Full Brick/Interstate/Platinum.jpg',                   manufacturer: 'interstate-brick' },
  { name: 'Desert Sand',            profile: 'full-brick', url: 'Images/Full Brick/Interstate/Interstate-Brick-Desert-Sand.jpg', manufacturer: 'interstate-brick' },
  { name: 'Monterey',               profile: 'full-brick', url: 'Images/Full Brick/Interstate/Interstate-Brick-Monterey.webp', manufacturer: 'interstate-brick' },
  { name: 'Platinum (Interstate)',  profile: 'full-brick', url: 'Images/Full Brick/Interstate/Interstate-Brick-Platinum.jpg',  manufacturer: 'interstate-brick' },
  { name: 'Smokey Mountain',        profile: 'full-brick', url: 'Images/Full Brick/Interstate/Interstate-Brick-Smokey-Mountain.jpg', manufacturer: 'interstate-brick' },
  { name: 'Tumbleweed',                profile: 'full-brick', url: 'Images/Full Brick/Interstate/Interstate-Brick-Tumbleweed.jpg',   manufacturer: 'interstate-brick' },
  { name: 'Midnight Black',        profile: 'full-brick', url: 'Images/Full Brick/Interstate/Midnight-Black_full.jpg',       manufacturer: 'interstate-brick' },
  { name: 'Obsidian Black',         profile: 'full-brick', url: 'Images/Full Brick/Interstate/Interstate-Obsidian-Black.jpg',  manufacturer: 'interstate-brick' },
  { name: 'Copperstone',            profile: 'full-brick', url: 'Images/Full Brick/Interstate/Interstate-Brick-Copperstone.jpg', manufacturer: 'interstate-brick' },
  { name: 'Mountain Red',           profile: 'full-brick', url: 'Images/Full Brick/Interstate/Mountain-Red-Interstate.jpg',    manufacturer: 'interstate-brick' },
  
];

// 3) Glen-Gery
const FULL_BRICK_GLEN_GARY = [
  { name: 'Aspen White Glazed', profile: 'full-brick', url: 'Images/Full Brick/Glen-Gery/Aspen_White_glazed-full.jpg', manufacturer: 'glen-gery' },
  { name: 'Aspen White Smooth', profile: 'full-brick', url: 'Images/Full Brick/Glen-Gery/Aspen_White_smooth-full.jpg', manufacturer: 'glen-gery' },
  { name: 'Bermuda Blue Glazed', profile: 'full-brick', url: 'Images/Full Brick/Glen-Gery/Bermuda_blue_glazed- full.jpg', manufacturer: 'glen-gery' },
  { name: 'Black Glazed', profile: 'full-brick', url: 'Images/Full Brick/Glen-Gery/Black_Glazed - full.jpg', manufacturer: 'glen-gery' },
  { name: 'Cardinal Red Glazed', profile: 'full-brick', url: 'Images/Full Brick/Glen-Gery/Cardinal-Red_Glazed - full.jpg', manufacturer: 'glen-gery' },
  { name: 'Charcoal Klaycoat', profile: 'full-brick', url: 'Images/Full Brick/Glen-Gery/Charcoal_klaycoat - full.jpg', manufacturer: 'glen-gery' },
  { name: 'Cloud Grey Glazed', profile: 'full-brick', url: 'Images/Full Brick/Glen-Gery/Cloud-grey_glazed - full.jpg', manufacturer: 'glen-gery' },
  { name: 'Aspen White', profile: 'full-brick', url: 'Images/Full Brick/Glen-Gery/Full-brick-Aspen_White.jpg', manufacturer: 'glen-gery' },
  { name: 'White with Spec Glazed', profile: 'full-brick', url: 'Images/Full Brick/Glen-Gery/Full-brick-White_with_spec_glazed.jpg', manufacturer: 'glen-gery' },
  { name: 'Khaki Stone Klaycoat', profile: 'full-brick', url: 'Images/Full Brick/Glen-Gery/Khaki_stone_klaycoat.jpg', manufacturer: 'glen-gery' },
  { name: 'Stone Grey Klaycoat', profile: 'full-brick', url: 'Images/Full Brick/Glen-Gery/Stone Grey Klaycoat - full.jpg', manufacturer: 'glen-gery' },
  { name: 'Stone Grey', profile: 'full-brick', url: 'Images/Full Brick/Glen-Gery/Stone-grey - full.jpg', manufacturer: 'glen-gery' },
  { name: 'Urban Grey Klaycoat', profile: 'full-brick', url: 'Images/Full Brick/Glen-Gery/Urban-grey_klaycoat- full.jpg', manufacturer: 'glen-gery' },
  { name: 'White Glazed', profile: 'full-brick', url: 'Images/Full Brick/Glen-Gery/White_glazed- full.jpg', manufacturer: 'glen-gery' },
  { name: 'White with Spec Glazed', profile: 'full-brick', url: 'Images/Full Brick/Glen-Gery/White_with_spec_glazed- full.jpg', manufacturer: 'glen-gery' }
];

// 4) H.C Muddox
const FULL_BRICK_HC_MUDDOX = [
  { name: 'Mission Common', profile: 'full-brick', url: 'Images/Full Brick/H.C Muddox/H.C.-Muddox-Mission-Common.jpg', manufacturer: 'hc-muddox' },
  { name: 'Monterey Bay', profile: 'full-brick', url: 'Images/Full Brick/H.C Muddox/H.C.-Muddox-Monterey-Bay.jpg', manufacturer: 'hc-muddox' },
  { name: 'Old Town Red', profile: 'full-brick', url: 'Images/Full Brick/H.C Muddox/H.C.-Muddox-Old-Town-Red.jpg', manufacturer: 'hc-muddox' },
  { name: 'Railroad', profile: 'full-brick', url: 'Images/Full Brick/H.C Muddox/H.C.-Muddox-Railroad.jpg', manufacturer: 'hc-muddox' },
  { name: 'Ebony', profile: 'full-brick', url: 'Images/Full Brick/H.C Muddox/H.C-Muddox-Ebony.jpg', manufacturer: 'hc-muddox' },
  { name: 'Burnt Rose', profile: 'full-brick', url: 'Images/Full Brick/H.C Muddox/hcm-burnt-rose.jpg', manufacturer: 'hc-muddox' },
  { name: 'Carob', profile: 'full-brick', url: 'Images/Full Brick/H.C Muddox/hcm-carob.jpg', manufacturer: 'hc-muddox' },
  { name: 'Dusty Rose', profile: 'full-brick', url: 'Images/Full Brick/H.C Muddox/hcm-dusty-rose.jpg', manufacturer: 'hc-muddox' },
  { name: 'Mountain Rose', profile: 'full-brick', url: 'Images/Full Brick/H.C Muddox/hcm-mountain-rose.jpg', manufacturer: 'hc-muddox' },
  { name: 'Sierra Slate', profile: 'full-brick', url: 'Images/Full Brick/H.C Muddox/hcm-sierra-slate.jpg', manufacturer: 'hc-muddox' },
  { name: 'Spanish Moss', profile: 'full-brick', url: 'Images/Full Brick/H.C Muddox/hcm-spanish-moss.jpg', manufacturer: 'hc-muddox' },
  { name: 'Summer Wheat', profile: 'full-brick', url: 'Images/Full Brick/H.C Muddox/hcm-summer-wheat.jpg', manufacturer: 'hc-muddox' },
  { name: 'Tumbleweed', profile: 'full-brick', url: 'Images/Full Brick/H.C Muddox/hcm-tumbleweed.jpg', manufacturer: 'hc-muddox' }
];

// 5) Palmetto
const FULL_BRICK_PALMETTO = [
  { name: 'Whitestone Wirecut', profile: 'full-brick', url: 'Images/Full Brick/Palmetto/Whitestone - Wirecut.jpg', manufacturer: 'palmetto-brick' }
];

// 6) Brampton Brick
const FULL_BRICK_BRAMPTON_BRICK = [
  // Legacy Series
  { name: 'Canyon', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Legacy Series/Canyon.jpg', manufacturer: 'brampton-brick' },
  { name: 'Church Hill', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Legacy Series/Church-Hill.jpg', manufacturer: 'brampton-brick' },
  { name: 'Crimson', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Legacy Series/Crimson.jpg', manufacturer: 'brampton-brick' },
  { name: 'Crystal Gray', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Legacy Series/Crystal-Gray.jpg', manufacturer: 'brampton-brick' },
  { name: 'Madison County', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Legacy Series/Madison-County.jpg', manufacturer: 'brampton-brick' },
  { name: 'Manchester', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Legacy Series/Manchester.jpg', manufacturer: 'brampton-brick' },
  { name: 'Old Chicago', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Legacy Series/Old Chicago.jpg', manufacturer: 'brampton-brick' },
  { name: 'Old School', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Legacy Series/Old-School.jpg', manufacturer: 'brampton-brick' },
  { name: 'Sterling Gray', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Legacy Series/Sterling-Gray.jpg', manufacturer: 'brampton-brick' },
  { name: 'Veridian', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Legacy Series/Veridian.jpg', manufacturer: 'brampton-brick' },
  { name: 'Westmont', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Legacy Series/Westmont.jpg', manufacturer: 'brampton-brick' },
  // Contemporary Series
  { name: 'Bistro', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Contemporary Series/Bistro.jpg', manufacturer: 'brampton-brick' },
  { name: 'Charcoal Matt', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Contemporary Series/Charcoal-Matt.jpg', manufacturer: 'brampton-brick' },
  { name: 'Chelsea', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Contemporary Series/Chelsea.jpg', manufacturer: 'brampton-brick' },
  { name: 'Claret', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Contemporary Series/Claret.jpg', manufacturer: 'brampton-brick' },
  { name: 'Espresso', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Contemporary Series/Espresso.jpg', manufacturer: 'brampton-brick' },
  { name: 'Kentville', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Contemporary Series/Kentville.jpg', manufacturer: 'brampton-brick' },
  { name: 'Manilla Matt', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Contemporary Series/Manilla-Matt.jpg', manufacturer: 'brampton-brick' },
  { name: 'Mountain Gray', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Contemporary Series/Mountain Gray.jpg', manufacturer: 'brampton-brick' },
  { name: 'Nordic Matt', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Contemporary Series/Nordic_Matt.jpg', manufacturer: 'brampton-brick' },
  { name: 'Raven', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Contemporary Series/Raven.jpg', manufacturer: 'brampton-brick' },
  { name: 'Regency Brown', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Contemporary Series/Regency-Brown.jpg', manufacturer: 'brampton-brick' },
  { name: 'Royal Gray', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Contemporary Series/Royal-Gray.jpg', manufacturer: 'brampton-brick' },
  { name: 'Siena Matt', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Contemporary Series/Siena-Matt.jpg', manufacturer: 'brampton-brick' },
  { name: 'Tahoe', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Contemporary Series/Tahoe.jpg', manufacturer: 'brampton-brick' },
  { name: 'Venetian', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Contemporary Series/Venetian.jpg', manufacturer: 'brampton-brick' },
  { name: 'Victoriaville', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Contemporary Series/Victoriaville.jpg', manufacturer: 'brampton-brick' },
  { name: 'Windsor', profile: 'full-brick', url: 'Images/Full Brick/Brampton Brick/Contemporary Series/Windsor.jpg', manufacturer: 'brampton-brick' }
];

// Aggregated list used by the UI, preserving the requested manufacturer order
const FULL_BRICK_MATERIALS = [
  ...FULL_BRICK_HEBRON,
  ...FULL_BRICK_INTERSTATE,
  ...FULL_BRICK_GLEN_GARY,
  ...FULL_BRICK_HC_MUDDOX,
  ...FULL_BRICK_PALMETTO,
  ...FULL_BRICK_BRAMPTON_BRICK
];

// ===== Full Brick UI Wiring (defensive fallback) =====
(function(){
  function onReady(fn){
    if(document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function q(sel, root){ return (root||document).querySelector(sel); }
  function qa(sel, root){ return Array.from((root||document).querySelectorAll(sel)); }

  // Map manufacturer -> grid id (if these exist in your HTML)
  const FULL_BRICK_GRID_MAP = {
    'hebron-brick': 'hebron-brick-all-grid',
    'interstate-brick': 'interstate-brick-all-grid',
    'glen-gery': 'glen-gery-all-grid',
    'hc-muddox': 'hc-muddox-all-grid',
    'palmetto-brick': 'palmetto-brick-all-grid',
    'brampton-brick': 'brampton-brick-all-grid'
  };

  /** Request a repaint using known hooks, else emit an event */
  function requestRepaint(){
    try {
      if (typeof render === 'function') return render();
      if (typeof drawAll === 'function') return drawAll();
      const evt = new CustomEvent('stone-visualizer:material-changed', { detail: { time: Date.now() } });
      window.dispatchEvent(evt);
    } catch(_) {}
  }

  /** Apply a Full Brick selection to the current area (or globally),
   *  mirroring the behavior of Thin Brick / Stone.
   */
  function applyFullBrickSelection(mat){
    if(!mat) return;
    // Keep parity with other pickers
    window.currentStone = mat;

    // If an area is selected, bind material to it
    if (Array.isArray(window.areas) && typeof window.selectedAreaIndex === 'number' && window.selectedAreaIndex >= 0 && window.areas[window.selectedAreaIndex]){
      const area = window.areas[window.selectedAreaIndex];
      area.materialType = 'full-brick';
      area.pattern = (window.currentBrickPattern || 'running');
      area.mortarColor = (window.currentBrickMortarColor || '#696969');
      // Legacy keys other parts may read
      area.stoneUrl = mat.url;
      area.materialUrl = mat.url;
      area.stone = mat;
      // Ensure brick renderer path gets the right texture fields
area.textureMode = 'brick';
area.textureUrl = mat.url;
if (stoneImages[mat.url] instanceof Image) area.textureImage = stoneImages[mat.url];
      area.textureUrl = mat.url;
if (stoneImages[mat.url] instanceof Image) area.textureImage = stoneImages[mat.url];
      // Respect brick scale helper if present
      if (typeof scaleToBrickSize === 'function') {
        area.scale = scaleToBrickSize(window.GLOBAL_STONE_SCALE || 100);
      }
    }

    requestRepaint();
  }

  function makeCard(mat){
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'material-card material-item';
    card.setAttribute('data-url', mat.url);
    card.setAttribute('data-name', mat.name);
    card.setAttribute('data-manufacturer', mat.manufacturer || '');
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.alignItems = 'center';
    card.style.justifyContent = 'center';
    card.style.width = '90px';
    card.style.height = '110px';
    card.style.flexShrink = '0';
    card.style.padding = '8px';
   card.style.border = '2px solid #2c3e50';
    card.style.borderRadius = '8px';
    card.style.background = 'white';
    card.style.cursor = 'pointer';
    card.style.textAlign = 'center';
    card.style.transition = 'all 0.2s ease';
    card.style.position = 'relative';
    card.style.overflow = 'hidden';

    const img = document.createElement('img');
    img.alt = mat.name;
    img.src = mat.url;
    img.decoding = 'async';
    img.loading = 'lazy';
    img.style.width = '70px';
    img.style.height = '70px';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '6px';
    img.style.marginBottom = '6px';
    img.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

    const label = document.createElement('span');
    label.textContent = mat.name;
    label.style.fontSize = '10px';
    label.style.color = '#666';
    label.style.lineHeight = '1.2';
    label.style.fontWeight = '500';
    label.style.textAlign = 'center';

    card.appendChild(img);
    card.appendChild(label);

    // Click -> apply selection and minimize picker (parity with thin brick)
    card.addEventListener('click', function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      applyFullBrickSelection(mat);
      try {
        const panel = q('[data-section="full-brick"], .full-brick, #full-brick-panel');
        const picker = panel && (panel.querySelector('.material-picker') || panel.querySelector('.materials') || panel);
        if (picker && picker.classList) picker.classList.add('collapsed');
      } catch(_) {}
    });

    return card;
  }

  function ensureFullBrickGridContainer(manufacturerValue){
    const key = (manufacturerValue||'').trim();

    // Prefer a dedicated Full Brick views root if present
    const viewsRoot = q('#full-brick-views');
    if(viewsRoot){
      const gridId = FULL_BRICK_GRID_MAP[key];
      if(gridId){
        const node = q('#'+gridId, viewsRoot);
        if(node) return node;
      }
      // Fallback: a child grid tagged with data-manufacturer
      const tagged = q('[data-manufacturer="'+key+'"]', viewsRoot);
      if(tagged) return tagged;
      // Last resort inside viewsRoot
      const anyGrid = q('.material-grid', viewsRoot) || q('.profile-group .material-grid', viewsRoot);
      if(anyGrid) return anyGrid;
    }

    // ORIGINAL fallbacks (will create a container inside the active panel if none found)
    let container = q('[data-section="full-brick"] .material-grid')
                 || q('#full-brick-grid')
                 || q('.full-brick .material-grid')
                 || q('.material-grid.full-brick');
    if(container) return container;

    const panel = q('[data-section="full-brick"], .full-brick, #full-brick-panel') || q('.material-selection-panel');
    if(!panel) return null;
    container = document.createElement('div');
    container.id = 'full-brick-grid';
    container.className = 'material-grid';
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.alignItems = 'flex-start';
    container.style.background = 'transparent';
    panel.appendChild(container);
    return container;
  }

  function filterFullBrick(manufacturerValue){
    const key = (manufacturerValue||'').trim();
    return (FULL_BRICK_MATERIALS || []).filter(it => (it.manufacturer||'') === key);
  }

  function renderFullBrick(manufacturerValue){
    // If a views root exists, hide its grids before rendering
    const viewsRoot = q('#full-brick-views');
    if(viewsRoot){
      qa('.profile-group, .material-grid', viewsRoot).forEach(n => { 
        n.style.display = 'none'; 
        n.style.background = 'transparent';
      });
      viewsRoot.style.background = 'transparent';
    }

    const container = ensureFullBrickGridContainer(manufacturerValue);
    if(!container) return;

    container.innerHTML = '';
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.alignItems = 'flex-start';
    container.style.background = 'transparent';
    container.style.gap = '15px';
    container.style.padding = '0';
    container.style.minHeight = '0';

    const list = filterFullBrick(manufacturerValue);
    if(!list || list.length === 0){
      const empty = document.createElement('div');
      empty.textContent = 'No products found for this manufacturer.';
      empty.style.padding = '8px';
      empty.style.opacity = '0.8';
      container.appendChild(empty);
      return;
    }

    list.forEach(item => container.appendChild(makeCard(item)));
  }

  function wire(){
    const sel = q('#full-brick-manufacturer-select');
    if(sel){
      sel.addEventListener('change', function(){ renderFullBrick(this.value); });
    }

    // Re-render when Full Brick tab is clicked
    qa('.material-tab').forEach(btn => {
      if(btn.getAttribute('data-category') === 'full-brick'){
        btn.addEventListener('click', function(){ setTimeout(()=>renderFullBrick(q('#full-brick-manufacturer-select')?.value||'hebron-brick'), 0); });
      }
    });

    // Programmatic hook like other pickers
    window.selectFullBrick = function(url){
      const mat = (window.FULL_BRICK_MATERIALS || []).find(m => m.url === url);
      if(mat) applyFullBrickSelection(mat);
    };

    // Initial render
    setTimeout(function(){ renderFullBrick(q('#full-brick-manufacturer-select')?.value || 'hebron-brick'); }, 0);
  }

  onReady(wire);
})();

// Color classification mapping
const colorClassification = {
    // Blacks
    'Mineret': 'Blacks',
    'Banff Springs': 'Blacks', 
    'Montecito': 'Blacks',
    'Lantana': 'Blacks',
    'Polermo': 'Blacks',
    'Catania': 'Blacks',
    'Zinc': 'Blacks',
    'Verona': 'Blacks',
    'Beach Pebble': 'Blacks',
    'Sage': 'Blacks',
    'York': 'Blacks',
    'Whiskey Creek': 'Blacks',
    'Bow Valley': 'Blacks',
    'Somerset': 'Blacks',
    'Teton': 'Blacks',
    'Black River': 'Blacks',
    'Chapel Hill': 'Blacks',
    'Dark Rundle': 'Blacks',
    'Stormcloud': 'Blacks',
    'Parchwood': 'Blacks',
    
    // Browns  
    'Bodega': 'Browns',
    'Prescott': 'Browns',
    'Boardwalk': 'Browns',
    'Manzanita': 'Browns',
    'Whitebark': 'Browns',
    'Barley': 'Browns',
    'Millstream': 'Browns',
    'Cognac': 'Browns',
    'Madrona': 'Browns',
    'Orchard': 'Browns',
    'Iron Mill': 'Browns',
    'Padova': 'Browns',
    'Veneto': 'Browns',
    'Meseta': 'Browns',
    'New Haven': 'Browns',
    'Shilo': 'Browns',
    'Charleston': 'Browns',
    'Asheville': 'Browns',
    'Lexington': 'Browns',
    'Sierra': 'Browns',
    'Durango': 'Browns',
    'Yukon': 'Browns',
    'Pioneer': 'Browns',
    'Russet': 'Browns',
    'Silverton': 'Browns',
    'Tawny Brown': 'Browns',
    'Shelter Cove': 'Browns',
    'Colorado': 'Browns',
    'Yakima': 'Browns',
    'Autumn Leaf': 'Browns',
    'Falling Spring': 'Browns',
    'Sequoia': 'Browns',
    'Sawtooth': 'Browns',
    'Cascade': 'Browns',
    'Crescent Peak': 'Browns',
    'Willow': 'Browns',
    'Bronze': 'Browns',
    'Stratuswood': 'Browns',
    'Saddlewood': 'Browns',
    'Dawnwood': 'Browns',
    
    // Greys
    'Sea Cliff': 'Greys',
    'Sidewalk': 'Greys',
    'Glacier': 'Greys',
    'Cottonwood': 'Greys',
    'Andante': 'Greys',
    'Lucera': 'Greys',
    'Birch': 'Greys',
    'Whitecap': 'Greys',
    'San Marino': 'Greys',
    'Grand Banks': 'Greys',
    'Granite Spire': 'Greys',
    'Rio Grande': 'Greys',
    'Casa Blanca': 'Greys',
    'Loire Valley': 'Greys',
    'Moonlight': 'Greys',
    'Clearwater': 'Greys',
    'Chesapeake': 'Greys',
    'Alderwood': 'Greys',
    'Slate Gray': 'Greys',
    'Castaway': 'Greys',
    'Nantucket': 'Greys',
    'Silver Lining': 'Greys',
    'Cumulus': 'Greys',
    'Southern Peak': 'Greys',
    'Nickel': 'Greys',
    'Monument': 'Greys',
    
    // Whites & Tans
    'Pearl White': 'Whites & Tans',
    'Sanibel': 'Whites & Tans',
    'Bella': 'Whites & Tans',
    'Seashell': 'Whites & Tans',
    'Linen': 'Whites & Tans',
    'Ranchers Ridge': 'Whites & Tans',
    'Ocean Floor': 'Whites & Tans',
    'Dove Tail': 'Whites & Tans',
    'Sanderling': 'Whites & Tans',
    'Whisper White': 'Whites & Tans',
    'Shore Breeze': 'Whites & Tans',
    'Wheatfield': 'Whites & Tans',
    'Vineyard Trail': 'Whites & Tans',
    'Daybreak': 'Whites & Tans',
    'Koryak Ridge': 'Whites & Tans',
    'White Elm': 'Whites & Tans',
    'Doverwood': 'Whites & Tans',
    'Foxwood': 'Whites & Tans',
    'Soft Light': 'Whites & Tans'

    
};

// Stone filtering metadata with corrected filters based on requirements
const stoneMetadata = {
    'bluffstone': {
        'Texture': 'Smooth',
        'Height': 'Small',
        'Shape': 'Irregular',
        'Stone Type': 'Ledge Stone',
        'Regional Style': ['Western Farmhouse', 'Mountain', 'Prairie', 'Craftsman', 'Coastal'],
        'Color': 'Mixed',
        'Collection': 'Drystack'
    },
    'cliffstone': {
        'Texture': 'Smooth',
        'Height': 'Small to Medium',
        'Shape': 'Rectangular',
        'Stone Type': 'Ledge Stone',
        'Regional Style': ['Contemporary', 'Coastal'],
        'Color': 'Mixed',
        'Collection': 'Drystack'
    },
    'coastal-reef': {
        'Texture': 'Rough/Chiseled',
        'Height': 'Large',
        'Shape': 'Cut Stone',
        'Stone Type': 'Cut Stone',
        'Regional Style': ['Contemporary', 'Coastal'],
        'Color': 'Whites & Tans',
        'Collection': 'Irregular'
    },
    'country-rubble': {
        'Texture': 'Rough/Chiseled',
        'Height': 'Varied',
        'Shape': 'Irregular',
        'Stone Type': 'Rubble Stone',
        'Regional Style': ['Western Farmhouse', 'European', 'Colonial', 'Mountain', 'Craftsman'],
        'Color': 'Mixed',
        'Collection': 'Irregular'
    },
    'cypress-ridge': {
        'Texture': 'Rough/Chiseled',
        'Height': 'Varied',
        'Shape': 'Irregular',
        'Stone Type': 'Fieldstone',
        'Regional Style': ['Western Farmhouse', 'European', 'Mountain'],
        'Color': 'Mixed',
        'Collection': 'Irregular'
    },
    'european-ledge': {
        'Texture': 'Rough/Chiseled',
        'Height': 'Medium',
        'Shape': 'Cut Stone',
        'Stone Type': 'Ledge Stone',
        'Regional Style': ['Contemporary', 'Prairie', 'Coastal'],
        'Color': 'Mixed',
        'Collection': 'Panel'
    },
    'fieldledge': {
        'Texture': 'Smooth',
        'Height': 'Small to Medium',
        'Shape': 'Irregular',
        'Stone Type': 'Fieldstone',
        'Regional Style': ['Western Farmhouse', 'European', 'Colonial', 'Mountain', 'Craftsman'],
        'Color': 'Mixed',
        'Collection': 'Ledge'
    },
    'limestone': {
        'Texture': 'Rough/Chiseled',
        'Height': 'Varied',
        'Shape': 'Rectangular',
        'Stone Type': 'Cut Stone',
        'Regional Style': ['Western Farmhouse', 'European', 'Colonial', 'Mountain'],
        'Color': 'Mixed',
        'Collection': 'Irregular'
    },
    'mountain-ledge': {
        'Texture': 'Smooth',
        'Height': 'Small',
        'Shape': 'Rectangular',
        'Stone Type': 'Ledge Stone',
        'Regional Style': ['Contemporary', 'Mountain', 'Prairie', 'Craftsman'],
        'Color': 'Browns',
        'Collection': 'Ledge'
    },
    'river-rock': {
        'Texture': 'Smooth',
        'Height': 'Varied',
        'Shape': 'Round',
        'Stone Type': 'Fieldstone',
        'Regional Style': ['Mountain', 'Craftsman', 'Coastal'],
        'Color': 'Mixed',
        'Collection': 'Irregular'
    },
    'roughcut': {
        'Texture': 'Rough/Chiseled',
        'Height': 'Varied',
        'Shape': 'Rectangular',
        'Stone Type': 'Cut Stone',
        'Regional Style': ['Western Farmhouse', 'European', 'Colonial', 'Mountain'],
        'Color': 'Mixed',
        'Collection': 'Irregular'
    },
    'stacked-stone': {
        'Texture': 'Smooth',
        'Height': 'Small',
        'Shape': 'Cut Stone',
        'Stone Type': 'Panel Stone',
        'Regional Style': ['Contemporary', 'Mountain', 'Prairie', 'Craftsman', 'Coastal'],
        'Color': 'Mixed',
        'Collection': 'Panel'
    }
};

// Filter options extracted from metadata
const filterOptions = {
    'Stone Type': ['Cut Stone', 'Fieldstone', 'Ledge Stone', 'Panel Stone', 'Plank / Linear', 'Rubble Stone', 'Wood Look'],
    'Color': ['Blacks', 'Browns', 'Greys', 'Whites & Tans'],
    'Regional Style': ['Western Farmhouse', 'European', 'Colonial', 'Mountain', 'Contemporary', 'Prairie', 'Craftsman', 'Coastal'],
    'Collection': ['Drystack', 'Irregular', 'Large Format', 'Ledge', 'Panel'],
    'Texture': ['Rough/Chiseled', 'Smooth', 'Wood Grain'],
    'Height': ['Large', 'Medium', 'Medium to Large', 'Small', 'Small to Medium', 'Varied'],
    'Shape': ['Cut Stone', 'Rectangular', 'Linear', 'Irregular', 'Round']
};

const STONE_SURFACES_MATERIALS = [
    { name: 'Stone Finish 1', url: 'https://i.imgur.com/zQTG5pJ.jpg' },
    { name: 'Stone Finish 2', url: 'https://i.imgur.com/E1ovEh1.jpg' },
    { name: 'Stone Finish 3', url: 'https://i.imgur.com/IhXI7YJ.jpg' },
    { name: 'Stone Finish 4', url: 'https://i.imgur.com/t6PLAuo.jpg' },
    { name: 'Stone Finish 5', url: 'https://i.imgur.com/TDb2lRX.jpg' },
    { name: 'Stone Finish 6', url: 'https://i.imgur.com/vyemUoo.jpg' },
    { name: 'Stone Finish 7', url: 'https://i.imgur.com/iAITfvN.jpg' },
    { name: 'Stone Finish 8', url: 'https://i.imgur.com/brNpFH9.jpg' },
    { name: 'Stone Finish 9', url: 'https://i.imgur.com/DHv9cp3.jpg' },
    { name: 'Stone Finish 10', url: 'https://i.imgur.com/neNNlpD.jpg' },
    { name: 'Stone Finish 11', url: 'https://i.imgur.com/9zZMbWc.jpg' }
];

const BRICK_MATERIALS = [
    { name: 'Brick Surface 1', url: 'https://i.imgur.com/eH21oqs.jpg' },
    { name: 'Brick Surface 2', url: 'https://i.imgur.com/eukrUHY.jpg' },
    { name: 'Brick Surface 3', url: 'https://i.imgur.com/3noaNPR.jpg' },
    { name: 'Brick Surface 4', url: 'https://i.imgur.com/Xn39Ggm.jpg' },
    { name: 'Brick Surface 5', url: 'https://i.imgur.com/xxjxGmL.jpg' },
    { name: 'Brick Surface 6', url: 'https://i.imgur.com/FWnUtyU.jpg' },
    { name: 'Brick Surface 7', url: 'https://i.imgur.com/fTmBfHX.jpg' },
    { name: 'Brick Surface 8', url: 'https://i.imgur.com/GHSz23K.jpg' },
    { name: 'Brick Surface 9', url: 'https://i.imgur.com/8L6JNu2.jpg' },
    { name: 'Brick Surface 10', url: 'https://i.imgur.com/a3EDCO6.jpg' },
    { name: 'Brick Surface 11', url: 'https://i.imgur.com/CIvmcKU.jpg' },
    { name: 'Brick Surface 12', url: 'https://i.imgur.com/dpqNPQD.jpg' }
];

// Stone & Concrete Surfaces Materials
const STONE_CONCRETE_MATERIALS = [
  // Concrete materials
  { name: 'Concrete 15', type: 'concrete', url: 'Images/Stone & Concrete Surfaces/Concrete/15.jpg' },
  { name: 'Concrete 17', type: 'concrete', url: 'Images/Stone & Concrete Surfaces/Concrete/17.jpg' },
  { name: 'Concrete 18', type: 'concrete', url: 'Images/Stone & Concrete Surfaces/Concrete/18.jpg' },
  { name: 'Concrete 19', type: 'concrete', url: 'Images/Stone & Concrete Surfaces/Concrete/19.jpg' },
  { name: 'Concrete 20', type: 'concrete', url: 'Images/Stone & Concrete Surfaces/Concrete/20.jpg' },
  
  // Stone materials  
  { name: 'Stone 16', type: 'stone-surface', url: 'Images/Stone & Concrete Surfaces/Stone/16.jpg' },
  { name: 'Stone 21', type: 'stone-surface', url: 'Images/Stone & Concrete Surfaces/Stone/21.jpg' },
  { name: 'Stone 22', type: 'stone-surface', url: 'Images/Stone & Concrete Surfaces/Stone/22.jpg' },
  { name: 'Stone 23', type: 'stone-surface', url: 'Images/Stone & Concrete Surfaces/Stone/23.jpg' },
  { name: 'Stone 24', type: 'stone-surface', url: 'Images/Stone & Concrete Surfaces/Stone/24.jpg' },
  { name: 'Stone 25', type: 'stone-surface', url: 'Images/Stone & Concrete Surfaces/Stone/25.jpg' }
];

// Wood Surfaces Materials
const WOOD_SURFACES_MATERIALS = [
  { name: 'Wood 26', type: 'wood-surface', url: 'Images/Wood Surfaces/Wood/26.jpg' },
  { name: 'Wood 27', type: 'wood-surface', url: 'Images/Wood Surfaces/Wood/27.jpg' },
  { name: 'Wood 28', type: 'wood-surface', url: 'Images/Wood Surfaces/Wood/28.jpg' },
  { name: 'Wood 29', type: 'wood-surface', url: 'Images/Wood Surfaces/Wood/29.jpg' },
  { name: 'Wood 30', type: 'wood-surface', url: 'Images/Wood Surfaces/Wood/30.jpg' },
  { name: 'Wood 31', type: 'wood-surface', url: 'Images/Wood Surfaces/Wood/31.jpg' },
  { name: 'Wood 32', type: 'wood-surface', url: 'Images/Wood Surfaces/Wood/32.jpg' },
  { name: 'Wood 33', type: 'wood-surface', url: 'Images/Wood Surfaces/Wood/33.jpg' },
  { name: 'Wood 35', type: 'wood-surface', url: 'Images/Wood Surfaces/Wood/35.jpg' },
  { name: 'Wood 36', type: 'wood-surface', url: 'Images/Wood Surfaces/Wood/36.jpg' },
  { name: 'Wood 37', type: 'wood-surface', url: 'Images/Wood Surfaces/Wood/37.jpg' }
];

const DECORATION_MATERIALS = [
    { name: 'Decor 1', url: 'https://i.imgur.com/9X3cmNo.jpg' },
    { name: 'Decor 2', url: 'https://i.imgur.com/qRHXdcW.jpg' },
    { name: 'Decor 3', url: 'https://i.imgur.com/eP15OF9.jpg' },
    { name: 'Decor 4', url: 'https://i.imgur.com/rKzQOIr.jpg' },
    { name: 'Decor 5', url: 'https://i.imgur.com/vQhWpop.jpg' },
    { name: 'Decor 6', url: 'https://i.imgur.com/yvvj0Br.jpg' },
    { name: 'Decor 7', url: 'https://i.imgur.com/SouXiLc.jpg' },
    { name: 'Decor 8', url: 'https://i.imgur.com/t5b54Ef.jpg' },
    { name: 'Decor 9', url: 'https://i.imgur.com/x16yMVH.jpg' },
    { name: 'Decor 10', url: 'https://i.imgur.com/IbJvOSt.jpg' },
    { name: 'Decor 11', url: 'https://i.imgur.com/KSwFcMV.jpg' },
    { name: 'Decor 12', url: 'https://i.imgur.com/pQYHoux.jpg' },
    { name: 'Decor 13', url: 'https://i.imgur.com/8RJsjfv.jpg' },
    { name: 'Decor 14', url: 'https://i.imgur.com/dHb6EFr.jpg' },
    { name: 'Decor 15', url: 'https://i.imgur.com/9gqbbH8.jpg' },
    { name: 'Decor 16', url: 'https://i.imgur.com/YzRrqE1.jpg' },
    { name: 'Decor 17', url: 'https://i.imgur.com/STVhr5k.jpg' },
    { name: 'Decor 18', url: 'https://i.imgur.com/KT43D0I.jpg' },
    { name: 'Decor 19', url: 'https://i.imgur.com/5Wwi0xB.jpg' },
    { name: 'Decor 20', url: 'https://i.imgur.com/SBJiedI.jpg' },
    { name: 'Decor 21', url: 'https://i.imgur.com/I7j4Fxo.jpg' }
];
const ACCENT_TYPES = {
    'strip-flashing': {
        name: 'Strip Flashing',
        drawingMethod: 'line',
        defaultColor: '#808080',
        defaultThickness: 2
    },
    'flat-cap': {
        name: 'Flat Cap',
        drawingMethod: 'area',
        defaultThickness: 8,
        defaultMaterial: 'concrete'
    }
    // More accent types will be added later
};

function scaleToRealSize(scale, isBrick = false) {
    if (isBrick) {
        // Enhanced brick-specific scaling with smaller minimum
        // 10% = 0.3x (half of previous 0.6x), 400% = 8.0x
        const minScale = 10;   // was 40
        const maxScale = 400;  // unchanged
        const minSize = 0.3;   // was 0.6
        const maxSize = 8.0;   // unchanged

        const clampedScale = Math.max(minScale, Math.min(maxScale, scale));
        const normalizedScale = (clampedScale - minScale) / (maxScale - minScale);
        const exponentialScale = Math.pow(normalizedScale, 0.7);
        return minSize + (exponentialScale * (maxSize - minSize));
    } else {
        // Stone scaling with smaller minimum
        // 10-1000% maps to 0.075x-32.0x (min halved from 0.15x)
        const minScale = 10;    // unchanged
        const maxScale = 1000;  // unchanged
        const minSize = 0.075;  // was 0.15
        const maxSize = 32.0;   // unchanged

        const clampedScale = Math.max(minScale, Math.min(maxScale, scale));
        const normalizedScale = (clampedScale - minScale) / (maxScale - minScale);
        const exponentialScale = Math.pow(normalizedScale, 0.6);
        return minSize + (exponentialScale * (maxSize - minSize));
    }
}

// --- Canvas Orientation Functions ---
function setCanvasOrientation(orientation) {
    CANVAS_ORIENTATION = orientation;
    
    if (orientation === 'portrait') {
    canvas.width = 960;
    canvas.height = 1600;
    drawingCanvas.width = 960;
    drawingCanvas.height = 1600;
    
    canvas.classList.remove('canvas-landscape');
    canvas.classList.add('canvas-portrait');
    drawingCanvas.classList.remove('canvas-landscape');
    drawingCanvas.classList.add('canvas-portrait');
} else {
    canvas.width = 1600;
    canvas.height = 960;
    drawingCanvas.width = 1600;
    drawingCanvas.height = 960;
    
    canvas.classList.remove('canvas-portrait');
    canvas.classList.add('canvas-landscape');
    drawingCanvas.classList.remove('canvas-portrait');
    drawingCanvas.classList.add('canvas-landscape');
}
    
    // Update orientation buttons
    const landscapeBtn = document.getElementById('landscape-mode-btn');
    const portraitBtn = document.getElementById('portrait-mode-btn');
    
    if (landscapeBtn && portraitBtn) {
        if (orientation === 'portrait') {
            landscapeBtn.classList.remove('active');
            portraitBtn.classList.add('active');
        } else {
            portraitBtn.classList.remove('active');
            landscapeBtn.classList.add('active');
        }
    }
    
    // Redraw canvas with new dimensions
    if (currentImage) {
        drawCanvas();
    }
}



// --- Drawing Tools Functions - COMPLETELY FIXED ---
function setupDrawingTools() {
    const closeToolsBtn = document.getElementById('close-tools-btn');
    const toolButtons = document.querySelectorAll('.tool-btn');
    const colorPicker = document.getElementById('drawing-color');
    const strokeWidthSlider = document.getElementById('stroke-width');
    const fontSizeSlider = document.getElementById('font-size');
    const clearDrawingsBtn = document.getElementById('clear-drawings-btn');
    const deleteSelectedBtn = document.getElementById('delete-selected-btn');
    const palette = document.getElementById('drawing-tools-palette');

    // Make palette draggable
    setupPaletteDragging();

    // Close tools palette
    if (closeToolsBtn) {
    closeToolsBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const drawingToolsBtn = document.getElementById('drawing-tools-btn');
        
        // Add hidden class
        palette.classList.add('hidden');
        
        // IMPORTANT: Also set display to none to actually hide it
        palette.style.setProperty('display', 'none', 'important');
        
        if (drawingToolsBtn) {
            drawingToolsBtn.classList.remove('active');
        }
        isDrawingToolsActive = false;
        currentDrawingTool = 'pointer';
        updateDrawingCursor();
        
        console.log('Drawing tools palette closed via X button');
        showMessage('Drawing tools deactivated.');
    });
}

   // Tool selection - FIXED
    toolButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Tool clicked:', this.dataset.tool);
            
            // Remove active class from all tools
            toolButtons.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked tool
            this.classList.add('active');
            
            // Set the current drawing tool
            currentDrawingTool = this.dataset.tool;
            selectedAnnotation = null; // Deselect when changing tools
            
            // CRITICAL FIX: Keep drawing tools active for all tools including pointer
            // The palette is still open, so isDrawingToolsActive should remain true
            isDrawingToolsActive = true;
            console.log('SET isDrawingToolsActive to TRUE (tool selected)');
            
            console.log('Current drawing tool set to:', currentDrawingTool);
            
            // Update cursor and redraw
            updateDrawingCursor();
            redrawAnnotations();
            
            // Show message based on tool selected
            let toolMessage = '';
            switch(currentDrawingTool) {
                case 'pointer':
                    toolMessage = 'Pointer tool selected. Click drawings to select and move them.';
                    break;
                case 'pen':
                    toolMessage = 'Pen tool selected. Click and drag to draw freehand.';
                    break;
                case 'line':
                    toolMessage = 'Line tool selected. Click and drag to draw straight lines.';
                    break;
                case 'arrow':
                    toolMessage = 'Arrow tool selected. Click and drag to draw arrows.';
                    break;
                case 'circle':
                    toolMessage = 'Circle tool selected. Click and drag to draw circles.';
                    break;
                case 'rectangle':
                    toolMessage = 'Rectangle tool selected. Click and drag to draw rectangles.';
                    break;
                case 'text':
                    toolMessage = 'Text tool selected. Click on canvas to add text.';
                    break;
                default:
                    toolMessage = `${currentDrawingTool} tool selected.`;
            }
            showMessage(toolMessage);
        });
    });

    // Color picker - FIXED TO UPDATE SELECTED ANNOTATIONS
    if (colorPicker) {
        colorPicker.addEventListener('change', function() {
            drawingColor = this.value;
            // Update selected annotation color if any
            if (selectedAnnotation !== null && annotations[selectedAnnotation]) {
                annotations[selectedAnnotation].color = drawingColor;
                redrawAnnotations();
                showMessage('Annotation color updated.');
            }
        });
    }

    // Stroke width - FIXED TO UPDATE SELECTED ANNOTATIONS
    if (strokeWidthSlider) {
        strokeWidthSlider.addEventListener('input', function() {
            strokeWidth = parseInt(this.value);
            // Update selected annotation width if any
            if (selectedAnnotation !== null && annotations[selectedAnnotation]) {
                annotations[selectedAnnotation].width = strokeWidth;
                redrawAnnotations();
                showMessage('Annotation width updated.');
            }
        });
    }

    // Font size - FIXED TO UPDATE SELECTED ANNOTATIONS
    if (fontSizeSlider) {
        fontSizeSlider.addEventListener('input', function() {
            fontSize = parseInt(this.value);
            // Update selected text annotation if any
            if (selectedAnnotation !== null && annotations[selectedAnnotation] && annotations[selectedAnnotation].type === 'text') {
                annotations[selectedAnnotation].size = fontSize;
                redrawAnnotations();
                showMessage('Text size updated.');
            }
        });
    }

    // Clear all drawings - FIXED
    if (clearDrawingsBtn) {
        clearDrawingsBtn.addEventListener('click', function() {
            if (confirm('Clear all drawings?')) {
                annotations = [];
                selectedAnnotation = null;
                redrawAnnotations();
                showMessage('All drawings cleared.');
            }
        });
    }

    // Delete selected annotation - FIXED
    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', function() {
            if (selectedAnnotation !== null && annotations[selectedAnnotation]) {
                const annotationType = annotations[selectedAnnotation].type;
                annotations.splice(selectedAnnotation, 1);
                selectedAnnotation = null;
                redrawAnnotations();
                showMessage(`${annotationType.charAt(0).toUpperCase() + annotationType.slice(1)} deleted.`);
            } else {
                showMessage('No drawing selected. Click on a drawing first to select it.');
            }
        });
    }

    // Add function to update tool panel when annotation is selected
    function updateToolPanelForAnnotation(annotation) {
        if (!annotation) return;
        
        // Update color picker
        if (colorPicker) {
            colorPicker.value = annotation.color || drawingColor;
            drawingColor = annotation.color || drawingColor;
        }
        
        // Update stroke width
        if (strokeWidthSlider) {
            strokeWidthSlider.value = annotation.width || strokeWidth;
            strokeWidth = annotation.width || strokeWidth;
        }
        
        // Update font size for text annotations
        if (fontSizeSlider && annotation.type === 'text') {
            fontSizeSlider.value = annotation.size || fontSize;
            fontSize = annotation.size || fontSize;
        }
    }

    // Make updateToolPanelForAnnotation globally accessible
    window.updateToolPanelForAnnotation = updateToolPanelForAnnotation;
}

function setupPaletteDragging() {
    const palette = document.getElementById('drawing-tools-palette');
    const header = palette.querySelector('.tools-header');
    let isPaletteDragging = false;
    let dragOffset = { x: 0, y: 0 };

    header.addEventListener('mousedown', function(e) {
        if (e.target.classList.contains('close-tools-btn')) return;
        isPaletteDragging = true;
        dragOffset.x = e.clientX - palette.offsetLeft;
        dragOffset.y = e.clientY - palette.offsetTop;
        palette.style.cursor = 'grabbing';
        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (isPaletteDragging) {
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            
            // Keep palette within viewport
            const maxX = window.innerWidth - palette.offsetWidth;
            const maxY = window.innerHeight - palette.offsetHeight;
            
            palette.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
            palette.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
            palette.style.right = 'auto'; // Remove right positioning
        }
    });

    document.addEventListener('mouseup', function() {
        if (isPaletteDragging) {
            isPaletteDragging = false;
            palette.style.cursor = '';
        }
    });
}

// FIXED: Add missing forceDrawingToolsVisibility function
function forceDrawingToolsVisibility() {
    const palette = document.getElementById('drawing-tools-palette');
    if (!palette || palette.classList.contains('hidden')) return;
    
    // Force all child elements to be visible
    const toolsHeader = palette.querySelector('.tools-header');
    const toolsGrid = palette.querySelector('.tools-grid');
    const toolsControls = palette.querySelector('.tools-controls');
    const toolButtons = palette.querySelectorAll('.tool-btn');
    const closeBtn = palette.querySelector('.close-tools-btn');
    
    if (toolsHeader) {
        toolsHeader.style.setProperty('display', 'flex', 'important');
        toolsHeader.style.setProperty('z-index', '999999', 'important');
        toolsHeader.style.setProperty('position', 'relative', 'important');
    }
    
    if (toolsGrid) {
        toolsGrid.style.setProperty('display', 'grid', 'important');
        toolsGrid.style.setProperty('z-index', '999999', 'important');
        toolsGrid.style.setProperty('position', 'relative', 'important');
    }
    
    if (toolsControls) {
        toolsControls.style.setProperty('display', 'flex', 'important');
        toolsControls.style.setProperty('z-index', '999999', 'important');
        toolsControls.style.setProperty('position', 'relative', 'important');
    }
    
    if (closeBtn) {
        closeBtn.style.setProperty('display', 'flex', 'important');
        closeBtn.style.setProperty('z-index', '999999', 'important');
        closeBtn.style.setProperty('pointer-events', 'auto', 'important');
    }
    
    toolButtons.forEach(btn => {
        btn.style.setProperty('display', 'flex', 'important');
        btn.style.setProperty('z-index', '999999', 'important');
        btn.style.setProperty('pointer-events', 'auto', 'important');
    });
    
    console.log('Drawing tools visibility forced');
}

function updateDrawingCursor() {
    if (!drawingCanvas) {
        console.error('drawingCanvas not found in updateDrawingCursor');
        return;
    }
    
    console.log('updateDrawingCursor called, currentDrawingTool:', currentDrawingTool);
    console.log('isDrawingToolsActive:', isDrawingToolsActive);
    
    // Remove all cursor classes first
    drawingCanvas.classList.remove('cursor-crosshair', 'cursor-pen', 'cursor-text', 'cursor-arrow', 'cursor-circle', 'cursor-rectangle');
    
    // If drawing tools are completely deactivated, hide the drawing canvas
    if (!isDrawingToolsActive) {
        drawingCanvas.style.cursor = 'default';
        drawingCanvas.classList.remove('active');
        drawingCanvas.style.removeProperty('z-index');
        drawingCanvas.style.setProperty('pointer-events', 'none', 'important');
        console.log('Drawing canvas completely deactivated - main canvas is now accessible');
        return;
    }
    
    // Drawing tools are active
    if (currentDrawingTool === 'pointer') {
        drawingCanvas.style.cursor = 'default';
        // KEEP canvas active for pointer tool so we can detect clicks and double-clicks
        drawingCanvas.classList.add('active');
        drawingCanvas.style.setProperty('z-index', '100', 'important');
        drawingCanvas.style.setProperty('pointer-events', 'all', 'important');
        console.log('Drawing canvas active for pointer tool (for selection and editing)');
    } else {
        drawingCanvas.classList.add('active');
        drawingCanvas.style.setProperty('z-index', '100', 'important');
        drawingCanvas.style.setProperty('pointer-events', 'all', 'important');
        console.log('Drawing canvas activated, z-index:', drawingCanvas.style.zIndex);
        console.log('Drawing canvas pointer-events:', drawingCanvas.style.pointerEvents);
        
        switch (currentDrawingTool) {
            case 'pen':
                drawingCanvas.style.cursor = 'crosshair';
                drawingCanvas.classList.add('cursor-pen');
                break;
            case 'line':
                drawingCanvas.style.cursor = 'crosshair';
                drawingCanvas.classList.add('cursor-crosshair');
                break;
            case 'arrow':
                drawingCanvas.style.cursor = 'crosshair';
                drawingCanvas.classList.add('cursor-arrow');
                break;
            case 'circle':
                drawingCanvas.style.cursor = 'crosshair';
                drawingCanvas.classList.add('cursor-circle');
                break;
            case 'rectangle':
                drawingCanvas.style.cursor = 'crosshair';
                drawingCanvas.classList.add('cursor-rectangle');
                break;
            case 'text':
                drawingCanvas.style.cursor = 'text';
                drawingCanvas.classList.add('cursor-text');
                break;
            default:
                drawingCanvas.style.cursor = 'crosshair';
                drawingCanvas.classList.add('cursor-crosshair');
        }
        
        console.log('Cursor set to:', drawingCanvas.style.cursor);
    }
}

function setupDrawingCanvasListeners() {
    if (!drawingCanvas) return;

    drawingCanvas.addEventListener('mousedown', handleDrawingMouseDown);
    drawingCanvas.addEventListener('mousemove', handleDrawingMouseMove);
    drawingCanvas.addEventListener('mouseup', handleDrawingMouseUp);
    drawingCanvas.addEventListener('click', handleDrawingClick);
    drawingCanvas.addEventListener('dblclick', handleDrawingDoubleClick);
}


function getUniversalCanvasCoordinates(e, targetCanvas = null) {
    const canvas = targetCanvas || document.getElementById('main-canvas');
    const rect = canvas.getBoundingClientRect();
    
    // Basic coordinate calculation
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    return { x, y };
}

function getCanvasCoordinates(e, targetCanvas = null) {
    const canvas = targetCanvas || document.getElementById('main-canvas');
    const rect = canvas.getBoundingClientRect();
    
    // Get the actual displayed size vs internal canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Calculate coordinates relative to canvas
    let x = (e.clientX - rect.left) * scaleX;
    let y = (e.clientY - rect.top) * scaleY;
    
    // CRITICAL FIX: If image is loaded and has position/scale info, adjust coordinates
    if (currentImage && imagePosition && imageScale) {
        // Check if click is within the actual image bounds
        const imgLeft = imagePosition.x;
        const imgTop = imagePosition.y;
        const imgRight = imagePosition.x + imagePosition.width;
        const imgBottom = imagePosition.y + imagePosition.height;
        
        // If click is outside image bounds, map to edge of image
        if (x < imgLeft) x = imgLeft;
        if (x > imgRight) x = imgRight;
        if (y < imgTop) y = imgTop;
        if (y > imgBottom) y = imgBottom;
        
        // Convert canvas coordinates to image coordinates
        const relativeX = (x - imagePosition.x) / imagePosition.width;
        const relativeY = (y - imagePosition.y) / imagePosition.height;
        
        // Convert back to canvas coordinates but properly scaled
        x = imagePosition.x + (relativeX * imagePosition.width);
        y = imagePosition.y + (relativeY * imagePosition.height);
    }
    
    return { x, y, rawX: x, rawY: y };
}

function handleDrawingMouseDown(e) {
    console.log('=== handleDrawingMouseDown called ===');
    console.log('isDrawingToolsActive:', isDrawingToolsActive);
    console.log('currentDrawingTool:', currentDrawingTool);
    
    if (!isDrawingToolsActive) {
        console.log('Drawing tools not active, returning early');
        return;
    }
    
    const coords = getCanvasCoordinates(e);
    const x = coords.x;
    const y = coords.y;
    
    // Check for annotation selection and dragging first
    const clickedAnnotation = getAnnotationAtPoint(x, y);
    if (clickedAnnotation !== null) {
        selectedAnnotation = clickedAnnotation;
        const annotation = annotations[selectedAnnotation];
        
        // Update tool panel controls
        updateToolPanelForAnnotation(annotation);
        
        // Start dragging the selected annotation
        isDraggingAnnotation = true;
        dragStartAnnotation = { x, y };
        dragOriginalAnnotation = JSON.parse(JSON.stringify(annotation)); // Deep copy
        
        redrawAnnotations();
        showMessage('Dragging annotation. Release to place.');
        return;
    }
    
    // If pointer tool is selected and no annotation clicked, deselect
    if (currentDrawingTool === 'pointer') {
        selectedAnnotation = null;
        redrawAnnotations();
        return;
    }
    
    // Start creating new annotation for other tools
    drawingStartPoint = { x, y };
    
    if (currentDrawingTool === 'pen') {
        isDrawingAnnotation = true;
        currentAnnotationPath = [{ x, y }];
    }
}

function handleDrawingMouseMove(e) {
    if (!isDrawingToolsActive) return;
    
    const coords = getCanvasCoordinates(e);
    const x = coords.x;
    const y = coords.y;
    
    // Handle annotation dragging
    if (isDraggingAnnotation && selectedAnnotation !== null && annotations[selectedAnnotation]) {
        const annotation = annotations[selectedAnnotation];
        const deltaX = x - dragStartAnnotation.x;
        const deltaY = y - dragStartAnnotation.y;
        
        // Move annotation based on type
        if (annotation.type === 'text') {
            annotation.x = dragOriginalAnnotation.x + deltaX;
            annotation.y = dragOriginalAnnotation.y + deltaY;
        } else if (annotation.type === 'pen') {
            annotation.path = dragOriginalAnnotation.path.map(point => ({
                x: point.x + deltaX,
                y: point.y + deltaY
            }));
        } else if (['line', 'arrow', 'circle', 'rectangle'].includes(annotation.type)) {
            annotation.start = {
                x: dragOriginalAnnotation.start.x + deltaX,
                y: dragOriginalAnnotation.start.y + deltaY
            };
            annotation.end = {
                x: dragOriginalAnnotation.end.x + deltaX,
                y: dragOriginalAnnotation.end.y + deltaY
            };
        }
        
        redrawAnnotations();
        return;
    }
    
    // Handle pen drawing
    if (isDrawingAnnotation && currentDrawingTool === 'pen') {
        currentAnnotationPath.push({ x, y });
        redrawAnnotations();
        drawCurrentPath();
    } else if (drawingStartPoint && ['line', 'arrow', 'circle', 'rectangle'].includes(currentDrawingTool)) {
        // Draw preview
        redrawAnnotations();
        drawShapePreview(drawingStartPoint, { x, y });
    }
}

function handleDrawingMouseUp(e) {
    if (!isDrawingToolsActive) return;
    
    // Handle end of annotation dragging
    if (isDraggingAnnotation) {
        isDraggingAnnotation = false;
        dragStartAnnotation = null;
        dragOriginalAnnotation = null;
        showMessage('Annotation moved.');
        return;
    }
    
    if (!drawingStartPoint) return;
    
    const coords = getCanvasCoordinates(e);
    const x = coords.x;
    const y = coords.y;
    
    if (currentDrawingTool === 'pen' && isDrawingAnnotation) {
        // Finish pen drawing
        if (currentAnnotationPath.length > 1) {
            annotations.push({
                type: 'pen',
                path: [...currentAnnotationPath],
                color: drawingColor,
                width: strokeWidth,
                id: Date.now()
            });
            showMessage('Pen drawing created. Click to select and move.');
        }
        currentAnnotationPath = [];
        isDrawingAnnotation = false;
    } else if (['line', 'arrow', 'circle', 'rectangle'].includes(currentDrawingTool)) {
        // Only create shape if there's significant movement
        const distance = Math.sqrt(Math.pow(x - drawingStartPoint.x, 2) + Math.pow(y - drawingStartPoint.y, 2));
        if (distance > 5) {
            const annotation = {
                type: currentDrawingTool,
                start: drawingStartPoint,
                end: { x, y },
                color: drawingColor,
                width: strokeWidth,
                id: Date.now()
            };
            annotations.push(annotation);
            showMessage(`${currentDrawingTool.charAt(0).toUpperCase() + currentDrawingTool.slice(1)} created. Click to select and move.`);
        }
    }
    
    drawingStartPoint = null;
    redrawAnnotations();
}

function handleDrawingClick(e) {
    console.log('=== handleDrawingClick called ===');
    console.log('isDrawingToolsActive:', isDrawingToolsActive);
    console.log('currentDrawingTool:', currentDrawingTool);
    
    if (!isDrawingToolsActive) {
        console.log('Drawing tools not active, returning early');
        return;
    }
    
    const coords = getCanvasCoordinates(e);
    const x = coords.x;
    const y = coords.y;
    
    // Check for annotation selection for ANY tool
    const clickedAnnotation = getAnnotationAtPoint(x, y);
    if (clickedAnnotation !== null) {
        selectedAnnotation = clickedAnnotation;
        const annotation = annotations[selectedAnnotation];
        
        // Update tool panel controls to show selected annotation properties
        updateToolPanelForAnnotation(annotation);
        
        redrawAnnotations();
        showMessage('Annotation selected. Use tools panel to edit or drag to move.');
        return;
    } else {
        selectedAnnotation = null;
        redrawAnnotations();
    }
    
    // Only create new annotations if pointer tool is not selected
    if (currentDrawingTool === 'pointer') {
        return;
    }
    
    if (currentDrawingTool === 'text') {
    console.log('Creating text input at:', x, y);
    createTextInput(x, y);
    console.log('Text input creation finished');
}
}

function handleDrawingDoubleClick(e) {
    console.log('=== Double click detected ===');
    console.log('isDrawingToolsActive:', isDrawingToolsActive);
    console.log('currentDrawingTool:', currentDrawingTool);
    
    // Allow double-click editing even if drawing tools aren't technically active
    // as long as we're in pointer mode or have annotations
    if (!isDrawingToolsActive && annotations.length === 0) return;
    
    const coords = getCanvasCoordinates(e);
    const clickedAnnotation = getAnnotationAtPoint(coords.x, coords.y);
    
    console.log('Clicked annotation:', clickedAnnotation);
    
    if (clickedAnnotation !== null && annotations[clickedAnnotation].type === 'text') {
        console.log('Opening text edit modal for annotation:', clickedAnnotation);
        editTextAnnotation(clickedAnnotation);
    }
}

function getAnnotationAtPoint(x, y) {
    for (let i = annotations.length - 1; i >= 0; i--) {
        const annotation = annotations[i];
        if (isPointNearAnnotation(x, y, annotation)) {
            return i;
        }
    }
    return null;
}

function isPointNearAnnotation(x, y, annotation) {
    const threshold = 10;
    
    switch (annotation.type) {
        case 'pen':
            return annotation.path.some(point => 
                Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2)) < threshold
            );
        case 'line':
        case 'arrow':
            return isPointNearLine({ x, y }, annotation.start, annotation.end, threshold);
        case 'circle':
            const radius = Math.sqrt(
                Math.pow(annotation.end.x - annotation.start.x, 2) + 
                Math.pow(annotation.end.y - annotation.start.y, 2)
            );
            const distanceFromCenter = Math.sqrt(
                Math.pow(x - annotation.start.x, 2) + 
                Math.pow(y - annotation.start.y, 2)
            );
            return Math.abs(distanceFromCenter - radius) < threshold;
        case 'rectangle':
            const rect = {
                left: Math.min(annotation.start.x, annotation.end.x),
                right: Math.max(annotation.start.x, annotation.end.x),
                top: Math.min(annotation.start.y, annotation.end.y),
                bottom: Math.max(annotation.start.y, annotation.end.y)
            };
            return (x >= rect.left - threshold && x <= rect.right + threshold && 
                    y >= rect.top - threshold && y <= rect.bottom + threshold &&
                    !(x > rect.left + threshold && x < rect.right - threshold && 
                      y > rect.top + threshold && y < rect.bottom - threshold));
        case 'text':
            const textWidth = (annotation.text || '').length * (annotation.size || 16) * 0.6;
            const textHeight = annotation.size || 16;
            return (x >= annotation.x - threshold && x <= annotation.x + textWidth + threshold &&
                    y >= annotation.y - textHeight && y <= annotation.y + threshold);
        default:
            return false;
    }
}

function createTextInput(x, y) {
    // Convert canvas coordinates to screen coordinates
    const rect = drawingCanvas.getBoundingClientRect();
    const screenX = (x / drawingCanvas.width) * rect.width + rect.left;
    const screenY = (y / drawingCanvas.height) * rect.height + rect.top;
    
    // Adjust position to keep input visible
    const adjustedX = Math.min(screenX, window.innerWidth - 320);
    const adjustedY = Math.max(20, Math.min(screenY, window.innerHeight - 100));
    
    const overlay = document.createElement('div');
    overlay.className = 'text-input-overlay';
    overlay.style.position = 'fixed';
    overlay.style.left = adjustedX + 'px';
    overlay.style.top = adjustedY + 'px';
    overlay.style.zIndex = '100000';
    overlay.style.backgroundColor = 'white';
    overlay.style.border = '2px solid #333';
    overlay.style.borderRadius = '4px';
    overlay.style.padding = '10px';
    overlay.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter text...';
    input.style.fontSize = fontSize + 'px';
    input.style.width = '250px';
    input.style.padding = '8px';
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '3px';
    input.style.marginBottom = '8px';
    input.style.display = 'block';
    
    // Font controls container
    const fontControls = document.createElement('div');
    fontControls.style.display = 'flex';
    fontControls.style.gap = '10px';
    fontControls.style.marginBottom = '8px';
    fontControls.style.alignItems = 'center';
    
    // Font family selector
    const fontLabel = document.createElement('label');
    fontLabel.textContent = 'Font:';
    fontLabel.style.fontSize = '12px';
    fontLabel.style.fontWeight = '500';
    
    const fontSelect = document.createElement('select');
    fontSelect.style.padding = '4px';
    fontSelect.style.border = '1px solid #ccc';
    fontSelect.style.borderRadius = '3px';
    fontSelect.style.flex = '1';
    
    const fonts = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Comic Sans MS', 'Trebuchet MS', 'Impact'];
    fonts.forEach(font => {
        const option = document.createElement('option');
        option.value = font;
        option.textContent = font;
        fontSelect.appendChild(option);
    });
    
    // Font size number input
    const sizeLabel = document.createElement('label');
    sizeLabel.textContent = 'Size:';
    sizeLabel.style.fontSize = '12px';
    sizeLabel.style.fontWeight = '500';
    
    const fontSizeInput = document.createElement('input');
    fontSizeInput.type = 'number';
    fontSizeInput.value = fontSize;
    fontSizeInput.min = '8';
    fontSizeInput.max = '200';
    fontSizeInput.style.width = '60px';
    fontSizeInput.style.padding = '4px';
    fontSizeInput.style.border = '1px solid #ccc';
    fontSizeInput.style.borderRadius = '3px';
    
    // Update input preview when font changes
    fontSelect.addEventListener('change', () => {
        input.style.fontFamily = fontSelect.value;
    });
    
    fontSizeInput.addEventListener('input', () => {
        input.style.fontSize = fontSizeInput.value + 'px';
    });
    
    fontControls.appendChild(fontLabel);
    fontControls.appendChild(fontSelect);
    fontControls.appendChild(sizeLabel);
    fontControls.appendChild(fontSizeInput);
    
    const controls = document.createElement('div');
    controls.className = 'text-controls';
    controls.style.display = 'flex';
    controls.style.gap = '5px';
    
    const okBtn = document.createElement('button');
    okBtn.textContent = 'Add Text';
    okBtn.style.padding = '6px 12px';
    okBtn.style.backgroundColor = '#4CAF50';
    okBtn.style.color = 'white';
    okBtn.style.border = 'none';
    okBtn.style.borderRadius = '3px';
    okBtn.style.cursor = 'pointer';
    okBtn.addEventListener('click', () => {
        if (input.value.trim()) {
            annotations.push({
                type: 'text',
                x: x,
                y: y,
                text: input.value,
                color: drawingColor,
                size: parseInt(fontSizeInput.value) || fontSize,
                font: fontSelect.value || 'Arial',
                bold: false,
                italic: false,
                id: Date.now()
            });
            redrawAnnotations();
            showMessage('Text added.');
        }
        overlay.remove();
    });
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.padding = '6px 12px';
    cancelBtn.style.backgroundColor = '#f44336';
    cancelBtn.style.color = 'white';
    cancelBtn.style.border = 'none';
    cancelBtn.style.borderRadius = '3px';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.addEventListener('click', () => overlay.remove());
    
    controls.appendChild(okBtn);
    controls.appendChild(cancelBtn);
    overlay.appendChild(input);
    overlay.appendChild(fontControls);
    overlay.appendChild(controls);
    
    document.body.appendChild(overlay);
    input.focus();
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') okBtn.click();
        if (e.key === 'Escape') cancelBtn.click();
    });
}

function editTextAnnotation(annotationIndex) {
    console.log('editTextAnnotation called with index:', annotationIndex);
    const annotation = annotations[annotationIndex];
    if (!annotation || annotation.type !== 'text') {
        console.log('Invalid annotation or not text type');
        return;
    }
    
    console.log('Editing annotation:', annotation);
    
    editingTextAnnotation = annotationIndex;
    const modal = document.getElementById('text-edit-modal');
    const textContent = document.getElementById('text-content');
    const textFontSize = document.getElementById('text-font-size');
    const textFontFamily = document.getElementById('text-font-family');
    const textColor = document.getElementById('text-color');
    const textBold = document.getElementById('text-bold');
    const textItalic = document.getElementById('text-italic');
    
    console.log('Modal element found:', !!modal);
    console.log('Text content input found:', !!textContent);
    console.log('Font size input found:', !!textFontSize);
    console.log('Font family select found:', !!textFontFamily);
    
    if (!modal) {
        console.error('Modal not found!');
        return;
    }
    
    // Populate current values
    if (textContent) textContent.value = annotation.text || '';
    if (textFontSize) textFontSize.value = annotation.size || 16;
    if (textFontFamily) textFontFamily.value = annotation.font || 'Arial';
    if (textColor) textColor.value = annotation.color || '#000000';
    if (textBold) textBold.checked = annotation.bold || false;
    if (textItalic) textItalic.checked = annotation.italic || false;
    
    console.log('About to show modal...');
    modal.classList.remove('hidden');
    modal.style.display = 'flex'; // Force display
    console.log('Modal should now be visible');
    
    if (textContent) {
        textContent.focus();
        textContent.select();
    }
}

function drawCurrentPath() {
    if (!drawingCtx || currentAnnotationPath.length < 2) return;
    
    drawingCtx.save();
    drawingCtx.strokeStyle = drawingColor;
    drawingCtx.lineWidth = strokeWidth;
    drawingCtx.lineCap = 'round';
    drawingCtx.lineJoin = 'round';
    
    drawingCtx.beginPath();
    drawingCtx.moveTo(currentAnnotationPath[0].x, currentAnnotationPath[0].y);
    
    for (let i = 1; i < currentAnnotationPath.length; i++) {
        drawingCtx.lineTo(currentAnnotationPath[i].x, currentAnnotationPath[i].y);
    }
    
    drawingCtx.stroke();
    drawingCtx.restore();
}

function drawShapePreview(start, end) {
    if (!drawingCtx) return;
    
    drawingCtx.save();
    drawingCtx.strokeStyle = drawingColor;
    drawingCtx.lineWidth = strokeWidth;
    drawingCtx.lineCap = 'round';
    drawingCtx.globalAlpha = 0.7;
    drawingCtx.setLineDash([5, 5]);
    
    switch (currentDrawingTool) {
        case 'line':
            drawingCtx.beginPath();
            drawingCtx.moveTo(start.x, start.y);
            drawingCtx.lineTo(end.x, end.y);
            drawingCtx.stroke();
            break;
        case 'arrow':
            drawingCtx.beginPath();
            drawingCtx.moveTo(start.x, start.y);
            drawingCtx.lineTo(end.x, end.y);
            drawingCtx.stroke();
            break;
        case 'circle':
            const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
            drawingCtx.beginPath();
            drawingCtx.arc(start.x, start.y, radius, 0, Math.PI * 2);
            drawingCtx.stroke();
            break;
        case 'rectangle':
            const width = end.x - start.x;
            const height = end.y - start.y;
            drawingCtx.beginPath();
            drawingCtx.rect(start.x, start.y, width, height);
            drawingCtx.stroke();
            break;
    }
    
    drawingCtx.restore();
}

function redrawAnnotations() {
    if (!drawingCtx) return;
    
    drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    
    annotations.forEach((annotation, index) => {
        drawingCtx.save();
        
        // Highlight selected annotation with glow effect
        if (index === selectedAnnotation) {
            drawingCtx.shadowColor = '#3498db';
            drawingCtx.shadowBlur = 8;
            drawingCtx.lineWidth = (annotation.width || 2) + 2;
            
            // Add selection indicator
            drawingCtx.save();
            drawingCtx.strokeStyle = '#3498db';
            drawingCtx.lineWidth = 1;
            drawingCtx.setLineDash([4, 4]);
            
            // Draw selection box based on annotation type
            if (annotation.type === 'text') {
                const textWidth = (annotation.text || '').length * (annotation.size || 16) * 0.6;
                const textHeight = annotation.size || 16;
                drawingCtx.strokeRect(annotation.x - 5, annotation.y - textHeight - 5, textWidth + 10, textHeight + 10);
            } else if (annotation.type === 'pen') {
                // Draw bounding box for pen path
                if (annotation.path.length > 0) {
                    const bounds = getPathBounds(annotation.path);
                    drawingCtx.strokeRect(bounds.minX - 5, bounds.minY - 5, bounds.width + 10, bounds.height + 10);
                }
            } else if (['line', 'arrow', 'circle', 'rectangle'].includes(annotation.type)) {
                const bounds = getShapeBounds(annotation);
                drawingCtx.strokeRect(bounds.minX - 5, bounds.minY - 5, bounds.width + 10, bounds.height + 10);
            }
            
            drawingCtx.restore();
        } else {
            drawingCtx.lineWidth = annotation.width || 2;
        }
        
        drawingCtx.strokeStyle = annotation.color;
        drawingCtx.fillStyle = annotation.color;
        drawingCtx.lineCap = 'round';
        drawingCtx.lineJoin = 'round';
        drawingCtx.setLineDash([]); // Reset line dash
        
        switch (annotation.type) {
            case 'pen':
                if (annotation.path.length > 1) {
                    drawingCtx.beginPath();
                    drawingCtx.moveTo(annotation.path[0].x, annotation.path[0].y);
                    for (let i = 1; i < annotation.path.length; i++) {
                        drawingCtx.lineTo(annotation.path[i].x, annotation.path[i].y);
                    }
                    drawingCtx.stroke();
                }
                break;
                
            case 'line':
                drawingCtx.beginPath();
                drawingCtx.moveTo(annotation.start.x, annotation.start.y);
                drawingCtx.lineTo(annotation.end.x, annotation.end.y);
                drawingCtx.stroke();
                break;
                
            case 'arrow':
                // Draw line
                drawingCtx.beginPath();
                drawingCtx.moveTo(annotation.start.x, annotation.start.y);
                drawingCtx.lineTo(annotation.end.x, annotation.end.y);
                drawingCtx.stroke();
                
                // Draw arrowhead - FIXED
                const angle = Math.atan2(annotation.end.y - annotation.start.y, annotation.end.x - annotation.start.x);
                const arrowLength = 15;
                const arrowAngle = Math.PI / 6;
                
                drawingCtx.beginPath();
                drawingCtx.moveTo(annotation.end.x, annotation.end.y);
                drawingCtx.lineTo(
                    annotation.end.x - arrowLength * Math.cos(angle - arrowAngle),
                    annotation.end.y - arrowLength * Math.sin(angle - arrowAngle)
                );
                drawingCtx.moveTo(annotation.end.x, annotation.end.y);
                drawingCtx.lineTo(
                    annotation.end.x - arrowLength * Math.cos(angle + arrowAngle),
                    annotation.end.y - arrowLength * Math.sin(angle + arrowAngle)
                );
                drawingCtx.stroke();
                break;
                
            case 'circle':
                const radius = Math.sqrt(
                    Math.pow(annotation.end.x - annotation.start.x, 2) + 
                    Math.pow(annotation.end.y - annotation.start.y, 2)
                );
                drawingCtx.beginPath();
                drawingCtx.arc(annotation.start.x, annotation.start.y, radius, 0, Math.PI * 2);
                drawingCtx.stroke();
                break;
                
            case 'rectangle':
                const width = annotation.end.x - annotation.start.x;
                const height = annotation.end.y - annotation.start.y;
                drawingCtx.beginPath();
                drawingCtx.rect(annotation.start.x, annotation.start.y, width, height);
                drawingCtx.stroke();
                break;
                
            case 'text':
                const size = annotation.size || 16;
                let fontStyle = '';
                if (annotation.italic) fontStyle += 'italic ';
                if (annotation.bold) fontStyle += 'bold ';
                const fontFamily = annotation.font || 'Arial';
                drawingCtx.font = `${fontStyle}${size}px ${fontFamily}`;
                drawingCtx.fillText(annotation.text, annotation.x, annotation.y);
                break;
        }
        
        drawingCtx.restore();
    });
}

// Helper functions for selection bounds
function getPathBounds(path) {
    if (path.length === 0) return { minX: 0, minY: 0, width: 0, height: 0 };
    
    let minX = path[0].x, maxX = path[0].x;
    let minY = path[0].y, maxY = path[0].y;
    
    for (const point of path) {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
    }
    
    return {
        minX,
        minY,
        width: maxX - minX,
        height: maxY - minY
    };
}

function getShapeBounds(annotation) {
    const minX = Math.min(annotation.start.x, annotation.end.x);
    const maxX = Math.max(annotation.start.x, annotation.end.x);
    const minY = Math.min(annotation.start.y, annotation.end.y);
    const maxY = Math.max(annotation.start.y, annotation.end.y);
    
    return {
        minX,
        minY,
        width: maxX - minX,
        height: maxY - minY
    };
}

// --- Stone Pattern Functions ---
function drawStonePattern(area, textureMode) {
    console.log('=== DRAW STONE PATTERN ===');
    console.log('Area ID:', area.id);
    console.log('Texture Mode:', textureMode);
    console.log('Area Stone:', area.stone);
    console.log('Stone Images Available:', Object.keys(stoneImages).length);
    
    if (!area.stone || !stoneImages[area.stone]) {
        console.log('NO STONE OR STONE IMAGE - showing gray');
        ctx.fillStyle = '#888888';
        const bounds = getAreaBounds(area.points);
        ctx.fillRect(bounds.minX, bounds.minY, bounds.width, bounds.height);
        return;
    }
    
    const stoneImg = stoneImages[area.stone];
    let actualScale = area.scale;
    if (actualScale === undefined || actualScale === null) {
        actualScale = GLOBAL_STONE_SCALE;
    }
    
    // Convert scale to real size using new scaling system
    const scale = scaleToRealSize(actualScale);
    
    const rotation = (area.rotation || 0) * Math.PI / 180;
    const brightness = (area.brightness || 100) / 100;
    const contrast = (area.contrast || 100) / 100;
    const horizontalOffset = area.horizontalOffset || 0;
    const verticalOffset = area.verticalOffset || 0;
    const angle3d = (area.angle3d || 0) * Math.PI / 180;
    const perspectiveAngle = (area.perspectiveAngle || 0) * Math.PI / 180;
const perspectiveCompression = (area.perspectiveCompression || 0) / 100;
    const shadowOffset = area.shadowOffset || 0;
    const shadowBlur = area.shadowBlur || 0;
    const depthPerspective = area.depthPerspective || 0;
    
    const bounds = getAreaBounds(area.points);
    
    ctx.save();
    
// Apply perspective angle (skew) and compression for more realistic angles
console.log('Perspective values:', perspectiveAngle, perspectiveCompression);
if (perspectiveAngle !== 0 || perspectiveCompression !== 0) {
    console.log('APPLYING PERSPECTIVE TRANSFORMATION');
    const centerX = bounds.minX + bounds.width / 2;
    const centerY = bounds.minY + bounds.height / 2;
    ctx.translate(centerX, centerY);
    
    const skewX = Math.tan(perspectiveAngle) * 0.3;
    const scaleY = 1 - Math.abs(perspectiveAngle) * 0.1;
    let scaleX = 1 + Math.abs(perspectiveAngle) * 0.05;
    
    if (perspectiveCompression !== 0) {
    scaleX = scaleX * (1 + perspectiveCompression);
}
    
    ctx.transform(scaleX, 0, skewX, scaleY, 0, 0);
    ctx.translate(-centerX, -centerY);
}
        
    // Apply 3D rotation if specified - NO imageSmoothingEnabled change to prevent blur
    if (angle3d !== 0) {
        const centerX = bounds.minX + bounds.width / 2;
        const centerY = bounds.minY + bounds.height / 2;
        ctx.translate(centerX, centerY);
        ctx.transform(Math.cos(angle3d), 0, Math.sin(angle3d), 1, 0, 0);
        ctx.translate(-centerX, -centerY);
    }
    
    // Apply 2D rotation if specified
    if (rotation !== 0) {
        const centerX = bounds.minX + bounds.width / 2;
        const centerY = bounds.minY + bounds.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);
        ctx.translate(-centerX, -centerY);
    }
    
    if (brightness !== 1 || contrast !== 1) {
        ctx.filter = `brightness(${brightness}) contrast(${contrast})`;
    }
    
    console.log('CALLING LINEAR STONE PATTERN');
    drawLinearStonePattern(stoneImg, bounds, scale, horizontalOffset, verticalOffset, area);
    

    ctx.restore();
    
    // Apply depth perspective gradient if set
    if (depthPerspective > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(area.points[0].x, area.points[0].y);
        for (let i = 1; i < area.points.length; i++) {
            ctx.lineTo(area.points[i].x, area.points[i].y);
        }
        ctx.closePath();
        ctx.clip();
        
        const gradient = ctx.createLinearGradient(
            bounds.minX, bounds.minY,
            bounds.maxX, bounds.maxY
        );
        
        // Create depth illusion with gradient
        const intensity = depthPerspective / 100;
        gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity * 0.2})`);
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity * 0.4})`);
        
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
    }
}


function drawLinearStonePattern(stoneImg, bounds, scale, hOffset, vOffset, area) {
    // Use consistent base size with new scaling system
    const baseStoneSize = 20;
    const imgWidth = baseStoneSize * scale;
    const imgHeight = baseStoneSize * scale;
    
    // Much tighter spacing to prevent gaps
const rowSpacing = imgHeight * 0.999;
let colSpacing = imgWidth * 0.999; // Perfect horizontal alignment
    
    // Extend well beyond bounds
    const startX = bounds.minX + hOffset - imgWidth * 3;
    const startY = bounds.minY + vOffset - imgHeight * 3;
    const endX = bounds.maxX + imgWidth * 3;
    const endY = bounds.maxY + imgHeight * 3;
    

    
   // Get perspective compression for gradual effect
const perspectiveCompression = (area.perspectiveCompression || 0) / 100;

let rowIndex = 0;
for (let y = startY; y < endY; y += rowSpacing) {
    let colIndex = 0;
    let currentX = startX;
let safetyCounter = 0;
while (currentX < endX && safetyCounter < 1000) {
    safetyCounter++;
    // Calculate gradual compression based on X position
    const normalizedX = (currentX - bounds.minX) / bounds.width; // 0 to 1 across width
    const compressionFactor = 1; // No compression for perfect alignment
    
    // Apply compression to this stone's size
    const compressedWidth = imgWidth * compressionFactor;
    const compressedHeight = imgHeight * compressionFactor;
    
    // Calculate dynamic spacing for this stone
const dynamicSpacing = compressedWidth - 0.5; // Slightly more overlap to hide seams
        
        // Offset every other row by half width
        const offsetX = 0; // No brick stagger pattern
        const finalX = currentX + offsetX;
            
        ctx.drawImage(stoneImg, finalX, y, compressedWidth, compressedHeight);
            currentX += dynamicSpacing;
colIndex++;
        }
        rowIndex++;
    }
}


function drawBrickPattern(area) {
    const brickColor = area.brickColor || currentBrickColor;
    const mortarColor = area.brickMortarColor || currentBrickMortarColor;
    const rowHeight = area.brickRowHeight || brickRowHeight;
    const mortarThickness = area.brickMortarThickness || brickMortarThickness;
    
    // Use new scaling system for bricks
    let actualScale = area.scale;
    if (actualScale === undefined || actualScale === null) {
        actualScale = GLOBAL_STONE_SCALE;
    }
   const scale = scaleToBrickSize(actualScale);
    
    const brickTexture = area.brickTexture || currentBrickTexture;
    const brightness = (area.brightness || 100) / 100;
    const contrast = (area.contrast || 100) / 100;
    const horizontalOffset = area.horizontalOffset || 0;
    const verticalOffset = area.verticalOffset || 0;
    const rotation = (area.rotation || 0) * Math.PI / 180;
    const angle3d = (area.angle3d || 0) * Math.PI / 180;
    const perspectiveAngle = (area.perspectiveAngle || 0) * Math.PI / 180;
const perspectiveCompression = (area.perspectiveCompression || 0) / 100;
    const shadowOffset = area.shadowOffset || 0;
    const shadowBlur = area.shadowBlur || 0;
    const depthPerspective = area.depthPerspective || 0;
    
    const bounds = getAreaBounds(area.points);
    const brickWidth = rowHeight * 2.5 * scale;
   const scaledRowHeight = Math.round(rowHeight * scale);
   const scaledMortarThickness = Math.max(1, Math.round(mortarThickness * scale));
    
    ctx.save();
    
   // Apply perspective angle (skew) and compression for more realistic chimney angles
if (perspectiveAngle !== 0 || perspectiveCompression !== 0) {
    const centerX = bounds.minX + bounds.width / 2;
    const centerY = bounds.minY + bounds.height / 2;
    ctx.translate(centerX, centerY);
    
    // Enhanced perspective transformation for more realistic angles
    // Use both skewX and slight scale adjustments for depth
    const skewX = Math.tan(perspectiveAngle) * 0.3; // Horizontal skew
    const scaleY = 1 - Math.abs(perspectiveAngle) * 0.1; // Slight vertical compression
    let scaleX = 1 + Math.abs(perspectiveAngle) * 0.05; // Slight horizontal expansion
    
    // Apply perspective compression (horizontal squish)
    if (perspectiveCompression !== 0) {
        scaleX = scaleX * (1 + perspectiveCompression);
    }
    
    // Apply combined transformation matrix for perspective effect
    ctx.transform(scaleX, 0, skewX, scaleY, 0, 0);
    
    ctx.translate(-centerX, -centerY);
        
        // Extend bounds to cover transformed area
        const skewExtension = Math.abs(bounds.height * skewX) / 2;
        const scaleExtension = bounds.width * (scaleX - 1) / 2;
        bounds.minX -= (skewExtension + scaleExtension);
        bounds.maxX += (skewExtension + scaleExtension);
        bounds.width = bounds.maxX - bounds.minX;
    }
    
    // Apply 3D rotation if specified - extend bounds to prevent clipping
    if (angle3d !== 0) {
        const centerX = bounds.minX + bounds.width / 2;
        const centerY = bounds.minY + bounds.height / 2;
        ctx.translate(centerX, centerY);
        ctx.transform(Math.cos(angle3d), 0, Math.sin(angle3d), 1, 0, 0);
        ctx.translate(-centerX, -centerY);
        
        // Extend bounds to cover rotated area
        bounds.minX -= bounds.width * 0.5;
        bounds.maxX += bounds.width * 0.5;
        bounds.minY -= bounds.height * 0.5;
        bounds.maxY += bounds.height * 0.5;
        bounds.width = bounds.maxX - bounds.minX;
        bounds.height = bounds.maxY - bounds.minY;
    }
    
    // Apply 2D rotation if specified
    if (rotation !== 0) {
        const centerX = bounds.minX + bounds.width / 2;
        const centerY = bounds.minY + bounds.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);
        ctx.translate(-centerX, -centerY);
    }
    
    if (brightness !== 1 || contrast !== 1) {
        ctx.filter = `brightness(${brightness}) contrast(${contrast})`;
    }
    
    ctx.fillStyle = getMortarColor(mortarColor, area);
    ctx.fillRect(bounds.minX, bounds.minY, bounds.width, bounds.height);
    
   let baseBrickColor;
if (brickColor === 'custom') {
    baseBrickColor = area.customBrickColor || customBrickColor;
} else {
    baseBrickColor = brickStandardColors[brickColor] || '#AD4F4F';
}
    
    let rowIndex = 0;

const startY = bounds.minY + verticalOffset - scaledRowHeight;
const endY = bounds.maxY + scaledRowHeight;

// Use index-based positioning instead of increment to avoid rounding accumulation
const totalRows = Math.ceil((endY - startY) / scaledRowHeight) + 2;

for (let rowIdx = 0; rowIdx < totalRows; rowIdx++) {
    // Calculate Y position using index multiplication to prevent rounding accumulation
    const y = startY + (rowIdx * scaledRowHeight);
    
    if (y >= endY) break;
    
    let xPos = bounds.minX + horizontalOffset;
    
    if (rowIdx % 2 === 1) {
        xPos -= brickWidth / 2;
    }
    
    const startX = xPos - brickWidth;
    const endX = bounds.maxX + brickWidth;
    
    for (let x = startX; x < endX; x += brickWidth) {
            let brickFillColor = baseBrickColor;
            if (brickTexture === 'textured' || brickTexture === 'rough') {
                const variation = Math.random() * 0.2 - 0.1;
                const rgb = hexToRgb(baseBrickColor);
                if (rgb) {
                    brickFillColor = `rgb(${Math.max(0, Math.min(255, rgb.r + variation * 50))}, 
                                          ${Math.max(0, Math.min(255, rgb.g + variation * 50))}, 
                                          ${Math.max(0, Math.min(255, rgb.b + variation * 50))})`;
                }
            }
            
            ctx.fillStyle = brickFillColor;
            
            const brickX = x + scaledMortarThickness/2;
            const brickY = y + scaledMortarThickness/2;
            const brickW = brickWidth - scaledMortarThickness;
            const brickH = scaledRowHeight - scaledMortarThickness;
            
            if (brickX + brickW > bounds.minX && brickX < bounds.maxX && 
                brickY + brickH > bounds.minY && brickY < bounds.maxY) {
                // REPLACE this line: ctx.fillRect(brickX, brickY, brickW, brickH);
// WITH this texture-aware version:

// Check if we have a texture to apply
const areaTexture = area.brickTexture || brickTexture;
const textureIntensity = area.textureIntensity || 1;
const textureScale = area.textureScale || 100;

if (areaTexture && areaTexture !== 'smooth' && loadedTextures[areaTexture]) {
    // Get all slider values from area
    const textureIntensity = (area.textureIntensity !== undefined) ? area.textureIntensity : 1;
    const textureScale = (area.textureScale !== undefined) ? area.textureScale : 100;
    const textureContrast = (area.textureContrast !== undefined) ? area.textureContrast : 1;
    
    // Fill with base color first
    ctx.fillStyle = brickFillColor;
    ctx.fillRect(brickX, brickY, brickW, brickH);
    
    // Only apply texture if intensity > 0
    if (textureIntensity > 0) {
        ctx.save();
        
        // Use normal blend mode with very low opacity to preserve base color
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = textureIntensity * 0.3; // Reduce back to preserve colors
        
        // Apply contrast filter if different from 100%
        if (textureContrast !== 1) {
            ctx.filter = `contrast(${Math.round(textureContrast * 150)}%)`;  // 50% more contrast
        }
        
        // Simple scaling without banding
       if (textureScale !== 100) {
    const scale = (textureScale / 100) * 0.5; // 50% more refined scaling
            ctx.scale(scale, scale);
            ctx.fillStyle = ctx.createPattern(loadedTextures[areaTexture], 'repeat');
            ctx.fillRect(brickX / scale, brickY / scale, brickW / scale, brickH / scale);
        } else {
            ctx.fillStyle = ctx.createPattern(loadedTextures[areaTexture], 'repeat');
            ctx.fillRect(brickX, brickY, brickW, brickH);
        }
        
        ctx.restore();
    }
} else {
    // No texture, just use solid color rectangle
    ctx.fillStyle = brickFillColor;
    ctx.fillRect(brickX, brickY, brickW, brickH);
}           
                if (brickTexture === 'wired') {
                    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(brickX, brickY + brickH/2);
                    ctx.lineTo(brickX + brickW, brickY + brickH/2);
                    ctx.stroke();
                } else if (brickTexture === 'splitfaced') {
                    ctx.fillStyle = 'rgba(0,0,0,0.2)';
                    for (let i = 0; i < 3; i++) {
                        const randX = brickX + Math.random() * brickW;
                        const randY = brickY + Math.random() * brickH;
                        ctx.fillRect(randX, randY, 2, 2);
                    }
                }
            }
        }
        
       
    }
    
    ctx.restore();
    
    // Apply depth perspective gradient if set
    if (depthPerspective > 0) {
        ctx.save();
        const gradient = ctx.createLinearGradient(
            bounds.minX, bounds.minY,
            bounds.maxX, bounds.maxY
        );
        
        // Create depth illusion with gradient
        const intensity = depthPerspective / 100;
        gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity * 0.2})`);
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity * 0.4})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(bounds.minX, bounds.minY, bounds.width, bounds.height);
        ctx.restore();
    }
}

// --- FIXED Decoration Drawing Function ---
function drawDecoration(decoration, isSelected) {
    if (!decoration || !decorationImages[decoration.image]) return;
    
    const img = decorationImages[decoration.image];
    const size = (decoration.size || 100) / 100;
    const opacity = (decoration.opacity || 100) / 100;
    const rotation = (decoration.rotation || 0) * Math.PI / 180;
    const brightness = (decoration.brightness || 100) / 100;
    const contrast = (decoration.contrast || 100) / 100;
    const shadow = (decoration.shadow || 0) / 100;
    const shadowOffset = decoration.shadowOffset || 2;
    const shadowBlur = decoration.shadowBlur || 2;
    
    ctx.save();
    
    // Apply global opacity
    ctx.globalAlpha = opacity;
    
    // Apply filters
    if (brightness !== 1 || contrast !== 1) {
        ctx.filter = `brightness(${brightness}) contrast(${contrast})`;
    }
    
    // Apply shadow if enabled
    if (shadow > 0) {
        ctx.shadowColor = `rgba(0, 0, 0, ${shadow})`;
        ctx.shadowOffsetX = shadowOffset;
        ctx.shadowOffsetY = shadowOffset;
        ctx.shadowBlur = shadowBlur;
    }
    
    // Calculate dimensions
    const width = img.width * size;
    const height = img.height * size;
    
    // Apply rotation around center
    ctx.translate(decoration.x, decoration.y);
    ctx.rotate(rotation);
    
    // Draw the decoration centered on its position - FIXED Z-INDEX
    ctx.drawImage(img, -width/2, -height/2, width, height);
    
    ctx.restore();
    
    // Draw selection handles if selected - FIXED TO BE VISIBLE
    if (isSelected) {
        ctx.save();
        ctx.strokeStyle = '#3498db';
        ctx.fillStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1.0; // Ensure full opacity for handles
        
        // Calculate rotated corner positions
        const corners = [
            { x: -width/2, y: -height/2 }, // Top-left
            { x: width/2, y: -height/2 },  // Top-right
            { x: width/2, y: height/2 },   // Bottom-right
            { x: -width/2, y: height/2 }   // Bottom-left
        ];
        
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        
        // Draw selection rectangle
        ctx.beginPath();
        corners.forEach((corner, index) => {
            const rotatedX = decoration.x + corner.x * cos - corner.y * sin;
            const rotatedY = decoration.y + corner.x * sin + corner.y * cos;
            if (index === 0) {
                ctx.moveTo(rotatedX, rotatedY);
            } else {
                ctx.lineTo(rotatedX, rotatedY);
            }
        });
        ctx.closePath();
        ctx.stroke();
        
        // Draw corner resize handles - FIXED TO BE MORE VISIBLE
        corners.forEach(corner => {
            const rotatedX = decoration.x + corner.x * cos - corner.y * sin;
            const rotatedY = decoration.y + corner.x * sin + corner.y * cos;
            
            ctx.beginPath();
            ctx.arc(rotatedX, rotatedY, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.strokeStyle = '#3498db';
        });
        
        ctx.restore();
    }
}

// REPLACE your existing drawAccent function with this debug version:

// STEP 1: Find and DELETE all the messy code you pasted
// Delete everything from your paste - all the duplicate functions

// STEP 2: Make sure you have ONLY these two functions (find them in your code):

// DELETE all the messy code you pasted and REPLACE with just these two clean functions:

// --- Accent Drawing Functions ---
function drawAccent(accent, isSelected) {
    console.log('=== DRAW ACCENT FUNCTION CALLED ===');
    console.log('accent:', accent);
    console.log('accent.type:', accent.type);
    console.log('isSelected:', isSelected);
    
    if (!accent || !accent.points || accent.points.length < 2) {
        console.log('DRAW ACCENT: Exiting - invalid accent or points');
        return;
    }
    
    ctx.save();
    
    const accentType = ACCENT_TYPES[accent.type];
    console.log('accentType found:', accentType);
    
    if (!accentType) {
        console.log('DRAW ACCENT: Exiting - no accent type found for', accent.type);
        return;
    }
    
    if (accent.type === 'strip-flashing') {
        console.log('DRAW ACCENT: About to call drawStripFlashing');
        drawStripFlashing(accent, isSelected);
        console.log('DRAW ACCENT: Finished calling drawStripFlashing');
    } else if (accent.type === 'flat-cap') {
        console.log('DRAW ACCENT: About to call drawFlatCap');
        drawFlatCap(accent, isSelected);
        console.log('DRAW ACCENT: Finished calling drawFlatCap');
    }
    
    ctx.restore();
    console.log('DRAW ACCENT: Function complete');
}

function drawStripFlashing(accent, isSelected) {
    console.log('=== DRAWING STRIP FLASHING ===');
    console.log('accent object:', accent);
    console.log('thickness from accent:', accent.thickness);
    console.log('color from accent:', accent.color);
    console.log('isSelected:', isSelected);
    
    const start = accent.points[0];
    const end = accent.points[1];
    const color = accent.color || currentFlashingColor;
    const thickness = accent.thickness || ACCENT_TYPES['strip-flashing'].defaultThickness;
    const opacity = (accent.opacity || 100) / 100;
    const shadowOffset = accent.shadowOffset || 2;
    const shadowBlur = accent.shadowBlur || 3;
    const brightness = (accent.brightness || 100) / 100;
    const contrast = (accent.contrast || 100) / 100;
    
    console.log('calculated values:', { start, end, color, thickness, opacity });
    
    ctx.save();
    
    // Apply brightness and contrast filters
    if (brightness !== 1 || contrast !== 1) {
        ctx.filter = `brightness(${brightness}) contrast(${contrast})`;
    }
    
    // Apply opacity and shadow
    ctx.globalAlpha = opacity;
    if (shadowOffset > 0) {
        const shadowOpacity = (accent.shadowOpacity || 40) / 100; // Use shadowOpacity from accent
        ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`;
        ctx.shadowOffsetX = shadowOffset;
        ctx.shadowOffsetY = shadowOffset;
        ctx.shadowBlur = shadowBlur;
    }
    
    // Calculate direction and perpendicular
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const dirX = dx / length;
    const dirY = dy / length;
    const perpX = -dirY;
    const perpY = dirX;
    
    const halfThickness = thickness;
    
    // Create flashing rectangle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(start.x + perpX * halfThickness, start.y + perpY * halfThickness);
    ctx.lineTo(end.x + perpX * halfThickness, end.y + perpY * halfThickness);
    ctx.lineTo(end.x - perpX * halfThickness, end.y - perpY * halfThickness);
    ctx.lineTo(start.x - perpX * halfThickness, start.y - perpY * halfThickness);
    ctx.closePath();
    ctx.fill();
    
    // FIXED: Draw proper selection outline if selected
    if (isSelected) {
        // Reset shadow and filter for selection outline
        ctx.shadowColor = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;
        ctx.filter = 'none';
        ctx.globalAlpha = 1.0;
        
        // Draw selection box around the flashing
        ctx.strokeStyle = '#3498db'; // Blue selection color
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        
        // Create selection box slightly larger than the flashing
        const padding = 5;
        ctx.beginPath();
        ctx.moveTo(start.x + perpX * (halfThickness + padding), start.y + perpY * (halfThickness + padding));
        ctx.lineTo(end.x + perpX * (halfThickness + padding), end.y + perpY * (halfThickness + padding));
        ctx.lineTo(end.x - perpX * (halfThickness + padding), end.y - perpY * (halfThickness + padding));
        ctx.lineTo(start.x - perpX * (halfThickness + padding), start.y - perpY * (halfThickness + padding));
        ctx.closePath();
        ctx.stroke();
        
        // Draw resize handles at endpoints
        ctx.setLineDash([]);
        ctx.fillStyle = '#3498db';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        // Start point handle
        ctx.beginPath();
        ctx.arc(start.x, start.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // End point handle
        ctx.beginPath();
        ctx.arc(end.x, end.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    
    ctx.restore();
}

function updateAccentsList() {
    const accentsList = document.getElementById('accents-list');
    if (!accentsList) return;
    
    if (accents.length === 0) {
        accentsList.style.display = 'none';
        return;
    }
    
    accentsList.style.display = 'block';
    accentsList.innerHTML = '';
    accents.forEach((accent, index) => {
        const accentItem = document.createElement('div');
        accentItem.className = 'area-item accent';
        if (index === selectedAccentIndex) accentItem.classList.add('selected');
        
        const accentName = document.createElement('span');
        accentName.className = 'area-name';
        accentName.textContent = accent.name || `${ACCENT_TYPES[accent.type]?.name || 'Accent'} ${index + 1}`;
        
        const accentType = document.createElement('span');
        accentType.className = 'area-type accent';
        accentType.textContent = ACCENT_TYPES[accent.type]?.name || 'Accent';
        
        accentItem.appendChild(accentName);
        accentItem.appendChild(accentType);
        
        accentItem.addEventListener('click', () => {
            selectedAccentIndex = index;
            selectedAreaIndex = -1;
            selectedDepthEdgeIndex = -1;
            selectedSillIndex = -1;
            selectedBrickRowIndex = -1;
            selectedDecorationIndex = -1;
            updateAreasList();
            updateDepthList();
            updateSillsList();
            updateBrickRowsList();
            updateDecorationsList();
            updateAccentsList();
            enableAccentControls(accent);
            drawCanvas();
        });
        
        accentsList.appendChild(accentItem);
    });
}
function drawFlatCap(accent, isSelected) {
    if (!accent.points || accent.points.length < 3) return;
    
    const thickness = accent.thickness || ACCENT_TYPES['flat-cap'].defaultThickness;
    const material = accent.material || 'concrete';
    const opacity = (accent.opacity || 100) / 100;
    const shadowOffset = accent.shadowOffset || 3;
    const shadowBlur = accent.shadowBlur || 5;
    
    ctx.save();
    ctx.globalAlpha = opacity;
    
    // Apply shadow for depth effect
    if (shadowOffset > 0) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowOffsetX = shadowOffset;
        ctx.shadowOffsetY = shadowOffset;
        ctx.shadowBlur = shadowBlur;
    }
    
    // Draw main cap surface
    ctx.fillStyle = material === 'stone' ? '#A0A0A0' : '#8B8B8B'; // Stone or concrete color
    ctx.beginPath();
    ctx.moveTo(accent.points[0].x, accent.points[0].y);
    for (let i = 1; i < accent.points.length; i++) {
        ctx.lineTo(accent.points[i].x, accent.points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    
    // Draw thickness edge to show 3D effect
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = material === 'stone' ? '#707070' : '#606060'; // Darker edge color
    for (let i = 0; i < accent.points.length; i++) {
        const current = accent.points[i];
        const next = accent.points[(i + 1) % accent.points.length];
        
        ctx.beginPath();
        ctx.moveTo(current.x, current.y);
        ctx.lineTo(next.x, next.y);
        ctx.lineTo(next.x + thickness, next.y + thickness);
        ctx.lineTo(current.x + thickness, current.y + thickness);
        ctx.closePath();
        ctx.fill();
    }
    
    // Draw selection outline if selected
    if (isSelected) {
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 3]);
        
        ctx.beginPath();
        ctx.moveTo(accent.points[0].x, accent.points[0].y);
        for (let i = 1; i < accent.points.length; i++) {
            ctx.lineTo(accent.points[i].x, accent.points[i].y);
        }
        ctx.closePath();
        ctx.stroke();
        
        // Draw vertex handles
        ctx.setLineDash([]);
        ctx.fillStyle = '#e74c3c';
        accent.points.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    ctx.restore();
}
function finishDrawingFlatCap() {
    if (currentAccentPoints.length < 3) return;

    saveState();
    
    // Simplify the points to reduce file size
    const simplifiedPoints = simplifyPoints(currentAccentPoints, 3);
    console.log(`Simplified ${currentAccentPoints.length} accent points to ${simplifiedPoints.length} points`);

    const newAccent = {
        id: Date.now(),
        points: simplifiedPoints,
        type: currentAccentType,
        material: 'concrete',
        thickness: ACCENT_TYPES[currentAccentType]?.defaultThickness || 8,
        opacity: 100,
        shadowOffset: 3,
        shadowBlur: 5,
        name: `${ACCENT_TYPES[currentAccentType]?.name || 'Accent'} ${accents.length + 1}`
    };
    
    accents.push(newAccent);
    selectedAccentIndex = accents.length - 1;
    isDrawingAccent = false;
    currentAccentPoints = [];
    isInDrawingMode = false;
    updateAccentsList();
    enableAccentControls(newAccent);
    showMessage(`${ACCENT_TYPES[currentAccentType]?.name || 'Accent'} created.`);
    drawCanvas();
}
function enableAccentControls(accent) {
    // Show accent controls section
    const accentControls = document.getElementById('accent-controls');
    if (accentControls) {
        accentControls.style.display = 'block';
    }
    
    // Update thickness slider
    const thicknessSlider = document.getElementById('accent-thickness-slider');
    const thicknessValue = document.getElementById('accent-thickness-value');
    if (thicknessSlider && thicknessValue) {
        const thickness = accent.thickness || 2;
        thicknessSlider.value = thickness;
        thicknessValue.textContent = thickness + 'px';
    }
    
    // Update color picker
    const colorPicker = document.getElementById('accent-color-picker');
    if (colorPicker) {
        colorPicker.value = accent.color || currentFlashingColor;
    }
    
    // Update opacity slider
    const opacitySlider = document.getElementById('accent-opacity-slider');
    const opacityValue = document.getElementById('accent-opacity-value');
    if (opacitySlider && opacityValue) {
        const opacity = accent.opacity || 100;
        opacitySlider.value = opacity;
        opacityValue.textContent = opacity + '%';
    }
    
    // Update shadow controls
    const shadowOpacitySlider = document.getElementById('accent-shadow-opacity-slider');
    const shadowOpacityValue = document.getElementById('accent-shadow-opacity-value');
    if (shadowOpacitySlider && shadowOpacityValue) {
        const shadowOpacity = accent.shadowOpacity || 40;
        shadowOpacitySlider.value = shadowOpacity;
        shadowOpacityValue.textContent = shadowOpacity + '%';
    }
    
    const shadowOffsetSlider = document.getElementById('accent-shadow-offset-slider');
    const shadowOffsetValue = document.getElementById('accent-shadow-offset-value');
    if (shadowOffsetSlider && shadowOffsetValue) {
        const shadowOffset = accent.shadowOffset || 2;
        shadowOffsetSlider.value = shadowOffset;
        shadowOffsetValue.textContent = shadowOffset + 'px';
    }
    
    const shadowBlurSlider = document.getElementById('accent-shadow-blur-slider');
    const shadowBlurValue = document.getElementById('accent-shadow-blur-value');
    if (shadowBlurSlider && shadowBlurValue) {
        const shadowBlur = accent.shadowBlur || 3;
        shadowBlurSlider.value = shadowBlur;
        shadowBlurValue.textContent = shadowBlur + 'px';
    }
    // Update layer button states
    const bringFrontBtn = document.getElementById('accent-bring-front');
    const sendBackBtn = document.getElementById('accent-send-back');
    
    if (bringFrontBtn && sendBackBtn) {
        const currentLayer = accent.layer || 'front';
        
        // Update button appearance based on current layer
        if (currentLayer === 'front') {
            bringFrontBtn.style.background = '#3498db';
            bringFrontBtn.style.color = 'white';
            sendBackBtn.style.background = '#f8f9fa';
            sendBackBtn.style.color = '#333';
        } else {
            sendBackBtn.style.background = '#3498db';
            sendBackBtn.style.color = 'white';
            bringFrontBtn.style.background = '#f8f9fa';
            bringFrontBtn.style.color = '#333';
        }
    }
    showMessage(`${ACCENT_TYPES[accent.type]?.name || 'Accent'} selected - Use controls to customize appearance`);
}

// --- FIXED Depth Edge Functions ---
function drawDepthEdgeEffect(edge, isSelected) {
    if (!edge || !edge.points || edge.points.length < 2) return;
    
    const intensity = edge.intensity || depthEffectIntensity;
    const protrusion = edge.protrusion || 0;
    const shadowOpacity = (edge.shadowOpacity || 40) / 100;
    const shadowOffset = edge.shadowOffset || 5;
    const shadowBlur = edge.shadowBlur || 3;
    
    ctx.save();
    
    if (edge.mode === 'line') {
        // Draw line depth effect
        const start = edge.points[0];
        const end = edge.points[1];
        
        // Calculate perpendicular direction for depth effect
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const perpX = -dy / length;
        const perpY = dx / length;
        
        // Create gradient for depth effect
        const gradient = ctx.createLinearGradient(
            start.x, start.y,
            start.x + perpX * intensity, start.y + perpY * intensity
        );
        
        gradient.addColorStop(0, `rgba(0, 0, 0, ${shadowOpacity})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        // Draw depth shadow
        ctx.strokeStyle = gradient;
        ctx.lineWidth = intensity;
        ctx.lineCap = 'square';
        ctx.beginPath();
        ctx.moveTo(start.x + shadowOffset, start.y + shadowOffset);
        ctx.lineTo(end.x + shadowOffset, end.y + shadowOffset);
        ctx.stroke();
        
        // Draw highlight line if protrusion > 0
        if (protrusion > 0) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${protrusion * 0.01})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(start.x - perpX * 2, start.y - perpY * 2);
            ctx.lineTo(end.x - perpX * 2, end.y - perpY * 2);
            ctx.stroke();
        }
        
    } else if (edge.mode === 'area' && edge.points.length >= 3) {
        // Draw area depth effect
        ctx.beginPath();
        ctx.moveTo(edge.points[0].x, edge.points[0].y);
        for (let i = 1; i < edge.points.length; i++) {
            ctx.lineTo(edge.points[i].x, edge.points[i].y);
        }
        ctx.closePath();
        
        // Create radial gradient for area depth
        const bounds = getAreaBounds(edge.points);
        const centerX = bounds.minX + bounds.width / 2;
        const centerY = bounds.minY + bounds.height / 2;
        const radius = Math.max(bounds.width, bounds.height) / 2;
        
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX + shadowOffset, centerY + shadowOffset, radius
        );
        
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.7, `rgba(0, 0, 0, ${shadowOpacity * 0.5})`);
        gradient.addColorStop(1, `rgba(0, 0, 0, ${shadowOpacity})`);
        
        ctx.fillStyle = gradient;
        ctx.fill();
    }
    
    ctx.restore();
    
    // Draw selection outline if selected
    if (isSelected) {
        ctx.save();
        ctx.strokeStyle = '#9b59b6';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        
        if (edge.mode === 'line') {
            ctx.beginPath();
            ctx.moveTo(edge.points[0].x, edge.points[0].y);
            ctx.lineTo(edge.points[1].x, edge.points[1].y);
            ctx.stroke();
            
            // Draw resize handles
            ctx.setLineDash([]);
            ctx.fillStyle = '#9b59b6';
            edge.points.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
                ctx.fill();
            });
        } else if (edge.mode === 'area') {
            ctx.beginPath();
            ctx.moveTo(edge.points[0].x, edge.points[0].y);
            for (let i = 1; i < edge.points.length; i++) {
                ctx.lineTo(edge.points[i].x, edge.points[i].y);
            }
            ctx.closePath();
            ctx.stroke();
            
            // Draw vertex handles
            ctx.setLineDash([]);
            ctx.fillStyle = '#9b59b6';
            edge.points.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        
        ctx.restore();
    }
}

// --- Sill Drawing Functions ---
function drawSill(sill, isSelected) {
    if (!sill || !sill.points || sill.points.length < 2) return;
    
    const start = sill.points[0];
    const end = sill.points[1];
    const thickness = sill.thickness || sillThickness;
    const type = sill.type || 'stone';
    const texture = sill.texture || 'smooth';
    const color = sill.color || 'grey';
    const scale = scaleToRealSize(sill.scale || GLOBAL_STONE_SCALE);
    const rotation = (sill.rotation || 0) * Math.PI / 180;
    const brightness = (sill.brightness || 100) / 100;
    const contrast = (sill.contrast || 100) / 100;
    const shadow = (sill.shadow || 0) / 100;
    const shadowOffset = sill.shadowOffset || 2;
    const shadowBlur = sill.shadowBlur || 2;
    
    ctx.save();
    
    // Apply filters
    if (brightness !== 1 || contrast !== 1) {
        ctx.filter = `brightness(${brightness}) contrast(${contrast})`;
    }
    
    // Apply shadow if enabled
    if (shadow > 0) {
        ctx.shadowColor = `rgba(0, 0, 0, ${shadow})`;
        ctx.shadowOffsetX = shadowOffset;
        ctx.shadowOffsetY = shadowOffset;
        ctx.shadowBlur = shadowBlur;
    }
    
    // Calculate perpendicular direction for thickness
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const perpX = -dy / length;
    const perpY = dx / length;
    
    const scaledThickness = thickness * scale;
    const halfThickness = scaledThickness / 2;
    
    // Create sill rectangle points
    const sillPoints = [
        { x: start.x + perpX * halfThickness, y: start.y + perpY * halfThickness },
        { x: end.x + perpX * halfThickness, y: end.y + perpY * halfThickness },
        { x: end.x - perpX * halfThickness, y: end.y - perpY * halfThickness },
        { x: start.x - perpX * halfThickness, y: start.y - perpY * halfThickness }
    ];
    
    // Apply rotation if specified
    if (rotation !== 0) {
        const centerX = (start.x + end.x) / 2;
        const centerY = (start.y + end.y) / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);
        ctx.translate(-centerX, -centerY);
    }
    
    // Draw sill based on type
    if (type === 'stone') {
        const baseColor = sillColors[color] || sillColors.grey;
        ctx.fillStyle = baseColor;
        
        // Add texture effects
        if (texture === 'granite') {
            // Add granite speckles
            ctx.fillStyle = baseColor;
            ctx.beginPath();
            ctx.moveTo(sillPoints[0].x, sillPoints[0].y);
            for (let i = 1; i < sillPoints.length; i++) {
                ctx.lineTo(sillPoints[i].x, sillPoints[i].y);
            }
            ctx.closePath();
            ctx.fill();
            
            // Add speckle effect
            for (let i = 0; i < length / 10; i++) {
                const speckleX = start.x + (dx / length) * (i * 10) + (Math.random() - 0.5) * scaledThickness;
                const speckleY = start.y + (dy / length) * (i * 10) + (Math.random() - 0.5) * scaledThickness;
                ctx.fillStyle = `rgba(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 100}, 0.3)`;
                ctx.beginPath();
                ctx.arc(speckleX, speckleY, 1, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            ctx.beginPath();
            ctx.moveTo(sillPoints[0].x, sillPoints[0].y);
            for (let i = 1; i < sillPoints.length; i++) {
                ctx.lineTo(sillPoints[i].x, sillPoints[i].y);
            }
            ctx.closePath();
            ctx.fill();
        }
        
    } else if (type === 'wood') {
        const woodColors = sillTextures.wood;
        const woodColor = woodColors[texture] ? woodColors[texture].color : '#8B6F47';
        ctx.fillStyle = woodColor;
        
        ctx.beginPath();
        ctx.moveTo(sillPoints[0].x, sillPoints[0].y);
        for (let i = 1; i < sillPoints.length; i++) {
            ctx.lineTo(sillPoints[i].x, sillPoints[i].y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Add wood grain effect
        ctx.strokeStyle = `rgba(0, 0, 0, 0.2)`;
        ctx.lineWidth = 1;
        for (let i = 0; i < length / 20; i++) {
            const grainX = start.x + (dx / length) * (i * 20);
            const grainY = start.y + (dy / length) * (i * 20);
            ctx.beginPath();
            ctx.moveTo(grainX + perpX * halfThickness, grainY + perpY * halfThickness);
            ctx.lineTo(grainX - perpX * halfThickness, grainY - perpY * halfThickness);
            ctx.stroke();
        }
    }
    
    ctx.restore();
    
    // Draw selection outline if selected with vertex handles
if (isSelected) {
    ctx.save();
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 3]);
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.lineTo(end.x + perpX * scaledHeight, end.y + perpY * scaledHeight);
    ctx.lineTo(start.x + perpX * scaledHeight, start.y + perpY * scaledHeight);
    ctx.closePath();
    ctx.stroke();
    
    // Draw vertex handles (orange dots) - SAME AS AREAS
    ctx.setLineDash([]);
    ctx.fillStyle = '#ff6b35';
    ctx.strokeStyle = '#fff'; // White border for better visibility
    ctx.lineWidth = 2;
    
    [start, end].forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke(); // White border around the orange dot
    });
    
    ctx.restore();
}
}

// Enhanced brick row drawing with pattern support
function getMortarColor(mortarColor, brickRow) {
    console.log('getMortarColor called with:', mortarColor, 'customMortarColor:', customMortarColor);
    if (mortarColor === 'custom') {
        const color = brickRow.customMortarColor || customMortarColor;
        console.log('Returning custom color:', color);
        return color;
    }
    console.log('Returning standard color:', mortarColor);
    return mortarColor;
}
function drawEnhancedBrickRow(brickRow, isSelected) {
    if (!brickRow || !brickRow.points || brickRow.points.length < 2) return;
    
    const start = brickRow.points[0];
    const end = brickRow.points[1];
    const height = brickRow.height || brickRowHeight;
    const color = brickRow.color || currentBrickColor;
    const texture = brickRow.texture || currentBrickTexture;
    const mortarColor = brickRow.mortarColor || currentBrickMortarColor;
    const mortarThickness = brickRow.mortarThickness || brickMortarThickness;
    const pattern = brickRow.pattern || currentBrickPattern;
   const scale = scaleToBrickSize(brickRow.scale || GLOBAL_STONE_SCALE);
    const brightness = (brickRow.brightness || 100) / 100;
    const contrast = (brickRow.contrast || 100) / 100;
    const shadow = (brickRow.shadow || 0) / 100;
    const shadowOffset = brickRow.shadowOffset || 0;
    const shadowBlur = brickRow.shadowBlur || 0;
const perspectiveAngle = (brickRow.perspectiveAngle || 0) * Math.PI / 180;
const perspectiveCompression = (brickRow.perspectiveCompression || 0) / 100;
    
    ctx.save();
    
    // Apply filters
    if (brightness !== 1 || contrast !== 1) {
        ctx.filter = `brightness(${brightness}) contrast(${contrast})`;
    }
    
    // Apply shadow if enabled
    if (shadow > 0) {
        ctx.shadowColor = `rgba(0, 0, 0, ${shadow})`;
        ctx.shadowOffsetX = shadowOffset;
        ctx.shadowOffsetY = shadowOffset;
        ctx.shadowBlur = shadowBlur;
    }
// Apply perspective angle and compression for brick rows
if (perspectiveAngle !== 0 || perspectiveCompression !== 0) {
    const centerX = (start.x + end.x) / 2;
    const centerY = (start.y + end.y) / 2;
    ctx.translate(centerX, centerY);
    
    const skewX = Math.tan(perspectiveAngle) * 0.3;
    const scaleY = 1 - Math.abs(perspectiveAngle) * 0.1;
    let scaleX = 1 + Math.abs(perspectiveAngle) * 0.05;
    
    if (perspectiveCompression !== 0) {
        scaleX = scaleX * (1 + perspectiveCompression);
    }
    
    ctx.transform(scaleX, 0, skewX, scaleY, 0, 0);
    ctx.translate(-centerX, -centerY);
}
    
    // Calculate direction and perpendicular
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const dirX = dx / length;
    const dirY = dy / length;
    const perpX = -dirY;
    const perpY = dirX;
    
    const scaledHeight = Math.round(height * scale);
   const scaledMortarThickness = Math.max(1, Math.round(mortarThickness * scale));
    
    // Draw based on pattern
    if (pattern === 'soldier') {
        drawSoldierCourse(start, end, scaledHeight, scaledMortarThickness, dirX, dirY, perpX, perpY, color, mortarColor, texture, length, scale, brickRow);
    } else if (pattern === 'rowlock') {
        drawRowlockCourse(start, end, scaledHeight, scaledMortarThickness, dirX, dirY, perpX, perpY, color, mortarColor, texture, length, scale, brickRow);
    } else if (pattern === 'header') {
        drawHeaderCourse(start, end, scaledHeight, scaledMortarThickness, dirX, dirY, perpX, perpY, color, mortarColor, texture, length, scale, brickRow);
    } else {
        drawRunningBondFixed(start, end, scaledHeight, scaledMortarThickness, dirX, dirY, perpX, perpY, color, mortarColor, texture, length, scale, brickRow);
    }
    
    ctx.restore();
    
    // Draw selection outline if selected
    if (isSelected) {
        ctx.save();
        ctx.strokeStyle = '#ff6b35';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 3]);
        
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.lineTo(end.x + perpX * scaledHeight, end.y + perpY * scaledHeight);
        ctx.lineTo(start.x + perpX * scaledHeight, start.y + perpY * scaledHeight);
        ctx.closePath();
        ctx.stroke();
        
        // Draw resize handles
        ctx.setLineDash([]);
        ctx.fillStyle = '#ff6b35';
        [start, end].forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
}

// Fixed running bond - NO HORIZONTAL MORTAR
function drawRunningBondFixed(start, end, scaledHeight, scaledMortarThickness, dirX, dirY, perpX, perpY, color, mortarColor, texture, length, scale, brickRow) {
    const perspectiveCompression = (brickRow.perspectiveCompression || 0) / 100;
    const baseBrickWidth = scaledHeight * 2.5;
    
    // Draw solid mortar background FIRST - NO TRANSPARENCY
    ctx.fillStyle = getMortarColor(mortarColor, brickRow);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.lineTo(end.x + perpX * scaledHeight, end.y + perpY * scaledHeight);
    ctx.lineTo(start.x + perpX * scaledHeight, start.y + perpY * scaledHeight);
    ctx.closePath();
    ctx.fill();
    
    // Get actual brick color (custom or standard)
    let baseBrickColor;
    if (color === 'custom') {
        baseBrickColor = brickRow.customColor || customBrickColor;
    } else {
        baseBrickColor = brickStandardColors[color] || '#AD4F4F';
    }
    
   
    
    // Draw bricks ON TOP of mortar background with gradual compression
let currentPosition = 0;
let brickIndex = 0;
while (currentPosition < length && brickIndex < 200) { // Safety limit
    // Calculate compression based on position along the brick row
    const normalizedPosition = currentPosition / length;
    const compressionFactor = 1 + (perspectiveCompression * (1 - normalizedPosition));
    const compressedBrickWidth = baseBrickWidth * compressionFactor;
    
    const brickStart = currentPosition;
    const brickEnd = Math.min(currentPosition + compressedBrickWidth - scaledMortarThickness, length);
        
        if (brickEnd > brickStart) {
            let brickFillColor = baseBrickColor;
            if (texture === 'textured') {
                const variation = Math.random() * 0.2 - 0.1;
                const rgb = hexToRgb(baseBrickColor);
                if (rgb) {
                    brickFillColor = `rgb(${Math.max(0, Math.min(255, rgb.r + variation * 50))}, 
                                          ${Math.max(0, Math.min(255, rgb.g + variation * 50))}, 
                                          ${Math.max(0, Math.min(255, rgb.b + variation * 50))})`;
                }
            }
            
            // Enhanced brick drawing with texture support
            const brickStartX = start.x + dirX * brickStart;
            const brickStartY = start.y + dirY * brickStart;
            const brickEndX = start.x + dirX * brickEnd;
            const brickEndY = start.y + dirY * brickEnd;
            
            // Create the brick path
            ctx.beginPath();
            ctx.moveTo(brickStartX, brickStartY);
            ctx.lineTo(brickEndX, brickEndY);
            ctx.lineTo(brickEndX + perpX * scaledHeight, brickEndY + perpY * scaledHeight);
            ctx.lineTo(brickStartX + perpX * scaledHeight, brickStartY + perpY * scaledHeight);
            ctx.closePath();
            
            // Check if we have a texture to apply
            const brickTexture = brickRow.texture || texture;
            const textureIntensity = brickRow.textureIntensity || 1;
            
           if (brickTexture && brickTexture !== 'smooth' && loadedTextures[brickTexture]) {
    // Fill with base color first
    ctx.fillStyle = brickFillColor;
    ctx.fill();
    
    // Get all slider values
    const textureIntensity = (brickRow.textureIntensity !== undefined) ? brickRow.textureIntensity : 1;
    const textureScale = (brickRow.textureScale !== undefined) ? brickRow.textureScale : 100;
    const textureContrast = (brickRow.textureContrast !== undefined) ? brickRow.textureContrast : 1;
    
    // Only apply texture if intensity > 0
    if (textureIntensity > 0) {
        ctx.save();
        
        // Clip to brick shape
        ctx.clip();
        
        // Use normal blend mode with very low opacity to preserve base color
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = textureIntensity * 0.3; // 50% more intensity (0.15 * 1.5)
        
        // Apply contrast filter if different from 100%
        if (textureContrast !== 1) {
            ctx.filter = `contrast(${Math.round(textureContrast * 150)}%)`;  // 50% more contrast
        }
        
        // Simple scaling without complex patterns
        if (textureScale !== 100) {
            const scale = (textureScale / 100) * 0.5; // 50% more refined scaling
            ctx.scale(scale, scale);
            const pattern = ctx.createPattern(loadedTextures[brickTexture], 'repeat');
            ctx.fillStyle = pattern;
            ctx.fill();
        } else {
            const pattern = ctx.createPattern(loadedTextures[brickTexture], 'repeat');
            ctx.fillStyle = pattern;
            ctx.fill();
        }
        
        ctx.restore();
    }
} else {
    // No texture, just use solid color
    ctx.fillStyle = brickFillColor;
    ctx.fill();
}
            // Add texture effects
            if (texture === 'wired') {
                const midX = (brickStartX + brickEndX) / 2 + perpX * scaledHeight / 2;
                const midY = (brickStartY + brickEndY) / 2 + perpY * scaledHeight / 2;
                ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(midX - dirX * (brickEnd - brickStart) / 2, midY - dirY * (brickEnd - brickStart) / 2);
                ctx.lineTo(midX + dirX * (brickEnd - brickStart) / 2, midY + dirY * (brickEnd - brickStart) / 2);
                ctx.stroke();
            }
        }
    
    // Move to next brick position
    currentPosition += compressedBrickWidth;
    brickIndex++;
}
}
// Soldier course pattern (vertical bricks)
function drawSoldierCourse(start, end, scaledHeight, scaledMortarThickness, dirX, dirY, perpX, perpY, color, mortarColor, texture, length, scale, brickRow) {
    // FIXED: Keep within original bounds - use scaledHeight instead of extending
    const brickWidth = scaledHeight * 0.4;  // Narrow width for vertical orientation
    
    // Draw solid mortar background FIRST - STAY WITHIN BOUNDS
    ctx.fillStyle = getMortarColor(mortarColor, brickRow);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.lineTo(end.x + perpX * scaledHeight, end.y + perpY * scaledHeight);  // Use scaledHeight, not brickHeight
    ctx.lineTo(start.x + perpX * scaledHeight, start.y + perpY * scaledHeight);
    ctx.closePath();
    ctx.fill();
    
    // Get actual brick color
    let baseBrickColor;
    if (color === 'custom') {
        baseBrickColor = brickRow.customColor || customBrickColor;
    } else {
        baseBrickColor = brickStandardColors[color] || '#AD4F4F';
    }
    
    const numBricks = Math.ceil(length / brickWidth);
    
    // Draw vertical bricks WITHIN the bounds
    for (let i = 0; i < numBricks; i++) {
        const brickStart = i * brickWidth;
        const brickEnd = Math.min((i + 1) * brickWidth - scaledMortarThickness, length);
        
        if (brickEnd > brickStart) {
            ctx.fillStyle = baseBrickColor;
            const brickStartX = start.x + dirX * brickStart;
            const brickStartY = start.y + dirY * brickStart;
            const brickEndX = start.x + dirX * brickEnd;
            const brickEndY = start.y + dirY * brickEnd;
            
            // Draw vertical brick - STAY WITHIN scaledHeight bounds
            ctx.beginPath();
            ctx.moveTo(brickStartX, brickStartY);
            ctx.lineTo(brickEndX, brickEndY);
            ctx.lineTo(brickEndX + perpX * scaledHeight, brickEndY + perpY * scaledHeight);  // Use scaledHeight
            ctx.lineTo(brickStartX + perpX * scaledHeight, brickStartY + perpY * scaledHeight);
            ctx.closePath();
            ctx.fill();
        }
    }
}

// Rowlock course pattern (bricks on edge)
function drawRowlockCourse(start, end, scaledHeight, scaledMortarThickness, dirX, dirY, perpX, perpY, color, mortarColor, texture, length, scale, brickRow) {
    const brickWidth = scaledHeight * 1.2; // Wider for rowlock
    
    // Draw solid mortar background FIRST
    ctx.fillStyle = getMortarColor(mortarColor, brickRow);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.lineTo(end.x + perpX * scaledHeight, end.y + perpY * scaledHeight);
    ctx.lineTo(start.x + perpX * scaledHeight, start.y + perpY * scaledHeight);
    ctx.closePath();
    ctx.fill();
    
    // Get actual brick color
    let baseBrickColor;
    if (color === 'custom') {
        baseBrickColor = brickRow.customColor || customBrickColor;
    } else {
        baseBrickColor = brickStandardColors[color] || '#AD4F4F';
    }
    
    const numBricks = Math.ceil(length / brickWidth);
    
    for (let i = 0; i < numBricks; i++) {
        const brickStart = i * brickWidth;
        const brickEnd = Math.min((i + 1) * brickWidth - scaledMortarThickness, length);
        
        if (brickEnd > brickStart) {
            ctx.fillStyle = baseBrickColor;
            const brickStartX = start.x + dirX * brickStart;
            const brickStartY = start.y + dirY * brickStart;
            const brickEndX = start.x + dirX * brickEnd;
            const brickEndY = start.y + dirY * brickEnd;
            
            ctx.beginPath();
            ctx.moveTo(brickStartX, brickStartY);
            ctx.lineTo(brickEndX, brickEndY);
            ctx.lineTo(brickEndX + perpX * scaledHeight, brickEndY + perpY * scaledHeight);
            ctx.lineTo(brickStartX + perpX * scaledHeight, brickStartY + perpY * scaledHeight);
            ctx.closePath();
            ctx.fill();
        }
    }
}

// Header course pattern (short end showing)
function drawHeaderCourse(start, end, scaledHeight, scaledMortarThickness, dirX, dirY, perpX, perpY, color, mortarColor, texture, length, scale, brickRow) {
    const brickWidth = scaledHeight * 0.8; // Short header bricks
    
    // Draw solid mortar background FIRST
   ctx.fillStyle = getMortarColor(mortarColor, brickRow);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.lineTo(end.x + perpX * scaledHeight, end.y + perpY * scaledHeight);
    ctx.lineTo(start.x + perpX * scaledHeight, start.y + perpY * scaledHeight);
    ctx.closePath();
    ctx.fill();
    
    // Get actual brick color
    let baseBrickColor;
    if (color === 'custom') {
        baseBrickColor = brickRow.customColor || customBrickColor;
    } else {
        baseBrickColor = brickStandardColors[color] || '#AD4F4F';
    }
    
    const numBricks = Math.ceil(length / brickWidth);
    
    for (let i = 0; i < numBricks; i++) {
        const brickStart = i * brickWidth;
        const brickEnd = Math.min((i + 1) * brickWidth - scaledMortarThickness, length);
        
        if (brickEnd > brickStart) {
            ctx.fillStyle = baseBrickColor;
            const brickStartX = start.x + dirX * brickStart;
            const brickStartY = start.y + dirY * brickStart;
            const brickEndX = start.x + dirX * brickEnd;
            const brickEndY = start.y + dirY * brickEnd;
            
            ctx.beginPath();
            ctx.moveTo(brickStartX, brickStartY);
            ctx.lineTo(brickEndX, brickEndY);
            ctx.lineTo(brickEndX + perpX * scaledHeight, brickEndY + perpY * scaledHeight);
            ctx.lineTo(brickStartX + perpX * scaledHeight, brickStartY + perpY * scaledHeight);
            ctx.closePath();
            ctx.fill();
        }
    }
}
// --- Brick Row Drawing Functions ---
function drawBrickRow(brickRow, isSelected) {
    if (!brickRow || !brickRow.points || brickRow.points.length < 2) return;
    
    const start = brickRow.points[0];
    const end = brickRow.points[1];
    const height = brickRow.height || brickRowHeight;
    const color = brickRow.color || currentBrickColor;
    const texture = brickRow.texture || currentBrickTexture;
    const mortarColor = brickRow.mortarColor || currentBrickMortarColor;
    const mortarThickness = brickRow.mortarThickness || brickMortarThickness;
    const scale = scaleToBrickSize(brickRow.scale || GLOBAL_STONE_SCALE);
    const brightness = (brickRow.brightness || 100) / 100;
    const contrast = (brickRow.contrast || 100) / 100;
    const shadow = (brickRow.shadow || 0) / 100;
    const shadowOffset = brickRow.shadowOffset || 0;
    const shadowBlur = brickRow.shadowBlur || 0;
    
    ctx.save();
    
    // Apply filters
    if (brightness !== 1 || contrast !== 1) {
        ctx.filter = `brightness(${brightness}) contrast(${contrast})`;
    }
    
    // Apply shadow if enabled
    if (shadow > 0) {
        ctx.shadowColor = `rgba(0, 0, 0, ${shadow})`;
        ctx.shadowOffsetX = shadowOffset;
        ctx.shadowOffsetY = shadowOffset;
        ctx.shadowBlur = shadowBlur;
    }
    
    // Calculate direction and perpendicular
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const dirX = dx / length;
    const dirY = dy / length;
    const perpX = -dirY;
    const perpY = dirX;
    
    const scaledHeight = Math.round(height * scale);
   const scaledMortarThickness = Math.max(1, Math.round(mortarThickness * scale));
    const brickWidth = scaledHeight * 2.5;
    
    // Draw mortar background
    ctx.fillStyle = mortarColor;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.lineTo(end.x + perpX * scaledHeight, end.y + perpY * scaledHeight);
    ctx.lineTo(start.x + perpX * scaledHeight, start.y + perpY * scaledHeight);
    ctx.closePath();
    ctx.fill();
    
    // Draw individual bricks
    const baseBrickColor = brickStandardColors[color] || '#AD4F4F';
    const numBricks = Math.ceil(length / brickWidth);
    
    for (let i = 0; i < numBricks; i++) {
        const brickStart = i * brickWidth;
        const brickEnd = Math.min((i + 1) * brickWidth - scaledMortarThickness, length);
        
        if (brickEnd > brickStart) {
            const brickStartX = start.x + dirX * brickStart + perpX * scaledMortarThickness/2;
            const brickStartY = start.y + dirY * brickStart + perpY * scaledMortarThickness/2;
            const brickEndX = start.x + dirX * brickEnd + perpX * scaledMortarThickness/2;
            const brickEndY = start.y + dirY * brickEnd + perpY * scaledMortarThickness/2;
            
            let brickFillColor = baseBrickColor;
            if (texture === 'textured') {
                const variation = Math.random() * 0.2 - 0.1;
                const rgb = hexToRgb(baseBrickColor);
                if (rgb) {
                    brickFillColor = `rgb(${Math.max(0, Math.min(255, rgb.r + variation * 50))}, 
                                          ${Math.max(0, Math.min(255, rgb.g + variation * 50))}, 
                                          ${Math.max(0, Math.min(255, rgb.b + variation * 50))})`;
                }
            }
            
            ctx.fillStyle = brickFillColor;
            ctx.beginPath();
            ctx.moveTo(brickStartX, brickStartY);
            ctx.lineTo(brickEndX, brickEndY);
            ctx.lineTo(brickEndX + perpX * (scaledHeight - scaledMortarThickness), 
                      brickEndY + perpY * (scaledHeight - scaledMortarThickness));
            ctx.lineTo(brickStartX + perpX * (scaledHeight - scaledMortarThickness), 
                      brickStartY + perpY * (scaledHeight - scaledMortarThickness));
            ctx.closePath();
            ctx.fill();
            
            // Add texture effects
            if (texture === 'wired') {
                const midX = (brickStartX + brickEndX) / 2 + perpX * (scaledHeight - scaledMortarThickness) / 2;
                const midY = (brickStartY + brickEndY) / 2 + perpY * (scaledHeight - scaledMortarThickness) / 2;
                ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(midX - dirX * (brickEnd - brickStart) / 2, midY - dirY * (brickEnd - brickStart) / 2);
                ctx.lineTo(midX + dirX * (brickEnd - brickStart) / 2, midY + dirY * (brickEnd - brickStart) / 2);
                ctx.stroke();
            }
        }
    }
    
    ctx.restore();
    
    // Draw selection outline if selected
    if (isSelected) {
        ctx.save();
        ctx.strokeStyle = '#ff6b35';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 3]);
        
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.lineTo(end.x + perpX * scaledHeight, end.y + perpY * scaledHeight);
        ctx.lineTo(start.x + perpX * scaledHeight, start.y + perpY * scaledHeight);
        ctx.closePath();
        ctx.stroke();
        
        // Draw resize handles
        ctx.setLineDash([]);
        ctx.fillStyle = '#ff6b35';
        [start, end].forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
}

function drawAreaOutline(points, isSelected, isCutout, isMultiSelected) {
    if (!points || points.length < 2) return;

    // Draw multi-select outline (orange) FIRST if multi-selected
    if (isMultiSelected) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }

        if (points.length > 2) {
            ctx.closePath();
        }

        // Orange dashed outline for multi-selected areas
        ctx.strokeStyle = '#ff6b35';
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw orange corner markers
        if (points.length > 2) {
            ctx.fillStyle = '#ff6b35';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;

            points.forEach((point) => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            });
        }
        ctx.restore();
    }

    // Only draw the regular selection outline if the area is selected
    if (isSelected) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }

        if (points.length > 2) {
            ctx.closePath();
        }

        // Set style for selected outline
        ctx.strokeStyle = isCutout ? '#9b59b6' : '#3498db'; // Purple for selected cutout, blue for selected area
        ctx.lineWidth = 3; // Line width for selected
        ctx.stroke();

        // Draw vertex dots for the selected area
        if (points.length > 2) { // No need to check isSelected again, already in the block
            ctx.fillStyle = isCutout ? '#9b59b6' : '#3498db';
            ctx.strokeStyle = '#fff'; // White border for dots for better visibility
            ctx.lineWidth = 2;     // Border width for dots

            points.forEach((point) => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke(); // Stroke the border of the dot
            });
        }
    }
    // If 'isSelected' is false, no outline or vertices will be drawn for this area.
}

// Helper functions
function getAreaBounds(points) {
    let minX = points[0].x, maxX = points[0].x;
    let minY = points[0].y, maxY = points[0].y;
    
    for (let i = 1; i < points.length; i++) {
        minX = Math.min(minX, points[i].x);
        maxX = Math.max(maxX, points[i].x);
        minY = Math.min(minY, points[i].y);
        maxY = Math.max(maxY, points[i].y);
    }
    
    return {
        minX, maxX, minY, maxY,
        width: maxX - minX,
        height: maxY - minY
    };
}

// ADD THIS ENTIRE FUNCTION HERE:
function simplifyPoints(points, tolerance = 5) {
    if (points.length <= 2) return points;
    
    // Douglas-Peucker algorithm for path simplification
    function getPerpendicularDistance(point, lineStart, lineEnd) {
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;
        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag > 0) {
            const u = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (mag * mag);
            const closestPoint = {
                x: lineStart.x + u * dx,
                y: lineStart.y + u * dy
            };
            return Math.sqrt(Math.pow(point.x - closestPoint.x, 2) + Math.pow(point.y - closestPoint.y, 2));
        }
        return Math.sqrt(Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2));
    }
    
    function douglasPeucker(points, tolerance) {
        if (points.length <= 2) return points;
        
        let maxDistance = 0;
        let index = 0;
        
        for (let i = 1; i < points.length - 1; i++) {
            const distance = getPerpendicularDistance(points[i], points[0], points[points.length - 1]);
            if (distance > maxDistance) {
                maxDistance = distance;
                index = i;
            }
        }
        
        if (maxDistance > tolerance) {
            const leftPoints = douglasPeucker(points.slice(0, index + 1), tolerance);
            const rightPoints = douglasPeucker(points.slice(index), tolerance);
            return [...leftPoints.slice(0, -1), ...rightPoints];
        } else {
            return [points[0], points[points.length - 1]];
        }
    }
    
    return douglasPeucker(points, tolerance);
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}


// Undo/Redo functions
function saveState() {
    const state = {
    areas: JSON.parse(JSON.stringify(areas)),
    sills: JSON.parse(JSON.stringify(sills)),
    brickRows: JSON.parse(JSON.stringify(brickRows)),
    depthEdges: JSON.parse(JSON.stringify(depthEdges)),
    decorations: JSON.parse(JSON.stringify(decorations)),
    accents: JSON.parse(JSON.stringify(accents))
};
    
    undoStack.push(state);
    if (undoStack.length > MAX_UNDO_STEPS) {
        undoStack.shift();
    }
    redoStack = [];
}

function undo() {
    if (undoStack.length === 0) return;
    
    const currentState = {
        areas: JSON.parse(JSON.stringify(areas)),
        sills: JSON.parse(JSON.stringify(sills)),
        brickRows: JSON.parse(JSON.stringify(brickRows)),
        depthEdges: JSON.parse(JSON.stringify(depthEdges)),
        decorations: JSON.parse(JSON.stringify(decorations))
    };
    redoStack.push(currentState);
    
    const prevState = undoStack.pop();
    areas = prevState.areas;
    sills = prevState.sills;
    brickRows = prevState.brickRows;
    depthEdges = prevState.depthEdges;
    decorations = prevState.decorations || [];
  accents = prevState.accents || [];
    
    selectedAreaIndex = -1;
    selectedSillIndex = -1;
    selectedBrickRowIndex = -1;
    selectedDepthEdgeIndex = -1;
    selectedDecorationIndex = -1;
    
    updateAreasList();
    updateSillsList();
    updateBrickRowsList();
    updateDecorationsList();
    updateDepthList();
    disableMainAreaControls();
    drawCanvas();
    showMessage('Undo completed');
}

function redo() {
    if (redoStack.length === 0) return;
    
    const currentState = {
        areas: JSON.parse(JSON.stringify(areas)),
        sills: JSON.parse(JSON.stringify(sills)),
        brickRows: JSON.parse(JSON.stringify(brickRows)),
        depthEdges: JSON.parse(JSON.stringify(depthEdges)),
        decorations: JSON.parse(JSON.stringify(decorations))
    };
    undoStack.push(currentState);
    
    const nextState = redoStack.pop();
    areas = nextState.areas;
    sills = nextState.sills;
    brickRows = nextState.brickRows;
    depthEdges = nextState.depthEdges;
    decorations = nextState.decorations || [];
  accents = nextState.accents || [];
    
    selectedAreaIndex = -1;
    selectedSillIndex = -1;
    selectedBrickRowIndex = -1;
    selectedDepthEdgeIndex = -1;
    selectedDecorationIndex = -1;
    
    updateAreasList();
    updateSillsList();
    updateBrickRowsList();
    updateDecorationsList();
    updateDepthList();
    disableMainAreaControls();
    drawCanvas();
    showMessage('Redo completed');
}

// Copy and Paste functions
function copySelectedElement() {
    if (selectedAreaIndex !== -1 && areas[selectedAreaIndex]) {
        clipboardData = {
            type: 'area',
            data: JSON.parse(JSON.stringify(areas[selectedAreaIndex]))
        };
        showMessage('Area copied to clipboard');
    } else if (selectedSillIndex !== -1 && sills[selectedSillIndex]) {
        clipboardData = {
            type: 'sill',
            data: JSON.parse(JSON.stringify(sills[selectedSillIndex]))
        };
        showMessage('Sill/Cap copied to clipboard');
    } else if (selectedBrickRowIndex !== -1 && brickRows[selectedBrickRowIndex]) {
        clipboardData = {
            type: 'brickRow',
            data: JSON.parse(JSON.stringify(brickRows[selectedBrickRowIndex]))
        };
        showMessage('Brick row copied to clipboard');
    } else if (selectedDepthEdgeIndex !== -1 && depthEdges[selectedDepthEdgeIndex]) {
        clipboardData = {
            type: 'depthEdge',
            data: JSON.parse(JSON.stringify(depthEdges[selectedDepthEdgeIndex]))
        };
        showMessage('Depth edge copied to clipboard');
    } else if (selectedDecorationIndex !== -1 && decorations[selectedDecorationIndex]) {
        clipboardData = {
            type: 'decoration',
            data: JSON.parse(JSON.stringify(decorations[selectedDecorationIndex]))
        };
        showMessage('Decoration copied to clipboard');
    } else if (selectedAccentIndex !== -1 && accents[selectedAccentIndex]) {
        clipboardData = {
            type: 'accent',
            data: JSON.parse(JSON.stringify(accents[selectedAccentIndex]))
        };
        showMessage('Strip Flashing copied to clipboard');
    } else {
        showMessage('No element selected to copy');
    }
}

function pasteElement() {
    if (!clipboardData) {
        showMessage('Nothing in clipboard to paste');
        return;
    }
    
    saveState();
    
    // Create a copy with new ID and slight offset
    const pastedData = JSON.parse(JSON.stringify(clipboardData.data));
    pastedData.id = Date.now();
    
    // Offset the pasted element by 20 pixels
    if (pastedData.points) {
        pastedData.points = pastedData.points.map(point => ({
            x: point.x + 20,
            y: point.y + 20
        }));
    } else if (pastedData.x !== undefined && pastedData.y !== undefined) {
        // For decorations
        pastedData.x += 20;
        pastedData.y += 20;
    }
    
    // Add to appropriate array and select it
    switch (clipboardData.type) {
        case 'area':
            // If it's a cutout, clear the parent reference
            if (pastedData.isCutout) {
                pastedData.parentId = null;
            }
            areas.push(pastedData);
            selectedAreaIndex = areas.length - 1;
            selectedSillIndex = -1;
            selectedBrickRowIndex = -1;
            selectedDepthEdgeIndex = -1;
            selectedDecorationIndex = -1;
            selectedAccentIndex = -1;
            updateAreasList();
            if (!pastedData.isCutout) {
                enableMainAreaControls(pastedData);
            }
            break;
            
        case 'sill':
            sills.push(pastedData);
            selectedSillIndex = sills.length - 1;
            selectedAreaIndex = -1;
            selectedBrickRowIndex = -1;
            selectedDepthEdgeIndex = -1;
            selectedDecorationIndex = -1;
            selectedAccentIndex = -1;
            updateSillsList();
            enableSillControls(pastedData);
            break;
            
        case 'brickRow':
            brickRows.push(pastedData);
            selectedBrickRowIndex = brickRows.length - 1;
            selectedAreaIndex = -1;
            selectedSillIndex = -1;
            selectedDepthEdgeIndex = -1;
            selectedDecorationIndex = -1;
            selectedAccentIndex = -1;
            updateBrickRowsList();
            enableBrickRowControls(pastedData);
            break;
            
        case 'depthEdge':
            depthEdges.push(pastedData);
            selectedDepthEdgeIndex = depthEdges.length - 1;
            selectedAreaIndex = -1;
            selectedSillIndex = -1;
            selectedBrickRowIndex = -1;
            selectedDecorationIndex = -1;
            selectedAccentIndex = -1;
            updateDepthList();
            enableDepthEdgeControls(pastedData);
            break;
            
        case 'decoration':
            decorations.push(pastedData);
            selectedDecorationIndex = decorations.length - 1;
            selectedAreaIndex = -1;
            selectedSillIndex = -1;
            selectedBrickRowIndex = -1;
            selectedDepthEdgeIndex = -1;
            selectedAccentIndex = -1;
            updateDecorationsList();
            enableDecorationControls(pastedData);
            break;
            
        case 'accent':
            accents.push(pastedData);
            selectedAccentIndex = accents.length - 1;
            selectedAreaIndex = -1;
            selectedSillIndex = -1;
            selectedBrickRowIndex = -1;
            selectedDepthEdgeIndex = -1;
            selectedDecorationIndex = -1;
            updateAccentsList();
            enableAccentControls(pastedData);
            break;
    }
    
    drawCanvas();
    showMessage(`${clipboardData.type.charAt(0).toUpperCase() + clipboardData.type.slice(1)} pasted`);
}

function deleteSelectedElement() {
    if (selectedAreaIndex !== -1 && areas[selectedAreaIndex]) {
        saveState();
        const areaToRemove = areas[selectedAreaIndex];
        areas.splice(selectedAreaIndex, 1);
        if (areaToRemove.isCutout && areaToRemove.parentId) {
            const parentArea = areas.find(a => a && a.id === areaToRemove.parentId);
            if (parentArea && parentArea.cutouts) {
                parentArea.cutouts = parentArea.cutouts.filter(id => id !== areaToRemove.id);
            }
        }
        selectedAreaIndex = -1;
        updateAreasList();
        disableMainAreaControls();
        drawCanvas();
        showMessage('Area deleted');
    } else if (selectedSillIndex !== -1 && sills[selectedSillIndex]) {
        saveState();
        sills.splice(selectedSillIndex, 1);
        selectedSillIndex = -1;
        updateSillsList();
        disableMainAreaControls();
        drawCanvas();
        showMessage('Sill/Cap deleted');
    } else if (selectedBrickRowIndex !== -1 && brickRows[selectedBrickRowIndex]) {
        saveState();
        brickRows.splice(selectedBrickRowIndex, 1);
        selectedBrickRowIndex = -1;
        updateBrickRowsList();
        disableMainAreaControls();
        drawCanvas();
        showMessage('Brick row deleted');
    } else if (selectedDepthEdgeIndex !== -1 && depthEdges[selectedDepthEdgeIndex]) {
        saveState();
        depthEdges.splice(selectedDepthEdgeIndex, 1);
        selectedDepthEdgeIndex = -1;
        updateDepthList();
        disableMainAreaControls();
        drawCanvas();
        showMessage('Depth edge deleted');
    } else if (selectedDecorationIndex !== -1 && decorations[selectedDecorationIndex]) {
        saveState();
        decorations.splice(selectedDecorationIndex, 1);
        selectedDecorationIndex = -1;
        updateDecorationsList();
        disableMainAreaControls();
        drawCanvas();
        showMessage('Decoration deleted');
    } else if (selectedAccentIndex !== -1 && accents[selectedAccentIndex]) {
        saveState();
        accents.splice(selectedAccentIndex, 1);
        selectedAccentIndex = -1;
        updateAccentsList();
        disableMainAreaControls();
        drawCanvas();
        showMessage('Strip Flashing deleted');
    } else {
        showMessage('No element selected to delete');
    }
}

// REPLACE your existing loadHouseImage function with this:

function loadHouseImage(src) {
    console.log("loadHouseImage called with src:", src);
    
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f0f0f0';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Loading image...', canvas.width / 2, canvas.height / 2);
    }
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = function() {
        console.log("House image SUCCESSFULLY LOADED:", src);
        console.log("Image dimensions:", img.naturalWidth, "x", img.naturalHeight);
        currentImage = img;
        
        // Calculate how image fits on canvas - this is critical for coordinate mapping
        const canvasAspect = canvas.width / canvas.height;
        const imageAspect = img.naturalWidth / img.naturalHeight;
        
        // Calculate the scale and position (this will be used in drawCanvas)
        const scaleX = canvas.width / img.naturalWidth;
        const scaleY = canvas.height / img.naturalHeight;
        const scale = Math.min(scaleX, scaleY); // Fit entire image
        
        const drawWidth = img.naturalWidth * scale;
        const drawHeight = img.naturalHeight * scale;
        const drawX = (canvas.width - drawWidth) / 2;
        const drawY = (canvas.height - drawHeight) / 2;
        
        // Store this info globally for coordinate calculations
        imageScale = scale;
        imagePosition = {
            x: drawX,
            y: drawY,
            width: drawWidth,
            height: drawHeight
        };
        
        // Store original image dimensions for reference
        originalImageDimensions = {
            width: img.naturalWidth,
            height: img.naturalHeight
        };
        
        console.log("Image positioning calculated:", {
            scale: imageScale,
            position: imagePosition,
            canvasSize: { width: canvas.width, height: canvas.height },
            imageSize: { width: img.naturalWidth, height: img.naturalHeight }
        });
        
        adjustCanvasForImage(img);
        drawCanvas();
    };
    
    img.onerror = function(e) {
        console.error("Error loading house image:", src, e);
        currentImage = null; 
        imageScale = 1;
        imagePosition = { x: 0, y: 0, width: canvas.width, height: canvas.height };
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#cc0000';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Error: Could not load house image', canvas.width / 2, canvas.height / 2 - 10);
            ctx.fillStyle = '#666';
            ctx.font = '12px Arial';
            ctx.fillText('Try selecting a different house or uploading your own', canvas.width / 2, canvas.height / 2 + 10);
        }
    };
    
    setTimeout(() => {
        if (!img.complete) {
            console.warn("Image loading timeout for:", src);
            img.onerror(new Error("Timeout"));
        }
    }, 10000);
    
    img.src = src;
}

function adjustCanvasForImage(img) {
    if (!canvas || !img || !(img.naturalWidth || img.width) || !(img.naturalHeight || img.height)) {
    if (canvas) {
        canvas.width = CANVAS_ORIENTATION === 'portrait' ? 960 : 1600;  // ✅ Correct
        canvas.height = CANVAS_ORIENTATION === 'portrait' ? 1600 : 960;  // ✅ Correct
    }
    if (drawingCanvas) {
        drawingCanvas.width = CANVAS_ORIENTATION === 'portrait' ? 960 : 1600;  // ✅ Correct
        drawingCanvas.height = CANVAS_ORIENTATION === 'portrait' ? 1600 : 960;  // ✅ Correct
    }
    return;
}
    const natWidth = img.naturalWidth || img.width;
    const natHeight = img.naturalHeight || img.height;
    if (natWidth === 0 || natHeight === 0) {
    canvas.width = CANVAS_ORIENTATION === 'portrait' ? 960 : 1600;  // ✅ Update this
    canvas.height = CANVAS_ORIENTATION === 'portrait' ? 1600 : 960;  // ✅ Update this
    drawingCanvas.width = CANVAS_ORIENTATION === 'portrait' ? 960 : 1600;  // ✅ Update this
    drawingCanvas.height = CANVAS_ORIENTATION === 'portrait' ? 1600 : 960;  // ✅ Update this
    return;
}
    
    // Keep canvas size consistent but adjust drawing to fit image
    const MAX_CANVAS_WIDTH = CANVAS_ORIENTATION === 'portrait' ? 960 : 1600; 
    const MAX_CANVAS_HEIGHT = CANVAS_ORIENTATION === 'portrait' ? 1600 : 960;
    
    // Always maintain the same canvas size to prevent layout issues
    canvas.width = MAX_CANVAS_WIDTH;
    canvas.height = MAX_CANVAS_HEIGHT;
    
    // Sync drawing canvas size
    drawingCanvas.width = MAX_CANVAS_WIDTH;
    drawingCanvas.height = MAX_CANVAS_HEIGHT;
    
    // Remove any inline styles that might interfere with CSS
    canvas.style.width = '';
    canvas.style.height = '';
    drawingCanvas.style.width = '';
    drawingCanvas.style.height = '';
    
    // Let CSS handle the responsive sizing
    canvas.style.maxWidth = '100%';
    canvas.style.maxHeight = '100%';
    canvas.style.display = 'block';
    drawingCanvas.style.maxWidth = '100%';
    drawingCanvas.style.maxHeight = '100%';
    drawingCanvas.style.display = 'block';
}

// Thumbnail creation functions
function createMaterialThumbnail(imgSrc, name, type) {
    const thumbnail = document.createElement('div');
    thumbnail.className = 'material-item';
    thumbnail.dataset.img = imgSrc;
    thumbnail.dataset.name = name;
    thumbnail.dataset.type = type;
    
    const img = document.createElement('img');
    // LAZY LOADING: Use data-src instead of src
    img.setAttribute('data-src', imgSrc);
    img.className = 'lazy-load';
    img.alt = name;
    // Placeholder while lazy loading
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23e0e0e0" width="100" height="100"/%3E%3C/svg%3E';
    
    const span = document.createElement('span');
    span.textContent = name;
    
    thumbnail.appendChild(img);
    thumbnail.appendChild(span);
    
    thumbnail.addEventListener('click', function() {
    // Load full-resolution image for canvas if not already loaded
    if (type === 'decor') {
        if (!decorationImages[imgSrc]) {
            const fullImg = new Image();
            fullImg.crossOrigin = "anonymous";
            fullImg.onload = function() {
                decorationImages[imgSrc] = fullImg;
                console.log('✅ Loaded full-res decoration image:', name);
            };
            fullImg.src = imgSrc;
        }
        
        document.querySelectorAll('.material-item[data-type="decor"]').forEach(i => i.classList.remove('selected'));
        this.classList.add('selected');
        currentDecoration = imgSrc;
        isAddingDecoration = true; // Auto-enter decoration placing mode
        isInDrawingMode = true;
        canvas.style.cursor = 'copy';
        // Clear all other selections
        selectedAreaIndex = -1;
        selectedDepthEdgeIndex = -1;
        selectedSillIndex = -1;
        selectedBrickRowIndex = -1;
        selectedDecorationIndex = -1;
        updateAreasList();
        updateDepthList();
        updateSillsList();
        updateBrickRowsList();
        updateDecorationsList();
        disableMainAreaControls();
        showMessage('Click on canvas to place decoration.');
    } else {
        // Load full-res image for canvas if not already loaded
        if (!stoneImages[imgSrc]) {
            const fullImg = new Image();
            fullImg.crossOrigin = "anonymous";
            fullImg.onload = function() {
                stoneImages[imgSrc] = fullImg;
                console.log('✅ Loaded full-res image for canvas:', name);
            };
            fullImg.src = imgSrc;
        }
        
        console.log('Stone clicked:', name);
console.log('Material panel before:', document.querySelector('.material-selection-panel'));

document.querySelectorAll('.material-item').forEach(i => {
    if (i.dataset.type !== 'decor') {
        i.classList.remove('selected');
    }
});
this.classList.add('selected');
currentStone = imgSrc;

console.log('Selected area index:', selectedAreaIndex);
console.log('Areas array:', areas);

if (selectedAreaIndex !== -1 && areas[selectedAreaIndex] && !areas[selectedAreaIndex].isCutout) {
    // NEW: Only update multi-selected areas
    const areasToUpdate = [];
    
    // Check if there are any multi-selected areas
    const multiSelectedAreas = areas.filter(a => a && a.multiSelected && !a.isCutout);
    
    if (multiSelectedAreas.length > 0) {
        // Update only the multi-selected areas
        areas.forEach((area, index) => {
            if (area && area.multiSelected && !area.isCutout) {
                areasToUpdate.push(index);
            }
        });
    } else {
        // No multi-selection: just update the currently selected area
        areasToUpdate.push(selectedAreaIndex);
    }
    
    // Update all targeted areas
    areasToUpdate.forEach(areaIndex => {
        const area = areas[areaIndex];
        area.stone = currentStone;
        
        // Set appropriate texture mode based on type
        if (type === 'full-brick' || type === 'thin-brick') {
            area.textureMode = 'stone_linear';
            area.materialType = type;
            area.pattern = currentBrickPattern || 'running';
            area.mortarColor = currentBrickMortarColor || '#696969';
        } else if (type === 'stone' || type === 'stone-concrete-surfaces' || type === 'wood-surfaces') {
            area.textureMode = 'stone_linear';
        }
        
        // Apply remembered scale for this stone type
        if (stoneScaleMemory[currentStone]) {
            const rememberedScale = stoneScaleMemory[currentStone];
            area.scale = rememberedScale;
            
            // Update UI slider to show remembered scale only for selected area
            if (areaIndex === selectedAreaIndex) {
                const scaleSlider = document.getElementById('scale-slider');
                const scaleValue = document.getElementById('scale-value');
                if (scaleSlider && scaleValue) {
                    scaleSlider.value = rememberedScale;
                    scaleValue.textContent = rememberedScale + '%';
                }
                console.log(`Applied remembered scale for stone: ${currentStone} = ${rememberedScale}%`);
            }
        }
    });
    
    // Clear stone patterns to force regeneration
    stonePatterns = {};
    
    // Show message about how many areas were updated
    if (areasToUpdate.length > 1) {
        showMessage(`${name} applied to ${areasToUpdate.length} selected areas.`);
    } else {
        showMessage(name + ' applied to selected area.');
    }
    
    drawCanvas();

// AUTO-HIDE MATERIAL PANEL WHEN STONE IS SELECTED FOR CLEAR CANVAS VIEW
const materialPanel = document.querySelector('.material-selection-panel');
if (materialPanel) {
    materialPanel.classList.remove('active');
    console.log('Material panel hidden for clear canvas view');
}

// Also remove active state from all tabs
document.querySelectorAll('.material-tab').forEach(tab => tab.classList.remove('active'));
            } else if (selectedAreaIndex === -1 && selectedDepthEdgeIndex === -1 && selectedSillIndex === -1 && selectedBrickRowIndex === -1) {
                showMessage('Please select an area first.');
            }
            
            // Keep panel open after selection - remove auto-hide
            // setTimeout(autoHideMaterialPanel, 1000); // Commented out to keep panel open
        }
    });
    
    return thumbnail;
}

// ============================================
// LAZY LOADING SYSTEM
// ============================================
const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.getAttribute('data-src');
            
            if (src && !img.classList.contains('loaded')) {
                img.classList.add('loading');
                img.src = src;
                
                img.onload = function() {
                    img.classList.remove('loading');
                    img.classList.add('loaded');
                };
                
                img.onerror = function() {
                    img.classList.remove('loading');
                    this.src = 'https://placehold.co/60x60/eeeeee/999999?text=' + encodeURIComponent(img.alt);
                };
                
                observer.unobserve(img);
            }
        }
    });
}, {
    rootMargin: '100px',
    threshold: 0.01
});

// Initialize lazy loading for all material thumbnails
function initLazyLoading() {
    const lazyImages = document.querySelectorAll('img.lazy-load');
    lazyImages.forEach(img => imageObserver.observe(img));
    console.log(`✅ Lazy loading initialized for ${lazyImages.length} images`);
}

// Also make sure the stone tab is active
const stoneTab = document.querySelector('.material-tab[data-category="stone"]');
if (stoneTab) {
    // Remove active from all tabs
    document.querySelectorAll('.material-tab').forEach(tab => tab.classList.remove('active'));
    // Activate stone tab
    stoneTab.classList.add('active');
    console.log('Stone tab activated');
}

// ADD THIS NEW DEBUG CODE RIGHT HERE:
const materialPanel = document.querySelector('.material-selection-panel');
if (materialPanel) {
    console.log('Panel computed style:', window.getComputedStyle(materialPanel).display);
    console.log('Panel visible:', materialPanel.offsetHeight > 0);
    console.log('Panel classes:', materialPanel.className);
    
    // FORCE the panel to be visible
    materialPanel.style.display = 'block';
    materialPanel.style.visibility = 'visible';
    materialPanel.style.opacity = '1';
    console.log('Panel forced visible');
}

// Initialize scroll indicator for stone grid
addScrollIndicator();
console.log('Scroll indicator initialized');

// FORCE PANEL SCROLLING - Only when panel is active
if (materialPanel) {
    // Function to apply scrolling settings
    function applyScrollSettings() {
        if (materialPanel.classList.contains('active')) {
            materialPanel.style.height = '600px';
            materialPanel.style.overflowY = 'auto';
            materialPanel.style.maxHeight = '600px';
        } else {
            materialPanel.style.height = '';
            materialPanel.style.overflowY = '';
            materialPanel.style.maxHeight = '';
        }
    }
    
    // Apply initially
    applyScrollSettings();
    
    // Watch for class changes
    const observer = new MutationObserver(applyScrollSettings);
    observer.observe(materialPanel, { attributes: true, attributeFilter: ['class'] });
    
    console.log('Panel scrolling configured with auto-collapse support');
}
if (materialPanel) {
    materialPanel.style.height = '600px';
    materialPanel.style.overflowY = 'auto';
    materialPanel.style.maxHeight = '600px';
    console.log('Panel scrolling forced via JavaScript');
}


// --- Main Drawing Function - FIXED ---
function drawCanvas(hideOutlines = false) {
    if (!ctx || !canvas) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
     // Draw background image if exists
if (currentImage) {
    // Always fit the entire image with letterboxing if needed
    const imageWidth = currentImage.naturalWidth;
    const imageHeight = currentImage.naturalHeight;
    
    // Calculate scale to fit entire image
    const scaleX = canvas.width / imageWidth;
    const scaleY = canvas.height / imageHeight;
    const scale = Math.min(scaleX, scaleY); // Use smaller scale to fit entire image
    
    const drawWidth = imageWidth * scale;
    const drawHeight = imageHeight * scale;
    
    // Center the scaled image
    const drawX = (canvas.width - drawWidth) / 2;
    const drawY = (canvas.height - drawHeight) / 2;
    
    // CRITICAL FIX: Store the actual image bounds for coordinate calculation
    imageScale = scale;
    imagePosition = {
        x: drawX,
        y: drawY,
        width: drawWidth,
        height: drawHeight
    };
    
    // Fill background with gray (letterbox areas)
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw the image
    ctx.drawImage(currentImage, drawX, drawY, drawWidth, drawHeight);
}
    
    // Sort decorations by z-index and separate into behind and in front
    const sortedDecorations = [...decorations].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    const decorationsBehind = sortedDecorations.filter(d => (d.layer || 'front') === 'behind');
    const decorationsInFront = sortedDecorations.filter(d => (d.layer || 'front') === 'front');
    
    // Draw decorations behind areas - FIXED Z-INDEX
    decorationsBehind.forEach((decoration, index) => {
        const originalIndex = decorations.indexOf(decoration);
        drawDecoration(decoration, originalIndex === selectedDecorationIndex && !hideOutlines);
    });
// Draw accents behind areas
    const accentsBehind = accents.filter(accent => (accent.layer || 'front') === 'behind');
    accentsBehind.forEach((accent, index) => {
        const originalIndex = accents.indexOf(accent);
        drawAccent(accent, originalIndex === selectedAccentIndex && !hideOutlines);
    });    

    // Draw all areas with stone patterns (with proper cutout handling)
    areas.forEach((area, index) => {
        if (area && area.points && area.points.length >= 3 && !area.isCutout) {
            ctx.save();
            drawStoneInAreaWithCutouts(area, index === selectedAreaIndex && !hideOutlines);
            ctx.restore();
        }
    });
    
    // Draw depth edges AFTER areas to ensure visibility
    depthEdges.forEach((edge, index) => {
        if (edge) {
            drawDepthEdgeEffect(edge, index === selectedDepthEdgeIndex && !hideOutlines);
        }
    });
    
    // Draw sills
    sills.forEach((sill, index) => {
        if (sill) {
            drawSill(sill, index === selectedSillIndex && !hideOutlines);
        }
    });
    
    // Draw brick rows
    brickRows.forEach((brickRow, index) => {
        if (brickRow) {
            drawEnhancedBrickRow(brickRow, index === selectedBrickRowIndex && !hideOutlines);
        }
    });
    
    // Draw decorations in front of areas - FIXED Z-INDEX
    decorationsInFront.forEach((decoration, index) => {
        const originalIndex = decorations.indexOf(decoration);
        drawDecoration(decoration, originalIndex === selectedDecorationIndex && !hideOutlines);
    });

// Draw accents in front of areas
    const accentsInFront = accents.filter(accent => (accent.layer || 'front') === 'front');
    accentsInFront.forEach((accent, index) => {
        const originalIndex = accents.indexOf(accent);
        drawAccent(accent, originalIndex === selectedAccentIndex && !hideOutlines);
    });
 // Draw accents - DEBUG
// (Remove the old accents drawing code since we now draw them in layers)
    
    // Draw area outlines if not hiding
    if (!hideOutlines) {
        areas.forEach((area, index) => {
            if (area && area.points && area.points.length >= 2) {
                drawAreaOutline(area.points, index === selectedAreaIndex, area.isCutout, area.multiSelected);
            }
        });
        // Draw rectangle preview
if (isDrawingArea && areaDrawingMode === 'rectangle' && rectangleStartPoint && lastMousePosition) {
    ctx.save();
    ctx.strokeStyle = isSubtractMode ? '#ff4757' : '#2ed573';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);
    ctx.shadowColor = isSubtractMode ? '#ff4757' : '#2ed573';
    ctx.shadowBlur = 4;
    
    const minX = Math.min(rectangleStartPoint.x, lastMousePosition.x);
    const maxX = Math.max(rectangleStartPoint.x, lastMousePosition.x);
    const minY = Math.min(rectangleStartPoint.y, lastMousePosition.y);
    const maxY = Math.max(rectangleStartPoint.y, lastMousePosition.y);
    
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    
    ctx.restore();
}
        // Draw current drawing state - FIXED
        if (isDrawingArea && currentPoints.length > 0) {
            ctx.strokeStyle = isSubtractMode ? '#ff4757' : '#2ed573'; // Brighter colors
            ctx.lineWidth = 3; // Thicker lines
            ctx.setLineDash([8, 4]); // Longer dashes, shorter gaps
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // Add a subtle glow effect
            ctx.shadowColor = isSubtractMode ? '#ff4757' : '#2ed573';
            ctx.shadowBlur = 4;
            
            if (currentPoints.length === 1) {
                ctx.beginPath();
                ctx.arc(currentPoints[0].x, currentPoints[0].y, 6, 0, Math.PI * 2); // Larger dot
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
                for (let i = 1; i < currentPoints.length; i++) {
                    ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
                }
                
                if (lastMousePosition && currentPoints.length >= 1) {
                    ctx.lineTo(lastMousePosition.x, lastMousePosition.y);
                    if (currentPoints.length >= 3) {
                        ctx.lineTo(currentPoints[0].x, currentPoints[0].y);
                    }
                }
                ctx.stroke();
            }
            ctx.setLineDash([]);
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
        }
        
        // Draw other drawing states - FIXED DEPTH EDGE DRAWING
        if (isDrawingDepthEdge && currentDepthEdgePoints.length > 0) {
            ctx.strokeStyle = '#9b59b6';
            ctx.lineWidth = 4; // Thicker line
            ctx.lineCap = 'round';
            ctx.shadowColor = '#9b59b6';
            ctx.shadowBlur = 4;
            
            if (depthEdgeMode === 'line') {
                ctx.beginPath();
                if (currentDepthEdgePoints.length === 1) {
                    ctx.arc(currentDepthEdgePoints[0].x, currentDepthEdgePoints[0].y, 6, 0, Math.PI * 2);
                    ctx.stroke();
                }
                if (lastMousePosition && currentDepthEdgePoints.length === 1) {
                    ctx.beginPath();
                    ctx.moveTo(currentDepthEdgePoints[0].x, currentDepthEdgePoints[0].y);
                    ctx.lineTo(lastMousePosition.x, lastMousePosition.y);
                    ctx.stroke();
                }
            } else if (depthEdgeMode === 'area') {
                // Draw area polygon similar to regular areas
                ctx.setLineDash([8, 4]);
                if (currentDepthEdgePoints.length === 1) {
                    ctx.beginPath();
                    ctx.arc(currentDepthEdgePoints[0].x, currentDepthEdgePoints[0].y, 6, 0, Math.PI * 2);
                    ctx.stroke();
                } else {
                    ctx.beginPath();
                    ctx.moveTo(currentDepthEdgePoints[0].x, currentDepthEdgePoints[0].y);
                    for (let i = 1; i < currentDepthEdgePoints.length; i++) {
                        ctx.lineTo(currentDepthEdgePoints[i].x, currentDepthEdgePoints[i].y);
                    }
                    
                    if (lastMousePosition && currentDepthEdgePoints.length >= 1) {
                        ctx.lineTo(lastMousePosition.x, lastMousePosition.y);
                        if (currentDepthEdgePoints.length >= 3) {
                            ctx.lineTo(currentDepthEdgePoints[0].x, currentDepthEdgePoints[0].y);
                        }
                    }
                    ctx.stroke();
                }
                ctx.setLineDash([]);
            }
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
        }
        
        if (isDrawingSill && currentSillPoints.length > 0) {
            ctx.strokeStyle = '#ff6b35'; // Brighter orange
            ctx.lineWidth = 4; // Thicker line
            ctx.lineCap = 'round';
            ctx.shadowColor = '#ff6b35';
            ctx.shadowBlur = 4;
            
            ctx.beginPath();
            if (currentSillPoints.length === 1) {
                ctx.arc(currentSillPoints[0].x, currentSillPoints[0].y, 6, 0, Math.PI * 2); // Larger dot
                ctx.stroke();
            }
            if (lastMousePosition && currentSillPoints.length === 1) {
                ctx.beginPath();
                ctx.moveTo(currentSillPoints[0].x, currentSillPoints[0].y);
                ctx.lineTo(lastMousePosition.x, lastMousePosition.y);
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
        }
        
        if (isDrawingBrickRow && currentBrickRowPoints.length > 0) {
            ctx.strokeStyle = '#ff6b35'; // Brighter orange
            ctx.lineWidth = 4; // Thicker line
            ctx.lineCap = 'round';
            ctx.shadowColor = '#ff6b35';
            ctx.shadowBlur = 4;
            
            ctx.beginPath();
            if (currentBrickRowPoints.length === 1) {
                ctx.arc(currentBrickRowPoints[0].x, currentBrickRowPoints[0].y, 6, 0, Math.PI * 2); // Larger dot
                ctx.stroke();
            }
            if (lastMousePosition && currentBrickRowPoints.length === 1) {
                ctx.beginPath();
                ctx.moveTo(currentBrickRowPoints[0].x, currentBrickRowPoints[0].y);
                ctx.lineTo(lastMousePosition.x, lastMousePosition.y);
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
        }
      if (isDrawingAccent && currentAccentPoints.length > 0) {
            ctx.strokeStyle = '#e74c3c'; // Red color for accents
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.shadowColor = '#e74c3c';
            ctx.shadowBlur = 4;
            
            if (currentAccentType === 'strip-flashing') {
                // Line preview for strip flashing
                if (currentAccentPoints.length === 1) {
                    ctx.beginPath();
                    ctx.arc(currentAccentPoints[0].x, currentAccentPoints[0].y, 6, 0, Math.PI * 2);
                    ctx.stroke();
                }
                if (lastMousePosition && currentAccentPoints.length === 1) {
                    ctx.beginPath();
                    ctx.moveTo(currentAccentPoints[0].x, currentAccentPoints[0].y);
                    ctx.lineTo(lastMousePosition.x, lastMousePosition.y);
                    ctx.stroke();
                }
            } else if (currentAccentType === 'flat-cap') {
                // Area preview for flat cap
                ctx.setLineDash([8, 4]);
                if (currentAccentPoints.length === 1) {
                    ctx.beginPath();
                    ctx.arc(currentAccentPoints[0].x, currentAccentPoints[0].y, 6, 0, Math.PI * 2);
                    ctx.stroke();
                } else {
                    ctx.beginPath();
                    ctx.moveTo(currentAccentPoints[0].x, currentAccentPoints[0].y);
                    for (let i = 1; i < currentAccentPoints.length; i++) {
                        ctx.lineTo(currentAccentPoints[i].x, currentAccentPoints[i].y);
                    }
                    
                    if (lastMousePosition && currentAccentPoints.length >= 1) {
                        ctx.lineTo(lastMousePosition.x, lastMousePosition.y);
                        if (currentAccentPoints.length >= 3) {
                            ctx.lineTo(currentAccentPoints[0].x, currentAccentPoints[0].y);
                        }
                    }
                    ctx.stroke();
                }
                ctx.setLineDash([]);
            }
            
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
        }
    }
}


// New function to handle stone areas with proper cutout masking
function drawStoneInAreaWithCutouts(area, isSelected) {
    if (!area || !area.points || area.points.length < 3) return;
    
    // Find all cutouts that belong to this area
    const cutouts = areas.filter(cutoutArea => 
        cutoutArea && cutoutArea.isCutout && cutoutArea.parentId === area.id
    );
    
    ctx.save();
    
    // Create the main area path
    ctx.beginPath();
    ctx.moveTo(area.points[0].x, area.points[0].y);
    for (let i = 1; i < area.points.length; i++) {
        ctx.lineTo(area.points[i].x, area.points[i].y);
    }
    ctx.closePath();
    
    // Create a more reliable clipping mask
    const region = new Path2D();

    // Add the main area path
    region.moveTo(area.points[0].x, area.points[0].y);
    for (let i = 1; i < area.points.length; i++) {
        region.lineTo(area.points[i].x, area.points[i].y);
    }
    region.closePath();

    // Add cutout paths as holes (reverse winding order)
    cutouts.forEach(cutout => {
        if (cutout.points && cutout.points.length >= 3) {
            // Add cutout in reverse order to create a hole
            region.moveTo(cutout.points[0].x, cutout.points[0].y);
            for (let i = cutout.points.length - 1; i >= 1; i--) {
                region.lineTo(cutout.points[i].x, cutout.points[i].y);
            }
            region.closePath();
        }
    });

    // Apply the clipping mask
ctx.clip(region, 'evenodd');

const textureMode = area.textureMode || TEXTURE_MODE;

if (!area.stone && textureMode !== 'brick' && textureMode !== 'color_fill') {
    ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
    const bounds = getAreaBounds(area.points);
    ctx.fillRect(bounds.minX, bounds.minY, bounds.width, bounds.height);
    ctx.restore();
    return;
}

if (textureMode === 'color_fill') {
    // Simple color fill mode
    ctx.globalAlpha = area.fillOpacity || currentFillOpacity;
    ctx.fillStyle = area.fillColor || currentFillColor;
    ctx.fill();
    ctx.globalAlpha = 1.0; // Reset alpha
} else if (textureMode === 'brick') {
    drawBrickPattern(area);

} else {
    drawStonePattern(area, textureMode);
}

// Apply area-specific shadow overlay if set
const shadowEffect = (area.shadow || 0) / 100;
if (shadowEffect > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowEffect * 0.4})`;
    const bounds = getAreaBounds(area.points);
    ctx.fillRect(bounds.minX, bounds.minY, bounds.width, bounds.height);
}
    
    ctx.restore();
}

// Set global currentStone to first stone
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const firstStone = document.querySelector('.material-item[data-type="stone"]');
        if (firstStone) {
            currentStone = firstStone.dataset.img;
        }
    }, 100);
});

// List update functions - FIXED TO PREVENT FLICKERING
function updateAreasList() {
    const areasList = document.getElementById('areas-list');
    if (!areasList) return;
    
    // Always rebuild the list to avoid caching issues
    if (areas.length === 0) {
        areasList.innerHTML = '<div class="empty-state">No areas defined yet</div>';
        return;
    }
    
    areasList.innerHTML = '';
    areas.forEach((area, index) => {
        if (!area) return;
        
        const areaItem = document.createElement('div');
        areaItem.className = 'area-item';
        if (area.isCutout) areaItem.classList.add('cutout');
        if (index === selectedAreaIndex) areaItem.classList.add('selected');
        
        const areaName = document.createElement('span');
        areaName.className = 'area-name';
        areaName.textContent = area.name || `Area ${index + 1}`;
        
        const areaType = document.createElement('span');
        areaType.className = 'area-type';
        if (area.isCutout) areaType.classList.add('cutout');
        areaType.textContent = area.isCutout ? 'Cutout' : (area.textureMode || 'Area');
        
        areaItem.appendChild(areaName);
        areaItem.appendChild(areaType);
        
        areaItem.addEventListener('click', () => {
            selectedAreaIndex = index;
            selectedDepthEdgeIndex = -1;
            selectedSillIndex = -1;
            selectedBrickRowIndex = -1;
            selectedDecorationIndex = -1;
            selectedAccentIndex = -1; // Clear accent selection
            updateAreasList();
            updateDepthList();
            updateSillsList();
            updateBrickRowsList();
            updateDecorationsList();
            updateAccentsList(); // Update accent list
            if (!area.isCutout) {
                enableMainAreaControls(area);
            } else {
                disableMainAreaControls();
            }
            drawCanvas();
        });
        
        areasList.appendChild(areaItem);
    });
}

function updateDepthList() {
    const depthList = document.getElementById('depth-list');
    if (!depthList) return;
    
    if (depthEdges.length === 0) {
        depthList.style.display = 'none';
        return;
    }
    
    depthList.style.display = 'block';
    depthList.innerHTML = '';
    depthEdges.forEach((edge, index) => {
        if (!edge) return;
        
        const depthItem = document.createElement('div');
        depthItem.className = 'area-item depth';
        if (index === selectedDepthEdgeIndex) depthItem.classList.add('selected');
        
        const depthName = document.createElement('span');
        depthName.className = 'area-name';
        depthName.textContent = `Depth ${edge.mode === 'area' ? 'Area' : 'Edge'} ${index + 1}`;
        
        const depthType = document.createElement('span');
        depthType.className = 'area-type depth';
        depthType.textContent = edge.mode === 'area' ? 'Shadow Area' : 'Shadow Line';
        
        depthItem.appendChild(depthName);
        depthItem.appendChild(depthType);
        
        depthItem.addEventListener('click', () => {
            selectedDepthEdgeIndex = index;
           
            selectedSillIndex = -1;
            selectedBrickRowIndex = -1;
            selectedDecorationIndex = -1;
            updateAreasList();
            updateDepthList();
            updateSillsList();
            updateBrickRowsList();
            updateDecorationsList();
            enableDepthEdgeControls(edge);
            drawCanvas();
        });
        
        depthList.appendChild(depthItem);
    });
}

function updateSillsList() {
    const sillsList = document.getElementById('sills-list');
    if (!sillsList) return;
    
    if (sills.length === 0) {
        sillsList.style.display = 'none';
        return;
    }
    
    sillsList.style.display = 'block';
    sillsList.innerHTML = '';
    sills.forEach((sill, index) => {
        const sillItem = document.createElement('div');
        sillItem.className = 'area-item';
        if (index === selectedSillIndex) sillItem.classList.add('selected');
        
        const sillName = document.createElement('span');
        sillName.className = 'area-name';
        sillName.textContent = `${sill.type} ${index + 1}`;
        
        const sillType = document.createElement('span');
        sillType.className = 'area-type';
        sillType.textContent = sill.type;
        
        sillItem.appendChild(sillName);
        sillItem.appendChild(sillType);
        
        sillItem.addEventListener('click', () => {
            selectedSillIndex = index;
            selectedAreaIndex = -1;
            selectedDepthEdgeIndex = -1;
            selectedBrickRowIndex = -1;
            selectedDecorationIndex = -1;
            updateAreasList();
            updateDepthList();
            updateSillsList();
            updateBrickRowsList();
            updateDecorationsList();
            enableSillControls(sill);
            drawCanvas();
        });
        
        sillsList.appendChild(sillItem);
    });
}

function updateBrickRowsList() {
    const brickRowsList = document.getElementById('brick-rows-list');
    if (!brickRowsList) return;
    
    if (brickRows.length === 0) {
        brickRowsList.style.display = 'none';
        return;
    }
    
    brickRowsList.style.display = 'block';
    brickRowsList.innerHTML = '';
    brickRows.forEach((brickRow, index) => {
        const brickRowItem = document.createElement('div');
        brickRowItem.className = 'area-item';
        if (index === selectedBrickRowIndex) brickRowItem.classList.add('selected');
        
        const brickRowName = document.createElement('span');
        brickRowName.className = 'area-name';
        brickRowName.textContent = `Brick Row ${index + 1}`;
        
        const brickRowType = document.createElement('span');
        brickRowType.className = 'area-type';
        brickRowType.textContent = 'Row';
        
        brickRowItem.appendChild(brickRowName);
        brickRowItem.appendChild(brickRowType);
        
        brickRowItem.addEventListener('click', () => {
            selectedBrickRowIndex = index;
            selectedAreaIndex = -1;
            selectedDepthEdgeIndex = -1;
            selectedSillIndex = -1;
            selectedDecorationIndex = -1;
            updateAreasList();
            updateDepthList();
            updateSillsList();
            updateBrickRowsList();
            updateDecorationsList();
            enableBrickRowControls(brickRow);
            drawCanvas();
        });
        
        brickRowsList.appendChild(brickRowItem);
    });
}

function updateDecorationsList() {
    const decorationsList = document.getElementById('decorations-list');
    if (!decorationsList) return;
    
    if (decorations.length === 0) {
        decorationsList.style.display = 'none';
        return;
    }
    
    decorationsList.style.display = 'block';
    decorationsList.innerHTML = '';
    decorations.forEach((decoration, index) => {
        const decorationItem = document.createElement('div');
        decorationItem.className = 'area-item decoration';
        if (index === selectedDecorationIndex) decorationItem.classList.add('selected');
        
        const decorationName = document.createElement('span');
        decorationName.className = 'area-name';
        const layerIndicator = (decoration.layer || 'front') === 'front' ? ' (Front)' : ' (Back)';
        decorationName.textContent = (decoration.name || `Decoration ${index + 1}`) + layerIndicator;
        
        const decorationType = document.createElement('span');
        decorationType.className = 'area-type decoration';
        decorationType.textContent = 'Decor';
        
        decorationItem.appendChild(decorationName);
        decorationItem.appendChild(decorationType);
        
        decorationItem.addEventListener('click', () => {
            selectedDecorationIndex = index;
            selectedAreaIndex = -1;
            selectedDepthEdgeIndex = -1;
            selectedSillIndex = -1;
            selectedBrickRowIndex = -1;
            updateAreasList();
            updateDepthList();
            updateSillsList();
            updateBrickRowsList();
            updateDecorationsList();
            enableDecorationControls(decoration);
            drawCanvas();
        });
        
        decorationsList.appendChild(decorationItem);
    });
}

// Control functions
function enableMainAreaControls(area) {
    const scaleSlider = document.getElementById('scale-slider');
    const scaleValue = document.getElementById('scale-value');
    if (scaleSlider && scaleValue) {
        let areaScale;
        
        // Check if we have a remembered scale for this stone
        if (area.stone && stoneScaleMemory[area.stone] && area.scale === undefined) {
            areaScale = stoneScaleMemory[area.stone];
            area.scale = areaScale;
            console.log(`Loading remembered scale for stone: ${area.stone} = ${areaScale}%`);
        } else {
            areaScale = area.scale !== undefined ? area.scale : GLOBAL_STONE_SCALE;
            area.scale = areaScale;
        }
        
        scaleSlider.value = areaScale;
        scaleValue.textContent = areaScale + '%';
    }
    
    // FIXED - Always show current texture mode correctly
    const textureModeButtons = document.querySelectorAll('.texture-mode-btn');
    textureModeButtons.forEach(btn => btn.classList.remove('active'));
    
    const currentMode = area.textureMode || 'stone_linear'; // Default to stone_linear
    let activeButtonId;
    switch(currentMode) {
    case 'stone_linear':
        activeButtonId = 'stone-mode-btn';
        break;
   
    case 'brick':
        activeButtonId = 'brick-mode-btn';
        break;
    case 'color_fill':
        activeButtonId = 'color-fill-mode-btn';
        break;
    default:
        activeButtonId = 'stone-mode-btn';
}
    
    const activeButton = document.getElementById(activeButtonId);
    if (activeButton) activeButton.classList.add('active');
    
    
    const sliders = [
        { id: 'rotation-slider', display: 'rotation-value', suffix: '°', property: 'rotation', default: 0 },
        { id: 'horizontal-slider', display: 'horizontal-value', suffix: 'px', property: 'horizontalOffset', default: 0 },
        { id: 'vertical-slider', display: 'vertical-value', suffix: 'px', property: 'verticalOffset', default: 0 },
        { id: 'brightness-slider', display: 'brightness-value', suffix: '%', property: 'brightness', default: 100 },
        { id: 'contrast-slider', display: 'contrast-value', suffix: '%', property: 'contrast', default: 100 },
        { id: 'shadow-slider', display: 'shadow-value', suffix: '%', property: 'shadow', default: 0 },
        { id: 'angle-3d-slider', display: 'angle-3d-value', suffix: '°', property: 'angle3d', default: 0 },
        { id: 'perspective-angle-slider', display: 'perspective-angle-value', suffix: '°', property: 'perspectiveAngle', default: 0 },
{ id: 'perspective-compression-slider', display: 'perspective-compression-value', suffix: '%', property: 'perspectiveCompression', default: 0 },
        { id: 'depth-perspective-slider', display: 'depth-perspective-value', suffix: '%', property: 'depthPerspective', default: 0 },
        { id: 'edge-protrusion-slider', display: 'edge-protrusion-value', suffix: 'px', property: 'protrusion', default: 0 },
        { id: 'shadow-offset-slider', display: 'shadow-offset-value', suffix: 'px', property: 'shadowOffset', default: 0 },
        { id: 'shadow-blur-slider', display: 'shadow-blur-value', suffix: 'px', property: 'shadowBlur', default: 0 }
    ];
    
    sliders.forEach(slider => {
        const sliderEl = document.getElementById(slider.id);
        const displayEl = document.getElementById(slider.display);
        if (sliderEl && displayEl) {
            const value = area[slider.property] !== undefined ? area[slider.property] : slider.default;
            sliderEl.value = value;
            displayEl.textContent = value + slider.suffix;
        }
    });
    
    // Show/hide brick controls based on mode
    const brickControls = document.getElementById('brick-controls');
    if (brickControls) {
        if (currentMode === 'brick') {
            brickControls.style.display = 'block';
            
            const brickColorSelect = document.getElementById('brick-color-select');
            const brickTextureSelect = document.getElementById('brick-texture-select');
            const brickMortarColorSelect = document.getElementById('brick-mortar-color-select');
            const brickRowHeightSlider = document.getElementById('brick-row-height-slider');
            const brickRowHeightValue = document.getElementById('brick-row-height-value');
            const brickMortarThicknessSlider = document.getElementById('brick-mortar-thickness-slider');
            const brickMortarThicknessValue = document.getElementById('brick-mortar-thickness-value');
            
           if (brickColorSelect) {
                brickColorSelect.value = area.brickColor || currentBrickColor;
                // Show/hide custom color picker based on current selection
                const customBrickColorGroup = document.getElementById('custom-brick-color-group');
                const customBrickColorPicker = document.getElementById('custom-brick-color-picker');
                if (brickColorSelect.value === 'custom') {
                    customBrickColorGroup.style.display = 'block';
                    if (customBrickColorPicker) {
                        customBrickColorPicker.value = area.customBrickColor || customBrickColor;
                    }
                } else {
                    customBrickColorGroup.style.display = 'none';
                }
            }
            if (brickTextureSelect) brickTextureSelect.value = area.brickTexture || currentBrickTexture;
            if (brickMortarColorSelect) {
                brickMortarColorSelect.value = area.brickMortarColor || currentBrickMortarColor;
                // Show/hide custom mortar color picker based on current selection
                const customMortarColorGroup = document.getElementById('custom-mortar-color-group');
                const customMortarColorPicker = document.getElementById('custom-mortar-color-picker');
                if (brickMortarColorSelect.value === 'custom') {
                    customMortarColorGroup.style.display = 'block';
                    if (customMortarColorPicker) {
                        customMortarColorPicker.value = area.customMortarColor || customMortarColor;
                    }
                } else {
                    customMortarColorGroup.style.display = 'none';
                }
            }
            if (brickRowHeightSlider) {
                brickRowHeightSlider.value = area.brickRowHeight || brickRowHeight;
                if (brickRowHeightValue) brickRowHeightValue.textContent = (area.brickRowHeight || brickRowHeight) + 'px';
            }
            if (brickMortarThicknessSlider) {
                brickMortarThicknessSlider.value = area.brickMortarThickness || brickMortarThickness;
                if (brickMortarThicknessValue) brickMortarThicknessValue.textContent = (area.brickMortarThickness || brickMortarThickness) + 'px';
            }
        } else {
            brickControls.style.display = 'none';
        }
        }

// Show/hide color fill controls based on mode
const colorFillControls = document.getElementById('color-fill-controls');
if (colorFillControls) {
    if (currentMode === 'color_fill') {
        colorFillControls.style.display = 'block';
        
        const colorFillPicker = document.getElementById('color-fill-picker');
        const colorFillOpacitySlider = document.getElementById('color-fill-opacity-slider');
        const colorFillOpacityValue = document.getElementById('color-fill-opacity-value');
        
        if (colorFillPicker) {
            colorFillPicker.value = area.fillColor || currentFillColor;
        }
        if (colorFillOpacitySlider) {
            const opacity = Math.round((area.fillOpacity || currentFillOpacity) * 100);
            colorFillOpacitySlider.value = opacity;
            if (colorFillOpacityValue) {
                colorFillOpacityValue.textContent = opacity + '%';
            }
        }
    } else {
        colorFillControls.style.display = 'none';
    }
}
}

function enableSillControls(sill) {
    const sliders = [
        { id: 'scale-slider', display: 'scale-value', suffix: '%', property: 'scale', default: GLOBAL_STONE_SCALE },
        { id: 'rotation-slider', display: 'rotation-value', suffix: '°', property: 'rotation', default: 0 },
        { id: 'horizontal-slider', display: 'horizontal-value', suffix: 'px', property: 'horizontalOffset', default: 0 },
        { id: 'vertical-slider', display: 'vertical-value', suffix: 'px', property: 'verticalOffset', default: 0 },
        { id: 'brightness-slider', display: 'brightness-value', suffix: '%', property: 'brightness', default: 100 },
        { id: 'contrast-slider', display: 'contrast-value', suffix: '%', property: 'contrast', default: 100 },
        { id: 'shadow-slider', display: 'shadow-value', suffix: '%', property: 'shadow', default: 0 },
{ id: 'shadow-opacity-slider', display: 'shadow-opacity-value', suffix: '%', property: 'shadowOpacity', default: 40 },
        { id: 'shadow-offset-slider', display: 'shadow-offset-value', suffix: 'px', property: 'shadowOffset', default: 2 },
        { id: 'shadow-blur-slider', display: 'shadow-blur-value', suffix: 'px', property: 'shadowBlur', default: 2 }
    ];
    
    sliders.forEach(slider => {
        const sliderEl = document.getElementById(slider.id);
        const displayEl = document.getElementById(slider.display);
        if (sliderEl && displayEl) {
            const value = sill[slider.property] !== undefined ? sill[slider.property] : slider.default;
            sliderEl.value = value;
            displayEl.textContent = value + slider.suffix;
        }
    });
}

function enableBrickRowControls(brickRow) {
    // Show brick controls section
    const brickControls = document.getElementById('brick-controls');
    if (brickControls) {
        brickControls.style.display = 'block';
    }

    const scaleSlider = document.getElementById('scale-slider');
const scaleValue = document.getElementById('scale-value');
if (scaleSlider && scaleValue) {
    const brickRowScale = brickRow.scale !== undefined ? brickRow.scale : 60; // Use 60 as default
    brickRow.scale = brickRowScale;
    scaleSlider.value = brickRowScale;
    scaleValue.textContent = brickRowScale + '%';
}
    
    // Update brick row specific controls
    const brickPatternSelect = document.getElementById('brick-pattern-select');
    const brickColorSelect = document.getElementById('brick-color-select');
    const customBrickColorGroup = document.getElementById('custom-brick-color-group');
    const customBrickColorPicker = document.getElementById('custom-brick-color-picker');
    const brickTextureSelect = document.getElementById('brick-texture-select');
    const brickMortarColorSelect = document.getElementById('brick-mortar-color-select');
    const brickRowHeightSlider = document.getElementById('brick-row-height-slider');
    const brickRowHeightValue = document.getElementById('brick-row-height-value');
    const brickMortarThicknessSlider = document.getElementById('brick-mortar-thickness-slider');
    const brickMortarThicknessValue = document.getElementById('brick-mortar-thickness-value');
    
    // Set brick row values
    if (brickPatternSelect) brickPatternSelect.value = brickRow.pattern || currentBrickPattern;
    if (brickColorSelect) {
        brickColorSelect.value = brickRow.color || currentBrickColor;
        // Show/hide custom color picker
        if (brickColorSelect.value === 'custom') {
            customBrickColorGroup.style.display = 'block';
            if (customBrickColorPicker) {
                customBrickColorPicker.value = brickRow.customColor || customBrickColor;
            }
        } else {
            customBrickColorGroup.style.display = 'none';
        }
    }
    if (brickTextureSelect) brickTextureSelect.value = brickRow.texture || currentBrickTexture;
    if (brickMortarColorSelect) brickMortarColorSelect.value = brickRow.mortarColor || currentBrickMortarColor;
// Enhanced mortar color controls with custom color support
    const customMortarColorGroup = document.getElementById('custom-mortar-color-group');
    const customMortarColorPicker = document.getElementById('custom-mortar-color-picker');
    
    if (brickMortarColorSelect) {
        brickMortarColorSelect.value = brickRow.mortarColor || currentBrickMortarColor;
        // Show/hide custom mortar color picker
        if (brickMortarColorSelect.value === 'custom') {
            customMortarColorGroup.style.display = 'block';
            if (customMortarColorPicker) {
                customMortarColorPicker.value = brickRow.customMortarColor || customMortarColor;
            }
        } else {
            customMortarColorGroup.style.display = 'none';
        }
    }
    if (brickRowHeightSlider && brickRowHeightValue) {
        const height = brickRow.height || brickRowHeight;
        brickRowHeightSlider.value = height;
        brickRowHeightValue.textContent = height + 'px';
    }
    if (brickMortarThicknessSlider && brickMortarThicknessValue) {
        const thickness = brickRow.mortarThickness || brickMortarThickness;
        brickMortarThicknessSlider.value = thickness;
        brickMortarThicknessValue.textContent = thickness + 'px';
    }
    
    const sliders = [
        { id: 'rotation-slider', display: 'rotation-value', suffix: '°', property: 'rotation', default: 0 },
        { id: 'horizontal-slider', display: 'horizontal-value', suffix: 'px', property: 'horizontalOffset', default: 0 },
        { id: 'vertical-slider', display: 'vertical-value', suffix: 'px', property: 'verticalOffset', default: 0 },
        { id: 'brightness-slider', display: 'brightness-value', suffix: '%', property: 'brightness', default: 100 },
        { id: 'contrast-slider', display: 'contrast-value', suffix: '%', property: 'contrast', default: 100 },
        { id: 'shadow-slider', display: 'shadow-value', suffix: '%', property: 'shadow', default: 0 },
        { id: 'angle-3d-slider', display: 'angle-3d-value', suffix: '°', property: 'angle3d', default: 0 },
        { id: 'perspective-angle-slider', display: 'perspective-angle-value', suffix: '°', property: 'perspectiveAngle', default: 0 },
{ id: 'perspective-compression-slider', display: 'perspective-compression-value', suffix: '%', property: 'perspectiveCompression', default: 0 },
        { id: 'shadow-offset-slider', display: 'shadow-offset-value', suffix: 'px', property: 'shadowOffset', default: 0 },
        { id: 'shadow-blur-slider', display: 'shadow-blur-value', suffix: 'px', property: 'shadowBlur', default: 0 }
    ];
    
    sliders.forEach(slider => {
        const sliderEl = document.getElementById(slider.id);
        const displayEl = document.getElementById(slider.display);
        if (sliderEl && displayEl) {
            const value = brickRow[slider.property] !== undefined ? brickRow[slider.property] : slider.default;
            sliderEl.value = value;
            displayEl.textContent = value + slider.suffix;
        }
    });
    
    showMessage('Brick row selected - Use brick controls to customize appearance');
}

function enableDepthEdgeControls(edge) {
    const depthIntensitySlider = document.getElementById('depth-intensity-slider');
    const depthIntensityValue = document.getElementById('depth-intensity-value');
    const edgeProtrusionSlider = document.getElementById('edge-protrusion-slider');
    const edgeProtrusionValue = document.getElementById('edge-protrusion-value');
    const shadowOpacitySlider = document.getElementById('shadow-opacity-slider');
    const shadowOpacityValue = document.getElementById('shadow-opacity-value');
    const shadowOffsetSlider = document.getElementById('shadow-offset-slider');
    const shadowOffsetValue = document.getElementById('shadow-offset-value');
    const shadowBlurSlider = document.getElementById('shadow-blur-slider');
    const shadowBlurValue = document.getElementById('shadow-blur-value');
    
    if (depthIntensitySlider && depthIntensityValue) {
        depthIntensitySlider.value = edge.intensity || depthEffectIntensity;
        depthIntensityValue.textContent = (edge.intensity || depthEffectIntensity) + 'px';
    }
    if (edgeProtrusionSlider && edgeProtrusionValue) {
        edgeProtrusionSlider.value = edge.protrusion || 0;
        edgeProtrusionValue.textContent = (edge.protrusion || 0) + 'px';
    }
    if (shadowOpacitySlider && shadowOpacityValue) {
        shadowOpacitySlider.value = edge.shadowOpacity || 40;
        shadowOpacityValue.textContent = (edge.shadowOpacity || 40) + '%';
    }
    if (shadowOffsetSlider && shadowOffsetValue) {
        shadowOffsetSlider.value = edge.shadowOffset || 5;
        shadowOffsetValue.textContent = (edge.shadowOffset || 5) + 'px';
    }
    if (shadowBlurSlider && shadowBlurValue) {
        shadowBlurSlider.value = edge.shadowBlur || 3;
        shadowBlurValue.textContent = (edge.shadowBlur || 3) + 'px';
    }
}

function enableDecorationControls(decoration) {
    // Show decoration controls section
    const decorationControls = document.getElementById('decoration-controls');
    if (decorationControls) {
        decorationControls.style.display = 'block';
    }
    
    const sliders = [
        { id: 'rotation-slider', display: 'rotation-value', suffix: '°', property: 'rotation', default: 0 },
        { id: 'brightness-slider', display: 'brightness-value', suffix: '%', property: 'brightness', default: 100 },
        { id: 'contrast-slider', display: 'contrast-value', suffix: '%', property: 'contrast', default: 100 },
        { id: 'shadow-slider', display: 'shadow-value', suffix: '%', property: 'shadow', default: 0 },
        { id: 'shadow-offset-slider', display: 'shadow-offset-value', suffix: 'px', property: 'shadowOffset', default: 2 },
        { id: 'shadow-blur-slider', display: 'shadow-blur-value', suffix: 'px', property: 'shadowBlur', default: 2 }
    ];
    
    sliders.forEach(slider => {
        const sliderEl = document.getElementById(slider.id);
        const displayEl = document.getElementById(slider.display);
        if (sliderEl && displayEl) {
            const value = decoration[slider.property] !== undefined ? decoration[slider.property] : slider.default;
            sliderEl.value = value;
            displayEl.textContent = value + slider.suffix;
        }
    });
    
    const decorationOpacitySlider = document.getElementById('decoration-opacity-slider');
    const decorationOpacityValue = document.getElementById('decoration-opacity-value');
    
    if (decorationOpacitySlider && decorationOpacityValue) {
        decorationOpacitySlider.value = decoration.opacity || 100;
        decorationOpacityValue.textContent = (decoration.opacity || 100) + '%';
    }
    
    // Update layer button states
    const bringFrontBtn = document.getElementById('decoration-bring-front');
    const sendBackBtn = document.getElementById('decoration-send-back');
    
    if (bringFrontBtn && sendBackBtn) {
        const currentLayer = decoration.layer || 'front';
        
        // Update button appearance based on current layer
        if (currentLayer === 'front') {
            bringFrontBtn.style.background = '#3498db';
            bringFrontBtn.style.color = 'white';
            sendBackBtn.style.background = '#f8f9fa';
            sendBackBtn.style.color = '#333';
        } else {
            sendBackBtn.style.background = '#3498db';
            sendBackBtn.style.color = 'white';
            bringFrontBtn.style.background = '#f8f9fa';
            bringFrontBtn.style.color = '#333';
        }
    }
}

function disableMainAreaControls() {
    resetSlidersToDefaults();
    
    const textureModeButtons = document.querySelectorAll('.texture-mode-btn');
    textureModeButtons.forEach(btn => btn.classList.remove('active'));
    const defaultButton = document.getElementById('stone-mode-btn');
    if (defaultButton) defaultButton.classList.add('active');
    
    const scaleSlider = document.getElementById('scale-slider');
    const scaleValue = document.getElementById('scale-value');
    if (scaleSlider && scaleValue) {
        scaleSlider.value = GLOBAL_STONE_SCALE;
        scaleValue.textContent = GLOBAL_STONE_SCALE + '%';
    }
    
    // Hide decoration controls
    const decorationControls = document.getElementById('decoration-controls');
    if (decorationControls) {
        decorationControls.style.display = 'none';
    }
    
    // Hide brick controls
    const brickControls = document.getElementById('brick-controls');
    if (brickControls) {
        brickControls.style.display = 'none';
    }
    
    // Hide color fill controls
    const colorFillControls = document.getElementById('color-fill-controls');
    if (colorFillControls) {
        colorFillControls.style.display = 'none';
    }
}

function resetSlidersToDefaults() {
    const sliders = [
        { id: 'scale-slider', value: 60, display: 'scale-value', suffix: '%' },
        { id: 'rotation-slider', value: 180, display: 'rotation-value', suffix: '°' },
        { id: 'horizontal-slider', value: 0, display: 'horizontal-value', suffix: 'px' },
        { id: 'vertical-slider', value: 0, display: 'vertical-value', suffix: 'px' },
        { id: 'brightness-slider', value: 100, display: 'brightness-value', suffix: '%' },
        { id: 'contrast-slider', value: 100, display: 'contrast-value', suffix: '%' },
        { id: 'shadow-slider', value: 0, display: 'shadow-value', suffix: '%' },
        { id: 'angle-3d-slider', value: 0, display: 'angle-3d-value', suffix: '°' },
        { id: 'perspective-angle-slider', value: 0, display: 'perspective-angle-value', suffix: '°' },
{ id: 'perspective-compression-slider', value: 0, display: 'perspective-compression-value', suffix: '%' },
        { id: 'depth-perspective-slider', value: 0, display: 'depth-perspective-value', suffix: '%' },
        { id: 'depth-intensity-slider', value: 20, display: 'depth-intensity-value', suffix: 'px' },
        { id: 'edge-protrusion-slider', value: 0, display: 'edge-protrusion-value', suffix: 'px' },
        { id: 'shadow-opacity-slider', value: 40, display: 'shadow-opacity-value', suffix: '%' },
        { id: 'shadow-offset-slider', value: 5, display: 'shadow-offset-value', suffix: 'px' },
        { id: 'shadow-blur-slider', value: 3, display: 'shadow-blur-value', suffix: 'px' },
        { id: 'brick-row-height-slider', value: brickRowHeight, display: 'brick-row-height-value', suffix: 'px' },
        { id: 'brick-mortar-thickness-slider', value: brickMortarThickness, display: 'brick-mortar-thickness-value', suffix: 'px' },
        { id: 'decoration-opacity-slider', value: 100, display: 'decoration-opacity-value', suffix: '%' }
    ];
    
    sliders.forEach(slider => {
        const sliderEl = document.getElementById(slider.id);
        const displayEl = document.getElementById(slider.display);
        if (sliderEl) sliderEl.value = slider.value;
        if (displayEl) displayEl.textContent = slider.value + slider.suffix;
    });
}


// Color Fill Controls Event Listeners
const colorFillPicker = document.getElementById('color-fill-picker');
const colorFillOpacitySlider = document.getElementById('color-fill-opacity-slider');
const colorFillOpacityValue = document.getElementById('color-fill-opacity-value');

if (colorFillPicker) {
    colorFillPicker.addEventListener('input', () => {
        currentFillColor = colorFillPicker.value;
        
        // Apply to selected area using color fill mode
        if (selectedAreaIndex !== -1 && areas[selectedAreaIndex] && areas[selectedAreaIndex].textureMode === 'color_fill') {
            areas[selectedAreaIndex].fillColor = currentFillColor;
            drawCanvas();
        }
    });
}

if (colorFillOpacitySlider) {
    colorFillOpacitySlider.addEventListener('input', () => {
        const opacity = parseInt(colorFillOpacitySlider.value) / 100;
        currentFillOpacity = opacity;
        
        if (colorFillOpacityValue) {
            colorFillOpacityValue.textContent = colorFillOpacitySlider.value + '%';
        }
        
        // Apply to selected area using color fill mode
        if (selectedAreaIndex !== -1 && areas[selectedAreaIndex] && areas[selectedAreaIndex].textureMode === 'color_fill') {
            areas[selectedAreaIndex].fillOpacity = currentFillOpacity;
            drawCanvas();
        }
    });
}

// Helper functions for drag detection
function isPointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        if (((polygon[i].y > point.y) !== (polygon[j].y > point.y)) &&
            (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
            inside = !inside;
        }
    }
    return inside;
}

function isPointNearLine(point, lineStart, lineEnd, threshold) {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
        xx = lineStart.x;
        yy = lineStart.y;
    } else if (param > 1) {
        xx = lineEnd.x;
        yy = lineEnd.y;
    } else {
        xx = lineStart.x + param * C;
        yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy) <= threshold;
}

function isPointNearPoint(point1, point2, threshold) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy) <= threshold;
}

// Helper function to check if point is near decoration corner for resizing
function getDecorationResizeHandle(x, y, decoration) {
    if (!decoration || !decorationImages[decoration.image]) return null;
    
    const img = decorationImages[decoration.image];
    const size = (decoration.size || 100) / 100;
    const width = img.width * size;
    const height = img.height * size;
    const rotation = (decoration.rotation || 0) * Math.PI / 180;
    
    // Calculate transformed corners
    const corners = [
        { x: -width/2, y: -height/2, handle: 'nw' },
        { x: width/2, y: -height/2, handle: 'ne' },
        { x: width/2, y: height/2, handle: 'se' },
        { x: -width/2, y: height/2, handle: 'sw' }
    ];
    
    const transformedCorners = corners.map(corner => {
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        return {
            x: decoration.x + corner.x * cos - corner.y * sin,
            y: decoration.y + corner.x * sin + corner.y * cos,
            handle: corner.handle
        };
    });
    
    // Check if point is near any corner
    for (let corner of transformedCorners) {
        if (isPointNearPoint({ x, y }, corner, 12)) {
            return corner.handle;
        }
    }
    
    return null;
}

// UI Helper Functions
function showMessage(text, duration = 3000) {
    const messageEl = document.getElementById('message');
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.classList.add('show');
    setTimeout(() => {
        messageEl.classList.remove('show');
    }, duration);
}
// Add this function near your other UI functions
function toggleMaterialPanel() {
    const panel = document.querySelector('.material-selection-panel');
    const toggleBtn = document.querySelector('.material-panel-toggle');
    
    if (panel.classList.contains('collapsed')) {
        panel.classList.remove('collapsed');
        toggleBtn.textContent = 'Hide Materials';
    } else {
        panel.classList.add('collapsed');
        toggleBtn.textContent = 'Show Materials';
    }
}

// Auto-hide panel after material selection
function autoHideMaterialPanel() {
    const panel = document.querySelector('.material-selection-panel');
    const toggleBtn = document.querySelector('.material-panel-toggle');
    
    panel.classList.add('collapsed');
    toggleBtn.textContent = 'Show Materials';
    showMessage('Material panel minimized. Hover over it or click the button to show again.');
}
function setActiveButton(activeBtn, otherBtns) {
    if (activeBtn) activeBtn.classList.add('active');
    if (otherBtns) {
        otherBtns.forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
    }
}

function setActiveTextureModeButton(activeBtn) {
    // Remove active class from all texture mode buttons
    const allTextureModeButtons = document.querySelectorAll('.texture-mode-btn');
    allTextureModeButtons.forEach(btn => {
        if (btn) btn.classList.remove('active');
    });
    
    // Add active class to the clicked button
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// FIXED - Texture mode update function to prevent reverting
function updateAreaTextureMode(mode) {
    console.log('updateAreaTextureMode called with mode:', mode);
    
    if (selectedAreaIndex !== -1 && areas[selectedAreaIndex] && !areas[selectedAreaIndex].isCutout) {
        // Update the selected area's texture mode
        areas[selectedAreaIndex].textureMode = mode;
        
        // Ensure area has a stone for stone modes
        if (mode === 'stone_linear' && !areas[selectedAreaIndex].stone) {
            if (currentStone) {
                areas[selectedAreaIndex].stone = currentStone;
            } else if (STONE_MATERIALS[0]) {
                areas[selectedAreaIndex].stone = STONE_MATERIALS[0].url;
                currentStone = STONE_MATERIALS[0].url;
            }
        }
        
        if (mode === 'brick') {
            areas[selectedAreaIndex].brickColor = areas[selectedAreaIndex].brickColor || currentBrickColor;
            areas[selectedAreaIndex].brickTexture = areas[selectedAreaIndex].brickTexture || currentBrickTexture;
            areas[selectedAreaIndex].brickMortarColor = areas[selectedAreaIndex].brickMortarColor || currentBrickMortarColor;
            areas[selectedAreaIndex].brickRowHeight = areas[selectedAreaIndex].brickRowHeight || brickRowHeight;
            areas[selectedAreaIndex].brickMortarThickness = areas[selectedAreaIndex].brickMortarThickness || brickMortarThickness;
        }

        if (mode === 'color_fill') {
            areas[selectedAreaIndex].fillColor = areas[selectedAreaIndex].fillColor || currentFillColor;
            areas[selectedAreaIndex].fillOpacity = areas[selectedAreaIndex].fillOpacity || currentFillOpacity;
        }
        
        // Clear stone patterns to force regeneration
        stonePatterns = {};
        
        enableMainAreaControls(areas[selectedAreaIndex]);
        showMessage('Texture mode changed to: ' + mode.replace('_', ' '));
    } else {
        // Set global texture mode for new areas
        TEXTURE_MODE = mode;
        showMessage('Default texture mode set to: ' + mode.replace('_', ' '));
    }
    
    drawCanvas();
}

function finishDrawingArea() {
    if (currentPoints.length < 3) return;

    saveState();
    
    // Simplify the points to reduce file size
    const simplifiedPoints = simplifyPoints(currentPoints, 3);
    console.log(`Simplified ${currentPoints.length} points to ${simplifiedPoints.length} points`);

    const newArea = {
        id: Date.now(),
        points: simplifiedPoints,
        stone: null,
        scale: GLOBAL_STONE_SCALE,
rotation: 180,
        textureMode: TEXTURE_MODE,
        isCutout: isSubtractMode,
        brickColor: currentBrickColor,
        brickTexture: currentBrickTexture,
        brickMortarColor: currentBrickMortarColor,
        brickRowHeight: brickRowHeight,
        brickMortarThickness: brickMortarThickness

    };

    if (isSubtractMode && selectedAreaIndex !== -1) {
        newArea.parentId = areas[selectedAreaIndex].id;
        if (!areas[selectedAreaIndex].cutouts) {
            areas[selectedAreaIndex].cutouts = [];
        }
        areas[selectedAreaIndex].cutouts.push(newArea.id);
    }

    areas.push(newArea);
    if (!isSubtractMode) {
        selectedAreaIndex = areas.length - 1;
        selectedAccentIndex = -1; // Clear accent selection
    }
    
    isDrawingArea = false;
    currentPoints = [];
    isInDrawingMode = false;
    
    updateAreasList();
    updateAccentsList();
    if (!newArea.isCutout) {
        enableMainAreaControls(newArea);
    }
    
    showMessage(isSubtractMode ? 'Cutout area created.' : 'Area created. Select a material to apply texture.');
    drawCanvas();
}

// FIXED - Depth area finishing function
function finishDrawingDepthArea() {
    if (currentDepthEdgePoints.length < 3) return;

    saveState();
    
    // Simplify the points to reduce file size
    const simplifiedPoints = simplifyPoints(currentDepthEdgePoints, 3);
    console.log(`Simplified ${currentDepthEdgePoints.length} depth points to ${simplifiedPoints.length} points`);

    const newDepthArea = {
        id: Date.now(),
        points: simplifiedPoints,
        mode: 'area',
        intensity: depthEffectIntensity,
        shadowOpacity: 40,
        shadowOffset: 5,
        shadowBlur: 3
    };

    depthEdges.push(newDepthArea);
    selectedDepthEdgeIndex = depthEdges.length - 1;
    
    isDrawingDepthEdge = false;
    currentDepthEdgePoints = [];
    isInDrawingMode = false;
    
    enableDepthEdgeControls(newDepthArea);
    updateDepthList();
    showMessage('Depth area created.');
    drawCanvas();
}

function clearAllActiveButtons() {
    console.log('clearAllActiveButtons called, isDrawingToolsActive is:', isDrawingToolsActive);
    
    // Clear all toolbar button active states EXCEPT drawing tools if it's active
    const toolbarButtons = document.querySelectorAll('.toolbar-btn');
    toolbarButtons.forEach(btn => {
        // Don't clear drawing tools button if it's currently active
        if (btn.id === 'drawing-tools-btn' && isDrawingToolsActive) {
            console.log('Skipping drawing tools button');
            return; // Skip this button
        }
        btn.classList.remove('active');
    });
    
    console.log('clearAllActiveButtons finished, isDrawingToolsActive is:', isDrawingToolsActive);
}



function setupButtonListeners() {
    console.log('setupButtonListeners() function is running!');
   const addAreaBtn = document.getElementById('add-area-btn');
const subtractAreaBtn = document.getElementById('subtract-area-btn');
const addDepthEdgeBtn = document.getElementById('add-depth-edge-btn');
  const addDepthAreaBtn = document.getElementById('add-depth-area-btn');
    const clearBtn = document.getElementById('clear-btn');
    const downloadBtn = document.getElementById('download-btn');
    const saveAreasBtn = document.getElementById('save-areas-btn');
    
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const copyBtn = document.getElementById('copy-btn');
    const pasteBtn = document.getElementById('paste-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const drawingToolsBtn = document.getElementById('drawing-tools-btn');

    // Download button functionality
if (downloadBtn) {
    // Main download button click - show dropdown
    downloadBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const options = document.querySelector('.download-options');
        
        // Toggle dropdown visibility
        if (options && options.style.display === 'block') {
            options.style.display = 'none';
        } else if (options) {
            options.style.display = 'block';
        }
    });
        
        // Hide dropdown when clicking elsewhere
        document.addEventListener('click', function() {
            const allDropdowns = document.querySelectorAll('.download-options');
            allDropdowns.forEach(dropdown => {
                dropdown.style.display = 'none';
            });
        });
    }

    // Handle size-specific downloads
    const downloadButtons = document.querySelectorAll('[data-size]');
    downloadButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const size = this.dataset.size;
            downloadImage(size);
            
            // Hide dropdown after selection
            this.parentElement.style.display = 'none';
        });
    });
    
    

   // Drawing Tools Button - FIXED with !important override
if (drawingToolsBtn) {
    drawingToolsBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const palette = document.getElementById('drawing-tools-palette');
        console.log('Drawing tools button clicked, palette found:', !!palette);
        
        if (palette) {
            const isCurrentlyHidden = palette.classList.contains('hidden');
            console.log('Palette is currently hidden:', isCurrentlyHidden);
            
            if (isCurrentlyHidden) {
                // Show the palette
                palette.classList.remove('hidden');
                this.classList.add('active');
                isDrawingToolsActive = true;
                console.log('SET isDrawingToolsActive to TRUE');
                
                // FIXED: Use !important to override CSS !important
                palette.style.setProperty('display', 'block', 'important');
                palette.style.setProperty('position', 'fixed', 'important');
                palette.style.setProperty('top', '80px', 'important');
                palette.style.setProperty('right', '20px', 'important');
                palette.style.setProperty('z-index', '100000', 'important');
                palette.style.setProperty('pointer-events', 'auto', 'important');
                palette.style.setProperty('visibility', 'visible', 'important');
                palette.style.setProperty('opacity', '1', 'important');
                
                // CRITICAL FIX: Set default tool and activate drawing canvas
                if (currentDrawingTool === 'pointer' || !currentDrawingTool) {
                    currentDrawingTool = 'circle'; // Set default tool to circle
                    
                    // Mark the circle tool button as active
                    const toolButtons = document.querySelectorAll('.tool-btn');
                    toolButtons.forEach(btn => {
                        if (btn.dataset.tool === 'circle') {
                            btn.classList.add('active');
                        } else {
                            btn.classList.remove('active');
                        }
                    });
                }
                
                // Activate the drawing canvas
                updateDrawingCursor();
                
                console.log('Drawing tools palette shown');
                showMessage('Drawing tools activated. Select a tool to start drawing.');
            } else {
                // Hide the palette
                palette.classList.add('hidden');
                this.classList.remove('active');
                isDrawingToolsActive = false;
                console.log('SET isDrawingToolsActive to FALSE');
                currentDrawingTool = 'pointer';
                updateDrawingCursor();
                
                console.log('Drawing tools palette hidden');
                showMessage('Drawing tools deactivated.');
            }
        } else {
            console.error('Drawing tools palette not found in DOM');
            showMessage('Error: Drawing tools panel not found.');
        }
    });
} else {
    console.error('Drawing tools button not found');
}


    if (addAreaBtn) {
        addAreaBtn.addEventListener('click', function() {
            clearAllActiveButtons();
            isDrawingArea = true; 
            isSubtractMode = false;
            isDrawingDepthEdge = false;
            isDrawingSill = false;
            isDrawingBrickRow = false;
            isAddingDecoration = false;
            isInDrawingMode = true;
            selectedDepthEdgeIndex = -1; 
            selectedSillIndex = -1;
            selectedBrickRowIndex = -1;
            selectedDecorationIndex = -1;
            updateDepthList();
            updateSillsList();
            updateBrickRowsList();
            updateDecorationsList();
            currentPoints = [];
          areaDrawingMode = 'freehand';
rectangleStartPoint = null;
            showMessage('Click to add area points. Double-click or ESC to finish.');
            this.classList.add('active');
            drawCanvas();
        });
    }

  // Right-click for rectangle mode
if (addAreaBtn) {
    addAreaBtn.addEventListener('contextmenu', function(e) {
        e.preventDefault(); // Prevent the context menu from showing
        
        clearAllActiveButtons();
        isDrawingArea = true; 
        isSubtractMode = false;
        isDrawingDepthEdge = false;
        isDrawingSill = false;
        isDrawingBrickRow = false;
        isAddingDecoration = false;
        isInDrawingMode = true;
        selectedDepthEdgeIndex = -1; 
        selectedSillIndex = -1;
        selectedBrickRowIndex = -1;
        selectedDecorationIndex = -1;
        updateDepthList();
        updateSillsList();
        updateBrickRowsList();
        updateDecorationsList();
        currentPoints = [];
        rectangleStartPoint = null;
        areaDrawingMode = 'rectangle';  // Rectangle mode on right-click
        
        showMessage('Rectangle Mode: Click and drag to draw a rectangle area.');
        this.classList.add('active');
        drawCanvas();
    });
}
  
    if (subtractAreaBtn) {
        subtractAreaBtn.addEventListener('click', function() {
            if (selectedAreaIndex === -1 || (areas[selectedAreaIndex] && areas[selectedAreaIndex].isCutout)) {
                showMessage('Select a main area first to add a cutout to it.');
                return;
            }
            clearAllActiveButtons();
            isDrawingArea = true; 
            isSubtractMode = true;
          
            isDrawingDepthEdge = false;
            isDrawingSill = false;
            isDrawingBrickRow = false;
            isAddingDecoration = false;
            isInDrawingMode = true;
            selectedDepthEdgeIndex = -1; 
            selectedSillIndex = -1;
            selectedBrickRowIndex = -1;
            selectedDecorationIndex = -1;
            updateDepthList();
            updateSillsList();
            updateBrickRowsList();
            updateDecorationsList();
            currentPoints = []; 
            areaDrawingMode = 'freehand';
rectangleStartPoint = null;
            showMessage('Click to add cutout points. Double-click or ESC to finish.');
            this.classList.add('active');
            drawCanvas();
        });
    }

    // FIXED - Depth edge button
    if (addDepthEdgeBtn) {
        addDepthEdgeBtn.addEventListener('click', function() {
            clearAllActiveButtons();
            isDrawingArea = false;
            isSubtractMode = false;
            isDrawingDepthEdge = true;
            depthEdgeMode = 'line'; // FIXED - Set correct mode
            isDrawingSill = false;
            isDrawingBrickRow = false;
            isAddingDecoration = false;
            isInDrawingMode = true;
            selectedAreaIndex = -1; 
            selectedDepthEdgeIndex = -1; 
            selectedSillIndex = -1;
            selectedBrickRowIndex = -1;
            selectedDecorationIndex = -1;
            updateAreasList(); 
            updateSillsList();
            updateBrickRowsList();
            updateDecorationsList();
            disableMainAreaControls(); 

            currentDepthEdgePoints = [];
            showMessage('Click to set start point of depth edge line. Click again to set end point.');
            this.classList.add('active');
            drawCanvas();
        });
    }


    if (addDepthAreaBtn) {
        addDepthAreaBtn.addEventListener('click', function() {
            clearAllActiveButtons();
            isDrawingArea = false;
            isSubtractMode = false;
          selectedAreaIndex = -1;
            isDrawingDepthEdge = true;
            depthEdgeMode = 'area'; // FIXED - Set correct mode
            isDrawingSill = false;
            isDrawingBrickRow = false;
            isAddingDecoration = false;
            isInDrawingMode = true;
            selectedAreaIndex = -1; 
            selectedDepthEdgeIndex = -1; 
            selectedSillIndex = -1;
            selectedBrickRowIndex = -1;
            selectedDecorationIndex = -1;
            updateAreasList(); 
            updateSillsList();
            updateBrickRowsList();
            updateDecorationsList();
            disableMainAreaControls(); 

            currentDepthEdgePoints = [];
            showMessage('Click to draw depth area points. Double-click or ESC to finish.');
            this.classList.add('active');
            drawCanvas();
        });
    }
  
    // FIXED - Clear button to clear all drawings too
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            clearAllActiveButtons();
            saveState();
            areas = []; 
            currentPoints = []; 
            isDrawingArea = false; 
            selectedAreaIndex = -1;
            depthEdges = []; 
            selectedDepthEdgeIndex = -1;
            sills = []; 
            selectedSillIndex = -1;
            brickRows = []; 
            selectedBrickRowIndex = -1;
            decorations = []; 
          accents = [];
            selectedDecorationIndex = -1;
          selectedAccentIndex = -1;
            annotations = []; // FIXED - Clear annotations too
            selectedAnnotation = null;
            isInDrawingMode = false;
            stonePatterns = {};
            processedSingleImages = {};
            updateAreasList(); 
            updateSillsList();
            updateBrickRowsList();
            updateDecorationsList();
          updateAccentsList();
            updateDepthList();
            disableMainAreaControls();
            resetSlidersToDefaults();
            drawCanvas(); 
            redrawAnnotations(); // FIXED - Clear drawing canvas too
            showMessage('All elements cleared.');
        });
    }

    if (undoBtn) {
        undoBtn.addEventListener('click', undo);
    }

    if (redoBtn) {
        redoBtn.addEventListener('click', redo);
    }
    
    if (copyBtn) {
        copyBtn.addEventListener('click', copySelectedElement);
    }
    
  if (pasteBtn) {
    pasteBtn.addEventListener('click', pasteElement);
}

if (deleteBtn) {
    deleteBtn.addEventListener('click', deleteSelectedElement);
}

if (saveAreasBtn) {
    saveAreasBtn.addEventListener('click', function() { 
        const houseSelect = document.getElementById('house-select');
        const houseImgSrc = houseSelect ? houseSelect.value : null;
        if (!houseImgSrc) {
            showMessage('Please select a house image first.');
            return;
        }
        const dataToSave = { 
            house: houseImgSrc,
            areas: JSON.parse(JSON.stringify(areas)),
            depthEdges: JSON.parse(JSON.stringify(depthEdges)),
            sills: JSON.parse(JSON.stringify(sills)),
            brickRows: JSON.parse(JSON.stringify(brickRows)),
            decorations: JSON.parse(JSON.stringify(decorations)),
            accents: JSON.parse(JSON.stringify(accents))
        };
        const jsonString = JSON.stringify(dataToSave, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'house_design.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showMessage('Design saved as JSON file.');
    });
}


    


    // FIXED - Texture Mode Toggles - Completely isolated event handling
    const brickModeBtn = document.getElementById('brick-mode-btn');
    const stoneModeBtn = document.getElementById('stone-mode-btn');


    // Remove any existing event listeners first and add fresh ones
    if (brickModeBtn) {
        const newBrickBtn = brickModeBtn.cloneNode(true);
        brickModeBtn.parentNode.replaceChild(newBrickBtn, brickModeBtn);
        newBrickBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            setActiveTextureModeButton(this); 
            updateAreaTextureMode('brick'); 
        });
    }

    // Color Fill mode button
const colorFillModeBtn = document.getElementById('color-fill-mode-btn');
if (colorFillModeBtn) {
    colorFillModeBtn.addEventListener('click', () => {
        setActiveTextureModeButton(colorFillModeBtn);
        updateAreaTextureMode('color_fill');
    });
}

// Brick Row mode button
const brickRowModeBtn = document.getElementById('brick-row-mode-btn');
if (brickRowModeBtn) {
    brickRowModeBtn.addEventListener('click', function() {
        clearAllActiveButtons();
        isDrawingArea = false;
        isSubtractMode = false;
        isDrawingDepthEdge = false;
        isDrawingSill = false;
        isDrawingBrickRow = true;
        isAddingDecoration = false;
        isInDrawingMode = true;
        selectedAreaIndex = -1;
        selectedDepthEdgeIndex = -1;
        selectedSillIndex = -1;
        selectedBrickRowIndex = -1;
        selectedDecorationIndex = -1;
        selectedAccentIndex = -1;
        updateAreasList();
        updateDepthList();
        updateSillsList();
        updateBrickRowsList();
        updateDecorationsList();
        updateAccentsList();
        disableMainAreaControls();
        
        currentBrickRowPoints = [];
        areaDrawingMode = 'freehand';
        rectangleStartPoint = null;
        setActiveTextureModeButton(this);
        showMessage('Click two points to draw a brick row line.');
        drawCanvas();
    });
}
    
    if (stoneModeBtn) {
        const newStoneBtn = stoneModeBtn.cloneNode(true);
        stoneModeBtn.parentNode.replaceChild(newStoneBtn, stoneModeBtn);
        newStoneBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            setActiveTextureModeButton(this); 
            updateAreaTextureMode('stone_linear'); 
        });
    }
    
}
// Manual preset save button
const savePresetBtn = document.getElementById('save-preset-btn');
if (savePresetBtn) {
    savePresetBtn.addEventListener('click', saveNamedPreset);
}

// Add these functions OUTSIDE of setupButtonListeners() function
// Place these functions at the end of your JavaScript file, after setupButtonListeners()

// Smart Download function with stone profile and color in filename
function downloadImage(size) {
    // Create a temporary canvas to combine both layers
    const tempCanvas = document.createElement('canvas');
    let width, height, filename;
    
    // Generate smart filename based on selected stones
    filename = generateSmartFilename(size);
    
    // Set dimensions based on size
    switch(size) {
        case 'small':
            width = 800;
            height = Math.round(canvas.height * (800 / canvas.width));
            break;
        case 'medium':
            width = 1200;
            height = Math.round(canvas.height * (1200 / canvas.width));
            break;
        case 'large':
        default:
            width = canvas.width;
            height = canvas.height;
            break;
    }
    
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Draw the main canvas (without outlines)
    drawCanvas(true);
    tempCtx.drawImage(canvas, 0, 0, width, height);
    
    // Draw the annotations on top (scaled)
    tempCtx.drawImage(drawingCanvas, 0, 0, width, height);
    
    // Restore normal canvas view
    drawCanvas(false);
    
    const dataURL = tempCanvas.toDataURL('image/png');
    const a = document.createElement('a'); 
    a.href = dataURL; 
    a.download = filename;
    document.body.appendChild(a); 
    a.click(); 
    document.body.removeChild(a);
    showMessage(`Downloaded: ${filename}`);
}

function generateSmartFilename(size) {
    // Collect unique materials used in the design
    const usedMaterials = new Set();
    const materialProfiles = new Set();
    const materialManufacturers = new Set();
    const materialTypes = new Set(); // stone, thin-brick, full-brick, etc.
    
    // Create comprehensive material lookup arrays - only use arrays that exist
    const allMaterials = [];
    
    // Add material arrays that exist in your code
    if (typeof STONE_MATERIALS !== 'undefined') allMaterials.push(...STONE_MATERIALS);
    if (typeof DUTCH_QUALITY_MATERIALS !== 'undefined') allMaterials.push(...DUTCH_QUALITY_MATERIALS);
    if (typeof ROCKY_MOUNTAIN_MATERIALS !== 'undefined') allMaterials.push(...ROCKY_MOUNTAIN_MATERIALS);
    if (typeof ENDICOTT_MATERIALS !== 'undefined') allMaterials.push(...ENDICOTT_MATERIALS);
    if (typeof GLEN_GERY_MATERIALS !== 'undefined') allMaterials.push(...GLEN_GERY_MATERIALS);
    if (typeof HEBRON_MATERIALS !== 'undefined') allMaterials.push(...HEBRON_MATERIALS);
    if (typeof DUTCH_QUALITY_THIN_BRICK_MATERIALS !== 'undefined') allMaterials.push(...DUTCH_QUALITY_THIN_BRICK_MATERIALS);
    if (typeof HC_MUDDOX_MATERIALS !== 'undefined') allMaterials.push(...HC_MUDDOX_MATERIALS);
if (typeof INTERSTATE_MATERIALS !== 'undefined') allMaterials.push(...INTERSTATE_MATERIALS);
    
    // Add surface materials with lower priority if they exist
    if (typeof STONE_SURFACES_MATERIALS !== 'undefined') {
        allMaterials.push(...STONE_SURFACES_MATERIALS.map(m => ({...m, type: 'surface', priority: 0})));
    }
    if (typeof BRICK_MATERIALS !== 'undefined') {
        allMaterials.push(...BRICK_MATERIALS.map(m => ({...m, type: 'surface', priority: 0})));
    }
    
    // Add priority to non-surface materials
    allMaterials.forEach(material => {
        if (!material.priority) {
            material.priority = material.type === 'surface' ? 0 : 1;
        }
    });
    
    // Check all areas for materials
    if (typeof areas !== 'undefined' && areas.length > 0) {
        areas.forEach(area => {
            if (area && !area.isCutout && area.stone) {
                // Find material data from all possible sources
                const materialData = allMaterials.find(material => material.url === area.stone);
                if (materialData) {
                    usedMaterials.add({
                        name: materialData.name,
                        profile: materialData.profile || 'standard',
                        manufacturer: materialData.manufacturer || 'unknown',
                        priority: materialData.priority || 1,
                        url: materialData.url
                    });
                    
                    materialProfiles.add(materialData.profile || 'standard');
                    materialManufacturers.add(materialData.manufacturer || 'unknown');
                    
                    // Determine material type
                    if (materialData.manufacturer && materialData.manufacturer.includes('brick')) {
                        materialTypes.add('brick');
                    } else if (materialData.type === 'surface') {
                        materialTypes.add('surface');
                    } else {
                        materialTypes.add('stone');
                    }
                }
            }
        });
        
        // Check brick areas (textureMode === 'brick')
        areas.forEach(area => {
            if (area && !area.isCutout && area.textureMode === 'brick') {
                materialTypes.add('brick-texture');
            }
        });
    }
    
    // Build filename components - prioritize non-surface materials
    let baseFilename = 'stone-visualizer';
    
    if (usedMaterials.size > 0) {
        const materialsArray = Array.from(usedMaterials);
        
        // Sort by priority (higher priority first), then filter out surfaces if we have stones/bricks
        const prioritizedMaterials = materialsArray.sort((a, b) => b.priority - a.priority);
        const hasNonSurface = prioritizedMaterials.some(m => m.priority > 0);
        const finalMaterials = hasNonSurface ? prioritizedMaterials.filter(m => m.priority > 0) : prioritizedMaterials;
        
        if (finalMaterials.length === 1) {
            // Single material - use manufacturer-materialname-profile format
            const material = finalMaterials[0];
            const cleanManufacturer = cleanFilename(material.manufacturer);
            const cleanMaterialName = cleanFilename(material.name);
            const cleanProfile = cleanFilename(material.profile);
            
            baseFilename = `${cleanManufacturer}-${cleanMaterialName}-${cleanProfile}`;
        } else if (finalMaterials.length > 1) {
            // Multiple materials
            const manufacturers = [...new Set(finalMaterials.map(m => m.manufacturer))];
            const profiles = [...new Set(finalMaterials.map(m => m.profile))];
            
            const components = [];
            
            if (manufacturers.length === 1) {
                components.push(cleanFilename(manufacturers[0]));
            } else {
                components.push('mixed');
            }
            
            if (profiles.length <= 2) {
                components.push(...profiles.map(p => cleanFilename(p)));
            } else {
                components.push('multiprofile');
            }
            
            components.push(`${finalMaterials.length}materials`);
            baseFilename = components.join('-');
        }
    }
    
    // Add size and return
    return `${baseFilename}-${size}.png`;
}

// Helper function to clean filename components
function cleanFilename(str) {
    if (!str) return 'unknown';
    return str.toString()
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, '')
        .replace(/\s+/g, '')
        .slice(0, 20); // Limit length to keep filename reasonable
}

function testDrawingCanvas() {
    console.log('Testing drawing canvas...');
    console.log('drawingCanvas:', drawingCanvas);
    console.log('drawingCtx:', drawingCtx);
    console.log('Canvas dimensions:', drawingCanvas.width, 'x', drawingCanvas.height);
    
    if (drawingCtx) {
        // Draw a red rectangle directly to test
        drawingCtx.fillStyle = 'red';
        drawingCtx.fillRect(100, 100, 200, 100);
        console.log('Drew test rectangle');
    }
    
    // Test if event listeners are attached
    console.log('=== EVENT LISTENER TEST ===');
    
    // Add a test click listener
    drawingCanvas.addEventListener('click', function(e) {
        console.log('DRAWING CANVAS CLICKED!', e);
        const coords = getCanvasCoordinates(e);
        console.log('Click coordinates:', coords);
        
        // Draw a blue circle where clicked
        drawingCtx.fillStyle = 'blue';
        drawingCtx.beginPath();
        drawingCtx.arc(coords.x, coords.y, 20, 0, Math.PI * 2);
        drawingCtx.fill();
    });
    
    console.log('Added test click listener to drawing canvas');
}

// ADD THIS DEBUG CODE to test the download button
// Put this code RIGHT AFTER your setupButtonListeners() function

// Test if the download button exists and works
console.log('=== DOWNLOAD BUTTON DEBUG ===');
console.log('1. Download button element:', document.getElementById('download-btn'));
console.log('2. Download options element:', document.querySelector('.download-options'));
console.log('3. Download size buttons:', document.querySelectorAll('[data-size]'));

// Test the download button click manually
const testDownloadBtn = document.getElementById('download-btn');
if (testDownloadBtn) {
    console.log('4. Download button found');
    console.log('5. Download button parent:', testDownloadBtn.parentElement);
    console.log('6. Dropdown container:', testDownloadBtn.parentElement.querySelector('.download-options'));
} else {
    console.log('4. ERROR: Download button NOT found!');
}

// Test if downloadImage function exists
console.log('7. downloadImage function exists:', typeof downloadImage);
console.log('8. generateSmartFilename function exists:', typeof generateSmartFilename);
console.log('9. cleanFilename function exists:', typeof cleanFilename);

// Add click test
if (testDownloadBtn) {
    testDownloadBtn.addEventListener('click', function() {
        console.log('Download button clicked!');
    });
}

// Test the size buttons
const sizeButtons = document.querySelectorAll('[data-size]');
sizeButtons.forEach((btn, index) => {
    console.log(`Size button ${index}:`, btn, 'data-size:', btn.dataset.size);
    btn.addEventListener('click', function() {
        console.log(`Size button clicked: ${this.dataset.size}`);
    });
});

// Test if canvas exists
console.log('10. Main canvas exists:', !!document.getElementById('main-canvas'));
console.log('11. Drawing canvas exists:', !!document.getElementById('drawing-canvas'));
console.log('12. Canvas variable exists:', typeof canvas !== 'undefined');
console.log('13. DrawingCanvas variable exists:', typeof drawingCanvas !== 'undefined');

// REPLACE your entire setupControlListeners function with this corrected version:

function setupControlListeners() {
    const scaleSlider = document.getElementById('scale-slider');
    if (scaleSlider) {
        scaleSlider.addEventListener('input', function() {
            const value = parseInt(this.value);
            const scaleValueDisplay = document.getElementById('scale-value');
            if (scaleValueDisplay) {
                scaleValueDisplay.textContent = value + '%';
            }
            
            if (selectedAreaIndex !== -1 && areas[selectedAreaIndex] && !areas[selectedAreaIndex].isCutout) {
                const area = areas[selectedAreaIndex];
                area.scale = value;
                
                // Store scale in memory for this stone type
                if (area.stone) {
                    stoneScaleMemory[area.stone] = value;
                    console.log(`Scale memory saved for stone: ${area.stone} = ${value}%`);
                }
                
                stonePatterns = {};
                drawCanvas();
            } else if (selectedSillIndex !== -1 && sills[selectedSillIndex]) {
                sills[selectedSillIndex].scale = value;
                drawCanvas();
            } else if (selectedBrickRowIndex !== -1 && brickRows[selectedBrickRowIndex]) {
                brickRows[selectedBrickRowIndex].scale = value;
                drawCanvas();
            } else if (selectedDecorationIndex !== -1 && decorations[selectedDecorationIndex]) {
                decorations[selectedDecorationIndex].size = value;
                drawCanvas();
            } else {
                GLOBAL_STONE_SCALE = value;
                stonePatterns = {};
                drawCanvas();
            }
        });
    }

    const sliders = [
        { id: 'rotation-slider', display: 'rotation-value', suffix: '°', property: 'rotation' },
        { id: 'horizontal-slider', display: 'horizontal-value', suffix: 'px', property: 'horizontalOffset' },
        { id: 'vertical-slider', display: 'vertical-value', suffix: 'px', property: 'verticalOffset' },
        { id: 'brightness-slider', display: 'brightness-value', suffix: '%', property: 'brightness' },
        { id: 'contrast-slider', display: 'contrast-value', suffix: '%', property: 'contrast' },
        { id: 'shadow-slider', display: 'shadow-value', suffix: '%', property: 'shadow' },
        { id: 'angle-3d-slider', display: 'angle-3d-value', suffix: '°', property: 'angle3d' },
        { id: 'perspective-angle-slider', display: 'perspective-angle-value', suffix: '°', property: 'perspectiveAngle' },
{ id: 'perspective-compression-slider', display: 'perspective-compression-value', suffix: '%', property: 'perspectiveCompression' },
        { id: 'depth-perspective-slider', display: 'depth-perspective-value', suffix: '%', property: 'depthPerspective' },
        { id: 'depth-intensity-slider', display: 'depth-intensity-value', suffix: 'px', property: 'depthIntensity' },
        { id: 'edge-protrusion-slider', display: 'edge-protrusion-value', suffix: 'px', property: 'edgeProtrusion' },
        { id: 'shadow-opacity-slider', display: 'shadow-opacity-value', suffix: '%', property: 'shadowOpacity' },
        { id: 'shadow-offset-slider', display: 'shadow-offset-value', suffix: 'px', property: 'shadowOffset' },
        { id: 'shadow-blur-slider', display: 'shadow-blur-value', suffix: 'px', property: 'shadowBlur' }
    ];

    sliders.forEach(slider => {
    const sliderEl = document.getElementById(slider.id);
    const displayEl = document.getElementById(slider.display);
    if (sliderEl && displayEl) {
        sliderEl.addEventListener('input', function() {
            displayEl.textContent = this.value + slider.suffix;
            
            const value = parseInt(this.value);
            
            if (selectedAreaIndex !== -1 && areas[selectedAreaIndex] && !areas[selectedAreaIndex].isCutout) {
                areas[selectedAreaIndex][slider.property] = value;
                if (slider.property === 'perspectiveAngle') {
                    stonePatterns = {};
                }
                drawCanvas();
            }
            
            if (selectedSillIndex !== -1 && sills[selectedSillIndex]) {
                sills[selectedSillIndex][slider.property] = value;
                drawCanvas();
            }
            
            if (selectedBrickRowIndex !== -1 && brickRows[selectedBrickRowIndex]) {
                brickRows[selectedBrickRowIndex][slider.property] = value;
                drawCanvas();
            }
            
            if (selectedDepthEdgeIndex !== -1 && depthEdges[selectedDepthEdgeIndex]) {
                if (slider.id === 'depth-intensity-slider') {
                    depthEdges[selectedDepthEdgeIndex].intensity = value;
                } else if (slider.id === 'edge-protrusion-slider') {
                    depthEdges[selectedDepthEdgeIndex].protrusion = value;
                } else if (slider.id === 'shadow-opacity-slider') {
                    depthEdges[selectedDepthEdgeIndex].shadowOpacity = value;
                } else if (slider.id === 'shadow-offset-slider') {
                    depthEdges[selectedDepthEdgeIndex].shadowOffset = value;
                } else if (slider.id === 'shadow-blur-slider') {
                    depthEdges[selectedDepthEdgeIndex].shadowBlur = value;
                }
                drawCanvas();
            }
            
            if (selectedDecorationIndex !== -1 && decorations[selectedDecorationIndex]) {
                decorations[selectedDecorationIndex][slider.property] = value;
                drawCanvas();
            }
            
            if (slider.id === 'edge-protrusion-slider') {
                if (selectedAreaIndex !== -1 && areas[selectedAreaIndex] && !areas[selectedAreaIndex].isCutout) {
                    areas[selectedAreaIndex].protrusion = value;
                    drawCanvas();
                }
            }
            
            if (slider.id === 'depth-intensity-slider') {
                depthEffectIntensity = value;
            }
            
            // Handle accent updates
            if (selectedAccentIndex !== -1 && accents[selectedAccentIndex]) {
                const accent = accents[selectedAccentIndex];
                accent[slider.property] = value;
                drawCanvas();
            }
        });
    }
});

    // Accent controls
    const accentThicknessSlider = document.getElementById('accent-thickness-slider');
    const accentThicknessValue = document.getElementById('accent-thickness-value');
    const accentColorPicker = document.getElementById('accent-color-picker');
    const accentOpacitySlider = document.getElementById('accent-opacity-slider');
    const accentOpacityValue = document.getElementById('accent-opacity-value');
    const accentShadowOpacitySlider = document.getElementById('accent-shadow-opacity-slider');
    const accentShadowOpacityValue = document.getElementById('accent-shadow-opacity-value');
    const accentShadowOffsetSlider = document.getElementById('accent-shadow-offset-slider');
    const accentShadowOffsetValue = document.getElementById('accent-shadow-offset-value');
    const accentShadowBlurSlider = document.getElementById('accent-shadow-blur-slider');
    const accentShadowBlurValue = document.getElementById('accent-shadow-blur-value');
    
    if (accentThicknessSlider && accentThicknessValue) {
    accentThicknessSlider.addEventListener('input', function() {
        const value = parseInt(this.value);
        accentThicknessValue.textContent = value + 'px';
        if (selectedAccentIndex !== -1 && accents[selectedAccentIndex]) {
            accents[selectedAccentIndex].thickness = value;
            drawCanvas();
        }
    });
}
    
    if (accentColorPicker) {
    accentColorPicker.addEventListener('input', function() {
        const value = this.value;
        currentFlashingColor = value;
        if (selectedAccentIndex !== -1 && accents[selectedAccentIndex]) {
            accents[selectedAccentIndex].color = value;
            drawCanvas();
        }
    });
}
    
    if (accentOpacitySlider && accentOpacityValue) {
        accentOpacitySlider.addEventListener('input', function() {
            const value = parseInt(this.value);
            accentOpacityValue.textContent = value + '%';
            if (selectedAccentIndex !== -1 && accents[selectedAccentIndex]) {
                accents[selectedAccentIndex].opacity = value;
                drawCanvas();
            }
        });
    }
    
    if (accentShadowOpacitySlider && accentShadowOpacityValue) {
        accentShadowOpacitySlider.addEventListener('input', function() {
            const value = parseInt(this.value);
            accentShadowOpacityValue.textContent = value + '%';
            if (selectedAccentIndex !== -1 && accents[selectedAccentIndex]) {
                accents[selectedAccentIndex].shadowOpacity = value;
                drawCanvas();
            }
        });
    }
    
    if (accentShadowOffsetSlider && accentShadowOffsetValue) {
        accentShadowOffsetSlider.addEventListener('input', function() {
            const value = parseInt(this.value);
            accentShadowOffsetValue.textContent = value + 'px';
            if (selectedAccentIndex !== -1 && accents[selectedAccentIndex]) {
                accents[selectedAccentIndex].shadowOffset = value;
                drawCanvas();
            }
        });
    }
    
    if (accentShadowBlurSlider && accentShadowBlurValue) {
        accentShadowBlurSlider.addEventListener('input', function() {
            const value = parseInt(this.value);
            accentShadowBlurValue.textContent = value + 'px';
            if (selectedAccentIndex !== -1 && accents[selectedAccentIndex]) {
                accents[selectedAccentIndex].shadowBlur = value;
                drawCanvas();
            }
        });
    }

const accentBringFrontBtn = document.getElementById('accent-bring-front');
    const accentSendBackBtn = document.getElementById('accent-send-back');
    
    if (accentBringFrontBtn) {
        accentBringFrontBtn.addEventListener('click', function() {
            if (selectedAccentIndex !== -1 && accents[selectedAccentIndex]) {
                accents[selectedAccentIndex].layer = 'front';
                updateAccentsList();
                enableAccentControls(accents[selectedAccentIndex]);
                drawCanvas();
                showMessage('Strip flashing moved to front layer.');
            }
        });
    }
    
    if (accentSendBackBtn) {
        accentSendBackBtn.addEventListener('click', function() {
            if (selectedAccentIndex !== -1 && accents[selectedAccentIndex]) {
                accents[selectedAccentIndex].layer = 'behind';
                updateAccentsList();
                enableAccentControls(accents[selectedAccentIndex]);
                drawCanvas();
                showMessage('Strip flashing moved to back layer.');
            }
        });
    }

    // Brick controls
    const brickColorSelect = document.getElementById('brick-color-select');
    const brickTextureSelect = document.getElementById('brick-texture-select');
    const brickRowHeightSlider = document.getElementById('brick-row-height-slider');
    const brickRowHeightValue = document.getElementById('brick-row-height-value');
    const brickMortarColorSelect = document.getElementById('brick-mortar-color-select');
    const brickMortarThicknessSlider = document.getElementById('brick-mortar-thickness-slider');
    const brickMortarThicknessValue = document.getElementById('brick-mortar-thickness-value');

    // Brick pattern selection
    const brickPatternSelect = document.getElementById('brick-pattern-select');
    if (brickPatternSelect) {
        brickPatternSelect.addEventListener('change', () => {
            currentBrickPattern = brickPatternSelect.value;
            if (selectedBrickRowIndex !== -1 && brickRows[selectedBrickRowIndex]) {
                brickRows[selectedBrickRowIndex].pattern = currentBrickPattern;
                drawCanvas();
            }
        });
    }

    // ADD THIS NEW CODE HERE:
    // Brick texture selection with Split Faced support
    if (brickTextureSelect) {
        brickTextureSelect.addEventListener('change', function() {
            currentBrickTexture = this.value;
            console.log('Brick texture changed to:', currentBrickTexture);
            
            // Apply to selected area if in brick mode
            if (selectedAreaIndex !== -1 && areas[selectedAreaIndex] && areas[selectedAreaIndex].textureMode === 'brick') {
                areas[selectedAreaIndex].brickTexture = currentBrickTexture;
                drawCanvas();
            }
            
            // Apply to selected brick row
            if (selectedBrickRowIndex !== -1 && brickRows[selectedBrickRowIndex]) {
                brickRows[selectedBrickRowIndex].texture = currentBrickTexture;
                drawCanvas();
            }
        });
    }

    
    
  // FIND your brick color event listener section and REPLACE it with this debug version:

// Enhanced brick color selection with custom color support
if (brickColorSelect) {
    brickColorSelect.addEventListener('change', () => {
        console.log('Brick color changed to:', brickColorSelect.value);
        const customBrickColorGroup = document.getElementById('custom-brick-color-group');
        
        if (brickColorSelect.value === 'custom') {
            customBrickColorGroup.style.display = 'block';
            currentBrickColor = 'custom';
        } else {
            customBrickColorGroup.style.display = 'none';
            currentBrickColor = brickColorSelect.value;
        }
        
        console.log('currentBrickColor set to:', currentBrickColor);
        
        // Apply to selected area using brick texture mode
        if (selectedAreaIndex !== -1 && areas[selectedAreaIndex] && areas[selectedAreaIndex].textureMode === 'brick') {
            console.log('Applying brick color to area:', selectedAreaIndex);
            console.log('Area before:', areas[selectedAreaIndex].brickColor);
            areas[selectedAreaIndex].brickColor = currentBrickColor;
            if (currentBrickColor === 'custom') {
                areas[selectedAreaIndex].customBrickColor = customBrickColor;
                console.log('Set custom brick color to:', customBrickColor);
            }
            console.log('Area after:', areas[selectedAreaIndex].brickColor);
            drawCanvas();
        } else {
            console.log('No valid area selected for brick color change');
            console.log('selectedAreaIndex:', selectedAreaIndex);
            if (areas[selectedAreaIndex]) {
                console.log('Area textureMode:', areas[selectedAreaIndex].textureMode);
            }
        }
        
        // Apply to selected brick row
        if (selectedBrickRowIndex !== -1 && brickRows[selectedBrickRowIndex]) {
            brickRows[selectedBrickRowIndex].color = currentBrickColor;
            if (currentBrickColor === 'custom') {
                brickRows[selectedBrickRowIndex].customColor = customBrickColor;
            }
            drawCanvas();
        }
    });
}

// FIND your existing brick event listeners section and ADD these RIGHT AFTER them:

// REPLACE your texture selection event listener with this debugging version:

// Texture selection with debugging
document.getElementById('brick-texture-select').addEventListener('change', function(e) {
    console.log('Texture selection changed to:', e.target.value);
    currentBrickTexture = e.target.value || null;
    console.log('currentBrickTexture set to:', currentBrickTexture);
    console.log('Available loaded textures:', Object.keys(loadedTextures));
    
    // Apply to selected area using brick texture mode
    if (selectedAreaIndex !== -1 && areas[selectedAreaIndex] && areas[selectedAreaIndex].textureMode === 'brick') {
        areas[selectedAreaIndex].brickTexture = currentBrickTexture;
        console.log('Applied texture to area:', selectedAreaIndex);
        drawCanvas();
    }
    
    // Apply to selected brick row
    if (selectedBrickRowIndex !== -1 && brickRows[selectedBrickRowIndex]) {
        brickRows[selectedBrickRowIndex].texture = currentBrickTexture;
        console.log('Applied texture to brick row:', selectedBrickRowIndex);
        drawCanvas();
    }
    
    if (selectedAreaIndex === -1 && selectedBrickRowIndex === -1) {
        console.log('No area or brick row selected - texture will apply to next drawn element');
    }
});

// Load default texture images
const defaultTextures = {
    'coated': 'Images/Brick Textures/Coated.jpg',
    'matte': 'Images/Brick Textures/Matte.jpg', 
    'antique': 'Images/Brick Textures/Antique.jpg',
    'ruff': 'Images/Brick Textures/Ruff.jpg',
    'scratch': 'Images/Brick Textures/Scratch.jpg',
    'splitfaced': 'Images/Brick Textures/Splitfaced.jpg'
};

// Load all default textures at startup
function loadDefaultTextures() {
    Object.keys(defaultTextures).forEach(textureName => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            loadedTextures[textureName] = img;
            console.log(`Loaded default texture: ${textureName}`);
        };
        img.onerror = function() {
            console.warn(`Failed to load default texture: ${textureName}`);
        };
        img.src = defaultTextures[textureName];
    });
}

// Texture selection
document.getElementById('brick-texture-select').addEventListener('change', function(e) {
    currentBrickTexture = e.target.value;
    
// 'smooth' means no texture (null), others use the loaded texture
if (currentBrickTexture === 'smooth') {
    currentBrickTexture = null;
}
// DEBUG: Check if texture exists
    console.log('Selected texture:', currentBrickTexture);
    console.log('Texture exists in loadedTextures:', !!loadedTextures[currentBrickTexture]);
    console.log('Available textures:', Object.keys(loadedTextures));
    if (currentBrickTexture && loadedTextures[currentBrickTexture]) {
        console.log('Texture image loaded:', loadedTextures[currentBrickTexture].width, 'x', loadedTextures[currentBrickTexture].height);
    }
    
    // Apply to selected area using brick texture mode
    if (selectedAreaIndex !== -1 && areas[selectedAreaIndex] && areas[selectedAreaIndex].textureMode === 'brick') {
        areas[selectedAreaIndex].brickTexture = currentBrickTexture;
        drawCanvas();
    }
    
    // Apply to selected brick row
    if (selectedBrickRowIndex !== -1 && brickRows[selectedBrickRowIndex]) {
        brickRows[selectedBrickRowIndex].texture = currentBrickTexture;
        drawCanvas();
    }
});

document.getElementById('texture-intensity-slider').addEventListener('input', function(e) {
    const value = e.target.value;
    document.getElementById('texture-intensity-value').textContent = value + '%';
    
    // Apply to selected area using brick texture mode
    if (selectedAreaIndex !== -1 && areas[selectedAreaIndex] && areas[selectedAreaIndex].textureMode === 'brick') {
        areas[selectedAreaIndex].textureIntensity = value / 100;
        drawCanvas();
    }
    
    // Apply to selected brick row
    if (selectedBrickRowIndex !== -1 && brickRows[selectedBrickRowIndex]) {
        brickRows[selectedBrickRowIndex].textureIntensity = value / 100;
        drawCanvas();
    }
});

// ADD this with your other texture event listeners:

document.getElementById('texture-contrast-slider').addEventListener('input', function(e) {
    const value = e.target.value;
    document.getElementById('texture-contrast-value').textContent = value + '%';
    
    // Apply to selected area using brick texture mode
    if (selectedAreaIndex !== -1 && areas[selectedAreaIndex] && areas[selectedAreaIndex].textureMode === 'brick') {
        areas[selectedAreaIndex].textureContrast = value / 100;
        drawCanvas();
    }
    
    // Apply to selected brick row
    if (selectedBrickRowIndex !== -1 && brickRows[selectedBrickRowIndex]) {
        brickRows[selectedBrickRowIndex].textureContrast = value / 100;
        drawCanvas();
    }
});
// ADD this right after your texture contrast event listener:

document.getElementById('texture-scale-slider').addEventListener('input', function(e) {
    const value = e.target.value;
    document.getElementById('texture-scale-value').textContent = value + '%';
    
    // Apply to selected area using brick texture mode
    if (selectedAreaIndex !== -1 && areas[selectedAreaIndex] && areas[selectedAreaIndex].textureMode === 'brick') {
        areas[selectedAreaIndex].textureScale = value;
        drawCanvas();
    }
    
    // Apply to selected brick row
    if (selectedBrickRowIndex !== -1 && brickRows[selectedBrickRowIndex]) {
        brickRows[selectedBrickRowIndex].textureScale = value;
        drawCanvas();
    }
});

// REPLACE your texture upload event listener with this debugging version:

// Custom texture upload with debugging
document.getElementById('texture-upload').addEventListener('change', function(e) {
    console.log('Texture upload triggered');
    const file = e.target.files[0];
    if (file) {
        console.log('File selected:', file.name, 'Size:', file.size);
        const reader = new FileReader();
        reader.onload = function(e) {
            console.log('File read successfully, starting texture load...');
            // Load the uploaded texture
            loadTexture(e.target.result, 'custom-uploaded').then(() => {
                console.log('Texture loaded successfully!');
                // Add to texture list if not already there
                const customOption = document.querySelector('option[value="custom-uploaded"]');
                if (!customOption) {
                    console.log('Adding custom option to dropdown');
                    const option = document.createElement('option');
                    option.value = 'custom-uploaded';
                    option.textContent = 'Custom Uploaded';
                    document.getElementById('brick-texture-select').appendChild(option);
                } else {
                    console.log('Custom option already exists');
                }
                
                // Select the uploaded texture
                document.getElementById('brick-texture-select').value = 'custom-uploaded';
                currentBrickTexture = 'custom-uploaded';
                console.log('Texture selected:', currentBrickTexture);
                
                // Apply to selected area using brick texture mode
                if (selectedAreaIndex !== -1 && areas[selectedAreaIndex] && areas[selectedAreaIndex].textureMode === 'brick') {
                    areas[selectedAreaIndex].brickTexture = currentBrickTexture;
                    console.log('Applied texture to area');
                    drawCanvas();
                }
                
                // Apply to selected brick row
                if (selectedBrickRowIndex !== -1 && brickRows[selectedBrickRowIndex]) {
                    brickRows[selectedBrickRowIndex].texture = currentBrickTexture;
                    console.log('Applied texture to brick row');
                    drawCanvas();
                }
                
                console.log('Loaded textures:', Object.keys(loadedTextures));
            }).catch(err => {
                console.error('Error loading texture:', err);
                alert('Error loading texture image. Please try a different image.');
            });
        };
        reader.readAsDataURL(file);
    } else {
        console.log('No file selected');
    }
});
// Custom brick color picker - INSTANT COLOR CHANGE FOR BOTH AREAS AND BRICK ROWS
const customBrickColorPicker = document.getElementById('custom-brick-color-picker');
if (customBrickColorPicker) {
    customBrickColorPicker.addEventListener('input', () => {
        customBrickColor = customBrickColorPicker.value;
        
        // Apply to selected area using brick texture mode immediately
        if (selectedAreaIndex !== -1 && areas[selectedAreaIndex] && areas[selectedAreaIndex].textureMode === 'brick') {
            areas[selectedAreaIndex].customBrickColor = customBrickColor;
            drawCanvas();
        }
        
        // Apply to selected brick row immediately
        if (selectedBrickRowIndex !== -1 && brickRows[selectedBrickRowIndex]) {
            brickRows[selectedBrickRowIndex].customColor = customBrickColor;
            drawCanvas();
        }
    });
}
// ADD this code right after the custom brick color picker section:

// Enhanced mortar color selection with custom color support
if (brickMortarColorSelect) {
    brickMortarColorSelect.addEventListener('change', () => {
        const customMortarColorGroup = document.getElementById('custom-mortar-color-group');
        
        if (brickMortarColorSelect.value === 'custom') {
            customMortarColorGroup.style.display = 'block';
            currentBrickMortarColor = 'custom';
        } else {
            customMortarColorGroup.style.display = 'none';
            currentBrickMortarColor = brickMortarColorSelect.value;
        }
        
        // Apply to selected area using brick texture mode
        if (selectedAreaIndex !== -1 && areas[selectedAreaIndex] && areas[selectedAreaIndex].textureMode === 'brick') {
            areas[selectedAreaIndex].brickMortarColor = currentBrickMortarColor;
            if (currentBrickMortarColor === 'custom') {
                areas[selectedAreaIndex].customMortarColor = customMortarColor;
            }
            drawCanvas();
        }
        
        // Apply to selected brick row
        if (selectedBrickRowIndex !== -1 && brickRows[selectedBrickRowIndex]) {
            brickRows[selectedBrickRowIndex].mortarColor = currentBrickMortarColor;
            if (currentBrickMortarColor === 'custom') {
                brickRows[selectedBrickRowIndex].customMortarColor = customMortarColor;
            }
            drawCanvas();
        }
    });
}

// Custom mortar color picker - INSTANT COLOR CHANGE FOR BOTH AREAS AND BRICK ROWS
const customMortarColorPicker = document.getElementById('custom-mortar-color-picker');
if (customMortarColorPicker) {
    customMortarColorPicker.addEventListener('input', () => {
        customMortarColor = customMortarColorPicker.value;
        
        // Apply to selected area using brick texture mode immediately
        if (selectedAreaIndex !== -1 && areas[selectedAreaIndex] && areas[selectedAreaIndex].textureMode === 'brick') {
            areas[selectedAreaIndex].customMortarColor = customMortarColor;
            drawCanvas();
        }
        
        // Apply to selected brick row immediately
        if (selectedBrickRowIndex !== -1 && brickRows[selectedBrickRowIndex]) {
            brickRows[selectedBrickRowIndex].customMortarColor = customMortarColor;
            drawCanvas();
        }
    });
}

if (brickTextureSelect) {
    brickTextureSelect.addEventListener('change', () => { 
        currentBrickTexture = brickTextureSelect.value;
        if (selectedAreaIndex !== -1 && areas[selectedAreaIndex] && areas[selectedAreaIndex].textureMode === 'brick') {
            areas[selectedAreaIndex].brickTexture = currentBrickTexture;
            drawCanvas();
        }
        if (selectedBrickRowIndex !== -1 && brickRows[selectedBrickRowIndex]) {
            brickRows[selectedBrickRowIndex].texture = currentBrickTexture;
            drawCanvas();
        }
    });
}
    if (brickRowHeightSlider && brickRowHeightValue) {
        brickRowHeightSlider.addEventListener('input', function() {
            brickRowHeight = parseInt(this.value);
            brickRowHeightValue.textContent = this.value + 'px';
            if (selectedAreaIndex !== -1 && areas[selectedAreaIndex] && areas[selectedAreaIndex].textureMode === 'brick') {
                areas[selectedAreaIndex].brickRowHeight = brickRowHeight;
                drawCanvas();
            }
            if (selectedBrickRowIndex !== -1 && brickRows[selectedBrickRowIndex]) {
                brickRows[selectedBrickRowIndex].height = brickRowHeight;
                drawCanvas();
            }
        });
    }

    if (brickMortarThicknessSlider && brickMortarThicknessValue) {
        brickMortarThicknessSlider.addEventListener('input', function() {
            brickMortarThickness = parseInt(this.value);
            brickMortarThicknessValue.textContent = this.value + 'px';
            if (selectedAreaIndex !== -1 && areas[selectedAreaIndex] && areas[selectedAreaIndex].textureMode === 'brick') {
                areas[selectedAreaIndex].brickMortarThickness = brickMortarThickness;
                drawCanvas();
            }
            if (selectedBrickRowIndex !== -1 && brickRows[selectedBrickRowIndex]) {
                brickRows[selectedBrickRowIndex].mortarThickness = brickMortarThickness;
                drawCanvas();
            }
        });
    }
}

    // Decoration controls
    const decorationOpacitySlider = document.getElementById('decoration-opacity-slider');
    const decorationOpacityValue = document.getElementById('decoration-opacity-value');
    const decorationBringFrontBtn = document.getElementById('decoration-bring-front');
    const decorationSendBackBtn = document.getElementById('decoration-send-back');
    
    if (decorationOpacitySlider && decorationOpacityValue) {
        decorationOpacitySlider.addEventListener('input', function() {
            const value = parseInt(this.value);
            decorationOpacityValue.textContent = value + '%';
            if (selectedDecorationIndex !== -1 && decorations[selectedDecorationIndex]) {
                decorations[selectedDecorationIndex].opacity = value;
                drawCanvas();
            }
        });
    }
    
    if (decorationBringFrontBtn) {
        decorationBringFrontBtn.addEventListener('click', function() {
            if (selectedDecorationIndex !== -1 && decorations[selectedDecorationIndex]) {
                decorations[selectedDecorationIndex].layer = 'front';
                updateDecorationsList();
                enableDecorationControls(decorations[selectedDecorationIndex]);
                drawCanvas();
                showMessage('Decoration moved to front layer.');
            }
        });
    }
    
    if (decorationSendBackBtn) {
        decorationSendBackBtn.addEventListener('click', function() {
            if (selectedDecorationIndex !== -1 && decorations[selectedDecorationIndex]) {
                decorations[selectedDecorationIndex].layer = 'behind';
                updateDecorationsList();
                enableDecorationControls(decorations[selectedDecorationIndex]);
                drawCanvas();
                showMessage('Decoration moved to back layer.');
            }
        });
    }

   

function initializeFilters() {
    console.log('Initializing filters...');
    
    Object.keys(filterOptions).forEach(filterType => {
        const select = document.querySelector(`[data-filter="${filterType}"]`);
        if (select) {
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            
            filterOptions[filterType].forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                select.appendChild(optionElement);
            });
            console.log(`Filter ${filterType} populated with ${filterOptions[filterType].length} options`);
        } else {
            console.warn(`Filter select for ${filterType} not found`);
        }
    });
}

function updateResultsCount() {
    const resultsCount = document.getElementById('results-count');
    if (!resultsCount) return;
    
    const totalStones = Object.keys(stoneData).length;
    
    if (Object.keys(activeFilters).length > 0) {
        let totalMatchingColors = 0;
        filteredStones.forEach(stoneName => {
            const colors = stoneData[stoneName];
            if (activeFilters.Color) {
                Object.keys(colors).forEach(colorName => {
                    if (getStoneColor(stoneName, colorName) === activeFilters.Color) {
                        totalMatchingColors++;
                    }
                });
            } else {
                totalMatchingColors += Object.keys(colors).length;
            }
        });
        
        resultsCount.textContent = `${filteredStones.length} stone types (${totalMatchingColors} color options) match your filters`;
    } else {
        resultsCount.textContent = `${totalStones} stone profiles available`;
    }
}

function updateActiveFiltersDisplay() {
    const activeFiltersContainer = document.getElementById('active-filters');
    if (!activeFiltersContainer) return;
    
    activeFiltersContainer.innerHTML = '';
    
    Object.entries(activeFilters).forEach(([filterType, filterValue]) => {
        const filterTag = document.createElement('div');
        filterTag.className = 'filter-tag';
        filterTag.innerHTML = `
            ${filterType}: ${filterValue}
            <span class="remove-filter" data-filter="${filterType}">×</span>
        `;
        activeFiltersContainer.appendChild(filterTag);
    });
}

function clearAllFilters() {
    console.log('Clearing all filters');
    
    activeFilters = {};
    filteredStones = [];
    
    document.querySelectorAll('.filter-select').forEach(select => {
        select.value = '';
        select.classList.remove('active');
    });
    
    updateMaterialDisplay();
    updateResultsCount();
    updateActiveFiltersDisplay();
    
    if (typeof showMessage === 'function') {
        showMessage('All filters cleared');
    }
}

function setupFilterEventListeners() {
    console.log('Setting up filter event listeners...');
    
    document.querySelectorAll('.filter-select').forEach(select => {
        select.addEventListener('change', function() {
            const filterType = this.dataset.filter;
            const filterValue = this.value;
            
            console.log(`Filter changed - ${filterType}: ${filterValue}`);
            
            if (filterValue) {
                activeFilters[filterType] = filterValue;
                this.classList.add('active');
            } else {
                delete activeFilters[filterType];
                this.classList.remove('active');
            }
            
            applyFilters();
        });
    });
    
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
    
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-filter')) {
            const filterType = e.target.dataset.filter;
            console.log(`Removing filter: ${filterType}`);
            
            delete activeFilters[filterType];
            
            const select = document.querySelector(`[data-filter="${filterType}"]`);
            if (select) {
                select.value = '';
                select.classList.remove('active');
            }
            
            applyFilters();
        }
    });
}

// Setup functions
function setupUploadListeners() {
    // Single smart upload button
    const uploadHouseBtn = document.getElementById('upload-house-btn');
    const houseUpload = document.getElementById('house-upload');
    
    if (uploadHouseBtn && houseUpload) {
        uploadHouseBtn.addEventListener('click', () => houseUpload.click());
        houseUpload.addEventListener('change', function(e) {
            handleSmartHouseUpload(e);
        });
    }
}

function handleSmartHouseUpload(e) {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (!file.type.startsWith('image/')) { 
            showMessage('Please select an image file'); 
            return; 
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                // Auto-detect orientation
                const isLandscape = img.naturalWidth > img.naturalHeight;
                const orientation = isLandscape ? 'landscape' : 'portrait';
                
                // Set canvas orientation based on image
                setCanvasOrientation(orientation);
                
                // Add to house selector dropdown
                const houseSelect = document.getElementById('house-select');
                if (houseSelect) {
                    const option = document.createElement('option');
                    option.value = event.target.result;
                    option.textContent = `Custom ${orientation.charAt(0).toUpperCase() + orientation.slice(1)} ${nextCustomHouseId++}`;
                    houseSelect.appendChild(option);
                    houseSelect.value = event.target.result;
                }
                
                // Load the image
                loadHouseImage(event.target.result);
                
                // Clear all elements when uploading new house
                areas = [];
                depthEdges = [];
                sills = [];
                brickRows = [];
                decorations = [];
                selectedAreaIndex = -1;
                selectedDepthEdgeIndex = -1;
                selectedSillIndex = -1;
                selectedBrickRowIndex = -1;
                selectedDecorationIndex = -1;
                
                updateAreasList();
                updateDepthList();
                updateSillsList();
                updateBrickRowsList();
                updateDecorationsList();
                stonePatterns = {};
                processedSingleImages = {};
                disableMainAreaControls();
                resetSlidersToDefaults();
                drawCanvas();
                
                showMessage(`${orientation.charAt(0).toUpperCase() + orientation.slice(1)} image uploaded and canvas adjusted automatically.`);
            };
            img.onerror = function() { 
                showMessage("Error processing uploaded house image."); 
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
        e.target.value = ''; 
    }
}
    
    // Portrait upload button
    const uploadPortraitBtn = document.getElementById('upload-portrait-btn');
    const houseUploadPortrait = document.getElementById('house-upload-portrait');
    
    if (uploadPortraitBtn && houseUploadPortrait) {
        uploadPortraitBtn.addEventListener('click', () => houseUploadPortrait.click());
        houseUploadPortrait.addEventListener('change', function(e) {
            handleHouseUpload(e, 'portrait');
        });
    }


function handleHouseUpload(e, orientation) {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (!file.type.startsWith('image/')) { 
            showMessage('Please select an image file'); 
            return; 
        }
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                // Set canvas orientation based on upload type
                setCanvasOrientation(orientation);
                
                // Add to house selector dropdown
                const houseSelect = document.getElementById('house-select');
                if (houseSelect) {
                    const option = document.createElement('option');
                    option.value = event.target.result;
                    option.textContent = `Custom ${orientation.charAt(0).toUpperCase() + orientation.slice(1)} ${nextCustomHouseId++}`;
                    houseSelect.appendChild(option);
                    houseSelect.value = event.target.result;
                }
                
                // Load the image
                loadHouseImage(event.target.result);
                
                // Clear all elements when uploading new house
                areas = [];
                depthEdges = [];
                sills = [];
                brickRows = [];
                decorations = [];
                selectedAreaIndex = -1;
                selectedDepthEdgeIndex = -1;
                selectedSillIndex = -1;
                selectedBrickRowIndex = -1;
                selectedDecorationIndex = -1;
                
                updateAreasList();
                updateDepthList();
                updateSillsList();
                updateBrickRowsList();
                updateDecorationsList();
                stonePatterns = {};
                processedSingleImages = {};
                disableMainAreaControls();
                resetSlidersToDefaults();
                drawCanvas();
            };
            img.onerror = function() { 
                showMessage("Error processing uploaded house image."); 
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
        e.target.value = ''; 
    }
}

function setupMaterialPanel() {
    // Tab switching - UPDATED TO CONTROL PANEL VISIBILITY
const materialTabs = document.querySelectorAll('.material-tab');
const materialCategories = document.querySelectorAll('.material-category');
const materialPanel = document.querySelector('.material-selection-panel');

materialTabs.forEach(tab => {
    tab.addEventListener('click', function() {
        const categoryId = this.dataset.category + '-category';
        
        // Remove active from all tabs and categories
        materialTabs.forEach(t => t.classList.remove('active'));
        materialCategories.forEach(cat => cat.classList.remove('active'));
        
        // Activate clicked tab and corresponding category
        this.classList.add('active');
        const targetCategory = document.getElementById(categoryId);
        if (targetCategory) targetCategory.classList.add('active');
        
        // Show the entire material panel when any tab is clicked
        if (materialPanel) {
            materialPanel.classList.add('active');
        }
    });
    // Manufacturer dropdown functionality
const manufacturerSelect = document.getElementById('manufacturer-select');
if (manufacturerSelect) {
    manufacturerSelect.addEventListener('change', function() {
        handleManufacturerChange(this.value);
    });
    // Trigger on page load
handleManufacturerChange('eldorado-stone');
}

// NEW: Thin Brick manufacturer dropdown functionality
const thinBrickManufacturerSelect = document.getElementById('thin-brick-manufacturer-select');
if (thinBrickManufacturerSelect) {
    thinBrickManufacturerSelect.addEventListener('change', function() {
        handleThinBrickManufacturerChange(this.value);
    });
    // Initialize with default manufacturer
    handleThinBrickManufacturerChange('interstate-brick');
}

function handleThinBrickManufacturerChange(manufacturer) {
    // Hide all thin brick manufacturer views
    const dutchQualityThinBrickView = document.getElementById('dutch-quality-thin-brick-view');
    const endicottView = document.getElementById('endicott-view');
    const glenGeryView = document.getElementById('glen-gery-view');
    const hebronView = document.getElementById('hebron-brick-view');
    const kingKlinkerView = document.getElementById('king-klinker-view');
    const hcMuddoxView = document.getElementById('hc-muddox-view');
    const interstateView = document.getElementById('interstate-brick-view');
    
    if (dutchQualityThinBrickView) dutchQualityThinBrickView.classList.remove('active');
    if (endicottView) endicottView.classList.remove('active');
    if (glenGeryView) glenGeryView.classList.remove('active');
    if (hebronView) hebronView.classList.remove('active');
    if (kingKlinkerView) kingKlinkerView.classList.remove('active');
    if (hcMuddoxView) hcMuddoxView.classList.remove('active');
    if (interstateView) interstateView.classList.remove('active');
    
    // Show the selected manufacturer view
    const selectedView = document.getElementById(`${manufacturer}-view`);
    if (selectedView) {
        selectedView.classList.add('active');
    }
    
    console.log('Thin Brick manufacturer changed to:', manufacturer);
}

// NEW: Full Brick manufacturer dropdown functionality
const fullBrickManufacturerSelect = document.getElementById('full-brick-manufacturer-select');
if (fullBrickManufacturerSelect) {
    fullBrickManufacturerSelect.addEventListener('change', function() {
        console.log('Full Brick manufacturer changed to:', this.value);
    });
}

// Profile tab functionality for individual manufacturer views
document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        const manufacturer = this.closest('.manufacturer-view').id.replace('-view', '');
        const profile = this.dataset.profile;
        
        // Remove active from all profile tabs in this manufacturer
        this.closest('.profile-tabs').querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        // Get the container
        const container = this.closest('.manufacturer-view').querySelector('.material-grid-container');
        
        // CRITICAL: Hide ALL grids first (both main grid and all profile groups)
        const allGrid = container.querySelector('.material-grid');
        const allProfileGroups = container.querySelectorAll('.profile-group');
        
        // Hide the main "all" grid
        if (allGrid) {
            allGrid.classList.remove('active');
            allGrid.style.display = 'none';
        }
        
        // Hide all profile-specific grids
        allProfileGroups.forEach(group => {
            group.classList.remove('active');
            group.style.display = 'none';
        });

        // Now show ONLY what we need
        if (profile === 'all') {
            // Show the main grid with all stones
            if (allGrid) {
                allGrid.classList.add('active');
                allGrid.style.display = 'flex';
            }
        } else {
            // Show ONLY the specific profile grid - all other stones stay hidden
            const targetGroup = container.querySelector(`.profile-group[data-profile="${profile}"]`);
            if (targetGroup) {
                targetGroup.classList.add('active');
                targetGroup.style.display = 'flex';
            }
        }
    });
});

function handleManufacturerChange(manufacturer) {
    const allProfilesView = document.getElementById('all-profiles-view');
    const eldoradoView = document.getElementById('eldorado-stone-view');
    const casaView = document.getElementById('casa-di-sassi-view');
    const dutchQualityView = document.getElementById('dutch-quality-view');
    const rockyMountainView = document.getElementById('rocky-mountain-stoneworks-view');
    const uploadSection = document.getElementById('stone-upload-section');
    
    // Hide all views first
    allProfilesView.classList.remove('active');
    eldoradoView.classList.remove('active');
    casaView.classList.remove('active');
    if (dutchQualityView) dutchQualityView.classList.remove('active');
    if (rockyMountainView) rockyMountainView.classList.remove('active');
    
    if (manufacturer === 'all') {
        allProfilesView.classList.add('active');
        // Show all manufacturer sections
        document.querySelectorAll('.manufacturer-section').forEach(section => {
            section.style.display = 'block';
        });
    } else if (manufacturer === 'eldorado-stone') {
        eldoradoView.classList.add('active');
        // Reset to show all profiles by default
        eldoradoView.querySelectorAll('.profile-tab').forEach(tab => tab.classList.remove('active'));
        eldoradoView.querySelector('.profile-tab[data-profile="all"]').classList.add('active');
        eldoradoView.querySelectorAll('.material-grid, .profile-group').forEach(group => {
            group.classList.remove('active');
        });
        eldoradoView.querySelector('.material-grid').classList.add('active');
    } else if (manufacturer === 'casa-di-sassi') {
        casaView.classList.add('active');
        // Reset to show all profiles by default
        casaView.querySelectorAll('.profile-tab').forEach(tab => tab.classList.remove('active'));
        casaView.querySelector('.profile-tab[data-profile="all"]').classList.add('active');
        casaView.querySelectorAll('.material-grid, .profile-group').forEach(group => {
            group.classList.remove('active');
        });
        casaView.querySelector('.material-grid').classList.add('active');
   } else if (manufacturer === 'dutch-quality') {
        if (dutchQualityView) {
            dutchQualityView.classList.add('active');
            // Reset to show all profiles by default
            dutchQualityView.querySelectorAll('.profile-tab').forEach(tab => tab.classList.remove('active'));
            dutchQualityView.querySelector('.profile-tab[data-profile="all"]').classList.add('active');
            dutchQualityView.querySelectorAll('.material-grid, .profile-group').forEach(group => {
                group.classList.remove('active');
            });
            dutchQualityView.querySelector('.material-grid').classList.add('active');
        }
    } else if (manufacturer === 'rocky-mountain-stoneworks') {
        if (rockyMountainView) {
            rockyMountainView.classList.add('active');
            // Reset to show all profiles by default
            rockyMountainView.querySelectorAll('.profile-tab').forEach(tab => tab.classList.remove('active'));
            rockyMountainView.querySelector('.profile-tab[data-profile="all"]').classList.add('active');
            rockyMountainView.querySelectorAll('.material-grid, .profile-group').forEach(group => {
                group.classList.remove('active');
            });
            rockyMountainView.querySelector('.material-grid').classList.add('active');
        }
    }
    
    // Always show upload section
    uploadSection.style.display = 'flex';
}
});



// Add click outside to hide panel (FIXED - removed duplicate and improved)
document.addEventListener('click', function(e) {
    const materialPanel = document.querySelector('.material-selection-panel');
    const clickedInsidePanel = e.target.closest('.material-selection-panel');
    const clickedOnTab = e.target.closest('.material-tab');
    const clickedOnMaterial = e.target.closest('.material-item');
    const clickedOnCanvas = e.target.closest('.canvas-container, #main-canvas');
    
    // Hide panel if clicking outside panel, OR clicking on canvas/areas
    if ((!clickedInsidePanel && !clickedOnTab && !clickedOnMaterial) || clickedOnCanvas) {
        if (materialPanel && materialPanel.classList.contains('active')) {
            materialPanel.classList.remove('active');
            // Also remove active state from all tabs
            const materialTabs = document.querySelectorAll('.material-tab');
            materialTabs.forEach(t => t.classList.remove('active'));
        }
    }
});

// Add ESC key to close material panel
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const materialPanel = document.querySelector('.material-selection-panel');
        if (materialPanel && materialPanel.classList.contains('active')) {
            materialPanel.classList.remove('active');
            document.querySelectorAll('.material-tab').forEach(t => t.classList.remove('active'));
        }
    }
});
// Initialize panel as hidden
if (materialPanel) {
    materialPanel.classList.remove('active');
}

    // Accent type selection
const accentItems = document.querySelectorAll('.accent-item');
accentItems.forEach(accentItem => {
    accentItem.addEventListener('click', function() {
        // Remove selection from all accent items
        accentItems.forEach(item => item.classList.remove('selected'));
        
        // Select this accent item
        this.classList.add('selected');
        
        // Set the current accent type
        currentAccentType = this.dataset.accentType;
        
        // IMMEDIATELY activate accent drawing mode
        clearAllActiveButtons();
        isDrawingAccent = true;
        isDrawingArea = false;
        isSubtractMode = false;
        isDrawingDepthEdge = false;
        isDrawingSill = false;
        isDrawingBrickRow = false;
        isAddingDecoration = false;
        isInDrawingMode = true;
        selectedAreaIndex = -1;
        selectedDepthEdgeIndex = -1;
        selectedSillIndex = -1;
        selectedBrickRowIndex = -1;
        selectedDecorationIndex = -1;
        updateAreasList();
        updateDepthList();
        updateSillsList();
        updateBrickRowsList();
        updateDecorationsList();
        disableMainAreaControls();
        currentAccentPoints = [];
        
        // Update the message based on accent type
        const accentInfo = ACCENT_TYPES[currentAccentType];
        if (accentInfo) {
            if (accentInfo.drawingMethod === 'line') {
                showMessage(`${accentInfo.name} activated. Click two points to draw a line.`);
            } else if (accentInfo.drawingMethod === 'area') {
                showMessage(`${accentInfo.name} activated. Click points to draw area. Double-click to finish.`);
            }
        }
        
        drawCanvas();
    });
});
    

function loadStonesByManufacturer() {
    console.log('loadStonesByManufacturer function started!');
    // Load into all profiles view sections
    STONE_MATERIALS.forEach(material => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function() {
            stoneImages[material.url] = img;
        };
        img.src = material.url;
        
        // Add to appropriate profile section in all-profiles view
        const profileContainer = document.getElementById(`${material.manufacturer.replace('-', '-')}-${material.profile.replace('-', '-')}-colors`);
        if (profileContainer) {
            const item = createMaterialThumbnail(material.url, material.name, 'stone');
            profileContainer.appendChild(item);
        }
        
        // Add to individual manufacturer grids
        if (material.manufacturer === 'eldorado-stone') {
            // Add to Eldorado all grid
            const eldoradoAllGrid = document.getElementById('eldorado-all-grid');
            if (eldoradoAllGrid) {
                const item = createMaterialThumbnail(material.url, material.name, 'stone');
                eldoradoAllGrid.appendChild(item);
            }
            
            // Add to specific profile grid
            console.log('Processing Eldorado material:', material.name, 'Profile:', material.profile);
            const profileGrid = document.getElementById(`eldorado-${material.profile}-grid`);
            console.log('Looking for grid ID:', `eldorado-${material.profile}-grid`);
            console.log('Found grid element:', profileGrid);
            if (profileGrid) {
                const item = createMaterialThumbnail(material.url, material.name, 'stone');
                profileGrid.appendChild(item);
            } else {
                console.log('ERROR: Could not find grid element!');
            }
        } else if (material.manufacturer === 'casa-di-sassi') {
            // Add to Casa all grid
            const casaAllGrid = document.getElementById('casa-all-grid');
            if (casaAllGrid) {
                const item = createMaterialThumbnail(material.url, material.name, 'stone');
                casaAllGrid.appendChild(item);
            }
            
            // Add to specific profile grid - FIXED: Handle both old and new profile naming
            let profileGridId;
            
            // Handle legacy profiles (ez-ledge, volterra) vs new profiles (casa-blend, casa-brick, etc.)
            if (material.profile === 'ez-ledge' || material.profile === 'volterra') {
                profileGridId = `casa-${material.profile}-grid`;
            } else {
                // For new profiles that already have 'casa-' prefix in the profile name
                profileGridId = `${material.profile}-grid`;
            }
            
            console.log('Processing Casa material:', material.name, 'Profile:', material.profile);
            console.log('Looking for Casa grid ID:', profileGridId);
            
            const profileGrid = document.getElementById(profileGridId);
            console.log('Found Casa grid element:', profileGrid);
            
            if (profileGrid) {
                const item = createMaterialThumbnail(material.url, material.name, 'stone');
                profileGrid.appendChild(item);
            } else {
                console.log('ERROR: Could not find Casa grid element for ID:', profileGridId);
            }
        } else if (material.manufacturer === 'rocky-mountain-stoneworks') {
            // Add to Rocky Mountain all grid
            const rockyMountainAllGrid = document.getElementById('rocky-mountain-all-grid');
            if (rockyMountainAllGrid) {
                const item = createMaterialThumbnail(material.url, material.name, 'stone');
                rockyMountainAllGrid.appendChild(item);
            }
            
            // Add to specific profile grid
            console.log('Processing Rocky Mountain material:', material.name, 'Profile:', material.profile);
            const profileGrid = document.getElementById(`rocky-mountain-${material.profile}-grid`);
            console.log('Looking for Rocky Mountain grid ID:', `rocky-mountain-${material.profile}-grid`);
            console.log('Found Rocky Mountain grid element:', profileGrid);
            if (profileGrid) {
                const item = createMaterialThumbnail(material.url, material.name, 'stone');
                profileGrid.appendChild(item);
            } else {
                console.log('ERROR: Could not find Rocky Mountain grid element!');
            }
        }
    }); // <-- FIXED: This closes the STONE_MATERIALS.forEach loop

    // Load Dutch Quality stones
    DUTCH_QUALITY_MATERIALS.forEach(material => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function() {
            stoneImages[material.url] = img;
        };
        img.src = material.url;
        
        // Add to Dutch Quality all grid
        const dutchQualityAllGrid = document.getElementById('dutch-quality-all-grid');
        if (dutchQualityAllGrid) {
            const item = createMaterialThumbnail(material.url, material.name, 'stone');
            dutchQualityAllGrid.appendChild(item);
        }
        
        // Add to specific profile grid
        const profileGridId = `dutch-quality-${material.profile}-grid`;
        const profileGrid = document.getElementById(profileGridId);
        if (profileGrid) {
            const item = createMaterialThumbnail(material.url, material.name, 'stone');
            profileGrid.appendChild(item);
        }
    });

    // Load Dutch Quality Thin Brick materials
    DUTCH_QUALITY_THIN_BRICK_MATERIALS.forEach(material => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function() {
            stoneImages[material.url] = img;
        };
        img.src = material.url;
        
        // Add to Dutch Quality Thin Brick all grid
        const dutchQualityThinBrickAllGrid = document.getElementById('dutch-quality-thin-brick-all-grid');
        if (dutchQualityThinBrickAllGrid) {
            const item = createMaterialThumbnail(material.url, material.name, 'thin-brick');
            dutchQualityThinBrickAllGrid.appendChild(item);
        }
        
        // Add to specific profile grid
        const profileGridId = `dutch-quality-thin-brick-${material.profile}-grid`;
        const profileGrid = document.getElementById(profileGridId);
        if (profileGrid) {
            const item = createMaterialThumbnail(material.url, material.name, 'thin-brick');
            profileGrid.appendChild(item);
        }
    });

    // Load Endicott materials
    ENDICOTT_MATERIALS.forEach(material => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function() {
            stoneImages[material.url] = img;
        };
        img.src = material.url;
        
        // Add to Endicott all grid
        const endicottAllGrid = document.getElementById('endicott-all-grid');
        if (endicottAllGrid) {
            const item = createMaterialThumbnail(material.url, material.name, 'thin-brick');
            endicottAllGrid.appendChild(item);
        }
        
        // Add to specific profile grid
        const profileGridId = `endicott-${material.profile}-grid`;
        const profileGrid = document.getElementById(profileGridId);
        if (profileGrid) {
            const item = createMaterialThumbnail(material.url, material.name, 'thin-brick');
            profileGrid.appendChild(item);
        }
    });

    // Load Glen-Gery materials
    GLEN_GERY_MATERIALS.forEach(material => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function() {
            stoneImages[material.url] = img;
        };
        img.src = material.url;
        
        // Add to Glen-Gery all grid
        const glenGeryAllGrid = document.getElementById('glen-gery-all-grid');
        if (glenGeryAllGrid) {
            const item = createMaterialThumbnail(material.url, material.name, 'thin-brick');
            glenGeryAllGrid.appendChild(item);
        }
        
        // Add to specific profile grid
        const profileGridId = `glen-gery-${material.profile}-grid`;
        const profileGrid = document.getElementById(profileGridId);
        if (profileGrid) {
            const item = createMaterialThumbnail(material.url, material.name, 'thin-brick');
            profileGrid.appendChild(item);
        }
    });

    // Load Hebron Brick materials
    HEBRON_MATERIALS.forEach(material => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function() {
            stoneImages[material.url] = img;
        };
        img.src = material.url;
        
        // Add to Hebron Brick all grid
        const hebronAllGrid = document.getElementById('hebron-brick-all-grid');
        if (hebronAllGrid) {
            const item = createMaterialThumbnail(material.url, material.name, 'thin-brick');
            hebronAllGrid.appendChild(item);
        }
        
        // Add to specific profile grid
        const profileGridId = `hebron-brick-${material.profile}-grid`;
        const profileGrid = document.getElementById(profileGridId);
        if (profileGrid) {
            const item = createMaterialThumbnail(material.url, material.name, 'thin-brick');
            profileGrid.appendChild(item);
        }
    });

    // Load King Klinker materials
    console.log('King Klinker materials:', KING_KLINKER_MATERIALS); // ADD THIS LINE HERE
    KING_KLINKER_MATERIALS.forEach(material => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function() {
            stoneImages[material.url] = img;
        };
        img.src = material.url;
        
        // Add to King Klinker all grid
        const kingKlinkerAllGrid = document.getElementById('king-klinker-all-grid');
        if (kingKlinkerAllGrid) {
            const item = createMaterialThumbnail(material.url, material.name, 'thin-brick');
            kingKlinkerAllGrid.appendChild(item);
        }
    });

  
// Load H.C. Muddox materials
    HC_MUDDOX_MATERIALS.forEach(material => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function() {
            stoneImages[material.url] = img;
        };
        img.src = material.url;
        
        // Add to H.C. Muddox all grid
        const hcMuddoxAllGrid = document.getElementById('hc-muddox-all-grid');
        if (hcMuddoxAllGrid) {
            const item = createMaterialThumbnail(material.url, material.name, 'thin-brick');
            hcMuddoxAllGrid.appendChild(item);
        }
        
        // Add to specific profile grid
        const profileGridId = `hc-muddox-${material.profile}-grid`;
        const profileGrid = document.getElementById(profileGridId);
        if (profileGrid) {
            const item = createMaterialThumbnail(material.url, material.name, 'thin-brick');
            profileGrid.appendChild(item);
        }
    });

// Load Interstate materials
    INTERSTATE_MATERIALS.forEach(material => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function() {
            stoneImages[material.url] = img;
        };
        img.src = material.url;
        
        // Add to Interstate all grid
        const interstateAllGrid = document.getElementById('interstate-brick-all-grid');
        if (interstateAllGrid) {
            const item = createMaterialThumbnail(material.url, material.name, 'thin-brick');
            interstateAllGrid.appendChild(item);
        }
        
        // Add to specific profile grid
        const profileGridId = `interstate-brick-${material.profile}-grid`;
        const profileGrid = document.getElementById(profileGridId);
        if (profileGrid) {
            const item = createMaterialThumbnail(material.url, material.name, 'thin-brick');
            profileGrid.appendChild(item);
        }
    });

} // <-- FIXED: This closes the entire loadStonesByManufacturer function




// Load predefined materials into their respective categories
function loadPredefinedMaterials() {
    console.log('loadPredefinedMaterials function started!');
    
    // Load Stone materials into organized sections
    console.log('About to call loadStonesByManufacturer');
    loadStonesByManufacturer();        
    
    

        // Load Stone Surfaces materials
        const stoneSurfacesGrid = document.querySelector('#stone-surfaces-category .material-grid');
        if (stoneSurfacesGrid) {
            const uploadButton = stoneSurfacesGrid.querySelector('.upload-material');
            STONE_SURFACES_MATERIALS.forEach(material => {
    // Image will load on-demand via lazy loading
    const item = createMaterialThumbnail(material.url, material.name, 'stone-surfaces');
    stoneSurfacesGrid.insertBefore(item, uploadButton);
});
        }
        
        // Load Brick materials
        const brickGrid = document.querySelector('#brick-category .material-grid');
        if (brickGrid) {
            const uploadButton = brickGrid.querySelector('.upload-material');
            BRICK_MATERIALS.forEach(material => {
    // Image will load on-demand via lazy loading
    const item = createMaterialThumbnail(material.url, material.name, 'brick');
    brickGrid.insertBefore(item, uploadButton);
});
        }
        
        // Load Concrete materials
        const concreteGrid = document.querySelector('#concrete-category .material-grid');
        if (concreteGrid) {
            const uploadButton = concreteGrid.querySelector('.upload-material');
            CONCRETE_MATERIALS.forEach(material => {
    // Image will load on-demand via lazy loading
    const item = createMaterialThumbnail(material.url, material.name, 'concrete');
    concreteGrid.insertBefore(item, uploadButton);
});
        }

        // Load Stone & Concrete Surfaces materials
        console.log('Loading Stone & Concrete Surfaces materials...');
        if (Array.isArray(STONE_CONCRETE_MATERIALS)) {
            console.log('Found STONE_CONCRETE_MATERIALS array with', STONE_CONCRETE_MATERIALS.length, 'items');
            STONE_CONCRETE_MATERIALS.forEach(material => {
    // Image will load on-demand via lazy loading
});
        } else {
            console.error('STONE_CONCRETE_MATERIALS not found or not an array');
        }
        
        // Add Stone & Concrete Surfaces to the grid
        const stoneConcreteSurfacesGrid = document.querySelector('#stone-concrete-surfaces-category .material-grid');
        if (stoneConcreteSurfacesGrid) {
            const uploadButton = stoneConcreteSurfacesGrid.querySelector('.upload-material');
            STONE_CONCRETE_MATERIALS.forEach(material => {
                const item = createMaterialThumbnail(material.url, material.name, 'stone-concrete-surfaces');
                stoneConcreteSurfacesGrid.insertBefore(item, uploadButton);
            });
        }
        
        console.log('Stone & Concrete Surfaces loading initiated');
        
       // Load Wood Surfaces materials
        console.log('Loading Wood Surfaces materials...');
        if (Array.isArray(WOOD_SURFACES_MATERIALS)) {
            console.log('Found WOOD_SURFACES_MATERIALS array with', WOOD_SURFACES_MATERIALS.length, 'items');
            WOOD_SURFACES_MATERIALS.forEach(material => {
    // Image will load on-demand via lazy loading
});
        } else {
            console.error('WOOD_SURFACES_MATERIALS not found or not an array');
        }
        
        // Add Wood Surfaces to the grid
        const woodSurfacesGrid = document.querySelector('#wood-surfaces-category .material-grid');
        if (woodSurfacesGrid) {
            const uploadButton = woodSurfacesGrid.querySelector('.upload-material');
            WOOD_SURFACES_MATERIALS.forEach(material => {
                const item = createMaterialThumbnail(material.url, material.name, 'wood-surfaces');
                woodSurfacesGrid.insertBefore(item, uploadButton);
            });
        }
        
        console.log('Wood Surfaces loading initiated');
        
        // Load Decoration materials
        const decorGrid = document.querySelector('#decor-category .material-grid');
        if (decorGrid) {
            const uploadButton = decorGrid.querySelector('.upload-material');
            DECORATION_MATERIALS.forEach(material => {
    // Image will load on-demand via lazy loading
    const item = createMaterialThumbnail(material.url, material.name, 'decor');
    decorGrid.insertBefore(item, uploadButton);
});
        }
        // Load Full Brick materials into stoneImages - CRITICAL FIX
        console.log('Loading Full Brick materials into stoneImages...');
        
        // Load aggregated Full Brick materials
        if (typeof FULL_BRICK_MATERIALS !== 'undefined' && Array.isArray(FULL_BRICK_MATERIALS)) {
            console.log('Found FULL_BRICK_MATERIALS array with', FULL_BRICK_MATERIALS.length, 'items');
            FULL_BRICK_MATERIALS.forEach(material => {
    // Image will load on-demand via lazy loading
});
        } else {
            console.error('FULL_BRICK_MATERIALS not found or not an array');
        }
        
        console.log('Full Brick loading initiated');
    
    // Initialize lazy loading after all thumbnails are created
    setTimeout(initLazyLoading, 100);
}
    
    // Load predefined materials
    loadPredefinedMaterials();
    
   // Upload functionality for each material type
const uploadButtons = document.querySelectorAll('.upload-material');
uploadButtons.forEach(uploadBtn => {
    uploadBtn.addEventListener('click', function() {
        const materialType = this.dataset.type;
        console.log('Upload clicked for:', materialType);
        const uploadInput = document.getElementById(materialType + '-upload');
        if (uploadInput) {
            uploadInput.click();
        } else {
            console.error('No upload input found for:', materialType);
        }
    });
});
    
    // Handle file uploads for each material type
    const materialTypes = ['stone', 'thin-brick', 'full-brick', 'stone-concrete-surfaces', 'wood-surfaces', 'decor'];
    materialTypes.forEach(type => {
        const uploadInput = document.getElementById(type + '-upload');
        if (uploadInput) {
            uploadInput.addEventListener('change', function(e) {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    if (!file.type.startsWith('image/')) {
                        showMessage('Please select an image file');
                        return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const imgDataUrl = event.target.result;
                        const img = new Image();
                        img.onload = function() {
                            let customName;
                            if (type === 'decor') {
                                customName = 'Custom Decor ' + nextCustomDecorationId++;
                                decorationImages[imgDataUrl] = img;
                            } else {
                                customName = 'Custom ' + type.charAt(0).toUpperCase() + type.slice(1) + ' ' + nextCustomStoneId++;
                                stoneImages[imgDataUrl] = img;
                            }
                            
                            const newItem = createMaterialThumbnail(imgDataUrl, customName, type);
                            let materialGrid;
if (type === 'thin-brick') {
    materialGrid = document.querySelector('#thin-brick-category > .material-grid');
} else if (type === 'full-brick') {
    materialGrid = document.querySelector('#full-brick-category .material-grid');
} else if (type === 'stone-concrete-surfaces') {
    materialGrid = document.querySelector('#stone-concrete-surfaces-category .material-grid');
} else if (type === 'wood-surfaces') {
    materialGrid = document.querySelector('#wood-surfaces-category .material-grid');
} else {
    materialGrid = document.querySelector('#' + type + '-category .material-grid');
}
                            if (materialGrid) {
                                const uploadButton = materialGrid.querySelector('.upload-material');
                                materialGrid.insertBefore(newItem, uploadButton);
                            }
                            
                            newItem.click();
                            showMessage(customName + ' uploaded.');
                            // Prevent material panel from disappearing
setTimeout(() => {
    const materialPanel = document.querySelector('.material-selection-panel');
    if (materialPanel && !materialPanel.classList.contains('active')) {
        materialPanel.classList.add('active');
    }
    
    // Restore the correct tab
    const activeTab = document.querySelector('.material-tab.active');
    if (!activeTab) {
        let correctTab;
        if (type === 'thin-brick') correctTab = document.querySelector('.material-tab[data-category="thin-brick"]');
        else if (type === 'full-brick') correctTab = document.querySelector('.material-tab[data-category="full-brick"]');
        else if (type === 'stone-concrete-surfaces') correctTab = document.querySelector('.material-tab[data-category="stone-concrete-surfaces"]');
        else if (type === 'wood-surfaces') correctTab = document.querySelector('.material-tab[data-category="wood-surfaces"]');
        else correctTab = document.querySelector('.material-tab[data-category="' + type + '"]');
        
        if (correctTab) correctTab.classList.add('active');
    }
}, 100);
                        };
                        img.onerror = function() {
                            showMessage("Error processing uploaded image.");
                        };
                        img.src = imgDataUrl;
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                }
            });
        }
    });
}

function setupCanvasListeners() {
    if (!canvas) return;

    canvas.addEventListener('click', function(e) {
        const coords = getCanvasCoordinates(e);
const x = coords.x;
const y = coords.y;

        if (isAddingDecoration) {
            saveState();
            const newDecoration = {
                id: Date.now(),
                x: x,
                y: y,
                image: currentDecoration,
                name: 'Decoration ' + (decorations.length + 1),
                size: 100,
                opacity: 100,
                rotation: 0,
                brightness: 100,
                contrast: 100,
                shadow: 0,
                shadowOffset: 2,
                shadowBlur: 2,
                zIndex: decorations.length,
                layer: 'front' // Default to front layer
            };
            decorations.push(newDecoration);
            selectedDecorationIndex = decorations.length - 1;
            isAddingDecoration = false;
            isInDrawingMode = false;
            canvas.style.cursor = 'crosshair';
            updateDecorationsList();
            enableDecorationControls(newDecoration);
            showMessage('Decoration placed.');
            drawCanvas();
            return;
        }

        if (isDrawingArea) {
    if (areaDrawingMode === 'rectangle') {
        // Rectangle mode - this will be handled in mousedown/mouseup
        return;
    } else {
        // Freehand mode - ADD POINT THROTTLING
        // Only add point if it's far enough from the last point
        if (currentPoints.length === 0 || 
            Math.sqrt(Math.pow(x - currentPoints[currentPoints.length - 1].x, 2) + 
                     Math.pow(y - currentPoints[currentPoints.length - 1].y, 2)) > 5) {
            currentPoints.push({ x, y });
        }
        drawCanvas();
        return;
    }
} else if (isDrawingDepthEdge) {
            currentDepthEdgePoints.push({ x, y });
            
            if (depthEdgeMode === 'line' && currentDepthEdgePoints.length === 2) {
                // Finish line depth edge
                saveState();
                const newEdge = {
                    id: Date.now(),
                    points: [...currentDepthEdgePoints],
                    mode: 'line',
                    intensity: depthEffectIntensity,
                    protrusion: 0,
                    shadowOpacity: 40,
                    shadowOffset: 5,
                    shadowBlur: 3
                };
                depthEdges.push(newEdge);
                selectedDepthEdgeIndex = depthEdges.length - 1;
                isDrawingDepthEdge = false;
                currentDepthEdgePoints = [];
                isInDrawingMode = false;
                enableDepthEdgeControls(newEdge);
                updateDepthList();
                showMessage('Depth edge line created.');
                drawCanvas();
            } else if (depthEdgeMode === 'area') {
                // Continue drawing area points
                drawCanvas();
            }
            return;
        } else if (isDrawingSill) {
            currentSillPoints.push({ x, y });
            if (currentSillPoints.length === 2) {
                saveState();
                const newSill = {
                    id: Date.now(),
                    points: [...currentSillPoints],
                    type: currentSillType,
                    texture: currentSillType === 'wood' ? 'oak' : currentSillTexture,
                    color: currentSillColor,
                    thickness: sillThickness,
                    length: currentSillLength,
                    jointStyle: currentSillJointStyle,
                    mortarColor: currentSillMortarColor,
                    mortarThickness: currentSillMortarThickness,
                    scale: GLOBAL_STONE_SCALE,
                    rotation: 0,
                    horizontalOffset: 0,
                    verticalOffset: 0,
                    brightness: 100,
                    contrast: 100,
                    angle3d: 0,
                    shadow: 0,
                    shadowOffset: 2,
                    shadowBlur: 2
                };
                sills.push(newSill);
                selectedSillIndex = sills.length - 1;
                isDrawingSill = false;
                currentSillPoints = [];
                isInDrawingMode = false;
                updateSillsList();
                enableSillControls(newSill);
                showMessage('Sill/Cap created.');
                drawCanvas();
            }
            return;
        } else if (isDrawingBrickRow) {
            currentBrickRowPoints.push({ x, y });
            if (currentBrickRowPoints.length === 2) {
                saveState();
                const newBrickRow = {
    id: Date.now(),
    points: [...currentBrickRowPoints],
    color: currentBrickColor,
    texture: currentBrickTexture,
    height: brickRowHeight,
    mortarColor: currentBrickMortarColor,
    mortarThickness: brickMortarThickness,
    scale: 60  // Middle of new range
};
                brickRows.push(newBrickRow);
                selectedBrickRowIndex = brickRows.length - 1;
                isDrawingBrickRow = false;
                currentBrickRowPoints = [];
                isInDrawingMode = false;
                updateBrickRowsList();
                enableBrickRowControls(newBrickRow);
                showMessage('Brick row created.');
                drawCanvas();
            }
            return;
        } else if (isDrawingAccent) {
    currentAccentPoints.push({ x, y });
    
    if (currentAccentType === 'strip-flashing' && currentAccentPoints.length === 2) {
        // Finish line-based accent (strip flashing)
        saveState();
        const newAccent = {
            id: Date.now(),
            points: [...currentAccentPoints],
            type: currentAccentType,
            color: currentFlashingColor,
            thickness: ACCENT_TYPES[currentAccentType]?.defaultThickness || 2,
            opacity: 100,
            shadowOffset: 2,
            shadowBlur: 3,
            name: `${ACCENT_TYPES[currentAccentType]?.name || 'Accent'} ${accents.length + 1}`
        };
        accents.push(newAccent);
        selectedAccentIndex = accents.length - 1;
        isDrawingAccent = false;
        currentAccentPoints = [];
        isInDrawingMode = false;
        updateAccentsList();
        enableAccentControls(newAccent);
        showMessage(`${ACCENT_TYPES[currentAccentType]?.name || 'Accent'} created.`);
        drawCanvas();
    } else if (currentAccentType === 'flat-cap') {
        // Continue drawing area-based accent (flat cap) - finish on double-click
        drawCanvas();
    }
    return;
        }
        
       // PRIORITIZE drawing tools selection when tools are active
        if (isDrawingToolsActive && currentDrawingTool === 'pointer') {
            console.log('Pointer tool active, checking for drawing selection at:', x, y);
            
            // Check for annotation selection FIRST when using pointer tool
            const clickedAnnotation = getAnnotationAtPoint(x, y);
            if (clickedAnnotation !== null) {
                console.log('Found annotation at index:', clickedAnnotation);
                selectedAnnotation = clickedAnnotation;
                const annotation = annotations[selectedAnnotation];
                
                // Update tool panel controls to show selected annotation properties
                updateToolPanelForAnnotation(annotation);
                
                redrawAnnotations();
                showMessage('Drawing selected. Use tool panel to edit or drag to move.');
                return; // Exit early - we found and selected a drawing
            } else {
                console.log('No annotation found at click point');
                // Deselect if clicking on empty area
                selectedAnnotation = null;
                redrawAnnotations();
                showMessage('No drawing found at this location.');
                return;
            }
        }

        // Element selection logic - only if not in drawing mode and not using drawing tools
        if (isInDrawingMode || isDrawingToolsActive) return;
        
        let foundElement = false;
        
        // Check decorations first (highest priority for selection)
        for (let i = decorations.length - 1; i >= 0; i--) {
            const decoration = decorations[i];
            if (decoration && decorationImages[decoration.image]) {
                const img = decorationImages[decoration.image];
                const size = (decoration.size || 100) / 100;
                const width = img.width * size;
                const height = img.height * size;
                
                const dx = x - decoration.x;
                const dy = y - decoration.y;
                const rotation = -(decoration.rotation || 0) * Math.PI / 180;
                const cos = Math.cos(rotation);
                const sin = Math.sin(rotation);
                const localX = dx * cos - dy * sin;
                const localY = dx * sin + dy * cos;
                
                if (Math.abs(localX) <= width/2 && Math.abs(localY) <= height/2) {
                    selectedDecorationIndex = i;
                    selectedAreaIndex = -1;
                    selectedDepthEdgeIndex = -1;
                    selectedSillIndex = -1;
                    selectedBrickRowIndex = -1;
                    updateAreasList();
                    updateDepthList();
                    updateSillsList();
                    updateBrickRowsList();
                    updateDecorationsList();
                    enableDecorationControls(decoration);
                    drawCanvas();
                    foundElement = true;
                    break;
                }
            }
        }
        // Check accents
if (!foundElement) {
    for (let i = accents.length - 1; i >= 0; i--) {
        if (accents[i] && accents[i].points && accents[i].points.length >= 2) {
            if (isPointNearLine({ x, y }, accents[i].points[0], accents[i].points[1], 15)) {
                selectedAccentIndex = i;
                selectedAreaIndex = -1;
                selectedDepthEdgeIndex = -1;
                selectedSillIndex = -1;
                selectedBrickRowIndex = -1;
                selectedDecorationIndex = -1;
                updateAreasList();
                updateDepthList();
                updateSillsList();
                updateBrickRowsList();
                updateDecorationsList();
                updateAccentsList();
                enableAccentControls(accents[i]);
                drawCanvas();
                foundElement = true;
                break;
            }
        }
    }
}
        // Check depth edges
        if (!foundElement) {
            for (let i = depthEdges.length - 1; i >= 0; i--) {
                if (depthEdges[i] && depthEdges[i].points && depthEdges[i].points.length >= 2) {
                    let isNear = false;
                    
                    if (depthEdges[i].mode === 'area' && depthEdges[i].points.length >= 3) {
                        // Check if point is inside depth area
                        isNear = isPointInPolygon({ x, y }, depthEdges[i].points);
                    } else {
                        // Check if point is near line
                        isNear = isPointNearLine({ x, y }, depthEdges[i].points[0], depthEdges[i].points[1], 15);
                    }
                    
                    if (isNear) {
                        selectedDepthEdgeIndex = i;
                        selectedAreaIndex = -1;
                        selectedSillIndex = -1;
                        selectedBrickRowIndex = -1;
                        selectedDecorationIndex = -1;
                        updateAreasList();
                        updateDepthList();
                        updateSillsList();
                        updateBrickRowsList();
                        updateDecorationsList();
                        enableDepthEdgeControls(depthEdges[i]);
                        drawCanvas();
                        foundElement = true;
                        break;
                    }
                }
            }
        }
        
       // Check areas
        if (!foundElement) {
            for (let i = areas.length - 1; i >= 0; i--) {
                if (areas[i] && areas[i].points && isPointInPolygon({ x, y }, areas[i].points)) {
                    selectedAreaIndex = i;
                    selectedDepthEdgeIndex = -1;
                    selectedSillIndex = -1;
                    selectedBrickRowIndex = -1;
                    selectedDecorationIndex = -1;
                    selectedAccentIndex = -1; // Clear accent selection
                    updateAreasList();
                    updateDepthList();
                    updateSillsList();
                    updateBrickRowsList();
                    updateDecorationsList();
                    updateAccentsList(); // Update accent list
                    if (!areas[i].isCutout) {
                        enableMainAreaControls(areas[i]);
                    } else {
                        disableMainAreaControls();
                    }
                    drawCanvas();
                    foundElement = true;
                    break;
                }
            }
        }
        
        // Check sills
        if (!foundElement) {
            for (let i = sills.length - 1; i >= 0; i--) {
                if (sills[i] && sills[i].points && sills[i].points.length >= 2) {
                    if (isPointNearLine({ x, y }, sills[i].points[0], sills[i].points[1], 15)) {
                        selectedSillIndex = i;
                        selectedAreaIndex = -1;
                        selectedDepthEdgeIndex = -1;
                        selectedBrickRowIndex = -1;
                        selectedDecorationIndex = -1;
                        updateAreasList();
                        updateDepthList();
                        updateSillsList();
                        updateBrickRowsList();
                        updateDecorationsList();
                        enableSillControls(sills[i]);
                        drawCanvas();
                        foundElement = true;
                        break;
                    }
                }
            }
        }
        
        // Check brick rows
        if (!foundElement) {
            for (let i = brickRows.length - 1; i >= 0; i--) {
                if (brickRows[i] && brickRows[i].points && brickRows[i].points.length >= 2) {
                    // FIXED: Check if point is within the brick row area, not just near the line
                    const brickRow = brickRows[i];
                    const start = brickRow.points[0];
                    const end = brickRow.points[1];
                    const height = brickRow.height || brickRowHeight;
                    const scale = scaleToBrickSize(brickRow.scale || GLOBAL_STONE_SCALE);
                    const scaledHeight = height * scale;
                    
                    // Calculate direction and perpendicular
                    const dx = end.x - start.x;
                    const dy = end.y - start.y;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    const dirX = dx / length;
                    const dirY = dy / length;
                    const perpX = -dirY;
                    const perpY = dirX;
                    
                    // Create the brick row rectangle points
                    const brickRowPolygon = [
                        { x: start.x, y: start.y },
                        { x: end.x, y: end.y },
                        { x: end.x + perpX * scaledHeight, y: end.y + perpY * scaledHeight },
                        { x: start.x + perpX * scaledHeight, y: start.y + perpY * scaledHeight }
                    ];
                    
                    // Check if click point is inside the brick row rectangle
                    if (isPointInPolygon({ x, y }, brickRowPolygon)) {
                        selectedBrickRowIndex = i;
                        selectedAreaIndex = -1;
                        selectedDepthEdgeIndex = -1;
                        selectedSillIndex = -1;
                        selectedDecorationIndex = -1;
                        updateAreasList();
                        updateDepthList();
                        updateSillsList();
                        updateBrickRowsList();
                        updateDecorationsList();
                        enableBrickRowControls(brickRows[i]);
                        drawCanvas();
                        foundElement = true;
                        break;
                    }
                }
            }
        }
        
        if (!foundElement) {
            selectedAreaIndex = -1;
            selectedDepthEdgeIndex = -1;
            selectedSillIndex = -1;
            selectedBrickRowIndex = -1;
            selectedDecorationIndex = -1;
            selectedAccentIndex = -1; // Clear accent selection
            updateAreasList();
            updateDepthList();
            updateSillsList();
            updateBrickRowsList();
            updateDecorationsList();
            updateAccentsList(); // Update accent list
            disableMainAreaControls();
            drawCanvas();
        }
    });

    canvas.addEventListener('dblclick', function(e) {
    if (isDrawingArea && currentPoints.length >= 3) {
        finishDrawingArea();
    } else if (isDrawingDepthEdge && depthEdgeMode === 'area' && currentDepthEdgePoints.length >= 3) {
        finishDrawingDepthArea();
    } else if (isDrawingAccent && currentAccentType === 'flat-cap' && currentAccentPoints.length >= 3) {
        finishDrawingFlatCap();
    }
});

    // Mouse down for potential dragging and decoration resizing - FIXED
    canvas.addEventListener('mousedown', function(e) {
       
        
        const coords = getCanvasCoordinates(e);
const x = coords.x;
const y = coords.y;
      // Handle rectangle drawing start
if (isDrawingArea && areaDrawingMode === 'rectangle' && !rectangleStartPoint) {
    rectangleStartPoint = { x, y };
    return;
}  
      
        // Check for decoration resizing FIRST - FIXED
        if (selectedDecorationIndex !== -1 && decorations[selectedDecorationIndex]) {
            const decoration = decorations[selectedDecorationIndex];
            const resizeHandle = getDecorationResizeHandle(x, y, decoration);
            
            if (resizeHandle) {
                isResizingDecoration = true;
                decorationResizeHandle = resizeHandle;
                decorationResizeStartSize = decoration.size || 100;
                decorationResizeStartMouse = { x, y };
                canvas.style.cursor = getResizeCursor(resizeHandle);
                saveState();
                return; // Exit early to prevent other mouse down logic
            }
        }
        
        // Check for area vertex dragging
        if (selectedAreaIndex !== -1 && areas[selectedAreaIndex]) {
            const area = areas[selectedAreaIndex];
            for (let i = 0; i < area.points.length; i++) {
                if (isPointNearPoint({ x, y }, area.points[i], 8)) {
                    isDraggingVertex = true;
                    draggedVertexIndex = i;
                    canvas.style.cursor = 'pointer';
                    saveState();
                    return;
                }
            }
        }
// Check for brick row vertex dragging - ENHANCED WITH 4 CORNERS
if (selectedBrickRowIndex !== -1 && brickRows[selectedBrickRowIndex]) {
    const brickRow = brickRows[selectedBrickRowIndex];
    
    // Convert 2-point brick row to 4-point rectangle if needed
    if (brickRow.points.length === 2) {
        const start = brickRow.points[0];
        const end = brickRow.points[1];
        const height = brickRow.height || brickRowHeight;
        const scale = scaleToBrickSize(brickRow.scale || GLOBAL_STONE_SCALE);
        const scaledHeight = height * scale;
        
        // Calculate direction and perpendicular
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const dirX = dx / length;
        const dirY = dy / length;
        const perpX = -dirY;
        const perpY = dirX;
        
        // Create 4 corner points
        brickRow.points = [
            { x: start.x, y: start.y },                                    // Bottom left
            { x: end.x, y: end.y },                                        // Bottom right
            { x: end.x + perpX * scaledHeight, y: end.y + perpY * scaledHeight },   // Top right
            { x: start.x + perpX * scaledHeight, y: start.y + perpY * scaledHeight } // Top left
        ];
    }
    
    // Check for vertex dragging on all 4 corners
    for (let i = 0; i < brickRow.points.length; i++) {
        if (isPointNearPoint({ x, y }, brickRow.points[i], 8)) {
            isDraggingVertex = true;
            draggedVertexIndex = i;
            draggedElementType = 'brickRow';
            draggedElementIndex = selectedBrickRowIndex;
            canvas.style.cursor = 'pointer';
            saveState();
            console.log(`Starting to drag brick row vertex ${i}`);
            return;
        }
    }
}
        // Check for accent endpoint dragging - IMPROVED PRIORITY
        if (selectedAccentIndex !== -1 && accents[selectedAccentIndex]) {
            const accent = accents[selectedAccentIndex];
            
            if (accent.type === 'strip-flashing' && accent.points.length >= 2) {
                // Check endpoints FIRST - smaller threshold for precise clicking
                let clickedEndpoint = false;
                for (let i = 0; i < accent.points.length; i++) {
                    if (isPointNearPoint({ x, y }, accent.points[i], 8)) { // Smaller threshold - must be close
                        isDraggingVertex = true;
                        draggedVertexIndex = i;
                        draggedElementType = 'accent';
                        draggedElementIndex = selectedAccentIndex;
                        canvas.style.cursor = 'pointer';
                        saveState();
                        console.log(`Starting to drag accent endpoint ${i}`);
                        clickedEndpoint = true;
                        return; // Exit early - endpoint dragging takes priority
                    }
                }
                
                // Only check for whole-accent dragging if NOT near an endpoint
                if (!clickedEndpoint) {
                    const thickness = accent.thickness || 2;
                    const canDragWhole = isPointNearLine({ x, y }, accent.points[0], accent.points[1], thickness + 10);
                    
                    if (canDragWhole) {
                        console.log('Clicking on middle of accent - will allow whole accent operations');
                        // Don't start dragging here - let the normal accent dragging code handle it
                        // This just ensures we detected it's a middle click, not endpoint click
                    }
                }
            }
        }
        
        // Check for depth edge resize handles
       // Check for depth edge resize handles
        if (selectedDepthEdgeIndex !== -1 && depthEdges[selectedDepthEdgeIndex]) {
            const depthEdge = depthEdges[selectedDepthEdgeIndex];
            
            if (depthEdge.mode === 'line' && depthEdge.points.length === 2) {
                // Handle line resize - FIXED with larger threshold
                if (isPointNearPoint({ x, y }, depthEdge.points[0], 12)) {
                    isDraggingVertex = true;
                    draggedVertexIndex = 0;
                    draggedElementType = 'depthEdge';
                    draggedElementIndex = selectedDepthEdgeIndex;
                    canvas.style.cursor = 'pointer';
                    saveState();
                    console.log('Starting to drag depth edge start point');
                    return;
                }
                
                if (isPointNearPoint({ x, y }, depthEdge.points[1], 12)) {
                    isDraggingVertex = true;
                    draggedVertexIndex = 1;
                    draggedElementType = 'depthEdge';
                    draggedElementIndex = selectedDepthEdgeIndex;
                    canvas.style.cursor = 'pointer';
                    saveState();
                    console.log('Starting to drag depth edge end point');
                    return;
                }
            } else if (depthEdge.mode === 'area') {
                // Handle area vertex dragging - FIXED with larger threshold
                for (let i = 0; i < depthEdge.points.length; i++) {
                    if (isPointNearPoint({ x, y }, depthEdge.points[i], 12)) {
                        isDraggingVertex = true;
                        draggedVertexIndex = i;
                        draggedElementType = 'depthEdge';
                        draggedElementIndex = selectedDepthEdgeIndex;
                        canvas.style.cursor = 'pointer';
                        saveState();
                        console.log(`Starting to drag depth edge area vertex ${i}`);
                        return;
                    }
                }
            }
        }
        
        // Check for sill resize handles
        if (selectedSillIndex !== -1 && sills[selectedSillIndex]) {
            const sill = sills[selectedSillIndex];
            
            if (isPointNearPoint({ x, y }, sill.points[0], 8)) {
                isResizingSill = true;
                resizingEndpoint = 'start';
                canvas.style.cursor = 'pointer';
                saveState();
                return;
            }
            
            if (isPointNearPoint({ x, y }, sill.points[1], 8)) {
                isResizingSill = true;
                resizingEndpoint = 'end';
                canvas.style.cursor = 'pointer';
                saveState();
                return;
            }
        }

        // NEW: Multi-select mode - Ctrl/Cmd+Click to toggle area selection
if (e.ctrlKey || e.metaKey) {
    // Check if clicking on any area
    for (let i = 0; i < areas.length; i++) {
        if (areas[i] && !areas[i].isCutout && isPointInPolygon({ x, y }, areas[i].points)) {
            // Toggle multi-selection for this area
            areas[i].multiSelected = !areas[i].multiSelected;
            
            // Also make this the selectedAreaIndex
            selectedAreaIndex = i;
            updateAreasList();
            enableMainAreaControls(areas[i]);
            drawCanvas();
            
            const count = areas.filter(a => a && a.multiSelected).length;
            showMessage(`${count} area(s) selected for material change`);
            return;
        }
    }
}
        
        // Element dragging logic
        if (selectedAreaIndex !== -1 && areas[selectedAreaIndex]) {
            if (isPointInPolygon({ x, y }, areas[selectedAreaIndex].points)) {
                isDragging = true;
                draggedElementType = 'area';
                draggedElementIndex = selectedAreaIndex;
                dragStartX = x;
                dragStartY = y;
                dragElementStartPoints = [...areas[selectedAreaIndex].points];
                canvas.style.cursor = 'move';
                saveState();
            }
        } else if (selectedDepthEdgeIndex !== -1 && depthEdges[selectedDepthEdgeIndex]) {
            const depthEdge = depthEdges[selectedDepthEdgeIndex];
            
            if (depthEdge.mode === 'line' && depthEdge.points.length === 2) {
                // Line dragging
                if (isPointNearLine({ x, y }, depthEdge.points[0], depthEdge.points[1], 20)) {
                    isDragging = true;
                    draggedElementType = 'depthEdge';
                    draggedElementIndex = selectedDepthEdgeIndex;
                    dragStartX = x;
                    dragStartY = y;
                    dragElementStartPoints = [...depthEdge.points];
                    canvas.style.cursor = 'move';
                    saveState();
                }
            } else if (depthEdge.mode === 'area' && depthEdge.points.length >= 3) {
                // Area dragging
                if (isPointInPolygon({ x, y }, depthEdge.points)) {
                    isDragging = true;
                    draggedElementType = 'depthEdge';
                    draggedElementIndex = selectedDepthEdgeIndex;
                    dragStartX = x;
                    dragStartY = y;
                    dragElementStartPoints = [...depthEdge.points];
                    canvas.style.cursor = 'move';
                    saveState();
                }
            }
        } else if (selectedSillIndex !== -1 && sills[selectedSillIndex]) {
            if (isPointNearLine({ x, y }, sills[selectedSillIndex].points[0], sills[selectedSillIndex].points[1], 20)) {
                isDragging = true;
                draggedElementType = 'sill';
                draggedElementIndex = selectedSillIndex;
                dragStartX = x;
                dragStartY = y;
                dragElementStartPoints = [...sills[selectedSillIndex].points];
                canvas.style.cursor = 'move';
                saveState();
            }
        } else if (selectedBrickRowIndex !== -1 && brickRows[selectedBrickRowIndex]) {
            // FIXED: Use same polygon detection as selection for dragging
            const brickRow = brickRows[selectedBrickRowIndex];
            const start = brickRow.points[0];
            const end = brickRow.points[1];
            const height = brickRow.height || brickRowHeight;
            const scale = scaleToBrickSize(brickRow.scale || GLOBAL_STONE_SCALE);
            const scaledHeight = height * scale;
            
            // Calculate direction and perpendicular
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const dirX = dx / length;
            const dirY = dy / length;
            const perpX = -dirY;
            const perpY = dirX;
            
            // Create the brick row rectangle points
            const brickRowPolygon = [
                { x: start.x, y: start.y },
                { x: end.x, y: end.y },
                { x: end.x + perpX * scaledHeight, y: end.y + perpY * scaledHeight },
                { x: start.x + perpX * scaledHeight, y: start.y + perpY * scaledHeight }
            ];
            
            // Check if click point is inside the brick row rectangle for dragging
            if (isPointInPolygon({ x, y }, brickRowPolygon)) {
                isDragging = true;
                draggedElementType = 'brickRow';
                draggedElementIndex = selectedBrickRowIndex;
                dragStartX = x;
                dragStartY = y;
                dragElementStartPoints = [...brickRows[selectedBrickRowIndex].points];
                canvas.style.cursor = 'move';
                saveState();
            }

        } else if (selectedDecorationIndex !== -1 && decorations[selectedDecorationIndex]) {
            const decoration = decorations[selectedDecorationIndex];
            const img = decorationImages[decoration.image];
            if (img) {
                const size = (decoration.size || 100) / 100;
                const width = img.width * size;
                const height = img.height * size;
                
                const dx = x - decoration.x;
                const dy = y - decoration.y;
                const rotation = -(decoration.rotation || 0) * Math.PI / 180;
                const cos = Math.cos(rotation);
                const sin = Math.sin(rotation);
                const localX = dx * cos - dy * sin;
                const localY = dx * sin + dy * cos;
                
                // Only allow center dragging if not near corners and not already resizing
                if (Math.abs(localX) <= width/2 && Math.abs(localY) <= height/2 && !isResizingDecoration) {
                    isDragging = true;
                    draggedElementType = 'decoration';
                    draggedElementIndex = selectedDecorationIndex;
                    dragStartX = x;
                    dragStartY = y;
                    dragElementStartPoints = [{ x: decoration.x, y: decoration.y }];
                    canvas.style.cursor = 'move';
                    saveState();
                }
            }
        } else if (selectedAccentIndex !== -1 && accents[selectedAccentIndex]) {
            const accent = accents[selectedAccentIndex];
            
            if (accent.type === 'strip-flashing' && accent.points.length >= 2) {
                const thickness = accent.thickness || 2;
                if (isPointNearLine({ x, y }, accent.points[0], accent.points[1], thickness + 15)) {
                    isDragging = true;
                    draggedElementType = 'accent';
                    draggedElementIndex = selectedAccentIndex;
                    dragStartX = x;
                    dragStartY = y;
                    dragElementStartPoints = [...accent.points];
                    canvas.style.cursor = 'move';
                    saveState();
                }
            }
        }
    });

    // Mouse move for dragging and decoration resizing - FIXED
    canvas.addEventListener('mousemove', function(e) {
        const coords = getCanvasCoordinates(e);
const x = coords.x;
const y = coords.y;
        
        lastMousePosition = { x, y };
      // Handle rectangle drawing preview
// Handle rectangle drawing preview
if (isDrawingArea && areaDrawingMode === 'rectangle' && rectangleStartPoint) {
    drawCanvas();
    return;
}

function updatePerspectiveSliders(area) {
    // Update perspective angle slider
    const perspectiveSlider = document.getElementById('perspective-angle-slider');
    const perspectiveValue = document.getElementById('perspective-angle-value');
    if (perspectiveSlider && perspectiveValue) {
        perspectiveSlider.value = area.perspectiveAngle || 0;
        perspectiveValue.textContent = (area.perspectiveAngle || 0) + '°';
    }
    
    // Update perspective compression slider
    const compressionSlider = document.getElementById('perspective-compression-slider');
    const compressionValue = document.getElementById('perspective-compression-value');
    if (compressionSlider && compressionValue) {
        compressionSlider.value = area.perspectiveCompression || 0;
        compressionValue.textContent = (area.perspectiveCompression || 0) + '%';
    }
    
    // Update 3D angle slider
    const angle3dSlider = document.getElementById('angle-3d-slider');
    const angle3dValue = document.getElementById('angle-3d-value');
    if (angle3dSlider && angle3dValue) {
        angle3dSlider.value = area.angle3d || 0;
        angle3dValue.textContent = (area.angle3d || 0) + '°';
    }
}
    
        
        // Handle decoration resizing - FIXED
        if (isResizingDecoration && selectedDecorationIndex !== -1 && decorations[selectedDecorationIndex]) {
            const decoration = decorations[selectedDecorationIndex];
            const img = decorationImages[decoration.image];
            if (img) {
                // Calculate distance from decoration center to current mouse position
                const centerX = decoration.x;
                const centerY = decoration.y;
                const currentDistance = Math.sqrt((x - centerX) * (x - centerX) + (y - centerY) * (y - centerY));
                
                // Calculate distance from decoration center to initial mouse position
                const initialDistance = Math.sqrt(
                    (decorationResizeStartMouse.x - centerX) * (decorationResizeStartMouse.x - centerX) + 
                    (decorationResizeStartMouse.y - centerY) * (decorationResizeStartMouse.y - centerY)
                );
                
                // Calculate scale factor based on distance ratio
                const scaleFactor = initialDistance > 0 ? currentDistance / initialDistance : 1;
                
                // Calculate new size
                let newSize = decorationResizeStartSize * scaleFactor;
                newSize = Math.max(10, Math.min(500, newSize)); // Limit size between 10% and 500%
                
                decoration.size = newSize;
                drawCanvas();
            }
            return;
        }
        
        // REPLACE your vertex dragging section with this corrected version:

        // Handle vertex dragging
        if (isDraggingVertex && selectedAreaIndex !== -1 && areas[selectedAreaIndex]) {
            areas[selectedAreaIndex].points[draggedVertexIndex] = { x, y };
            drawCanvas();
            return;
        } else if (isDraggingVertex && selectedDepthEdgeIndex !== -1 && depthEdges[selectedDepthEdgeIndex] && draggedElementType === 'depthEdge') {
            depthEdges[selectedDepthEdgeIndex].points[draggedVertexIndex] = { x, y };
            drawCanvas();
            return;
        } else if (isDraggingVertex && selectedAccentIndex !== -1 && accents[selectedAccentIndex] && draggedElementType === 'accent') {
            console.log(`Dragging accent endpoint ${draggedVertexIndex} to`, { x, y });
            accents[selectedAccentIndex].points[draggedVertexIndex] = { x, y };
            drawCanvas();
            return;
        } else if (isDraggingVertex && selectedBrickRowIndex !== -1 && brickRows[selectedBrickRowIndex] && draggedElementType === 'brickRow') {
            brickRows[selectedBrickRowIndex].points[draggedVertexIndex] = { x, y };
            drawCanvas();
            return;
        }
        
        if (isDragging) {
            const deltaX = x - dragStartX;
            const deltaY = y - dragStartY;
            
            if (draggedElementType === 'area' && areas[draggedElementIndex]) {
                areas[draggedElementIndex].points = dragElementStartPoints.map(point => ({
                    x: point.x + deltaX,
                    y: point.y + deltaY
                }));
                drawCanvas();
            } else if (draggedElementType === 'depthEdge' && depthEdges[draggedElementIndex]) {
                depthEdges[draggedElementIndex].points = dragElementStartPoints.map(point => ({
                    x: point.x + deltaX,
                    y: point.y + deltaY
                }));
                drawCanvas();
            } else if (draggedElementType === 'sill' && sills[draggedElementIndex]) {
                sills[draggedElementIndex].points = dragElementStartPoints.map(point => ({
                    x: point.x + deltaX,
                    y: point.y + deltaY
                }));
                drawCanvas();
            } else if (draggedElementType === 'brickRow' && brickRows[draggedElementIndex]) {
                brickRows[draggedElementIndex].points = dragElementStartPoints.map(point => ({
                    x: point.x + deltaX,
                    y: point.y + deltaY
                }));
                drawCanvas();
            } else if (draggedElementType === 'decoration' && decorations[draggedElementIndex]) {
                decorations[draggedElementIndex].x = dragElementStartPoints[0].x + deltaX;
                decorations[draggedElementIndex].y = dragElementStartPoints[0].y + deltaY;
                drawCanvas();
            } else if (draggedElementType === 'accent' && accents[draggedElementIndex]) {
                accents[draggedElementIndex].points = dragElementStartPoints.map(point => ({
                    x: point.x + deltaX,
                    y: point.y + deltaY
                }));
                drawCanvas();
            }
        } else if (isInDrawingMode) {
            drawCanvas();
        } else {
            // Change cursor when hovering over decorations and their handles
            let hoveringOverDecoration = false;
            let hoveringOverResizeHandle = false;
            
            for (let i = decorations.length - 1; i >= 0; i--) {
                const decoration = decorations[i];
                if (decoration && decorationImages[decoration.image]) {
                    const img = decorationImages[decoration.image];
                    const size = (decoration.size || 100) / 100;
                    const width = img.width * size;
                    const height = img.height * size;
                    
                    const dx = x - decoration.x;
                    const dy = y - decoration.y;
                    const rotation = -(decoration.rotation || 0) * Math.PI / 180;
                    const cos = Math.cos(rotation);
                    const sin = Math.sin(rotation);
                    const localX = dx * cos - dy * sin;
                    const localY = dx * sin + dy * cos;
                    
                    if (Math.abs(localX) <= width/2 && Math.abs(localY) <= height/2) {
                        hoveringOverDecoration = true;
                        
                        // Check if hovering over resize handles for selected decoration
                        if (i === selectedDecorationIndex) {
                            const resizeHandle = getDecorationResizeHandle(x, y, decoration);
                            if (resizeHandle) {
                                hoveringOverResizeHandle = true;
                                canvas.style.cursor = getResizeCursor(resizeHandle);
                                break;
                            }
                        }
                        break;
                    }
                }
            }
            
            // Set appropriate cursor
            if (hoveringOverResizeHandle) {
                // Cursor already set above
            } else if (hoveringOverDecoration) {
                canvas.style.cursor = 'move';
            } else {
                canvas.style.cursor = 'crosshair';
            }
        }
    });

    // Mouse up to end dragging and resizing - FIXED
    canvas.addEventListener('mouseup', function(e) {
      // Handle rectangle drawing preview
// Handle rectangle drawing completion
if (isDrawingArea && areaDrawingMode === 'rectangle' && rectangleStartPoint) {
    const coords = getCanvasCoordinates(e);
const x = coords.x;
const y = coords.y;
    
    // Create rectangle points
    const minX = Math.min(rectangleStartPoint.x, x);
    const maxX = Math.max(rectangleStartPoint.x, x);
    const minY = Math.min(rectangleStartPoint.y, y);
    const maxY = Math.max(rectangleStartPoint.y, y);
    
    currentPoints = [
        { x: minX, y: minY },
        { x: maxX, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY }
    ];
    
    rectangleStartPoint = null;
    finishDrawingArea();
    return;
}
        if (isDraggingVertex) {
            isDraggingVertex = false;
            draggedVertexIndex = -1;
            canvas.style.cursor = 'crosshair';
            showMessage('Vertex moved.');
        } else if (isResizingDepthEdge) {
            isResizingDepthEdge = false;
            resizingEndpoint = null;
            canvas.style.cursor = 'crosshair';
            showMessage('Depth edge resized.');
        } else if (isResizingDecoration) {
            isResizingDecoration = false;
            decorationResizeHandle = null;
            canvas.style.cursor = 'crosshair';
            showMessage('Decoration resized.');
        } else if (isResizingSill) {
            isResizingSill = false;
            resizingEndpoint = null;
            canvas.style.cursor = 'crosshair';
            showMessage('Sill resized.');
        } else if (isDragging) {
            isDragging = false;
            draggedElementType = null;
            draggedElementIndex = -1;
            canvas.style.cursor = 'crosshair';
            showMessage('Element moved.');
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (isDragging) {
                isDragging = false;
                draggedElementType = null;
                draggedElementIndex = -1;
                canvas.style.cursor = 'crosshair';
                if (draggedElementType === 'area' && areas[draggedElementIndex]) {
                    areas[draggedElementIndex].points = dragElementStartPoints;
                } else if (draggedElementType === 'depthEdge' && depthEdges[draggedElementIndex]) {
                    depthEdges[draggedElementIndex].points = dragElementStartPoints;
                } else if (draggedElementType === 'sill' && sills[draggedElementIndex]) {
                    sills[draggedElementIndex].points = dragElementStartPoints;
                } else if (draggedElementType === 'brickRow' && brickRows[draggedElementIndex]) {
                    brickRows[draggedElementIndex].points = dragElementStartPoints;
                } else if (draggedElementType === 'decoration' && decorations[draggedElementIndex]) {
                    decorations[draggedElementIndex].x = dragElementStartPoints[0].x;
                    decorations[draggedElementIndex].y = dragElementStartPoints[0].y;
                }
                drawCanvas();
                showMessage('Move cancelled.');
            } else if (isDraggingVertex) {
                isDraggingVertex = false;
                draggedVertexIndex = -1;
                canvas.style.cursor = 'crosshair';
                undo();
                showMessage('Vertex move cancelled.');
            } else if (isResizingDepthEdge) {
                isResizingDepthEdge = false;
                resizingEndpoint = null;
                canvas.style.cursor = 'crosshair';
                undo();
                showMessage('Depth edge resize cancelled.');
            } else if (isResizingDecoration) {
                isResizingDecoration = false;
                decorationResizeHandle = null;
                canvas.style.cursor = 'crosshair';
                undo();
                showMessage('Decoration resize cancelled.');
            } else if (isAddingDecoration) {
                isAddingDecoration = false;
                isInDrawingMode = false;
                canvas.style.cursor = 'crosshair';
                showMessage('Decoration placement cancelled.');
            } else if (isDrawingArea && currentPoints.length >= 3) {
                finishDrawingArea();
            } else if (isDrawingDepthEdge && depthEdgeMode === 'area' && currentDepthEdgePoints.length >= 3) {
                finishDrawingDepthArea();
            } else {
                isDrawingArea = false;
                isDrawingSill = false;
                isDrawingBrickRow = false;
                isDrawingDepthEdge = false;
                isInDrawingMode = false;
                currentPoints = [];
                currentSillPoints = [];
                currentBrickRowPoints = [];
                currentDepthEdgePoints = [];
                showMessage('Drawing cancelled.');
                drawCanvas();
            }
        } else if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        } else if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            redo();
        } else if (e.ctrlKey && e.key === 'c') {
            e.preventDefault();
            copySelectedElement();
        } else if (e.ctrlKey && e.key === 'v') {
            e.preventDefault();
            pasteElement();
        } else if (e.key === 'Delete') {
            e.preventDefault();
            deleteSelectedElement();
        }
    });
}

// Helper function for resize cursors
function getResizeCursor(handle) {
    switch(handle) {
        case 'nw': return 'nw-resize';
        case 'ne': return 'ne-resize';
        case 'sw': return 'sw-resize';
        case 'se': return 'se-resize';
        default: return 'pointer';
    }
}

// Text editing modal functions
function setupTextEditingModal() {
    const modal = document.getElementById('text-edit-modal');
    const closeBtn = document.getElementById('close-text-modal');
    const applyBtn = document.getElementById('apply-text-changes');
    const cancelBtn = document.getElementById('cancel-text-changes');
    const modalContent = modal ? modal.querySelector('.modal-content') : null;
    
    console.log('Setting up text edit modal');
    console.log('Modal found:', !!modal);
    console.log('Close button found:', !!closeBtn);
    console.log('Apply button found:', !!applyBtn);
    console.log('Cancel button found:', !!cancelBtn);
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            console.log('Close button clicked');
            e.preventDefault();
            e.stopPropagation();
            closeTextEditModal();
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function(e) {
            console.log('Cancel button clicked');
            e.preventDefault();
            e.stopPropagation();
            closeTextEditModal();
        });
    }
    
    if (applyBtn) {
        applyBtn.addEventListener('click', function(e) {
            console.log('Apply button clicked');
            e.preventDefault();
            e.stopPropagation();
            applyTextChanges();
        });
    }
    
    // Close modal when clicking outside the modal content
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeTextEditModal();
            }
        });
    }
    
    // Make modal draggable
    if (modalContent) {
        const modalHeader = modalContent.querySelector('.modal-header');
        if (modalHeader) {
            let isDragging = false;
            let currentX;
            let currentY;
            let initialX;
            let initialY;
            
            modalHeader.style.cursor = 'move';
            
            modalHeader.addEventListener('mousedown', function(e) {
                // Don't drag if clicking on close button
                if (e.target.id === 'close-text-modal' || e.target.closest('#close-text-modal')) {
                    return;
                }
                
                isDragging = true;
                initialX = e.clientX - (modalContent.offsetLeft || 0);
                initialY = e.clientY - (modalContent.offsetTop || 0);
                
                modalContent.style.position = 'fixed';
                modalContent.style.left = e.clientX - initialX + 'px';
                modalContent.style.top = e.clientY - initialY + 'px';
            });
            
            document.addEventListener('mousemove', function(e) {
                if (isDragging) {
                    e.preventDefault();
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                    
                    modalContent.style.left = currentX + 'px';
                    modalContent.style.top = currentY + 'px';
                }
            });
            
            document.addEventListener('mouseup', function() {
                isDragging = false;
            });
        }
    }
}

function closeTextEditModal() {
    console.log('closeTextEditModal called');
    const modal = document.getElementById('text-edit-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        console.log('Modal hidden');
    }
    editingTextAnnotation = null;
}

function applyTextChanges() {
    console.log('applyTextChanges called');
    console.log('editingTextAnnotation:', editingTextAnnotation);
    
    if (editingTextAnnotation === null || !annotations[editingTextAnnotation]) {
        console.log('No annotation to edit');
        return;
    }
    
    const textContent = document.getElementById('text-content');
    const textFontSize = document.getElementById('text-font-size');
    const textFontFamily = document.getElementById('text-font-family');
    const textColor = document.getElementById('text-color');
    const textBold = document.getElementById('text-bold');
    const textItalic = document.getElementById('text-italic');
    
    console.log('Form elements found:', {
        textContent: !!textContent,
        textFontSize: !!textFontSize,
        textFontFamily: !!textFontFamily,
        textColor: !!textColor,
        textBold: !!textBold,
        textItalic: !!textItalic
    });
    
    const annotation = annotations[editingTextAnnotation];
    annotation.text = textContent.value;
    annotation.size = parseInt(textFontSize.value);
    annotation.font = textFontFamily ? textFontFamily.value : 'Arial';
    annotation.color = textColor.value;
    annotation.bold = textBold.checked;
    annotation.italic = textItalic.checked;
    
    console.log('Updated annotation:', annotation);
    
    redrawAnnotations();
    closeTextEditModal();
    showMessage('Text updated.');

}


function getAreaBounds(points) {
    if (!points || points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    
    let minX = points[0].x;
    let maxX = points[0].x;
    let minY = points[0].y;
    let maxY = points[0].y;
    
    for (let i = 1; i < points.length; i++) {
        minX = Math.min(minX, points[i].x);
        maxX = Math.max(maxX, points[i].x);
        minY = Math.min(minY, points[i].y);
        maxY = Math.max(maxY, points[i].y);
    }
    
    return {
        minX: minX,
        minY: minY,
        maxX: maxX,
        maxY: maxY,
        width: maxX - minX,
        height: maxY - minY
    };
}

// Initialization
document.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById('main-canvas');
    drawingCanvas = document.getElementById('drawing-canvas');
    
    if (!canvas || !drawingCanvas) {
        console.error('Canvas elements not found');
        return;
    }
    
    ctx = canvas.getContext('2d');
    drawingCtx = drawingCanvas.getContext('2d');
    
    if (!ctx || !drawingCtx) {
        console.error('Could not get canvas contexts');
        return;
    }
    
    originalCanvasWidth = 1600;
originalCanvasHeight = 960;

// Sync drawing canvas size
drawingCanvas.width = canvas.width;
drawingCanvas.height = canvas.height;
console.log('Canvas initialized:', canvas.width, 'x', canvas.height);

setupButtonListeners();
console.log('Called setupButtonListeners()'); // ADD THIS LINE

// Load default texture images
const defaultTextures = {
    'coated': 'Images/Brick Textures/Coated.jpg',
    'matte': 'Images/Brick Textures/Matte.jpg', 
    'antique': 'Images/Brick Textures/Antique.jpg',
    'ruff': 'Images/Brick Textures/Ruff.jpg',
    'scratch': 'Images/Brick Textures/Scratch.jpg',
    'splitfaced': 'Images/Brick Textures/Splitfaced.jpg'
};

// Load all default textures at startup
function loadDefaultTextures() {
    Object.keys(defaultTextures).forEach(textureName => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            loadedTextures[textureName] = img;
            console.log(`Loaded default texture: ${textureName}`);
        };
        img.onerror = function() {
            console.warn(`Failed to load default texture: ${textureName}`);
        };
        img.src = defaultTextures[textureName];
    });
}

// Initialize texture system
function initializeTextureSystem() {
    // Load default textures if you want to provide some built-in ones
    // For now, we'll just ensure the system is ready for user uploads
    console.log('Texture system initialized');
    
    // Make sure texture controls are properly connected
    const textureSelect = document.getElementById('brick-texture-select');
    const textureUpload = document.getElementById('texture-upload');
    const textureIntensity = document.getElementById('texture-intensity-slider');
    
    if (!textureSelect || !textureUpload || !textureIntensity) {
        console.warn('Some texture controls not found - make sure HTML is correct');
    } else {
        console.log('All texture controls found and ready');
    }
}

// Call this in your main initialization function
// (add this line to wherever you initialize your application)
initializeTextureSystem();
loadDefaultTextures();

// Initialize preset system
loadAllPresets();
updatePresetsList();

// Auto-save every 10 seconds (but not during house changes)
let isChangingHouses = false;
setInterval(() => {
    if (!isChangingHouses) {
        autoSaveCurrentHouse();
    }
}, 10000);

    // Setup house selector dropdown
const houseSelect = document.getElementById('house-select');
if (houseSelect) {
    houseSelect.addEventListener('change', function() {
    isChangingHouses = true; // Prevent auto-save during switch
        
    // Auto-save previous house before switching
    if (previousHouseValue) {
        const previousHouseKey = getHouseKey(previousHouseValue);
        if (previousHouseKey && areas.length > 0) {
            housePresets[previousHouseKey] = {
                areas: JSON.parse(JSON.stringify(areas)),
                depthEdges: JSON.parse(JSON.stringify(depthEdges)),
                sills: JSON.parse(JSON.stringify(sills)),
                brickRows: JSON.parse(JSON.stringify(brickRows)),
                decorations: JSON.parse(JSON.stringify(decorations)),
                accents: JSON.parse(JSON.stringify(accents)),
                lastModified: Date.now(),
                housePath: previousHouseValue
            };
            saveAllPresets();
            console.log(`Auto-saved preset for previous house: ${previousHouseKey}`);
        }
    }
    console.log('=== BEFORE CLEARING ===');
    console.log('Current areas count:', areas.length);
    console.log('About to switch to:', getHouseKey(this.value));
    // Auto-save current house before switching

    
    const selectedImagePath = this.value;
    console.log('Loading house image:', selectedImagePath);
    console.log('House key for this image:', getHouseKey(selectedImagePath));
    loadHouseImage(selectedImagePath);
    
    // Clear all elements first
    areas = [];
    depthEdges = [];
    sills = [];
    brickRows = [];
    decorations = [];
    accents = [];
    annotations = [];
    selectedAreaIndex = -1;
    selectedDepthEdgeIndex = -1;
    selectedSillIndex = -1;
    selectedBrickRowIndex = -1;
    selectedDecorationIndex = -1;
    selectedAccentIndex = -1;
    selectedAnnotation = null;
    isInDrawingMode = false;
    
    // FORCE CLEAR everything first
areas = [];
depthEdges = [];
sills = [];
brickRows = [];
decorations = [];
accents = [];
console.log('=== FORCE CLEARED ALL ARRAYS ===');

// Try to load saved work for this house
const houseKey = getHouseKey(selectedImagePath);
if (houseKey && housePresets[houseKey]) {
    const preset = housePresets[houseKey];
    areas = preset.areas || [];
    depthEdges = preset.depthEdges || [];
    sills = preset.sills || [];
    brickRows = preset.brickRows || [];
    decorations = preset.decorations || [];
    accents = preset.accents || [];
    console.log(`Loaded saved work for: ${houseKey}`);
    console.log('=== LOADED AREAS COUNT ===', areas.length);
} else {
    console.log('=== NO PRESET FOUND FOR ===', houseKey);
    console.log('=== AREAS SHOULD BE EMPTY ===', areas.length);
}
    
    updateAreasList();
    updateDepthList();
    updateSillsList();
    updateBrickRowsList();
    updateDecorationsList();
    updateAccentsList();
    stonePatterns = {};
    processedSingleImages = {};
    disableMainAreaControls();
    resetSlidersToDefaults();
    drawCanvas();
    redrawAnnotations();
    updatePresetsList(); // Update preset list when switching houses
    // Remember this house for next time
    previousHouseValue = selectedImagePath;
    isChangingHouses = false; // Re-enable auto-save
});
    
    // Load the default house image
    loadHouseImage(houseSelect.value);
} else {
    console.log('No house selector found, drawing empty canvas');
    drawCanvas();
}
    
    // Setup all event listeners
    setupUploadListeners();
    setupMaterialPanel();
    setupButtonListeners();
    setupControlListeners();
    setupCanvasListeners();
    setupDrawingTools();
    setupDrawingCanvasListeners();

// DEBUG: Test drawing canvas clicks
console.log('=== DRAWING CANVAS DEBUG ===');
console.log('drawingCanvas element:', drawingCanvas);
console.log('drawingCanvas position:', drawingCanvas.getBoundingClientRect());
console.log('drawingCanvas z-index:', window.getComputedStyle(drawingCanvas).zIndex);
console.log('drawingCanvas pointer-events:', window.getComputedStyle(drawingCanvas).pointerEvents);

drawingCanvas.addEventListener('click', function(e) {
    console.log('!!! RAW CANVAS CLICK !!!');
    console.log('Event:', e);
    console.log('isDrawingToolsActive:', isDrawingToolsActive);
    console.log('currentDrawingTool:', currentDrawingTool);
    console.log('Canvas z-index at click:', this.style.zIndex);
    console.log('Canvas pointer-events at click:', this.style.pointerEvents);
});
    
    setupTextEditingModal();
  setupTextEditingModal();
  initializeFilters();
setupFilterEventListeners();
    
    // Load stone scale memory from localStorage if available
    try {
        const savedScaleMemory = localStorage.getItem('stoneScaleMemory');
        if (savedScaleMemory) {
            stoneScaleMemory = JSON.parse(savedScaleMemory);
            console.log('Loaded stone scale memory:', stoneScaleMemory);
        }
    } catch (e) {
        console.warn('Could not load stone scale memory:', e);
        stoneScaleMemory = {};
    }
    
    // Save scale memory periodically
    setInterval(() => {
        try {
            localStorage.setItem('stoneScaleMemory', JSON.stringify(stoneScaleMemory));
        } catch (e) {
            console.warn('Could not save stone scale memory:', e);
        }
    }, 5000); // Save every 5 seconds
    
    // Initial draw
    drawCanvas();
    
    console.log('Stone Visualizer initialized successfully');
});

// TEMPORARY DEBUG - Add this at the very end of your script.js file
console.log('Checking sliders...');
console.log('Texture intensity slider:', document.getElementById('texture-intensity-slider'));
console.log('Texture scale slider:', document.getElementById('texture-scale-slider'));
console.log('Texture contrast slider:', document.getElementById('texture-contrast-slider'));

// TEMPORARY TEST - Add this right after the debug code above
const testSlider = document.getElementById('texture-intensity-slider');
if (testSlider) {
    testSlider.addEventListener('input', function(e) {
        console.log('Slider moved to:', e.target.value);
        document.getElementById('texture-intensity-value').textContent = e.target.value + '%';
    });
    console.log('Test slider event listener added');
} else {
    console.log('Texture intensity slider NOT FOUND');
}

// REPLACE your entire setupFilterSearch() function with this:

function setupFilterSearch() {
    const filterSearchBtn = document.getElementById('filter-search-btn');
    const filterPanel = document.getElementById('filter-panel');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    
    console.log('Setting up filter search...');
    console.log('Filter button found:', !!filterSearchBtn);
    console.log('Filter panel found:', !!filterPanel);
    
    // Enhanced toggle filter panel visibility
    if (filterSearchBtn && filterPanel) {
        filterSearchBtn.addEventListener('click', function() {
            const isHidden = filterPanel.classList.contains('hidden');
            
            if (isHidden) {
                // Opening panel
                filterPanel.classList.remove('hidden');
                this.classList.add('active');
                this.innerHTML = '<span class="filter-icon">✖</span>Close Filters';
                
                // Add opening animation
                filterPanel.style.opacity = '0';
                filterPanel.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    filterPanel.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                    filterPanel.style.opacity = '1';
                    filterPanel.style.transform = 'translateY(0)';
                }, 10);
                
                populateFilterOptions(); // Populate options when panel opens
                console.log('Filter panel shown');
                showMessage('Filter panel opened. Use filters to narrow stone selection.');
            } else {
                // Closing panel
                filterPanel.style.opacity = '0';
                filterPanel.style.transform = 'translateY(-10px)';
                
                setTimeout(() => {
                    filterPanel.classList.add('hidden');
                    this.classList.remove('active');
                    this.innerHTML = '<span class="filter-icon">🔍</span>Filter';
                }, 200);
                
                console.log('Filter panel hidden');
                showMessage('Filter panel closed.');
            }
        });
        
        // Add enhanced hover effects
        filterSearchBtn.addEventListener('mouseenter', function() {
            if (!this.classList.contains('active')) {
                this.style.transform = 'translateY(-2px) scale(1.02)';
            }
        });
        
        filterSearchBtn.addEventListener('mouseleave', function() {
            if (!this.classList.contains('active')) {
                this.style.transform = 'translateY(0) scale(1)';
            }
        });
    } else {
        console.error('Filter button or panel not found!');
    }
    
    // Clear filters functionality (keep your existing clear filters code here)
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            clearAllFilters();
            showMessage('All filters cleared.');
        });
    }
}
// Add scroll indicator for material grid
function addScrollIndicator() {
    const container = document.querySelector('.material-grid-container');
    if (!container) return;
    
    // Create scroll indicator
    const indicator = document.createElement('div');
    indicator.className = 'scroll-indicator';
    indicator.innerHTML = '↓ More stones below ↓';
    indicator.style.cssText = `
        position: absolute;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(52, 152, 219, 0.9);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        z-index: 10;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    container.style.position = 'relative';
    container.appendChild(indicator);
    
    // Show/hide indicator based on scroll position
    function updateScrollIndicator() {
        const isScrollable = container.scrollHeight > container.clientHeight;
        const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 5;
        
        if (isScrollable && !isAtBottom) {
            indicator.style.opacity = '1';
        } else {
            indicator.style.opacity = '0';
        }
    }
    
    // Update on scroll and content changes
    container.addEventListener('scroll', updateScrollIndicator);
    updateScrollIndicator(); // Initial check
}
function populateFilterOptions() {
    // Use your exact filterOptions data
    const stoneTypeSelect = document.querySelector('[data-filter="Stone Type"]');
    if (stoneTypeSelect) {
        stoneTypeSelect.innerHTML = '<option value="">All Types</option>';
        filterOptions['Stone Type'].forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            stoneTypeSelect.appendChild(option);
        });
    }
    
    // Populate Color dropdown with your exact color classifications
    const colorSelect = document.querySelector('[data-filter="Color"]');
    if (colorSelect) {
        colorSelect.innerHTML = '<option value="">All Colors</option>';
        filterOptions['Color'].forEach(color => {
            const option = document.createElement('option');
            option.value = color;
            option.textContent = color;
            colorSelect.appendChild(option);
        });
    }
    
    // Populate Regional Style dropdown
    const styleSelect = document.querySelector('[data-filter="Regional Style"]');
    if (styleSelect) {
        styleSelect.innerHTML = '<option value="">All Styles</option>';
        filterOptions['Regional Style'].forEach(style => {
            const option = document.createElement('option');
            option.value = style;
            option.textContent = style;
            styleSelect.appendChild(option);
        });
    }
    
    // Add Collection and Texture filters (update HTML to include these)
    const collectionSelect = document.querySelector('[data-filter="Collection"]');
    if (collectionSelect) {
        collectionSelect.innerHTML = '<option value="">All Collections</option>';
        filterOptions['Collection'].forEach(collection => {
            const option = document.createElement('option');
            option.value = collection;
            option.textContent = collection;
            collectionSelect.appendChild(option);
        });
    }
    
    const textureSelect = document.querySelector('[data-filter="Texture"]');
    if (textureSelect) {
        textureSelect.innerHTML = '<option value="">All Textures</option>';
        filterOptions['Texture'].forEach(texture => {
            const option = document.createElement('option');
            option.value = texture;
            option.textContent = texture;
            textureSelect.appendChild(option);
        });
    }
    
    const heightSelect = document.querySelector('[data-filter="Height"]');
    if (heightSelect) {
        heightSelect.innerHTML = '<option value="">All Heights</option>';
        filterOptions['Height'].forEach(height => {
            const option = document.createElement('option');
            option.value = height;
            option.textContent = height;
            heightSelect.appendChild(option);
        });
    }
    
    const shapeSelect = document.querySelector('[data-filter="Shape"]');
    if (shapeSelect) {
        shapeSelect.innerHTML = '<option value="">All Shapes</option>';
        filterOptions['Shape'].forEach(shape => {
            const option = document.createElement('option');
            option.value = shape;
            option.textContent = shape;
            shapeSelect.appendChild(option);
        });
    }
}

function setupFilterDropdowns() {
    const filterSelects = document.querySelectorAll('.filter-select');
    
    filterSelects.forEach(select => {
        select.addEventListener('change', function() {
            console.log('Filter changed:', this.dataset.filter, '=', this.value);
            updateActiveFilters();
            applyFilters();
        });
    });
}

function updateActiveFilters() {
    const activeFilters = document.getElementById('active-filters');
    if (!activeFilters) return;
    
    activeFilters.innerHTML = '';
    
    const filterSelects = document.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
        if (select.value) {
            const filterTag = document.createElement('div');
            filterTag.className = 'filter-tag';
            filterTag.innerHTML = `
    ${select.dataset.filter}: ${select.value}
    <span class="remove-filter" style="cursor: pointer;" onclick="removeFilter('${select.dataset.filter}'); event.stopPropagation();">×</span>
`;
            activeFilters.appendChild(filterTag);
        }
    });
}

function removeFilter(filterType) {
    console.log('removeFilter called for:', filterType);
    
    const filterSelects = document.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
        if (select.dataset.filter === filterType) {
            console.log('Clearing filter:', filterType, 'old value:', select.value);
            select.value = '';
        }
    });
    
    updateActiveFilters();
    
    // Check if there are any active filters left
    const activeFilterSelects = document.querySelectorAll('.filter-select');
    let hasActiveFilters = false;
    
    activeFilterSelects.forEach(select => {
        if (select.value) {
            hasActiveFilters = true;
            console.log('Still active filter:', select.dataset.filter, '=', select.value);
        }
    });
    
    console.log('Has active filters:', hasActiveFilters);
    
    // If no filters are active, show all materials, otherwise apply remaining filters
    if (!hasActiveFilters) {
        console.log('No active filters - showing all materials');
        showAllMaterials();
        showMessage('All filters cleared - showing all stones.');
    } else {
        console.log('Applying remaining filters');
        applyFilters();
        showMessage(`${filterType} filter removed.`);
    }
}

function getStoneProfile(stoneName) {
    // Extract profile from STONE_MATERIALS based on stone name
    const stone = STONE_MATERIALS.find(s => s.name === stoneName);
    return stone ? stone.profile : null;
}

function getStoneColor(stoneName) {
    // Use your colorClassification mapping
    return colorClassification[stoneName] || 'Mixed';
}

function applyFilters() {
    // Get active filter values
    const filters = {};
    const filterSelects = document.querySelectorAll('.filter-select');
    
    filterSelects.forEach(select => {
        if (select.value) {
            filters[select.dataset.filter] = select.value;
        }
    });
    
    console.log('Applying filters:', filters);
    
    let visibleCount = 0;
    const materialItems = document.querySelectorAll('.material-item');
    
    materialItems.forEach(item => {
        let shouldShow = true;
        
        // Get stone name from the item
        const stoneNameElement = item.querySelector('span');
        if (!stoneNameElement) return;
        
        const stoneName = stoneNameElement.textContent.trim();
        
        // Apply each filter
        Object.entries(filters).forEach(([filterType, filterValue]) => {
            if (filterType === 'Color') {
                const stoneColor = getStoneColor(stoneName);
                if (stoneColor !== filterValue) {
                    shouldShow = false;
                }
            } else if (filterType === 'Stone Type') {
                const profile = getStoneProfile(stoneName);
                if (profile !== filterValue) {
                    shouldShow = false;
                }
            }
        });
        
        if (shouldShow) {
            item.style.display = 'flex';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    console.log(`Showing ${visibleCount} stones after filtering`);
    showMessage(`Showing ${visibleCount} stone profiles.`);
}
    
    // Apply filters to material items
    const materialItems = document.querySelectorAll('.material-item:not(.upload-material)');
    let visibleCount = 0;
    
    materialItems.forEach(item => {
        let shouldShow = true;
        
        // Get stone data for this item
        const stoneName = item.querySelector('span')?.textContent;
        const stoneData = STONE_MATERIALS.find(stone => stone.name === stoneName);
        
        if (stoneData && stoneName) {
            const profile = stoneData.profile;
            const profileMetadata = stoneMetadata[profile];
            const stoneColor = getStoneColor(stoneName);
            
            // Filter by Stone Type
            if (filters['Stone Type'] && profileMetadata && profileMetadata['Stone Type'] !== filters['Stone Type']) {
                shouldShow = false;
            }
            
            // Filter by Color using your color classifications
            if (filters['Color'] && stoneColor !== filters['Color']) {
                shouldShow = false;
            }
            
            // Filter by Regional Style
            if (filters['Regional Style'] && profileMetadata && profileMetadata['Regional Style']) {
                if (Array.isArray(profileMetadata['Regional Style'])) {
                    if (!profileMetadata['Regional Style'].includes(filters['Regional Style'])) {
                        shouldShow = false;
                    }
                } else if (profileMetadata['Regional Style'] !== filters['Regional Style']) {
                    shouldShow = false;
                }
            }
            
            // Filter by Collection
            if (filters['Collection'] && profileMetadata && profileMetadata['Collection'] !== filters['Collection']) {
                shouldShow = false;
            }
            
            // Filter by Texture
            if (filters['Texture'] && profileMetadata && profileMetadata['Texture'] !== filters['Texture']) {
                shouldShow = false;
            }
            
            // Filter by Height
            if (filters['Height'] && profileMetadata && profileMetadata['Height'] !== filters['Height']) {
                shouldShow = false;
            }
            
            // Filter by Shape
            if (filters['Shape'] && profileMetadata && profileMetadata['Shape'] !== filters['Shape']) {
                shouldShow = false;
            }
        }
        
        if (shouldShow) {
            item.style.display = 'flex';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    showMessage(`Showing ${visibleCount} stone profiles.`);


function showAllMaterials() {
    const materialItems = document.querySelectorAll('.material-item');
    materialItems.forEach(item => {
        item.style.display = 'flex';
    });
}

// Initialize filter search when the page loads
setupFilterSearch();

// COMPREHENSIVE DEBUG
console.log('=== COMPREHENSIVE DEBUG ===');
console.log('1. Canvas element exists:', !!document.getElementById('main-canvas'));
console.log('2. Drawing canvas exists:', !!document.getElementById('drawing-canvas'));
console.log('3. Canvas variable set:', !!canvas);
console.log('4. Context variable set:', !!ctx);
console.log('5. DOMContentLoaded fired');

// Check if canvas has size
if (canvas) {
    console.log('6. Canvas size:', canvas.width, 'x', canvas.height);
    console.log('7. Canvas style:', canvas.style.cssText);
} else {
    console.log('6. NO CANVAS FOUND');
}

// Check house selector
const houseSelect = document.getElementById('house-select');
console.log('8. House selector exists:', !!houseSelect);
if (houseSelect) {
    console.log('9. House selector value:', houseSelect.value);
} else {
    console.log('9. NO HOUSE SELECTOR');
}

// Check if drawCanvas function exists
console.log('10. drawCanvas function exists:', typeof drawCanvas);

// Try to call drawCanvas manually
try {
    console.log('11. Attempting to call drawCanvas...');
    drawCanvas();
    console.log('12. drawCanvas called successfully');
} catch (error) {
    console.log('12. ERROR calling drawCanvas:', error);
}

// Check if there are any areas defined
console.log('13. Areas array:', areas);
console.log('14. Current image:', !!currentImage);

function clearAllFilters() {
    console.log('Clearing all filters');
    
    const filterSelects = document.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
        select.value = '';
        select.classList.remove('active');
    });
    
    const activeFilters = document.getElementById('active-filters');
    if (activeFilters) {
        activeFilters.innerHTML = '';
    }
    
    const materialItems = document.querySelectorAll('.material-item');
    materialItems.forEach(item => {
        item.style.display = 'flex';
    });
    
    console.log('All filters cleared and materials restored');
}

function showAllMaterials() {
    const materialItems = document.querySelectorAll('.material-item');
    materialItems.forEach(item => {
        item.style.display = 'flex';
    });
    console.log('All materials are now visible');
}


// =========================
// Spec Sheet (two-page PDF) — non-invasive add-on
// =========================
(function(){
  function onReady(fn){ if(document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  // Helper to title-case slugs for Manufacturer/Profile
  function titleCaseSlug(s){
    if(!s) return '';
    return String(s).replace(/[\-_]+/g,' ').split(' ').filter(Boolean).map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
  }

  // Use existing helper if present
  const _findStoneByUrl = (typeof findStoneByUrl === 'function') ? findStoneByUrl : function(url){
    if(!url) return null; return (typeof STONE_MATERIALS !== 'undefined' ? STONE_MATERIALS : []).find(s=>s.url===url) || null;
  };

  function loadImage(src){
    return new Promise((res, rej)=>{ const i=new Image(); i.crossOrigin='anonymous'; i.onload=()=>res(i); i.onerror=rej; i.src=src; });
  }

  // Merge canvases using your existing IDs without changing current logic
  function safeMergeToWidth(targetWidth){
    const base = document.getElementById('main-canvas') || window.canvas;
    const overlay = document.getElementById('drawing-canvas') || window.drawingCanvas;
    if(!base || !base.getContext) return null;
    const srcW = base.width, srcH = base.height;
    const scale = (typeof targetWidth==='number' && targetWidth>0) ? (targetWidth/srcW) : 1;
    const out = document.createElement('canvas');
    out.width = Math.round(srcW*scale); out.height = Math.round(srcH*scale);
    const ctx = out.getContext('2d');
    ctx.drawImage(base, 0,0, srcW,srcH, 0,0, out.width,out.height);
    if(overlay && overlay.width && overlay.height){ ctx.drawImage(overlay, 0,0, overlay.width,overlay.height, 0,0, out.width,out.height); }
    return out;
  }

  function collectAppliedProducts(){
    const rows = [];
    try {
      if(Array.isArray(areas)){
        areas.forEach(a=>{
          if(!a) return;
          const stoneUrl = a.materialUrl || a.stoneUrl || a.stone || (a.stone && a.stone.url) || a.url;
          const meta = _findStoneByUrl(stoneUrl);
          if(meta){ rows.push({ manufacturer: (meta.manufacturer? titleCaseSlug(meta.manufacturer):''), profile: meta.profile? titleCaseSlug(meta.profile):'', color: meta.name||meta.color||'', sampleUrl: meta.url }); }
        });
      }
    } catch(_){}
    try {
      if(typeof currentStone !== 'undefined' && rows.length===0){
        const meta = (typeof currentStone==='string') ? _findStoneByUrl(currentStone) : currentStone;
        if(meta){ rows.push({ manufacturer: (meta.manufacturer? titleCaseSlug(meta.manufacturer):''), profile: meta.profile? titleCaseSlug(meta.profile):'', color: meta.name||meta.color||'', sampleUrl: meta.url }); }
      }
    } catch(_){}
    const seen = new Set();
    return rows.filter(r=>{ const k=[r.manufacturer,r.profile,r.color,r.sampleUrl].join('|'); if(seen.has(k)) return false; seen.add(k); return true; });
  }

  async function renderPages(){
    const PWIDTH = 1650, PHEIGHT = 1275; // landscape
    // Page 1
    const page1 = document.createElement('canvas'); page1.width=PWIDTH; page1.height=PHEIGHT; const p1 = page1.getContext('2d');
    p1.fillStyle='#fff'; p1.fillRect(0,0,PWIDTH,PHEIGHT);
    // Logo (optional)
    try{
      const logoEl = document.querySelector('#brand-logo img, img.brand-logo, .brand-logo img');
      if(logoEl && logoEl.src){ const li = await loadImage(logoEl.src); const h=80, w=Math.round(li.width*(h/li.height)); p1.drawImage(li, 80, 60, w, h); }
    }catch(_){ }
    // Hero image
    const hero = safeMergeToWidth(PWIDTH-240);
    if(hero){ const hW=hero.width, hH=hero.height; const maxW=PWIDTH-240, maxH=PHEIGHT-260; const s=Math.min(maxW/hW, maxH/hH); const dW=Math.round(hW*s), dH=Math.round(hH*s); const x=Math.round((PWIDTH-dW)/2), y=160; p1.drawImage(hero, x,y,dW,dH); }

    // Page 2
    const page2 = document.createElement('canvas'); page2.width=PWIDTH; page2.height=PHEIGHT; const p2 = page2.getContext('2d');
    p2.fillStyle='#fff'; p2.fillRect(0,0,PWIDTH,PHEIGHT);
    const left=120, right=120, tableTop=220; // Title
    p2.fillStyle='#000'; p2.fillRect(left, tableTop-40, PWIDTH-left-right, 4);
    p2.font='bold 28px sans-serif'; p2.textAlign='center'; p2.fillText('Applied Products', PWIDTH/2, tableTop-60);

    // Columns: Sample | Manufacturer | Profile | Color
    const cols=[ {key:'sample',label:'Sample',width:140}, {key:'manufacturer',label:'Manufacturer',width:360}, {key:'profile',label:'Profile',width:420}, {key:'color',label:'Color',width:290} ];
    const colX=[]; let cx=left; cols.forEach(c=>{ colX.push(cx); cx+=c.width; }); const tableW=cx-left; const rowH=120;
    p2.font='bold 18px sans-serif'; p2.textAlign='left'; p2.fillStyle='#555';
    cols.forEach((c,i)=>{ p2.fillText(c.label, colX[i] + (i===0?84:12), tableTop+20); });
    p2.strokeStyle='rgba(0,0,0,0.15)'; p2.lineWidth=1; p2.beginPath(); p2.moveTo(left, tableTop+30); p2.lineTo(left+tableW, tableTop+30); p2.stroke();

    const rows = collectAppliedProducts();
    const data = (rows && rows.length)? rows : [{ manufacturer:'', profile:'', color:'', sampleUrl:'', __placeholder:'No applied products found' }];
    let y = tableTop + 30;
    for(let i=0;i<data.length;i++){
      y += rowH; const rowTop=y-rowH+20; const rec=data[i];
      p2.strokeStyle='rgba(0,0,0,0.12)'; p2.beginPath(); p2.moveTo(left, y); p2.lineTo(left+tableW, y); p2.stroke();
      // sample thumbnail
      try{
        if(rec.sampleUrl){ const img = await loadImage(rec.sampleUrl); p2.drawImage(img, colX[0]+20, rowTop, 80,80); p2.strokeStyle='rgba(0,0,0,0.2)'; p2.strokeRect(colX[0]+20-0.5,rowTop-0.5,81,81); }
        else { p2.fillStyle='#ddd'; p2.fillRect(colX[0]+20, rowTop, 80,80); }
      }catch(_){ p2.fillStyle='#ddd'; p2.fillRect(colX[0]+20, rowTop, 80,80); }
      // text cells
      p2.fillStyle='#222'; p2.font='16px sans-serif';
      if(rec.__placeholder){ p2.fillStyle='#666'; p2.font='italic 16px sans-serif'; p2.fillText(rec.__placeholder, colX[1]+12, rowTop+48); p2.fillStyle='#222'; p2.font='16px sans-serif'; }
      else {
        p2.fillText(rec.manufacturer||'', colX[1]+12, rowTop+48);
        p2.fillText(rec.profile||'',      colX[2]+12, rowTop+48);
        p2.fillText(rec.color||'',        colX[3]+12, rowTop+48);
      }
    }
    return {page1,page2};
  }

  function ensureJsPDF(){
    return new Promise((resolve,reject)=>{
      if(window.jspdf && window.jspdf.jsPDF) return resolve(window.jspdf.jsPDF);
      const s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
      s.onload=()=>{ try{ resolve(window.jspdf.jsPDF); }catch(e){ reject(e);} };
      s.onerror=()=>reject(new Error('Failed to load jsPDF'));
      document.head.appendChild(s);
    });
  }

  async function downloadSpecSheetPDF(){
    const {page1,page2} = await renderPages();
    const jsPDFCtor = await ensureJsPDF();
    const doc = new jsPDFCtor({ orientation:'landscape', unit:'px', format:[page1.width, page1.height] });
    doc.addImage(page1.toDataURL('image/png'),'PNG',0,0,page1.width,page1.height);
    doc.addPage([page2.width,page2.height],'landscape');
    doc.addImage(page2.toDataURL('image/png'),'PNG',0,0,page2.width,page2.height);
    const stamp=new Date().toISOString().replace(/[:.]/g,'-');
    doc.save(`spec-sheet-${stamp}.pdf`);
  }

  onReady(function(){
    const specBtn = document.getElementById('download-specsheet');
    if(!specBtn) return; // non-invasive: only binds if button exists
    specBtn.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      downloadSpecSheetPDF().catch(err=>{ console.error(err); alert('Unable to generate spec sheet yet. Ensure image and selections are loaded.'); });
    });
  });
})();



// ==== Append-only: Ensure Interstate full-brick is available without altering existing code ====
(function(){
  try {
    // 1) Define Interstate list only if missing or empty
    if (!Array.isArray(window.FULL_BRICK_INTERSTATE) || window.FULL_BRICK_INTERSTATE.length === 0) {
      window.FULL_BRICK_INTERSTATE = [
        { name: 'Almond Brick',           profile: 'full-brick', url: 'Images/Full Brick/Interstate/Almond-Brick.jpg',              manufacturer: 'interstate-brick' },
        { name: 'Ash',                    profile: 'full-brick', url: 'Images/Full Brick/Interstate/Ash.jpg',                        manufacturer: 'interstate-brick' },
        { name: 'Coal',                   profile: 'full-brick', url: 'Images/Full Brick/Interstate/Coal.jpg',                       manufacturer: 'interstate-brick' },
        { name: 'Arctic White',           profile: 'full-brick', url: 'Images/Full Brick/Interstate/Interstate-Arctic-White.jpg',    manufacturer: 'interstate-brick' },
        { name: 'Pewter',                 profile: 'full-brick', url: 'Images/Full Brick/Interstate/Pewter.jpg',                     manufacturer: 'interstate-brick' },
        { name: 'Platinum',               profile: 'full-brick', url: 'Images/Full Brick/Interstate/Platinum.jpg',                   manufacturer: 'interstate-brick' },
        { name: 'Desert Sand',            profile: 'full-brick', url: 'Images/Full Brick/Interstate/Interstate-Brick-Desert-Sand.jpg', manufacturer: 'interstate-brick' },
        { name: 'Monterey',               profile: 'full-brick', url: 'Images/Full Brick/Interstate/Interstate-Brick-Monterey.webp', manufacturer: 'interstate-brick' },
        { name: 'Platinum (Interstate)',  profile: 'full-brick', url: 'Images/Full Brick/Interstate/Interstate-Brick-Platinum.jpg',  manufacturer: 'interstate-brick' },
        { name: 'Smokey Mountain',        profile: 'full-brick', url: 'Images/Full Brick/Interstate/Interstate-Brick-Smokey-Mountain.jpg', manufacturer: 'interstate-brick' },
        { name: 'Tumbleweed',                profile: 'full-brick', url: 'Images/Full Brick/Interstate/Interstate-Brick-Tumbleweed.jpg',   manufacturer: 'interstate-brick' },
        { name: 'Midnight Black',        profile: 'full-brick', url: 'Images/Full Brick/Interstate/Midnight-Black_full.jpg',       manufacturer: 'interstate-brick' },
     { name: 'Obsidian Black',         profile: 'full-brick', url: 'Images/Full Brick/Interstate/Interstate-Obsidian-Black.jpg',  manufacturer: 'interstate-brick' },
        { name: 'Copperstone',            profile: 'full-brick', url: 'Images/Full Brick/Interstate/Interstate-Brick-Copperstone.jpg', manufacturer: 'interstate-brick' },
        { name: 'Mountain Red',           profile: 'full-brick', url: 'Images/Full Brick/Interstate/Mountain-Red-Interstate.jpg',    manufacturer: 'interstate-brick' },
        
      ];
      console.log('[FullBrick] Interstate list created (append-only).');
    }

    // 2) Ensure aggregated list exists and includes Interstate (dedupe by URL)
    if (!Array.isArray(window.FULL_BRICK_MATERIALS)) { window.FULL_BRICK_MATERIALS = []; }
    (function mergeOnce(){
      const existing = new Set(window.FULL_BRICK_MATERIALS.map(it => it && it.url));
      let added = 0;
      for (const it of window.FULL_BRICK_INTERSTATE) {
        if (!it || !it.url) continue;
        if (!existing.has(it.url)) { window.FULL_BRICK_MATERIALS.push(it); existing.add(it.url); added++; }
      }
      if (added) console.log(`[FullBrick] Interstate merged into aggregated list (+${added}).`);
    })();

    // 3) If the dropdown is currently set to Interstate, nudge a re-render non-invasively
    setTimeout(function(){
      const sel = document.querySelector('#full-brick-manufacturer-select');
      if (sel && sel.value === 'interstate-brick') {
        // Prefer dispatching change so existing wiring runs
        try { sel.dispatchEvent(new Event('change', { bubbles:true })); } catch(_) {}
      }
    }, 0);
  } catch(e) {
    console.warn('Interstate append-only bootstrap skipped:', e);

}

// ==== Append-only: Interstate bootstrap (safe, non-destructive) ====
(function(){
  try {
    // 1) Define Interstate list only if missing/empty
    if (!Array.isArray(window.FULL_BRICK_INTERSTATE) || window.FULL_BRICK_INTERSTATE.length === 0) {
      window.FULL_BRICK_INTERSTATE = [
        { name: 'Almond Brick',           profile: 'full-brick', url: 'Images/Full Brick/Interstate/Almond-Brick.jpg',              manufacturer: 'interstate-brick' },
        { name: 'Ash',                    profile: 'full-brick', url: 'Images/Full Brick/Interstate/Ash.jpg',                        manufacturer: 'interstate-brick' },
        { name: 'Coal',                   profile: 'full-brick', url: 'Images/Full Brick/Interstate/Coal.jpg',                       manufacturer: 'interstate-brick' },
        { name: 'Arctic White',           profile: 'full-brick', url: 'Images/Full Brick/Interstate/Interstate-Arctic-White.jpg',    manufacturer: 'interstate-brick' },
        { name: 'Pewter',                 profile: 'full-brick', url: 'Images/Full Brick/Interstate/Pewter.jpg',                     manufacturer: 'interstate-brick' },
        { name: 'Platinum',               profile: 'full-brick', url: 'Images/Full Brick/Interstate/Platinum.jpg',                   manufacturer: 'interstate-brick' },
        { name: 'Desert Sand',            profile: 'full-brick', url: 'Images/Full Brick/Interstate/Interstate-Brick-Desert-Sand.jpg', manufacturer: 'interstate-brick' },
        { name: 'Monterey',               profile: 'full-brick', url: 'Images/Full Brick/Interstate/Interstate-Brick-Monterey.webp', manufacturer: 'interstate-brick' },
        { name: 'Platinum (Interstate)',  profile: 'full-brick', url: 'Images/Full Brick/Interstate/Interstate-Brick-Platinum.jpg',  manufacturer: 'interstate-brick' },
        { name: 'Smokey Mountain',        profile: 'full-brick', url: 'Images/Full Brick/Interstate/Interstate-Brick-Smokey-Mountain.jpg', manufacturer: 'interstate-brick' },
        { name: 'Tumbleweed',                profile: 'full-brick', url: 'Images/Full Brick/Interstate/Interstate-Brick-Tumbleweed.jpg',   manufacturer: 'interstate-brick' },
        { name: 'Midnight Black',        profile: 'full-brick', url: 'Images/Full Brick/Interstate/Midnight-Black_full.jpg',       manufacturer: 'interstate-brick' },
        { name: 'Obsidian Black',         profile: 'full-brick', url: 'Images/Full Brick/Interstate/Interstate-Obsidian-Black.jpg',  manufacturer: 'interstate-brick' },
        { name: 'Copperstone',            profile: 'full-brick', url: 'Images/Full Brick/Interstate/Interstate-Brick-Copperstone.jpg', manufacturer: 'interstate-brick' },
        { name: 'Mountain Red',           profile: 'full-brick', url: 'Images/Full Brick/Interstate/Mountain-Red-Interstate.jpg',    manufacturer: 'interstate-brick' },
        
      ];
      console.log('[FullBrick] Interstate list created (append-only).');
    }

    // 2) Ensure aggregated list exists and includes Interstate (dedupe by URL)
    if (!Array.isArray(window.FULL_BRICK_MATERIALS)) { window.FULL_BRICK_MATERIALS = []; }
    (function mergeOnce(){
      const existing = new Set(window.FULL_BRICK_MATERIALS.map(it => it && it.url));
      let added = 0;
      for (const it of window.FULL_BRICK_INTERSTATE) {
        if (!it || !it.url) continue;
        if (!existing.has(it.url)) { window.FULL_BRICK_MATERIALS.push(it); existing.add(it.url); added++; }
      }
      if (added) console.log(`[FullBrick] Interstate merged into aggregated list (+${added}).`);
    })();

    // 3) If the dropdown is currently set to Interstate, nudge your existing render
    setTimeout(function(){
      const sel = document.querySelector('#full-brick-manufacturer-select');
      if (sel && sel.value === 'interstate-brick') {
        try { sel.dispatchEvent(new Event('change', { bubbles:true })); } catch(_) {}
      }
    }, 0);
  } catch(e) {
    console.warn('Interstate append-only bootstrap skipped:', e);
  }
})();

})();


  
// ==== Append-only: Safe Full Brick click handler (no collapsing, apply to selected area) ====
(function(){

    
  // --- tiny DOM helpers (local only; won't override globals) ---
  const $ = (s, r)=> (r||document).querySelector(s);
  const $$ = (s, r)=> Array.from((r||document).querySelectorAll(s));

    // Ensure the texture is in the shared cache before drawing
  function ensureImageInCache(url, then){
    try {
      if (!url) { if (typeof then === 'function') then(false); return; }
      if (window.stoneImages && window.stoneImages[url] instanceof HTMLImageElement) {
        if (window.stoneImages[url].complete) {
          if (typeof then === 'function') then(true);
          return;
        }
      } else {
        // create cache object if missing
        if (!window.stoneImages) window.stoneImages = {};
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function(){
          window.stoneImages[url] = img;
          if (typeof then === 'function') then(true);
        };
        img.onerror = function(){ if (typeof then === 'function') then(false); };
        img.src = url;
        return;
      }
      // image exists in cache; if it’s still loading, wait a frame
      requestAnimationFrame(()=> (typeof then === 'function') && then(true));
    } catch(_) { if (typeof then === 'function') then(false); }
  }

  // Override any earlier aggressive collapse with a safe version
  function revealCanvas(){
  // AUTO-HIDE MATERIAL PANEL WHEN FULL BRICK IS SELECTED FOR CLEAR CANVAS VIEW
  const materialPanel = document.querySelector('.material-selection-panel');
  if (materialPanel) {
      materialPanel.classList.remove('active');
      console.log('Material panel hidden for clear canvas view');
  }

  // Also remove active state from all tabs
  document.querySelectorAll('.material-tab').forEach(tab => tab.classList.remove('active'));
  
  try {
    const canvas = $('#main-canvas') || $('canvas#mainCanvas') || $('canvas');
    if (canvas && canvas.scrollIntoView) {
      canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  } catch(_) {}
}
  // Expose as global (overwrites any previous function named revealCanvas in the same scope)
  try { window.revealCanvas = revealCanvas; } catch(_) {}

  function getSelectedAreaIndex(){
  // 1) honor explicit selection - use global variable
  if (typeof selectedAreaIndex === 'number' && selectedAreaIndex >= 0) return selectedAreaIndex;

  // 2) look for any flagged area - use global variable
  if (Array.isArray(areas) && areas.length) {
    const flagged = areas.findIndex(a => a && (a.isSelected || a.selected));
    if (flagged >= 0) return flagged;

    // 3) fallback: use the most recently added area - use global variable
    return areas.length - 1;
  }

  // none
  return -1;
}

  function applyFullBrickToSelectedArea(item){
      // keep global currentMaterial in sync (same pattern as stone/thin)
  window.currentMaterial = {
    type: 'full-brick',
    name: item?.name || 'Full Brick',
    url: item?.url || '',
    manufacturer: item?.manufacturer || '',
    profile: item?.profile || 'full-brick'
  };
    if (!item) return false;
    try { window.currentStone = item; } catch(_) {}

    const idx = getSelectedAreaIndex();
    // if nothing looked selected but areas exist, pick the last area and flag it selected
if (idx === -1 && Array.isArray(areas) && areas.length) {
  selectedAreaIndex = areas.length - 1;
}
    if (idx >= 0 && Array.isArray(areas) && areas[idx]) {
      const a = areas[idx];
      // Store in multiple fields to satisfy different pipelines
      a.stoneUrl = item.url;
      a.materialUrl = item.url;
      a.textureUrl = item.url;
      a.fillImageUrl = item.url;
      a.stone = (item && item.url) ? item.url : item;  // Use URL string for drawing functions
      a.textureMode = 'stone_linear';  // ADD THIS LINE HERE!
      
// Ensure the brick image is cached, then force a redraw once ready
ensureImageInCache(item.url, function(ready){
  if (!ready) return;
  // If your app has a preferred draw path, use it first
  if (typeof renderAll === 'function') { try { renderAll(); return; } catch(_){} }
  if (typeof redrawCanvas === 'function') { try { redrawCanvas(); return; } catch(_){} }
  if (typeof drawAll === 'function') { try { drawAll(); return; } catch(_){} }
  if (typeof updateCanvas === 'function') { try { updateCanvas(); return; } catch(_){} }
  if (typeof window.drawCanvas === 'function') { try { window.drawCanvas(); return; } catch(_){} }
});

      console.log('🔍 APPLYING MATERIAL DEBUG:');
      console.log('  - Item:', item);
      console.log('  - Item profile:', item.profile);
      console.log('  - Item URL:', item.url);
      console.log('  - Area stone set to:', a.stone);
      console.log('  - Image exists in stoneImages (item):', !!stoneImages[item]);
      console.log('  - Image exists in stoneImages (item.url):', !!stoneImages[item.url]);
      a.material = item;
      a.selected = true;
      a.isSelected = true;
    }

    // Try common render hooks used in the app; call the ones that exist
    const fns = [
      'applyMaterialToSelectedArea', 'applySelectedMaterial', 'applyBrickToArea',
      'setCurrentMaterial', 'selectMaterial', 'selectStone', 'renderAll',
      'redrawCanvas', 'updateCanvas', 'drawAll', 'refreshCanvas'
    ];
    for (const fn of fns) {
      try { if (typeof window[fn] === 'function') window[fn](item); } catch(_) {}
    }

    // Fire generic events many UIs listen for
    try { document.dispatchEvent(new CustomEvent('material-selected', { detail: item })); } catch(_) {}
    try { window.dispatchEvent(new CustomEvent('material-selected', { detail: item })); } catch(_) {}
    try { window.dispatchEvent(new CustomEvent('stone-selected', { detail: item })); } catch(_) {}
    try { window.dispatchEvent(new CustomEvent('full-brick-selected', { detail: item })); } catch(_) {}

    // Last resort: request a frame and attempt a global render if provided
    try {
      if (typeof window.render === 'function') {
        window.requestAnimationFrame(()=>window.render());
      }
    } catch(_) {}
// CRITICAL: Force canvas redraw after applying material
    try {
      if (typeof window.drawCanvas === 'function') {
        window.drawCanvas();


console.log('✅ Full Brick applied and canvas redrawn');
        console.log('✅ Full Brick applied and canvas redrawn');
      }
    } catch(_) {}
    return true;
  }

  function parseCardItem(card){
    const img = card.querySelector('img');
    const nameEl = card.querySelector('div');
    const sel = $('#full-brick-manufacturer-select');
    return {
      name: nameEl ? nameEl.textContent.trim() : 'Full Brick',
      profile: 'full-brick',
      url: img ? decodeURI(img.getAttribute('data-src') || img.getAttribute('src') || '') : '',
      manufacturer: sel ? sel.value : 'hebron-brick'
    };
  }

  function onGridClick(e){
    const gridRoot = $('#full-brick-views') || $('#full-brick-grid') || document;
    if (!gridRoot.contains(e.target)) return;

    const card = e.target.closest('.material-card');
    if (!card) return;
    e.preventDefault();
    e.stopPropagation();

    const item = parseCardItem(card);
    
    // Load full-resolution image for canvas if not already loaded
    if (!stoneImages[item.url]) {
        const fullImg = new Image();
        fullImg.crossOrigin = "anonymous";
        fullImg.onload = function() {
            stoneImages[item.url] = fullImg;
            console.log('✅ Loaded full-res Full Brick image:', item.name);
        };
        fullImg.src = item.url;
    }
    
    const ok = applyFullBrickToSelectedArea(item);
    // AUTO-HIDE MATERIAL PANEL WHEN FULL BRICK IS SELECTED FOR CLEAR CANVAS VIEW
    if (ok) revealCanvas();
  }

  // Attach listeners once DOM is ready
  (function onReady(fn){
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  })(function(){
    document.addEventListener('click', onGridClick, true); // capture phase
  });
// ==== Wood Surfaces click handler ====
(function(){
  const $ = (s, r)=> (r||document).querySelector(s);

  function getSelectedAreaIndex(){
    // Use global variables directly (NOT window.areas)
    if (typeof selectedAreaIndex === 'number' && selectedAreaIndex >= 0) return selectedAreaIndex;
    if (Array.isArray(areas) && areas.length) {
      const flagged = areas.findIndex(a => a && (a.isSelected || a.selected));
      if (flagged >= 0) return flagged;
      return areas.length - 1;
    }
    return -1;
  }

  function applyWoodSurfacesToSelectedArea(item){
    if (!item) return false;
    
    try { 
      currentStone = item.url; // Use URL string, not object
    } catch(_) {}

    const idx = getSelectedAreaIndex();
    
    // If no area selected but areas exist, pick the last one
    if (idx === -1 && Array.isArray(areas) && areas.length) {
      selectedAreaIndex = areas.length - 1;
    }
    
    if (idx >= 0 && Array.isArray(areas) && areas[idx]) {
      const a = areas[idx];
      
      // Store material properties
      a.stoneUrl = item.url;
      a.materialUrl = item.url;
      a.textureUrl = item.url;
      a.stone = item.url;  // Use URL string for drawing
      a.textureMode = 'stone_linear';  // CRITICAL: Use stone_linear, not brick
      a.material = item;
      a.selected = true;
      a.isSelected = true;
      
      // Ensure image is cached
      if (!stoneImages[item.url]) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
          stoneImages[item.url] = img;
          drawCanvas();
        };
        img.src = item.url;
      }
      
      drawCanvas();
      console.log('✅ Wood Surfaces applied and canvas redrawn');
    }
    
    return true;
  }

  function revealCanvas(){
    // Collapse material panel
    const materialPanel = document.querySelector('.material-selection-panel');
    if (materialPanel) {
        materialPanel.classList.remove('active');
    }
    document.querySelectorAll('.material-tab').forEach(tab => tab.classList.remove('active'));
    
    try {
      const canvas = $('#main-canvas') || $('canvas#mainCanvas') || $('canvas');
      if (canvas && canvas.scrollIntoView) {
        canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch(_) {}
  }

  function handleWoodSurfacesClick(e){
    const gridRoot = $('#wood-surfaces-category') || document.querySelector('[data-category="wood-surfaces"]');
    if (!gridRoot) return;
    if (!gridRoot.contains(e.target)) return;

    const card = e.target.closest('.material-card, .material-item');
    if (!card) return;

    const img = card.querySelector('img');
    const nameEl = card.querySelector('span, div');
    
    const item = {
      name: nameEl ? nameEl.textContent.trim() : 'Wood Surface',
      type: 'wood-surfaces',
      url: img ? img.getAttribute('src') : ''
    };

    const ok = applyWoodSurfacesToSelectedArea(item);
    if (ok) revealCanvas();
  }

  // Attach the click handler
  document.addEventListener('DOMContentLoaded', function(){
    document.addEventListener('click', handleWoodSurfacesClick, true);
  });
})();



})();