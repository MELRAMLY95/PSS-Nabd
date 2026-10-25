import * as THREE from "three";

function views(distance = 6.2, height = 3.4, look = 0.45) {
  return {
    overview: { pos: [distance * 0.15, height, distance], target: [0, look, 0] },
    detail: { pos: [1.8, 1.8, 3.4], target: [0, look, 0] },
    side: { pos: [distance, 2.2, 0.4], target: [0, look, 0] },
  };
}

function studio(scene, kit) {
  scene.background = new THREE.Color(0x8f877c);
  scene.fog = new THREE.Fog(0x8f877c, 11, 24);
  const ground = kit.box(16, 0.08, 12, new THREE.MeshStandardMaterial({ color: 0x9c9488, roughness: 0.96 }));
  ground.position.y = 0.02;
  const base = kit.box(7.2, 0.1, 5.2, new THREE.MeshStandardMaterial({ color: 0xb3a898, roughness: 0.9 }));
  base.position.y = 0.1;
  return base;
}

function paintFacade() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const paint = canvas.getContext("2d");
  paint.fillStyle = "#c9bba8";
  paint.fillRect(0, 0, 256, 256);
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = 256;
  glowCanvas.height = 256;
  const glow = glowCanvas.getContext("2d");
  glow.fillStyle = "#000";
  glow.fillRect(0, 0, 256, 256);
  [[48, 70], [148, 70], [48, 150], [148, 150]].forEach(([x, y]) => {
    paint.fillStyle = "#2c2926";
    paint.fillRect(x - 4, y - 4, 68, 58);
    const glass = paint.createLinearGradient(x, y, x, y + 50);
    glass.addColorStop(0, "#d9ccb8");
    glass.addColorStop(1, "#b7a48a");
    paint.fillStyle = glass;
    paint.fillRect(x, y, 60, 50);
    paint.fillStyle = "#2c2926";
    paint.fillRect(x + 28, y, 3, 50);
    paint.fillRect(x, y + 23, 60, 3);
    glow.fillStyle = "#fff";
    glow.fillRect(x, y, 60, 50);
  });
  const map = new THREE.CanvasTexture(canvas);
  const emissive = new THREE.CanvasTexture(glowCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  emissive.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({
    map,
    emissiveMap: emissive,
    emissive: 0xc4a36a,
    emissiveIntensity: 0.02,
    roughness: 0.84,
  });
}

function solarTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 64;
  const paint = canvas.getContext("2d");
  paint.fillStyle = "#d5dde6";
  paint.fillRect(0, 0, 128, 64);
  for (let col = 0; col < 6; col += 1) {
    for (let row = 0; row < 3; row += 1) {
      paint.fillStyle = "#16324a";
      paint.fillRect(6 + col * 20, 6 + row * 18, 16, 14);
      paint.strokeStyle = "#9aa8b5";
      paint.strokeRect(6 + col * 20, 6 + row * 18, 16, 14);
    }
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map, roughness: 0.4, metalness: 0.2, emissive: 0xc4a36a, emissiveMap: map, emissiveIntensity: 0.05 });
}
function plaster() {
  return new THREE.MeshStandardMaterial({ color: 0xd8cbb8, roughness: 0.82 });
}

function stone() {
  return new THREE.MeshStandardMaterial({ color: 0xb7a48c, roughness: 0.92 });
}
function roofMat() {
  return new THREE.MeshStandardMaterial({ color: 0xc4b08e, roughness: 0.78 });
}
function glassPane() {
  return new THREE.MeshStandardMaterial({
    color: 0x163040,
    emissive: 0xf0c36a,
    emissiveIntensity: 0.04,
    roughness: 0.12,
    metalness: 0.25,
  });
}
function clearGlass() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xd7eef4,
    roughness: 0.05,
    metalness: 0.05,
    transmission: 0.86,
    thickness: 0.2,
    transparent: true,
    opacity: 1,
  });
}

