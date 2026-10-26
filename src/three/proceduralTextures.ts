import * as THREE from 'three';

export interface ProceduralTextureSet {
  travertine: THREE.CanvasTexture;
  marbleChecker: THREE.CanvasTexture;
  poolMosaic: THREE.CanvasTexture;
  parquetFloor: THREE.CanvasTexture;
  persianRug: THREE.CanvasTexture;
  cofferedCeiling: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  dispose: () => void;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  const textures: THREE.CanvasTexture[] = [];

  const register = (tex: THREE.CanvasTexture, isColor = true, repeatX = 1, repeatY = 1) => {
    if (isColor) {
      tex.colorSpace = THREE.SRGBColorSpace;
    }
    tex.anisotropy = maxAnisotropy;
    if (repeatX > 1 || repeatY > 1) {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeatX, repeatY);
    }
    tex.needsUpdate = true;
    textures.push(tex);
    return tex;
  };

  // 1. Warm Italian Travertine Stone Blocks
  const travCanvas = document.createElement('canvas');
  travCanvas.width = 512;
  travCanvas.height = 512;
  const tCtx = travCanvas.getContext('2d')!;
  tCtx.fillStyle = '#EFE7D6';
  tCtx.fillRect(0, 0, 512, 512);

  // Subtle horizontal sedimentary veins
  for (let y = 0; y < 512; y += 3) {
    const wave = Math.sin(y * 0.06) * 12;
    tCtx.fillStyle = y % 9 === 0 ? 'rgba(186, 165, 130, 0.16)' : 'rgba(255, 250, 240, 0.18)';
    tCtx.fillRect(0, y, 512, 2 + (wave > 0 ? 1 : 0));
  }

  // Ashlar block mortar grid
  tCtx.strokeStyle = 'rgba(155, 138, 108, 0.38)';
  tCtx.lineWidth = 2;
  const rows = 8;
  const rowH = 512 / rows;
  for (let r = 0; r < rows; r++) {
    const y = r * rowH;
    tCtx.beginPath();
    tCtx.moveTo(0, y);
    tCtx.lineTo(512, y);
    tCtx.stroke();

    const offset = (r % 2) * 64;
    for (let x = offset; x < 512; x += 128) {
      tCtx.beginPath();
      tCtx.moveTo(x, y);
      tCtx.lineTo(x, y + rowH);
      tCtx.stroke();
    }
  }
  const travertine = register(new THREE.CanvasTexture(travCanvas), true, 4, 4);

  // 2. Grand Atrium Checkered Marble Floor (Cream Carrara + Deep Emerald Verde Alpi + Gold)
  const marbleCanvas = document.createElement('canvas');
  marbleCanvas.width = 512;
  marbleCanvas.height = 512;
  const mCtx = marbleCanvas.getContext('2d')!;
  const tileSize = 128;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const isDark = (r + c) % 2 === 1;
      mCtx.fillStyle = isDark ? '#112B22' : '#F4EFE2';
      mCtx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);

      // Gold inset border
      mCtx.strokeStyle = '#C8A45D';
      mCtx.lineWidth = 2;
      mCtx.strokeRect(c * tileSize + 4, r * tileSize + 4, tileSize - 8, tileSize - 8);

      // Subtle marble veining
      mCtx.strokeStyle = isDark ? 'rgba(200, 164, 93, 0.18)' : 'rgba(160, 145, 120, 0.22)';
      mCtx.lineWidth = 1.5;
      mCtx.beginPath();
      mCtx.moveTo(c * tileSize + 12, r * tileSize + 20);
      mCtx.bezierCurveTo(
        c * tileSize + 50,
        r * tileSize + 40,
        c * tileSize + 70,
        r * tileSize + 95,
        c * tileSize + 115,
        r * tileSize + 108
      );
      mCtx.stroke();
    }
  }
  const marbleChecker = register(new THREE.CanvasTexture(marbleCanvas), true, 6, 6);

  // 3. Byzantine Emerald & 24k Gold Pool Mosaic
  const poolCanvas = document.createElement('canvas');
  poolCanvas.width = 512;
  poolCanvas.height = 512;
  const pCtx = poolCanvas.getContext('2d')!;
  pCtx.fillStyle = '#0D3B2E';
  pCtx.fillRect(0, 0, 512, 512);

  const cell = 16;
  for (let y = 0; y < 512; y += cell) {
    for (let x = 0; x < 512; x += cell) {
      const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const frac = hash - Math.floor(hash);
      if (frac > 0.92) {
        pCtx.fillStyle = '#D4AF5A'; // Gold leaf tessera
      } else if (frac > 0.55) {
        pCtx.fillStyle = '#145241';
      } else if (frac > 0.2) {
        pCtx.fillStyle = '#0F4436';
      } else {
        pCtx.fillStyle = '#1B6652';
      }
      pCtx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
    }
  }
  const poolMosaic = register(new THREE.CanvasTexture(poolCanvas), true, 6, 6);

  // 4. French Royal Oak Herringbone Parquet
  const parqCanvas = document.createElement('canvas');
  parqCanvas.width = 512;
  parqCanvas.height = 512;
  const pqCtx = parqCanvas.getContext('2d')!;
  pqCtx.fillStyle = '#5C432C';
  pqCtx.fillRect(0, 0, 512, 512);

  const plankW = 64;
  const plankH = 32;
  for (let y = 0; y < 512; y += plankH) {
    for (let x = 0; x < 512; x += plankW) {
      const shade = ((x / plankW + y / plankH) % 3) * 8;
      pqCtx.fillStyle = `rgb(${96 + shade}, ${70 + shade}, ${45 + shade})`;
      pqCtx.fillRect(x + 1, y + 1, plankW - 2, plankH - 2);
      pqCtx.strokeStyle = 'rgba(40, 26, 14, 0.45)';
      pqCtx.lineWidth = 1;
      pqCtx.strokeRect(x, y, plankW, plankH);
    }
  }
  const parquetFloor = register(new THREE.CanvasTexture(parqCanvas), true, 5, 5);

  // 5. Classical Cream & Gold Medallion Rug
  const rugCanvas = document.createElement('canvas');
  rugCanvas.width = 512;
  rugCanvas.height = 512;
  const rCtx = rugCanvas.getContext('2d')!;
  rCtx.fillStyle = '#F2ECE0';
  rCtx.fillRect(0, 0, 512, 512);

  // Deep green & gold outer borders
  rCtx.strokeStyle = '#132D24';
  rCtx.lineWidth = 26;
  rCtx.strokeRect(24, 24, 464, 464);

  rCtx.strokeStyle = '#C8A45D';
  rCtx.lineWidth = 6;
  rCtx.strokeRect(48, 48, 416, 416);
  rCtx.strokeRect(60, 60, 392, 392);

  // Central floral medallion
  rCtx.save();
  rCtx.translate(256, 256);
  rCtx.fillStyle = '#132D24';
  rCtx.beginPath();
  rCtx.arc(0, 0, 92, 0, Math.PI * 2);
  rCtx.fill();

  rCtx.strokeStyle = '#C8A45D';
  rCtx.lineWidth = 4;
  rCtx.beginPath();
  rCtx.arc(0, 0, 82, 0, Math.PI * 2);
  rCtx.stroke();

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    rCtx.beginPath();
    rCtx.moveTo(0, 0);
    rCtx.lineTo(Math.cos(angle) * 78, Math.sin(angle) * 78);
    rCtx.stroke();
  }
  rCtx.restore();
  const persianRug = register(new THREE.CanvasTexture(rugCanvas), true, 1, 1);

  // 6. Gilded Coffered Ceiling Texture
  const cofCanvas = document.createElement('canvas');
  cofCanvas.width = 512;
  cofCanvas.height = 512;
  const cCtx = cofCanvas.getContext('2d')!;
  cCtx.fillStyle = '#EAE2D0';
  cCtx.fillRect(0, 0, 512, 512);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const x = c * 128;
      const y = r * 128;
      cCtx.strokeStyle = '#C8A45D';
      cCtx.lineWidth = 6;
      cCtx.strokeRect(x + 12, y + 12, 104, 104);
      cCtx.fillStyle = '#142E24';
      cCtx.fillRect(x + 22, y + 22, 84, 84);
      // Gold rosette center
      cCtx.fillStyle = '#D4AF5A';
      cCtx.beginPath();
      cCtx.arc(x + 64, y + 64, 14, 0, Math.PI * 2);
      cCtx.fill();
    }
  }
  const cofferedCeiling = register(new THREE.CanvasTexture(cofCanvas), true, 3, 4);

  // 7. Soft Radial Contact Shadow
  const shCanvas = document.createElement('canvas');
  shCanvas.width = 256;
  shCanvas.height = 256;
  const sCtx = shCanvas.getContext('2d')!;
  const grad = sCtx.createRadialGradient(128, 128, 12, 128, 128, 120);
  grad.addColorStop(0, 'rgba(6, 15, 11, 0.58)');
  grad.addColorStop(0.55, 'rgba(6, 15, 11, 0.24)');
  grad.addColorStop(1, 'rgba(6, 15, 11, 0.0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 256, 256);
  const contactShadow = register(new THREE.CanvasTexture(shCanvas), true, 1, 1);

  return {
    travertine,
    marbleChecker,
    poolMosaic,
    parquetFloor,
    persianRug,
    cofferedCeiling,
    contactShadow,
    dispose: () => {
      textures.forEach((t) => t.dispose());
    },
  };
}
