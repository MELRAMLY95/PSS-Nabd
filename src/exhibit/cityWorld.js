import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const BASE_W = 16.8;
const BASE_D = 11.2;

export function mountCity(host, { getState, onSelect, onHover, onAction }) {
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
  controls.target.set(0, 0.15, -0.15);  controls.enableDamping = true;
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
  const caustics = makeCaustics();
  const waterNormal = makeWaterNormal();
  textures.push(caustics, waterNormal);
  waterMat.normalMap = waterNormal;
  waterMat.normalScale = new THREE.Vector2(0.6, 0.6);
  const waterClear = new THREE.Color(0xb7e4ef);
  const waterMurky = new THREE.Color(0xc2b48e);
  const poolFloorMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: caustics,
    emissive: 0x8fe2ff,
    emissiveMap: caustics,
    emissiveIntensity: 0.3,
    roughness: 0.82,
  });
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
  const wetSoilMap = gardenSoil.map;
  const drySoilMap = makeDrySoil(textures);
  const soilDry = new THREE.Color(0xffffff);
  const soilWet = new THREE.Color(0x8a7466);
  const dateMat = new THREE.MeshStandardMaterial({ color: 0xb8742c, roughness: 0.5 });
  const trunkRingMat = new THREE.MeshStandardMaterial({ color: 0x6e4f33, roughness: 0.92 });
  const ghafLeaf = new THREE.MeshStandardMaterial({ color: 0x7c9a52, roughness: 0.75, flatShading: true });
  const ghafDeep = new THREE.MeshStandardMaterial({ color: 0x5b7a3d, roughness: 0.8, flatShading: true });
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
  metalMat.envMap = roofEnv;
  metalMat.envMapIntensity = 0.5;
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

  const ridgeMats = [];
  const foothillMat = new THREE.MeshBasicMaterial({ color: 0xf4e7d2 });
  foothillMat.userData.day = new THREE.Color(0xf4e7d2);
  ridgeMats.push(foothillMat);
  const foothills = new THREE.Mesh(new THREE.CircleGeometry(70, 64), foothillMat);
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
    const material = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    material.userData.day = new THREE.Color(color);
    ridgeMats.push(material);
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), material);
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
  const rayHits = [];
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

  const roofCool = new THREE.Color(0xe9e4da);
  const roofHot = new THREE.Color(0xd9824a);
  const roofHeatMat = new THREE.MeshStandardMaterial({ color: 0xe9e4da, emissive: 0xff7a3a, emissiveIntensity: 0, roughness: 0.6 });
  const louvreLedMat = new THREE.MeshBasicMaterial({ color: 0xffc56a });
  function louvreBank(span, depth, onRoof = true) {
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
    if (onRoof) {
      const membrane = new THREE.Mesh(new THREE.PlaneGeometry(span, depth), roofHeatMat);
      membrane.rotation.x = -Math.PI / 2;
      membrane.position.y = -0.036;
      membrane.receiveShadow = true;
      bank.add(membrane);
    }
    const servo = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.05), frameMat);
    servo.position.set(span / 2 + 0.035, 0, -depth / 2 - 0.02);
    bank.add(servo);
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), louvreLedMat);
    led.position.set(span / 2 + 0.035, 0.028, -depth / 2 - 0.02);
    bank.add(led);
    const rod = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.008, depth * 0.92), metalMat);
    rod.position.set(span / 2 - 0.03, 0.03, 0);
    bank.add(rod);
    slats.rod = rod;
    slats.sync = () => {
      let total = 0;
      slats.forEach((hinge, index) => {
        hinge.updateMatrix();
        blades.setMatrixAt(index, hinge.matrix);
        total += hinge.rotation.x;
      });
      blades.instanceMatrix.needsUpdate = true;
      const swing = Math.max(0, 1.32 - total / slats.length);
      rod.position.z = -swing * pitch * 0.45;
      rod.position.y = 0.03 - swing * 0.012;
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
    group.rotation.y = ((x * 7.3 + z * 3.1) % (Math.PI * 2));
    const lean = 0.05 + (Math.abs(x * 13 + z * 7) % 5) * 0.012;
    const joints = Array.from({ length: 6 }, (_, i) => {
      const t = i / 5;
      return new THREE.Vector3(lean * t ** 1.7, t * 0.64, 0);
    });
    for (let i = 0; i < 5; i += 1) {
      const from = joints[i];
      const to = joints[i + 1];
      const dir = to.clone().sub(from);
      const bottom = 0.042 - i * 0.0048;
      const segment = new THREE.Mesh(new THREE.CylinderGeometry(bottom - 0.005, bottom, dir.length(), 7), trunkMat);
      segment.position.copy(from).add(to).multiplyScalar(0.5);
      segment.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      segment.castShadow = true;
      group.add(segment);
      if (i > 0) {
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(bottom + 0.004, bottom + 0.004, 0.018, 7), trunkRingMat);
        ring.position.copy(from);
        ring.quaternion.copy(segment.quaternion);
        group.add(ring);
      }
    }
    const top = joints[5];
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.038, 7, 5), leafDeep);
    crown.position.copy(top);
    group.add(crown);
    for (let c = 0; c < 2; c += 1) {
      const angle = c * Math.PI + 0.6;
      for (let d = 0; d < 5; d += 1) {
        const date = new THREE.Mesh(cropGeos.fruit, dateMat);
        date.scale.setScalar(0.55);
        date.position.set(
          top.x + Math.cos(angle) * 0.04 + (d % 2) * 0.012,
          top.y - 0.035 - d * 0.011,
          Math.sin(angle) * 0.04 + ((d * 7) % 3) * 0.006,
        );
        group.add(date);
      }
    }
    const head = new THREE.Group();
    head.position.copy(top);
    head.userData.rest = 0;
    fronds.push(head);
    group.add(head);
    const count = 9;
    for (let i = 0; i < count; i += 1) {
      const pivot = new THREE.Group();
      pivot.rotation.y = (i / count) * Math.PI * 2 + (i % 2) * 0.2;
      pivot.rotation.z = i % 3 === 0 ? 0.25 : -0.32 - (i % 2) * 0.14;
      const tip = new THREE.Group();
      tip.position.x = 0.13;
      tip.rotation.z = -0.62;
      pivot.add(tip);
      [[pivot, 0.13], [tip, 0.11]].forEach(([holder, length]) => {
        const rachis = new THREE.Mesh(new THREE.BoxGeometry(length, 0.006, 0.006), stemMat);
        rachis.position.x = length / 2;
        holder.add(rachis);
        const pairs = Math.round(length / 0.026);
        for (let k = 0; k < pairs; k += 1) {
          const along = (k + 0.6) / pairs;
          const size = 0.85 - along * 0.35;
          [-1, 1].forEach((side) => {
            const leaflet = new THREE.Mesh(cropGeos.tip, cropLeaf);
            leaflet.scale.set(size * 0.72, size * 0.85, 1);
            leaflet.position.set(along * length, -0.006, side * 0.035 * size);
            leaflet.rotation.set(side * 0.55, side * -1.05, -0.35);
            holder.add(leaflet);
          });
        }
      });
      head.add(pivot);
    }
    scene.add(group);
  }

  function ghaf(x, z, scale = 1) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.scale.setScalar(scale);
    group.rotation.y = (x * 2.3 + z) % (Math.PI * 2);
    [[-0.05, 0.22], [0.06, -0.18]].forEach(([dx, tilt], index) => {
      const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.03, 0.4, 6), trunkMat);
      limb.position.set(dx * 0.6, 0.19, index * 0.02);
      limb.rotation.z = tilt;
      limb.castShadow = true;
      group.add(limb);
    });
    const puffs = [
      [0, 0.42, 0, 0.17], [-0.13, 0.38, 0.07, 0.13], [0.14, 0.39, -0.05, 0.14],
      [0.04, 0.36, 0.15, 0.12], [-0.06, 0.37, -0.14, 0.12], [0.1, 0.47, 0.08, 0.1], [-0.1, 0.46, -0.04, 0.1],
    ];
    puffs.forEach(([px, py, pz, radius], index) => {
      const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 1), index % 2 ? ghafDeep : ghafLeaf);
      puff.position.set(px, py, pz);
      puff.scale.y = 0.62;
      puff.castShadow = true;
      group.add(puff);
    });
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
  const pulseMat = new THREE.MeshBasicMaterial({ color: 0xfff6d0 });
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
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 6), pulseMat);
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
    [-4.4, -1.25], [0.15, -1.3], [4.0, -1.25],
    [-4.6, 1.35], [-0.9, 1.35], [1.4, 1.35], [4.2, 1.35],
    [-4.2, 2.4], [0.2, 2.95], [3.5, 3.2],
    [-6.42, -2.3], [6.0, -2.9], [6.3, 0.8],
    [-1.6, 3.05], [5.35, -3.55], [5.45, 1.55], [-6.35, 0.35], [3.9, 2.55],
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

  block({ x: -6.8, z: -3.45, w: 0.8, d: 0.72, h: 0.7, color: 0xf6f1e8 });
  block({ x: -5.3, z: -3.67, w: 0.8, d: 0.7, h: 1.02, color: 0xfaf6f1 });
  const lungs = block({
    x: -4.05, z: -3.05, w: 1.25, d: 1.05, h: 1.58, color: 0xf7f4ef, id: "lungs", faces: ["pz", "px", "nx", "nz"],
  });
  block({ x: -5.3, z: -2.45, w: 0.8, d: 0.75, h: 0.86, color: 0xfaf7f3 });
  const blueColumn = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 1.35, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x3a7eb8, emissive: 0x2a6898, emissiveIntensity: 0.35, roughness: 0.3 }),
  );
  blueColumn.position.set(-0.58, 0.75, 0.42);
  lungs.add(blueColumn);
  const ductY = 0.39;
  const ductR = 0.17;
  const concreteMat = wallMat(0xd9d2c6);
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xc9ced2, roughness: 0.38, metalness: 0.55, side: THREE.DoubleSide, envMap: roofEnv, envMapIntensity: 0.6,
  });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.05, 0.62), concreteMat);
  plinth.position.set(1.12, 0.025, 0.02);
  plinth.receiveShadow = true;
  lungs.add(plinth);
  [0.9, 1.36].forEach((x) => {
    const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.17, 0.3), steelMat);
    saddle.position.set(x, 0.135, 0);
    saddle.castShadow = true;
    lungs.add(saddle);
  });
  const duct = new THREE.Mesh(new THREE.CylinderGeometry(ductR, ductR, 0.86, 28, 1, true), glassMat);
  duct.rotation.z = Math.PI / 2;
  duct.position.set(1.06, ductY, 0);
  duct.renderOrder = 2;
  lungs.add(duct);
  [0.68, 1.06, 1.47].forEach((x) => {
    const flange = new THREE.Mesh(new THREE.TorusGeometry(ductR + 0.004, 0.013, 8, 28), steelMat);
    flange.rotation.y = Math.PI / 2;
    flange.position.set(x, ductY, 0);
    lungs.add(flange);
  });
  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.44, 0.44), steelMat);
  collar.position.set(0.645, ductY, 0);
  lungs.add(collar);
  const hood = new THREE.Mesh(new THREE.CylinderGeometry(ductR, 0.24, 0.1, 28, 1, true), steelMat);
  hood.rotation.z = Math.PI / 2;
  hood.position.set(1.54, ductY, 0);
  hood.castShadow = true;
  lungs.add(hood);
  for (let i = 0; i < 5; i += 1) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.008, 0.4 - Math.abs(i - 2) * 0.06), steelMat);
    fin.position.set(1.57, ductY + (i - 2) * 0.075, 0);
    lungs.add(fin);
    intakeFins.push(fin);
  }
  const preFilter = new THREE.Mesh(
    new THREE.CylinderGeometry(ductR - 0.006, ductR - 0.006, 0.01, 28, 1),
    new THREE.MeshBasicMaterial({ color: 0x7d858c, wireframe: true }),
  );
  preFilter.rotation.z = Math.PI / 2;
  preFilter.position.set(1.4, ductY, 0);
  lungs.add(preFilter);
  const filterMat = new THREE.MeshStandardMaterial({ color: 0xf6f3ea, roughness: 0.9 });
  lungs.userData.filterMat = filterMat;
  for (let i = 0; i < 8; i += 1) {
    const pleat = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.24, 0.2), filterMat);
    pleat.position.set(1.13 + i * 0.02, ductY, 0);
    pleat.rotation.y = i % 2 ? 0.5 : -0.5;
    lungs.add(pleat);
  }
  const fan = new THREE.Group();
  fan.position.set(0.8, ductY, 0);
  for (let i = 0; i < 5; i += 1) {
    const pivot = new THREE.Group();
    pivot.rotation.x = (i / 5) * Math.PI * 2;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.12, 0.05), whiteMat);
    blade.position.y = 0.075;
    blade.rotation.y = 0.45;
    pivot.add(blade);
    fan.add(pivot);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.05, 12), steelMat);
  hub.rotation.z = Math.PI / 2;
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.05, 12), steelMat);
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 0.05;
  fan.add(hub, nose);
  lungs.add(fan);
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.08, 12), frameMat);
  motor.rotation.z = Math.PI / 2;
  motor.position.set(0.72, ductY, 0);
  lungs.add(motor);
  const shroud = new THREE.Mesh(new THREE.TorusGeometry(ductR - 0.01, 0.01, 8, 28), steelMat);
  shroud.rotation.y = Math.PI / 2;
  shroud.position.set(0.8, ductY, 0);
  lungs.add(shroud);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.1), wallMat(0xe9e4da));
  panel.position.set(0.8, 0.13, 0.25);
  panel.castShadow = true;
  lungs.add(panel);
  const lungLed = new THREE.MeshBasicMaterial({ color: 0x7ee0b0 });
  lungs.userData.led = lungLed;
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), lungLed);
  led.position.set(0.8, 0.17, 0.302);
  lungs.add(led);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.42, 8), steelMat);
  post.position.set(1.3, 0.26, 0.27);
  lungs.add(post);
  const gauge = new THREE.Group();
  gauge.position.set(1.3, 0.5, 0.275);
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.016, 20), whiteMat);
  dial.rotation.x = Math.PI / 2;
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.007, 6, 20), steelMat);
  const redZone = new THREE.Mesh(
    new THREE.RingGeometry(0.035, 0.05, 16, 1, -0.2, 0.7),
    new THREE.MeshBasicMaterial({ color: 0xd2574a, side: THREE.DoubleSide }),
  );
  redZone.position.z = 0.009;
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.008, 0.006), new THREE.MeshStandardMaterial({ color: 0x2e2924 }));
  needle.geometry.translate(0.02, 0, 0);
  needle.position.z = 0.012;
  gauge.add(dial, bezel, redZone, needle);
  lungs.add(gauge);
  lungs.userData.needle = needle;
  const speckMat = new THREE.MeshBasicMaterial({ color: 0xb8925e });
  for (let i = 0; i < 12; i += 1) {
    const speck = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), speckMat);
    speck.userData = { t: i / 12, y: (((i * 7) % 5) - 2) * 0.045, z: (((i * 3) % 5) - 2) * 0.05, caught: i % 4 !== 3 };
    lungs.add(speck);
    specks.push(speck);
  }
  const streakMat = new THREE.MeshBasicMaterial({ color: 0xd8f7ff, transparent: true, opacity: 0.75, depthWrite: false });
  for (let i = 0; i < 6; i += 1) {
    const streak = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.006, 0.006), streakMat);
    streak.userData = { t: i / 6, y: (((i * 5) % 3) - 1) * 0.06, z: (((i * 2) % 3) - 1) * 0.06, streak: true };
    lungs.add(streak);
    specks.push(streak);
  }
  const ribbonMat = new THREE.MeshBasicMaterial({ color: 0xfff6e6, side: THREE.DoubleSide });
  [-0.15, -0.05, 0.05, 0.15].forEach((z) => {
    const pivot = new THREE.Group();
    pivot.position.set(1.62, ductY + 0.23, z);
    const bit = new THREE.Mesh(new THREE.PlaneGeometry(0.022, 0.12), ribbonMat);
    bit.position.y = -0.06;
    pivot.add(bit);
    lungs.add(pivot);
    ribbons.push(pivot);
  });
  const tubeLight = new THREE.PointLight(0x9eeaff, 0.35, 1.4);
  tubeLight.position.set(-2.95, 0.5, -2.85);
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
  const shadeBank = louvreBank(2.2, 0.26, false);
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
  civic.position.set(0.05, 0, -0.27);
  const cw = 3.55;
  const ch = 1.18;
  const cd = 1.95;
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
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.045, 1.15), whiteMat);
  wing.position.set(-cw / 2 - 0.08, 0.82, 0.15);
  wing.castShadow = true;
  civic.add(wing);
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

  [-5.2, -4.05, -2.9].forEach((x) => {
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

  shaftMat = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      intensity: { value: 0.3 },
      tint: { value: new THREE.Color(0xfff2c0) },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vUv = uv;
        vec4 view = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-view.xyz);
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform float intensity;
      uniform vec3 tint;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float facing = abs(dot(normalize(vNormal), normalize(vView)));
        float core = pow(facing, 2.2);
        float along = vUv.y;
        float ends = smoothstep(0.0, 0.18, along) * smoothstep(1.0, 0.9, along);
        float bands = 0.72 + 0.28 * sin(along * 34.0 - time * 3.6);
        float shimmer = 0.85 + 0.15 * sin(vUv.x * 40.0 + time * 1.3);
        float alpha = intensity * core * ends * bands * shimmer * (0.55 + 0.45 * along);
        gl_FragColor = vec4(tint * alpha, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const rayNoon = new THREE.Color(0xfff2c0);
  const rayDusk = new THREE.Color(0xffa45c);
  const rayHitMat = new THREE.SpriteMaterial({
    map: sunGlowMap,
    color: 0xfff0b8,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
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
    const hit = new THREE.Sprite(rayHitMat);
    hit.position.copy(catchPoint).add(new THREE.Vector3(0, 0.04, 0));
    hit.scale.set(0.7, 0.7, 1);
    hit.raycast = () => {};
    scene.add(hit);
    rayHits.push(hit);
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
  block({ x: 6.55, z: -3.65, w: 0.9, d: 0.7, h: 0.72, color: 0xfffaf6 });
  const utility = new THREE.Group();
  utility.position.set(6.55, 0, -2.2);
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
  block({ x: 4.15, z: -0.15, w: 1.2, d: 1.1, h: 0.88, color: 0xf7f3ec, faces: ["pz", "px", "nx", "nz"] });
  const pergolaHouse = block({ x: 7.6, z: 0.25, w: 0.95, d: 0.78, h: 0.68, color: 0xf8f4ee });
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
  bins.position.set(-5.07, 0, 1.9);
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

  block({ x: -7.85, z: -3.4, w: 0.75, d: 0.7, h: 0.88, color: 0xf8f4ee });
  block({ x: -7.05, z: -2.3, w: 0.7, d: 0.68, h: 0.72, color: 0xfaf7f3 });
  block({ x: -1.5, z: -3.15, w: 0.6, d: 0.85, h: 1.05, color: 0xfaf7f2 });
  block({ x: 3.0, z: -3.0, w: 0.7, d: 0.85, h: 1.05, color: 0xf7f2ea });
  block({ x: 3.0, z: 0.39, w: 0.6, d: 0.72, h: 0.8, color: 0xfaf6f1 });
  block({ x: 0.9, z: 1.82, w: 0.8, d: 0.68, h: 0.66, color: 0xf8f4ee });
  block({ x: -7.15, z: 1.8, w: 0.72, d: 0.7, h: 0.74, color: 0xfffaf6 });
  block({ x: 6.85, z: -0.75, w: 0.65, d: 0.62, h: 0.78, color: 0xf7f3ec });
  block({ x: 7.0, z: 3.5, w: 0.7, d: 0.65, h: 0.68, color: 0xfaf6f0 });

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
  gardenBed(-1.6, 4.2, 0.5, 0.48, 2, 3);
  gardenBed(3.2, 4.22, 0.85, 0.36, 4, 2);
  gardenBed(-3.55, 4.22, 0.9, 0.36, 4, 2);

  [
    [-5.45, -0.85, 0.6], [-3.45, -0.85, 0.55], [3.2, -1.0, 0.55],
    [-4.95, 0.35, 0.55], [0.0, 1.85, 0.5],
    [2.95, 1.7, 0.45], [5.25, 1.7, 0.48], [-6.6, 3.25, 0.48], [-2.15, 4.5, 0.4],
    [6.15, -0.55, 0.45],
  ].forEach(([x, z, scale]) => palm(x, z, scale));
  [
    [-7.6, 4.2, 0.85], [7.85, -1.0, 0.8], [7.7, 2.0, 0.85], [-7.6, 0.4, 0.85],
  ].forEach(([x, z, scale]) => ghaf(x, z, scale));

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
  districtLed("east", 5.25, 0.55);
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

  const pings = Array.from({ length: 10 }, () => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.42, 0.52, 40),
      new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.visible = false;
    ring.raycast = () => {};
    ring.userData.age = 9;
    scene.add(ring);
    return ring;
  });
  function ping(id, good) {
    const spot = spots[id];
    if (!spot) return;
    const ring = pings.find((item) => !item.visible) || pings.reduce((old, item) => (item.userData.age > old.userData.age ? item : old));
    ring.position.set(spot.x, 0.14, spot.z);
    ring.material.color.setHex(good ? 0xffd27a : 0xe0685a);
    ring.userData.age = 0;
    ring.visible = true;
  }

  bakeStatic(scene, [
    sunDisc, sunGlow, shadeCanopy, fan, scanner, lungs.userData.needle, thermoMercury, filterBead,
    towerWater, towerSurface, towerMeniscus, pumpRotor, gantry, scanBar,
    ...Object.values(badges), ...Object.values(barriers), ...servos, ...intakeFins, ...specks, ...ribbons,
    ...towerBubbles, ...crops, ...drops, ...wets, ...sortJobs, ...bayFills, ...lids, ...ripples, ...glints,
    ...pulses, ...charges, ...fronds, ...clouds,
    ...movingRoofs.flatMap((roof) => [roof.pivot, roof.slats?.rod, ...(roof.slats || [])]),
    ...drips.flatMap((drip) => drip.beads),
    ...fountains.flatMap((jet) => jet.beads),
  ]);

  const zoneMat = new THREE.MeshBasicMaterial({ visible: false });
  function hitZone([x, y, z], [w, h, d], id, action, hint) {
    const zone = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), zoneMat);
    zone.position.set(x, y, z);
    zone.userData = { id, action, hint };
    scene.add(zone);
  }
  hitZone([0.2, 0.15, -4.35], [1.0, 0.3, 0.42], "skeleton", { type: "road", road: "north" }, "Click to close or reopen the north road");
  hitZone([5.75, 0.15, 0.3], [0.42, 0.3, 1.0], "skeleton", { type: "road", road: "east" }, "Click to close or reopen the east road");
  hitZone([2.35, 0.15, 3.15], [0.42, 0.3, 1.0], "skeleton", { type: "road", road: "south" }, "Click to close or reopen the road to the beds");
  hitZone([4.15, 1.15, -3.15], [0.75, 2.3, 0.75], "kidneys", { type: "refill" }, "Click to refill the reservoir");
  hitZone([-2.95, 0.36, -3.03], [1.05, 0.62, 0.66], "lungs", { type: "fan" }, "Click to switch the air fan");
  hitZone([0.05, 1.32, -0.27], [cw - 0.1, 0.16, cd - 0.1], "skin", { type: "louvreMode" }, "Click to change the roof louvre mode");
  [["recyclable", -0.4], ["organic", 0], ["general", 0.4]].forEach(([bin, offset]) => {
    hitZone([-5.07 + offset, 0.35, 1.9], [0.36, 0.5, 0.5], "liver", { type: "sort", bin }, `Click to sort the next item into ${bin}`);
  });
  [["north", -3.2, -3.9], ["east", 5.25, 0.55], ["south", 2.0, 2.95]].forEach(([district, x, z]) => {
    hitZone([x, 0.2, z], [0.3, 0.4, 0.3], "heart", { type: "district", district }, `Click to switch the ${district} district load`);
  });

  const sandFog = new THREE.Fog(0xd8b98c, 60, 120);
  scene.fog = sandFog;
  const dustCount = 420;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i += 1) {
    dustPositions[i * 3] = (Math.random() - 0.5) * 18;
    dustPositions[i * 3 + 1] = 0.15 + Math.random() * 3.6;
    dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 12;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  const dustMat = new THREE.PointsMaterial({ color: 0xd6b385, size: 0.06, transparent: true, opacity: 0, depthWrite: false });
  const dustCloud = new THREE.Points(dustGeo, dustMat);
  dustCloud.visible = false;
  dustCloud.raycast = () => {};
  scene.add(dustCloud);

  const starCount = 360;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i += 1) {
    const theta = Math.random() * Math.PI * 2;
    const phi = 0.12 + Math.random() * 1.1;
    starPositions[i * 3] = Math.cos(theta) * Math.sin(phi) * 58;
    starPositions[i * 3 + 1] = 8 + Math.cos(phi) * 40;
    starPositions[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * 58;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xf4f6ff, size: 0.32, transparent: true, opacity: 0, depthWrite: false, fog: false });
  const stars = new THREE.Points(starGeo, starMat);
  stars.visible = false;
  stars.raycast = () => {};
  scene.add(stars);

  const carPaint = [0xf4f2ed, 0xa8322c, 0xc3c7cb, 0x5e6670, 0xd8c6a0, 0x3f6a92, 0xf7f6f2, 0x8d9399];
  const glassDark = new THREE.MeshPhysicalMaterial({
    color: 0x3a4a58, roughness: 0.08, metalness: 0.1, envMap: roofEnv, envMapIntensity: 1.1, clearcoat: 1,
  });
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff1c6 });
  const lanes = [
    { z: -4.35, dir: 1, x: -5, end: 7.1 },
    { z: -4.35, dir: -1, x: 3.2, end: 7.1 },
    { z: -1.55, dir: 1, x: -2.4, end: 7.1 },
    { z: -1.55, dir: -1, x: 4.6, end: 7.1 },
    { z: 1.08, dir: 1, x: 0.6, end: 7.1 },
    { z: 2.72, dir: -1, x: -3.2, end: 7.1 },
    { z: 4.92, dir: 1, x: -6, end: 6.3 },
    { z: 4.92, dir: -1, x: 2.2, end: 6.3 },
  ];
  const outline = (points) => {
    const shape = new THREE.Shape();
    points.forEach(([x, y], index) => (index ? shape.lineTo(x, y) : shape.moveTo(x, y)));
    shape.closePath();
    return shape;
  };
  const contactBlob = makeShadowBlob();
  textures.push(contactBlob);
  const carGeo = {
    body: new THREE.ExtrudeGeometry(outline([
      [-0.118, 0.032], [0.118, 0.032], [0.122, 0.06], [0.112, 0.074], [0.06, 0.082], [-0.1, 0.086], [-0.12, 0.074],
    ]), { depth: 0.11, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2 }).translate(0, 0, -0.055),
    glass: new THREE.ExtrudeGeometry(outline([
      [0.058, 0.082], [0.03, 0.114], [-0.062, 0.114], [-0.092, 0.086],
    ]), { depth: 0.1, bevelEnabled: false }).translate(0, 0, -0.05),
    roof: new THREE.BoxGeometry(0.094, 0.008, 0.104),
    wheel: new THREE.CylinderGeometry(0.026, 0.026, 0.018, 14).rotateX(Math.PI / 2),
    hub: new THREE.CylinderGeometry(0.012, 0.012, 0.021, 8).rotateX(Math.PI / 2),
    lamp: new THREE.BoxGeometry(0.008, 0.014, 0.024),
    beam: new THREE.ConeGeometry(0.085, 0.44, 16, 1, true).rotateZ(Math.PI / 2).translate(0.22, 0, 0),
    contact: new THREE.PlaneGeometry(0.3, 0.17),
  };
  const contactMat = new THREE.MeshBasicMaterial({
    map: contactBlob, transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1,
  });
  const tyreMat = new THREE.MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.85 });
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xfff0c0, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  });
  const tailDim = new THREE.Color(0x7a2620);
  const tailHot = new THREE.Color(0xff3b2e);
  const busPaint = new THREE.MeshPhysicalMaterial({
    color: 0xf3f0ea, roughness: 0.4, metalness: 0.05, clearcoat: 0.7, envMap: roofEnv, envMapIntensity: 0.7,
  });
  const busStripe = new THREE.MeshStandardMaterial({ color: 0xb23a32, roughness: 0.5 });
  const wheelAt = (car, x, z, radius = 0.026) => {
    const wheel = new THREE.Mesh(carGeo.wheel, tyreMat);
    wheel.scale.setScalar(radius / 0.026);
    wheel.position.set(x, radius, z);
    wheel.add(new THREE.Mesh(carGeo.hub, metalMat));
    car.add(wheel);
    car.userData.wheels.push(wheel);
  };
  const cars = lanes.map((lane, index) => {
    const car = new THREE.Group();
    const bus = index === 4;
    const tail = new THREE.MeshBasicMaterial({ color: tailDim.clone() });
    car.userData = { ...lane, speed: bus ? 0.34 : 0.42 + (index % 3) * 0.08, v: 0, wheels: [], tail, bus, half: bus ? 0.24 : 0.13 };
    car.userData.v = car.userData.speed;
    if (bus) {
      const shell = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.13), busPaint);
      shell.position.y = 0.1;
      shell.castShadow = true;
      const windows = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.038, 0.134), glassDark);
      windows.position.set(-0.01, 0.125, 0);
      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.05, 0.11), glassDark);
      screen.position.set(0.231, 0.12, 0);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.462, 0.014, 0.134), busStripe);
      stripe.position.y = 0.076;
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.018, 0.08), metalMat);
      vent.position.set(-0.04, 0.169, 0);
      car.add(shell, windows, screen, stripe, vent);
      [-0.15, 0.15].forEach((x) => [-0.06, 0.06].forEach((z) => wheelAt(car, x, z, 0.03)));
    } else {
      const paint = new THREE.MeshPhysicalMaterial({
        color: carPaint[index], roughness: 0.38, metalness: 0.08, clearcoat: 0.9, clearcoatRoughness: 0.12, envMap: roofEnv, envMapIntensity: 0.8,
      });
      const body = new THREE.Mesh(carGeo.body, paint);
      body.castShadow = true;
      const glass = new THREE.Mesh(carGeo.glass, glassDark);
      const roof = new THREE.Mesh(carGeo.roof, paint);
      roof.position.set(-0.016, 0.117, 0);
      car.add(body, glass, roof);
      [-0.072, 0.074].forEach((x) => [-0.058, 0.058].forEach((z) => wheelAt(car, x, z)));
      if (index % 3 === 1) car.scale.set(1.05, 1.18, 1.05);
    }
    const front = car.userData.half - 0.004;
    [-0.038, 0.038].forEach((side) => {
      const head = new THREE.Mesh(carGeo.lamp, headMat);
      head.position.set(front, 0.064, side);
      const back = new THREE.Mesh(carGeo.lamp, tail);
      back.position.set(-front, 0.064, side);
      car.add(head, back);
    });
    const contact = new THREE.Mesh(carGeo.contact, contactMat);
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = 0.004;
    contact.scale.x = bus ? 2.1 : 1;
    contact.renderOrder = 1;
    car.add(contact);
    const beam = new THREE.Mesh(carGeo.beam, beamMat);
    beam.position.set(front, 0.06, 0);
    beam.rotation.z = -0.1;
    beam.visible = false;
    car.add(beam);
    car.userData.beam = beam;
    car.rotation.y = lane.dir > 0 ? 0 : Math.PI;
    car.position.set(lane.x, 0.05, lane.z + lane.dir * 0.09);
    car.userData.base = car.scale.clone();
    car.traverse((part) => { part.raycast = () => {}; });
    scene.add(car);
    return car;
  });

  const skinTones = [0xc99b72, 0xa87a55, 0xe0b48e].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.7 }));
  const robeMat = new THREE.MeshStandardMaterial({ color: 0xf7f5ef, roughness: 0.85 });
  const capMat = new THREE.MeshStandardMaterial({ color: 0xe6d6b4, roughness: 0.8 });
  const trouserMat = new THREE.MeshStandardMaterial({ color: 0x4a5462, roughness: 0.8 });
  const shirtMats = [0x3f6a92, 0xc65f4a, 0x6f8a6a, 0xe8d9b0].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.8 }));
  const bikeFrameMat = new THREE.MeshStandardMaterial({ color: 0x2f7f6f, roughness: 0.4, metalness: 0.3 });
  const limb = (w, h, material, x, y, z) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, z);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), material);
    mesh.position.y = -h / 2;
    pivot.add(mesh);
    return pivot;
  };
  function person(robe, index) {
    const body = new THREE.Group();
    const skin = skinTones[index % skinTones.length];
    const legs = [];
    if (robe) {
      const gown = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.017, 0.072, 10), robeMat);
      gown.position.y = 0.038;
      gown.castShadow = true;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0088, 0.0088, 0.007, 10), capMat);
      cap.position.y = 0.097;
      body.add(gown, cap);
    } else {
      const shirt = shirtMats[index % shirtMats.length];
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.03, 0.022), shirt);
      torso.position.y = 0.061;
      torso.castShadow = true;
      body.add(torso);
      [-0.0055, 0.0055].forEach((z) => {
        const leg = limb(0.008, 0.046, trouserMat, 0, 0.046, z);
        body.add(leg);
        legs.push(leg);
      });
    }
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.0095, 10, 8), skin);
    head.position.y = 0.087;
    body.add(head);
    const arms = [-0.014, 0.014].map((z) => {
      const arm = limb(0.0055, 0.03, robe ? robeMat : shirtMats[index % shirtMats.length], 0, 0.074, z);
      body.add(arm);
      return arm;
    });
    body.userData = { legs, arms, phase: index * 1.3 };
    return body;
  }
  function cyclist(index) {
    const rig = new THREE.Group();
    const wheels = [-0.03, 0.03].map((x) => {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.017, 0.0026, 6, 18), tyreMat);
      wheel.position.set(x, 0.0195, 0);
      rig.add(wheel);
      return wheel;
    });
    [
      [0.034, 0.004, -0.008, 0.032, -0.5],
      [0.036, 0.004, 0.008, 0.045, 0.05],
      [0.03, 0.004, 0.026, 0.03, 1.2],
      [0.03, 0.004, -0.024, 0.03, -1.15],
    ].forEach(([w, h, x, y, tilt]) => {
      const tube = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.004), bikeFrameMat);
      tube.position.set(x, y, 0);
      tube.rotation.z = tilt;
      rig.add(tube);
    });
    const bars = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.004, 0.024), metalMat);
    bars.position.set(0.03, 0.052, 0);
    rig.add(bars);
    const shirt = shirtMats[(index + 1) % shirtMats.length];
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.03, 0.02), shirt);
    torso.position.set(0.002, 0.07, 0);
    torso.rotation.z = -0.55;
    torso.castShadow = true;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 8), skinTones[index % skinTones.length]);
    head.position.set(0.014, 0.09, 0);
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.0105, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), shirtMats[index % shirtMats.length]);
    helmet.position.copy(head.position);
    rig.add(torso, head, helmet);
    const legs = [-0.007, 0.007].map((z) => {
      const leg = limb(0.007, 0.034, trouserMat, -0.006, 0.058, z);
      rig.add(leg);
      return leg;
    });
    rig.userData = { wheels, legs, phase: index * 2 };
    return rig;
  }
  const walkers = [
    { x0: -6.2, x1: -5.68, z: 5.42, robe: true, speed: 0.045 },
    { x0: -6.2, x1: -5.68, z: 5.5, robe: false, speed: 0.05 },
    { x0: -4.55, x1: -4.0, z: 5.43, robe: false, speed: 0.042 },
    { x0: -4.55, x1: -4.0, z: 5.5, robe: true, speed: 0.048 },
  ].map((path, index) => {
    const walker = person(path.robe, index);
    const start = path.x0 + (path.x1 - path.x0) * ((index * 0.37) % 1);
    walker.position.set(start, 0.048, path.z);
    Object.assign(walker.userData, path, { dir: index % 2 ? -1 : 1, heading: index % 2 ? Math.PI : 0 });
    walker.rotation.y = walker.userData.heading;
    walker.traverse((part) => { part.raycast = () => {}; });
    scene.add(walker);
    return walker;
  });
  const riders = [
    { z: 5.25, dir: 1, x: -5.6 },
    { z: 5.31, dir: -1, x: -4.4 },
  ].map((path, index) => {
    const rider = cyclist(index);
    rider.position.set(path.x, 0.041, path.z);
    rider.rotation.y = path.dir > 0 ? 0 : Math.PI;
    Object.assign(rider.userData, path, { speed: 0.15 + index * 0.03 });
    rider.traverse((part) => { part.raycast = () => {}; });
    scene.add(rider);
    return rider;
  });

  const shadowBlob = makeShadowBlob();
  textures.push(shadowBlob);
  const cloudShadowMat = new THREE.MeshBasicMaterial({
    map: shadowBlob, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
  });
  const cloudShadows = [[-6, -2.6, 3.6], [-1, 1.8, 4.2], [4, -0.6, 3.2], [8.5, 3.4, 3.8]].map(([x, z, size], index) => {
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(size, size * 0.62), cloudShadowMat);
    blob.rotation.x = -Math.PI / 2;
    blob.rotation.z = index * 0.5;
    blob.position.set(x, 0.07, z);
    blob.renderOrder = 2;
    blob.raycast = () => {};
    blob.visible = false;
    scene.add(blob);
    return blob;
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let down = null;
  let hoverAt = null;
  let hoverId = "";
  const systemAt = (clientX, clientY) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(scene.children, true).find((item) => item.object.userData.id);
    return hit ? { id: hit.object.userData.id, action: hit.object.userData.action || null, hint: hit.object.userData.hint || "" } : null;
  };
  const onDown = (event) => {
    down = { x: event.clientX, y: event.clientY };
  };
  const onUp = (event) => {
    if (!down) return;
    const moved = (event.clientX - down.x) ** 2 + (event.clientY - down.y) ** 2;
    down = null;
    if (moved > 36) return;
    const hit = systemAt(event.clientX, event.clientY);
    if (!hit) return;
    if (hit.action && onAction) onAction({ ...hit.action, system: hit.id });
    else onSelect(hit.id);
  };
  const onMove = (event) => {
    hoverAt = event.buttons ? null : { x: event.clientX, y: event.clientY };
  };
  const onLeave = () => {
    hoverAt = null;
    if (!hoverId) return;
    hoverId = "";
    renderer.domElement.style.cursor = "grab";
    onHover?.(null);
  };
  renderer.domElement.style.cursor = "grab";
  renderer.domElement.addEventListener("pointerdown", onDown);
  renderer.domElement.addEventListener("pointerup", onUp);
  renderer.domElement.addEventListener("pointermove", onMove);
  renderer.domElement.addEventListener("pointerleave", onLeave);

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
  let homeKey = 0;
  let badgesOn = true;
  const homeView = { pos: new THREE.Vector3(4.6, 9.2, 12.4), look: new THREE.Vector3(0, 0.15, -0.15) };
  const closeViews = {
    brain: { pos: new THREE.Vector3(1.15, 2.7, 3.15), look: new THREE.Vector3(-0.15, 0.45, 0.55) },
    heart: { pos: new THREE.Vector3(-2.35, 2.85, 1.15), look: new THREE.Vector3(-3.95, 0.82, -0.22) },
    lungs: { pos: new THREE.Vector3(-1.85, 1.05, -1.55), look: new THREE.Vector3(-3.0, 0.32, -3.0) },
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
  let daylight = 1;
  let dustLevel = 0;
  let cloudLevel = 0;
  let heatLevel = 0;
  let soilWetness = 0.35;
  let fanSpin = 0;
  const filterClean = new THREE.Color(0xf6f3ea);
  const filterDirty = new THREE.Color(0x9c7a52);
  const heatTint = new THREE.Color(0xffc48a);
  let previous = null;
  const dayHemi = new THREE.Color(0xfff8f2);
  const nightHemi = new THREE.Color(0x8ea4cf);
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (!alive || document.hidden) return;
    frames += 1;
    if (frames % 6 === 0) renderer.shadowMap.needsUpdate = true;
    const dt = Math.min(0.05, clock.getDelta());
    const state = getState() || {};
    const live = state.live || {};
    const selected = state.selected || "brain";
    if (hoverAt && frames % 3 === 0) {
      const hit = systemAt(hoverAt.x, hoverAt.y);
      const at = hoverAt;
      hoverAt = null;
      const id = hit?.id || "";
      if (id !== hoverId) {
        hoverId = id;
        renderer.domElement.style.cursor = id ? "pointer" : "grab";
      }
      onHover?.(hit ? { id, hint: hit.hint, x: at.x, y: at.y } : null);
    }
    Object.entries(badges).forEach(([id, sprite]) => {
      sprite.visible = badgesOn;
      const size = id === selected || id === hoverId ? 0.64 : 0.46;
      sprite.scale.set(size, size, 1);
    });
    const louvre = state.louvre || { closure: live.shade ? 1 : 0, roofTemp: 40, powered: true, sun: 1 };
    const closure = louvre.closure;
    if (shadeCanopy) {
      const tilt = -0.05 - 0.23 * closure;
      shadeCanopy.rotation.x += (tilt - shadeCanopy.rotation.x) * Math.min(1, dt * 2);
    }
    const roofWarmth = Math.max(0, Math.min(1, (louvre.roofTemp - 30) / 34));
    roofHeatMat.color.copy(roofCool).lerp(roofHot, roofWarmth);
    roofHeatMat.emissiveIntensity = roofWarmth * 0.4;
    louvreLedMat.color.setHex(!louvre.powered ? 0x6a5f55 : louvre.sun === 0 ? 0x8ec8ff : closure > 0.6 ? 0x7ee0b0 : closure > 0.05 ? 0xffc56a : 0xf3efe6);
    fan.rotation.x += dt * fanSpin;
    const hornAngle = 0.2 + 0.95 * closure;
    servos.forEach((horn) => {
      horn.rotation.z += (hornAngle - horn.rotation.z) * Math.min(1, dt * 3);
    });
    const finAngle = live.fanOn ? 0.42 : 0.04;
    intakeFins.forEach((fin) => {
      fin.rotation.z += (finAngle - fin.rotation.z) * Math.min(1, dt * 4);
    });
    fanSpin += ((live.fanOn ? 16 : 0) - fanSpin) * Math.min(1, dt * (live.fanOn ? 1.2 : 0.6));
    const airLoad = Math.max(0, Math.min(1, (state.particles ?? 40) / 100));
    const shown = Math.round(4 + airLoad * 8);
    specks.forEach((speck, index) => {
      const data = speck.userData;
      if (data.streak) {
        speck.visible = fanSpin > 2;
        data.t = (data.t + dt * fanSpin * 0.06) % 1;
        speck.position.set(1.08 - data.t * 0.42, ductY + data.y, data.z);
        return;
      }
      speck.visible = index < shown;
      if (fanSpin > 2) {
        data.t = (data.t + dt * fanSpin * 0.035) % 1;
        const stopAt = 0.72;
        const along = data.caught ? Math.min(data.t, stopAt) : data.t;
        speck.position.set(2.0 - along * 1.3, ductY + data.y * (1 - along * 0.3), data.z);
        speck.scale.setScalar(data.caught && data.t > stopAt ? Math.max(0.05, 1 - (data.t - stopAt) * 4) : 1);
      } else {
        const drift = clock.elapsedTime * 0.3 + index;
        speck.position.set(1.95 + Math.sin(drift) * 0.18, ductY + data.y + Math.sin(drift * 1.7) * 0.06, data.z + Math.cos(drift) * 0.1);
        speck.scale.setScalar(1);
      }
    });
    lungs.userData.filterMat.color.copy(filterClean).lerp(filterDirty, airLoad * 0.7);
    lungs.userData.led.color.setHex(live.fanOn ? 0x7ee0b0 : state.fan ? 0xff8a6a : 0x8a8178);
    if (scanner) scanner.rotation.y = clock.elapsedTime * (state.live ? 0.9 : 0.3);
    const gain = Math.max(0, Math.min(1, (state.solar || 0) / 4));
    const sunTilt = -0.16 - gain * 0.2;
    movingRoofs.forEach((roof) => {
      const wave = Math.sin(clock.elapsedTime * 0.5 + roof.phase);
      if (roof.slats) {
        const angle = 1.32 - closure * 1.26 + (closure < 0.05 ? wave * 0.05 : 0);
        const count = roof.slats.length;
        roof.slats.forEach((slat, index) => {
          const rate = dt * (2.8 - (index / count) * 2.1);
          slat.rotation.x += (angle - slat.rotation.x) * Math.min(1, rate);
        });
        roof.slats.sync?.();
        return;
      }
      const target = roof.kind === "solar" ? sunTilt - wave * 0.05 : -0.12 - wave * 0.2;
      roof.pivot.rotation.x += (target - roof.pivot.rotation.x) * Math.min(1, dt * 1.6);
    });
    const suction = fanSpin / 16;
    ribbons.forEach((pivot, index) => {
      const flutter = Math.sin(clock.elapsedTime * (3 + suction * 9) + index * 0.9);
      pivot.rotation.z = -suction * 0.55 + flutter * (0.04 + suction * 0.1);
      pivot.rotation.x = Math.sin(clock.elapsedTime * 1.3 + index) * 0.05;
    });
    const needleAim = 2.4 - suction * (0.9 + airLoad * 1.6) + Math.sin(clock.elapsedTime * 9) * 0.03 * suction;
    lungs.userData.needle.rotation.z += (needleAim - lungs.userData.needle.rotation.z) * Math.min(1, dt * 3);
    if (civic.userData.shadeLamp) civic.userData.shadeLamp.emissiveIntensity = 0.06 + closure * 1.3;
    if (civic.userData.pumpLamp) civic.userData.pumpLamp.emissiveIntensity = live.pump ? 1.25 : 0.06;
    if (hubLampMat) hubLampMat.emissiveIntensity = 0.12 + gain * 1.5;
    solarFaces.forEach((face) => {
      face.emissiveIntensity = 0.06 + gain * 0.72 + Math.sin(clock.elapsedTime * 2.6) * 0.06 * gain;
    });
    const hour = state.hour ?? 12;
    const sunHeight = Math.sin((Math.PI * (hour - 6)) / 12);
    const dayTarget = Math.max(0, Math.min(1, (sunHeight + 0.15) / 0.4));
    daylight += (dayTarget - daylight) * Math.min(1, dt * 1.5);
    const dusk = 1 - daylight;
    const rayStrength = (0.2 + gain * 0.55) * daylight * (1 - dustLevel * 0.55) * (1 - cloudLevel * 0.45);
    const lowSun = 1 - Math.max(0, Math.min(1, sunHeight / 0.5));
    if (shaftMat) {
      shaftMat.uniforms.time.value = clock.elapsedTime;
      shaftMat.uniforms.intensity.value = rayStrength;
      shaftMat.uniforms.tint.value.copy(rayNoon).lerp(rayDusk, lowSun);
    }
    rayHitMat.opacity = rayStrength * (0.9 + Math.sin(clock.elapsedTime * 3.1) * 0.1);
    rayHitMat.color.copy(shaftMat ? shaftMat.uniforms.tint.value : rayNoon);
    rayHits.forEach((hit, index) => {
      const pulse = 0.55 + rayStrength * 0.5 + Math.sin(clock.elapsedTime * 2.4 + index) * 0.05;
      hit.scale.set(pulse, pulse, 1);
    });
    sun.intensity = (0.68 + gain * 0.42) * (0.12 + 0.88 * daylight);
    hemi.intensity = 0.58 * (0.32 + 0.68 * daylight);
    hemi.color.copy(dayHemi).lerp(nightHemi, dusk);
    front.intensity = 0.48 * (0.25 + 0.75 * daylight);
    fill.intensity = 0.18 * (0.45 + 0.55 * daylight);
    const weather = state.weather || "clear";
    dustLevel += ((weather === "dust" ? 1 : 0) - dustLevel) * Math.min(1, dt * 0.8);
    cloudLevel += ((weather === "cloudy" ? 1 : 0) - cloudLevel) * Math.min(1, dt * 0.8);
    heatLevel += ((weather === "heatwave" ? 1 : 0) - heatLevel) * Math.min(1, dt * 0.8);
    sandFog.near = 60 - dustLevel * 52;
    sandFog.far = 120 - dustLevel * 92;
    sandFog.color.setHex(0xd8b98c).multiplyScalar(0.35 + 0.65 * daylight);
    dustCloud.visible = dustLevel > 0.02;
    if (dustCloud.visible) {
      dustMat.opacity = dustLevel * 0.75;
      const positions = dustGeo.attributes.position;
      for (let i = 0; i < dustCount; i += 1) {
        let x = positions.getX(i) + dt * (0.9 + (i % 5) * 0.25);
        if (x > 9) x -= 18;
        positions.setX(i, x);
        positions.setY(i, positions.getY(i) + Math.sin(clock.elapsedTime * 1.3 + i) * dt * 0.08);
      }
      positions.needsUpdate = true;
    }
    stars.visible = dusk > 0.35;
    starMat.opacity = Math.max(0, (dusk - 0.35) / 0.65) * (1 - dustLevel) * (1 - cloudLevel * 0.7);
    scene.backgroundIntensity = (0.32 + 0.68 * daylight) * (1 - cloudLevel * 0.28);
    hemi.color.lerp(heatTint, heatLevel * 0.25 * daylight);
    beamMat.opacity = Math.max(0, dusk - 0.25) * 0.3 + dustLevel * 0.12 * daylight;
    cars.forEach((car) => {
      const lane = car.userData;
      let target = lane.speed * (1 - dustLevel * 0.45);
      let stop = null;
      if (lane.z === -4.35 && state.roads?.north === false) {
        stop = 0.2 - lane.dir * (0.36 + lane.half);
        const gap = (stop - car.position.x) * lane.dir;
        if (gap >= -0.001 && gap < 1.1) target *= Math.max(0, Math.min(1, (gap - 0.01) / 0.9));
      }
      const braking = target < lane.v - 0.01 || (stop !== null && lane.v < 0.02);
      lane.v += (target - lane.v) * Math.min(1, dt * (braking ? 3.2 : 1.4));
      let x = car.position.x + lane.dir * lane.v * dt;
      if (stop !== null) {
        const before = lane.dir > 0 ? car.position.x <= stop : car.position.x >= stop;
        const after = lane.dir > 0 ? x > stop : x < stop;
        if (before && after) x = stop;
      }
      if (lane.dir > 0 && x > lane.end) x = -7.3;
      if (lane.dir < 0 && x < -7.3) x = lane.end;
      const moved = Math.abs(x - car.position.x) < 1 ? Math.abs(x - car.position.x) : 0;
      car.position.x = x;
      lane.wheels.forEach((wheel) => {
        wheel.rotation.z -= moved / (0.026 * wheel.scale.x);
      });
      lane.tail.color.lerp(braking || dusk > 0.4 ? tailHot : tailDim, Math.min(1, dt * 6));
      lane.beam.visible = beamMat.opacity > 0.01;
      const edge = Math.min(x + 7.3, lane.end - x);
      car.scale.copy(lane.base).multiplyScalar(Math.max(0.01, Math.min(1, edge / 0.3)));
    });
    walkers.forEach((walker) => {
      const data = walker.userData;
      const pace = data.speed * (1 - dustLevel * 0.4);
      let x = walker.position.x + data.dir * pace * dt;
      if (x > data.x1 || x < data.x0) {
        data.dir *= -1;
        x = Math.max(data.x0, Math.min(data.x1, x));
      }
      walker.position.x = x;
      const facing = data.dir > 0 ? 0 : Math.PI;
      walker.rotation.y += (facing - walker.rotation.y) * Math.min(1, dt * 5);
      data.phase += dt * pace * 160;
      const swing = Math.sin(data.phase);
      data.legs.forEach((leg, index) => { leg.rotation.z = swing * 0.45 * (index ? -1 : 1); });
      data.arms.forEach((arm, index) => { arm.rotation.z = swing * 0.35 * (index ? 1 : -1); });
      walker.position.y = 0.048 + Math.abs(swing) * 0.0025;
    });
    riders.forEach((rider) => {
      const data = rider.userData;
      let x = rider.position.x + data.dir * data.speed * (1 - dustLevel * 0.5) * dt;
      if (data.dir > 0 && x > -3.98) x = -6.08;
      if (data.dir < 0 && x < -6.08) x = -3.98;
      const moved = Math.abs(x - rider.position.x) < 0.5 ? Math.abs(x - rider.position.x) : 0;
      rider.position.x = x;
      data.wheels.forEach((wheel) => { wheel.rotation.z -= moved / 0.017; });
      data.phase += moved / 0.012;
      data.legs.forEach((leg, index) => { leg.rotation.z = Math.sin(data.phase + index * Math.PI) * 0.6 - 0.2; });
      const edge = Math.min(x + 6.08, -3.98 - x);
      rider.scale.setScalar(Math.max(0.01, Math.min(1, edge / 0.12)));
    });
    headMat.color.setHex(dusk > 0.4 ? 0xfff6d6 : 0xd9d2c0);
    pulseMat.color.setHex(live.unmet > 0.05 ? 0xff8a6a : 0xfff6d0);
    ridgeMats.forEach((material) => {
      material.color.copy(material.userData.day).lerp(nightHemi, dusk * 0.35).multiplyScalar(0.42 + 0.58 * daylight);
    });
    sunDisc.visible = daylight > 0.04;
    sunGlow.material.opacity = (0.72 + gain * 0.28) * daylight;
    if (state.live) {
      const lit = Object.keys(leds).map((id) => {
        const need = state.demands?.[id] || 0;
        const got = live.served?.[id] || 0;
        return state.roads?.[id] !== false && got + 0.05 >= need;
      });
      const now = {
        shade: closure > 0.6 ? 2 : closure > 0.05 ? 1 : 0,
        pump: Boolean(live.pump),
        fan: Boolean(live.fanOn),
        lit: lit.join(),
        litCount: lit.filter(Boolean).length,
        roads: JSON.stringify(state.roads || {}),
      };
      if (previous) {
        if (now.shade !== previous.shade) {
          ping("skin", now.shade > previous.shade);
          ping("brain", now.shade > previous.shade);
        }
        if (now.pump !== previous.pump) {
          ping("kidneys", now.pump);
          ping("digestive", now.pump);
        }
        if (now.fan !== previous.fan) ping("lungs", now.fan);
        if (now.lit !== previous.lit) ping("heart", now.litCount >= previous.litCount);
        if (now.roads !== previous.roads) ping("skeleton", now.litCount >= previous.litCount);
      }
      previous = now;
    }
    pings.forEach((ring) => {
      if (!ring.visible) return;
      ring.userData.age += dt;
      const age = ring.userData.age;
      if (age > 1.6) {
        ring.visible = false;
        return;
      }
      const wave = (age % 0.8) / 0.8;
      ring.scale.setScalar(0.4 + wave * 2.4);
      ring.material.opacity = (1 - wave) * 0.85;
    });
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
    const moisture = state.moisture ?? 30;
    soilWetness += (Math.max(0, Math.min(1, (moisture - 10) / 60)) - soilWetness) * Math.min(1, dt * 1.2);
    const parched = moisture < 22;
    if ((gardenSoil.map === drySoilMap) !== parched) {
      gardenSoil.map = parched ? drySoilMap : wetSoilMap;
      gardenSoil.needsUpdate = true;
    }
    gardenSoil.color.copy(soilDry).lerp(soilWet, soilWetness);
    gardenSoil.roughness = 0.97 - soilWetness * 0.4;
    furrowMat.color.setHex(0x3e291c).lerp(soilDry, (1 - soilWetness) * 0.25);
    const wilt = Math.max(0, Math.min(1, (20 - moisture) / 20)) * (0.6 + heatLevel * 0.4);
    const breeze = 1 + dustLevel * 2.2;
    crops.forEach((plant, index) => {
      plant.scale.set(growth, growth * (1 - wilt * 0.28), growth);
      plant.rotation.z = Math.sin(clock.elapsedTime * 1.4 * breeze + index * 0.4) * 0.08 * breeze + wilt * 0.45 * (index % 2 ? 1 : -1);
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
    waterNormal.offset.set((clock.elapsedTime * 0.035) % 1, (clock.elapsedTime * -0.022) % 1);
    waterMat.normalScale.setScalar(0.45 + dustLevel * 0.5 + (flowing ? 0.2 : 0));
    waterMat.color.copy(waterClear).lerp(waterMurky, dustLevel * 0.75);
    caustics.offset.set(Math.sin(clock.elapsedTime * 0.21) * 0.08, (clock.elapsedTime * 0.018) % 1);
    caustics.rotation = Math.sin(clock.elapsedTime * 0.13) * 0.06;
    poolFloorMat.emissiveIntensity = (0.08 + 0.32 * daylight) * (1 - dustLevel * 0.7) * (1 - cloudLevel * 0.5);
    facadeMats.forEach((material, index) => {
      material.emissiveIntensity = 0.5 + (Math.sin(clock.elapsedTime * 1.2 + index * 1.6) + 1) * 0.18 + dusk * 0.6;
    });
    const sway = clock.elapsedTime;
    const gust = 1 + dustLevel * (1.6 + Math.sin(sway * 0.7) * 0.6);
    fronds.forEach((pivot, index) => {
      const flutter = Math.sin(sway * 1.25 * gust + index * 0.9) * 0.05 * gust;
      pivot.rotation.z = pivot.userData.rest + flutter - dustLevel * 0.08;
      pivot.rotation.x = Math.sin(sway * 2.1 * gust + index) * 0.03 * gust;
    });
    lampGlowMat.opacity = Math.min(1, 0.34 + (Math.sin(sway * 1.8) + 1) * 0.12 + dusk * 0.45);
    bulbMat.color.setHex(0xffd08a);
    clouds.forEach((cloud) => {
      const travel = (sway * cloud.userData.speed) % 1;
      cloud.position.x = cloud.userData.base + Math.sin(travel * Math.PI * 2) * cloud.userData.span;
    });
    cloudShadowMat.opacity = cloudLevel * 0.26 * daylight;
    cloudShadows.forEach((blob) => {
      blob.visible = cloudShadowMat.opacity > 0.01;
      if (!blob.visible) return;
      blob.position.x += dt * 0.35;
      if (blob.position.x > 10.5) blob.position.x = -10.5;
    });
    const sunPulse = 1 + Math.sin(sway * 0.7) * 0.04;
    const glowSize = 8.5 * sunPulse * (1 + heatLevel * 0.35);
    sunGlow.scale.set(glowSize, glowSize, 1);
    waterMat.emissiveIntensity = 0.18 + Math.sin(sway * 0.9) * 0.05;
    const tick = state.focusTick || 0;
    if (tick !== focusKey) {
      focusKey = tick;
      if (tick > 0) {
        viewMode = "focus";
        badgesOn = false;
      }
    }
    const home = state.homeTick || 0;
    if (home !== homeKey) {
      homeKey = home;
      viewMode = "home";
      badgesOn = true;
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (viewMode === "home") {
      if (reduceMotion) {
        camera.position.copy(homeView.pos);
        controls.target.copy(homeView.look);
        viewMode = "free";
      } else {
        const glide = 1 - Math.pow(0.015, dt);
        camera.position.lerp(homeView.pos, glide);
        controls.target.lerp(homeView.look, glide);
        if (camera.position.distanceTo(homeView.pos) < 0.05) viewMode = "free";
      }
      camera.lookAt(controls.target);
    } else if (viewMode === "tour") {
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
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerleave", onLeave);
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

function makeWaterNormal() {
  const size = 256;
  const height = new Float32Array(size * size);
  const waves = Array.from({ length: 7 }, (_, i) => ({
    fx: (1 + (i % 3)) * (i % 2 ? 1 : -1),
    fy: 1 + ((i * 2) % 4),
    phase: i * 1.7,
    amp: 1 / (1 + i * 0.35),
  }));
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let h = 0;
      waves.forEach((wave) => {
        h += wave.amp * Math.sin(((x * wave.fx + y * wave.fy) / size) * Math.PI * 2 + wave.phase);
      });
      height[y * size + x] = h;
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const left = height[y * size + ((x - 1 + size) % size)];
      const right = height[y * size + ((x + 1) % size)];
      const up = height[((y - 1 + size) % size) * size + x];
      const down = height[((y + 1) % size) * size + x];
      const nx = (left - right) * 0.6;
      const ny = (up - down) * 0.6;
      const length = Math.hypot(nx, ny, 1);
      const index = (y * size + x) * 4;
      image.data[index] = ((nx / length) * 0.5 + 0.5) * 255;
      image.data[index + 1] = ((ny / length) * 0.5 + 0.5) * 255;
      image.data[index + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      image.data[index + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

function makeCaustics() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#2b7f99";
  ctx.fillRect(0, 0, 256, 256);
  const cells = Array.from({ length: 26 }, () => [Math.random() * 256, Math.random() * 256]);
  const image = ctx.getImageData(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 1) {
    for (let x = 0; x < 256; x += 1) {
      let first = Infinity;
      let second = Infinity;
      cells.forEach(([cx, cy]) => {
        const dx = Math.min(Math.abs(x - cx), 256 - Math.abs(x - cx));
        const dy = Math.min(Math.abs(y - cy), 256 - Math.abs(y - cy));
        const d = Math.hypot(dx, dy);
        if (d < first) {
          second = first;
          first = d;
        } else if (d < second) second = d;
      });
      const edge = Math.max(0, 1 - (second - first) / 7);
      const index = (y * 256 + x) * 4;
      image.data[index] = Math.min(255, image.data[index] + edge * 170);
      image.data[index + 1] = Math.min(255, image.data[index + 1] + edge * 175);
      image.data[index + 2] = Math.min(255, image.data[index + 2] + edge * 150);
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.6, 1.6);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeDrySoil(textures) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#b08a62";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 600; i += 1) {
    const tone = 150 + Math.random() * 50;
    ctx.fillStyle = `rgba(${tone + 20}, ${tone}, ${tone - 30}, 0.5)`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 3, 2);
  }
  ctx.strokeStyle = "rgba(70,46,28,0.75)";
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 22; i += 1) {
    let x = Math.random() * 256;
    let y = Math.random() * 256;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let step = 0; step < 6; step += 1) {
      x += (Math.random() - 0.5) * 46;
      y += (Math.random() - 0.5) * 46;
      ctx.lineTo(x, y);
    }
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

function makeShadowBlob() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const blob = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
  blob.addColorStop(0, "rgba(20,24,30,1)");
  blob.addColorStop(0.6, "rgba(20,24,30,0.6)");
  blob.addColorStop(1, "rgba(20,24,30,0)");
  ctx.fillStyle = blob;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
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