function villa(kit, x, z) {
  const body = kit.group();
  body.position.set(x, 0.15, z);
  kit.box(1.05, 0.08, 0.9, stone(), body).position.y = 0.04;
  const walls = paintFacade();
  kit.box(0.92, 0.72, 0.76, walls, body).position.y = 0.44;
  kit.box(1.08, 0.05, 0.92, roofMat(), body).position.y = 0.84;
  const cells = solarTexture();
  const panel = kit.box(0.62, 0.025, 0.36, cells, body);
  panel.position.set(0, 0.9, -0.02);
  panel.rotation.x = -0.35;
  const lampMat = glassPane();
  const lamp = kit.sphere(0.045, lampMat, body);
  lamp.position.set(0.32, 0.5, 0.4);
  return { body, windows: walls, cells, lamp: lampMat };
}

function moveSpecks(specks, dt, speed, place) {
  specks.seeds.forEach((seed, index) => {
    seed.y = (seed.y + dt * speed) % 1;
    const point = place(seed, index);
    specks.dummy.position.set(point[0], point[1], point[2]);
    specks.dummy.scale.setScalar(point[3] ?? 1);
    specks.dummy.updateMatrix();
    specks.mesh.setMatrixAt(index, specks.dummy.matrix);
  });
  specks.mesh.instanceMatrix.needsUpdate = true;
}

function buildLungs({ scene, kit, pick }) {
  studio(scene, kit);
  const house = kit.group();
  house.position.set(0, 0.15, -0.15);
  kit.box(1.7, 0.1, 1.25, stone(), house).position.y = 0.05;
  kit.box(1.5, 0.95, 1.05, plaster(), house).position.y = 0.58;
  kit.box(1.66, 0.06, 1.2, roofMat(), house).position.y = 1.1;
  const ductMat = clearGlass();
  const duct = kit.box(2.5, 0.48, 0.48, ductMat, house);
  duct.position.set(0.15, 0.62, 0.72);
  const fan = kit.group(house);
  fan.position.set(-1.15, 0.62, 0.72);
  kit.cyl(0.06, 0.08, new THREE.MeshStandardMaterial({ color: 0xc9a15b, metalness: 0.4, roughness: 0.35 }), fan).rotation.z = Math.PI / 2;
  for (let blade = 0; blade < 4; blade += 1) {
    const pivot = kit.group(fan);
    pivot.rotation.x = (blade / 4) * Math.PI * 2;
    kit.box(0.02, 0.22, 0.07, new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.4 }), pivot).position.y = 0.13;
  }
  pick(fan, { type: "fan", caption: "Fan — drag up to move more air", drag: { key: "fan", min: 0, max: 100, step: 1, label: "Fan" } });
  const filter = kit.group(house);
  filter.position.set(0.15, 0.62, 0.72);
  const filterMat = new THREE.MeshStandardMaterial({ color: 0xf7f4ee, roughness: 0.5 });
  for (let fin = 0; fin < 7; fin += 1) {
    const pleat = kit.box(0.025, 0.4, 0.36, filterMat, filter);
    pleat.position.x = (fin - 3) * 0.045;
    pleat.rotation.y = fin % 2 ? 0.35 : -0.35;
  }
  const ribbons = [0, 1].map((index) => {
    const mesh = kit.box(0.012, 0.36, 0.1, new THREE.MeshStandardMaterial({ color: 0xf6efe4, side: THREE.DoubleSide, roughness: 0.55 }), house);
    mesh.position.set(1.45, 0.7, 0.72 + (index - 0.5) * 0.08);
    return mesh;
  });
  const motes = kit.specks(14, 0xe6c98a);
  let age = 0;
  return {
    views: views(5.2, 2.4, 0.6),
    update(state, dt) {
      age += dt;
      const fanSpeed = state.fan ?? 0;
      const load = Math.max(0, Math.min(100, state.load ?? 0)) / 100;
      const outlet = fanSpeed * (1 - load * 0.75);
      fan.rotation.x += dt * (fanSpeed / 8);
      filterMat.color.set(load > 0.4 ? 0x8a7358 : 0xd8cbb8);
      const wave = fanSpeed > 2 ? Math.sin(age * (2 + fanSpeed / 30)) * (0.2 + fanSpeed / 160) : 0;
      ribbons.forEach((mesh, index) => { mesh.rotation.z = wave * (1 - load * 0.7) * (index ? -1 : 1); });
      moveSpecks(motes, dt, 0.12 + outlet / 90, (seed) => {
        const along = -1.05 + seed.y * 2.4;
        const past = along > 0.35;
        const show = fanSpeed > 2 && (!past || load < 0.85);
        return [along, 0.62 + (seed.b - 0.5) * 0.18, 0.72 + (seed.a - 0.5) * 0.16, show ? 0.7 : 0.01];
      });
    },
  };
}

