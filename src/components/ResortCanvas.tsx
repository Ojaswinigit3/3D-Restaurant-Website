import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { SCENES } from '../data/scenesData';
import { createProceduralTextures } from '../three/proceduralTextures';
import { buildVillaAureliaWorld } from '../three/resortBuilder';

export type LightingPreset = 'sunrise' | 'mediterranean' | 'candlelight';

interface ResortCanvasProps {
  scrollProgress: number;
  lightingPreset: LightingPreset;
  onInspectLandmark?: (info: { title: string; subtitle: string } | null) => void;
}

// Pre-allocated math vectors at module scope (Zero GC in the render loop)
const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();
const _currentPos = new THREE.Vector3(0, 8.2, 82);
const _currentLook = new THREE.Vector3(0, 6.2, 18);
const _colorFogA = new THREE.Color();
const _colorFogB = new THREE.Color();
const _colorSkyA = new THREE.Color();
const _colorSkyB = new THREE.Color();
const _pointerNdc = new THREE.Vector2();

export const ResortCanvas: React.FC<ResortCanvasProps> = ({
  scrollProgress,
  lightingPreset,
  onInspectLandmark,
}) => {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(scrollProgress);
  const presetRef = useRef<LightingPreset>(lightingPreset);
  const inspectCallbackRef = useRef(onInspectLandmark);

  useEffect(() => {
    progressRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    presetRef.current = lightingPreset;
  }, [lightingPreset]);

  useEffect(() => {
    inspectCallbackRef.current = onInspectLandmark;
  }, [onInspectLandmark]);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    // 1. Software WebGL Guard
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENES[0].fogColor);
    const fog = new THREE.FogExp2(SCENES[0].fogColor, SCENES[0].fogDensity);
    scene.fog = fog;

    const camera = new THREE.PerspectiveCamera(SCENES[0].fov, width / height, 0.25, 320);
    camera.position.copy(_currentPos);
    camera.lookAt(_currentLook);

    // 2. Mandatory Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmremGenerator.dispose();

    // 3. Balanced Studio & Atmospheric Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xffe7ba, 0x102820, 0.9);
    hemiLight.position.set(0, 60, 0);
    scene.add(hemiLight);

    const keySunLight = new THREE.DirectionalLight(0xffd796, 2.6);
    keySunLight.position.set(28, 38, -60);
    keySunLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      keySunLight.shadow.mapSize.width = 1024;
      keySunLight.shadow.mapSize.height = 1024;
      const d = 48;
      keySunLight.shadow.camera.left = -d;
      keySunLight.shadow.camera.right = d;
      keySunLight.shadow.camera.top = d;
      keySunLight.shadow.camera.bottom = -d;
      keySunLight.shadow.camera.near = 2;
      keySunLight.shadow.camera.far = 180;
      keySunLight.shadow.bias = -0.0005;
      keySunLight.shadow.normalBias = 0.02;
    }
    scene.add(keySunLight);

    const rimLight = new THREE.DirectionalLight(0x78b09b, 0.85);
    rimLight.position.set(-32, 18, 45);
    scene.add(rimLight);

    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const porticoSoftbox = new THREE.RectAreaLight(0xffe3b0, 3.2, 10, 6);
      porticoSoftbox.position.set(0, 8.5, 16);
      porticoSoftbox.lookAt(0, 3.0, 4);
      scene.add(porticoSoftbox);

      const suiteSoftbox = new THREE.RectAreaLight(0xffdfb3, 2.8, 9, 5);
      suiteSoftbox.position.set(0, 7.8, -98);
      suiteSoftbox.lookAt(0, 3.0, -86);
      scene.add(suiteSoftbox);
    }

    // 4. Build Procedural Textures & 3D Resort World
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const textures = createProceduralTextures(maxAniso);
    const worldRefs = buildVillaAureliaWorld(scene, textures, isSoftwareGl);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 5. Pointer Parallax & Throttled Raycasting on Landmarks
    let pointerX = 0;
    let pointerY = 0;
    let lastRaycastTime = 0;
    const raycaster = new THREE.Raycaster();

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      pointerX = nx;
      pointerY = ny;

      const now = performance.now();
      if (now - lastRaycastTime > 90 && worldRefs.interactiveLandmarks.length > 0) {
        lastRaycastTime = now;
        _pointerNdc.set(nx, ny);
        raycaster.setFromCamera(_pointerNdc, camera);
        const hits = raycaster.intersectObjects(worldRefs.interactiveLandmarks, true);
        if (hits.length > 0) {
          let obj: THREE.Object3D | null = hits[0].object;
          while (obj && !obj.userData?.landmarkTitle) {
            obj = obj.parent;
          }
          if (obj && obj.userData?.landmarkTitle) {
            renderer.domElement.style.cursor = 'pointer';
            inspectCallbackRef.current?.({
              title: obj.userData.landmarkTitle,
              subtitle: obj.userData.landmarkSubtitle,
            });
            return;
          }
        }
        renderer.domElement.style.cursor = 'default';
        inspectCallbackRef.current?.(null);
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // WebGL context loss safety
    const onContextLost = (e: Event) => {
      e.preventDefault();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost, false);

    // 6. Render Loop with Software-WebGL fenceSync Pacing & Exponential Damping
    let frameId = 0;
    let isDisposed = false;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      if (isDisposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (isDisposed) return;
      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      // Interpolate between the 6 scenes based on scrollProgress (0..1)
      const totalSegments = SCENES.length - 1;
      const scaled = THREE.MathUtils.clamp(progressRef.current, 0, 1) * totalSegments;
      const idxA = Math.min(Math.floor(scaled), totalSegments - 1);
      const idxB = idxA + 1;
      const t = THREE.MathUtils.smoothstep(scaled - idxA, 0, 1);

      const sceneA = SCENES[idxA];
      const sceneB = SCENES[idxB];

      // Target camera position & lookAt with subtle mouse parallax
      _targetPos.set(
        THREE.MathUtils.lerp(sceneA.cameraPos[0], sceneB.cameraPos[0], t) + pointerX * 0.65,
        THREE.MathUtils.lerp(sceneA.cameraPos[1], sceneB.cameraPos[1], t) + pointerY * 0.35,
        THREE.MathUtils.lerp(sceneA.cameraPos[2], sceneB.cameraPos[2], t)
      );

      _targetLook.set(
        THREE.MathUtils.lerp(sceneA.cameraLookAt[0], sceneB.cameraLookAt[0], t) + pointerX * 1.1,
        THREE.MathUtils.lerp(sceneA.cameraLookAt[1], sceneB.cameraLookAt[1], t) + pointerY * 0.65,
        THREE.MathUtils.lerp(sceneA.cameraLookAt[2], sceneB.cameraLookAt[2], t)
      );

      // Exponential damping for silky-smooth cinematic camera weight
      const dampLambda = 5.5;
      _currentPos.x = THREE.MathUtils.damp(_currentPos.x, _targetPos.x, dampLambda, dt);
      _currentPos.y = THREE.MathUtils.damp(_currentPos.y, _targetPos.y, dampLambda, dt);
      _currentPos.z = THREE.MathUtils.damp(_currentPos.z, _targetPos.z, dampLambda, dt);

      _currentLook.x = THREE.MathUtils.damp(_currentLook.x, _targetLook.x, dampLambda, dt);
      _currentLook.y = THREE.MathUtils.damp(_currentLook.y, _targetLook.y, dampLambda, dt);
      _currentLook.z = THREE.MathUtils.damp(_currentLook.z, _targetLook.z, dampLambda, dt);

      camera.position.copy(_currentPos);
      camera.lookAt(_currentLook);

      const targetFov = THREE.MathUtils.lerp(sceneA.fov, sceneB.fov, t);
      if (Math.abs(camera.fov - targetFov) > 0.05) {
        camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 4.0, dt);
        camera.updateProjectionMatrix();
      }

      // Atmosphere & Time-of-Day Preset Adjustments
      _colorFogA.set(sceneA.fogColor);
      _colorFogB.set(sceneB.fogColor);
      _colorFogA.lerp(_colorFogB, t);

      const activePreset = presetRef.current;
      let sunMultiplier = 1.0;
      if (activePreset === 'mediterranean') {
        _colorSkyA.set('#18382E');
        _colorFogA.lerp(_colorSkyA, 0.35);
        keySunLight.color.setHex(0xfff4dc);
        sunMultiplier = 1.22;
      } else if (activePreset === 'candlelight') {
        _colorSkyA.set('#09130F');
        _colorFogA.lerp(_colorSkyA, 0.55);
        keySunLight.color.setHex(0xd98a3c);
        sunMultiplier = 0.55;
      } else {
        keySunLight.color.setHex(0xffd28a);
        sunMultiplier = 1.0;
      }

      fog.color.copy(_colorFogA);
      (scene.background as THREE.Color).copy(_colorFogA);
      fog.density = THREE.MathUtils.lerp(sceneA.fogDensity, sceneB.fogDensity, t);

      const baseSunInt = THREE.MathUtils.lerp(sceneA.sunIntensity, sceneB.sunIntensity, t);
      keySunLight.intensity = baseSunInt * sunMultiplier;
      hemiLight.intensity = THREE.MathUtils.lerp(sceneA.ambientIntensity, sceneB.ambientIntensity, t);

      // Update Animated Elements (waves, sailboat bobbing, fountain ripples, candle flicker)
      for (let i = 0; i < worldRefs.waterUniforms.length; i++) {
        worldRefs.waterUniforms[i].uTime.value = elapsed;
      }

      worldRefs.sailboatGroup.position.y = 0.15 + Math.sin(elapsed * 1.4) * 0.08;
      worldRefs.sailboatGroup.rotation.z = Math.sin(elapsed * 1.1) * 0.03;

      for (let i = 0; i < worldRefs.fountainRings.length; i++) {
        const ring = worldRefs.fountainRings[i];
        const phase = (elapsed * 0.65 + i * 0.5) % 1;
        ring.scale.setScalar(0.6 + phase * 1.5);
        (ring.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * 0.5;
      }

      for (let i = 0; i < worldRefs.candleFlames.length; i++) {
        const flame = worldRefs.candleFlames[i];
        const flicker = 0.88 + Math.sin(elapsed * 11 + i * 2.1) * 0.14;
        flame.scale.set(1, flicker, 1);
      }

      for (let i = 0; i < worldRefs.candleLights.length; i++) {
        const cLight = worldRefs.candleLights[i];
        const candleBoost = activePreset === 'candlelight' ? 1.45 : 1.0;
        cLight.intensity = (4.2 + Math.sin(elapsed * 8.5 + i * 1.7) * 0.45) * candleBoost;
      }

      worldRefs.sunHalo.scale.setScalar(1 + Math.sin(elapsed * 0.8) * 0.04);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      envTarget.dispose();
      textures.dispose();
      worldRefs.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={canvasMountRef}
      className="fixed inset-0 w-full h-full z-0 pointer-events-auto"
      aria-label="Villa Aurelia 3D Interactive Architectural Viewport"
    />
  );
};
