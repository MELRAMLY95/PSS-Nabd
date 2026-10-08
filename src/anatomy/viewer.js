import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { classifyMesh, organForRole } from "./classify.js";

const FILES = [
  ["regions", "/anatomy/regions.fbx", "the living system"],
  ["visceral", "/anatomy/visceral.fbx", "the environmental systems"],
  ["skeletal", "/anatomy/skeletal.fbx", "the infrastructure"],
  ["cardio", "/anatomy/cardio.fbx", "resource circulation"],
  ["nervous", "/anatomy/nervous.fbx", "the decision centre"],
];

const ROLES = ["body", "skeleton", "brain", "heart", "lungs", "kidneys", "liver", "digestive", "vascular", "other"];

const cache = { promise: null };
const statusListeners = new Set();

function reportStatus(message) {
  statusListeners.forEach((listener) => listener(message));
}

function disposeMaterial(material) {
  const list = Array.isArray(material) ? material : [material];
  list.forEach((item) => item?.dispose?.());
}

function cloneMaterial(material) {
  if (Array.isArray(material)) return material.map((item) => item.clone());
  return material.clone();
}

const TINTS = {
  body: 0xc9a898,
  skeleton: 0xe4d5c4,
  brain: 0xe5cfc3,
  heart: 0x8a3535,
  lungs: 0xd4b4b0,
  kidneys: 0x8d463c,
  liver: 0x6b332c,
  digestive: 0xc49a7c,
  other: 0xb08978,
};

function prepareMaterial(material, role, label) {
  const list = Array.isArray(material) ? material : [material];
  const vein = /vein|vena/i.test(label);
  const color = role === "vascular" ? (vein ? 0x3d4d68 : 0x8a3434) : TINTS[role];
  list.forEach((item) => {
    if (!item) return;
    if (color && item.color) {
      item.color.setHex(color);
      item.vertexColors = false;
    }
    item.emissive?.setHex(0x000000);
    item.emissiveIntensity = 0;
    item.side = THREE.DoubleSide;
    item.transparent = false;
    item.opacity = 1;
    item.depthWrite = true;
  });
}

function bucketize(object, source, groups) {
  object.updateMatrixWorld(true);
  const meshes = [];
  object.traverse((child) => {
    if (child.isMesh) meshes.push(child);
  });
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  meshes.forEach((mesh) => {
    const chain = [];
    let node = mesh;
    while (node) {
      if (node.name) chain.push(node.name);
      node = node.parent;
    }
    const role = classifyMesh(source, chain.join(" "));
    mesh.matrixWorld.decompose(position, quaternion, scale);
    if (!role) {
      mesh.geometry?.dispose();
      disposeMaterial(mesh.material);
      return;
    }
    mesh.position.copy(position);
    mesh.quaternion.copy(quaternion);
    mesh.scale.copy(scale);
    mesh.material = cloneMaterial(mesh.material);
    prepareMaterial(mesh.material, role, chain.join(" "));
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.userData.role = role;
    mesh.userData.organ = organForRole(role);
    groups[role].add(mesh);
  });
}

function centerMatching(group, pattern) {
  const box = new THREE.Box3();
  let found = false;
  group.traverse((child) => {
    if (!child.isMesh || !pattern.test(child.name || "")) return;
    box.expandByObject(child);
    found = true;
  });
  return found && !box.isEmpty() ? box.getCenter(new THREE.Vector3()) : null;
}

function centerOf(group) {
  const box = new THREE.Box3().setFromObject(group);
  if (box.isEmpty()) return null;
  return box.getCenter(new THREE.Vector3());
}

function makePath(points, color, channel, direction = 1) {
  const clean = points.filter(Boolean);
  if (clean.length < 2) return null;
  const curve = new THREE.CatmullRomCurve3(clean);
  const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(72));
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.16, depthWrite: false });
  const line = new THREE.Line(geometry, material);
  const dotGeometry = new THREE.SphereGeometry(0.007, 8, 8);
  const travelers = [0, 0.25, 0.5, 0.75].map((offset) => {
    const dot = new THREE.Mesh(
      dotGeometry,
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, depthWrite: false }),
    );
    dot.userData.offset = offset;
    line.add(dot);
    return dot;
  });
  line.userData.curve = curve;
  line.userData.travelers = travelers;
  line.userData.channel = channel;
  line.userData.direction = direction;
  return line;
}