function buildHeart({ scene, kit }) {
  studio(scene, kit);
  const road = new THREE.MeshStandardMaterial({ color: 0x2a2724, roughness: 0.92 });
  kit.box(1.1, 0.015, 0.16, road).position.set(-1.15, 0.17, 0);
  kit.box(0.9, 0.015, 0.16, road).position.set(1.15, 0.17, 0);
  const hub = kit.group();
  hub.position.y = 0.15;
  kit.cyl(0.55, 0.08, stone(), hub).position.y = 0.06;
  kit.box(0.7, 0.42, 0.7, paintFacade(), hub).position.y = 0.3;
  kit.box(0.82, 0.05, 0.82, roofMat(), hub).position.y = 0.54;
  const sourceMat = new THREE.MeshStandardMaterial({ color: 0x1a3348, emissive: 0xf0c36a, emissiveIntensity: 0.2, metalness: 0.35, roughness: 0.3 });
  const source = kit.box(0.9, 0.03, 0.55, sourceMat);
  source.position.set(-2.3, 0.72, 0);
  source.rotation.x = -0.5;
  kit.box(0.08, 0.5, 0.08, new THREE.MeshStandardMaterial({ color: 0xd5dde6, metalness: 0.6, roughness: 0.3 })).position.set(-2.3, 0.4, 0);
  const spots = [
    ["d1", 1.7, 1.25],
    ["d2", 1.7, -1.25],
    ["d3", -0.15, 1.55],
    ["d4", -0.15, -1.55],
  ];
  const houses = {};
  const cables = {};
  spots.forEach(([id, x, z]) => {
    houses[id] = villa(kit, x, z);
    const mat = new THREE.MeshStandardMaterial({ color: 0x3a342c, emissive: 0x7ec8c3, emissiveIntensity: 0.02, metalness: 0.35, roughness: 0.4 });
    cables[id] = kit.tube([[0, 0.22, 0], [x * 0.5, 0.2, z * 0.5], [x, 0.22, z]], 0.025, mat);
  });
  const beads = kit.specks(10, 0xf6efe4);
  return {
    views: views(6.6, 3.8, 0.4),
    update(state, dt) {
      const sun = Math.max(0, Math.min(100, state.sun ?? 100)) / 100;
      const volts = state.volts ?? 5;
      const powered = Boolean(state.source) && Boolean(state.hub) && sun > 0.12;
      sourceMat.emissiveIntensity = state.source ? 0.15 + sun * 0.35 : 0.02;
      spots.forEach(([id]) => {
        const on = powered && Boolean(state.live?.[id]);
        const glow = on ? 0.15 + (volts / 5) * 0.35 : 0.02;
        houses[id].windows.emissiveIntensity = glow;
        houses[id].lamp.emissiveIntensity = on ? 0.4 : 0.02;
        houses[id].cells.emissiveIntensity = state.source ? 0.05 + sun * 0.2 : 0.02;
        cables[id].mesh.material.emissiveIntensity = on ? 0.25 : 0.02;
      });
      moveSpecks(beads, dt, powered ? 0.4 : 0, (seed, index) => {
        const id = spots[index % spots.length][0];
        const on = powered && Boolean(state.live?.[id]);
        const point = cables[id].curve.getPoint(seed.y);
        return [point.x, point.y + 0.04, point.z, on ? 0.8 : 0.01];
      });
    },
  };
}

