import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const CAM_Z = 10.6;

const BACK = [
  { id: "brain", x: -4.45, z: -1.05 },
  { id: "lungs", x: -2.9, z: -1.55 },
  { id: "heart", x: 2.9, z: -1.55 },
  { id: "skin", x: 4.45, z: -1.05 },
];

const FRONT = [
  { id: "liver", x: -2.7, z: 2.65 },
  { id: "kidneys", x: -1.15, z: 3.4 },
  { id: "digestive", x: 1.15, z: 3.4 },
  { id: "skeleton", x: 2.7, z: 2.65 },
];

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(url));
    image.src = url;
  });
}

function canvasTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function knockOut(image) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = pixels.data;
  const corner = data[3];
  const opaque = corner > 240 && data[0] < 18 && data[1] < 18 && data[2] < 18;
  if (opaque || corner > 250) {
    for (let i = 0; i < data.length; i += 4) {
      const light = Math.max(data[i], data[i + 1], data[i + 2]);
      if (light < 14) data[i + 3] = 0;
      else if (light < 42) data[i + 3] = Math.round(((light - 14) / 28) * 255);
    }
    ctx.putImageData(pixels, 0, 0);
  }
  return canvasTexture(canvas);
}

function trimMap(image) {
  const held = knockOut(image);
  const source = held.image;
  const ctx = source.getContext("2d", { willReadFrequently: true });
  const pixels = ctx.getImageData(0, 0, source.width, source.height).data;
  let minX = source.width;
  let minY = source.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < source.height; y += 2) {
    for (let x = 0; x < source.width; x += 2) {
      if (pixels[(y * source.width + x) * 4 + 3] > 24) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  const width = Math.max(8, maxX - minX);
  const height = Math.max(8, maxY - minY);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(source, minX, minY, width, height, 0, 0, width, height);
  settleSpecimen(canvas);
  const texture = canvasTexture(canvas);
  texture.userData.aspect = width / height;
  held.dispose();
  return texture;
}

function wrap(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = text.split(" ");
  let line = "";
  let drawn = 0;
  for (let i = 0; i < words.length; i += 1) {
    const next = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = words[i];
      y += lineHeight;
      drawn += 1;
      if (drawn >= maxLines - 1) {
        ctx.fillText(line, x, y);
        return y + lineHeight;
      }
    } else line = next;
  }
  if (line) ctx.fillText(line, x, y);
  return y + lineHeight;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBoard(figure) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1280;
  const ctx = canvas.getContext("2d");
  const wash = ctx.createLinearGradient(0, 0, 0, canvas.height);
  wash.addColorStop(0, "#1a1d24");
  wash.addColorStop(0.18, "#12110e");
  wash.addColorStop(1, "#07080c");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const sheen = ctx.createLinearGradient(0, 0, 0, 360);
  sheen.addColorStop(0, "rgba(255,244,220,0.07)");
  sheen.addColorStop(1, "rgba(255,244,220,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, canvas.width, 360);

  ctx.strokeStyle = "#c6a56a";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(96, 128, 34, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#f4efe6";
  ctx.font = "600 92px 'Instrument Sans', sans-serif";
  ctx.fillText(figure.name, 156, 148);
  ctx.fillStyle = "#e4ddd0";
  ctx.font = "500 58px Fraunces, Georgia, serif";
  const afterTitle = wrap(ctx, figure.title, 72, 230, 880, 70, 2);

  ctx.strokeStyle = "rgba(198,165,106,0.45)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(72, afterTitle + 8);
  ctx.lineTo(952, afterTitle + 8);
  ctx.stroke();

  let y = afterTitle + 78;
  const blocks = [
    ["Biological inspiration", figure.inspiration],
    ["Principle", figure.principle],
    ["Oman solution", figure.oman],
  ];
  blocks.forEach(([label, text]) => {
    ctx.fillStyle = "#c6a56a";
    ctx.font = "600 32px 'JetBrains Mono', monospace";
    ctx.fillText(label.toUpperCase(), 72, y);
    ctx.fillStyle = "#d9d2c6";
    ctx.font = "400 48px 'Instrument Sans', sans-serif";
    y = wrap(ctx, text, 72, y + 62, 880, 60, 2) + 28;
  });

  const strip = ctx.createLinearGradient(72, 0, 860, 0);
  strip.addColorStop(0, "#6a5438");
  strip.addColorStop(0.55, "#c6a56a");
  strip.addColorStop(1, "#e6d3a4");
  ctx.fillStyle = strip;
  roundRect(ctx, 72, 1172, 760, 72, 12);
  ctx.fill();
  ctx.strokeStyle = "rgba(239,232,220,0.55)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(910, 1208, 28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#efe8dc";
  ctx.font = "500 40px 'Instrument Sans', sans-serif";
  ctx.fillText("→", 892, 1222);

  return canvasTexture(canvas);
}

function galleryFloor() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#12110e";
  ctx.fillRect(0, 0, 1024, 1024);
  const stone = ctx.createRadialGradient(512, 512, 30, 512, 512, 520);
  stone.addColorStop(0, "#1a1d24");
  stone.addColorStop(0.42, "#14120f");
  stone.addColorStop(1, "#07080c");
  ctx.fillStyle = stone;
  ctx.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 5000; i += 1) {
    const shade = 18 + Math.random() * 28;
    ctx.fillStyle = `rgba(${shade + 6}, ${shade + 2}, ${shade - 4}, 0.07)`;
    ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
  }
  ctx.strokeStyle = "rgba(214, 188, 134, 0.55)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(512, 512, 268, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(214, 188, 134, 0.18)";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(512, 512, 286, 0, Math.PI * 2);
  ctx.stroke();
  const edge = ctx.createRadialGradient(512, 512, 300, 512, 512, 512);
  edge.addColorStop(0, "rgba(0,0,0,0)");
  edge.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, 1024, 1024);
  return canvasTexture(canvas);
}

