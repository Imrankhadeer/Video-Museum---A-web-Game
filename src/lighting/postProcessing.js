import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export function setupPostProcessing(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);

  // Render pass
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Bloom pass - subtle glow, mainly affects emissive screens
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.4,  // strength (subtle)
    0.6,  // radius
    0.85  // threshold (only bright things bloom)
  );
  composer.addPass(bloomPass);

  // Output pass (needed for correct color space)
  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  return {
    composer,
    bloomPass,
    resize(width, height) {
      composer.setSize(width, height);
      bloomPass.resolution.set(width, height);
    },
  };
}