function shadeHouse(kit, pick) {
  const body = kit.group();
  body.position.y = 0.15;
  kit.box(1.7, 0.1, 1.3, stone(), body).position.y = 0.05;
  kit.box(1.45, 0.95, 1.05, plaster(), body).position.y = 0.58;
  const windows = glassPane();
  kit.box(0.7, 0.36, 0.03, windows, body).position.set(0, 0.55, 0.55);
  const canopy = kit.group(body);
  canopy.position.set(0, 1.08, 0.55);
  kit.box(1.6, 0.045, 1.15, roofMat(), canopy).position.set(0, 0.02, -0.25);
  pick(canopy, { type: "shade", caption: "Shade canopy", drag: { key: "outdoor", min: 28, max: 50, step: 1, label: "Outdoor" } });
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffe2ad });
  const sun = kit.sphere(0.22, sunMat);
  sun.position.set(1.8, 2.3, 0.6);
  return { body, canopy, windows, sun, sunMat };
}

function buildSkin({ scene, kit, pick }) {
  studio(scene, kit);
  const house = shadeHouse(kit, pick);
  return {
    views: views(5.4, 2.6, 0.7),
    update(state) {
      const outdoor = state.outdoor ?? 42;
      const shaded = Boolean(state.shade);
      house.canopy.rotation.x = shaded ? -0.05 : -0.58;
      const heat = (outdoor - 28) / 22;
      house.sun.scale.setScalar(0.85 + heat * 0.55);
      house.sunMat.color.set(heat > 0.55 ? 0xd9a15a : 0xe6d2a4);
      house.windows.emissive.set(shaded ? 0x6a8f8a : 0xa86858);
      house.windows.emissiveIntensity = 0.12 + heat * 0.28;
    },
  };
}

function buildBrain({ scene, kit, pick }) {
  studio(scene, kit);
  const house = shadeHouse(kit, pick);
  house.body.position.x = -0.9;
  const pump = kit.group();
  pump.position.set(1.15, 0.15, 0.1);
  kit.box(0.42, 0.28, 0.36, new THREE.MeshStandardMaterial({ color: 0x2c2926, roughness: 0.45, metalness: 0.4 }), pump).position.y = 0.22;
  const impeller = kit.group(pump);
  impeller.position.y = 0.4;
  for (let blade = 0; blade < 4; blade += 1) {
    const pivot = kit.group(impeller);
    pivot.rotation.y = (blade / 4) * Math.PI * 2;
    kit.box(0.02, 0.05, 0.14, plaster(), pivot).position.z = 0.08;
  }
  pick(pump, { type: "pump", caption: "Pump — drag soil moisture", drag: { key: "moisture", min: 0, max: 100, step: 1, unit: "%", label: "Soil moisture" } });
  const bed = kit.group();
  bed.position.set(1.85, 0.15, -0.15);
  kit.box(0.7, 0.16, 0.55, new THREE.MeshStandardMaterial({ color: 0x6a4a32, roughness: 0.9 }), bed).position.y = 0.1;
  const leaf = new THREE.MeshStandardMaterial({ color: 0x5f8a45, roughness: 0.6 });
  kit.sphere(0.12, leaf, bed).position.set(-0.12, 0.28, 0);
  kit.sphere(0.14, leaf, bed).position.set(0.12, 0.32, 0.04);
  const drops = kit.specks(8, 0x7eb8c9);
  return {
    views: views(6.4, 3.1, 0.55),
    update(state, dt) {
      const temp = state.temp ?? 36;
      const moisture = state.moisture ?? 28;
      const shade = state.shadeOn != null ? Boolean(state.shadeOn) : temp >= (state.shadeAt ?? 34);
      const pumping = state.pumpOn != null ? Boolean(state.pumpOn) : moisture < (state.dryAt ?? 35);
      house.canopy.rotation.x = shade ? -0.05 : -0.58;
      house.windows.emissive.set(shade ? 0x6a8f8a : 0xa86858);
      house.windows.emissiveIntensity = shade ? 0.12 : 0.32;
      impeller.rotation.y += pumping ? dt * 8 : 0;
      moveSpecks(drops, dt, pumping ? 0.7 : 0, (seed) => [1.25 + seed.y * 0.55, 0.32, 0.05, pumping ? 0.7 : 0.01]);
    },
  };
}