function roomWall() {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const wash = ctx.createLinearGradient(0, 0, 0, 512);
  wash.addColorStop(0, "#07080c");
  wash.addColorStop(0.28, "#1a1d24");
  wash.addColorStop(0.62, "#14120f");
  wash.addColorStop(0.86, "#1c1914");
  wash.addColorStop(1, "#0e0d0b");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, 16, 512);
  ctx.fillStyle = "rgba(214, 188, 134, 0.35)";
  ctx.fillRect(0, 470, 16, 3);
  return canvasTexture(canvas);
}

function drawPool() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const glow = ctx.createRadialGradient(256, 256, 20, 256, 256, 250);
  glow.addColorStop(0, "rgba(230,211,164,0.5)");
  glow.addColorStop(0.35, "rgba(198,165,106,0.16)");
  glow.addColorStop(1, "rgba(198,165,106,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 512, 512);
  return canvasTexture(canvas);
}

function drawShadow() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const shadow = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
  shadow.addColorStop(0, "rgba(0,0,0,0.55)");
  shadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shadow;
  ctx.fillRect(0, 0, 256, 256);
  return canvasTexture(canvas);
}

function settleSpecimen(canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  const width = canvas.width;
  const height = canvas.height;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      if (data[index + 3] < 8) continue;
      let red = data[index] / 255;
      let green = data[index + 1] / 255;
      let blue = data[index + 2] / 255;
      const gray = (red + green + blue) / 3;
      const tint = 0.96;
      red = gray + (red - gray) * tint;
      green = gray + (green - gray) * tint;
      blue = gray + (blue - gray) * tint;
      const light = red * 0.2126 + green * 0.7152 + blue * 0.0722;
      if (light > 0.62) {
        const target = 0.62 + (light - 0.62) * 0.35;
        const gain = target / Math.max(light, 0.001);
        red *= gain;
        green *= gain;
        blue *= gain;
      }
      const falloff = 0.78 + 0.16 * (1 - y / height);
      data[index] = Math.min(255, Math.round(red * falloff * 255));
      data[index + 1] = Math.min(255, Math.round(green * falloff * 255));
      data[index + 2] = Math.min(255, Math.round(blue * falloff * 255));
    }
  }
  ctx.putImageData(image, 0, 0);
}

