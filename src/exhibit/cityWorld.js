import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const BASE_W = 16.8;
const BASE_D = 11.2;

export function mountCity(host, { getState, onSelect }) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0xf7f6f4, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";
  renderer.domElement.style.touchAction = "none";
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 120);
  camera.position.set(4.6, 9.2, 12.4);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.15, -0.15);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 1.45;
  controls.maxDistance = 16;
  controls.minPolarAngle = 0.18;
  controls.maxPolarAngle = 1.38;
  controls.update();

  const hemi = new THREE.HemisphereLight(0xfff8f2, 0xf7f1e8, 0.58);
  scene.add(hemi);
  const sunAim = new THREE.Vector3(1.4, 7.4, -8.6);
  const sun = new THREE.DirectionalLight(0xfff6ea, 1.2);
  sun.position.copy(sunAim);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -14;
  sun.shadow.camera.right = 14;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -12;
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 48;
  sun.shadow.bias = -0.00025;
  sun.shadow.radius = 1.6;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xfffaf6, 0.18);
  fill.position.set(8, 5, 4);
  scene.add(fill);
  const front = new THREE.DirectionalLight(0xfff7ee, 0.48);
  front.position.set(2, 10, 18);
  scene.add(front);

  const textures = [];
  const skyMap = makeSky();
  textures.push(skyMap);
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(70, 32, 20),
    new THREE.MeshBasicMaterial({ map: skyMap, side: THREE.BackSide, depthWrite: false }),
  );
  scene.background = skyMap;
  sky.visible = false;
  scene.add(sky);
  const sunGlowMap = makeSunGlow();
  textures.push(sunGlowMap);
  const sunDisc = new THREE.Mesh(
    new THREE.SphereGeometry(1.7, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0xfff6c8 }),
  );
  sunDisc.position.copy(sunAim);
  sunDisc.raycast = () => {};
  scene.add(sunDisc);
  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: sunGlowMap,
    transparent: true,
    depthWrite: false,
    opacity: 0.95,
  }));
  sunGlow.position.copy(sunAim);
  sunGlow.scale.set(8.5, 8.5, 1);
  sunGlow.raycast = () => {};
  scene.add(sunGlow);
  const plaster = makePlaster();
  const asphaltMap = makeAsphalt();
  const solarMap = makeSolar();
  textures.push(plaster, asphaltMap, solarMap);

  const wallCache = new Map();
  const facadeCache = new Map();
  const facadeMats = [];
  const facadeMaterial = (color, repeatX, repeatY) => {
    const key = color >>> 0;
    if (!facadeCache.has(key)) facadeCache.set(key, paintFacade(`#${key.toString(16).padStart(6, "0")}`));
    const base = facadeCache.get(key);
    const map = base.map.clone();
    const emissiveMap = base.emissive.clone();
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    emissiveMap.wrapS = THREE.RepeatWrapping;
    emissiveMap.wrapT = THREE.RepeatWrapping;
    map.repeat.set(repeatX, repeatY);
    emissiveMap.repeat.set(repeatX, repeatY);
    map.colorSpace = THREE.SRGBColorSpace;
    emissiveMap.colorSpace = THREE.SRGBColorSpace;
    textures.push(map, emissiveMap);
    const material = new THREE.MeshStandardMaterial({
      map,
      emissiveMap,
      emissive: 0xffe7b8,
      emissiveIntensity: 0.62,
      roughness: 0.78,
      metalness: 0.02,
    });
    facadeMats.push(material);
    return material;
  };
  const wallMat = (color) => {
    const key = color >>> 0;
    if (!wallCache.has(key)) {
      wallCache.set(key, new THREE.MeshStandardMaterial({
        color,
        map: plaster,
        roughness: 0.7,
        metalness: 0.0,
        emissive: 0xfffaf6,
        emissiveIntensity: 0.04,
      }));
    }
    return wallCache.get(key);
  };
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x101010, roughness: 0.7 });
  const groundMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: makeGround(textures), roughness: 0.92 });
  const asphalt = new THREE.MeshStandardMaterial({ color: 0xffffff, map: asphaltMap, roughness: 0.94 });
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xf3f1ec });
  const cyanMat = new THREE.MeshBasicMaterial({ color: 0x9ec8d6 });
  const magentaMat = new THREE.MeshBasicMaterial({ color: 0xe4b7c6 });
  const waterTex = makeWater();
  textures.push(waterTex);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0xb7e4ef,
    map: waterTex,
    emissive: 0x5eb4cc,
    emissiveMap: waterTex,
    emissiveIntensity: 0.22,
    roughness: 0.04,
    metalness: 0.12,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
  });
  const poolFloorMat = new THREE.MeshStandardMaterial({ color: 0x1f6f86, roughness: 0.82 });
  const towerWaterMat = new THREE.MeshStandardMaterial({
    color: 0x8fd0e2,
    map: waterTex,
    emissive: 0x4ea8c4,
    emissiveMap: waterTex,
    emissiveIntensity: 0.2,
    roughness: 0.12,
    transparent: true,
    opacity: 0.9,
  });
  const flowCoreMat = new THREE.MeshStandardMaterial({
    color: 0x5ebbd4,
    emissive: 0x2f9dba,
    emissiveIntensity: 0.35,
    transparent: true,
    opacity: 0.88,
    roughness: 0.16,
  });
  const pipeGlass = new THREE.MeshPhysicalMaterial({
    color: 0xf3fbff,
    transparent: true,
    opacity: 0.38,
    roughness: 0.05,
    metalness: 0.04,
    depthWrite: false,
  });
  const sprayMat = new THREE.MeshBasicMaterial({ color: 0xe7f7ff });
  const wetMat = new THREE.MeshStandardMaterial({
    color: 0x2a6d68,
    transparent: true,
    opacity: 0.42,
    roughness: 0.35,
    depthWrite: false,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xd8f6ff,
    transparent: true,
    opacity: 0.28,
    roughness: 0.05,
    metalness: 0.04,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const pipeMat = new THREE.MeshStandardMaterial({
    color: 0xd5e7ef,
    emissive: 0x8ec8dc,
    emissiveIntensity: 0.18,
    roughness: 0.2,
    metalness: 0.62,
  });
  const fittingMat = new THREE.MeshStandardMaterial({
    color: 0xd8dee3,
    metalness: 0.82,
    roughness: 0.22,
  });
  const solarMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: solarMap,
    emissive: 0x163a66,
    emissiveMap: solarMap,
    emissiveIntensity: 0.08,
    roughness: 0.34,
    metalness: 0.22,
  });
  const solarFrameMat = new THREE.MeshStandardMaterial({ color: 0xd5dde6, metalness: 0.78, roughness: 0.28 });
  const solarGlass = new THREE.MeshPhysicalMaterial({
    color: 0xeaf6ff,
    transparent: true,
    opacity: 0.07,
    roughness: 0.04,
    metalness: 0.08,
    depthWrite: false,
  });
  const whiteMat = wallMat(0xfffaf6);
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xb9b3a8, roughness: 0.32, metalness: 0.62 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2e2924, roughness: 0.55 });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffd08a });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x6d8c50, roughness: 0.6, side: THREE.DoubleSide });
  const leafDeep = new THREE.MeshStandardMaterial({ color: 0x4f6e3c, roughness: 0.65, side: THREE.DoubleSide });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8a6540, roughness: 0.86 });
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x5c3e2a, roughness: 0.95 });
  const gardenSoil = new THREE.MeshStandardMaterial({ color: 0xffffff, map: makeSoil(textures), roughness: 0.94 });
  const furrowMat = new THREE.MeshStandardMaterial({ color: 0x3e291c, roughness: 1 });
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x5c7340, roughness: 0.72 });
  const fruitMat = new THREE.MeshStandardMaterial({ color: 0xc4534a, roughness: 0.42 });
  const fruitGold = new THREE.MeshStandardMaterial({ color: 0xe2b15c, roughness: 0.48 });
  const cropMap = makeLeaf(textures);
  const cropLeaf = new THREE.MeshStandardMaterial({
    color: 0xffffff, map: cropMap, alphaTest: 0.35, roughness: 0.62, side: THREE.DoubleSide,
  });
  const cropDeep = new THREE.MeshStandardMaterial({
    color: 0x7f9a62, map: cropMap, alphaTest: 0.35, roughness: 0.68, side: THREE.DoubleSide,
  });
  const cropLight = new THREE.MeshStandardMaterial({
    color: 0xd7ecc0, map: cropMap, alphaTest: 0.35, roughness: 0.58, side: THREE.DoubleSide,
  });
  const cropGeos = {
    stem: new THREE.CylinderGeometry(0.007, 0.012, 0.1, 5),
    leaf: new THREE.PlaneGeometry(0.14, 0.06),
    blade: new THREE.PlaneGeometry(0.32, 0.016),
    fruit: new THREE.SphereGeometry(0.024, 8, 6),
    frond: new THREE.PlaneGeometry(0.26, 0.055),
    tip: new THREE.PlaneGeometry(0.18, 0.038),
  };
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffd08a });
  const lampGlowMat = new THREE.MeshBasicMaterial({
    color: 0xffd7a0,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pmrem = new THREE.PMREMGenerator(renderer);
  const roofEnv = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pipeMat.envMap = roofEnv;
  pipeMat.envMapIntensity = 0.7;
  waterMat.envMap = roofEnv;
  waterMat.envMapIntensity = 0.55;
  solarMat.envMap = roofEnv;
  solarMat.envMapIntensity = 0.4;
  solarFrameMat.envMap = roofEnv;
  solarFrameMat.envMapIntensity = 0.6;
  pmrem.dispose();
  const roofBrush = makeBrush();
  textures.push(roofBrush);
  const reflectRoofMat = new THREE.MeshStandardMaterial({
    color: 0xf7f8f6,
    map: roofBrush,
    metalness: 0.88,
    roughness: 0.18,
    envMap: roofEnv,
    envMapIntensity: 0.9,
    emissive: 0xe7eef0,
    emissiveIntensity: 0.12,
  });
  const louvreMat = new THREE.MeshStandardMaterial({
    color: 0xf6f1e8,
    roughness: 0.42,
    metalness: 0.06,
  });
  const civicGlass = new THREE.MeshStandardMaterial({
    color: 0x1a242c,
    emissive: 0xc9844a,
    emissiveIntensity: 0.2,
    roughness: 0.14,
    metalness: 0.4,
    transparent: true,
    opacity: 0.88,
  });

  const deckMap = groundMat.map.clone();
  deckMap.repeat.set(BASE_W / 5.6, BASE_D / 5.6);
  deckMap.wrapS = THREE.RepeatWrapping;
  deckMap.wrapT = THREE.RepeatWrapping;
  textures.push(deckMap);
  const deckMat = groundMat.clone();
  deckMat.map = deckMap;
  const plinthMat = new THREE.MeshStandardMaterial({ color: 0xf7f1e6, roughness: 0.94 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(BASE_W, 0.78, BASE_D), [
    plinthMat, plinthMat, deckMat, plinthMat, plinthMat, plinthMat,
  ]);
  base.position.y = -0.39;
  base.castShadow = true;
  base.receiveShadow = true;
  base.userData.id = "skeleton";
  scene.add(base);

  const labelTex = makeLabel();
  textures.push(labelTex);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(13.4, 0.38),
    new THREE.MeshBasicMaterial({ map: labelTex, transparent: true }),
  );
  label.position.set(0, -0.34, BASE_D / 2 + 0.012);
  label.userData.id = "skeleton";
  scene.add(label);

  const foothills = new THREE.Mesh(
    new THREE.CircleGeometry(70, 64),
    new THREE.MeshBasicMaterial({ color: 0xf4e7d2 }),
  );
  foothills.rotation.x = -Math.PI / 2;
  foothills.position.y = -0.7;
  foothills.raycast = () => {};
  scene.add(foothills);

  function ridge(color, z, scale, width) {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0);
    const peaks = [-0.46, -0.3, -0.14, 0.02, 0.16, 0.31, 0.46];
    const heights = [0.28, 0.55, 0.36, 0.82, 0.44, 0.7, 0.33];
    peaks.forEach((peak, index) => {
      shape.lineTo(peak * width, heights[index] * scale);
    });
    shape.lineTo(width / 2, 0);
    const mesh = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
    );
    mesh.position.set(0, -0.2, z);
    mesh.raycast = () => {};
    scene.add(mesh);
  }
  ridge(0xf6ead8, -8.5, 2.4, 46);
  ridge(0xe7d3b8, -12, 3.6, 58);
  ridge(0xd9c4a6, -16, 4.8, 70);

  const spots = {};
  const badges = {};
  const leds = {};
  const barriers = {};
  const fountains = [];
  const glints = [];
  const ripples = [];
  const wets = [];
  const towerBubbles = [];
  let towerSurface = null;
  let towerMeniscus = null;
  const pulses = [];
  const solarFaces = [];
  const solarCatches = [];
  const charges = [];
  const shafts = [];
  const fronds = [];
  const clouds = [];
  let shaftMat = null;
  const lids = [];
  const servos = [];
  const drips = [];
  const crops = [];
  const specks = [];
  const intakeFins = [];
  const ribbons = [];
  const bayLamps = [];
  const bayFills = [];
  const sortJobs = [];
  let scanBar = null;
  let beltScroll = null;
  let filterBead = null;
  let thermoMercury = null;
  let hubLampMat = null;
  let gantry = null;
  let parcel = null;
  let shadeCanopy = null;
  let pumpRotor = null;
  let scanner = null;

  function tag(object, id) {
    object.traverse((child) => {
      child.userData.id = id;
    });
  }

  function addRoad(x1, z1, x2, z2, width = 0.38) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.hypot(dx, dz) || 0.001;
    const ux = dx / len;
    const uz = dz / len;
    const px = -uz;
    const pz = ux;
    const yaw = Math.atan2(-dz, dx);
    const road = new THREE.Mesh(new THREE.BoxGeometry(len, 0.04, width), asphalt);
    road.position.set((x1 + x2) / 2, 0.03, (z1 + z2) / 2);
    road.rotation.y = yaw;
    road.receiveShadow = true;
    road.userData.id = "skeleton";
    scene.add(road);
    const edgeGeo = new THREE.BoxGeometry(len, 0.008, 0.02);
    for (const side of [-1, 1]) {
      const edge = new THREE.Mesh(edgeGeo, lineMat);
      edge.position.set(
        (x1 + x2) / 2 + px * side * (width / 2 - 0.028),
        0.052,
        (z1 + z2) / 2 + pz * side * (width / 2 - 0.028),
      );
      edge.rotation.y = yaw;
      scene.add(edge);
    }
    const dashGeo = new THREE.BoxGeometry(0.2, 0.008, 0.035);
    for (let t = 0.35; t < len - 0.2; t += 0.48) {
      const dash = new THREE.Mesh(dashGeo, lineMat);
      dash.position.set(x1 + ux * t, 0.054, z1 + uz * t);
      dash.rotation.y = yaw;
      scene.add(dash);
    }
  }

  function trace(x1, z1, x2, z2, color, side = 0) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.hypot(dx, dz) || 0.001;
    const px = -dz / len;
    const pz = dx / len;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(len, 0.018, 0.028), color === "cyan" ? cyanMat : magentaMat);
    mesh.position.set((x1 + x2) / 2 + px * side, 0.068, (z1 + z2) / 2 + pz * side);
    mesh.rotation.y = Math.atan2(-dz, dx);
    scene.add(mesh);
  }

  function energyPulse(x1, z1, x2, z2, color, side = 0) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.hypot(dx, dz) || 0.001;
    const px = -dz / len;
    const pz = dx / len;
    const yaw = Math.atan2(-dz, dx);
    for (let i = 0; i < 2; i += 1) {
      const bead = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.008, 0.018),
        new THREE.MeshBasicMaterial({ color }),
      );
      bead.rotation.y = yaw;
      bead.userData.t = i / 2;
      bead.userData.a = { x: x1 + px * side, z: z1 + pz * side };
      bead.userData.b = { x: x2 + px * side, z: z2 + pz * side };
      scene.add(bead);
      pulses.push(bead);
    }
  }

  function pool(x, z, w, d, id) {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.12, w - 0.05), 0.025, Math.max(0.12, d - 0.05)), poolFloorMat);
    floor.position.set(x, 0.02, z);
    floor.receiveShadow = true;
    if (id) floor.userData.id = id;
    scene.add(floor);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(0.1, w - 0.08), Math.max(0.1, d - 0.08)), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(x, 0.072, z);
    water.renderOrder = 2;
    if (id) water.userData.id = id;
    scene.add(water);
    for (let i = 0; i < 2; i += 1) {
      const glint = new THREE.Mesh(
        new THREE.PlaneGeometry(Math.max(0.16, w * 0.28), 0.012),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, depthWrite: false }),
      );
      glint.rotation.x = -Math.PI / 2;
      glint.position.set(x, 0.078, z);
      glint.userData.home = { x, z, w, drift: i === 0 ? 1 : -1 };
      glint.userData.t = Math.random();
      glint.renderOrder = 3;
      scene.add(glint);
      glints.push(glint);
    }
    const rimMat = wallMat(0xf4efe6);
    const t = 0.055;
    [
      [w + t * 2, t, x, z - d / 2 - t / 2],
      [w + t * 2, t, x, z + d / 2 + t / 2],
      [t, d, x - w / 2 - t / 2, z],
      [t, d, x + w / 2 + t / 2, z],
    ].forEach(([rw, rd, rx, rz]) => {
      const rim = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.07, rd), rimMat);
      rim.position.set(rx, 0.045, rz);
      rim.castShadow = true;
      if (id) rim.userData.id = id;
      scene.add(rim);
    });
    addRipple(x, z, Math.min(w, d) * 0.42);
    return { x, z, w, d };
  }

  function addRipple(x, z, reach) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.05, 0.065, 24),
      new THREE.MeshBasicMaterial({ color: 0xeaf8ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.08, z);
    ring.userData.t = Math.random();
    ring.userData.reach = reach;
    ring.renderOrder = 3;
    scene.add(ring);
    ripples.push(ring);
  }

  function starJet(x, z, reach = 0.32) {
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.038, 0.04, 8), metalMat);
    nozzle.position.set(x, 0.09, z);
    scene.add(nozzle);
    const beads = [];
    for (let i = 0; i < 6; i += 1) {
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), sprayMat);
      drop.userData.t = i / 6;
      drop.userData.angle = (i / 6) * Math.PI * 2;
      scene.add(drop);
      beads.push(drop);
    }
    fountains.push({ x, z, beads });
    addRipple(x, z, reach);
  }

  const pipeRadius = 0.026;
  const placedFittings = new Set();
  const pipeUp = new THREE.Vector3(0, 1, 0);

  const carriageways = [
    { axis: "z", at: -4.35, from: -7.4, to: 7.2 },
    { axis: "z", at: -1.55, from: -7.4, to: 7.2 },
    { axis: "z", at: 1.08, from: -7.4, to: 7.2 },
    { axis: "z", at: 2.72, from: -7.4, to: 7.2 },
    { axis: "z", at: 4.92, from: -7.4, to: 6.4 },
    { axis: "x", at: 2.05, from: 2.72, to: 4.92 },
    { axis: "x", at: -4.55, from: 2.72, to: 4.92 },
    { axis: "x", at: -6.05, from: -4.35, to: 4.55 },
    { axis: "x", at: -2.15, from: -4.35, to: 4.15 },
    { axis: "x", at: 2.35, from: -4.35, to: 4.45 },
    { axis: "x", at: 5.75, from: -4.35, to: 3.4 },
  ];

  function routeUnderRoads(points) {
    const half = 0.2;
    const bury = -0.08;
    const routed = [points[0].slice()];
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      const dx = b[0] - a[0];
      const dz = b[2] - a[2];
      const alongX = Math.abs(dx) >= Math.abs(dz);
      const span = Math.abs(alongX ? dx : dz) || 1;
      const hits = [];
      carriageways.forEach((road) => {
        if (alongX && road.axis === "x") {
          const z = (a[2] + b[2]) / 2;
          if (z < road.from || z > road.to) return;
          const lo = Math.min(a[0], b[0]);
          const hi = Math.max(a[0], b[0]);
          if (road.at > lo + half && road.at < hi - half) hits.push(road.at);
        }
        if (!alongX && road.axis === "z") {
          const x = (a[0] + b[0]) / 2;
          if (x < road.from || x > road.to) return;
          const lo = Math.min(a[2], b[2]);
          const hi = Math.max(a[2], b[2]);
          if (road.at > lo + half && road.at < hi - half) hits.push(road.at);
        }
      });
      const coordToT = (coord) => (alongX ? (coord - a[0]) / (dx || 1) : (coord - a[2]) / (dz || 1));
      hits.sort((p, q) => coordToT(p) - coordToT(q));
      const bands = [];
      hits.forEach((at) => {
        const last = bands[bands.length - 1];
        if (last && Math.abs(at - last.end) < 0.5) last.end = at;
        else bands.push({ start: at, end: at });
      });
      const pointAt = (t, y) => [a[0] + dx * t, y, a[2] + dz * t];
      const surfaceY = (t) => a[1] + (b[1] - a[1]) * t;
      bands.forEach((band) => {
        const pad = 0.26 / span;
        const ramp = 0.12 / span;
        let t0 = Math.min(coordToT(band.start), coordToT(band.end)) - pad;
        let t1 = Math.max(coordToT(band.start), coordToT(band.end)) + pad;
        t0 = Math.max(0.04, t0);
        t1 = Math.min(0.96, t1);
        if (t1 <= t0) return;
        routed.push(pointAt(Math.max(0.02, t0 - ramp), surfaceY(t0)));
        routed.push(pointAt(t0, bury));
        routed.push(pointAt(t1, bury));
        routed.push(pointAt(Math.min(0.98, t1 + ramp), surfaceY(t1)));
      });
      routed.push(b.slice());
    }
    return routed;
  }

  function layPipe(points, { supports = true } = {}) {
    const routed = routeUnderRoads(points);
    const pts = routed.map((point) => new THREE.Vector3(point[0], point[1], point[2]));
    for (let i = 0; i < pts.length - 1; i += 1) {
      const a = pts[i];
      const b = pts[i + 1];
      const delta = new THREE.Vector3().subVectors(b, a);
      const len = delta.length();
      if (len < 0.04) continue;
      const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
      const dir = delta.clone().normalize();
      const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(pipeRadius, pipeRadius, len, 12, 1, false),
        pipeGlass,
      );
      tube.position.copy(mid);
      tube.quaternion.setFromUnitVectors(pipeUp, dir);
      tube.renderOrder = 2;
      const core = new THREE.Mesh(
        new THREE.CylinderGeometry(pipeRadius * 0.52, pipeRadius * 0.52, Math.max(0.04, len - 0.02), 8),
        flowCoreMat,
      );
      core.position.copy(mid);
      core.quaternion.copy(tube.quaternion);
      scene.add(core, tube);
      if (!supports || len < 0.8 || Math.min(a.y, b.y) < 0.1) continue;
      const steps = Math.max(2, Math.round(len / 1.35));
      for (let step = 1; step < steps; step += 1) {
        const p = new THREE.Vector3().lerpVectors(a, b, step / steps);
        if (p.y < 0.12) continue;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, p.y, 8), fittingMat);
        post.position.set(p.x, p.y / 2, p.z);
        post.castShadow = true;
        const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.012, 0.055), fittingMat);
        shoe.position.set(p.x, 0.012, p.z);
        const clamp = new THREE.Mesh(new THREE.TorusGeometry(pipeRadius + 0.005, 0.005, 6, 16), fittingMat);
        clamp.position.copy(p);
        clamp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
        scene.add(post, shoe, clamp);
      }
    }
    points.forEach((point, index) => {
      const key = `${point[0].toFixed(2)},${point[1].toFixed(2)},${point[2].toFixed(2)}`;
      if (placedFittings.has(key)) return;
      placedFittings.add(key);
      const end = index === 0 || index === points.length - 1;
      const fitting = new THREE.Mesh(
        new THREE.SphereGeometry(end ? pipeRadius * 1.08 : pipeRadius * 1.32, 16, 12),
        fittingMat,
      );
      fitting.position.set(point[0], point[1], point[2]);
      fitting.castShadow = true;
      scene.add(fitting);
    });
    return routed;
  }

  function parapet(group, w, h, d, color) {
    const mat = wallMat(color);
    const y = h + 0.04;
    const front = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.07, 0.04), mat);
    front.position.set(0, y, d / 2);
    const back = front.clone();
    back.position.z = -d / 2;
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.07, d + 0.04), mat);
    side.position.set(w / 2, y, 0);
    const other = side.clone();
    other.position.x = -w / 2;
    group.add(front, back, side, other);
  }

  const movingRoofs = [];

  function louvreBank(span, depth) {
    const bank = new THREE.Group();
    const count = Math.max(5, Math.round(depth / 0.07));
    const pitch = depth / count;
    const bladeDepth = pitch * 0.82;
    const slats = [];
    [-1, 1].forEach((side) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.045, depth + 0.02), frameMat);
      rail.position.x = side * (span / 2);
      bank.add(rail);
    });
    const bladeGeo = new THREE.BoxGeometry(span - 0.05, 0.008, bladeDepth);
    const lipGeo = new THREE.BoxGeometry(span - 0.05, 0.016, 0.006).translate(0, 0.008, 0.012);
    const blades = new THREE.InstancedMesh(mergeGeometries([bladeGeo, lipGeo], false), louvreMat, count);
    bladeGeo.dispose();
    lipGeo.dispose();
    blades.castShadow = true;
    blades.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    bank.add(blades);
    for (let i = 0; i < count; i += 1) {
      const hinge = new THREE.Object3D();
      hinge.position.z = -depth / 2 + (i + 0.5) * (depth / count);
      [-1, 1].forEach((side) => {
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.028, 6), frameMat);
        pin.rotation.z = Math.PI / 2;
        pin.position.set(side * (span / 2 - 0.012), 0, hinge.position.z);
        bank.add(pin);
      });
      slats.push(hinge);
    }
    slats.sync = () => {
      slats.forEach((hinge, index) => {
        hinge.updateMatrix();
        blades.setMatrixAt(index, hinge.matrix);
      });
      blades.instanceMatrix.needsUpdate = true;
    };
    slats.sync();
    return { bank, slats };
  }

  function block({ x, z, w = 1, d = 1, h = 0.8, color = 0xf4efe6, id, faces = ["pz", "px", "nx"], roof }) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    const face = facadeMaterial(color, Math.max(1, Math.round(w / 0.7)), Math.max(1, Math.round(h / 0.55)));
    const plain = wallMat(color);
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [face, face, plain, plain, face, face]);
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    const cornice = wallMat(0xfffdf8);
    const eave = new THREE.Mesh(new THREE.BoxGeometry(w + 0.16, 0.055, d + 0.16), cornice);
    eave.position.y = h + 0.03;
    eave.castShadow = true;
    group.add(eave);
    const shadeLine = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.04, 0.018, d + 0.04),
      new THREE.MeshBasicMaterial({ color: 0xe4d9cc }),
    );
    shadeLine.position.y = h - 0.006;
    group.add(shadeLine);
    parapet(group, w, h, d, color);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.38, 0.03), frameMat);
    door.position.set(0, 0.19, d / 2 + 0.016);
    const doorLight = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.02), glowMat);
    doorLight.position.set(0, 0.28, d / 2 + 0.032);
    group.add(door, doorLight);
    const roofKind = roof ?? "reflect";
    if (roofKind === "reflect") {
      const span = Math.max(0.36, w - 0.06);
      const depth = Math.max(0.36, d - 0.06);
      const roof = louvreBank(span, depth);
      roof.bank.position.y = h + 0.1;
      group.add(roof.bank);
      movingRoofs.push({ kind: "reflect", slats: roof.slats, phase: x + z });
    }
    if (id) tag(group, id);
    scene.add(group);
    return group;
  }

  function makeCrop(kind) {
    const plant = new THREE.Group();
    const stem = new THREE.Mesh(cropGeos.stem, stemMat);
    stem.position.y = 0.05;
    plant.add(stem);
    const rings = kind === "stalk" ? [0.08, 0.13] : [0.045, 0.07];
    rings.forEach((height, ring) => {
      const count = kind === "stalk" ? 4 : 6;
      for (let i = 0; i < count; i += 1) {
        const pivot = new THREE.Group();
        pivot.rotation.y = (i / count) * Math.PI * 2 + ring * 0.4;
        pivot.rotation.x = kind === "stalk" ? -0.35 : -1.05 + ring * 0.15;
        const leaf = new THREE.Mesh(cropGeos.leaf, (i + ring) % 2 ? cropLeaf : cropDeep);
        leaf.position.set(0, height, 0.03);
        if (ring === 1) leaf.scale.setScalar(0.72);
        pivot.add(leaf);
        plant.add(pivot);
      }
    });
    if (kind === "fruit") {
      const fruit = new THREE.Mesh(cropGeos.fruit, fruitMat);
      fruit.position.set(0.02, 0.1, 0.015);
      plant.add(fruit);
    }
    return plant;
  }

  function placeCrop(parent, x, y, z, index) {
    const kind = index % 6 === 0 ? "fruit" : index % 2 ? "stalk" : "rosette";
    const plant = makeCrop(kind);
    plant.userData.gold = index % 12 === 0;
    if (kind === "fruit" && plant.userData.gold) {
      const fruit = plant.children.find((child) => child.geometry === cropGeos.fruit);
      if (fruit) fruit.material = fruitGold;
    }
    plant.position.set(x, y, z);
    plant.rotation.y = index * 0.7;
    parent.add(plant);
    crops.push(plant);
  }

  function palm(x, z, scale = 1) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.scale.setScalar(scale);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.042, 0.64, 7), trunkMat);
    trunk.position.y = 0.32;
    trunk.rotation.z = 0.08;
    trunk.castShadow = true;
    group.add(trunk);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), leafDeep);
    crown.position.y = 0.64;
    group.add(crown);
    for (let i = 0; i < 7; i += 1) {
      const pivot = new THREE.Group();
      pivot.position.y = 0.64;
      pivot.rotation.y = (i / 7) * Math.PI * 2;
      pivot.rotation.z = -0.95 - (i % 2) * 0.12;
      pivot.userData.rest = pivot.rotation.z;
      fronds.push(pivot);
      for (let k = -2; k <= 2; k += 1) {
        const blade = new THREE.Mesh(cropGeos.blade, k === 0 ? cropLight : cropLeaf);
        blade.position.x = 0.14;
        blade.rotation.y = k * 0.2;
        blade.rotation.z = -Math.abs(k) * 0.12;
        pivot.add(blade);
      }
      group.add(pivot);
    }
    scene.add(group);
  }

  function streetLamp(x, z) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.42, 6), metalMat);
    pole.position.set(x, 0.21, z);
    pole.castShadow = true;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), bulbMat);
    bulb.position.set(x, 0.44, z);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(0.22, 12), lampGlowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(x, 0.06, z);
    scene.add(pole, bulb, glow);
  }

  function badge(n, x, y, z, id) {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1c7a48";
    ctx.beginPath();
    ctx.arc(64, 64, 58, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#f4f7f2";
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 72px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(n), 64, 70);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    textures.push(map);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map }));
    sprite.position.set(x, y, z);
    sprite.scale.set(0.46, 0.46, 1);
    sprite.userData.id = id;
    scene.add(sprite);
    badges[id] = sprite;
  }

  function crossing(x, z, alongX) {
    for (let i = -1; i <= 1; i += 1) {
      const mark = new THREE.Mesh(
        new THREE.BoxGeometry(alongX ? 0.46 : 0.1, 0.008, alongX ? 0.1 : 0.46),
        lineMat,
      );
      mark.position.set(x + (alongX ? 0 : i * 0.16), 0.06, z + (alongX ? i * 0.16 : 0));
      scene.add(mark);
    }
  }

  addRoad(-7.4, -4.35, 7.2, -4.35);
  addRoad(-7.4, -1.55, 7.2, -1.55);
  addRoad(-7.4, 1.08, 7.2, 1.08);
  addRoad(-7.4, 2.72, 7.2, 2.72);
  addRoad(-7.4, 4.92, 6.4, 4.92);
  addRoad(2.05, 2.72, 2.05, 4.92);
  addRoad(-4.55, 2.72, -4.55, 4.92);
  addRoad(-6.05, -4.35, -6.05, 4.55);
  addRoad(-2.15, -4.35, -2.15, 4.15);
  addRoad(2.35, -4.35, 2.35, 4.45);
  addRoad(5.75, -4.35, 5.75, 3.4);

  const linkMat = new THREE.MeshBasicMaterial({ color: 0xf3d48a, transparent: true, opacity: 0.9 });
  const linkCore = new THREE.MeshBasicMaterial({ color: 0xfff6d0 });
  function centreLink(x1, z1, x2, z2, crossing = false) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.hypot(dx, dz) || 0.001;
    const yaw = Math.atan2(-dz, dx);
    if (crossing) {
      for (let t = 0.06; t < len - 0.03; t += 0.1) {
        const dash = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.008, 0.026), linkCore);
        dash.position.set(x1 + (dx / len) * t, 0.066, z1 + (dz / len) * t);
        dash.rotation.y = yaw;
        scene.add(dash);
      }
      return;
    }
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(len, 0.014, 0.04), linkMat);
    mesh.position.set((x1 + x2) / 2, 0.06, (z1 + z2) / 2);
    mesh.rotation.y = yaw;
    scene.add(mesh);
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 6), linkCore);
    bead.userData.t = Math.random();
    bead.userData.a = { x: x1, z: z1 };
    bead.userData.b = { x: x2, z: z2 };
    scene.add(bead);
    pulses.push(bead);
  }
  function linkNode(x, z) {
    const node = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.016, 14), linkCore);
    node.position.set(x, 0.072, z);
    scene.add(node);
  }
  const spineX = -0.28;
  linkNode(0.05, 0.83);
  centreLink(0.05, 0.86, spineX, 0.86);
  centreLink(spineX, 0.84, spineX, 0.88);
  centreLink(spineX, 0.9, spineX, 1.26, true);
  centreLink(spineX, 1.3, spineX, 2.5);
  centreLink(spineX, 2.54, spineX, 2.9, true);
  centreLink(spineX, 2.94, spineX, 3.04);
  linkNode(0.05, 0.83);
  linkNode(spineX, 3.04);
  centreLink(spineX, 1.42, -1.92, 1.42);
  centreLink(-1.96, 1.42, -2.34, 1.42, true);
  centreLink(-2.4, 1.42, -4.3, 1.42);
  centreLink(-4.3, 1.42, -4.3, 2.16);
  linkNode(-4.3, 2.16);
  centreLink(-3.95, 1.42, -3.95, 1.28);
  centreLink(-3.95, 1.26, -3.95, 0.9, true);
  centreLink(-3.95, 0.86, -3.95, 0.22);
  linkNode(-3.95, 0.22);
  centreLink(-3.95, 0.22, -3.95, -1.32);
  centreLink(-3.95, -1.36, -3.95, -1.74, true);
  centreLink(-3.95, -1.8, -3.95, -2.42);
  linkNode(-3.95, -2.42);
  centreLink(spineX, 1.42, 1.9, 1.42);
  centreLink(1.9, 1.42, 1.9, 1.28);
  centreLink(1.9, 1.26, 1.9, 0.9, true);
  centreLink(1.9, 0.86, 1.9, -1.32);
  centreLink(1.9, -1.36, 1.9, -1.74, true);
  centreLink(1.9, -1.8, 1.5, -1.8);
  centreLink(1.5, -1.8, 1.5, -2.4);
  linkNode(1.5, -2.4);
  centreLink(1.9, -1.8, 2.12, -1.8);
  centreLink(2.16, -1.8, 2.54, -1.8, true);
  centreLink(2.6, -1.8, 4.15, -1.8);
  centreLink(4.15, -1.8, 4.15, -2.48);
  linkNode(4.15, -2.48);
  centreLink(spineX, 3.02, -1.9, 3.02);
  centreLink(-1.96, 3.02, -2.34, 3.02, true);
  centreLink(-2.4, 3.02, -4.3, 3.02);
  centreLink(-4.36, 3.02, -4.74, 3.02, true);
  centreLink(-4.8, 3.02, -4.9, 3.02);
  centreLink(-4.9, 3.02, -4.9, 4.68);
  centreLink(-4.9, 4.74, -4.9, 5.08, true);
  linkNode(-4.9, 4.66);

  [[-2.15, 1.08], [2.35, 1.08], [-2.15, -1.55], [2.35, -1.55]].forEach(([x, z]) => crossing(x, z, true));

  [
    [-4.2, -4.05], [0.2, -4.05], [4.0, -4.05],
    [-4.4, -1.25], [0.15, -1.25], [4.0, -1.25],
    [-4.6, 1.35], [-0.9, 1.35], [1.4, 1.35], [4.2, 1.35],
    [-4.8, 2.4], [0.2, 2.95], [3.5, 3.2],
    [-6.7, -2.4], [6.4, -2.2], [6.3, 0.8],
    [-1.6, 3.05], [0.2, 2.95], [5.35, -3.55], [5.45, 1.55], [-6.35, 0.35], [3.9, 2.55],
  ].forEach(([x, z]) => streetLamp(x, z));

  buildSkeletonWorks();

  function buildSkeletonWorks() {
    const group = new THREE.Group();
    const x0 = -6.5;
    const x1 = -3.7;
    const len = x1 - x0;
    const mid = (x0 + x1) / 2;
    const pit0 = -5.55;
    const pit1 = -4.65;
    const pitMid = (pit0 + pit1) / 2;
    const pitLen = pit1 - pit0;
    const cycleZ = 5.28;
    const walkZ = 5.46;
    const paveCanvas = document.createElement("canvas");
    paveCanvas.width = 256;
    paveCanvas.height = 128;
    const paveCtx = paveCanvas.getContext("2d");
    paveCtx.fillStyle = "#f4efe6";
    paveCtx.fillRect(0, 0, 256, 128);
    paveCtx.strokeStyle = "rgba(176, 160, 142, 0.85)";
    paveCtx.lineWidth = 4;
    paveCtx.beginPath();
    paveCtx.moveTo(128, 0);
    paveCtx.lineTo(128, 128);
    paveCtx.stroke();
    const paveMap = new THREE.CanvasTexture(paveCanvas);
    paveMap.colorSpace = THREE.SRGBColorSpace;
    paveMap.wrapS = THREE.RepeatWrapping;
    paveMap.wrapT = THREE.RepeatWrapping;
    textures.push(paveMap);
    const pave = new THREE.MeshStandardMaterial({ color: 0xffffff, map: paveMap, roughness: 0.84 });
    const cycleMat = new THREE.MeshStandardMaterial({ color: 0x3c6b56, roughness: 0.7 });
    const curbMat = new THREE.MeshStandardMaterial({ color: 0xe6ddd2, roughness: 0.7 });
    const powerMat = new THREE.MeshStandardMaterial({ color: 0xc9844a, roughness: 0.4 });
    const drainMat = new THREE.MeshStandardMaterial({ color: 0x6e665e, roughness: 0.5, metalness: 0.2 });

    const curb = new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, 0.04), curbMat);
    curb.position.set(mid, 0.035, 5.18);
    const cycle = new THREE.Mesh(new THREE.BoxGeometry(len, 0.025, 0.14), cycleMat);
    cycle.position.set(mid, 0.028, cycleZ);
    group.add(curb, cycle);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(len - 0.12, 0.006, 0.012), lineMat);
    edge.position.set(mid, 0.044, cycleZ + 0.05);
    group.add(edge);

    const leftLen = pit0 - x0;
    const rightLen = x1 - pit1;
    const leftPave = new THREE.Mesh(new THREE.BoxGeometry(leftLen, 0.035, 0.22), pave);
    leftPave.position.set(x0 + leftLen / 2, 0.03, walkZ);
    const rightPave = new THREE.Mesh(new THREE.BoxGeometry(rightLen, 0.035, 0.22), pave);
    rightPave.position.set(pit1 + rightLen / 2, 0.03, walkZ);
    group.add(leftPave, rightPave);

    const trough = new THREE.Mesh(
      new THREE.BoxGeometry(pitLen, 0.02, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: 0.9 }),
    );
    trough.position.set(pitMid, 0.016, walkZ);
    group.add(trough);
    [-1, 1].forEach((side) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(pitLen, 0.06, 0.025), curbMat);
      wall.position.set(pitMid, 0.04, walkZ + side * 0.09);
      group.add(wall);
    });
    [
      [drainMat, 0.018, walkZ - 0.045],
      [powerMat, 0.012, walkZ],
      [flowCoreMat, 0.014, walkZ + 0.045],
    ].forEach(([material, radius, z]) => {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, pitLen - 0.06, 10), material);
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(pitMid, 0.045, z);
      group.add(pipe);
    });
    [-1, 1].forEach((side) => {
      const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.012, 0.16), metalMat);
      saddle.position.set(pitMid + side * 0.28, 0.032, walkZ);
      group.add(saddle);
    });
    const cover = new THREE.Mesh(new THREE.BoxGeometry(pitLen - 0.04, 0.02, 0.2), pave);
    cover.position.set(pit1 + 0.55, 0.045, walkZ);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.012, 0.012), metalMat);
    handle.position.set(pit1 + 0.55, 0.062, walkZ);
    group.add(cover, handle);

    const grate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.012, 0.12), frameMat);
    grate.position.set(-6.15, 0.05, walkZ);
    group.add(grate);

    [
      [x0 + 0.15, 5.22],
      [x0 + 0.15, 5.52],
      [x1 - 0.15, 5.22],
      [x1 - 0.15, 5.52],
    ].forEach(([x, z]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.58, 8), whiteMat);
      post.position.set(x, 0.29, z);
      post.castShadow = true;
      group.add(post);
    });
    const canopy = new THREE.Group();
    canopy.position.set(mid, 0.6, 5.36);
    const span = (len - 0.28) / 2;
    [-1, 1].forEach((side) => {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(span, 0.016, 0.36), reflectRoofMat);
      panel.position.x = side * (span / 2 + 0.04);
      panel.castShadow = true;
      canopy.add(panel);
    });
    const fascia = new THREE.Mesh(new THREE.BoxGeometry(len - 0.22, 0.028, 0.014), whiteMat);
    fascia.position.set(0, -0.008, 0.22);
    canopy.add(fascia);
    group.add(canopy);
    shadeCanopy = canopy;

    const sign = bikeSign();
    sign.position.set(-6.2, 0, cycleZ);
    group.add(sign);
    tag(group, "skeleton");
    scene.add(group);
  }

  function bikeSign() {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#3c6b56";
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = "#f7f4ee";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(40, 86, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(92, 86, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(40, 86);
    ctx.lineTo(62, 58);
    ctx.lineTo(88, 70);
    ctx.lineTo(92, 86);
    ctx.moveTo(62, 58);
    ctx.lineTo(70, 86);
    ctx.moveTo(78, 46);
    ctx.lineTo(96, 42);
    ctx.stroke();
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    textures.push(map);
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(0.16, 0.16),
      new THREE.MeshBasicMaterial({ map }),
    );
    board.position.y = 0.42;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 6), whiteMat);
    pole.position.y = 0.2;
    const sign = new THREE.Group();
    sign.add(pole, board);
    return sign;
  }

  pool(-6.95, -0.22, 0.48, 1.85, "heart");
  const frontCanal = pool(0.7, 3.22, 1.85, 0.3, "digestive");
  const sidePool = pool(3.85, 3.38, 1.0, 0.48, "kidneys");
  pool(4.15, 2.05, 1.25, 0.62, "kidneys");
  starJet(0.7, frontCanal.z);
  starJet(sidePool.x, sidePool.z);
  starJet(4.15, 2.05);

  block({ x: -6.7, z: -3.45, w: 0.85, d: 0.72, h: 0.7, color: 0xf6f1e8 });
  block({ x: -5.15, z: -3.85, w: 0.95, d: 0.7, h: 1.02, color: 0xfaf6f1 });
  const lungs = block({
    x: -4.05, z: -3.05, w: 1.25, d: 1.05, h: 1.58, color: 0xf7f4ef, id: "lungs", faces: ["pz", "px", "nx", "nz"],
  });
  block({ x: -5.25, z: -2.45, w: 1.05, d: 0.75, h: 0.86, color: 0xfaf7f3 });
  const blueColumn = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 1.35, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x3a7eb8, emissive: 0x2a6898, emissiveIntensity: 0.35, roughness: 0.3 }),
  );
  blueColumn.position.set(-0.58, 0.75, 0.42);
  lungs.add(blueColumn);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.55, 22, 1, true), glassMat);
  tube.rotation.z = Math.PI / 2;
  tube.position.set(1.35, 0.95, 0.05);
  tube.renderOrder = 2;
  lungs.add(tube);
  const tubeCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 1.25, 16),
    new THREE.MeshStandardMaterial({ color: 0xc5e4f2, emissive: 0x8ec4dc, emissiveIntensity: 0.35, transparent: true, opacity: 0.72 }),
  );
  tubeCore.rotation.z = Math.PI / 2;
  tubeCore.position.set(1.35, 0.95, 0.05);
  lungs.add(tubeCore);
  const filter = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.28), wallMat(0xe7e0d2));
  filter.position.set(0.7, 0.95, 0.05);
  lungs.add(filter);
  for (let i = 0; i < 7; i += 1) {
    const pleat = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.2, 0.16), wallMat(i % 2 ? 0xf7f1e8 : 0xd7ebe4));
    pleat.position.set(1.08 + i * 0.03, 0.95, 0.05);
    pleat.rotation.y = i % 2 ? 0.45 : -0.45;
    lungs.add(pleat);
  }
  const gauge = new THREE.Group();
  gauge.position.set(1.55, 1.2, 0.05);
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 16), whiteMat);
  dial.rotation.x = Math.PI / 2;
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.012), new THREE.MeshStandardMaterial({ color: 0xc4473a }));
  needle.position.set(0.02, 0.02, 0);
  gauge.add(dial, needle);
  lungs.add(gauge);
  lungs.userData.needle = needle;
  const fan = new THREE.Group();
  fan.position.set(0.86, 0.95, 0.05);
  for (let i = 0; i < 3; i += 1) {
    const pivot = new THREE.Group();
    pivot.rotation.x = (i / 3) * Math.PI * 2;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.045), whiteMat);
    blade.position.y = 0.08;
    pivot.add(blade);
    fan.add(pivot);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 8), metalMat);
  hub.rotation.z = Math.PI / 2;
  fan.add(hub);
  lungs.add(fan);
  const housingRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.014, 8, 24), metalMat);
  housingRing.rotation.y = Math.PI / 2;
  housingRing.position.set(0.86, 0.95, 0.05);
  lungs.add(housingRing);
  for (let i = 0; i < 5; i += 1) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.24, 0.045), whiteMat);
    fin.position.set(0.68, 0.95, -0.1 + i * 0.05);
    lungs.add(fin);
    intakeFins.push(fin);
  }
  for (let i = 0; i < 5; i += 1) {
    const speck = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), new THREE.MeshBasicMaterial({ color: 0xe4d3b0 }));
    speck.position.set(0.75, 0.95, 0.05);
    speck.userData.t = i / 5;
    lungs.add(speck);
    specks.push(speck);
  }
  const ribbonMat = new THREE.MeshBasicMaterial({ color: 0xfffaf3, side: THREE.DoubleSide });
  for (let i = 0; i < 6; i += 1) {
    const bit = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.1), ribbonMat);
    bit.position.set(1.95 + i * 0.07, 0.95, 0.05);
    lungs.add(bit);
    ribbons.push(bit);
  }
  const tubeLight = new THREE.PointLight(0x7eefff, 0.7, 2.6);
  tubeLight.position.set(-2.7, 1.05, -3.0);
  scene.add(tubeLight);

  const skin = block({
    x: 0.2, z: -3.15, w: 2.35, d: 1.35, h: 0.96, color: 0xf8f5f0, id: "skin", faces: ["pz", "px", "nx", "nz"], roof: "none",
  });
  const solarPivot = new THREE.Group();
  solarPivot.position.set(0.05, 1.24, -0.5);
  const solarRoof = solarModule(2.05, 0.9, 2.16, 1.64);
  solarRoof.position.set(0, 0.05, 0.46);
  solarPivot.add(solarRoof);
  solarCatches.push(new THREE.Vector3(0.25, 1.35, -3.19));
  skin.add(solarPivot);
  movingRoofs.push({ kind: "solar", pivot: solarPivot, phase: 0.4 });
  const solarFrame = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.03, 0.04), solarFrameMat);
  solarFrame.position.set(0.05, 1.2, -0.48);
  skin.add(solarFrame);
  const shadeBank = louvreBank(2.2, 0.26);
  shadeBank.bank.position.set(0, 1.22, 0.54);
  skin.add(shadeBank.bank);
  movingRoofs.push({ kind: "reflect", slats: shadeBank.slats, phase: 1.2 });
  const thermo = new THREE.Group();
  thermo.position.set(0.95, 0, 0.62);
  const thermoGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.62, 10, 1, true), glassMat);
  thermoGlass.position.y = 0.4;
  thermoMercury = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.42, 8),
    new THREE.MeshStandardMaterial({ color: 0xd24b4b, emissive: 0xa33a32, emissiveIntensity: 0.35 }),
  );
  thermoMercury.position.y = 0.28;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), thermoMercury.material);
  bulb.position.y = 0.08;
  thermo.add(thermoGlass, thermoMercury, bulb);
  skin.add(thermo);
  tag(thermo, "skin");

  const civic = new THREE.Group();
  civic.position.set(0.05, 0, -0.22);
  const cw = 3.55;
  const ch = 1.18;
  const cd = 2.05;
  const civicFace = facadeMaterial(0xfffaf6, 3, 2);
  const mass = new THREE.Mesh(new THREE.BoxGeometry(cw, ch, cd), [civicFace, civicFace, whiteMat, whiteMat, civicFace, civicFace]);
  mass.position.y = ch / 2;
  mass.castShadow = true;
  mass.receiveShadow = true;
  civic.add(mass);
  parapet(civic, cw, ch, cd, 0xfffaf6);
  const court = new THREE.Mesh(
    new THREE.BoxGeometry(cw * 0.42, 0.06, cd * 0.4),
    new THREE.MeshStandardMaterial({ color: 0x2c3138, roughness: 0.5 }),
  );
  court.position.set(-0.1, ch + 0.03, -0.08);
  civic.add(court);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(cw * 0.62, ch * 0.55, 0.04), civicGlass);
  glass.position.set(0, ch * 0.4, cd / 2 + 0.02);
  civic.add(glass);
  for (let i = 0; i < 5; i += 1) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, ch * 0.7, 0.12), whiteMat);
    fin.position.set(-cw * 0.24 + i * (cw * 0.48 / 4), ch * 0.4, cd / 2 + 0.08);
    fin.castShadow = true;
    civic.add(fin);
  }
  const doorGlow = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.03), new THREE.MeshBasicMaterial({ color: 0x8ec8ee }));
  doorGlow.position.set(0, 0.32, cd / 2 + 0.05);
  civic.add(doorGlow);
  const band = new THREE.Mesh(new THREE.BoxGeometry(cw * 0.5, 0.025, 0.02), bulbMat);
  band.position.set(0, ch * 0.22, cd / 2 + 0.05);
  civic.add(band);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.22, 0.03), new THREE.MeshStandardMaterial({ color: 0x1c2428, roughness: 0.4 }));
  plate.position.set(0.72, 0.72, cd / 2 + 0.06);
  const shadeLamp = new THREE.MeshStandardMaterial({ color: 0xffe1a8, emissive: 0xffc56a, emissiveIntensity: 0.2 });
  const pumpLamp = new THREE.MeshStandardMaterial({ color: 0x9fd8ea, emissive: 0x4eb6d4, emissiveIntensity: 0.15 });
  const shadeDot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), shadeLamp);
  shadeDot.position.set(0.62, 0.76, cd / 2 + 0.09);
  const pumpDot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), pumpLamp);
  pumpDot.position.set(0.82, 0.76, cd / 2 + 0.09);
  civic.add(plate, shadeDot, pumpDot);
  civic.userData.shadeLamp = shadeLamp;
  civic.userData.pumpLamp = pumpLamp;
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.045, 1.15), whiteMat);
  wing.position.set(-cw / 2 - 0.28, 0.82, 0.15);
  wing.castShadow = true;
  civic.add(wing);
  [-0.35, 0.35].forEach((z) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.82, 6), whiteMat);
    post.position.set(-cw / 2 - 0.55, 0.41, z);
    civic.add(post);
  });
  tag(civic, "brain");
  const civicLouvre = louvreBank(cw - 0.1, cd - 0.1);
  civicLouvre.bank.position.set(0, ch + 0.1, 0);
  civic.add(civicLouvre.bank);
  movingRoofs.push({ kind: "reflect", slats: civicLouvre.slats, phase: 0.8 });
  const mast = new THREE.Group();
  mast.position.set(0.2, ch + 0.08, -0.2);
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.46, 8), metalMat);
  stalk.position.y = 0.23;
  const head = new THREE.Group();
  head.position.y = 0.48;
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.02, 16), metalMat);
  dish.rotation.z = 0.7;
  dish.position.x = 0.04;
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), new THREE.MeshBasicMaterial({ color: 0x8adfff }));
  eye.position.set(0.12, 0.03, 0);
  head.add(dish, eye);
  mast.add(stalk, head);
  civic.add(mast);
  scanner = head;
  scene.add(civic);

  function solarModule(w, d, repeatX, repeatY) {
    const group = new THREE.Group();
    const map = solarMap.clone();
    map.repeat.set(repeatX, repeatY);
    const face = solarMat.clone();
    face.map = map;
    face.emissiveMap = map;
    solarFaces.push(face);
    const edge = new THREE.MeshStandardMaterial({ color: 0x1c2430, metalness: 0.45, roughness: 0.4 });
    const cells = new THREE.Mesh(new THREE.BoxGeometry(w, 0.028, d), [edge, edge, face, edge, edge, edge]);
    cells.castShadow = true;
    group.add(cells);
    const t = 0.02;
    [
      [w + t * 2, t, 0, d / 2 + t / 2],
      [w + t * 2, t, 0, -(d / 2 + t / 2)],
      [t, d, -(w / 2 + t / 2), 0],
      [t, d, w / 2 + t / 2, 0],
    ].forEach(([bw, bd, x, z]) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.042, bd), solarFrameMat);
      rail.position.set(x, 0, z);
      rail.castShadow = true;
      group.add(rail);
    });
    const glaze = new THREE.Mesh(new THREE.BoxGeometry(w * 0.97, 0.004, d * 0.94), solarGlass);
    glaze.position.y = 0.02;
    glaze.renderOrder = 2;
    group.add(glaze);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.05), edge);
    box.position.set(w * 0.32, -0.02, -d * 0.28);
    group.add(box);
    return group;
  }

  [-5.15, -3.95, -2.8].forEach((x) => {
    const canopy = new THREE.Group();
    canopy.position.set(x, 0, -0.2);
    [[-0.4, -0.24], [0.4, -0.24], [-0.4, 0.24], [0.4, 0.24]].forEach(([px, pz]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.76, 8), whiteMat);
      post.position.set(px, 0.38, pz);
      post.castShadow = true;
      canopy.add(post);
    });
    const cells = solarModule(0.95, 0.55, 1, 1);
    const pivot = new THREE.Group();
    pivot.position.set(0, 0.8, 0);
    pivot.add(cells);
    canopy.add(pivot);
    movingRoofs.push({ kind: "solar", pivot, phase: x });
    solarCatches.push(new THREE.Vector3(x, 0.96, -0.2));
    tag(canopy, "heart");
    scene.add(canopy);
  });

  shaftMat = new THREE.MeshBasicMaterial({
    color: 0xfff6c8,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const shaftUp = new THREE.Vector3(0, 1, 0);
  const hubFeed = new THREE.Vector3(-3.95, 0.42, 0.2);
  const sunMote = new THREE.MeshBasicMaterial({ color: 0xfffbea });
  const powerMote = new THREE.MeshBasicMaterial({ color: 0xffd56a });
  solarCatches.forEach((catchPoint, index) => {
    const from = sunAim.clone();
    const dir = catchPoint.clone().sub(from);
    const len = dir.length();
    const ray = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.02, len, 10, 1, true), shaftMat);
    ray.position.copy(from).add(catchPoint).multiplyScalar(0.5);
    ray.quaternion.setFromUnitVectors(shaftUp, dir.clone().normalize());
    ray.raycast = () => {};
    scene.add(ray);
    shafts.push(ray);
    for (let i = 0; i < 3; i += 1) {
      const mote = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), sunMote);
      mote.userData = { from, to: catchPoint.clone(), t: i / 3 };
      mote.raycast = () => {};
      scene.add(mote);
      charges.push(mote);
    }
    const outlet = index === 0 ? new THREE.Vector3(1.48, 0.28, -2.15) : hubFeed;
    for (let i = 0; i < 2; i += 1) {
      const feed = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 6), powerMote);
      feed.userData = { from: catchPoint.clone(), to: outlet, t: i / 2 };
      feed.raycast = () => {};
      scene.add(feed);
      charges.push(feed);
    }
  });

  const heartHub = new THREE.Group();
  heartHub.position.set(-3.95, 0, 0.2);
  const hubBody = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.28, 0.22), frameMat);
  hubBody.position.y = 0.18;
  hubLampMat = new THREE.MeshStandardMaterial({ color: 0xffe1a8, emissive: 0xffc56a, emissiveIntensity: 0.35 });
  const hubFace = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.02), hubLampMat);
  hubFace.position.set(0, 0.2, 0.12);
  heartHub.add(hubBody, hubFace);
  tag(heartHub, "heart");
  scene.add(heartHub);

  const towerWater = buildTower(4.15, -3.15);
  block({ x: 6.45, z: -3.7, w: 0.9, d: 0.7, h: 0.72, color: 0xfffaf6 });
  const utility = new THREE.Group();
  utility.position.set(6.55, 0, -2.15);
  const utilBody = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.82, 0.72), wallMat(0x24382e));
  utilBody.position.y = 0.41;
  utilBody.castShadow = true;
  utility.add(utilBody);
  [-0.18, 0.18].forEach((x) => {
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.36, 0.03), new THREE.MeshBasicMaterial({ color: 0xf0c14a }));
    door.position.set(x, 0.3, 0.37);
    utility.add(door);
  });
  scene.add(utility);
  block({ x: 4.15, z: -0.15, w: 1.4, d: 1.1, h: 0.88, color: 0xf7f3ec, faces: ["pz", "px", "nx", "nz"] });
  const pergolaHouse = block({ x: 6.55, z: 1.35, w: 0.95, d: 0.78, h: 0.68, color: 0xf8f4ee });
  for (let i = 0; i < 5; i += 1) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.02, 0.04), leafDeep);
    slat.position.set(0, 0.82, -0.26 + i * 0.13);
    pergolaHouse.add(slat);
  }

  function binMark(kind, x) {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 128, 128);
    ctx.strokeStyle = "#f7f4ee";
    ctx.fillStyle = "#f7f4ee";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (kind === "recycle") {
      ctx.beginPath();
      ctx.arc(64, 64, 34, 0.5, Math.PI * 1.7);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(90, 38);
      ctx.lineTo(108, 24);
      ctx.lineTo(90, 16);
      ctx.stroke();
    } else if (kind === "leaf") {
      ctx.beginPath();
      ctx.moveTo(64, 104);
      ctx.quadraticCurveTo(18, 58, 64, 16);
      ctx.quadraticCurveTo(110, 58, 64, 104);
      ctx.fill();
    } else {
      ctx.strokeRect(42, 40, 44, 52);
      ctx.beginPath();
      ctx.moveTo(36, 40);
      ctx.lineTo(92, 40);
      ctx.stroke();
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    textures.push(map);
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.16, 0.16),
      new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false }),
    );
    plate.position.set(x, 0.42, 0.21);
    return plate;
  }

  const bins = new THREE.Group();
  bins.position.set(-5.15, 0, 1.9);
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.72, 0.06), whiteMat);
  back.position.set(0, 0.4, -0.46);
  back.castShadow = true;
  bins.add(back);
  [-0.64, 0.64].forEach((x) => {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.72, 0.95), whiteMat);
    side.position.set(x, 0.4, 0);
    side.castShadow = true;
    bins.add(side);
  });
  const binRoof = new THREE.Mesh(
    new THREE.BoxGeometry(1.46, 0.07, 1.12),
    new THREE.MeshStandardMaterial({ color: 0x3e5c56, roughness: 0.55, emissive: 0x2c4540, emissiveIntensity: 0.12 }),
  );
  binRoof.position.y = 0.82;
  binRoof.castShadow = true;
  bins.add(binRoof);
  [[-0.4, 0x2f6fbe], [0, 0xe0b04a], [0.4, 0x3d8f55]].forEach(([x, color], index) => {
    const bay = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.36), new THREE.MeshStandardMaterial({ color, roughness: 0.42 }));
    bay.position.set(x, 0.28, 0.02);
    bay.castShadow = true;
    bins.add(bay);
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.02), new THREE.MeshStandardMaterial({ color: 0x1c1916, roughness: 0.6 }));
    mouth.position.set(x, 0.34, 0.2);
    bins.add(mouth);
    const mark = binMark(["recycle", "leaf", "waste"][index], x);
    bins.add(mark);
    const lampMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.15 });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), lampMat);
    lamp.position.set(x, 0.66, 0.22);
    bins.add(lamp);
    bayLamps.push(lampMat);
    const fill = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.16, 0.18),
      new THREE.MeshStandardMaterial({ color, roughness: 0.48 }),
    );
    fill.position.set(x, 0.12, 0.02);
    fill.scale.y = 0.25;
    fill.userData.level = 0.25;
    bins.add(fill);
    bayFills.push(fill);
    const hinge = new THREE.Group();
    hinge.position.set(x, 0.56, -0.16);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.028, 0.38), reflectRoofMat);
    lid.position.z = 0.19;
    hinge.add(lid);
    lids.push(hinge);
    bins.add(hinge);
  });
  const rail = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.018, 0.018), metalMat);
  rail.position.set(0, 0.74, 0.38);
  bins.add(rail);
  const beltCanvas = document.createElement("canvas");
  beltCanvas.width = 128;
  beltCanvas.height = 32;
  const beltCtx = beltCanvas.getContext("2d");
  beltCtx.fillStyle = "#2a2e31";
  beltCtx.fillRect(0, 0, 128, 32);
  beltCtx.fillStyle = "#3e454a";
  for (let x = 0; x < 128; x += 16) beltCtx.fillRect(x, 0, 6, 32);
  beltScroll = new THREE.CanvasTexture(beltCanvas);
  beltScroll.wrapS = THREE.RepeatWrapping;
  beltScroll.wrapT = THREE.RepeatWrapping;
  beltScroll.repeat.set(4, 1);
  beltScroll.colorSpace = THREE.SRGBColorSpace;
  textures.push(beltScroll);
  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(1.32, 0.02, 0.11),
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: beltScroll, roughness: 0.55, metalness: 0.25 }),
  );
  belt.position.set(0, 0.5, 0.38);
  bins.add(belt);
  [-0.55, 0, 0.55].forEach((x) => {
    const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 8), metalMat);
    roller.rotation.x = Math.PI / 2;
    roller.position.set(x, 0.46, 0.38);
    bins.add(roller);
  });
  const sortScanner = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.14), frameMat);
  sortScanner.position.set(-0.64, 0.58, 0.38);
  scanBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.08, 0.1),
    new THREE.MeshBasicMaterial({ color: 0x9ad7f0 }),
  );
  scanBar.position.set(-0.6, 0.58, 0.38);
  bins.add(sortScanner, scanBar);
  gantry = new THREE.Group();
  gantry.position.set(-0.62, 0.74, 0.38);
  const carriage = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.08), frameMat);
  const claw = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, 0.03), metalMat);
  claw.position.y = -0.07;
  gantry.add(carriage, claw);
  bins.add(gantry);
  [0, 1, 2].forEach((kind) => {
    const item = new THREE.Group();
    if (kind === 0) {
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.028, 0.08, 12),
        new THREE.MeshStandardMaterial({ color: 0xd7ebf8, roughness: 0.18, metalness: 0.06, transparent: true, opacity: 0.85 }),
      );
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.02, 8),
        new THREE.MeshStandardMaterial({ color: 0x2f6fbe, roughness: 0.35 }),
      );
      cap.position.y = 0.05;
      item.add(body, cap);
    } else if (kind === 1) {
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.036, 12, 8),
        new THREE.MeshStandardMaterial({ color: 0x7a9348, roughness: 0.62 }),
      );
      body.scale.set(1.15, 0.45, 0.7);
      item.add(body);
    } else {
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.012, 0.05),
        new THREE.MeshStandardMaterial({ color: 0xd5d0c8, roughness: 0.35, metalness: 0.15 }),
      );
      body.rotation.z = 0.4;
      item.add(body);
    }
    item.visible = false;
    bins.add(item);
    sortJobs.push(item);
  });
  tag(bins, "liver");
  scene.add(bins);

  block({ x: -3.35, z: 1.88, w: 1.1, d: 0.85, h: 0.74, color: 0xfffaf6 });
  block({ x: -1.15, z: 1.9, w: 1.25, d: 0.9, h: 0.7, color: 0xc4896e, faces: ["pz", "px", "nx"] });

  block({ x: -7.15, z: -3.4, w: 0.75, d: 0.7, h: 0.88, color: 0xf8f4ee });
  block({ x: -7.05, z: -1.7, w: 0.7, d: 0.68, h: 0.72, color: 0xfaf7f3 });
  block({ x: -1.5, z: -3.15, w: 0.72, d: 0.85, h: 1.05, color: 0xfaf7f2 });
  block({ x: 1.72, z: -3.1, w: 0.58, d: 0.8, h: 0.78, color: 0xfffaf6 });
  block({ x: 3.05, z: -3.0, w: 0.7, d: 0.85, h: 1.05, color: 0xf7f2ea });
  block({ x: 5.2, z: -2.55, w: 0.68, d: 0.72, h: 0.9, color: 0xf6f1e8 });
  block({ x: 2.95, z: 0.55, w: 0.7, d: 0.72, h: 0.8, color: 0xfaf6f1 });
  block({ x: 5.25, z: 0.42, w: 0.62, d: 0.68, h: 0.7, color: 0xfaf7f3 });
  block({ x: 0.9, z: 1.82, w: 0.8, d: 0.68, h: 0.66, color: 0xf8f4ee });
  block({ x: -7.15, z: 1.7, w: 0.72, d: 0.7, h: 0.74, color: 0xfffaf6 });
  block({ x: 6.85, z: -0.45, w: 0.65, d: 0.62, h: 0.78, color: 0xf7f3ec });
  block({ x: 6.7, z: 2.55, w: 0.7, d: 0.65, h: 0.68, color: 0xfaf6f0 });

  pool(6.55, 1.92, 0.46, 0.9, "kidneys");
  pool(-3.35, 3.36, 1.2, 0.36, "digestive");
  const leftPool = pool(-5.3, 3.95, 0.72, 0.46, "kidneys");
  pool(4.78, 4.34, 0.78, 0.38, "digestive");
  starJet(leftPool.x, leftPool.z);
  starJet(-3.35, 3.36);
  starJet(4.78, 4.34);
  starJet(6.55, 1.92);

  function addDripLine(parent, length, y, z, count) {
    const line = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, length, 6), flowCoreMat);
    line.rotation.z = Math.PI / 2;
    line.position.set(0, y, z);
    parent.add(line);
    for (let i = 0; i < count; i += 1) {
      const x = -length / 2 + 0.12 + (count === 1 ? length / 2 - 0.12 : i * ((length - 0.24) / (count - 1)));
      const emitter = new THREE.Mesh(new THREE.SphereGeometry(0.011, 6, 5), metalMat);
      emitter.position.set(x, y - 0.012, z);
      parent.add(emitter);
      const beads = [0, 1].map((n) => {
        const drop = new THREE.Mesh(new THREE.SphereGeometry(0.007, 6, 5), sprayMat);
        drop.position.set(x, y - 0.03 - n * 0.015, z);
        drop.visible = false;
        parent.add(drop);
        return drop;
      });
      drips.push({ beads, y: y - 0.015, phase: i * 0.17 + z });
    }
  }

  buildGreenhouse(0.15, 3.92);
  function gardenBed(x, z, length, depth, cols, rows, irrigate = false) {
    const bed = new THREE.Group();
    bed.position.set(x, 0, z);
    const soil = new THREE.Mesh(new THREE.BoxGeometry(length, 0.1, depth), gardenSoil);
    soil.position.y = 0.05;
    bed.add(soil);
    const rim = new THREE.Mesh(new THREE.BoxGeometry(length + 0.08, 0.08, depth + 0.08), wallMat(0xe7d7c0));
    rim.position.y = 0.04;
    bed.add(rim);
    for (let row = 0; row < rows; row += 1) {
      const furrow = new THREE.Mesh(new THREE.BoxGeometry(length * 0.9, 0.012, 0.028), furrowMat);
      furrow.position.set(0, 0.1, -depth / 2 + 0.1 + row * ((depth - 0.18) / Math.max(1, rows - 1)));
      bed.add(furrow);
      for (let col = 0; col < cols; col += 1) {
        placeCrop(
          bed,
          -length / 2 + 0.16 + col * ((length - 0.28) / Math.max(1, cols - 1)),
          0.1,
          -depth / 2 + 0.1 + row * ((depth - 0.18) / Math.max(1, rows - 1)),
          row * 5 + col,
        );
      }
    }
    const hose = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, depth * 0.8), flowCoreMat);
    hose.position.set(-length / 2 + 0.04, 0.12, 0);
    bed.add(hose);
    if (irrigate) {
      const wet = new THREE.Mesh(new THREE.PlaneGeometry(length * 0.86, depth * 0.7), wetMat);
      wet.rotation.x = -Math.PI / 2;
      wet.position.y = 0.108;
      wet.visible = false;
      wet.renderOrder = 2;
      bed.add(wet);
      wets.push(wet);
      for (let row = 0; row < rows; row += 1) {
        const z = -depth / 2 + 0.1 + row * ((depth - 0.18) / Math.max(1, rows - 1));
        addDripLine(bed, length * 0.86, 0.13, z, Math.max(3, cols - 2));
      }
    }
    scene.add(bed);
  }
  gardenBed(0.15, 4.54, 1.9, 0.26, 8, 2, true);
  gardenBed(-1.85, 4.2, 0.7, 0.48, 3, 3);
  gardenBed(3.2, 4.22, 0.85, 0.36, 4, 2);
  gardenBed(-3.55, 4.22, 0.9, 0.36, 4, 2);

  [
    [-6.2, -2.2, 0.6], [-5.45, -0.85, 0.6], [-3.45, -0.85, 0.55], [1.15, -0.85, 0.6],
    [3.45, -0.85, 0.55], [-1.35, 0.4, 0.5], [0.45, 0.4, 0.5], [1.4, 0.35, 0.5],
    [-4.95, 0.35, 0.55], [4.7, 0.3, 0.55], [-0.45, 1.85, 0.5],
    [2.95, 1.7, 0.45], [5.25, 1.7, 0.48], [-6.55, 2.85, 0.48], [-2.15, 4.5, 0.4],
    [6.15, -0.55, 0.45], [-3.7, -3.6, 0.5],
  ].forEach(([x, z, scale]) => palm(x, z, scale));

  function districtLed(id, x, z) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.26, 6), whiteMat);
    post.position.set(x, 0.13, z);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffe1a8, emissive: 0xffc56a, emissiveIntensity: 0.35, roughness: 0.3 });
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.07, 0.07), headMat);
    head.position.set(x, 0.28, z);
    head.userData.id = "heart";
    post.userData.id = "heart";
    scene.add(post, head);
    leds[id] = headMat;
  }
  districtLed("north", -3.2, -3.9);
  districtLed("east", 4.85, 0.45);
  districtLed("south", 2.0, 2.95);

  function barrier(id, x, z, yaw) {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 16;
    const ctx = canvas.getContext("2d");
    for (let i = 0; i < 8; i += 1) {
      ctx.fillStyle = i % 2 ? "#f4f4f4" : "#d24b4b";
      ctx.fillRect(i * 8, 0, 8, 16);
    }
    const map = new THREE.CanvasTexture(canvas);
    textures.push(map);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.16, 0.06), new THREE.MeshStandardMaterial({ map, roughness: 0.6 }));
    mesh.position.set(x, 0.12, z);
    mesh.rotation.y = yaw;
    mesh.visible = false;
    scene.add(mesh);
    barriers[id] = mesh;
  }
  barrier("north", 0.2, -4.35, 0);
  barrier("east", 5.75, 0.3, Math.PI / 2);
  barrier("south", 2.35, 3.15, Math.PI / 2);

  const hatch = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.4), new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.5 }));
  hatch.position.set(-0.4, 0.07, 5.05);
  hatch.userData.id = "skeleton";
  scene.add(hatch);

  badge("1", 0.1, 1.85, -0.15, "brain");
  badge("2", -3.95, 1.25, -0.2, "heart");
  badge("3", -4.05, 2.15, -3.05, "lungs");
  badge("4", 1.05, 1.65, -3.15, "skin");
  badge("5", 4.15, 2.5, -3.15, "kidneys");
  badge("6", 0.55, 1.2, 3.95, "digestive");
  badge("7", -5.15, 1.35, 1.9, "liver");
  badge("8", -0.4, 0.55, 5.2, "skeleton");

  spots.brain = new THREE.Vector3(0.05, 0.08, -0.22);
  spots.heart = new THREE.Vector3(-3.95, 0.08, -0.2);
  spots.lungs = new THREE.Vector3(-4.05, 0.08, -3.05);
  spots.skin = new THREE.Vector3(0.2, 0.08, -3.15);
  spots.kidneys = new THREE.Vector3(4.15, 0.08, -3.15);
  spots.digestive = new THREE.Vector3(0.15, 0.08, 3.92);
  spots.liver = new THREE.Vector3(-5.15, 0.08, 1.9);
  spots.skeleton = new THREE.Vector3(-5.1, 0.08, 5.28);

  const flowRun = layPipe([
    [4.98, 0.32, -3.03],
    [6.0, 0.17, -3.03],
    [6.0, 0.17, 3.05],
    [2.7, 0.17, 3.05],
    [2.7, 0.17, 4.05],
  ]);
  const flowLengths = [];
  let flowTotal = 0;
  for (let i = 0; i < flowRun.length - 1; i += 1) {
    const len = Math.hypot(
      flowRun[i + 1][0] - flowRun[i][0],
      flowRun[i + 1][1] - flowRun[i][1],
      flowRun[i + 1][2] - flowRun[i][2],
    );
    flowLengths.push(len);
    flowTotal += len;
  }
  layPipe([[2.7, 0.17, 3.05], [-5.7, 0.17, 3.05]]);
  layPipe([[6.0, 0.17, 2.05], [4.9, 0.17, 2.05]], { supports: false });
  layPipe([[4.55, 0.17, 3.05], [4.55, 0.17, 3.98]], { supports: false });
  layPipe([[3.85, 0.17, 3.05], [3.85, 0.17, 3.12]], { supports: false });
  layPipe([[1.05, 0.17, 3.05], [1.05, 0.17, 3.1]], { supports: false });
  layPipe([[-3.35, 0.17, 3.05], [-3.35, 0.17, 3.22]], { supports: false });
  layPipe([[-5.5, 0.17, 3.05], [-5.5, 0.17, 3.46]], { supports: false });
  function verge(x1, z1, x2, z2) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.hypot(dx, dz) || 0.001;
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(len, 0.018, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xe6dfd4, roughness: 0.92 }),
    );
    slab.position.set((x1 + x2) / 2, 0.018, (z1 + z2) / 2);
    slab.rotation.y = Math.atan2(-dz, dx);
    slab.receiveShadow = true;
    scene.add(slab);
  }
  verge(6.02, -2.95, 6.02, -1.85);
  verge(6.02, -1.25, 6.02, 0.8);
  verge(6.02, 1.38, 6.02, 2.42);
  verge(5.45, 3.05, 2.65, 3.05);
  verge(1.7, 3.05, -1.85, 3.05);
  verge(-2.45, 3.05, -4.25, 3.05);
  verge(-4.9, 3.05, -5.5, 3.05);
  const dropMat = new THREE.MeshBasicMaterial({ color: 0xf7fdff });
  const drops = Array.from({ length: 16 }, (_, index) => {
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), dropMat);
    drop.userData.t = index / 16;
    scene.add(drop);
    return drop;
  });
  function pointOnFlow(t, target) {
    let dist = (t % 1) * flowTotal;
    for (let i = 0; i < flowLengths.length; i += 1) {
      const len = flowLengths[i];
      if (dist <= len || i === flowLengths.length - 1) {
        const k = len === 0 ? 0 : Math.min(1, dist / len);
        const a = flowRun[i];
        const b = flowRun[i + 1];
        target.set(
          a[0] + (b[0] - a[0]) * k,
          a[1] + (b[1] - a[1]) * k,
          a[2] + (b[2] - a[2]) * k,
        );
        return target;
      }
      dist -= len;
    }
    return target;
  }

  const towerLight = new THREE.PointLight(0x49c2ff, 0.85, 4.5);
  towerLight.position.set(4.15, 1.25, -3.15);
  scene.add(towerLight);

  function buildTower(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    const podium = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.22, 1.15), whiteMat);
    podium.position.y = 0.11;
    podium.castShadow = true;
    group.add(podium);
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.85, 28, 1, true), glassMat);
    shell.position.y = 1.25;
    shell.renderOrder = 2;
    group.add(shell);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 1.15, 24), towerWaterMat);
    water.position.y = 0.95;
    water.renderOrder = 1;
    group.add(water);
    const surface = new THREE.Mesh(
      new THREE.CircleGeometry(0.29, 28),
      new THREE.MeshStandardMaterial({ color: 0xd8f4fb, roughness: 0.08, metalness: 0.05, emissive: 0x9ed7ea, emissiveIntensity: 0.25 }),
    );
    surface.rotation.x = -Math.PI / 2;
    surface.position.y = 1.53;
    group.add(surface);
    towerSurface = surface;
    const meniscus = new THREE.Mesh(
      new THREE.TorusGeometry(0.29, 0.012, 6, 24),
      new THREE.MeshBasicMaterial({ color: 0xf7fdff }),
    );
    meniscus.rotation.x = Math.PI / 2;
    meniscus.position.y = 1.53;
    group.add(meniscus);
    towerMeniscus = meniscus;
    for (let i = 0; i < 5; i += 1) {
      const bubble = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xf4fbff, transparent: true, opacity: 0.75 }),
      );
      bubble.position.set((i - 2) * 0.07, 0.55, (i % 2) * 0.06 - 0.03);
      bubble.userData.t = i / 5;
      group.add(bubble);
      towerBubbles.push(bubble);
    }
    [0.48, 1.15, 1.9].forEach((y) => {
      const bandRing = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.016, 6, 28), metalMat);
      bandRing.rotation.x = Math.PI / 2;
      bandRing.position.y = y;
      group.add(bandRing);
    });
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 24), whiteMat);
    cap.position.y = 2.18;
    group.add(cap);
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 0.24), metalMat);
    pump.position.set(0.5, 0.22, 0.32);
    pump.castShadow = true;
    group.add(pump);
    const rotor = new THREE.Group();
    rotor.position.set(0.5, 0.4, 0.32);
    const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.028, 16), metalMat);
    rotor.add(disk);
    for (let i = 0; i < 6; i += 1) {
      const pivot = new THREE.Group();
      pivot.rotation.y = (i / 6) * Math.PI * 2;
      const vane = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.016, 0.016), whiteMat);
      vane.position.set(0.04, 0.02, 0);
      pivot.add(vane);
      rotor.add(pivot);
    }
    group.add(rotor);
    pumpRotor = rotor;
    const outlet = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.42, 8), pipeMat);
    outlet.rotation.z = Math.PI / 2;
    outlet.position.set(0.62, 0.32, 0.12);
    group.add(outlet);
    const purifier = new THREE.Group();
    purifier.position.set(0.08, 0, 0.9);
    const skid = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.08, 0.4), whiteMat);
    skid.position.y = 0.04;
    skid.castShadow = true;
    purifier.add(skid);
    [
      [-0.3, 0x8d5a3c],
      [0, 0x2a2a2a],
      [0.3, 0x2f78a4],
    ].forEach(([x, color]) => {
      const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.38, 14, 1, true), glassMat);
      shell.position.set(x, 0.3, 0);
      shell.renderOrder = 2;
      const media = new THREE.Mesh(
        new THREE.CylinderGeometry(0.062, 0.062, 0.28, 12),
        new THREE.MeshStandardMaterial({ color, roughness: 0.55 }),
      );
      media.position.set(x, 0.28, 0);
      purifier.add(shell, media);
    });
    const header = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.72, 8), flowCoreMat);
    header.rotation.z = Math.PI / 2;
    header.position.set(0, 0.5, 0);
    const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.28, 8), flowCoreMat);
    feed.position.set(-0.3, 0.12, -0.16);
    feed.rotation.x = Math.PI / 2;
    purifier.add(header, feed);
    [
      [-0.3, 0x8d5a3c],
      [0, 0x2a2a2a],
      [0.3, 0x2f78a4],
    ].forEach(([x]) => {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.008, 6, 14), metalMat);
      wheel.position.set(x, 0.52, 0.12);
      purifier.add(wheel);
    });
    filterBead = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), sprayMat);
    filterBead.position.set(-0.32, 0.5, 0);
    purifier.add(filterBead);
    group.add(purifier);
    tag(group, "kidneys");
    scene.add(group);
    return water;
  }

  function buildGreenhouse(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    const length = 2.7;
    const bed = new THREE.Mesh(new THREE.BoxGeometry(length, 0.08, 0.72), gardenSoil);
    bed.position.y = 0.04;
    group.add(bed);
    const curb = new THREE.Mesh(new THREE.BoxGeometry(length + 0.08, 0.07, 0.84), wallMat(0xe7d7c0));
    curb.position.y = 0.035;
    group.add(curb);
    for (let row = 0; row < 3; row += 1) {
      const furrow = new THREE.Mesh(new THREE.BoxGeometry(length * 0.9, 0.012, 0.03), furrowMat);
      furrow.position.set(0, 0.085, -0.18 + row * 0.18);
      group.add(furrow);
    }
    const archMat = new THREE.MeshBasicMaterial({ color: 0xf7fbfc });
    const count = 12;
    for (let i = 0; i < count; i += 1) {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.014, 8, 24, Math.PI), archMat);
      arch.rotation.y = Math.PI / 2;
      arch.position.set(-length / 2 + 0.1 + i * ((length - 0.2) / (count - 1)), 0.04, 0);
      group.add(arch);
    }
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(length, 0.02, 0.02), whiteMat);
    ridge.position.y = 0.4;
    group.add(ridge);
    [-1, 1].forEach((side) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.016, 0.016), whiteMat);
      rail.position.set(0, 0.08, side * 0.36);
      group.add(rail);
      [-1, 1].forEach((end) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.34, 6), whiteMat);
        post.position.set(end * (length / 2 - 0.02), 0.2, side * 0.36);
        group.add(post);
      });
    });
    const houseGlass = glassMat.clone();
    houseGlass.opacity = 0.16;
    houseGlass.color = new THREE.Color(0xe7f6ef);
    const roofPane = new THREE.Mesh(new THREE.BoxGeometry(length - 0.12, 0.01, 0.62), houseGlass);
    roofPane.position.y = 0.36;
    roofPane.renderOrder = 2;
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(length - 0.16, 0.32, 0.012), houseGlass);
    northWall.position.set(0, 0.2, -0.34);
    northWall.renderOrder = 2;
    const southWall = new THREE.Mesh(new THREE.BoxGeometry(length - 0.16, 0.1, 0.012), houseGlass);
    southWall.position.set(0, 0.1, 0.34);
    southWall.renderOrder = 2;
    group.add(roofPane, northWall, southWall);
    [-0.18, 0, 0.18].forEach((z) => addDripLine(group, length - 0.4, 0.12, z, 5));
    const wet = new THREE.Mesh(new THREE.PlaneGeometry(length * 0.85, 0.5), wetMat);
    wet.rotation.x = -Math.PI / 2;
    wet.position.y = 0.09;
    wet.visible = false;
    wet.renderOrder = 2;
    group.add(wet);
    wets.push(wet);
    for (let row = 0; row < 12; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        placeCrop(group, -1.15 + row * 0.2, 0.08, -0.18 + col * 0.18, row + col * 3);
      }
    }
    tag(group, "digestive");
    scene.add(group);
  }

  bakeStatic(scene, [
    sunDisc, sunGlow, shadeCanopy, fan, scanner, lungs.userData.needle, thermoMercury, filterBead,
    towerWater, towerSurface, towerMeniscus, pumpRotor, gantry, scanBar,
    ...Object.values(badges), ...Object.values(barriers), ...servos, ...intakeFins, ...specks, ...ribbons,
    ...towerBubbles, ...crops, ...drops, ...wets, ...sortJobs, ...bayFills, ...lids, ...ripples, ...glints,
    ...pulses, ...charges, ...fronds, ...clouds,
    ...movingRoofs.flatMap((roof) => [roof.pivot, ...(roof.slats || [])]),
    ...drips.flatMap((drip) => drip.beads),
    ...fountains.flatMap((jet) => jet.beads),
  ]);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let down = null;
  const onDown = (event) => {
    down = { x: event.clientX, y: event.clientY };
  };
  const onUp = (event) => {
    if (!down) return;
    const moved = (event.clientX - down.x) ** 2 + (event.clientY - down.y) ** 2;
    down = null;
    if (moved > 36) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(scene.children, true).find((item) => item.object.userData.id);
    if (hit?.object.userData.id) onSelect(hit.object.userData.id);
  };
  renderer.domElement.addEventListener("pointerdown", onDown);
  renderer.domElement.addEventListener("pointerup", onUp);

  const resize = () => {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (width < 2 || height < 2) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();

  const tour = new THREE.CatmullRomCurve3([
    new THREE.Vector3(4.6, 9.2, 12.4),
    new THREE.Vector3(-3.2, 9.4, 11.6),
    new THREE.Vector3(-9.2, 8.4, 5.2),
    new THREE.Vector3(-5.4, 8.8, -3.2),
    new THREE.Vector3(5.2, 8.6, 0.8),
    new THREE.Vector3(8.4, 9.0, 8.6),
  ], true);
  const tourLook = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.15, -0.15),
    new THREE.Vector3(-0.5, 0.25, -0.1),
    new THREE.Vector3(-0.2, 0.3, 0.4),
    new THREE.Vector3(0.3, 0.25, 0.15),
    new THREE.Vector3(0.15, 0.2, -0.25),
    new THREE.Vector3(0, 0.15, 0),
  ], true);
  let viewMode = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "free" : "tour";
  let focusKey = 0;
  const closeViews = {
    brain: { pos: new THREE.Vector3(1.15, 2.7, 3.15), look: new THREE.Vector3(-0.15, 0.45, 0.55) },
    heart: { pos: new THREE.Vector3(-2.35, 2.85, 1.15), look: new THREE.Vector3(-3.95, 0.82, -0.22) },
    lungs: { pos: new THREE.Vector3(-1.55, 1.35, -1.25), look: new THREE.Vector3(-3.65, 0.95, -2.95) },
    skin: { pos: new THREE.Vector3(2.05, 1.55, -1.05), look: new THREE.Vector3(0.2, 0.72, -3.05) },
    kidneys: { pos: new THREE.Vector3(5.85, 2.45, -0.55), look: new THREE.Vector3(4.3, 1.05, -2.85) },
    digestive: { pos: new THREE.Vector3(1.55, 1.25, 5.45), look: new THREE.Vector3(0.15, 0.32, 3.92) },
    liver: { pos: new THREE.Vector3(-5.15, 1.9, 4.55), look: new THREE.Vector3(-5.15, 0.62, 1.9) },
    skeleton: { pos: new THREE.Vector3(-6.55, 0.95, 6.05), look: new THREE.Vector3(-5.15, 0.34, 5.26) },
  };
  controls.addEventListener("start", () => {
    viewMode = "free";
  });

  let alive = true;
  let frames = 0;
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (!alive || document.hidden) return;
    frames += 1;
    if (frames % 6 === 0) renderer.shadowMap.needsUpdate = true;
    const dt = Math.min(0.05, clock.getDelta());
    const state = getState() || {};
    const live = state.live || {};
    const selected = state.selected || "brain";
    Object.entries(badges).forEach(([id, sprite]) => {
      const close = (state.focusTick || 0) > 0;
      sprite.visible = !close;
      const size = id === selected ? 0.64 : 0.46;
      sprite.scale.set(size, size, 1);
    });
    if (shadeCanopy) {
      const tilt = live.shade ? -0.28 : -0.05;
      shadeCanopy.rotation.x += (tilt - shadeCanopy.rotation.x) * Math.min(1, dt * 2);
    }
    fan.rotation.x += dt * (live.fanOn ? 14 : 0.4);
    const hornAngle = live.shade ? 1.15 : 0.2;
    servos.forEach((horn) => {
      horn.rotation.z += (hornAngle - horn.rotation.z) * Math.min(1, dt * 3);
    });
    const finAngle = live.fanOn ? 0.85 : 0.06;
    intakeFins.forEach((fin) => {
      fin.rotation.y += (finAngle - fin.rotation.y) * Math.min(1, dt * 5);
    });
    specks.forEach((speck) => {
      speck.userData.t = (speck.userData.t + dt * (live.fanOn ? 0.45 : 0.08)) % 1;
      speck.position.x = 0.72 + speck.userData.t * 1.25;
      speck.visible = !live.fanOn || speck.userData.t < 0.42;
    });
    if (scanner) scanner.rotation.y = clock.elapsedTime * (state.live ? 0.9 : 0.3);
    const gain = Math.max(0, Math.min(1, (state.solar || 0) / 4));
    const sunTilt = -0.16 - gain * 0.2;
    movingRoofs.forEach((roof) => {
      const wave = Math.sin(clock.elapsedTime * 0.5 + roof.phase);
      if (roof.slats) {
        const angle = live.shade ? 1.05 : 0.08 + wave * 0.05;
        roof.slats.forEach((slat) => {
          slat.rotation.x += (angle - slat.rotation.x) * Math.min(1, dt * 1.8);
        });
        roof.slats.sync?.();
        return;
      }
      const target = roof.kind === "solar" ? sunTilt - wave * 0.05 : -0.12 - wave * 0.2;
      roof.pivot.rotation.x += (target - roof.pivot.rotation.x) * Math.min(1, dt * 1.6);
    });
    ribbons.forEach((bit, index) => {
      const wave = Math.sin(clock.elapsedTime * (live.fanOn ? 7 : 1.2) + index * 0.7);
      bit.position.y = 0.95 + wave * (live.fanOn ? 0.07 : 0.012);
      bit.rotation.z = wave * (live.fanOn ? 0.55 : 0.06);
    });
    if (lungs.userData.needle) lungs.userData.needle.rotation.z = live.fanOn ? -0.8 + Math.sin(clock.elapsedTime * 6) * 0.25 : -0.15;
    if (civic.userData.shadeLamp) civic.userData.shadeLamp.emissiveIntensity = live.shade ? 1.35 : 0.06;
    if (civic.userData.pumpLamp) civic.userData.pumpLamp.emissiveIntensity = live.pump ? 1.25 : 0.06;
    if (hubLampMat) hubLampMat.emissiveIntensity = 0.12 + gain * 1.5;
    solarFaces.forEach((face) => {
      face.emissiveIntensity = 0.06 + gain * 0.72 + Math.sin(clock.elapsedTime * 2.6) * 0.06 * gain;
    });
    if (shaftMat) shaftMat.opacity = 0.1 + gain * 0.28;
    sun.intensity = 0.68 + gain * 0.42;
    sunGlow.material.opacity = 0.72 + gain * 0.28;
    linkCore.color.setHex(gain > 0.08 ? 0xffe2a2 : 0xe8f7ff);
    if (thermoMercury) {
      const heat = Math.max(0.28, Math.min(1, ((state.temp ?? 30) - 20) / 28));
      thermoMercury.scale.y = heat;
      thermoMercury.position.y = 0.14 + heat * 0.2;
    }
    if (filterBead) {
      const cleaning = Boolean(live.pump);
      filterBead.visible = true;
      filterBead.userData.t = ((filterBead.userData.t || 0) + dt * (cleaning ? 0.55 : 0.18)) % 1;
      filterBead.position.x = -0.32 + filterBead.userData.t * 0.64;
    }
    const level = Math.max(0.08, Math.min(1, (state.reservoir ?? 18) / 20));
    const waterTop = 0.38 + 1.15 * level;
    towerWater.scale.y = level;
    towerWater.position.y = 0.38 + (1.15 * level) / 2;
    if (towerSurface) towerSurface.position.y = waterTop;
    if (towerMeniscus) towerMeniscus.position.y = waterTop;
    towerBubbles.forEach((bubble) => {
      const rise = live.pump ? 0.28 : 0.05;
      bubble.userData.t = (bubble.userData.t + dt * rise) % 1;
      bubble.position.y = 0.5 + bubble.userData.t * Math.max(0.2, waterTop - 0.55);
      bubble.visible = bubble.position.y < waterTop - 0.02;
    });
    const growth = 0.92 + Math.min(8, state.growth || 1) * 0.05;
    crops.forEach((plant, index) => {
      plant.scale.setScalar(growth);
      plant.rotation.z = Math.sin(clock.elapsedTime * 1.4 + index * 0.4) * 0.08;
    });
    const flowing = Boolean(live.pump && state.roads?.south !== false);
    const blocked = Boolean(live.pump && state.roads?.south === false);
    const speed = blocked ? 0 : flowing ? 0.48 : 0.2;
    drops.forEach((drop) => {
      drop.userData.t = (drop.userData.t + dt * speed) % 1;
      pointOnFlow(drop.userData.t, drop.position);
      drop.visible = !blocked && drop.position.y > 0.06;
      drop.scale.setScalar(flowing ? 1.2 : 0.85);
    });
    if (pumpRotor) pumpRotor.rotation.y += dt * (flowing ? 9 : 1.6);
    wetMat.opacity = flowing ? 0.34 + Math.sin(clock.elapsedTime * 3) * 0.08 : 0.42;
    wets.forEach((wet) => {
      wet.visible = flowing;
    });
    drips.forEach((drip) => {
      const rate = flowing ? 1.8 : 0.65;
      drip.beads.forEach((bead, index) => {
        bead.visible = flowing || index === 0;
        const k = (clock.elapsedTime * rate + drip.phase + index * 0.28) % 1;
        bead.position.y = drip.y - k * (flowing ? 0.14 : 0.08);
        bead.scale.setScalar(flowing ? 1 - k * 0.35 : 0.7);
      });
    });
    const sortX = [-0.4, 0, 0.4];
    const sortStep = 3.4;
    const sortTime = clock.elapsedTime / sortStep;
    const sortBay = Math.floor(sortTime) % 3;
    const phase = sortTime - Math.floor(sortTime);
    const glide = Math.min(1, phase / 0.48);
    const drop = phase < 0.48 ? 0 : Math.min(1, (phase - 0.48) / 0.22);
    const finished = phase > 0.78;
    const targetX = sortX[sortBay];
    const itemX = -0.62 + (targetX + 0.62) * glide;
    const itemY = 0.56 - drop * 0.24;
    const itemZ = 0.38 - drop * 0.14;
    sortJobs.forEach((item, index) => {
      item.visible = index === sortBay && !finished;
      if (index === sortBay) item.position.set(itemX, itemY, itemZ);
    });
    if (gantry) gantry.position.x += (itemX - gantry.position.x) * Math.min(1, dt * 8);
    if (beltScroll) beltScroll.offset.x = (clock.elapsedTime * 0.18) % 1;
    if (scanBar) scanBar.scale.y = 0.35 + Math.abs(Math.sin(clock.elapsedTime * 10)) * 0.65;
    if (finished && !sortJobs.counted) {
      const fill = bayFills[sortBay];
      if (fill) {
        fill.userData.level = (fill.userData.level || 0.25) + 0.2;
        if (fill.userData.level > 1) fill.userData.level = 0.25;
        fill.scale.y = fill.userData.level;
        fill.position.y = 0.06 + fill.userData.level * 0.1;
      }
      sortJobs.counted = true;
    }
    if (!finished) sortJobs.counted = false;
    bayLamps.forEach((material, index) => {
      material.emissiveIntensity = index === sortBay ? 1.15 : 0.04;
    });
    lids.forEach((lid, index) => {
      const open = index === sortBay && drop > 0.05 ? -0.62 : -0.04;
      lid.rotation.x += (open - lid.rotation.x) * Math.min(1, dt * 6);
    });
    Object.entries(leds).forEach(([id, material]) => {
      const closed = state.roads?.[id] === false;
      const need = state.demands?.[id] || 0;
      const got = live.served?.[id] || 0;
      const lit = !closed && (!state.live || got + 0.05 >= need);
      material.emissiveIntensity = lit ? 1.15 : 0.02;
      material.color.setHex(lit ? 0xffe1a8 : 0x6a655c);
    });
    Object.entries(barriers).forEach(([id, mesh]) => {
      mesh.visible = state.roads?.[id] === false;
    });
    fountains.forEach((jet) => {
      jet.beads.forEach((drop) => {
        drop.userData.t = (drop.userData.t + dt * 1.15) % 1;
        const k = drop.userData.t;
        const arc = Math.sin(k * Math.PI);
        drop.position.set(
          jet.x + Math.cos(drop.userData.angle) * arc * 0.08,
          0.1 + arc * 0.78,
          jet.z + Math.sin(drop.userData.angle) * arc * 0.06,
        );
        drop.scale.setScalar(0.55 + (1 - k) * 0.7);
      });
    });
    ripples.forEach((ring) => {
      ring.userData.t = (ring.userData.t + dt * 0.28) % 1;
      const k = ring.userData.t;
      const span = 0.5 + k * ring.userData.reach * 8;
      ring.scale.set(span, span, span);
      ring.material.opacity = (1 - k) * 0.5;
    });
    glints.forEach((glint) => {
      glint.userData.t = (glint.userData.t + dt * 0.12) % 1;
      const home = glint.userData.home;
      const drift = home.drift || 1;
      glint.position.x = home.x + drift * (-home.w * 0.28 + glint.userData.t * home.w * 0.56);
      glint.position.z = home.z;
    });
    pulses.forEach((bead) => {
      bead.visible = gain > 0.05;
      bead.userData.t = (bead.userData.t + dt * (0.12 + gain * 0.55)) % 1;
      const from = bead.userData.a;
      const to = bead.userData.b;
      bead.position.set(
        from.x + (to.x - from.x) * bead.userData.t,
        0.08,
        from.z + (to.z - from.z) * bead.userData.t,
      );
    });
    charges.forEach((bead) => {
      bead.visible = gain > 0.05;
      bead.userData.t = (bead.userData.t + dt * (0.22 + gain * 0.45)) % 1;
      bead.position.lerpVectors(bead.userData.from, bead.userData.to, bead.userData.t);
      const nearPanel = bead.userData.t > 0.82 ? 1.35 : 1;
      bead.scale.setScalar(nearPanel);
    });
    reflectRoofMat.roughness = 0.14 + (Math.sin(clock.elapsedTime * 0.7) + 1) * 0.03;
    const flowRate = flowing ? 0.14 : 0.05;
    waterTex.offset.x = (clock.elapsedTime * flowRate) % 1;
    waterTex.offset.y = (clock.elapsedTime * flowRate * 0.45) % 1;
    facadeMats.forEach((material, index) => {
      material.emissiveIntensity = 0.5 + (Math.sin(clock.elapsedTime * 1.2 + index * 1.6) + 1) * 0.18;
    });
    const sway = clock.elapsedTime;
    fronds.forEach((pivot, index) => {
      pivot.rotation.z = pivot.userData.rest + Math.sin(sway * 1.25 + index * 0.35) * 0.09;
    });
    lampGlowMat.opacity = 0.34 + (Math.sin(sway * 1.8) + 1) * 0.12;
    bulbMat.color.setHex(0xffd08a);
    clouds.forEach((cloud) => {
      const travel = (sway * cloud.userData.speed) % 1;
      cloud.position.x = cloud.userData.base + Math.sin(travel * Math.PI * 2) * cloud.userData.span;
    });
    const sunPulse = 1 + Math.sin(sway * 0.7) * 0.04;
    sunGlow.scale.set(8.5 * sunPulse, 8.5 * sunPulse, 1);
    waterMat.emissiveIntensity = 0.18 + Math.sin(sway * 0.9) * 0.05;
    const tick = state.focusTick || 0;
    if (tick !== focusKey) {
      focusKey = tick;
      if (tick > 0) viewMode = "focus";
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (viewMode === "tour") {
      const t = (clock.elapsedTime / 16) % 1;
      camera.position.copy(tour.getPointAt(t));
      const look = tourLook.getPointAt(t);
      camera.lookAt(look);
      controls.target.copy(look);
    } else if (viewMode === "focus") {
      const view = closeViews[selected] || closeViews.brain;
      if (reduceMotion) {
        camera.position.copy(view.pos);
        controls.target.copy(view.look);
        viewMode = "free";
      } else {
        const glide = 1 - Math.pow(0.015, dt);
        camera.position.lerp(view.pos, glide);
        controls.target.lerp(view.look, glide);
      }
      camera.lookAt(controls.target);
    } else {
      controls.update();
    }
    renderer.render(scene, camera);
  });

  return {
    dispose() {
      alive = false;
      renderer.setAnimationLoop(null);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerup", onUp);
      controls.dispose();
      roofEnv.dispose();
      reflectRoofMat.dispose();
      textures.forEach((texture) => texture.dispose());
      scene.traverse((object) => {
        object.geometry?.dispose();
        const material = object.material;
        if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
        else material?.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

function sharpen(texture) {
  texture.anisotropy = 16;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function bakeStatic(scene, moving) {
  const animated = new Set(moving.filter(Boolean));
  const anchorOf = (mesh) => {
    if (animated.has(mesh)) return null;
    for (let node = mesh.parent; node; node = node.parent) {
      if (!node.visible) return null;
      if (node === scene || animated.has(node)) return node;
    }
    return null;
  };
  scene.updateMatrixWorld(true);
  const buckets = new Map();
  scene.traverse((mesh) => {
    if (!mesh.isMesh || mesh.isInstancedMesh || !mesh.visible || Array.isArray(mesh.material)) return;
    if (mesh.material.transparent || mesh.renderOrder !== 0 || mesh.children.length) return;
    const anchor = anchorOf(mesh);
    if (!anchor) return;
    const local = new THREE.Matrix4().copy(anchor.matrixWorld).invert().multiply(mesh.matrixWorld);
    if (local.determinant() < 0) return;
    const geometry = mesh.geometry;
    if (Object.keys(geometry.morphAttributes).length) return;
    const key = [
      anchor.uuid,
      mesh.material.uuid,
      mesh.castShadow,
      mesh.receiveShadow,
      mesh.userData.id || "",
      Object.keys(geometry.attributes).sort().join(","),
      geometry.index ? "i" : "n",
    ].join("|");
    if (!buckets.has(key)) buckets.set(key, { anchor, meshes: [], matrices: [] });
    const bucket = buckets.get(key);
    bucket.meshes.push(mesh);
    bucket.matrices.push(local);
  });
  buckets.forEach(({ anchor, meshes, matrices }) => {
    if (meshes.length < 2) return;
    const parts = meshes.map((mesh, index) => mesh.geometry.clone().applyMatrix4(matrices[index]));
    const merged = mergeGeometries(parts, false);
    parts.forEach((part) => part.dispose());
    if (!merged) return;
    const first = meshes[0];
    const baked = new THREE.Mesh(merged, first.material);
    baked.castShadow = first.castShadow;
    baked.receiveShadow = first.receiveShadow;
    if (first.userData.id) baked.userData.id = first.userData.id;
    meshes.forEach((mesh) => mesh.removeFromParent());
    anchor.add(baked);
  });
}

function paintFacade(hex) {
  const mapCanvas = document.createElement("canvas");
  mapCanvas.width = 512;
  mapCanvas.height = 512;
  const paint = mapCanvas.getContext("2d");
  paint.fillStyle = hex;
  paint.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i += 1) {
    const shade = 210 + Math.random() * 40;
    paint.fillStyle = `rgba(${shade}, ${shade - 4}, ${shade - 10}, 0.14)`;
    paint.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  paint.fillStyle = "rgba(232, 220, 204, 0.4)";
  paint.fillRect(0, 448, 512, 64);
  paint.fillStyle = "rgba(255, 252, 246, 0.85)";
  paint.fillRect(0, 28, 512, 14);
  paint.fillStyle = "rgba(90, 78, 68, 0.18)";
  paint.fillRect(0, 42, 512, 4);
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = 512;
  glowCanvas.height = 512;
  const glow = glowCanvas.getContext("2d");
  glow.fillStyle = "#000";
  glow.fillRect(0, 0, 512, 512);
  const cols = 4;
  const rows = 3;
  const marginX = 26;
  const gapX = 16;
  const gapY = 18;
  const top = 56;
  const bottom = 468;
  const cellW = (512 - marginX * 2 - gapX * (cols - 1)) / cols;
  const cellH = (bottom - top - gapY * (rows - 1)) / rows;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = marginX + col * (cellW + gapX);
      const y = top + row * (cellH + gapY);
      paint.fillStyle = "#2c2926";
      paint.fillRect(x - 6, y - 6, cellW + 12, cellH + 12);
      const glass = paint.createLinearGradient(x, y, x, y + cellH);
      glass.addColorStop(0, "#fffaf2");
      glass.addColorStop(1, "#f3ddb4");
      paint.fillStyle = glass;
      paint.fillRect(x, y, cellW, cellH);
      paint.fillStyle = "rgba(255,255,255,0.7)";
      paint.fillRect(x + 3, y + 3, Math.max(3, cellW * 0.16), cellH - 6);
      paint.fillStyle = "#2c2926";
      paint.fillRect(x + cellW * 0.5 - 1.5, y, 3, cellH);
      paint.fillRect(x, y + cellH * 0.46, cellW, 3);
      paint.fillStyle = "#f7f1e8";
      paint.fillRect(x - 8, y + cellH, cellW + 16, 6);
      glow.fillStyle = "#fff";
      glow.fillRect(x, y, cellW, cellH);
      glow.fillStyle = "#000";
      glow.fillRect(x + cellW * 0.5 - 1.5, y, 3, cellH);
      glow.fillRect(x, y + cellH * 0.46, cellW, 3);
    }
  }
  const map = sharpen(new THREE.CanvasTexture(mapCanvas));
  const emissive = sharpen(new THREE.CanvasTexture(glowCanvas));
  map.colorSpace = THREE.SRGBColorSpace;
  emissive.colorSpace = THREE.SRGBColorSpace;
  return { map, emissive };
}

function makePlaster() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i += 1) {
    const shade = 215 + Math.random() * 40;
    ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.18)`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  const texture = sharpen(new THREE.CanvasTexture(canvas));
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeGround(textures) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f7f1e6";
  ctx.fillRect(0, 0, 512, 512);
  const tile = 86;
  for (let y = 0; y < 512; y += tile) {
    for (let x = 0; x < 512; x += tile) {
      const shift = (y / tile) % 2 ? tile / 2 : 0;
      const tone = 236 + Math.random() * 14;
      ctx.fillStyle = `rgb(${tone}, ${tone - 6}, ${tone - 16})`;
      ctx.fillRect(x + shift, y, tile - 6, tile - 6);
    }
  }
  const texture = sharpen(new THREE.CanvasTexture(canvas));
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  textures.push(texture);
  return texture;
}

function makeSky() {
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const sky = ctx.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, "#6aafd6");
  sky.addColorStop(0.22, "#c5ddf0");
  sky.addColorStop(0.48, "#f7e7d0");
  sky.addColorStop(1, "#f4e7d2");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 8, 512);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeSunGlow() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const glow = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
  glow.addColorStop(0, "rgba(255, 250, 230, 1)");
  glow.addColorStop(0.18, "rgba(255, 226, 150, 0.95)");
  glow.addColorStop(0.42, "rgba(255, 206, 120, 0.35)");
  glow.addColorStop(1, "rgba(255, 206, 120, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeCloud() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  const puff = (x, y, r, color) => {
    const wash = ctx.createRadialGradient(x, y, r * 0.15, x, y, r);
    wash.addColorStop(0, color);
    wash.addColorStop(0.62, "rgba(255,255,255,0.28)");
    wash.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = wash;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  puff(70, 98, 42, "rgba(236, 242, 246, 0.35)");
  puff(124, 86, 56, "rgba(255, 255, 255, 0.95)");
  puff(178, 100, 40, "rgba(214, 224, 232, 0.4)");
  puff(104, 108, 28, "rgba(255, 255, 255, 0.8)");
  puff(150, 104, 26, "rgba(255, 255, 255, 0.75)");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeAsphalt() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#3a3c38";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2200; i += 1) {
    const shade = 30 + Math.random() * 55;
    ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade - 4}, 0.35)`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 3, 1 + Math.random() * 2);
  }
  const texture = sharpen(new THREE.CanvasTexture(canvas));
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeSolar() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 296;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#10161e";
  ctx.fillRect(0, 0, 512, 296);
  const cols = 6;
  const rows = 4;
  const gap = 8;
  const cellW = (512 - gap * (cols + 1)) / cols;
  const cellH = (296 - gap * (rows + 1)) / rows;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = gap + col * (cellW + gap);
      const y = gap + row * (cellH + gap);
      const tone = 22 + ((row * 3 + col) % 4) * 6;
      const cell = ctx.createLinearGradient(x, y, x + cellW, y + cellH);
      cell.addColorStop(0, `rgb(${tone + 24}, ${tone + 70}, ${tone + 128})`);
      cell.addColorStop(0.55, `rgb(${tone + 8}, ${tone + 48}, ${tone + 102})`);
      cell.addColorStop(1, `rgb(${tone}, ${tone + 32}, ${tone + 78})`);
      ctx.fillStyle = cell;
      ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
      ctx.fillStyle = "rgba(230, 240, 248, 0.9)";
      ctx.fillRect(x + 5, y + cellH * 0.34, cellW - 10, 2);
      ctx.fillRect(x + 5, y + cellH * 0.66, cellW - 10, 2);
      ctx.fillStyle = "rgba(190, 210, 226, 0.55)";
      for (let finger = 1; finger <= 7; finger += 1) {
        const fx = x + (cellW * finger) / 8;
        ctx.fillRect(fx, y + 4, 1, cellH - 8);
      }
      ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
      ctx.fillRect(x + 2, y + 2, cellW * 0.28, 2);
    }
  }
  const texture = sharpen(new THREE.CanvasTexture(canvas));
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeWater() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const base = ctx.createLinearGradient(0, 0, 512, 512);
  base.addColorStop(0, "#b7e6f2");
  base.addColorStop(0.5, "#6eb8d0");
  base.addColorStop(1, "#3d8eab");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 28; i += 1) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const radius = 18 + Math.random() * 46;
    const glow = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius);
    glow.addColorStop(0, "rgba(255,255,255,0.28)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 16; i += 1) {
    const y = 12 + i * 32;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(120, y - 10, 260, y + 12, 512, y - 4);
    ctx.stroke();
  }
  const texture = sharpen(new THREE.CanvasTexture(canvas));
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeBrush() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#e7eeef";
  ctx.fillRect(0, 0, 512, 512);
  for (let x = 0; x <= 512; x += 64) {
    ctx.fillStyle = "rgba(90,110,120,0.35)";
    ctx.fillRect(x, 0, 4, 512);
  }
  for (let y = 0; y < 512; y += 8) {
    const shade = 180 + Math.random() * 60;
    ctx.strokeStyle = `rgba(${shade}, ${shade + 8}, ${shade + 12}, 0.85)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(0, 40, 512, 10);
  const texture = sharpen(new THREE.CanvasTexture(canvas));
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeLabel() {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 2048, 128);
  ctx.fillStyle = "#f4f1ea";
  ctx.font = "600 72px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SUSTAINABLE OMAN 2040   —   THE LIVING CITY", 1024, 64);
  const texture = sharpen(new THREE.CanvasTexture(canvas));
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeLeaf(textures) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 128, 64);
  const leaf = ctx.createLinearGradient(0, 0, 128, 0);
  leaf.addColorStop(0, "#3f6a32");
  leaf.addColorStop(0.45, "#7eaa52");
  leaf.addColorStop(1, "#c5de9a");
  ctx.fillStyle = leaf;
  ctx.beginPath();
  ctx.moveTo(8, 32);
  ctx.quadraticCurveTo(40, 4, 118, 32);
  ctx.quadraticCurveTo(40, 60, 8, 32);
  ctx.fill();
  ctx.strokeStyle = "rgba(40,70,28,0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(14, 32);
  ctx.lineTo(108, 32);
  ctx.stroke();
  for (let i = 0; i < 5; i += 1) {
    const x = 28 + i * 14;
    ctx.beginPath();
    ctx.moveTo(x, 32);
    ctx.lineTo(x + 10, 16);
    ctx.moveTo(x, 32);
    ctx.lineTo(x + 10, 48);
    ctx.stroke();
  }
  const texture = sharpen(new THREE.CanvasTexture(canvas));
  texture.colorSpace = THREE.SRGBColorSpace;
  textures.push(texture);
  return texture;
}

function makeSoil(textures) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#6b4630";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 500; i += 1) {
    const tone = 70 + Math.random() * 50;
    ctx.fillStyle = `rgba(${tone + 20}, ${tone}, ${tone - 15}, 0.55)`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 5, 2);
  }
  ctx.strokeStyle = "rgba(42,24,14,0.55)";
  ctx.lineWidth = 5;
  for (let y = 18; y < 256; y += 28) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y + 3);
    ctx.stroke();
  }
  const texture = sharpen(new THREE.CanvasTexture(canvas));
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  textures.push(texture);
  return texture;
}