function buildKidneys({ scene, kit, pick }) {
  studio(scene, kit);
  const tank = kit.openTank({ w: 1.05, h: 1.05, d: 0.8, x: -1.8, y: 0.15, z: 0, water: 0x2f8eb4 });
  pick(tank.body, { type: "tank", caption: "Reservoir — drag soil moisture", drag: { key: "moisture", min: 0, max: 100, step: 1, unit: "%", label: "Soil moisture" } });
  const pump = kit.group();
  pump.position.set(-0.45, 0.15, 0);
  kit.box(0.36, 0.24, 0.32, new THREE.MeshStandardMaterial({ color: 0x2c2926, metalness: 0.45, roughness: 0.4 }), pump).position.y = 0.2;
  const impeller = kit.group(pump);
  impeller.position.y = 0.38;
  for (let blade = 0; blade < 4; blade += 1) {
    const pivot = kit.group(impeller);
    pivot.rotation.y = (blade / 4) * Math.PI * 2;
    kit.box(0.02, 0.04, 0.12, plaster(), pivot).position.z = 0.07;
  }
  const pipe = kit.tube([[-1.05, 0.4, 0], [0.2, 0.36, 0], [1.2, 0.32, 0]], 0.035, new THREE.MeshStandardMaterial({ color: 0x9fd4ef, transparent: true, opacity: 0.9, roughness: 0.15 }));
  const bed = kit.group();
  bed.position.set(1.7, 0.15, 0);
  kit.box(1.2, 0.22, 0.9, new THREE.MeshStandardMaterial({ color: 0x6a4a32, roughness: 0.9 }), bed).position.y = 0.14;
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x5c3e2a, roughness: 0.95 });
  kit.box(1.05, 0.08, 0.75, soilMat, bed).position.y = 0.28;
  kit.sphere(0.1, new THREE.MeshStandardMaterial({ color: 0x5f8a45, roughness: 0.6 }), bed).position.set(-0.2, 0.42, 0);
  kit.sphere(0.12, new THREE.MeshStandardMaterial({ color: 0x5f8a45, roughness: 0.6 }), bed).position.set(0.22, 0.44, 0.04);
  const canopy = kit.group(bed);
  canopy.position.set(0, 0.7, 0.35);
  kit.box(1.25, 0.04, 0.85, roofMat(), canopy).position.set(0, 0.02, -0.2);
  const drops = kit.specks(10, 0x7eb8c9);
  return {
    views: views(6.2, 2.8, 0.5),
    update(state, dt) {
      kit.setLevel(tank, Math.max(0.08, Math.min(1, (state.reservoir ?? 20) / 20)));
      const pumping = Boolean(state.pump);
      impeller.rotation.y += pumping ? dt * 8 : 0;
      canopy.rotation.x = state.shade ? -0.06 : -0.5;
      soilMat.color.set(pumping ? 0x3e5a32 : 0x5c3e2a);
      moveSpecks(drops, dt, pumping ? 0.65 : 0, (seed) => {
        const point = pipe.curve.getPoint(seed.y);
        return [point.x, point.y, point.z, pumping ? 0.75 : 0.01];
      });
    },
  };
}