function buildFlows(groups) {
  const lines = new THREE.Group();
  lines.name = "environmental-flows";
  const add = (path) => {
    if (path) lines.add(path);
  };

  const heart = centerOf(groups.heart);
  const rightAtrium = centerMatching(groups.heart, /right atrium/i) || heart;
  const rightVentricle = centerMatching(groups.heart, /right ventricle/i) || heart;
  const leftAtrium = centerMatching(groups.heart, /left atrium/i) || heart;
  const leftVentricle = centerMatching(groups.heart, /left ventricle/i) || heart;
  const pulmonary = centerMatching(groups.vascular, /pulmonary trunk/i) || centerMatching(groups.heart, /pulmonary trunk/i);
  const aorta = centerMatching(groups.vascular, /ascending aorta|thoracic aorta/i) || heart;
  const abdominal = centerMatching(groups.vascular, /abdominal aorta/i) || aorta;
  const cava = centerMatching(groups.vascular, /superior vena cava/i) || heart;
  const lowerCava = centerMatching(groups.vascular, /inferior vena cava/i) || abdominal;
  const lungs = centerOf(groups.lungs);
  const trachea = centerMatching(groups.lungs, /trachea/i) || lungs;
  const leftLung = centerMatching(groups.lungs, /left lung|superior lobe of left/i) || lungs;
  const rightLung = centerMatching(groups.lungs, /right lung|superior lobe of right/i) || lungs;
  const kidneys = centerOf(groups.kidneys);
  const kidneyLeft = centerMatching(groups.kidneys, /kidney\.l|left kidney/i) || kidneys;
  const kidneyRight = centerMatching(groups.kidneys, /kidney\.r|right kidney/i) || kidneys;
  const renal = centerMatching(groups.vascular, /renal/i) || kidneys;
  const brain = centerOf(groups.brain);
  const liver = centerOf(groups.liver);
  const stomach = centerMatching(groups.digestive, /stomach/i) || centerOf(groups.digestive);
  const bowel = centerMatching(groups.digestive, /small intestine|jejun|ileum/i) || stomach;
  const colon = centerMatching(groups.digestive, /colon|large intestine/i) || bowel;
  const skin = centerOf(groups.body);
  const spine = centerOf(groups.skeleton);

  const circuit = [cava, rightAtrium, rightVentricle, pulmonary, lungs, leftAtrium, leftVentricle, aorta, abdominal, lowerCava, heart];
  add(makePath(circuit, 0x8a3a34, "energy"));
  add(makePath(circuit, 0x6f9e9a, "water"));
  add(makePath(circuit, 0x6d9a78, "materials"));

  [kidneyLeft, kidneyRight].forEach((kidney) => {
    if (!kidney) return;
    const recovered = kidney.clone().lerp(heart || kidney, 0.55);
    const waste = kidney.clone();
    waste.y -= 0.22;
    add(makePath([renal || aorta, kidney], 0x6f9e9a, "water"));
    add(makePath([kidney, recovered], 0x6f9e9a, "water"));
    add(makePath([kidney, waste], 0x6a5346, "waste"));
  });

  add(makePath([trachea, leftLung], 0xd5ddd6, "air"));
  add(makePath([trachea, rightLung], 0xd5ddd6, "air"));
  add(makePath([leftLung, trachea], 0xb7a090, "air", -1));
  add(makePath([rightLung, trachea], 0xb7a090, "air", -1));

  [kidneys, lungs, heart, skin, liver].forEach((origin) => {
    add(makePath([origin, brain], 0xc4a574, "info"));
    add(makePath([brain, origin], 0xc4a574, "info", -1));
  });

  if (skin) {
    const heat = skin.clone();
    heat.z += 0.42;
    heat.y += 0.12;
    const cool = heat.clone();
    cool.y += 0.2;
    add(makePath([heat, skin], 0xb56a45, "heat"));
    add(makePath([skin, cool], 0x8aa0a6, "heat", -1));
  }

  if (liver) {
    const inflow = stomach || abdominal || liver;
    const recovered = liver.clone().lerp(heart || liver, 0.5);
    const remainder = liver.clone();
    remainder.y -= 0.16;
    add(makePath([inflow, liver], 0x8a6a48, "liver"));
    add(makePath([liver, recovered], 0x6d9a78, "liver"));
    add(makePath([liver, remainder], 0x6a5346, "liver", -1));
  }

  add(makePath([stomach, bowel, colon], 0xc49a7c, "digest"));
  if (colon) {
    const kept = colon.clone().lerp(liver || colon, 0.45);
    add(makePath([colon, kept], 0x6d9a78, "digest"));
  }

  [heart, lungs, kidneys, liver, brain].forEach((organ) => {
    add(makePath([spine, organ], 0xe4d5c4, "support"));
  });

  return { lines };
}