function plantFigure(canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  const width = canvas.width;
  const height = canvas.height;
  let toneR = 0;
  let toneG = 0;
  let toneB = 0;
  let toneCount = 0;
  for (let y = 500; y < 780; y += 2) {
    for (let x = 95; x < 185; x += 2) {
      const index = (y * width + x) * 4;
      if (data[index + 3] < 200) continue;
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const max = Math.max(red, green, blue);
      const min = Math.min(red, green, blue);
      if (max === 0 || (max - min) / max > 0.45) continue;
      toneR += red;
      toneG += green;
      toneB += blue;
      toneCount += 1;
    }
  }
  toneR /= toneCount || 1;
  toneG /= toneCount || 1;
  toneB /= toneCount || 1;
  const toneLight = toneR * 0.3 + toneG * 0.5 + toneB * 0.2;
  const legLine = height * 0.6;
  for (let y = 0; y < height; y += 1) {
    const fade = y < legLine ? 0 : Math.min(1, (y - legLine) / 46);
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const alpha = data[index + 3];
      if (alpha < 8) {
        data[index + 3] = 0;
        continue;
      }
      if (fade === 0 || x < width * 0.24 || x > width * 0.76) continue;
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const max = Math.max(red, green, blue);
      const min = Math.min(red, green, blue);
      const sat = max === 0 ? 0 : (max - min) / max;
      if (sat > 0.48) continue;
      const light = Math.max(1, red * 0.3 + green * 0.5 + blue * 0.2);
      const lifted = 58 + (Math.min(light, 80) / 80) * 52;
      const mapped = light + (lifted - light) * fade;
      const scale = mapped / toneLight;
      const mix = 0.78 * fade;
      data[index] = Math.min(255, Math.round(red * (1 - mix) + toneR * scale * mix));
      data[index + 1] = Math.min(255, Math.round(green * (1 - mix) + toneG * scale * mix));
      data[index + 2] = Math.min(255, Math.round(blue * (1 - mix) + toneB * scale * mix));
    }
  }
  const calfLine = Math.floor(height * 0.7);
  for (let y = calfLine; y < height; y += 1) {
    const fade = Math.min(1, (y - calfLine) / 36);
    for (const [x0, x1] of [[170, 370], [370, 560]]) {
      let min = -1;
      let max = -1;
      for (let x = x0; x < x1; x += 1) {
        if (data[(y * width + x) * 4 + 3] > 18) {
          if (min < 0) min = x;
          max = x;
        }
      }
      const span = max - min;
      if (min < 0 || span < 28 || span > 160) continue;
      for (let x = min; x <= max; x += 1) {
        const index = (y * width + x) * 4;
        if (data[index + 3] > 36) continue;
        const round = Math.sin(((x - min) / span) * Math.PI);
        const light = (54 + round * 34) * fade;
        const scale = light / toneLight;
        data[index] = Math.min(255, Math.round(toneR * scale));
        data[index + 1] = Math.min(255, Math.round(toneG * scale));
        data[index + 2] = Math.min(255, Math.round(toneB * scale));
        data[index + 3] = Math.round((200 + round * 40) * fade);
      }
    }
  }
  const yLimit = Math.floor(height * 0.1);
  const hairX0 = Math.floor(width * 0.34);
  const hairX1 = Math.floor(width * 0.66);
  const tops = new Int16Array(width).fill(-1);
  for (let x = hairX0; x < hairX1; x += 1) {
    for (let y = Math.floor(height * 0.02); y < yLimit + 50; y += 1) {
      let solid = 0;
      for (let k = 0; k < 8; k += 1) {
        if (data[((y + k) * width + x) * 4 + 3] > 220) solid += 1;
      }
      if (solid >= 6) {
        tops[x] = y;
        break;
      }
    }
  }
  const hairline = new Int16Array(tops);
  for (let x = hairX0; x < hairX1; x += 1) {
    if (tops[x] < 0) continue;
    let sum = 0;
    let count = 0;
    for (let dx = -8; dx <= 8; dx += 1) {
      const xx = x + dx;
      if (xx < 0 || xx >= width || tops[xx] < 0) continue;
      sum += tops[xx];
      count += 1;
    }
    if (count) hairline[x] = Math.round(sum / count);
  }
  for (let x = hairX0; x < hairX1; x += 1) {
    const top = hairline[x];
    if (top < 0 || top > yLimit) continue;
    for (let y = Math.max(0, top - 55); y < top - 8; y += 1) {
      data[(y * width + x) * 4 + 3] = 0;
    }
    for (let y = top - 8; y < top + 34; y += 1) {
      if (y < 0 || y >= height) continue;
      const index = (y * width + x) * 4;
      const into = y - top;
      if (into > 26) {
        const light = data[index] * 0.3 + data[index + 1] * 0.5 + data[index + 2] * 0.2;
        if (data[index + 3] > 180 && light > 130) continue;
      }
      data[index] = 12;
      data[index + 1] = 11;
      data[index + 2] = 12;
      data[index + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
}

function specimenMaterial(texture) {
  return new THREE.MeshStandardMaterial({
    map: texture,
    emissive: 0xfff4ea,
    emissiveMap: texture,
    emissiveIntensity: 0.035,
    roughness: 0.66,
    metalness: 0.02,
    transparent: true,
    alphaTest: 0.08,
    depthWrite: true,
  });
}

function curvedPlane(width, height, bend = 0.035) {
  const geometry = new THREE.PlaneGeometry(width, height, 12, 16);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i) / (width / 2);
    const y = position.getY(i) / (height / 2);
    position.setZ(i, (1 - y * y) * bend + (1 - x * x) * bend * 0.45);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function glassShell(strength) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { strength: { value: strength } },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vNormal = normalize(mat3(modelMatrix) * normal);
        vView = normalize(cameraPosition - world.xyz);
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform float strength;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.1);
        gl_FragColor = vec4(0.96, 0.91, 0.78, fresnel * strength);
      }
    `,
  });
}

function makeStation(figure, texture, spot, shadowMap) {
  const group = new THREE.Group();
  group.position.set(spot.x, 0, spot.z);
  group.rotation.y = 0;

  const black = new THREE.MeshPhysicalMaterial({
    color: 0x101218,
    metalness: 0.22,
    roughness: 0.38,
    clearcoat: 0.65,
    clearcoatRoughness: 0.28,
  });
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.42, 0.08, 64), black);
  foot.position.y = 0.04;
  foot.castShadow = true;
  foot.receiveShadow = true;
  group.add(foot);
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.56, 64), black);
  plinth.position.y = 0.36;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.32, 0.012, 20, 96),
    new THREE.MeshPhysicalMaterial({
      color: 0xd7bc86,
      metalness: 1,
      roughness: 0.18,
      clearcoat: 0.4,
      emissive: 0x3a2c14,
      emissiveIntensity: 0.25,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.65;
  group.add(ring);

  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.7, 64, 1, true), glassShell(0.1));
  glass.position.set(0, 1.02, 0);
  glass.raycast = () => {};
  group.add(glass);

  const organHeight = 0.68;
  const organWidth = organHeight * (texture.userData.aspect || 0.85);
  const organ = new THREE.Mesh(curvedPlane(organWidth, organHeight, 0.028), specimenMaterial(texture));
  organ.position.set(0, 0.68 + organHeight / 2, 0.02);
  organ.castShadow = true;
  group.add(organ);

  const boardX = organWidth / 2 + 0.4;
  const boardHeight = 0.64;
  const boardY = boardHeight / 2 + 0.008;
  const backing = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, boardHeight + 0.02, 0.04),
    new THREE.MeshPhysicalMaterial({ color: 0x12141a, metalness: 0.3, roughness: 0.42, clearcoat: 0.25 }),
  );
  backing.position.set(boardX, boardY, 0.72);
  group.add(backing);

  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, boardHeight),
    new THREE.MeshBasicMaterial({ map: drawBoard(figure), transparent: true, depthWrite: true }),
  );
  board.position.set(boardX, boardY, 0.78);
  group.add(board);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.46, 32),
    new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  shadow.raycast = () => {};
  group.add(shadow);

  group.traverse((child) => {
    if (child.isMesh) child.userData.station = figure.id;
  });
  glass.userData.station = null;
  shadow.userData.station = null;
  organ.userData.baseY = organ.position.y;
  return { group, ring, organ, glass };
}

export function mountMuseum(canvas, { figures, onPick }) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x07080c, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
  camera.position.set(0, 2.05, CAM_Z);
  camera.lookAt(0, 0.58, 0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.46;

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(12, 96),
    new THREE.MeshPhysicalMaterial({
      map: galleryFloor(),
      color: 0xd9cbb8,
      metalness: 0.16,
      roughness: 0.62,
      clearcoat: 0.28,
      clearcoatRoughness: 0.4,
      envMapIntensity: 0.32,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const inlay = new THREE.Mesh(
    new THREE.TorusGeometry(6.15, 0.012, 8, 160),
    new THREE.MeshPhysicalMaterial({ color: 0xd4bc8a, metalness: 1, roughness: 0.22 }),
  );
  inlay.rotation.x = Math.PI / 2;
  inlay.position.y = 0.012;
  scene.add(inlay);

  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(13, 13, 8.2, 80, 1, true, Math.PI * 0.35, Math.PI * 1.3),
    new THREE.MeshStandardMaterial({ map: roomWall(), color: 0xffffff, roughness: 0.92, metalness: 0.04, side: THREE.BackSide }),
  );
  wall.position.y = 3.1;
  wall.receiveShadow = true;
  scene.add(wall);

  const key = new THREE.DirectionalLight(0xfff1dc, 2.15);
  key.position.set(3.8, 6.4, 5.2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 22;
  key.shadow.camera.left = -7;
  key.shadow.camera.right = 7;
  key.shadow.camera.top = 7;
  key.shadow.camera.bottom = -7;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  scene.add(new THREE.HemisphereLight(0xe6d3a4, 0x16130f, 0.22));
  const fill = new THREE.DirectionalLight(0xcfc8bc, 0.38);
  fill.position.set(-4.8, 3.8, 3.4);
  scene.add(fill);
  const lamp = new THREE.PointLight(0xe6d3a4, 0.55, 3.2, 2);
  lamp.position.set(0.2, 1.7, 1.4);
  scene.add(lamp);

  const stone = new THREE.MeshPhysicalMaterial({
    color: 0x101218,
    metalness: 0.18,
    roughness: 0.32,
    clearcoat: 0.72,
    clearcoatRoughness: 0.2,
  });
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.9, 0.26, 72), stone);
  pedestal.position.y = 0.13;
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  scene.add(pedestal);
  const footRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.88, 0.012, 16, 96),
    new THREE.MeshPhysicalMaterial({ color: 0xd4bc8a, metalness: 1, roughness: 0.16 }),
  );
  footRing.rotation.x = Math.PI / 2;
  footRing.position.y = 0.27;
  scene.add(footRing);

  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 2.08, 96, 1, true), glassShell(0.28));
  tube.position.set(0, 1.34, 0);
  tube.rotation.y = Math.PI;
  tube.renderOrder = 3;
  tube.raycast = () => {};
  scene.add(tube);

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.76, 0.012, 16, 96),
    new THREE.MeshBasicMaterial({ color: 0xefe8dc }),
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.set(0, 0.32, 0);
  scene.add(halo);
  const haloSoft = new THREE.Mesh(
    new THREE.TorusGeometry(0.9, 0.04, 12, 80),
    new THREE.MeshBasicMaterial({ color: 0xc6a56a, transparent: true, opacity: 0.34, depthWrite: false }),
  );
  haloSoft.rotation.x = Math.PI / 2;
  haloSoft.position.set(0, 0.31, 0);
  scene.add(haloSoft);
  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(0.69, 0.008, 12, 80),
    new THREE.MeshBasicMaterial({ color: 0xe6d3a4 }),
  );
  lip.rotation.x = Math.PI / 2;
  lip.position.set(0, 2.38, 0);
  scene.add(lip);

  const bodyHeight = 1.98;
  const bodyBase = 0.36;
  const bodyWidth = bodyHeight * (720 / 1280);
  const figure = new THREE.Group();
  const body = new THREE.Mesh(
    curvedPlane(bodyWidth, bodyHeight, 0.012),
    new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      alphaTest: 0,
    }),
  );
  body.position.z = 0.02;
  body.renderOrder = 2;
  figure.add(body);
  figure.position.set(0, bodyBase + bodyHeight / 2, 0);
  scene.add(figure);

  const stations = [];
  const rings = [];
  const organs = [];
  const cases = [];
  const textures = [];
  const shadowMap = drawShadow();
  textures.push(shadowMap);
  let frame = 0;
  let alive = true;
  let aimX = 0;
  let aimY = 0;

  const base = import.meta.env.BASE_URL;
  Promise.all([
    document.fonts.ready,
    loadImage(`${base}img/anatomy-body.png`),
    ...figures.map((figure) => loadImage(`${base}img/figures/${figure.file}`)),
  ]).then((loaded) => {
    if (!alive) return;
    const [, bodyImage, ...organImages] = loaded;
    const bodyMap = knockOut(bodyImage);
    plantFigure(bodyMap.image);
    bodyMap.needsUpdate = true;
    textures.push(bodyMap);
    body.material.map = bodyMap;
    body.material.needsUpdate = true;
    figures.forEach((figure, index) => {
      const map = trimMap(organImages[index]);
      textures.push(map);
      const spot = [...BACK, ...FRONT].find((item) => item.id === figure.id);
      const station = makeStation(figure, map, spot, shadowMap);
      scene.add(station.group);
      stations.push(station.group);
      rings.push(station.ring);
      organs.push(station.organ);
      cases.push(station.glass);
    });
  }).catch((error) => {
    console.error(error);
  });

  const pointer = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();

  function resize() {
    const width = canvas.clientWidth || canvas.parentElement?.clientWidth || 1;
    const height = canvas.clientHeight || canvas.parentElement?.clientHeight || 1;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  }

  function stationAt(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(stations, true);
    return hits.find((hit) => hit.object.userData.station)?.object.userData.station ?? null;
  }

  function onMove(event) {
    const rect = canvas.getBoundingClientRect();
    aimX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.42;
    aimY = (0.5 - (event.clientY - rect.top) / rect.height) * 0.1;
    canvas.style.cursor = stationAt(event) ? "pointer" : "default";
  }

  function onClick(event) {
    const id = stationAt(event);
    if (id) onPick(id);
  }

  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("click", onClick);
  const observer = new ResizeObserver(resize);
  observer.observe(canvas.parentElement || canvas);
  resize();

  const clock = new THREE.Clock();
  function animate() {
    if (!alive) return;
    frame = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    const sway = reduce ? 0 : Math.sin(t * 0.18) * 0.28;
    const bob = reduce ? 0 : Math.sin(t * 0.22) * 0.03;
    const look = reduce ? 0 : aimX * 0.45;
    camera.position.x += (sway + look - camera.position.x) * 0.045;
    camera.position.z += (CAM_Z - camera.position.z) * 0.045;
    camera.position.y += (2.05 + bob + (reduce ? 0 : aimY) * 0.45 - camera.position.y) * 0.045;
    camera.lookAt(camera.position.x * 0.08, 0.58, 0);

    const pulse = 0.5 + 0.5 * Math.sin(t * 1.6);
    const beat = Math.pow(0.5 + 0.5 * Math.sin(t * 3.1), 2);
    figure.scale.setScalar(1);
    figure.rotation.y = 0;
    figure.position.y = bodyBase + bodyHeight / 2;
    lamp.intensity = 0.4 + beat * 0.25;
    lamp.position.x = reduce ? 0 : Math.sin(t * 0.9) * 0.34;
    lamp.position.z = reduce ? 0.12 : Math.cos(t * 0.9) * 0.34;
    halo.rotation.z = reduce ? 0 : t * 0.7;
    halo.scale.setScalar(1 + beat * (reduce ? 0 : 0.12));
    lip.rotation.z = reduce ? 0 : -t * 0.4;
    footRing.rotation.z = reduce ? 0 : t * 0.25;
    haloSoft.material.opacity = 0.12 + pulse * 0.45;
    haloSoft.scale.setScalar(1 + pulse * (reduce ? 0 : 0.08));
    organs.forEach((organ, index) => {
      const phase = t * 1.15 + index * 0.8;
      organ.position.y = organ.userData.baseY + (reduce ? 0 : Math.sin(phase) * 0.06);
      organ.rotation.y = reduce ? 0 : Math.sin(t * 0.55 + index * 1.1) * 0.48;
      const scale = 1 + (reduce ? 0 : Math.sin(phase * 1.6) * 0.045);
      organ.scale.setScalar(scale);
      organ.material.emissiveIntensity = 0.02 + (reduce ? 0 : (0.5 + 0.5 * Math.sin(phase * 2)) * 0.1);
    });
    cases.forEach((glass, index) => {
      if (!reduce) glass.rotation.y = t * 0.35 + index;
      glass.material.uniforms.strength.value = 0.06 + (reduce ? 0 : (0.5 + 0.5 * Math.sin(t * 1.8 + index)) * 0.14);
    });
    rings.forEach((ring, index) => {
      if (!reduce) ring.rotation.z = t * (0.55 + index * 0.04);
      ring.material.emissiveIntensity = 0.15 + Math.sin(t * 2.2 + index) * (reduce ? 0 : 0.4);
    });
    renderer.render(scene, camera);
  }
  animate();

  return () => {
    alive = false;
    cancelAnimationFrame(frame);
    canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("click", onClick);
    observer.disconnect();
    textures.forEach((texture) => texture.dispose());
    scene.traverse((child) => {
      if (!child.isMesh && !child.isPoints) return;
      child.geometry?.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        if (material.map && !textures.includes(material.map)) material.map.dispose();
        material.dispose();
      });
    });
    pmrem.dispose();
    renderer.dispose();
  };
}