const WASTE = [
  ["bottle", 0x3d7ea6, "bottle"],
  ["paper", 0xf4efe6, "box"],
  ["can", 0xc5ccd4, "can"],
  ["peel", 0xc46a3a, "cone"],
  ["wrapper", 0x8d8376, "box"],
  ["battery", 0xd4656a, "box"],
];

function wasteMesh(kit, kind, color) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: kind === "can" ? 0.72 : 0.04 });
  if (kind === "bottle") return kit.cyl(0.07, 0.22, mat);
  if (kind === "can") return kit.cyl(0.08, 0.12, mat);
  if (kind === "cone") return kit.include(new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 10), mat));
  return kit.box(0.16, 0.08, 0.12, mat);
}

function buildLiver({ scene, kit, pick }) {
  studio(scene, kit);
  const bins = {
    recover: [-1.55, 1.15, 0xc6a56a],
    organic: [0, 1.15, 0x6a8f4e],
    remainder: [1.55, 1.15, 0x8d8376],
    hazard: [0, -1.25, 0xd4656a],
  };
  Object.entries(bins).forEach(([id, [x, z, color]]) => {
    const body = kit.group();
    body.position.set(x, 0.15, z);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.62 });
    kit.box(1.05, 0.08, 0.8, mat, body).position.y = 0.06;
    kit.box(1.05, 0.28, 0.04, mat, body).position.set(0, 0.22, -0.38);
    kit.box(1.05, 0.28, 0.04, mat, body).position.set(0, 0.22, 0.38);
    kit.box(0.04, 0.28, 0.8, mat, body).position.set(-0.5, 0.22, 0);
    kit.box(0.04, 0.28, 0.8, mat, body).position.set(0.5, 0.22, 0);
    pick(body, { type: "assign", stream: id, caption: id });
  });
  const homes = {};
  const items = WASTE.map(([id, color, kind], index) => {
    const mesh = wasteMesh(kit, kind, color);
    const home = new THREE.Vector3(-1.1 + (index % 3) * 0.55, 0.32, index < 3 ? -0.15 : 0.2);
    mesh.position.copy(home);
    homes[id] = home;
    pick(mesh, { type: "pick", id, caption: id });
    return { id, mesh };
  });
  return {
    views: views(6.4, 3.6, 0.3),
    update(state, dt) {
      const placed = state.placed || {};
      const stacks = { recover: 0, organic: 0, remainder: 0, hazard: 0 };
      items.forEach((item) => {
        const stream = placed[item.id];
        let target = homes[item.id];
        if (stream && bins[stream]) {
          const [x, z] = bins[stream];
          const stack = stacks[stream];
          stacks[stream] += 1;
          target = new THREE.Vector3(x, 0.36 + stack * 0.14, z);
        }
        item.mesh.position.lerp(target, dt === 0 ? 1 : 1 - Math.exp(-dt * 4));
      });
    },
  };
}

