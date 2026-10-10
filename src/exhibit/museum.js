import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const CAM_Z = 10.6;

const ORDER = ["brain", "lungs", "heart", "skin", "liver", "kidneys", "digestive", "skeleton"];

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
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  });
  if (line) lines.push(line);
  const shown = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    let last = shown[maxLines - 1];
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    shown[maxLines - 1] = `${last}…`;
  }
  shown.forEach((row) => {
    ctx.fillText(row, x, y);
    y += lineHeight;
  });
  return y;
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
  const pad = 64;
  const inner = canvas.width - pad * 2;
  const wash = ctx.createLinearGradient(0, 0, 0, canvas.height);
  wash.addColorStop(0, "#1a1d24");
  wash.addColorStop(0.2, "#12110e");
  wash.addColorStop(1, "#07080c");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const sheen = ctx.createLinearGradient(0, 0, 0, 280);
  sheen.addColorStop(0, "rgba(230,211,164,0.1)");
  sheen.addColorStop(1, "rgba(230,211,164,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, canvas.width, 280);

  const number = String(ORDER.indexOf(figure.id) + 1).padStart(2, "0");
  const markY = 96;
  ctx.fillStyle = "#c6a56a";
  ctx.font = "600 28px 'JetBrains Mono', monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(number, pad, markY);
  ctx.fillStyle = "#efe8dc";
  ctx.font = "600 54px 'Instrument Sans', sans-serif";
  ctx.fillText(figure.name, pad + 64, markY);
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#e4ddd0";
  ctx.font = "500 42px Fraunces, Georgia, serif";
  const afterTitle = wrap(ctx, figure.title, pad, 176, inner, 52, 2);

  ctx.strokeStyle = "rgba(159,216,234,0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, afterTitle + 10);
  ctx.lineTo(canvas.width - pad, afterTitle + 10);
  ctx.stroke();

  let y = afterTitle + 58;
  const blocks = [
    ["Biological inspiration", figure.inspiration],
    ["Principle", figure.principle],
    ["Oman solution", figure.oman],
  ];
  blocks.forEach(([label, text]) => {
    ctx.fillStyle = "#c6a56a";
    ctx.font = "600 24px 'JetBrains Mono', monospace";
    ctx.fillText(label.toUpperCase(), pad, y);
    ctx.fillStyle = "#d9d2c6";
    ctx.font = "400 36px 'Instrument Sans', sans-serif";
    y = wrap(ctx, text, pad, y + 48, inner, 46, 3) + 22;
  });

  const barY = 1168;
  const strip = ctx.createLinearGradient(pad, 0, pad + inner, 0);
  strip.addColorStop(0, "#6a5438");
  strip.addColorStop(0.55, "#c6a56a");
  strip.addColorStop(1, "#e6d3a4");
  ctx.fillStyle = strip;
  roundRect(ctx, pad, barY, inner, 64, 12);
  ctx.fill();
  ctx.fillStyle = "#1a140c";
  ctx.font = "600 26px 'JetBrains Mono', monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("SELECT", pad + 28, barY + 32);
  ctx.textAlign = "right";
  ctx.fillText(number, pad + inner - 28, barY + 32);
  ctx.textAlign = "left";

  const texture = canvasTexture(canvas);
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
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
  ctx.strokeStyle = "rgba(198, 165, 106, 0.45)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(512, 512, 268, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(198, 165, 106, 0.16)";
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
  ctx.fillStyle = "rgba(198, 165, 106, 0.35)";
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

function glassShell(strength, tint = [0.96, 0.91, 0.78], veil = 0) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      strength: { value: strength },
      tint: { value: new THREE.Vector3(tint[0], tint[1], tint[2]) },
      veil: { value: veil },
      sweepY: { value: -20 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);
        vView = normalize(cameraPosition - world.xyz);
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform float strength;
      uniform vec3 tint;
      uniform float veil;
      uniform float sweepY;
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vWorld;
      void main() {
        float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.35);
        float band = exp(-pow((vWorld.y - sweepY) * 10.0, 2.0));
        float rim = fresnel * strength + veil;
        gl_FragColor = vec4(mix(tint, vec3(0.94, 0.88, 0.74), band * 0.45), rim + band * fresnel * 0.35);
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

  const organHeight = 0.68;
  const organWidth = organHeight * (texture.userData.aspect || 0.85);
  const shellRadius = Math.min(0.5, Math.max(0.4, organWidth * 0.58 + 0.08));
  const shellBase = 0.64;
  const shellHeight = organHeight + 0.36;

  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(shellRadius, shellRadius, shellHeight, 64, 1, true),
    glassShell(0.38, [0.94, 0.88, 0.74], 0.006),
  );
  glass.position.set(0, shellBase + shellHeight / 2, 0);
  glass.renderOrder = 3;
  glass.raycast = () => {};
  group.add(glass);

  const stationLamp = new THREE.PointLight(0xe6d3a4, 0.28, 1.6, 2);
  stationLamp.position.set(0, shellBase + 0.12, 0.22);
  group.add(stationLamp);

  const organ = new THREE.Mesh(curvedPlane(organWidth, organHeight, 0.028), specimenMaterial(texture));
  organ.position.set(0, 0.68 + organHeight / 2, 0.02);
  organ.castShadow = true;
  group.add(organ);

  const boardHeight = 0.72;
  const boardWidth = boardHeight * (1024 / 1280);
  const boardX = Math.max(shellRadius, organWidth / 2) + boardWidth / 2 + 0.06;
  const placard = new THREE.Group();
  placard.position.set(boardX, 0.02, 0.42);
  const backing = new THREE.Mesh(
    new THREE.BoxGeometry(boardWidth + 0.03, boardHeight + 0.03, 0.03),
    new THREE.MeshPhysicalMaterial({ color: 0x10161a, metalness: 0.2, roughness: 0.45, clearcoat: 0.3 }),
  );
  backing.position.set(0, boardHeight / 2, -0.02);
  placard.add(backing);

  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(boardWidth, boardHeight),
    new THREE.MeshBasicMaterial({ map: drawBoard(figure), toneMapped: false }),
  );
  board.position.set(0, boardHeight / 2, 0.01);
  placard.add(board);
  group.add(placard);
  group.updateMatrixWorld(true);
  placard.lookAt(0, 1.45, CAM_Z);

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
  return { group, organ, glass };
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
  let frameZ = CAM_Z;
  let frameY = 2.05;
  let lookY = 0.58;
  let portrait = false;

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.46;

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(12, 96),
    new THREE.MeshPhysicalMaterial({
      map: galleryFloor(),
      color: 0xd4c8b6,
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
    new THREE.MeshBasicMaterial({ color: 0xc6a56a }),
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
  const lamp = new THREE.PointLight(0xe6d3a4, 0.55, 2.6, 2);
  lamp.position.set(0, 0.42, 0.55);
  scene.add(lamp);

  const stone = new THREE.MeshPhysicalMaterial({
    color: 0x101218,
    metalness: 0.18,
    roughness: 0.32,
    clearcoat: 0.72,
    clearcoatRoughness: 0.2,
  });
  const columnRadius = 0.66;
  const columnBase = 0.24;
  const columnHeight = 2.22;
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.94, 0.16, 72), stone);
  pedestal.position.y = 0.1;
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  scene.add(pedestal);

  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(columnRadius, columnRadius, columnHeight, 96, 1, true),
    glassShell(0.42, [0.94, 0.88, 0.74], 0.005),
  );
  tube.position.set(0, columnBase + columnHeight / 2, 0);
  tube.renderOrder = 4;
  tube.raycast = () => {};
  scene.add(tube);

  const moteCount = 22;
  const motePositions = new Float32Array(moteCount * 3);
  const motes = Array.from({ length: moteCount }, (_, index) => {
    const mote = {
      angle: Math.random() * Math.PI * 2,
      radius: 0.08 + Math.random() * (columnRadius * 0.62),
      height: Math.random(),
      speed: 0.045 + Math.random() * 0.07,
    };
    motePositions[index * 3] = Math.cos(mote.angle) * mote.radius;
    motePositions[index * 3 + 1] = columnBase + mote.height * columnHeight;
    motePositions[index * 3 + 2] = Math.sin(mote.angle) * mote.radius;
    return mote;
  });
  const moteGeometry = new THREE.BufferGeometry();
  moteGeometry.setAttribute("position", new THREE.BufferAttribute(motePositions, 3));
  const moteField = new THREE.Points(
    moteGeometry,
    new THREE.PointsMaterial({
      color: 0xe6d3a4,
      size: 0.014,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  moteField.renderOrder = 5;
  scene.add(moteField);

  const bodyHeight = 2.08;
  const bodyBase = 0.32;
  const bodyWidth = bodyHeight * (720 / 1280);
  const figure = new THREE.Group();
  const body = new THREE.Mesh(
    curvedPlane(bodyWidth, bodyHeight, 0.012),
    new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      alphaTest: 0,
      side: THREE.DoubleSide,
    }),
  );
  body.position.z = 0.02;
  body.renderOrder = 2;
  figure.add(body);
  figure.position.set(0, bodyBase + bodyHeight / 2, 0);
  scene.add(figure);

  const stations = [];
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
    loadImage(`${base}img/museum-body.png`),
    ...figures.map((figure) => loadImage(`${base}img/figures/${figure.file}`)),
  ]).then((loaded) => {
    if (!alive) return;
    const [, bodyImage, ...organImages] = loaded;
    const bodyMap = knockOut(bodyImage);
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
    const nextPortrait = width < 760 && height > width;
    if (nextPortrait !== portrait) {
      portrait = nextPortrait;
      frameZ = portrait ? 16.4 : CAM_Z;
      frameY = portrait ? 2.55 : 2.05;
      lookY = portrait ? 0.72 : 0.58;
      camera.fov = portrait ? 58 : 36;
      camera.position.z = frameZ;
      camera.position.y = frameY;
    }
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
    const sway = reduce ? 0 : Math.sin(t * 0.18) * 0.42;
    const bob = reduce ? 0 : Math.sin(t * 0.22) * 0.03;
    const look = reduce ? 0 : aimX * 0.45;
    camera.position.x += (sway + look - camera.position.x) * 0.045;
    camera.position.z += (frameZ - camera.position.z) * 0.045;
    camera.position.y += (frameY + bob + (reduce ? 0 : aimY) * 0.45 - camera.position.y) * 0.045;
    camera.lookAt(camera.position.x * 0.08, lookY, 0);

    const beat = Math.pow(0.5 + 0.5 * Math.sin(t * 3.1), 2);
    const sweep = reduce ? 0.58 : (t * 0.16) % 1;
    figure.scale.setScalar(1);
    figure.rotation.y = reduce ? 0 : Math.sin(t * 0.28) * 0.1;
    figure.position.y = bodyBase + bodyHeight / 2;
    const sweepY = columnBase + 0.08 + sweep * (columnHeight - 0.16);
    tube.material.uniforms.sweepY.value = sweepY;
    lamp.intensity = 0.4 + beat * 0.15;
    lamp.position.x = reduce ? 0 : Math.sin(t * 0.7) * 0.18;
    lamp.position.z = reduce ? 0.4 : 0.45 + Math.cos(t * 0.7) * 0.12;
    if (!reduce) {
      const positions = moteGeometry.attributes.position;
      motes.forEach((mote, index) => {
        mote.height = (mote.height + mote.speed * 0.016) % 1;
        mote.angle += 0.004;
        positions.setXYZ(
          index,
          Math.cos(mote.angle) * mote.radius,
          columnBase + 0.08 + mote.height * (columnHeight - 0.16),
          Math.sin(mote.angle) * mote.radius,
        );
      });
      positions.needsUpdate = true;
    }
    organs.forEach((organ, index) => {
      const phase = t * 1.15 + index * 0.8;
      organ.position.y = organ.userData.baseY + (reduce ? 0 : Math.sin(phase) * 0.1);
      organ.rotation.y = reduce ? 0 : Math.sin(t * 0.55 + index * 1.1) * 0.7;
      const scale = 1 + (reduce ? 0 : Math.sin(phase * 1.6) * 0.07);
      organ.scale.setScalar(scale);
      organ.material.emissiveIntensity = 0.02 + (reduce ? 0 : (0.5 + 0.5 * Math.sin(phase * 2)) * 0.1);
    });
    cases.forEach((glass, index) => {
      glass.material.uniforms.strength.value = 0.34 + (reduce ? 0 : Math.sin(t * 1.5 + index) * 0.05);
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