function pose(holder) {
  holder.position.set(0, 0, 0);
  holder.scale.set(1, 1, 1);
  holder.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(holder);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = 1.72 / Math.max(size.y, 0.001);
  holder.scale.setScalar(scale);
  holder.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
}

function loadAnatomy() {
  if (!cache.promise) {
    cache.promise = (async () => {
      const loader = new FBXLoader();
      const holder = new THREE.Group();
      holder.name = "anatomy";
      const groups = {};
      ROLES.forEach((role) => {
        const group = new THREE.Group();
        group.name = role;
        groups[role] = group;
        holder.add(group);
      });
      for (const [source, url, label] of FILES) {
        reportStatus(`Loading ${label}`);
        await new Promise((resolve) => window.setTimeout(resolve, 40));
        try {
          const object = await loader.loadAsync(url);
          reportStatus(`Preparing ${label}`);
          await new Promise((resolve) => window.setTimeout(resolve, 20));
          bucketize(object, source, groups);
          pose(holder);
        } catch (error) {
          reportStatus(`The ${label} file could not be read`);
          console.error(error);
        }
      }
      holder.position.set(0, 0, 0);
      holder.scale.set(1, 1, 1);
      const flows = buildFlows(groups);
      holder.add(flows.lines);
      pose(holder);
      const counts = {};
      ROLES.forEach((role) => {
        let count = 0;
        groups[role].traverse((child) => {
          if (child.isMesh) count += 1;
        });
        counts[role] = count;
      });
      const measured = new THREE.Box3().setFromObject(holder);
      console.info("ANATOMY", JSON.stringify({ counts, size: measured.getSize(new THREE.Vector3()).toArray().map((value) => Number(value.toFixed(3))) }));
      holder.userData.groups = groups;
      holder.userData.flows = flows;
      return holder;
    })();
  }
  return cache.promise;
}

function setOpacity(group, opacity) {
  if (!group) return;
  group.visible = opacity > 0.03;
  group.traverse((child) => {
    if (!child.isMesh) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (!material) return;
      material.transparent = opacity < 0.98;
      material.opacity = opacity;
      material.depthWrite = opacity > 0.45;
    });
  });
}

const SEQUENCE = [
  { label: "Real human", body: 0.92, skeleton: 0, organs: 0.35, vascular: 0, mode: "anatomy", map: false },
  { label: "Skin fades", body: 0.16, skeleton: 0.2, organs: 0.7, vascular: 0, mode: "anatomy", map: false },
  { label: "Skeleton", body: 0.08, skeleton: 1, organs: 0.25, vascular: 0, mode: "anatomy", map: false },
  { label: "Organs", body: 0.08, skeleton: 0.2, organs: 1, vascular: 0.25, mode: "anatomy", map: false },
  { label: "Vessels", body: 0.07, skeleton: 0.16, organs: 1, vascular: 1, mode: "anatomy", map: false },
  { label: "Environmental pathways", body: 0.1, skeleton: 0.16, organs: 1, vascular: 0.8, mode: "environment", map: false },
        { label: "One body. One system. Every decision matters.", body: 0.1, skeleton: 0.2, organs: 1, vascular: 0.88, mode: "system", map: true },
];