function buildDigestive({ scene, kit, pick }) {
  studio(scene, kit);
  const tank = kit.openTank({ w: 0.7, h: 0.75, d: 0.55, x: -1.7, y: 0.15, z: 0.15, water: 0x2f8eb4 });
  kit.tube([[-1.2, 0.42, 0.15], [0, 0.36, 0.05], [0.8, 0.32, 0]], 0.03, clearGlass());
  const bed = kit.group();
  bed.position.set(0.7, 0.15, 0);
  kit.box(1.8, 0.16, 1.1, new THREE.MeshStandardMaterial({ color: 0x6a4a32, roughness: 0.88 }), bed).position.y = 0.1;
  kit.box(1.65, 0.06, 0.95, new THREE.MeshStandardMaterial({ color: 0x5c3e2a, roughness: 0.95 }), bed).position.y = 0.2;
  const plants = [-0.5, -0.15, 0.2, 0.55].map((x) => {
    const plant = kit.group(bed);
    plant.position.set(x, 0.24, 0);
    kit.cyl(0.025, 0.4, new THREE.MeshStandardMaterial({ color: 0x3d5c32 }), plant).position.y = 0.2;
    kit.sphere(0.09, new THREE.MeshStandardMaterial({ color: 0x5f8a45, roughness: 0.55 }), plant).position.y = 0.42;
    return plant;
  });
  const house = clearGlass();
  kit.box(1.9, 0.7, 1.2, house, bed).position.y = 0.62;
  const wet = kit.box(1.5, 0.015, 0.8, new THREE.MeshStandardMaterial({ color: 0x2f8eb4, transparent: true, opacity: 0, roughness: 0.2 }), bed);
  wet.position.y = 0.25;
  pick(bed, { type: "bed", caption: "Bed — drag this week's water", drag: { key: "water", min: 0, max: 100, step: 1, unit: " ml", label: "Water" } });
  return {
    views: views(6, 2.8, 0.55),
    update(state) {
      const height = state.height ?? 4;
      plants.forEach((plant) => { plant.scale.y = 0.5 + height / 14; });
      wet.material.opacity = Math.min(0.5, (state.water ?? 40) / 180);
      kit.setLevel(tank, 0.35 + (100 - (state.water ?? 40)) / 250);
    },
  };
}

function buildSkeleton({ scene, kit, pick }) {
  studio(scene, kit);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xf6f1e8, roughness: 0.9 });
  const base = kit.box(5.2, 0.1, 3.4, baseMat);
  base.position.y = 0.2;
  pick(base, { type: "toggle", key: "base", caption: "Base" });
  function strip(w, h, d, x, y, z, color) {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
    const mesh = kit.box(w, h, d, mat);
    mesh.position.set(x, y, z);
    return { mesh, mat, color };
  }
  const roads = strip(3.8, 0.025, 0.32, 0, 0.27, 0, 0x2a2724);
  const cross = strip(0.32, 0.025, 2.4, 0, 0.28, 0, 0x2a2724);
  const paths = strip(3.4, 0.02, 0.12, 0, 0.29, 0.85, 0xe6c98a);
  const tubes = strip(3.6, 0.06, 0.06, 0, 0.3, -0.85, 0x2f8eb4);
  const wires = strip(0.05, 0.05, 2.4, -1.45, 0.32, 0, 0xc9a15b);
  villa(kit, -0.8, 0.15);
  villa(kit, 0.9, -0.2);
  const door = kit.group();
  door.position.set(1.7, 0.38, 1.05);
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x2c2926, roughness: 0.5 });
  const slab = kit.box(0.42, 0.28, 0.04, doorMat, door);
  slab.position.x = 0.2;
  pick(door, { type: "toggle", key: "panel", caption: "Access panel" });
  let age = 0;
  return {
    views: views(6.4, 3.6, 0.35),
    update(state, dt) {
      age += dt;
      const flags = state.checks || {};
      base.rotation.z = flags.base === false ? Math.sin(age * 2) * 0.03 : 0;
      const paint = (part, ok) => part.mat.color.set(ok ? part.color : 0xd4656a);
      paint(roads, flags.roads !== false);
      paint(cross, flags.roads !== false);
      paint(paths, flags.paths !== false);
      paint(tubes, flags.tubes !== false);
      paint(wires, flags.wires !== false);
      door.rotation.y = flags.panel ? -1.1 : 0;
      doorMat.emissive = doorMat.emissive || new THREE.Color();
      doorMat.emissive.set(flags.panel ? 0x9fd7c8 : 0x000000);
      doorMat.emissiveIntensity = flags.panel ? 0.35 : 0;
    },
  };
}

const BUILDERS = {
  lungs: buildLungs,
  heart: buildHeart,
  skin: buildSkin,
  brain: buildBrain,
  kidneys: buildKidneys,
  liver: buildLiver,
  digestive: buildDigestive,
  skeleton: buildSkeleton,
};

export function buildPrototype(kind, ctx) {
  const build = BUILDERS[kind];
  return build ? build(ctx) : null;
}
