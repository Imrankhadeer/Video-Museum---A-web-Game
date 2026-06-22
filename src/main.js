/**
 * VIDEO MUSEUM — Main Entry Point
 * 
 * A browser-based 3D museum where wall-mounted screens play custom videos.
 * Walk through the Lobby → Gallery → Corridor → Main Theater.
 * 
 * CUSTOMIZE YOUR VIDEOS: Edit the VIDEO_CONFIG array below.
 */

import * as THREE from 'three';

// Museum world
import { createMuseum } from './museum/rooms.js';

// Video system
import { VideoManager } from './video/videoManager.js';
import { createGalleryScreen, createTheaterScreen } from './video/screenMesh.js';

// Player
import { PlayerController } from './player/playerController.js';
import { InteractionSystem } from './player/interactionSystem.js';
import { MultiplayerManager } from './player/multiplayerManager.js';
import { RemoteControl } from './player/RemoteControl.js';

// Lighting & post-processing
import { setupLighting } from './lighting/lightingSetup.js';
import { setupPostProcessing } from './lighting/postProcessing.js';

// Custom extensions (Props/Lights)
import { MuseumExtensions } from './museum/customExtensions.js';

// UI
import { HUD } from './ui/hud.js';
import { LoadingScreen } from './ui/loadingScreen.js';
import { MenuScreen } from './ui/menuScreen.js';