const FOCUS_CHANNELS = {
  kidneys: ["water", "waste"],
  heart: ["energy", "water", "materials"],
  lungs: ["air"],
  brain: ["info"],
  skin: ["heat", "info"],
  liver: ["liver"],
  digestive: ["digest"],
  skeleton: ["support"],
};

const CHAIN = ["heat", "info", "energy", "water", "liver", "all"];

export function createAnatomyViewer(canvas, { onHover, onStatus, onLayers }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x100e0c, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.02, 40);
  camera.position.set(0.15, 0.05, 3.15);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 0.55;
  controls.maxDistance = 5.4;
  controls.minPolarAngle = 0.45;
  controls.maxPolarAngle = Math.PI - 0.45;
  controls.target.set(0, 0.05, 0);
  controls.autoRotate = false;

  scene.add(new THREE.HemisphereLight(0xf2ebe3, 0x2a211c, 1.15));
  const key = new THREE.DirectionalLight(0xfff4ea, 1.35);
  key.position.set(1.4, 2.2, 2.4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xc9d5d2, 0.45);
  fill.position.set(-2.2, 0.4, -1.2);
  scene.add(fill);

  const home = {
    position: camera.position.clone(),
    target: controls.target.clone(),
  };

  const state = {
    holder: null,
    groups: null,
    flows: null,
    layers: { body: 0.7, skeleton: 0.14, organs: 0.92, vascular: 0.2 },
    mode: "anatomy",
    map: false,
    explore: null,
    dim: null,
    emphasis: null,
    organ: null,
    phase: "resilient",
    vitality: 0.74,
    vitalityTarget: 0.74,
    stressTarget: {},
    stressNow: {},
    reduced: document.documentElement.classList.contains("reduce-motion"),
    hovered: null,
  };

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let frame = 0;
  let stopped = false;
  let sequenceTimer = 0;
  const highlighted = new Set();

  function resize() {
    const width = canvas.clientWidth || canvas.parentElement?.clientWidth || 1;
    const height = canvas.clientHeight || canvas.parentElement?.clientHeight || 1;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  }

  function presence(role) {
    const focus = state.dim || state.explore;
    if (!focus || state.mode === "anatomy") return 1;
    if ((role === "body" && focus === "skin") || (role === "skeleton" && focus === "skeleton")) return 1;
    if (role === "vascular" && focus === "heart") return 1;
    if (role === "vascular" && (focus === "kidneys" || focus === "lungs")) return 0.72;
    if (organForRole(role) === focus) return 1;
    return 0.32;
  }

  function applyCondition(condition) {
    if (!condition) return;
    state.condition = condition;
    state.vitalityTarget = (condition.resilience ?? 74) / 100;
    if (condition.phase) state.phase = condition.phase;
    Object.entries(condition.organs || {}).forEach(([organ, health]) => {
      state.stressTarget[organ] = Math.min(1, Math.max(0, (64 - health) / 36));
    });
  }

  function paintStress(organ, stress) {
    const role = organ === "skin" ? "body" : organ;
    const group = state.groups?.[role];
    if (!group) return;
    group.traverse((child) => {
      if (!child.isMesh) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        if (!material?.color) return;
        if (material.userData.base === undefined) material.userData.base = material.color.getHex();
        material.color.copy(new THREE.Color(material.userData.base)).lerp(new THREE.Color(0x6e4038), stress * 0.62);
      });
    });
  }

  function easeCondition() {
    const target = state.vitalityTarget ?? state.vitality;
    const step = state.reduced ? 1 : 0.045;
    state.vitality += (target - state.vitality) * step;
    if (!state.groups) return;
    Object.entries(state.stressTarget).forEach(([organ, stressTarget]) => {
      const current = state.stressNow[organ] ?? 0;
      const next = current + (stressTarget - current) * step;
      if (Math.abs(next - current) < 0.004 && Math.abs(next - stressTarget) < 0.004) {
        state.stressNow[organ] = stressTarget;
        return;
      }
      state.stressNow[organ] = next;
      paintStress(organ, next);
    });
  }

  function publish() {
    onLayers?.({ ...state.layers, mode: state.mode, map: state.map });
  }

  function applyLayers() {
    const { groups, layers } = state;
    if (!groups) return;
    setOpacity(groups.body, layers.body * presence("body"));
    setOpacity(groups.skeleton, layers.skeleton * presence("skeleton"));
    ["brain", "heart", "lungs", "kidneys", "liver", "digestive", "other"].forEach((role) => {
      setOpacity(groups[role], layers.organs * presence(role));
    });
    setOpacity(groups.vascular, layers.vascular * presence("vascular"));
  }

  function clearHighlight() {
    highlighted.forEach((mesh) => {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material) => {
        material.emissive?.setHex(0x000000);
        material.emissiveIntensity = 0;
      });
    });
    highlighted.clear();
  }

  function tint(mesh, color, intensity) {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => {
      if (!material?.emissive) return;
      material.emissive.setHex(color);
      material.emissiveIntensity = intensity;
    });
    highlighted.add(mesh);
  }

  function highlight(organ) {
    clearHighlight();
    state.dim = state.mode === "anatomy" ? null : organ || state.explore;
    applyLayers();
    if (!organ || !state.groups) return;
    const role = organ === "skin" ? "body" : organ;
    const group = state.groups[role];
    if (!group) return;
    group.traverse((child) => {
      if (child.isMesh) tint(child, 0x4a342c, 0.16);
    });
  }

  function focus(organ) {
    const role = organ === "skin" ? "body" : organ;
    const group = state.groups?.[role];
    if (!group) return;
    const box = new THREE.Box3().setFromObject(group);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();
    const distance = THREE.MathUtils.clamp(size * 0.72, 0.42, 2.4);
    const offset = new THREE.Vector3(distance * 0.28, distance * 0.04, distance);
    if (organ === "kidneys") offset.set(distance * 0.15, -distance * 0.02, -distance * 0.95);
    controls.target.copy(center);
    camera.position.copy(center).add(offset);
  }

  function pick(event) {
    if (!state.holder) return null;
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const targets = [];
    state.holder.traverse((child) => {
      if (!child.isMesh || !child.visible) return;
      const material = Array.isArray(child.material) ? child.material[0] : child.material;
      const opacity = material?.opacity ?? 1;
      if (child.userData.role === "body" && opacity < 0.82) return;
      if (opacity < 0.34) return;
      targets.push(child);
    });
    const hit = raycaster.intersectObjects(targets, false)[0];
    return hit || null;
  }

  function onPointerMove(event) {
    const hit = pick(event);
    const mesh = hit?.object;
    const next = mesh?.userData.organ || null;
    if (mesh !== state.hovered) {
      state.hovered = mesh || null;
      if (mesh?.userData.role === "vascular") {
        clearHighlight();
        tint(mesh, 0x6a3030, 0.22);
      } else {
        highlight(next);
      }
      const rect = canvas.getBoundingClientRect();
      onHover?.({
        organ: next,
        name: mesh ? mesh.name.replace(/\.00\d|\.g|\.j/g, "") : "",
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    } else if (hit && state.hovered) {
      const rect = canvas.getBoundingClientRect();
      onHover?.({
        organ: next,
        name: mesh.name.replace(/\.00\d|\.g|\.j/g, ""),
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    }
  }

  function onPointerLeave() {
    state.hovered = null;
    highlight(state.explore || state.organ);
    onHover?.(null);
  }

  function beginExplore(organ) {
    window.clearTimeout(sequenceTimer);
    state.organ = organ;
    state.explore = organ;
    state.emphasis = null;
    if (state.mode === "anatomy") {
      state.mode = "environment";
      state.layers = { ...state.layers, body: 0.14, skeleton: 0.22, organs: 1, vascular: 0.78 };
    }
    highlight(organ);
    focus(organ);
    publish();
  }

  function onClick(event) {
    const hit = pick(event);
    const organ = hit?.object?.userData.organ;
    if (organ) {
      beginExplore(organ);
      onHover?.({
        organ,
        name: hit.object.name.replace(/\.00\d|\.g|\.j/g, ""),
        x: 0,
        y: 0,
        select: true,
      });
    }
  }

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("click", onClick);

  function channelOpacity(channel) {
    if (state.mode === "anatomy") return 0;
    const focus = state.explore;
    const allowed = focus ? FOCUS_CHANNELS[focus] : null;
    const stressed = state.phase === "stressed" || state.phase === "critical";
    const connected = state.mode === "system" || state.mode === "decision";
    let opacity = connected ? 0.62 : 0.34;
    if (allowed && !allowed.includes(channel)) opacity = state.mode === "system" ? 0.06 : 0;
    if (!focus && channel === "support" && state.mode !== "system") opacity = 0;
    if (channel === "heat" && stressed && state.mode !== "anatomy") opacity = Math.max(opacity, 0.36);
    if (state.emphasis && state.emphasis !== "all") {
      const groups = {
        materials: ["materials", "liver", "digest"],
        waste: ["waste", "liver"],
      };
      const allowed = groups[state.emphasis] || [state.emphasis];
      opacity = allowed.includes(channel) ? 0.5 : 0.035;
    }
    const vitality = state.vitality ?? 0.74;
    return opacity * (0.42 + vitality * 0.75);
  }

  function animateFlows(time) {
    const lines = state.flows?.lines;
    if (!lines) return;
    const pace = ({ thriving: 1, resilient: 0.92, recovering: 0.72, stressed: 0.48, critical: 0.28 }[state.phase] ?? 0.85) * (0.55 + (state.vitality ?? 0.74) * 0.6);
    lines.children.forEach((line) => {
      const curve = line.userData.curve;
      if (!curve) return;
      const opacity = channelOpacity(line.userData.channel);
      line.visible = opacity > 0.02;
      if (line.material) line.material.opacity = opacity * 0.65;
      line.userData.travelers?.forEach((dot) => {
        const direction = line.userData.direction || 1;
        const travel = (time * 0.00007 * pace * direction + dot.userData.offset) % 1;
        const t = travel < 0 ? travel + 1 : travel;
        dot.position.copy(curve.getPointAt(t));
        dot.material.opacity = Math.min(0.8, opacity + 0.25);
        dot.visible = line.visible;
      });
    });
  }

  function animateLife(time) {
    const { groups, reduced } = state;
    if (!groups || reduced) return;
    const load = state.phase === "stressed" || state.phase === "critical" ? 1.25 : 1;
    const breath = 0.5 + 0.5 * Math.sin(time * 0.0011 * load);
    const breathScale = 1 + breath * 0.018;
    groups.lungs.scale.set(breathScale, 1 + breath * 0.01, breathScale);
    const beatPhase = (time * 0.00105 * (state.phase === "stressed" ? 1.35 : 1)) % 1;
    const beat = Math.exp(-90 * (beatPhase - 0.08) ** 2) + 0.45 * Math.exp(-160 * (beatPhase - 0.2) ** 2);
    const heartScale = 1 + beat * 0.045;
    groups.heart.scale.setScalar(heartScale);
    groups.body.scale.set(1 + breath * 0.004, 1 + breath * 0.006, 1 + breath * 0.004);
  }

  function tick(time) {
    if (stopped) return;
    frame = requestAnimationFrame(tick);
    controls.update();
    easeCondition();
    animateLife(time);
    animateFlows(time);
    renderer.render(scene, camera);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas.parentElement || canvas);
  resize();
  frame = requestAnimationFrame(tick);

  statusListeners.add(onStatus);
  loadAnatomy().then((holder) => {
    if (stopped) return;
    state.holder = holder;
    state.groups = holder.userData.groups;
    state.flows = holder.userData.flows;
    scene.add(holder);
    const fitted = new THREE.Box3().setFromObject(holder);
    const sphere = fitted.getBoundingSphere(new THREE.Sphere());
    if (sphere.radius > 0 && Number.isFinite(sphere.radius)) {
      const distance = Math.max(0.8, sphere.radius / Math.sin((camera.fov * Math.PI) / 360)) * 1.18;
      camera.position.set(sphere.center.x + distance * 0.12, sphere.center.y, sphere.center.z + distance);
      controls.target.copy(sphere.center);
      home.position.copy(camera.position);
      home.target.copy(controls.target);
      camera.near = Math.max(0.01, sphere.radius / 80);
      camera.far = Math.max(40, sphere.radius * 30);
      camera.updateProjectionMatrix();
    }
    applyLayers();
    highlight(state.organ);
    if (state.condition) applyCondition(state.condition);
    if (state.pendingFocus && state.organ) focus(state.organ);
    onStatus?.("");
    publish();
  });

  return {
    setOrgan(organ, { focus: shouldFocus = false } = {}) {
      state.organ = organ;
      state.pendingFocus = shouldFocus;
      if (!state.groups) return;
      highlight(organ);
      if (shouldFocus && organ && organ !== "skin") {
        state.layers.organs = 1;
        state.layers.body = Math.min(state.layers.body, 0.18);
        applyLayers();
        focus(organ);
        publish();
      }
    },
    explore(organ) {
      if (!organ) return;
      beginExplore(organ);
    },
    setBackdrop(hex) {
      renderer.setClearColor(hex, 1);
    },
    setMode(mode) {
      window.clearTimeout(sequenceTimer);
      state.mode = mode;
      state.map = mode === "system" || mode === "decision";
      state.emphasis = null;
      const presets = {
        anatomy: { body: 0.7, skeleton: 0.14, organs: 0.92, vascular: 0.2 },
        environment: { body: 0.14, skeleton: 0.22, organs: 1, vascular: 0.78 },
        system: { body: 0.1, skeleton: 0.22, organs: 1, vascular: 0.9 },
        decision: { body: 0.08, skeleton: 0.28, organs: 1, vascular: 1 },
      };
      state.layers = { ...state.layers, ...presets[mode] };
      state.dim = mode === "anatomy" ? null : state.explore;
      applyLayers();
      if (state.explore) highlight(state.explore);
      publish();
    },
    playChain() {
      window.clearTimeout(sequenceTimer);
      state.mode = "system";
      state.map = true;
      state.explore = null;
      state.dim = null;
      state.layers = { ...state.layers, body: 0.1, skeleton: 0.22, organs: 1, vascular: 0.9 };
      applyLayers();
      publish();
      if (state.reduced) {
        state.emphasis = "all";
        onStatus?.("The system finds a new balance.");
        return;
      }
      let step = 0;
      const labels = [
        "Skin detects heat",
        "The signal reaches the brain",
        "Energy demand rises",
        "Water recovery responds",
        "Waste is asked if it can return",
        "The system settles",
      ];
      const advance = () => {
        state.emphasis = CHAIN[step];
        onStatus?.(labels[step]);
        step += 1;
        if (step < CHAIN.length) sequenceTimer = window.setTimeout(advance, 1700);
      };
      advance();
    },
    setPhase(phase) {
      state.phase = phase;
    },
    setCondition(condition) {
      applyCondition(condition);
    },
    showPath(organs = [], labels = []) {
      window.clearTimeout(sequenceTimer);
      state.mode = "decision";
      state.map = true;
      state.emphasis = null;
      state.layers = { ...state.layers, body: 0.12, skeleton: 0.2, organs: 1, vascular: 0.88 };
      applyLayers();
      publish();
      if (!organs.length) return;
      if (state.reduced) {
        onStatus?.(labels.at(-1) || "");
        highlight(null);
        return;
      }
      let step = 0;
      const advance = () => {
        const organ = organs[step];
        state.explore = organ;
        highlight(organ);
        focus(organ);
        onStatus?.(labels[step] || organ);
        step += 1;
        if (step < organs.length) sequenceTimer = window.setTimeout(advance, 1400);
        else {
          sequenceTimer = window.setTimeout(() => {
            state.explore = null;
            highlight(null);
            applyCondition(state.condition);
          }, 900);
        }
      };
      advance();
    },
    setLayers(partial) {
      state.layers = { ...state.layers, ...partial };
      applyLayers();
      publish();
    },
    nudge(direction) {
      const offset = camera.position.clone().sub(controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      spherical.theta += direction * 0.35;
      offset.setFromSpherical(spherical);
      camera.position.copy(controls.target).add(offset);
    },
    zoom(factor) {
      const offset = camera.position.clone().sub(controls.target);
      offset.multiplyScalar(factor);
      const length = offset.length();
      if (length < controls.minDistance || length > controls.maxDistance) return;
      camera.position.copy(controls.target).add(offset);
    },
    reset() {
      window.clearTimeout(sequenceTimer);
      camera.position.copy(home.position);
      controls.target.copy(home.target);
      state.mode = "anatomy";
      state.map = false;
      state.explore = null;
      state.dim = null;
      state.emphasis = null;
      state.layers = { body: 0.7, skeleton: 0.14, organs: 0.92, vascular: 0.2 };
      applyLayers();
      highlight(null);
      publish();
      onStatus?.("");
    },
    playBoot(onStep) {
      window.clearTimeout(sequenceTimer);
      const frames = [
        { label: "Silhouette", body: 0.88, skeleton: 0, organs: 0, vascular: 0, mode: "anatomy" },
        { label: "Skeleton", body: 0.1, skeleton: 0.92, organs: 0, vascular: 0, mode: "anatomy" },
        { label: "Organs", body: 0.08, skeleton: 0.16, organs: 1, vascular: 0, mode: "anatomy" },
        { label: "Resource network", body: 0.08, skeleton: 0.14, organs: 1, vascular: 0.95, mode: "anatomy" },
        { label: "Environmental flows", body: 0.1, skeleton: 0.14, organs: 1, vascular: 0.78, mode: "system" },
      ];
      const applyFrame = (frame) => {
        state.mode = frame.mode;
        state.map = frame.mode === "system";
        state.explore = null;
        state.dim = null;
        state.emphasis = null;
        state.layers = { body: frame.body, skeleton: frame.skeleton, organs: frame.organs, vascular: frame.vascular };
        applyLayers();
        highlight(null);
        publish();
      };
      if (state.reduced) {
        const last = frames[frames.length - 1];
        applyFrame(last);
        onStep?.(last.label, true);
        return;
      }
      let step = 0;
      const advance = () => {
        const frame = frames[step];
        applyFrame(frame);
        step += 1;
        const done = step >= frames.length;
        onStep?.(frame.label, done);
        if (!done) sequenceTimer = window.setTimeout(advance, 1500);
      };
      advance();
    },
    setEmphasis(channel) {
      window.clearTimeout(sequenceTimer);
      state.emphasis = channel || null;
      if (channel) {
        state.explore = null;
        state.dim = null;
        state.mode = "system";
        state.map = true;
        highlight(null);
        state.layers = { ...state.layers, body: 0.1, skeleton: 0.16, organs: 1, vascular: 0.9 };
        applyLayers();
      }
      publish();
    },
    playSequence() {
      window.clearTimeout(sequenceTimer);
      state.explore = null;
      state.dim = null;
      state.emphasis = null;
      if (state.reduced) {
        const last = SEQUENCE[SEQUENCE.length - 1];
        state.mode = last.mode;
        state.map = last.map;
        state.layers = { ...last };
        applyLayers();
        publish();
        onStatus?.(last.label);
        return;
      }
      let step = 0;
      const advance = () => {
        const frameState = SEQUENCE[step];
        state.mode = frameState.mode;
        state.map = frameState.map;
        state.layers = { ...frameState };
        applyLayers();
        publish();
        onStatus?.(frameState.label);
        step += 1;
        if (step < SEQUENCE.length) sequenceTimer = window.setTimeout(advance, 1700);
      };
      advance();
    },
    focus,
    dispose() {
      stopped = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(sequenceTimer);
      observer.disconnect();
      statusListeners.delete(onStatus);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("click", onClick);
      controls.dispose();
      if (state.holder) scene.remove(state.holder);
      renderer.dispose();
    },
  };
}
