import * as THREE from 'three';
import { ProceduralTextureSet } from './proceduralTextures';

export interface AnimatedResortRefs {
  waterUniforms: { uTime: { value: number } }[];
  fountainRings: THREE.Mesh[];
  candleLights: THREE.PointLight[];
  candleFlames: THREE.Mesh[];
  sailboatGroup: THREE.Group;
  sunDisc: THREE.Mesh;
  sunHalo: THREE.Mesh;
  interactiveLandmarks: THREE.Object3D[];
  dispose: () => void;
}

export function buildVillaAureliaWorld(
  scene: THREE.Scene,
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean
): AnimatedResortRefs {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const waterUniforms: { uTime: { value: number } }[] = [];
  const fountainRings: THREE.Mesh[] = [];
  const candleLights: THREE.PointLight[] = [];
  const candleFlames: THREE.Mesh[] = [];
  const interactiveLandmarks: THREE.Object3D[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  // --- Shared Physical Materials ---
  const travertineMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.travertine,
      color: 0xf6efe2,
      roughness: 0.68,
      metalness: 0.05,
    })
  );

  const creamStuccoMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf3ead8,
      roughness: 0.75,
      metalness: 0.02,
    })
  );

  const brushedGoldMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xd4af5a,
      metalness: 0.92,
      roughness: 0.22,
      anisotropy: 0.75,
      clearcoat: 0.4,
    })
  );

  const darkBronzeMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x231d16,
      metalness: 0.85,
      roughness: 0.35,
    })
  );

  const emeraldMarbleMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x0e2a20,
      roughness: 0.18,
      metalness: 0.1,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
    })
  );

  const terracottaMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xb85d3b,
      roughness: 0.65,
      metalness: 0.05,
    })
  );

  const walnutWoodMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x3b2416,
      roughness: 0.42,
      metalness: 0.08,
    })
  );

  const creamSilkMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xf8f4ec,
      roughness: 0.55,
      metalness: 0.0,
      sheen: 0.85,
      sheenColor: new THREE.Color(0xffe8b8),
      sheenRoughness: 0.4,
      side: THREE.DoubleSide,
    })
  );

  const crystalGlassMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.08,
      metalness: 0.05,
      transmission: isSoftwareGl ? 0 : 0.9,
      transparent: true,
      opacity: isSoftwareGl ? 0.42 : 1.0,
      ior: 1.52,
      thickness: 0.6,
      clearcoat: 1.0,
      depthWrite: false,
    })
  );

  const contactShadowMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      depthWrite: false,
      opacity: 0.48,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );

  const addContactShadow = (parent: THREE.Object3D, x: number, y: number, z: number, sx: number, sz: number) => {
    const plane = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(sx, sz)), contactShadowMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(x, y + 0.025, z);
    parent.add(plane);
  };

  // --- Helper: Animated Wave Material via onBeforeCompile ---
  const createAnimatedWaterMaterial = (colorHex: number, roughness: number, waveAmp: number, waveFreq: number) => {
    const mat = trackMat(
      new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness,
        metalness: 0.35,
        transparent: true,
        opacity: 0.92,
      })
    );
    const uniformRef = { uTime: { value: 0 } };
    waterUniforms.push(uniformRef);

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniformRef.uTime;
      shader.vertexShader =
        `uniform float uTime;\n` +
        shader.vertexShader.replace(
          '#include <begin_vertex>',
          `
          #include <begin_vertex>
          float w1 = sin(transformed.x * ${waveFreq.toFixed(2)} + uTime * 1.6) * ${waveAmp.toFixed(3)};
          float w2 = cos(transformed.y * ${(waveFreq * 1.3).toFixed(2)} - uTime * 1.2) * ${(waveAmp * 0.7).toFixed(3)};
          transformed.z += w1 + w2;
          `
        );
    };
    return mat;
  };

  // ============================================================================
  // 1. OCEAN, COASTAL CLIFFS, SUNRISE HORIZON & SAILBOAT (SCENE 01 & 06)
  // ============================================================================
  const seaMat = createAnimatedWaterMaterial(0x0f3b31, 0.16, 0.14, 0.25);
  const seaGeo = trackGeo(new THREE.PlaneGeometry(420, 460, 96, 96));
  const seaMesh = new THREE.Mesh(seaGeo, seaMat);
  seaMesh.rotation.x = -Math.PI / 2;
  seaMesh.position.set(0, 0, -20);
  seaMesh.receiveShadow = true;
  scene.add(seaMesh);

  // Sunrise / Sunset Golden Sun Disc & Atmospheric Corona Halos
  const sunGroup = new THREE.Group();
  const sunDiscMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0xffdf91,
      fog: false,
    })
  );
  const sunDisc = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(14, 32, 32)), sunDiscMat);
  sunDisc.position.set(0, 22, -230);
  sunGroup.add(sunDisc);

  const sunHaloMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0xe69c45,
      transparent: true,
      opacity: 0.28,
      fog: false,
      depthWrite: false,
    })
  );
  const sunHalo = new THREE.Mesh(trackGeo(new THREE.RingGeometry(14.5, 36, 48)), sunHaloMat);
  sunHalo.position.set(0, 22, -229);
  sunGroup.add(sunHalo);
  scene.add(sunGroup);

  // Classic Mediterranean Sailboat (6-part composite THREE.Group)
  const sailboatGroup = new THREE.Group();
  sailboatGroup.position.set(-14, 0.15, 54);
  sailboatGroup.rotation.y = 0.42;

  const hullGeo = trackGeo(new THREE.ConeGeometry(1.4, 6.5, 6));
  hullGeo.rotateZ(Math.PI / 2);
  hullGeo.scale(1, 0.45, 0.55);
  const hullMesh = new THREE.Mesh(hullGeo, walnutWoodMat);
  hullMesh.position.y = 0.35;
  sailboatGroup.add(hullMesh);

  const deckCabin = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.2, 0.45, 1.1)), creamStuccoMat);
  deckCabin.position.set(0, 0.65, 0);
  sailboatGroup.add(deckCabin);

  const mast = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.06, 0.09, 6.8, 12)), brushedGoldMat);
  mast.position.set(0.3, 3.8, 0);
  sailboatGroup.add(mast);

  // Main sail & jib sail using extruded/curved planes
  const mainSailShape = new THREE.Shape();
  mainSailShape.moveTo(0, 0);
  mainSailShape.lineTo(-2.6, 0.2);
  mainSailShape.lineTo(0, 5.6);
  mainSailShape.closePath();
  const mainSail = new THREE.Mesh(trackGeo(new THREE.ShapeGeometry(mainSailShape)), creamSilkMat);
  mainSail.position.set(0.2, 1.1, 0);
  sailboatGroup.add(mainSail);

  const jibShape = new THREE.Shape();
  jibShape.moveTo(0, 0);
  jibShape.lineTo(2.1, -0.1);
  jibShape.lineTo(0, 4.8);
  jibShape.closePath();
  const jibSail = new THREE.Mesh(trackGeo(new THREE.ShapeGeometry(jibShape)), creamSilkMat);
  jibSail.position.set(0.45, 1.2, 0);
  sailboatGroup.add(jibSail);

  const bowsprit = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.03, 0.05, 2.2, 8)), brushedGoldMat);
  bowsprit.rotation.z = -Math.PI / 2.4;
  bowsprit.position.set(3.2, 0.75, 0);
  sailboatGroup.add(bowsprit);

  sailboatGroup.userData = {
    landmarkTitle: 'Riva Sloop "L’Aurelia"',
    landmarkSubtitle: 'Private Estate Yacht · Moored in the Morning Bay',
  };
  interactiveLandmarks.push(sailboatGroup);
  scene.add(sailboatGroup);

  // ============================================================================
  // 2. GRAND CLIFFSIDE PROMONTORY, DOUBLE STAIRCASE & PALLADIAN FACADE (SCENE 01-02)
  // ============================================================================
  const estateGroup = new THREE.Group();
  scene.add(estateGroup);

  // Main limestone foundation platform spanning the entire resort (z = +24 to -114)
  const mainPlinth = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(56, 2.0, 140)), travertineMat);
  mainPlinth.position.set(0, 1.0, -45);
  mainPlinth.receiveShadow = true;
  estateGroup.add(mainPlinth);

  // Harbor arrival quay & grand double-flight staircase (z = +36 to +20)
  const harborQuay = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(24, 0.6, 12)), travertineMat);
  harborQuay.position.set(0, 0.3, 30);
  harborQuay.receiveShadow = true;
  estateGroup.add(harborQuay);

  const numSteps = 10;
  for (let i = 0; i < numSteps; i++) {
    const stepW = 14 - i * 0.25;
    const stepH = 0.22;
    const stepD = 1.1;
    const stepMesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(stepW, stepH, stepD)), travertineMat);
    stepMesh.position.set(0, 0.3 + i * 0.18, 26.5 - i * 0.75);
    stepMesh.receiveShadow = true;
    stepMesh.castShadow = true;
    estateGroup.add(stepMesh);
  }

  // Helper: Classical Fluted Column with LatheGeometry Base & Corinthian Capital (5 parts)
  const createClassicalColumn = (height: number, radius: number): THREE.Group => {
    const colGroup = new THREE.Group();

    // Plinth block
    const plinth = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(radius * 2.8, 0.35, radius * 2.8)),
      travertineMat
    );
    plinth.position.y = 0.175;
    colGroup.add(plinth);

    // Lathe torus base
    const basePoints = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(radius * 1.35, 0),
      new THREE.Vector2(radius * 1.25, 0.18),
      new THREE.Vector2(radius * 1.05, 0.35),
      new THREE.Vector2(0, 0.35),
    ];
    const baseLathe = new THREE.Mesh(trackGeo(new THREE.LatheGeometry(basePoints, 20)), travertineMat);
    baseLathe.position.y = 0.35;
    colGroup.add(baseLathe);

    // Fluted shaft (16 segments for classical fluting read)
    const shaftH = height - 1.25;
    const shaft = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(radius * 0.88, radius, shaftH, 16)),
      travertineMat
    );
    shaft.position.y = 0.7 + shaftH / 2;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    colGroup.add(shaft);

    // Gilded collar ring
    const collar = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(radius * 0.92, 0.05, 10, 24)),
      brushedGoldMat
    );
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.7 + shaftH;
    colGroup.add(collar);

    // Capital bell (Lathe) + Abacus slab
    const capPoints = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(radius * 0.9, 0),
      new THREE.Vector2(radius * 1.35, 0.42),
      new THREE.Vector2(0, 0.42),
    ];
    const capMesh = new THREE.Mesh(trackGeo(new THREE.LatheGeometry(capPoints, 20)), brushedGoldMat);
    capMesh.position.y = 0.7 + shaftH;
    colGroup.add(capMesh);

    const abacus = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(radius * 2.7, 0.18, radius * 2.7)),
      travertineMat
    );
    abacus.position.y = height - 0.09;
    colGroup.add(abacus);

    return colGroup;
  };

  // Helper: Extruded Triumphal Arch Wall so the camera can fly straight through the center!
  const createArchwayPortal = (
    width: number,
    height: number,
    depth: number,
    archRadius: number,
    archSpringY: number,
    mat: THREE.Material
  ): THREE.Group => {
    const portalGroup = new THREE.Group();
    const shape = new THREE.Shape();
    const hw = width / 2;
    shape.moveTo(-hw, 0);
    shape.lineTo(-hw, height);
    shape.lineTo(hw, height);
    shape.lineTo(hw, 0);
    shape.lineTo(archRadius, 0);
    shape.lineTo(archRadius, archSpringY);
    shape.absarc(0, archSpringY, archRadius, 0, Math.PI, false);
    shape.lineTo(-archRadius, 0);
    shape.closePath();

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.08,
    };
    const geo = trackGeo(new THREE.ExtrudeGeometry(shape, extrudeSettings));
    geo.center();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = height / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    portalGroup.add(mesh);

    // Gilded keystone at top of arch
    const keystone = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.65, 0.95, depth + 0.35)), brushedGoldMat);
    keystone.position.set(0, archSpringY + archRadius, 0);
    portalGroup.add(keystone);

    return portalGroup;
  };

  // Grand Front Facade at z = +18
  const frontFacadeGroup = new THREE.Group();
  frontFacadeGroup.position.set(0, 2.0, 18);
  estateGroup.add(frontFacadeGroup);

  // Central Triumphal Arch Portal (open 8.4m wide, 9.6m tall arch)
  const mainEntranceArch = createArchwayPortal(22, 12.5, 1.8, 4.2, 5.2, travertineMat);
  frontFacadeGroup.add(mainEntranceArch);

  // Classical triangular pediment above the front facade (ExtrudeGeometry)
  const pedShape = new THREE.Shape();
  pedShape.moveTo(-12.2, 0);
  pedShape.lineTo(12.2, 0);
  pedShape.lineTo(0, 3.8);
  pedShape.closePath();
  const pedGeo = trackGeo(
    new THREE.ExtrudeGeometry(pedShape, {
      depth: 2.1,
      bevelEnabled: true,
      bevelSize: 0.1,
      bevelThickness: 0.1,
    })
  );
  pedGeo.center();
  const pedimentMesh = new THREE.Mesh(pedGeo, travertineMat);
  pedimentMesh.position.set(0, 14.4, 0.2);
  pedimentMesh.castShadow = true;
  frontFacadeGroup.add(pedimentMesh);

  // Gold crest emblem inside the pediment
  const crestRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.95, 0.12, 16, 32)), brushedGoldMat);
  crestRing.position.set(0, 14.1, 1.35);
  frontFacadeGroup.add(crestRing);

  // Front Colonnade (6 monumental columns across the portico)
  const frontColX = [-9.5, -6.2, -4.8, 4.8, 6.2, 9.5];
  frontColX.forEach((cx) => {
    const col = createClassicalColumn(12.2, 0.58);
    col.position.set(cx, 0, 1.6);
    frontFacadeGroup.add(col);
    addContactShadow(frontFacadeGroup, cx, 0, 1.6, 2.2, 2.2);
  });

  // Flanking Palatial Wings (Left and Right of central portico)
  [-19, 19].forEach((wx) => {
    const wing = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(16, 11.2, 4.5)), creamStuccoMat);
    wing.position.set(wx, 5.6, -1.2);
    wing.castShadow = true;
    wing.receiveShadow = true;
    frontFacadeGroup.add(wing);

    // Terracotta hipped roof cap
    const roof = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(11.5, 2.8, 4)), terracottaMat);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1.1, 1, 0.45);
    roof.position.set(wx, 12.6, -1.2);
    frontFacadeGroup.add(roof);

    // Arched windows with warm interior glow & gold mullions
    [-4.5, 0, 4.5].forEach((ox) => {
      [3.2, 7.6].forEach((wy) => {
        const winFrame = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.7, 2.6, 0.25)), travertineMat);
        winFrame.position.set(wx + ox, wy, 1.05);
        frontFacadeGroup.add(winFrame);

        const winGlow = new THREE.Mesh(
          trackGeo(new THREE.PlaneGeometry(1.3, 2.2)),
          trackMat(new THREE.MeshBasicMaterial({ color: 0xffdca8 }))
        );
        winGlow.position.set(wx + ox, wy, 1.19);
        frontFacadeGroup.add(winGlow);
      });
    });
  });

  // Open Wrought-Iron & Brushed Gold Entrance Gates (swung inward at 65 degrees)
  [-4.1, 4.1].forEach((gx, idx) => {
    const gatePivot = new THREE.Group();
    gatePivot.position.set(gx, 0, 0);
    gatePivot.rotation.y = idx === 0 ? 1.05 : -1.05; // Swung gracefully open inward

    const gateWidth = 3.8;
    const dir = idx === 0 ? 1 : -1;
    // Top & bottom rails
    const bottomRail = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(gateWidth, 0.14, 0.12)), darkBronzeMat);
    bottomRail.position.set((dir * gateWidth) / 2, 0.4, 0);
    gatePivot.add(bottomRail);

    const midRail = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(gateWidth, 0.14, 0.12)), brushedGoldMat);
    midRail.position.set((dir * gateWidth) / 2, 3.2, 0);
    gatePivot.add(midRail);

    // Vertical bars with gilded spear finials
    for (let b = 0; b < 8; b++) {
      const bx = dir * (0.35 + b * 0.46);
      const bar = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.035, 0.035, 5.2, 8)), darkBronzeMat);
      bar.position.set(bx, 2.6, 0);
      gatePivot.add(bar);

      const finial = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.08, 0.32, 8)), brushedGoldMat);
      finial.position.set(bx, 5.3, 0);
      gatePivot.add(finial);
    }
    frontFacadeGroup.add(gatePivot);
  });

  // Twin Bronze Oil Lanterns flanking the staircase arrival
  const createBronzeLantern = (): THREE.Group => {
    const lGroup = new THREE.Group();
    const ped = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.1, 1.4, 1.1)), travertineMat);
    ped.position.y = 0.7;
    lGroup.add(ped);

    const postPoints = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.28, 0),
      new THREE.Vector2(0.12, 0.6),
      new THREE.Vector2(0.09, 2.6),
      new THREE.Vector2(0.22, 2.8),
      new THREE.Vector2(0, 2.8),
    ];
    const post = new THREE.Mesh(trackGeo(new THREE.LatheGeometry(postPoints, 16)), darkBronzeMat);
    post.position.y = 1.4;
    lGroup.add(post);

    const lanternGlobe = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.38, 16, 16)),
      trackMat(new THREE.MeshBasicMaterial({ color: 0xffe4ad }))
    );
    lanternGlobe.position.y = 4.45;
    lGroup.add(lanternGlobe);

    const crown = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.48, 0.4, 8)), brushedGoldMat);
    crown.position.y = 4.9;
    lGroup.add(crown);

    return lGroup;
  };

  [-6.8, 6.8].forEach((lx) => {
    const lantern = createBronzeLantern();
    lantern.position.set(lx, 0.3, 25.5);
    estateGroup.add(lantern);
  });

  // ============================================================================
  // 3. GRAND ENTRANCE ATRIUM & TIERED CARRARA FOUNTAIN (SCENE 02: z = +18 to -8)
  // ============================================================================
  const atriumGroup = new THREE.Group();
  atriumGroup.position.set(0, 2.0, 5);
  estateGroup.add(atriumGroup);

  // Checkered Carrara & Verde Alpi Marble Floor (offset Y by +0.03 to prevent Z-fighting)
  const atriumFloor = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(24, 26)),
    trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.marbleChecker,
        roughness: 0.22,
        metalness: 0.1,
      })
    )
  );
  atriumFloor.rotation.x = -Math.PI / 2;
  atriumFloor.position.y = 0.03;
  atriumFloor.receiveShadow = true;
  atriumGroup.add(atriumFloor);

  // Interior Atrium Colonnade (Left & Right rows of columns + vaulted ceiling ribs)
  [-8.5, 8.5].forEach((sideX) => {
    [-9, -3, 3, 9].forEach((cz) => {
      const col = createClassicalColumn(10.5, 0.48);
      col.position.set(sideX, 0, cz);
      atriumGroup.add(col);
      addContactShadow(atriumGroup, sideX, 0, cz, 1.8, 1.8);
    });

    // Side entablature beam
    const beam = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.4, 0.9, 26)), travertineMat);
    beam.position.set(sideX, 10.9, 0);
    atriumGroup.add(beam);
  });

  // Coffered Atrium Vault Arches overhead
  [-9, -3, 3, 9].forEach((az) => {
    const archCurve = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(8.5, 0.38, 12, 32, Math.PI)),
      brushedGoldMat
    );
    archCurve.position.set(0, 10.8, az);
    atriumGroup.add(archCurve);
  });

  // Tiered Carrara Marble Fountain in the Atrium (7-part LatheGeometry composite)
  // Placed low (height 2.5m) at z = +4 so the camera at y = 5.4 glides smoothly over & looks down into the basins
  const fountainGroup = new THREE.Group();
  fountainGroup.position.set(0, 0.04, 1);
  atriumGroup.add(fountainGroup);
  addContactShadow(atriumGroup, 0, 0.04, 1, 5.8, 5.8);

  const outerPoolProfile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(2.5, 0),
    new THREE.Vector2(2.65, 0.45),
    new THREE.Vector2(2.35, 0.52),
    new THREE.Vector2(2.35, 0.12),
    new THREE.Vector2(0, 0.12),
  ];
  const outerBasin = new THREE.Mesh(trackGeo(new THREE.LatheGeometry(outerPoolProfile, 32)), travertineMat);
  outerBasin.receiveShadow = true;
  outerBasin.castShadow = true;
  fountainGroup.add(outerBasin);

  const lowerWater = new THREE.Mesh(
    trackGeo(new THREE.CircleGeometry(2.32, 32)),
    createAnimatedWaterMaterial(0x196b56, 0.12, 0.02, 2.2)
  );
  lowerWater.rotation.x = -Math.PI / 2;
  lowerWater.position.y = 0.38;
  fountainGroup.add(lowerWater);

  const midBowlProfile = [
    new THREE.Vector2(0, 0.12),
    new THREE.Vector2(0.45, 0.12),
    new THREE.Vector2(0.32, 1.15),
    new THREE.Vector2(1.35, 1.45),
    new THREE.Vector2(1.42, 1.62),
    new THREE.Vector2(1.2, 1.62),
    new THREE.Vector2(0, 1.35),
  ];
  const midBasin = new THREE.Mesh(trackGeo(new THREE.LatheGeometry(midBowlProfile, 28)), travertineMat);
  midBasin.castShadow = true;
  fountainGroup.add(midBasin);

  const topSpireProfile = [
    new THREE.Vector2(0, 1.35),
    new THREE.Vector2(0.22, 1.35),
    new THREE.Vector2(0.15, 2.15),
    new THREE.Vector2(0.45, 2.35),
    new THREE.Vector2(0.08, 2.65),
    new THREE.Vector2(0, 2.75),
  ];
  const topSpire = new THREE.Mesh(trackGeo(new THREE.LatheGeometry(topSpireProfile, 24)), brushedGoldMat);
  fountainGroup.add(topSpire);

  // Expanding ripple rings in the fountain
  for (let r = 0; r < 2; r++) {
    const ring = new THREE.Mesh(
      trackGeo(new THREE.RingGeometry(0.4 + r * 0.6, 0.46 + r * 0.6, 32)),
      trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xd4af5a,
          transparent: true,
          opacity: 0.45,
          side: THREE.DoubleSide,
        })
      )
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.41;
    fountainRings.push(ring);
    fountainGroup.add(ring);
  }

  fountainGroup.userData = {
    landmarkTitle: 'Fontana dei Quattro Venti',
    landmarkSubtitle: '18th-Century Tiered Carrara & Brushed Gold Fountain',
  };
  interactiveLandmarks.push(fountainGroup);

  // Rear Atrium Archway leading out to the Pool Terrace (at z = -8)
  const atriumRearArch = createArchwayPortal(22, 11.5, 1.4, 4.4, 4.8, travertineMat);
  atriumRearArch.position.set(0, 2.0, -8);
  estateGroup.add(atriumRearArch);

  // ============================================================================
  // 4. EMERALD POOL & PERISTYLE GARDEN TERRACE (SCENE 03: z = -8 to -40)
  // ============================================================================
  const poolTerraceGroup = new THREE.Group();
  poolTerraceGroup.position.set(0, 2.0, -24);
  estateGroup.add(poolTerraceGroup);

  // Byzantine Mosaic Pool Basin (spanning z = -13 to -35 in world, i.e., -11 to +11 local)
  const poolBasinFloor = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(11.5, 22)),
    trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.poolMosaic,
        roughness: 0.25,
        metalness: 0.2,
      })
    )
  );
  poolBasinFloor.rotation.x = -Math.PI / 2;
  poolBasinFloor.position.y = 0.03;
  poolTerraceGroup.add(poolBasinFloor);

  // Translucent Shimmering Thermal Pool Water
  const poolWaterMesh = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(11.2, 21.6, 32, 32)),
    createAnimatedWaterMaterial(0x166954, 0.08, 0.035, 1.1)
  );
  poolWaterMesh.rotation.x = -Math.PI / 2;
  poolWaterMesh.position.y = 0.22;
  poolTerraceGroup.add(poolWaterMesh);

  // Raised Travertine Pool Coping Borders with Gold Trim
  [-6.0, 6.0].forEach((px) => {
    const sideCoping = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.8, 0.36, 22.8)), travertineMat);
    sideCoping.position.set(px, 0.18, 0);
    sideCoping.receiveShadow = true;
    poolTerraceGroup.add(sideCoping);

    const goldStrip = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.12, 0.38, 22.6)), brushedGoldMat);
    goldStrip.position.set(px > 0 ? px - 0.36 : px + 0.36, 0.19, 0);
    poolTerraceGroup.add(goldStrip);
  });
  [-11.2, 11.2].forEach((pz) => {
    const endCoping = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(12.8, 0.36, 0.8)), travertineMat);
    endCoping.position.set(0, 0.18, pz);
    poolTerraceGroup.add(endCoping);
  });

  // Helper: Resort Lounger + Silk Parasol Umbrella (6-part composite group)
  const createLoungerAndParasol = (side: number): THREE.Group => {
    const setGroup = new THREE.Group();

    // Teak frame
    const frame = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.1, 0.22, 2.2)), walnutWoodMat);
    frame.position.y = 0.22;
    frame.castShadow = true;
    setGroup.add(frame);

    // Cream cushion
    const cushion = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.98, 0.12, 1.5)), creamSilkMat);
    cushion.position.set(0, 0.38, 0.25);
    setGroup.add(cushion);

    // Inclined backrest
    const backrest = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.98, 0.12, 0.75)), creamSilkMat);
    backrest.rotation.x = 0.48;
    backrest.position.set(0, 0.56, -0.72);
    setGroup.add(backrest);

    // Parasol pole + Lathe canopy + Gold finial
    const pole = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.04, 0.04, 3.1, 10)), walnutWoodMat);
    pole.position.set(side * 1.1, 1.55, -0.4);
    pole.castShadow = true;
    setGroup.add(pole);

    const canopyProfile = [
      new THREE.Vector2(0, 0.55),
      new THREE.Vector2(0.8, 0.42),
      new THREE.Vector2(1.85, 0.05),
      new THREE.Vector2(1.9, -0.08),
    ];
    const canopy = new THREE.Mesh(trackGeo(new THREE.LatheGeometry(canopyProfile, 12)), creamSilkMat);
    canopy.position.set(side * 1.1, 2.75, -0.4);
    canopy.castShadow = true;
    setGroup.add(canopy);

    const finial = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.09, 12, 12)), brushedGoldMat);
    finial.position.set(side * 1.1, 3.38, -0.4);
    setGroup.add(finial);

    return setGroup;
  };

  [-7.2, 0, 7.2].forEach((lz) => {
    const leftSet = createLoungerAndParasol(-1);
    leftSet.position.set(-8.6, 0, lz);
    leftSet.rotation.y = Math.PI / 2;
    poolTerraceGroup.add(leftSet);
    addContactShadow(poolTerraceGroup, -8.6, 0, lz, 2.8, 2.8);

    const rightSet = createLoungerAndParasol(1);
    rightSet.position.set(8.6, 0, lz);
    rightSet.rotation.y = -Math.PI / 2;
    poolTerraceGroup.add(rightSet);
    addContactShadow(poolTerraceGroup, 8.6, 0, lz, 2.8, 2.8);
  });

  // Sculpted Terracotta Amphora Urns with Boxwood Topiary Spheres (LatheGeometry)
  const createAmphoraUrn = (): THREE.Group => {
    const urnGroup = new THREE.Group();
    const plinth = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.95, 0.55, 0.95)), travertineMat);
    plinth.position.y = 0.275;
    urnGroup.add(plinth);

    const urnPoints = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.32, 0),
      new THREE.Vector2(0.22, 0.25),
      new THREE.Vector2(0.55, 0.75),
      new THREE.Vector2(0.38, 1.15),
      new THREE.Vector2(0.46, 1.28),
      new THREE.Vector2(0.35, 1.28),
    ];
    const urnBody = new THREE.Mesh(trackGeo(new THREE.LatheGeometry(urnPoints, 20)), terracottaMat);
    urnBody.position.y = 0.55;
    urnBody.castShadow = true;
    urnGroup.add(urnBody);

    const topiary = new THREE.Mesh(
      trackGeo(new THREE.DodecahedronGeometry(0.48, 2)),
      trackMat(new THREE.MeshStandardMaterial({ color: 0x1e4628, roughness: 0.85 }))
    );
    topiary.position.y = 2.05;
    topiary.castShadow = true;
    urnGroup.add(topiary);

    return urnGroup;
  };

  [-9.5, 9.5].forEach((ux) => {
    [-10.2, 10.2].forEach((uz) => {
      const urn = createAmphoraUrn();
      urn.position.set(ux, 0, uz);
      poolTerraceGroup.add(urn);
      addContactShadow(poolTerraceGroup, ux, 0, uz, 1.4, 1.4);
    });
  });

  // Outer Peristyle Garden Pergola Columns flanking the terrace
  [-13.5, 13.5].forEach((px) => {
    [-9, -3, 3, 9].forEach((pz) => {
      const col = createClassicalColumn(7.8, 0.42);
      col.position.set(px, 0, pz);
      poolTerraceGroup.add(col);
    });
    const pergolaBeam = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.9, 0.45, 24)), walnutWoodMat);
    pergolaBeam.position.set(px, 8.0, 0);
    poolTerraceGroup.add(pergolaBeam);
  });

  // ============================================================================
  // 5. SALONE D'ORO — CANDLELIT DINING HALL (SCENE 04: z = -40 to -74)
  // ============================================================================
  const diningEntranceArch = createArchwayPortal(22, 11.5, 1.5, 4.2, 4.8, travertineMat);
  diningEntranceArch.position.set(0, 2.0, -40);
  estateGroup.add(diningEntranceArch);

  const diningGroup = new THREE.Group();
  diningGroup.position.set(0, 2.0, -57);
  estateGroup.add(diningGroup);

  // Polished Verde Alpi & Cream Inlaid Floor
  const diningFloor = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(22, 32)),
    trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.marbleChecker,
        roughness: 0.16,
        metalness: 0.15,
      })
    )
  );
  diningFloor.rotation.x = -Math.PI / 2;
  diningFloor.position.y = 0.03;
  diningFloor.receiveShadow = true;
  diningGroup.add(diningFloor);

  // Coffered Gilded Vault Ceiling above Dining Hall
  const diningCeiling = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(20, 32)),
    trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.cofferedCeiling,
        roughness: 0.4,
        metalness: 0.3,
        side: THREE.DoubleSide,
      })
    )
  );
  diningCeiling.rotation.x = Math.PI / 2;
  diningCeiling.position.y = 10.6;
  diningGroup.add(diningCeiling);

  // Side Wall Colonnades with Candle Sconces
  [-8.8, 8.8].forEach((wx) => {
    const wall = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.8, 10.6, 32)), creamStuccoMat);
    wall.position.set(wx, 5.3, 0);
    diningGroup.add(wall);

    [-11, -5.5, 0, 5.5, 11].forEach((pilZ) => {
      const pilaster = createClassicalColumn(10.4, 0.42);
      pilaster.position.set(wx > 0 ? wx - 0.6 : wx + 0.6, 0, pilZ);
      diningGroup.add(pilaster);
    });
  });

  // Note on Camera Path in Scene 04:
  // The camera glides down the central aisle at x = 0, y = 4.5 -> 4.2.
  // We place Twin Royal Banquet Tables flanking the central red/cream carpet runner at x = -3.8 and x = +3.8
  // so the camera moves smoothly between the candlelit tables without clipping through furniture,
  // while both tables, goblets, candelabras, and overhead chandeliers fill the frame!
  [-3.9, 3.9].forEach((tableX) => {
    const banquetGroup = new THREE.Group();
    banquetGroup.position.set(tableX, 0, 0);
    diningGroup.add(banquetGroup);
    addContactShadow(diningGroup, tableX, 0, 0, 3.2, 18.5);

    // Table top with cream Flanders linen overhang
    const tableTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.1, 0.14, 16.5)), creamSilkMat);
    tableTop.position.y = 0.88;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    banquetGroup.add(tableTop);

    const goldRunner = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.48, 0.15, 16.52)), brushedGoldMat);
    goldRunner.position.y = 0.885;
    banquetGroup.add(goldRunner);

    // Turned mahogany pedestals
    [-6.2, -2.0, 2.0, 6.2].forEach((legZ) => {
      const ped = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.22, 0.38, 0.84, 16)), walnutWoodMat);
      ped.position.set(0, 0.42, legZ);
      banquetGroup.add(ped);
    });

    // Place settings: porcelain charger plates + LatheGeometry crystal wine goblets
    const gobletPoints = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.09, 0),
      new THREE.Vector2(0.018, 0.03),
      new THREE.Vector2(0.018, 0.16),
      new THREE.Vector2(0.11, 0.24),
      new THREE.Vector2(0.09, 0.36),
    ];
    const gobletGeo = trackGeo(new THREE.LatheGeometry(gobletPoints, 14));

    for (let sz = -6.5; sz <= 6.5; sz += 2.6) {
      [-0.65, 0.65].forEach((px) => {
        // Gold charger & porcelain plate
        const charger = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.28, 0.24, 0.02, 20)), brushedGoldMat);
        charger.position.set(px, 0.96, sz);
        banquetGroup.add(charger);

        const goblet = new THREE.Mesh(gobletGeo, crystalGlassMat);
        goblet.position.set(px * 0.78, 0.96, sz + 0.34);
        banquetGroup.add(goblet);

        // High-back Emerald Velvet & Gold Dining Chair
        const chairGroup = new THREE.Group();
        chairGroup.position.set(px * 1.95, 0, sz);
        chairGroup.rotation.y = px > 0 ? -Math.PI / 2 : Math.PI / 2;

        const seat = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.56, 0.08, 0.56)), emeraldMarbleMat);
        seat.position.y = 0.52;
        chairGroup.add(seat);

        const back = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.52, 0.68, 0.07)), emeraldMarbleMat);
        back.position.set(0, 0.88, -0.25);
        chairGroup.add(back);

        const crest = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.16, 0.025, 8, 16)), brushedGoldMat);
        crest.position.set(0, 1.24, -0.25);
        chairGroup.add(crest);

        [-0.22, 0.22].forEach((lx) => {
          [-0.22, 0.22].forEach((lz) => {
            const leg = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.025, 0.02, 0.52, 8)), walnutWoodMat);
            leg.position.set(lx, 0.26, lz);
            chairGroup.add(leg);
          });
        });
        banquetGroup.add(chairGroup);
      });
    }

    // 3 Tiered Brass Candelabras on each banquet table
    [-5.2, 0, 5.2].forEach((cz) => {
      const candGroup = new THREE.Group();
      candGroup.position.set(0, 0.96, cz);

      const stemPoints = [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.22, 0),
        new THREE.Vector2(0.06, 0.15),
        new THREE.Vector2(0.04, 0.72),
        new THREE.Vector2(0.12, 0.82),
        new THREE.Vector2(0, 0.82),
      ];
      const stem = new THREE.Mesh(trackGeo(new THREE.LatheGeometry(stemPoints, 16)), brushedGoldMat);
      candGroup.add(stem);

      // 3 candle arms
      [-0.28, 0, 0.28].forEach((ax, idx) => {
        const armH = idx === 1 ? 0.96 : 0.82;
        const taper = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.022, 0.026, 0.34, 10)), creamStuccoMat);
        taper.position.set(ax, armH, 0);
        candGroup.add(taper);

        const flameMat = trackMat(new THREE.MeshBasicMaterial({ color: 0xffd27d }));
        const flame = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.032, 0.11, 8)), flameMat);
        flame.position.set(ax, armH + 0.22, 0);
        candleFlames.push(flame);
        candGroup.add(flame);
      });

      banquetGroup.add(candGroup);
    });
  });

  // Two Grand Venetian Brass & Murano Crystal Chandeliers suspended overhead in Salone d'Oro
  const createVenetianChandelier = (): THREE.Group => {
    const chGroup = new THREE.Group();

    const chain = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 8)), brushedGoldMat);
    chain.position.y = 1.2;
    chGroup.add(chain);

    const centralBodyPoints = [
      new THREE.Vector2(0, -0.8),
      new THREE.Vector2(0.18, -0.6),
      new THREE.Vector2(0.42, -0.2),
      new THREE.Vector2(0.15, 0.2),
      new THREE.Vector2(0.32, 0.55),
      new THREE.Vector2(0, 0.7),
    ];
    const core = new THREE.Mesh(trackGeo(new THREE.LatheGeometry(centralBodyPoints, 20)), brushedGoldMat);
    chGroup.add(core);

    const mainRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(1.75, 0.06, 12, 32)), brushedGoldMat);
    mainRing.rotation.x = Math.PI / 2;
    mainRing.position.y = -0.15;
    chGroup.add(mainRing);

    const upperRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(1.05, 0.045, 12, 24)), brushedGoldMat);
    upperRing.rotation.x = Math.PI / 2;
    upperRing.position.y = 0.35;
    chGroup.add(upperRing);

    // 12 radial candle holders & crystal pendants
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const rx = Math.cos(ang) * 1.75;
      const rz = Math.sin(ang) * 1.75;

      const candle = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.03, 0.03, 0.28, 8)), creamStuccoMat);
      candle.position.set(rx, 0.04, rz);
      chGroup.add(candle);

      const flame = new THREE.Mesh(
        trackGeo(new THREE.ConeGeometry(0.045, 0.14, 8)),
        trackMat(new THREE.MeshBasicMaterial({ color: 0xffe094 }))
      );
      flame.position.set(rx, 0.24, rz);
      candleFlames.push(flame);
      chGroup.add(flame);

      const crystalDrop = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.12, 0)), crystalGlassMat);
      crystalDrop.position.set(rx * 0.92, -0.36, rz * 0.92);
      chGroup.add(crystalDrop);
    }

    const warmLight = new THREE.PointLight(0xffb85c, 4.5, 22, 1.6);
    warmLight.position.set(0, -0.2, 0);
    candleLights.push(warmLight);
    chGroup.add(warmLight);

    return chGroup;
  };

  [-5.5, 5.5].forEach((chZ) => {
    const chandelier = createVenetianChandelier();
    chandelier.position.set(0, 8.2, chZ);
    chandelier.userData = {
      landmarkTitle: 'Murano & Gilded Brass Chandelier',
      landmarkSubtitle: 'Hand-Blown Venetian Crystal · Twelve Beeswax Tapers',
    };
    interactiveLandmarks.push(chandelier);
    diningGroup.add(chandelier);
  });

  // ============================================================================
  // 6. THE AURELIA ROYAL SUITE & PRIVATE BALCONY LOGGIA (SCENE 05 & 06: z = -74 to -114)
  // ============================================================================
  const suiteEntranceArch = createArchwayPortal(22, 11.5, 1.4, 4.0, 4.6, travertineMat);
  suiteEntranceArch.position.set(0, 2.0, -74);
  estateGroup.add(suiteEntranceArch);

  const suiteGroup = new THREE.Group();
  suiteGroup.position.set(0, 2.0, -88);
  estateGroup.add(suiteGroup);

  // French Royal Oak Herringbone Parquet Floor
  const suiteFloor = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(20, 26)),
    trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.parquetFloor,
        roughness: 0.32,
        metalness: 0.08,
      })
    )
  );
  suiteFloor.rotation.x = -Math.PI / 2;
  suiteFloor.position.y = 0.03;
  suiteFloor.receiveShadow = true;
  suiteGroup.add(suiteFloor);

  // Classical Cream & Gold Woven Medallion Rug (offset Y by 0.06 so zero Z-fighting)
  const suiteRug = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(13.5, 16.5)),
    trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.persianRug,
        roughness: 0.82,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    )
  );
  suiteRug.rotation.x = -Math.PI / 2;
  suiteRug.position.set(0, 0.06, 0);
  suiteRug.receiveShadow = true;
  suiteGroup.add(suiteRug);

  // Four-Poster Brushed Brass & Como Silk Canopy Bed (11-part composite group)
  // Positioned gracefully at x = -4.8, z = 0, facing right toward the central gallery & sea vista
  const bedGroup = new THREE.Group();
  bedGroup.position.set(-4.8, 0.06, 0);
  bedGroup.rotation.y = Math.PI / 2;
  suiteGroup.add(bedGroup);
  addContactShadow(suiteGroup, -4.8, 0.06, 0, 5.2, 5.2);

  // 1. Walnut platform base
  const bedBase = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.4, 0.42, 4.0)), walnutWoodMat);
  bedBase.position.y = 0.21;
  bedBase.castShadow = true;
  bedGroup.add(bedBase);

  // 2. Plush cream silk mattress
  const mattress = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.15, 0.44, 3.75)), creamSilkMat);
  mattress.position.y = 0.64;
  mattress.castShadow = true;
  bedGroup.add(mattress);

  // 3. Emerald & Gold brocade throw blanket at foot of bed
  const throwBlanket = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.2, 0.46, 1.15)), emeraldMarbleMat);
  throwBlanket.position.set(0, 0.65, 1.25);
  bedGroup.add(throwBlanket);

  // 4. Four silk pillows + golden bolster
  [-0.78, 0.78].forEach((px) => {
    const pillow = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.15, 0.24, 0.58)), creamSilkMat);
    pillow.rotation.x = 0.25;
    pillow.position.set(px, 0.98, -1.35);
    bedGroup.add(pillow);
  });
  const bolster = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.16, 0.16, 2.4, 16)), brushedGoldMat);
  bolster.rotation.z = Math.PI / 2;
  bolster.position.set(0, 0.96, -0.88);
  bedGroup.add(bolster);

  // 5. Tufted headboard with gilded crest frame
  const headboard = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.3, 2.2, 0.24)), emeraldMarbleMat);
  headboard.position.set(0, 1.4, -1.92);
  bedGroup.add(headboard);

  const headboardTrim = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.45, 2.35, 0.18)), brushedGoldMat);
  headboardTrim.position.set(0, 1.4, -1.96);
  bedGroup.add(headboardTrim);

  // 6. Four turned brass canopy posts + upper tester canopy frame + silk valances
  const canopyH = 4.2;
  [-1.62, 1.62].forEach((cx) => {
    [-1.92, 1.92].forEach((cz) => {
      const post = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.055, 0.07, canopyH, 16)), brushedGoldMat);
      post.position.set(cx, canopyH / 2, cz);
      post.castShadow = true;
      bedGroup.add(post);

      const finial = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.11, 12, 12)), brushedGoldMat);
      finial.position.set(cx, canopyH + 0.1, cz);
      bedGroup.add(finial);
    });
  });

  const canopyCrown = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.35, 0.16, 3.95)), brushedGoldMat);
  canopyCrown.position.y = canopyH;
  bedGroup.add(canopyCrown);

  const canopySilk = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(3.2, 3.8)), creamSilkMat);
  canopySilk.rotation.x = Math.PI / 2;
  canopySilk.position.y = canopyH - 0.05;
  bedGroup.add(canopySilk);

  bedGroup.userData = {
    landmarkTitle: 'The Aurelia Canopy Bed',
    landmarkSubtitle: 'Hand-Turned Brushed Brass & Como Silk Drapery',
  };
  interactiveLandmarks.push(bedGroup);

  // Right Side of Suite: Classical Salon Lounge Settee, Marble Low Table & Brass Floor Lamp (x = +4.8)
  const loungeGroup = new THREE.Group();
  loungeGroup.position.set(4.8, 0.06, 0);
  suiteGroup.add(loungeGroup);
  addContactShadow(suiteGroup, 4.8, 0.06, 0, 3.8, 4.8);

  const setteeBase = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.3, 0.45, 3.4)), walnutWoodMat);
  setteeBase.position.set(0.6, 0.25, 0);
  loungeGroup.add(setteeBase);

  const setteeCushion = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.18, 0.22, 3.2)), creamSilkMat);
  setteeCushion.position.set(0.55, 0.55, 0);
  loungeGroup.add(setteeCushion);

  const setteeBack = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.24, 0.85, 3.3)), emeraldMarbleMat);
  setteeBack.position.set(1.1, 0.88, 0);
  loungeGroup.add(setteeBack);

  const coffeeTable = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.95, 0.95, 0.08, 24)), travertineMat);
  coffeeTable.position.set(-0.85, 0.48, 0);
  loungeGroup.add(coffeeTable);

  const coffeeBase = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.18, 0.45, 0.46, 16)), brushedGoldMat);
  coffeeBase.position.set(-0.85, 0.23, 0);
  loungeGroup.add(coffeeBase);

  // Suite Arched Belvedere Portal at z = -101 opening onto the Private Cliffside Balcony!
  const balconyPortal = createArchwayPortal(22, 11.2, 1.2, 4.8, 4.8, travertineMat);
  balconyPortal.position.set(0, 2.0, -101);
  estateGroup.add(balconyPortal);

  // Tall French Casement Doors swung open onto the balcony
  [-4.6, 4.6].forEach((dx, idx) => {
    const doorFrame = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.2, 7.6, 0.14)), walnutWoodMat);
    doorFrame.position.set(dx, 5.8, -101.8);
    doorFrame.rotation.y = idx === 0 ? 0.85 : -0.85;
    estateGroup.add(doorFrame);
  });

  // ============================================================================
  // 7. PRIVATE CLIFFSIDE BALCONY LOGGIA & CHAMPAGNE TABLE (SCENE 06: z = -101 to -115)
  // ============================================================================
  const loggiaGroup = new THREE.Group();
  loggiaGroup.position.set(0, 2.0, -108);
  estateGroup.add(loggiaGroup);

  // Checkered Marble Balcony Terrace
  const loggiaFloor = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(22, 14)),
    trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.marbleChecker,
        roughness: 0.2,
        metalness: 0.1,
      })
    )
  );
  loggiaFloor.rotation.x = -Math.PI / 2;
  loggiaFloor.position.y = 0.03;
  loggiaFloor.receiveShadow = true;
  loggiaGroup.add(loggiaFloor);

  // Seaward Limestone Balustrade with LatheGeometry Balusters along the cliff edge (z = -6.5 local, i.e. -114.5 world)
  const balusterPoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.12, 0),
    new THREE.Vector2(0.07, 0.2),
    new THREE.Vector2(0.14, 0.48),
    new THREE.Vector2(0.06, 0.78),
    new THREE.Vector2(0.12, 0.95),
    new THREE.Vector2(0, 0.95),
  ];
  const balusterGeo = trackGeo(new THREE.LatheGeometry(balusterPoints, 14));

  const botRail = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(22, 0.22, 0.55)), travertineMat);
  botRail.position.set(0, 0.11, -6.5);
  loggiaGroup.add(botRail);

  const topRail = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(22.2, 0.2, 0.62)), travertineMat);
  topRail.position.set(0, 1.24, -6.5);
  loggiaGroup.add(topRail);

  for (let bx = -10.2; bx <= 10.2; bx += 0.75) {
    const bal = new THREE.Mesh(balusterGeo, travertineMat);
    bal.position.set(bx, 0.22, -6.5);
    bal.castShadow = true;
    loggiaGroup.add(bal);
  }

  // Corner Urns on the Seaward Balustrade
  [-10.4, 10.4].forEach((ux) => {
    const urn = createAmphoraUrn();
    urn.scale.setScalar(0.85);
    urn.position.set(ux, 1.32, -6.5);
    loggiaGroup.add(urn);
  });

  // Intimate Marble & Gold Bistro Table with Champagne Cooler & Two Flutes at the Balcony Edge
  const bistroGroup = new THREE.Group();
  bistroGroup.position.set(-2.4, 0.03, -4.2);
  loggiaGroup.add(bistroGroup);
  addContactShadow(loggiaGroup, -2.4, 0.03, -4.2, 2.2, 2.2);

  const bistroStem = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.07, 0.34, 0.86, 16)), brushedGoldMat);
  bistroStem.position.y = 0.43;
  bistroGroup.add(bistroStem);

  const bistroTop = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.75, 0.72, 0.06, 24)), travertineMat);
  bistroTop.position.y = 0.88;
  bistroTop.castShadow = true;
  bistroGroup.add(bistroTop);

  const bistroRim = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.74, 0.025, 10, 28)), brushedGoldMat);
  bistroRim.rotation.x = Math.PI / 2;
  bistroRim.position.y = 0.88;
  bistroGroup.add(bistroRim);

  // Silver/Gold Champagne Cooler + Emerald Green Vintage Bottle
  const bucket = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.18, 0.13, 0.28, 16)), brushedGoldMat);
  bucket.position.set(0.12, 1.05, -0.08);
  bistroGroup.add(bucket);

  const bottle = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.035, 0.08, 0.42, 12)), emeraldMarbleMat);
  bottle.rotation.z = 0.22;
  bottle.position.set(0.1, 1.18, -0.08);
  bistroGroup.add(bottle);

  // Two Champagne Flutes
  [-0.26, -0.08].forEach((fx, idx) => {
    const flute = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.045, 0.015, 0.28, 12)),
      crystalGlassMat
    );
    flute.position.set(fx, 1.05, idx === 0 ? 0.16 : -0.18);
    bistroGroup.add(flute);
  });

  bistroGroup.userData = {
    landmarkTitle: 'Loggia d’Oro Aperitivo Terrace',
    landmarkSubtitle: 'Private Cliffside Belvedere · 180° Tyrrhenian Horizon',
  };
  interactiveLandmarks.push(bistroGroup);

  // ============================================================================
  // 8. INSTANCED MEDITERRANEAN CYPRESS GROVES & COASTAL LIMESTONE CLIFFS
  // ============================================================================
  // Using InstancedMesh with per-instance scale (±15%), setColorAt tint variation, and computeBoundingSphere()
  const cypressCount = 68;
  const trunkGeo = trackGeo(new THREE.CylinderGeometry(0.18, 0.28, 1.8, 8));
  trunkGeo.translate(0, 0.9, 0);
  const foliageGeo = trackGeo(new THREE.ConeGeometry(1.15, 9.2, 10));
  foliageGeo.translate(0, 5.8, 0);

  const trunkInstanced = new THREE.InstancedMesh(trunkGeo, walnutWoodMat, cypressCount);
  const foliageMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.82,
      metalness: 0.02,
    })
  );
  const foliageInstanced = new THREE.InstancedMesh(foliageGeo, foliageMat, cypressCount);
  foliageInstanced.castShadow = true;
  foliageInstanced.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const tempColor = new THREE.Color();

  // Distribute cypresses along left & right garden terraces and coastal cliffs
  let cIdx = 0;
  for (let i = 0; i < cypressCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const row = Math.floor(i / 2);
    const zPos = 24 - row * 4.1;
    const xBase = row < 5 ? 16.5 : 17.5 + (row % 3) * 3.8;
    const xPos = side * xBase + Math.sin(i * 3.7) * 1.2;

    const scaleY = 0.86 + ((i * 17) % 30) * 0.01;
    const scaleXZ = 0.88 + ((i * 13) % 24) * 0.01;

    dummy.position.set(xPos, 2.0, zPos);
    dummy.rotation.set(0, (i * 1.1) % Math.PI, 0);
    dummy.scale.set(scaleXZ, scaleY, scaleXZ);
    dummy.updateMatrix();

    trunkInstanced.setMatrixAt(cIdx, dummy.matrix);
    foliageInstanced.setMatrixAt(cIdx, dummy.matrix);

    // Subtle botanical green tint variation
    const hue = 0.36 + ((i % 5) - 2) * 0.012;
    const light = 0.16 + (i % 4) * 0.025;
    tempColor.setHSL(hue, 0.48, light);
    foliageInstanced.setColorAt(cIdx, tempColor);
    cIdx++;
  }

  trunkInstanced.instanceMatrix.needsUpdate = true;
  foliageInstanced.instanceMatrix.needsUpdate = true;
  if (foliageInstanced.instanceColor) foliageInstanced.instanceColor.needsUpdate = true;
  trunkInstanced.computeBoundingSphere();
  foliageInstanced.computeBoundingSphere();

  estateGroup.add(trunkInstanced);
  estateGroup.add(foliageInstanced);

  // Natural Coastal Limestone Cliffs & Distant Sea Stacks (InstancedMesh of 36 sculpted rock masses)
  const cliffCount = 36;
  const rockGeo = trackGeo(new THREE.DodecahedronGeometry(6.5, 1));
  const rockMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.88,
      metalness: 0.04,
    })
  );
  const cliffInstanced = new THREE.InstancedMesh(rockGeo, rockMat, cliffCount);
  cliffInstanced.receiveShadow = true;

  for (let i = 0; i < cliffCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    let rx = side * (34 + (i % 6) * 8);
    let rz = 65 - i * 6.5;
    let ry = -1.2;
    let sx = 1.4 + (i % 3) * 0.45;
    let sy = 0.9 + (i % 4) * 0.55;
    let sz = 1.3 + (i % 2) * 0.5;

    // Place a few picturesque distant sea islands in the horizon vista (z = -155 to -205)
    if (i >= 28) {
      rx = side * (26 + (i - 28) * 14);
      rz = -150 - (i - 28) * 11;
      sy = 1.4 + (i % 3) * 0.6;
      sx = 2.2;
      sz = 2.0;
    }

    dummy.position.set(rx, ry, rz);
    dummy.rotation.set(i * 0.4, i * 0.9, 0);
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    cliffInstanced.setMatrixAt(i, dummy.matrix);

    tempColor.setHSL(0.1, 0.22, 0.52 + (i % 5) * 0.04);
    cliffInstanced.setColorAt(i, tempColor);
  }
  cliffInstanced.instanceMatrix.needsUpdate = true;
  if (cliffInstanced.instanceColor) cliffInstanced.instanceColor.needsUpdate = true;
  cliffInstanced.computeBoundingSphere();
  scene.add(cliffInstanced);

  return {
    waterUniforms,
    fountainRings,
    candleLights,
    candleFlames,
    sailboatGroup,
    sunDisc,
    sunHalo,
    interactiveLandmarks,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