// ============================================
// 🎬 VIDEO CONFIGURATION
// Edit this array to set your own videos!
// Indices 0-7 = gallery wall screens
// Index 8 = main theater screen
// ============================================
const VIDEO_CONFIG = [
  // Gallery screens (8 wall-mounted screens)
  { url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', title: 'Blazes' },
  { url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', title: 'Escapes' },
  { url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', title: 'Fun' },
  { url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', title: 'Joyrides' },
  { url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', title: 'Meltdowns' },
  { url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', title: 'Subaru' },
  { url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4', title: 'GTI Review' },
  { url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4', title: 'Bullrun' },
  // Theater main screen (the big one!)
  { url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', title: 'Big Buck Bunny' },
];

try {
  const savedConfigStr = localStorage.getItem('museum_video_config');
  if (savedConfigStr) {
    const parsedConfig = JSON.parse(savedConfigStr);
    if (Array.isArray(parsedConfig) && parsedConfig.length === VIDEO_CONFIG.length) {
      for (let i = 0; i < VIDEO_CONFIG.length; i++) {
        if (parsedConfig[i] && parsedConfig[i].url && !parsedConfig[i].url.startsWith('blob:')) {
          VIDEO_CONFIG[i].url = parsedConfig[i].url;
          if (parsedConfig[i].title) VIDEO_CONFIG[i].title = parsedConfig[i].title;
        }
      }
    }
  }
} catch (e) {
  console.warn('Failed to load saved video configuration:', e);
}


// ============================================
// LOADING SCREEN
// ============================================
const loadingScreen = new LoadingScreen();
loadingScreen.setProgress(5);


// ============================================
// RENDERER
// ============================================
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('canvas-container').appendChild(renderer.domElement);

loadingScreen.setProgress(10);


// ============================================
// SCENE & CAMERA
// ============================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07070d);

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  120
);

loadingScreen.setProgress(15);


// ============================================
// BUILD MUSEUM WORLD
// ============================================
const museum = createMuseum();
scene.add(museum.group);

// Initialize custom props & lights
MuseumExtensions.init(scene, museum.group);

loadingScreen.setProgress(35);


// ============================================
// VIDEO SYSTEM
// ============================================
const videoManager = new VideoManager(VIDEO_CONFIG);
videoManager.init();

loadingScreen.setProgress(45);

// Place video screens at each slot position
const screenPositions = []; // parallel array for proximity audio

museum.screenSlots.forEach((slot) => {
  const texture = videoManager.getTexture(slot.index);
  if (!texture) return;

  let screenMesh;
  if (slot.type === 'theater') {
    screenMesh = createTheaterScreen(texture, slot.size.w, slot.size.h);
  } else {
    screenMesh = createGalleryScreen(texture, slot.size.w, slot.size.h);
  }

  screenMesh.position.copy(slot.position);
  screenMesh.rotation.copy(slot.rotation);
  
  // Tag for raycasting interactions
  screenMesh.userData = { 
    isScreen: true, 
    videoIndex: slot.index 
  };
  
  scene.add(screenMesh);

  // Store screen world position for proximity audio
  screenPositions[slot.index] = slot.position.clone();
});

loadingScreen.setProgress(55);


// ============================================
// PLAYER CONTROLLER
// ============================================
const playerController = new PlayerController(camera, renderer.domElement);
playerController.setCollisionWorld(museum.group);
playerController.teleportTo(museum.playerSpawn.position, museum.playerSpawn.lookAt);

// Add camera to scene so attached objects render properly
scene.add(camera);

// ============================================
// REMOTE CONTROL & RAYCASTING
// ============================================
const remoteControl = new RemoteControl();
// Position relative to camera (bottom-right of view)
remoteControl.group.position.set(0.12, -0.15, -0.3);
// Rotate slightly so it looks like it's pointing inward
remoteControl.group.rotation.y = Math.PI / 16;
camera.add(remoteControl.group);

let isRemoteVisible = false;
remoteControl.group.visible = isRemoteVisible;

document.addEventListener('keydown', (e) => {
  if (!playerController.isLocked || isPaused) return;
  if (e.code === 'Digit1') {
    isRemoteVisible = !isRemoteVisible;
    remoteControl.group.visible = isRemoteVisible;
  }
});

const raycaster = new THREE.Raycaster();

function getTargetedScreen() {
  if (!isRemoteVisible) return -1;
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  for (const hit of intersects) {
    if (hit.object.userData && hit.object.userData.isScreen) {
      return hit.object.userData.videoIndex;
    }
  }
  return -1;
}

document.addEventListener('mousedown', (e) => {
  if (!playerController.isLocked || isPaused || !isRemoteVisible) return;
  const screenIndex = getTargetedScreen();
  if (screenIndex !== -1) {
    if (e.button === 0) {
      // Left click: Play/Pause
      remoteControl.animateButtonPress('play');
      videoManager.togglePlayPause(screenIndex);
      multiplayerManager.broadcastVideoCommand(screenIndex, 'togglePlayPause');
    } else if (e.button === 1 || e.button === 2) {
      // Middle or Right click: Mute/Unmute
      remoteControl.animateButtonPress('mute');
      videoManager.toggleMute(screenIndex);
      multiplayerManager.broadcastVideoCommand(screenIndex, 'toggleMute');
    }
  }
});

document.addEventListener('wheel', (e) => {
  if (!playerController.isLocked || isPaused || !isRemoteVisible) return;
  const screenIndex = getTargetedScreen();
  if (screenIndex !== -1) {
    if (e.deltaY < 0) {
      // Scroll up: FF
      remoteControl.animateButtonPress('ff');
      videoManager.seekVideo(screenIndex, 5);
      multiplayerManager.broadcastVideoCommand(screenIndex, 'seek', 5);
    } else {
      // Scroll down: RW
      remoteControl.animateButtonPress('rw');
      videoManager.seekVideo(screenIndex, -5);
      multiplayerManager.broadcastVideoCommand(screenIndex, 'seek', -5);
    }
  }
});

loadingScreen.setProgress(65);


// ============================================
// INTERACTION SYSTEM
// ============================================
const interactionSystem = new InteractionSystem(camera, playerController);
let isSeated = false;

// Sofa sit interaction
interactionSystem.addZone(
  'sofa-sit',
  museum.sofaPosition,
  3.0,
  'Press  E  to sit down',
  () => {
    if (isSeated) return;
    isSeated = true;
    playerController.sitDown(museum.sofaPosition, museum.sofaLookAt);
    interactionSystem.setZoneActive('sofa-sit', false);

    // Add stand-up zone (larger radius since player is seated)
    interactionSystem.addZone(
      'sofa-stand',
      museum.sofaPosition,
      6.0,
      'Press  E  to stand up',
      () => {
        isSeated = false;
        playerController.standUp();
        interactionSystem.removeZone('sofa-stand');
        interactionSystem.setZoneActive('sofa-sit', true);
      }
    );
  }
);

loadingScreen.setProgress(70);


// ============================================
// LIGHTING
// ============================================
const lighting = setupLighting(scene);

loadingScreen.setProgress(80);


// ============================================
// POST-PROCESSING (Bloom)
// ============================================
const postProcessing = setupPostProcessing(renderer, scene, camera);

loadingScreen.setProgress(85);


// ============================================
// HUD & MENUS
// ============================================
const hud = new HUD();
const menuScreen = new MenuScreen();

// ============================================
// MULTIPLAYER SYSTEM
// ============================================
const multiplayerManager = new MultiplayerManager(scene, playerController, videoManager, menuScreen);

// Toggle controls help with H key
document.addEventListener('keydown', (e) => {
  if (e.code === 'KeyH' && playerController.isLocked) {
    hud.toggleHelp();
  }
});

loadingScreen.setProgress(90);


// ============================================
// GAME STATE
// ============================================
let gameStarted = false;
let isPaused = false;

// --- Pointer Lock Events ---
playerController.controls.addEventListener('lock', () => {
  if (!gameStarted) return;
  menuScreen.hidePause();
  hud.show();
  isPaused = false;
  document.body.classList.add('pointer-locked');
});

playerController.controls.addEventListener('unlock', () => {
  if (!gameStarted) return;
  hud.hide();
  isPaused = true;
  document.body.classList.remove('pointer-locked');
  menuScreen.showPause();
});

// --- Resume from pause ---
menuScreen.onResume(() => {
  playerController.lock();
});

// --- Mute/unmute all ---
menuScreen.onMuteAll((muted) => {
  if (muted) {
    videoManager.muteAll();
  } else {
    videoManager.unmuteAll();
  }
});

// --- Handle in-game video changes ---
menuScreen.onVideoChange((index, url, file) => {
  if (file) {
    const objectURL = URL.createObjectURL(file);
    videoManager.changeVideoSource(index, objectURL, file.name);
    // Broadcast name of file (cannot send raw binary, but registers name)
    multiplayerManager.broadcastVideoChange(index, '', file.name);
  } else if (url) {
    let title = 'Custom Video';
    try {
      const parts = url.split('/');
      const lastPart = parts[parts.length - 1];
      if (lastPart) title = lastPart;
    } catch {}
    videoManager.changeVideoSource(index, url, title);
    // Sync to other players
    multiplayerManager.broadcastVideoChange(index, url, title);
    
    // Save to localStorage
    if (VIDEO_CONFIG[index]) {
      VIDEO_CONFIG[index].url = url;
      VIDEO_CONFIG[index].title = title;
      localStorage.setItem('museum_video_config', JSON.stringify(VIDEO_CONFIG));
    }
  }
});



// ============================================
// GAME START FLOW
// ============================================
async function initGame() {
  loadingScreen.setProgress(95);

  // Fade out loading screen
  await loadingScreen.hide();

  // Helper to start the game loop experience
  const startExperience = () => {
    menuScreen.hideStart();
    gameStarted = true;
    hud.show();

    // Start video playback
    videoManager.playAll();

    // Acquire pointer lock
    playerController.lock();
  };

  // Wire multiplayer buttons
  menuScreen.onHostRoom(() => {
    multiplayerManager.hostRoom();
    startExperience();
  });

  menuScreen.onJoinRoom((code) => {
    multiplayerManager.joinRoom(code);
    startExperience();
  });

  // Single player starts instantly
  menuScreen.showStart(() => {
    startExperience();
  });

  // Auto-fill and auto-trigger join if ?room=CODE is in query string
  const urlParams = new URLSearchParams(window.location.search);
  const roomParam = urlParams.get('room');
  if (roomParam) {
    console.log(`URL room invite detected: ${roomParam}`);
    menuScreen.mpRoomInput.value = roomParam;
    
    // Auto-join upon clicking the main start overlay
    menuScreen.showStart(() => {
      multiplayerManager.joinRoom(roomParam);
      startExperience();
    });
  }
}


// ============================================
// ANIMATION LOOP
// ============================================
const clock = new THREE.Clock();
let theaterLightTimer = 0;
const THEATER_VIDEO_INDEX = 8;

function animate() {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();

  if (gameStarted && !isPaused) {
    // --- Player Movement ---
    playerController.update(deltaTime);

    // --- Multiplayer Sync ---
    multiplayerManager.update(deltaTime);

    // --- Custom Extensions Update ---
    MuseumExtensions.update(deltaTime);

    // --- Interactions ---
    const prompt = interactionSystem.update();
    if (prompt) {
      hud.showPrompt(prompt);
    } else {
      hud.hidePrompt();
    }

    // --- Room Detection ---
    const playerPos = playerController.getPosition();
    for (const zone of museum.roomZones) {
      if (playerPos.z >= zone.minZ && playerPos.z <= zone.maxZ) {
        hud.showRoomName(zone.name);
        break;
      }
    }

    // --- Proximity Audio (gallery screens) ---
    videoManager.updateProximityAudio(playerPos, screenPositions);

    // --- Theater Audio Override ---
    // The theater screen is far from the sofa (~10m), so use wider audio range
    const theaterVideo = videoManager.getVideo(THEATER_VIDEO_INDEX);
    if (theaterVideo && playerPos.z < -46) {
      const distToScreen = playerPos.distanceTo(screenPositions[THEATER_VIDEO_INDEX]);
      const theaterMaxDist = 22;
      const theaterMinDist = 2;
      const vol = Math.max(0, Math.min(1,
        1 - (distToScreen - theaterMinDist) / (theaterMaxDist - theaterMinDist)
      ));
      theaterVideo.volume = vol;
    }

    // --- Theater Screen Light Color ---
    // Sample the video frame color every ~100ms for performance
    theaterLightTimer += deltaTime;
    if (theaterLightTimer > 0.1) {
      theaterLightTimer = 0;
      const avgColor = videoManager.getAverageColor(THEATER_VIDEO_INDEX);
      lighting.updateTheaterLight(avgColor);
    }
  }

  // --- Render (always, even when paused, so menus are visible over the scene) ---
  postProcessing.composer.render();
}


// ============================================
// WINDOW RESIZE
// ============================================
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  renderer.setSize(w, h);
  postProcessing.resize(w, h);
});


// ============================================
// 🚀 LAUNCH
// ============================================
initGame();
animate();
