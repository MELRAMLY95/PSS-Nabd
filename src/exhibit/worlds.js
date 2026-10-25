import * as THREE from "three";
import { buildPrototype } from "./prototypeWorlds.js";
import { LIVER_KEY, LIVER_TOKENS, NOURISH_BATCHES } from "./simModels.js";
import { BUILDINGS } from "./nabdGrid.js";

const VIEWS = {
  kidneys: {
    overview: { pos: [0.2, 3.5, 8.4], target: [0.3, 0.8, 0] },
    detail: { pos: [2.1, 1.8, 3.1], target: [1.9, 0.85, 0] },
    side: { pos: [0.2, 2.2, 9.2], target: [0.3, 0.7, 0] },
  },
  heart: {
    overview: { pos: [0.15, 7.6, 5.6], target: [0, 0.55, 0] },
    detail: { pos: [0.12, 7.35, 5.35], target: [0, 0.5, 0] },
    side: { pos: [6.6, 2.6, 0.2], target: [0, 0.7, 0] },
  },
  brain: {
    overview: { pos: [0.2, 5.4, 8.2], target: [0, 0.4, -0.2] },
    detail: { pos: [2.2, 2.4, 3.2], target: [0.4, 0.3, 0] },
    side: { pos: [8.2, 3.2, 0.4], target: [0, 0.3, 0] },
  },
  liver: {
    overview: { pos: [0.2, 3.8, 7.6], target: [0, 0.6, 0.2] },
    detail: { pos: [-0.4, 2.2, 3.4], target: [0.2, 0.5, 0] },
    side: { pos: [0, 3.2, 8.4], target: [0, 0.5, 0] },
  },
  skin: {
    overview: { pos: [0, 3.2, 7.2], target: [0, 1.1, 0] },
    detail: { pos: [2.4, 1.8, 3.6], target: [1.7, 1.1, 0] },
    side: { pos: [7.2, 2.2, 1.2], target: [0, 1, 0] },
  },
  digestive: {
    overview: { pos: [0.4, 4.2, 8.4], target: [0.4, 0.6, 0] },
    detail: { pos: [-2.2, 2.1, 3.2], target: [-2.4, 0.7, 0] },
    side: { pos: [0.4, 2.8, 9.2], target: [0.4, 0.5, 0] },
  },
  skeleton: {
    overview: { pos: [0, 4.6, 8.2], target: [0, 0.4, 0.2] },
    detail: { pos: [-1.6, 2.2, 3.4], target: [-1.8, 0.5, 0.2] },
    side: { pos: [7.6, 2.8, 2.2], target: [0, 0.4, 0] },
  },
  lungs: {
    overview: { pos: [0.2, 2.4, 5.6], target: [0.1, 0.85, 0] },
    detail: { pos: [0.8, 1.5, 2.8], target: [0.5, 0.85, 0] },
    side: { pos: [4.8, 1.8, 2.2], target: [0, 0.8, 0] },
  },
};

function mixColor(from, to, t) {
  return new THREE.Color(from).lerp(new THREE.Color(to), Math.max(0, Math.min(1, t)));
}

function stepToward(mesh, target, dt) {
  if (dt <= 0) mesh.position.copy(target);
  else mesh.position.lerp(target, 1 - Math.exp(-dt * 3.2));
}

function buildKidneys({ scene, kit, pick }) {
  const skid = kit.box(10.6, 0.08, 2.5, kit.darkMat());
  skid.position.set(0.2, 0.04, 0);
  const inlet = kit.openTank({ w: 1.15, h: 1.25, d: 0.95, x: -4.35, y: 0.08, z: 0, water: 0x6a4e32 });
  const settler = kit.openTank({ w: 1.45, h: 1.15, d: 1.15, x: -2.55, y: 0.08, z: 0, water: 0x4e6d62 });
  const outlet = kit.openTank({ w: 1.2, h: 1.2, d: 1, x: 4.55, y: 0.08, z: 0, water: 0x8fd4cf });
  kit.label("Inlet", scene).position.set(-4.35, 1.7, 0);
  kit.label("Settler", scene).position.set(-2.55, 1.62, 0);
  kit.label("Recovered", scene).position.set(4.55, 1.7, 0);

  const pump = kit.group();
  pump.position.set(-0.85, 0.08, 0);
  const housing = kit.cyl(0.34, 0.36, kit.darkMat(), pump);
  housing.position.y = 0.34;
  const motor = kit.box(0.36, 0.28, 0.36, kit.steelMat(), pump);
  motor.position.y = 0.68;
  const impeller = kit.group(pump);
  impeller.position.y = 0.34;
  for (let blade = 0; blade < 4; blade += 1) {
    const pivot = kit.group(impeller);
    pivot.rotation.y = (blade / 4) * Math.PI * 2;
    const fin = kit.box(0.04, 0.14, 0.2, kit.boneMat(), pivot);
    fin.position.z = 0.12;
  }
  kit.label("Pump", scene).position.set(-0.85, 1.35, 0);

  const columns = [0.75, 1.95, 3.15].map((x, index) => {
    const body = kit.group();
    body.position.set(x, 0.08, 0);
    const glass = kit.cyl(0.26, 1.28, kit.glassMat(), body, 24);
    glass.position.y = 0.72;
    glass.castShadow = false;
    const gravel = kit.cyl(0.18, 0.26, kit.stoneMat(), body, 16);
    gravel.position.y = 0.28;
    const sand = kit.cyl(0.18, 0.26, kit.sandMat(), body, 16);
    sand.position.y = 0.56;
    const carbon = kit.cyl(0.18, 0.2, kit.darkMat(), body, 16);
    carbon.position.y = 0.82;
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x9fd7c8, emissive: 0x9fd7c8, emissiveIntensity: 0.8 });
    const lamp = kit.sphere(0.055, lampMat, body);
    lamp.position.y = 1.5;
    kit.label(`Stage ${index + 1}`, body).position.set(0, 1.78, 0);
    pick(body, { type: "stage", count: index + 1, caption: `Stage ${index + 1}` });
    return { lampMat, gravel, sand, carbon };
  });

  [[-3.7, 0.72], [-0.85, 1.05], [0.75, 1.28], [4.55, 0.78]].forEach(([x, y]) => {
    const flange = kit.include(new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.022, 8, 18), kit.steelMat()));
    flange.rotation.y = Math.PI / 2;
    flange.position.set(x, y, 0);
  });
  const pipe = kit.tube([
    [-3.7, 0.72, 0],
    [-2.55, 1.22, 0],
    [-0.85, 1.05, 0],
    [0.75, 1.28, 0],
    [1.95, 1.28, 0],
    [3.15, 1.28, 0],
    [4.55, 0.78, 0],
  ], 0.04, kit.steelMat());
  const beads = Array.from({ length: 16 }, (_, index) => {
    const mesh = kit.sphere(0.035, new THREE.MeshStandardMaterial({ color: 0xd7f4ff, emissive: 0x9fd4ef, emissiveIntensity: 0.4 }), scene);
    return { mesh, t: index / 16 };
  });
  const silt = kit.specks(28, 0x5a3d28);
  const hold = kit.openTank({ w: 0.95, h: 0.9, d: 0.75, x: 4.55, y: 0.08, z: 1.45, water: 0x8a3038 });
  kit.label("Not reused", scene).position.set(4.55, 1.35, 1.45);
  const cabinet = kit.box(0.7, 0.9, 0.4, kit.darkMat());
  cabinet.position.set(4.55, 0.53, -1.15);
  const statusMat = new THREE.MeshStandardMaterial({ color: 0x9fd7c8, emissive: 0x9fd7c8, emissiveIntensity: 1 });
  const status = kit.sphere(0.06, statusMat);
  status.position.set(4.55, 1.05, -0.94);
  pick(pump, { type: "flow", caption: "Pump — drag up for more flow", drag: { key: "flow", min: 15, max: 100, step: 1, label: "Flow" } });
  pick(inlet.body, { type: "wear", caption: "Inlet — drag for filter condition", drag: { key: "condition", min: 0, max: 100, step: 1, label: "Filter condition" } });
  pick(cabinet, { type: "inspect", id: "panel", caption: "Cabinet — drag the salinity limit", drag: { key: "salinity", min: 10, max: 90, step: 1, label: "Salinity limit" } });
  pick(outlet.body, { type: "gate", mode: "gated", caption: "Quality gate" });
  pick(hold.body, { type: "gate", mode: "volume", caption: "Volume only" });
  const readout = kit.board();
  readout.sprite.position.set(0.2, 2.35, 0);

  return {
    views: VIEWS.kidneys,
    update(state, dt) {
      const flow = state.flow ?? 55;
      const quality = state.quality ?? 70;
      const stages = state.stages ?? 2;
      const condition = state.condition ?? 80;
      kit.setLevel(inlet, 0.55 + (100 - quality) / 280);
      kit.setLevel(settler, 0.42 + stages * 0.12);
      kit.setLevel(outlet, 0.18 + (state.recovery ?? 40) / 140);
      const gate = state.gate;
      if (gate) {
        kit.setLevel(outlet, 0.08 + Math.min(0.88, gate.irrigation / 80));
        kit.setLevel(hold, 0.08 + Math.min(0.88, (gate.further + gate.rejected) / 70));
        hold.material.color.set(gate.violations > 0 ? 0xd4656a : 0x6a442c);
      }
      inlet.material.color.copy(mixColor(0x8a5a3a, 0x6e8f78, condition / 160));
      outlet.material.color.copy(mixColor(0x6a442c, 0xb7ece8, quality / 100));
      outlet.material.opacity = 0.72 + quality / 400;
      columns.forEach((column, index) => {
        const step = state.pass?.columns?.[index];
        const active = step ? step.open : index < stages;
        const fill = step ? step.fill : (active ? 1 : 0);
        column.lampMat.emissiveIntensity = active ? 0.15 + fill : 0.02;
        const clog = active ? Math.min(1, (step?.caught || 0) / 24) : 0.15;
        column.carbon.material.color.set(mixColor(0x2c3134, 0x6a442c, clog));
        column.gravel.visible = active;
        column.sand.visible = active;
        column.carbon.visible = active;
        column.carbon.scale.y = active ? 0.45 + fill * 0.7 : 1;
      });
      impeller.rotation.y += dt * (flow / 18);
      beads.forEach((bead) => {
        bead.t = (bead.t + dt * (0.02 + flow / 420)) % 1;
        bead.mesh.position.copy(pipe.curve.getPoint(bead.t));
        bead.mesh.scale.setScalar(state.gate && state.gate.irrigation < 0.5 ? 0.15 : flow < 2 ? 0.2 : 1);
      });
      silt.seeds.forEach((seed, index) => {
        const sink = dt * (0.08 + (100 - flow) / 380);
        seed.y = seed.y - sink;
        if (seed.y < 0.15) seed.y = 1.05;
        const carried = flow > 70 && seed.a > 0.55;
        const x = carried ? -0.2 + seed.a * 4.2 : -2.55 + (seed.a - 0.5) * 1.1;
        silt.dummy.position.set(x, seed.y, (seed.b - 0.5) * 0.7);
        const siltLeft = state.pass ? state.pass.outlet : (100 - quality);
        silt.dummy.scale.setScalar(index < Math.round(siltLeft / 3) ? 1 : 0.15);
        silt.dummy.updateMatrix();
        silt.mesh.setMatrixAt(index, silt.dummy.matrix);
      });
      silt.mesh.instanceMatrix.needsUpdate = true;
      statusMat.color.copy(state.gate?.violations > 0 ? new THREE.Color(0xd4656a) : mixColor(0xd4656a, 0x9fd7c8, quality / 100));
      statusMat.emissive.copy(statusMat.color);
      const fit = state.pass ? `${state.pass.outlet} silt out` : (state.gate ? `${state.gate.irrigation} L fit` : "Set a gate");
      readout.write(`${state.pass ? `${state.pass.caught} caught` : `${stages} stages`}\n${fit}`);
    },
  };
}

function cardTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const draw = canvas.getContext("2d");
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return { canvas, draw, map };
}

function moduleTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 160;
  const draw = canvas.getContext("2d");
  draw.fillStyle = "#10283a";
  draw.fillRect(0, 0, 256, 160);
  draw.strokeStyle = "rgba(186, 224, 238, 0.85)";
  draw.lineWidth = 3;
  for (let col = 0; col < 6; col += 1) {
    for (let row = 0; row < 4; row += 1) {
      draw.strokeRect(8 + col * 41, 8 + row * 37, 34, 30);
      draw.fillStyle = "rgba(90, 170, 204, 0.28)";
      draw.fillRect(12 + col * 41, 12 + row * 37, 26, 22);
    }
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

function buildHeart({ scene, kit, pick }) {
  scene.background = new THREE.Color(0x07080c);
  scene.fog = new THREE.Fog(0x07080c, 10, 22);
  scene.environmentIntensity = 0.2;
  scene.children.forEach((child) => {
    if (child.isDirectionalLight) child.intensity *= 0.38;
    if (child.isHemisphereLight) {
      child.color.set(0x243044);
      child.groundColor.set(0x140c10);
      child.intensity = 0.24;
    }
    if (!child.isMesh || !child.geometry?.parameters || child.geometry.parameters.width < 10) return;
    child.material.color.set(0x07080c);
    child.material.map = null;
    child.material.needsUpdate = true;
  });

  const deck = kit.include(new THREE.Mesh(
    new THREE.CircleGeometry(4.8, 72),
    new THREE.MeshStandardMaterial({ color: 0x100e12, roughness: 0.94, metalness: 0.06 }),
  ));
  deck.rotation.x = -Math.PI / 2;
  deck.position.y = 0.02;
  [1.05, 2.15, 3.35].forEach((radius, index) => {
    const guide = kit.include(new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.008, 8, 96),
      new THREE.MeshStandardMaterial({
        color: index === 0 ? 0x5a2430 : 0x2a2428,
        emissive: index === 0 ? 0x7a3040 : 0x241820,
        emissiveIntensity: 0.45,
        roughness: 0.5,
      }),
    ));
    guide.rotation.x = Math.PI / 2;
    guide.position.y = 0.045;
  });

  const coreMat = new THREE.MeshStandardMaterial({ color: 0x3a1218, emissive: 0x9a3040, emissiveIntensity: 0.95, roughness: 0.4, metalness: 0.22 });
  const muscle = new THREE.MeshStandardMaterial({ color: 0x4a1822, emissive: 0xc45058, emissiveIntensity: 0.5, roughness: 0.46, metalness: 0.18 });
  const pulse = kit.group();
  pulse.position.y = 0.96;
  const ventricle = kit.sphere(0.3, coreMat, pulse);
  ventricle.scale.set(1.08, 1.32, 0.84);
  ventricle.position.set(-0.08, -0.06, 0.03);
  const ventricleRight = kit.sphere(0.23, muscle, pulse);
  ventricleRight.scale.set(0.92, 1.18, 0.78);
  ventricleRight.position.set(0.18, -0.01, -0.03);
  const atriumLeft = kit.sphere(0.15, muscle, pulse);
  atriumLeft.position.set(-0.16, 0.3, 0.02);
  const atriumRight = kit.sphere(0.13, muscle, pulse);
  atriumRight.position.set(0.15, 0.28, -0.03);
  const aortaMat = new THREE.MeshStandardMaterial({ color: 0x5a2830, emissive: 0xd4656a, emissiveIntensity: 0.55, roughness: 0.38, metalness: 0.2 });
  kit.tube([
    [0.02, 0.2, 0.02],
    [0.2, 0.48, 0.06],
    [0.04, 0.64, 0],
    [-0.22, 0.48, -0.04],
  ], 0.05, aortaMat, pulse);
  const chambers = [0, 1, 2].map((index) => {
    const mat = new THREE.MeshBasicMaterial({ color: 0xd4656a, transparent: true, opacity: 0.8 });
    const torus = kit.include(new THREE.Mesh(new THREE.TorusGeometry(0.48 + index * 0.07, 0.011, 8, 64), mat), pulse);
    torus.rotation.x = index === 1 ? 1.15 : 0.45 + index * 0.4;
    torus.rotation.z = index * 0.85;
    return { torus, mat };
  });
  pick(pulse, { type: "hub", caption: "Core — drag up to move through the day", drag: { key: "step", min: 0, max: 95, step: 1, scale: 0.25, digits: 2, unit: " h", label: "Time" } });
  kit.label("Core", pulse).position.y = 0.86;
  const coreLight = new THREE.PointLight(0xd4656a, 2.4, 7.5, 1.5);
  coreLight.position.set(0, 1.1, 0);
  scene.add(coreLight);
  const flowLight = new THREE.PointLight(0x9ef6ff, 0.15, 8, 1.8);
  flowLight.position.set(0, 1.5, 0.2);
  scene.add(flowLight);

  const cells = [];
  for (let index = 0; index < 10; index += 1) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x2c2824, emissive: 0xf0c36a, emissiveIntensity: 0.04, roughness: 0.4, metalness: 0.35 });
    const pack = kit.box(0.1, 0.38, 0.12, mat);
    const angle = (index / 10) * Math.PI * 2;
    pack.position.set(Math.cos(angle) * 0.72, 0.28, Math.sin(angle) * 0.72);
    cells.push(mat);
  }
  const screen = cardTexture();
  const screenMat = new THREE.MeshStandardMaterial({ map: screen.map, emissiveMap: screen.map, color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.45, roughness: 0.45 });
  const screenMesh = kit.box(0.34, 0.16, 0.03, screenMat);
  screenMesh.position.set(0, 0.42, 0.78);
  const warn = kit.include(new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.012, 8, 40),
    new THREE.MeshStandardMaterial({ color: 0x8a3030, emissive: 0xd4656a, emissiveIntensity: 0.2, roughness: 0.4 }),
  ));
  warn.rotation.x = Math.PI / 2;
  warn.position.y = 0.5;
  warn.visible = false;

  const roleMat = {
    clinic: 0xf3efe6,
    homes: 0xe6d3a4,
    school: 0xd8c4a2,
    water: 0xd5e4e8,
  };
  const nodes = BUILDINGS.map((building) => {
    const body = kit.group();
    body.position.set(building.x, 0, building.z);
    kit.cyl(0.36, 0.05, kit.darkMat(), body).position.y = 0.05;
    kit.cyl(0.07, 0.22, kit.steelMat(), body).position.y = 0.18;
    const loadMat = new THREE.MeshStandardMaterial({
      color: roleMat[building.role],
      emissive: roleMat[building.role],
      emissiveIntensity: 0.35,
      roughness: 0.35,
      metalness: 0.25,
    });
    kit.sphere(building.role === "homes" ? 0.24 : 0.28, loadMat, body).position.y = 0.46;
    if (building.role === "homes") {
      kit.sphere(0.12, loadMat, body).position.set(-0.28, 0.3, 0.08);
      kit.sphere(0.11, loadMat, body).position.set(0.26, 0.28, -0.1);
    }
    if (building.role === "clinic") {
      const cross = new THREE.MeshStandardMaterial({ color: 0xf4efe6, emissive: 0xf4efe6, emissiveIntensity: 0.8, roughness: 0.4 });
      kit.box(0.16, 0.035, 0.02, cross, body).position.set(0, 0.38, 0.26);
      kit.box(0.035, 0.16, 0.02, cross, body).position.set(0, 0.38, 0.26);
    }
    if (building.role === "water") kit.cyl(0.08, 0.22, kit.steelMat(), body).position.set(0.22, 0.7, 0);
    const solarMat = new THREE.MeshStandardMaterial({ color: 0x8a5a18, emissive: 0xf0c36a, emissiveIntensity: 0.2, metalness: 0.4, roughness: 0.35 });
    kit.cyl(0.015, 0.28, kit.steelMat(), body).position.y = 0.78;
    const wafer = kit.box(0.38, 0.018, 0.24, solarMat, body);
    wafer.position.y = 0.94;
    wafer.rotation.x = -0.55;
    const cellMat = new THREE.MeshStandardMaterial({ color: 0xf0c36a, emissive: 0xf0c36a, emissiveIntensity: 0.35 });
    const cell = kit.box(0.08, 0.16, 0.04, cellMat, body);
    cell.position.set(0.34, 0.22, 0);
    cell.visible = false;
    kit.label(building.short, body).position.y = 1.22;
    const spillMat = new THREE.MeshStandardMaterial({ color: 0x8a5a18, emissive: 0xf0c36a, emissiveIntensity: 0.2, roughness: 0.4 });
    const spill = kit.include(new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.012, 8, 28), spillMat), body);
    spill.rotation.x = Math.PI / 2;
    spill.position.y = 0.16;
    spill.visible = false;
    pick(body, { type: "building", id: building.id, caption: building.short });
    return { id: building.id, body, loadMat, solarMat, cell, spill, spillMat, kwp: building.kwp };
  });

  const cables = [];
  const addCable = (id, points, radius) => {
    const sheath = new THREE.MeshStandardMaterial({
      color: 0x14181c,
      emissive: 0x7ec8c3,
      emissiveIntensity: 0.04,
      metalness: 0.65,
      roughness: 0.24,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });
    const core = new THREE.MeshBasicMaterial({ color: 0x66727c });
    const tube = kit.tube(points, radius, sheath);
    const inner = kit.tube(points, radius * 0.7, core);
    inner.mesh.castShadow = false;
    inner.mesh.raycast = () => {};
    const cableName = id === "tie-hs" ? "Homes–school tie" : `Artery ${id.replace("artery-", "")}`;
    pick(tube.mesh, { type: "cable", id, caption: cableName });
    const hinge = kit.group();
    const mid = points[1] || points[0];
    hinge.position.set(mid[0], mid[1], mid[2]);
    const blade = kit.box(0.22, 0.028, 0.05, kit.steelMat(), hinge);
    blade.position.y = 0.1;
    pick(hinge, { type: "cable", id, caption: cableName });
    const faultOrb = kit.sphere(0.1, new THREE.MeshBasicMaterial({ color: 0xff3b4e }), hinge);
    faultOrb.position.y = 0.1;
    faultOrb.visible = false;
    faultOrb.raycast = () => {};
    const limitRing = kit.include(new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.016, 8, 28),
      new THREE.MeshBasicMaterial({ color: 0xff6a32 }),
    ));
    limitRing.rotation.x = Math.PI / 2;
    limitRing.visible = false;
    limitRing.raycast = () => {};
    const beadMat = new THREE.MeshBasicMaterial({ color: 0xf4fffd });
    const beads = [0.08, 0.2, 0.32, 0.44, 0.56, 0.68, 0.8, 0.92].map((t) => {
      const mesh = kit.sphere(0.05, beadMat);
      mesh.castShadow = false;
      mesh.raycast = () => {};
      return { mesh, t };
    });
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false }));
    sprite.scale.set(0.86, 0.2, 1);
    sprite.visible = false;
    sprite.raycast = () => {};
    scene.add(sprite);
    cables.push({
      id,
      sheath,
      core,
      curve: tube.curve,
      beads,
      beadMat,
      hinge,
      faultOrb,
      label: { sprite, draw: canvas.getContext("2d"), map },
      tag: "",
      limitRing,
    });
  };
  const pull = (x, z, keep) => {
    const length = Math.hypot(x, z) || 1;
    const stop = Math.max(0.9, length - keep);
    return [(x / length) * stop, (z / length) * stop];
  };
  BUILDINGS.forEach((building) => {
    const reach = Math.hypot(building.x, building.z) || 1;
    const [endX, endZ] = pull(building.x, building.z, 0.62);
    addCable(`artery-${building.id}`, [
      [(building.x / reach) * 0.78, 0.95, (building.z / reach) * 0.78],
      [building.x * 0.5, 1.25, building.z * 0.5],
      [endX, 0.72, endZ],
    ], 0.052);
  });
  const homes = BUILDINGS.find((building) => building.id === "homes");
  const school = BUILDINGS.find((building) => building.id === "school");
  const tieDx = school.x - homes.x;
  const tieDz = school.z - homes.z;
  const tieLen = Math.hypot(tieDx, tieDz) || 1;
  const inset = 0.58;
  addCable("tie-hs", [
    [homes.x + (tieDx / tieLen) * inset, 0.7, homes.z + (tieDz / tieLen) * inset],
    [(homes.x + school.x) / 2 + 0.2, 1.35, (homes.z + school.z) / 2],
    [school.x - (tieDx / tieLen) * inset, 0.7, school.z - (tieDz / tieLen) * inset],
  ], 0.04);

  const dust = kit.specks(16, 0x8a8176);
  const ring = kit.include(new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.012, 8, 32),
    new THREE.MeshStandardMaterial({ color: 0xe6d3a4, emissive: 0xe6d3a4, emissiveIntensity: 0.7, roughness: 0.35 }),
  ));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.08;
  const ringTarget = new THREE.Vector3();
  let age = 0;

  function paintHub(card, lines) {
    const draw = card.draw;
    draw.clearRect(0, 0, 512, 256);
    draw.fillStyle = "#140c10";
    draw.fillRect(0, 0, 512, 256);
    lines.forEach((line, index) => {
      draw.fillStyle = index === 0 ? "#efe8dc" : "#e7b4b8";
      draw.font = "600 46px sans-serif";
      draw.fillText(line, 28, 70 + index * 58);
    });
    card.map.needsUpdate = true;
  }

  return {
    views: VIEWS.heart,
    fov: 40,
    pan: true,
    update(state, dt) {
      age += dt;
      const sky = state.sky ?? 0;
      const solar = state.solarKw ?? 0;
      const demand = state.demandKw ?? 0;
      const unmet = state.unmetKw ?? 0;
      const faultedNet = Boolean(state.fault);
      const stressed = demand > solar + 0.4;
      const rate = unmet > 0.08 ? 5.5 : stressed ? 3.4 : 2.1;
      const beat = 1 + Math.sin(age * rate) * (unmet > 0.08 ? 0.08 : 0.04);
      pulse.scale.setScalar(beat);
      coreMat.emissiveIntensity = faultedNet ? 1.35 : 0.55 + Math.max(0, Math.sin(age * rate)) * 0.85;
      coreMat.emissive.set(faultedNet ? 0xff4458 : stressed ? 0xe08a55 : 0x9a3040);
      muscle.emissiveIntensity = 0.28 + (state.flow === "discharge" ? 0.7 : state.flow === "charge" ? 0.35 : 0.12);
      aortaMat.emissiveIntensity = muscle.emissiveIntensity + 0.15;
      chambers.forEach((chamber, index) => {
        chamber.torus.rotation.z += dt * (0.12 + index * 0.04) * (state.flow === "discharge" ? 1.7 : 1);
        chamber.mat.color.set(faultedNet || unmet > 0.08 ? 0xff5a62 : state.flow === "discharge" ? 0xffc2a2 : 0xe7b4b8);
        chamber.mat.opacity = 0.35 + Math.max(0, Math.sin(age * rate + index)) * 0.55;
      });
      coreLight.color.set(faultedNet ? 0xff4458 : stressed ? 0xff9966 : 0xd4656a);
      coreLight.intensity = 1.5 + Math.max(0, Math.sin(age * rate)) * (faultedNet ? 2.4 : 1.5);
      flowLight.intensity = state.flow === "discharge" ? 2.1 : state.flow === "charge" ? 1.5 : state.flow === "share" ? 0.9 : 0.15;
      warn.visible = unmet > 0.08;
      warn.material.emissiveIntensity = unmet > 0.08 ? 0.4 + unmet : 0.05;
      const fill = Math.max(0, Math.min(1, state.hubFill ?? 0));
      const pooled = state.view !== "independent" && !state.linkDown;
      cells.forEach((mat, index) => {
        const on = state.view !== "independent" && fill >= (index + 0.2) / cells.length;
        mat.emissiveIntensity = on ? 0.2 + fill * 0.9 : 0.02;
        mat.color.set(on ? 0xf0c36a : 0x2c2824);
      });
      const curtailing = (state.curtailKw || 0) > 0.08;
      paintHub(screen, [
        state.view === "independent" ? "Independent" : "Coordinated",
        `Reserve ${Math.round(fill * 100)}%`,
        state.backup ? "Backup on" : state.flow === "charge" ? "Charging" : state.flow === "discharge" ? "Discharging" : fill > 0.98 && curtailing ? "Battery full" : curtailing ? "Curtailing" : state.flow === "share" ? "Sharing" : unmet > 0.08 ? "Shortage" : "Local supply",
      ]);
      const byId = new Map((state.buildings || []).map((item) => [item.id, item]));
      nodes.forEach((node) => {
        const row = byId.get(node.id);
        const gen = row?.gen || 0;
        const dem = row?.dem || 0;
        const served = row ? row.self + row.imported + row.fromBattery + row.fromBackup : 0;
        node.solarMat.emissiveIntensity = 0.05 + sky * 1.3 * (gen / Math.max(node.kwp, 0.2));
        const cover = dem > 0.05 ? served / dem : 1;
        node.loadMat.emissiveIntensity = 0.12 + Math.max(0, Math.min(1, cover)) * 0.9;
        node.loadMat.color.set(row?.criticalShort ? 0xd4656a : roleMat[row?.role] || roleMat.school);
        node.loadMat.emissive.copy(node.loadMat.color);
        node.cell.visible = state.view === "independent";
        node.cell.scale.y = state.view === "independent" ? Math.max(0.15, Math.min(1, row?.soc ?? fill)) : 1;
        const spilled = row?.curtailed || 0;
        node.spill.visible = spilled > 0.08;
        node.spillMat.emissiveIntensity = spilled > 0.08 ? 0.35 + Math.max(0, Math.sin(age * 3)) * 0.45 : 0.05;
      });
      const chosen = selectedNode(nodes, state.selected);
      ring.visible = Boolean(chosen || state.selected === "hub");
      if (state.selected === "hub") ringTarget.set(0, 0.08, 0);
      else if (chosen) ringTarget.set(chosen.body.position.x, 0.08, chosen.body.position.z);
      if (ring.visible) stepToward(ring, ringTarget, (dt || 1) * 3);
      cables.forEach((cable) => {
        const row = (state.cables || []).find((item) => item.id === cable.id);
        const faulted = state.view === "coordinated" && (row?.faulted || state.fault === cable.id);
        const load = row && row.capacity ? row.kw / row.capacity : 0;
        const carrying = pooled && row?.inService !== false && !faulted && (row?.kw || 0) > 0.05 && row?.dir;
        const hot = load > 0.92;
        const related = !state.selected || state.selected === "hub"
          || cable.id === `artery-${state.selected}`
          || (cable.id === "tie-hs" && (state.selected === "homes" || state.selected === "school"));
        const tone = !pooled || row?.inService === false ? 0x3a342c : faulted ? 0xff3b4e : hot ? 0xff6a32 : carrying ? 0xb8fff8 : 0x6a757c;
        cable.core.color.set(tone);
        cable.sheath.color.set(faulted ? 0x8a3038 : hot ? 0xff6a32 : 0x14181c);
        cable.sheath.emissive.set(tone);
        cable.sheath.opacity = faulted ? 0.9 : hot ? 0.15 : carrying ? 0.22 : 0.5;
        cable.sheath.emissiveIntensity = faulted || hot ? 1.1 : carrying ? 0.45 + load : 0.04;
        cable.beadMat.color.set(hot ? 0xffc2a2 : faulted ? 0xffb4ba : 0xf7fffd);
        cable.hinge.rotation.z = faulted ? 1.25 : 0;
        cable.faultOrb.visible = faulted;
        cable.limitRing.visible = hot && !faulted;
        if (hot && !faulted) {
          cable.limitRing.position.copy(cable.curve.getPoint(0.5));
          cable.limitRing.position.y += 0.02;
        }
        const engineering = state.camera === "detail";
        const showLabel = engineering || faulted || carrying || (related && state.selected && state.selected !== "hub" && state.camera !== "side");
        cable.label.sprite.visible = showLabel;
        if (showLabel) {
          const sense = !row?.dir ? "kW" : cable.id === "tie-hs" ? (row.dir > 0 ? "to school" : "to homes") : (row.dir > 0 ? "to load" : "to core");
          const text = faulted ? "Isolated" : row?.inService === false ? "Open" : `${(row?.kw || 0).toFixed(2)} ${sense}`;
          if (cable.tag !== text) {
            cable.tag = text;
            const draw = cable.label.draw;
            draw.clearRect(0, 0, 256, 64);
            draw.fillStyle = "rgba(8, 10, 12, 0.82)";
            draw.fillRect(8, 8, 240, 48);
            draw.font = "600 26px sans-serif";
            draw.fillStyle = faulted ? "#ffb4ba" : hot ? "#ffb089" : "#d7fffb";
            draw.textAlign = "center";
            draw.textBaseline = "middle";
            draw.fillText(text, 128, 32);
            cable.label.map.needsUpdate = true;
          }
          cable.label.sprite.position.copy(cable.curve.getPoint(0.5));
          cable.label.sprite.position.y += 0.32;
        }
        const speed = 0.16 + Math.min(row?.kw || 0, 8) * 0.07;
        const count = carrying ? Math.min(cable.beads.length, 2 + Math.round(Math.min(row.kw, 6))) : 0;
        cable.beads.forEach((bead, index) => {
          const on = index < count;
          if (dt > 0 && on) bead.t = ((bead.t + dt * speed * row.dir) % 1 + 1) % 1;
          bead.mesh.visible = on;
          if (!on) return;
          bead.mesh.position.copy(cable.curve.getPoint(bead.t));
          bead.mesh.scale.setScalar(index === 0 && related ? 1.85 : 0.9 + Math.min(load, 1) * 0.8);
        });
      });
      dust.seeds.forEach((seed, index) => {
        if (dt > 0) seed.a = (seed.a + dt * 0.03) % 1;
        const visible = (state.dust || 0) > 0.05;
        dust.dummy.position.set(-3 + seed.a * 6, 0.4 + seed.y * 1.6, -3 + seed.b * 6);
        dust.dummy.scale.setScalar(visible ? 0.35 + state.dust : 0.001);
        dust.dummy.updateMatrix();
        dust.mesh.setMatrixAt(index, dust.dummy.matrix);
      });
      dust.mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

function selectedNode(nodes, id) {
  return nodes.find((node) => node.id === id);
}

function buildBrain({ scene, kit, pick }) {
  const heightAt = (x, z) => {
    const ridge = Math.max(0, -z - 0.6) * 0.42;
    const hills = Math.sin(x * 0.85) * 0.16 + Math.cos((z + 0.4) * 0.9) * 0.1;
    const wadi = Math.exp(-(x * x) / 1.1) * 0.42;
    return Math.max(0, ridge + hills) - wadi;
  };
  const ground = kit.terrain(12, 8, 0xb08960, heightAt);
  const channelMat = new THREE.MeshPhysicalMaterial({ color: 0x2f8eb4, roughness: 0.2, transmission: 0.35, transparent: true, opacity: 0.8 });
  const channel = kit.box(1.1, 0.35, 6.2, channelMat);
  channel.position.set(0, 0.12, 0.2);
  const rain = kit.specks(40, 0x9fd4ef);
  const dust = kit.specks(24, 0xc4a574);
  const sites = [
    { key: "heat", name: "Hospital", x: 2.1, z: 0.6, color: 0xe7e0d4, w: 0.7, h: 0.55 },
    { key: "energy", name: "Substation", x: 2.6, z: -1.5, color: 0x3a4044, w: 0.6, h: 0.42 },
    { key: "air", name: "School", x: -2.2, z: 0.8, color: 0xd7c4a1, w: 0.65, h: 0.48 },
    { key: "water", name: "Wadi post", x: -0.15, z: 1.5, color: 0x8a8176, w: 0.45, h: 0.36 },
  ];
  const lights = [];
  sites.forEach((site) => {
    const y = Math.max(0, heightAt(site.x, site.z));
    const body = kit.group();
    body.position.set(site.x, y, site.z);
    const shell = kit.box(site.w, site.h, site.w * 0.8, new THREE.MeshStandardMaterial({ color: site.color, roughness: 0.8 }), body);
    shell.position.y = site.h / 2;
    kit.gable(site.w + 0.1, site.w * 0.9, 0.26, kit.sandMat(), body).position.y = site.h;
    const mat = new THREE.MeshStandardMaterial({ color: 0xf0c36a, emissive: 0xf0c36a, emissiveIntensity: 0.4 });
    const lamp = kit.sphere(0.05, mat, body);
    lamp.position.y = site.h + 0.34;
    lights.push(mat);
    kit.label(site.name, body).position.set(0, site.h + 0.62, 0);
    const drag = site.key === "heat"
      ? { key: "heat", min: 0, max: 2, step: 1, label: "Heat" }
      : site.key === "water"
        ? { key: "water", min: 0, max: 100, step: 1, unit: "%", label: "Water" }
        : site.key === "energy"
          ? { key: "solar", min: 0, max: 100, step: 1, unit: "%", label: "Solar" }
          : null;
    pick(body, { type: "give", key: site.key, caption: drag ? `${site.name} — drag` : site.name, drag });
  });
  [[-1.2, 0.2], [0.8, -0.4], [1.5, 1.1]].forEach(([x, z], index) => {
    const y = Math.max(0, heightAt(x, z));
    const home = kit.box(0.38, 0.32, 0.34, kit.sandMat());
    home.position.set(x, y + 0.16, z);
    if (index === 0) pick(home, { type: "give", key: "heat", caption: "Homes, heat" });
  });
  const road = kit.box(0.28, 0.04, 5.4, kit.darkMat());
  road.position.set(1.15, 0.08, 0.1);
  pick(road, { type: "budget", caption: "Clinic road — drag the repair budget", drag: { key: "budget", min: 0, max: 13, step: 1, label: "Road budget" } });
  const barrier = kit.group();
  barrier.position.set(1.15, 0.2, 0.8);
  kit.box(0.7, 0.28, 0.08, new THREE.MeshStandardMaterial({ color: 0xd4656a }), barrier);
  kit.box(0.08, 0.45, 0.08, kit.darkMat(), barrier).position.set(-0.28, 0.1, 0);
  kit.box(0.08, 0.45, 0.08, kit.darkMat(), barrier).position.set(0.28, 0.1, 0);
  const depot = new THREE.Vector3(-3.4, 0.2, -1.4);
  const goals = {
    heat: new THREE.Vector3(2.1, 0.25, 0.6),
    water: new THREE.Vector3(0, 0.2, 1.2),
    energy: new THREE.Vector3(2.6, 0.25, -1.5),
    air: new THREE.Vector3(-2.2, 0.25, 0.8),
  };
  const vans = ["heat", "water", "energy", "air"].map((key) => {
    const van = kit.group();
    kit.box(0.34, 0.16, 0.18, key === "heat" ? new THREE.MeshStandardMaterial({ color: 0xd4656a }) : kit.boneMat(), van).position.y = 0.12;
    kit.cyl(0.05, 0.04, kit.darkMat(), van).position.set(0.1, 0.04, 0.1);
    return { van, key, at: depot.clone() };
  });
  const readout = kit.board();
  readout.sprite.position.set(-3.2, 2.15, -1.2);

  return {
    views: VIEWS.brain,
    update(state, dt) {
      const risks = state.risks || { heat: 40, water: 40, energy: 40, air: 40 };
      const alloc = state.alloc || { heat: 0, water: 0, energy: 0, air: 0 };
      const flood = state.emergency === "flood" || state.emergency === "combined";
      const drought = state.emergency === "water";
      channel.scale.y = flood ? 0.4 + risks.water / 90 : drought ? 0.08 : 0.2;
      channel.position.y = 0.05 + channel.scale.y * 0.12;
      channelMat.color.copy(mixColor(drought ? 0x8a5a3a : 0x1d4e6e, 0x9fd4ef, flood ? risks.water / 140 : 0.2));
      ground.material.color.set(state.emergency === "heat" ? 0xc4895a : 0xb08960);
      barrier.visible = Boolean(state.roadClosed);
      readout.write(`Unmet ${Number(state.account || 0).toFixed(1)} kWh\nClinic ${state.roadClosed ? "cut" : "open"}`);
      lights.forEach((mat, index) => {
        const key = sites[index].key;
        const strain = risks[key] / 100;
        mat.emissiveIntensity = state.emergency === "grid" ? 0.05 + (1 - strain) * 0.4 : 0.2 + alloc[key] / 6;
      });
      rain.seeds.forEach((seed, index) => {
        seed.y = flood ? seed.y - dt * (0.8 + (state.severity || 3) * 0.15) : 1.2;
        if (seed.y < 0) seed.y = 2.4;
        rain.dummy.position.set(-4 + seed.a * 8, flood ? seed.y : -2, -3 + seed.b * 6);
        rain.dummy.scale.setScalar(flood ? 1 : 0.01);
        rain.dummy.updateMatrix();
        rain.mesh.setMatrixAt(index, rain.dummy.matrix);
      });
      rain.mesh.instanceMatrix.needsUpdate = true;
      dust.seeds.forEach((seed, index) => {
        const show = state.emergency === "dust" || state.emergency === "combined";
        dust.dummy.position.set(-3 + seed.a * 6, 0.4 + seed.b * 1.4 + dt, -1 + seed.y * 2);
        dust.dummy.scale.setScalar(show ? 0.8 + risks.air / 120 : 0.01);
        dust.dummy.updateMatrix();
        dust.mesh.setMatrixAt(index, dust.dummy.matrix);
      });
      dust.mesh.instanceMatrix.needsUpdate = true;
      vans.forEach((item) => {
        const goal = alloc[item.key] > 0 ? goals[item.key] : depot;
        item.at.lerp(goal, dt === 0 ? 1 : 1 - Math.exp(-dt * 1.4));
        item.van.position.copy(item.at);
        item.van.position.y = Math.max(item.at.y, heightAt(item.at.x, item.at.z) + 0.02);
      });
    },
  };
}

const LIVER_SHAPE = {
  plastic: { kind: "bottle", color: 0x3d7ea6 },
  metal: { kind: "can", color: 0xc5ccd4 },
  paper: { kind: "box", color: 0xefe8dc },
  food: { kind: "box", color: 0xc46a3a },
  plant: { kind: "cone", color: 0x6a8f4e },
  battery: { kind: "box", color: 0xd4656a },
  chemical: { kind: "bottle", color: 0x8b6bb5 },
  mixed: { kind: "box", color: 0x8d8376 },
};

function buildLiver({ kit, pick }) {
  const belt = kit.box(6.4, 0.12, 0.9, kit.darkMat());
  belt.position.set(-1.4, 0.2, 0);
  const beltMat = new THREE.MeshStandardMaterial({ color: 0x3a342c, roughness: 0.7 });
  const beltTop = kit.box(6.2, 0.04, 0.72, beltMat);
  beltTop.position.set(-1.4, 0.28, 0);
  for (let slat = 0; slat < 14; slat += 1) {
    const rib = kit.box(0.08, 0.03, 0.7, kit.steelMat());
    rib.position.set(-4.2 + slat * 0.42, 0.32, 0);
    rib.userData.rib = true;
  }
  const arch = kit.group();
  arch.position.set(-2.2, 0, 0);
  kit.box(0.08, 0.9, 0.08, kit.steelMat(), arch).position.set(-0.4, 0.7, -0.4);
  kit.box(0.08, 0.9, 0.08, kit.steelMat(), arch).position.set(-0.4, 0.7, 0.4);
  kit.box(0.9, 0.08, 0.08, kit.steelMat(), arch).position.set(0, 1.15, 0);
  const scanMat = new THREE.MeshStandardMaterial({ color: 0xe6d3a4, emissive: 0xe6d3a4, emissiveIntensity: 0.2 });
  const scan = kit.box(0.5, 0.05, 0.05, scanMat, arch);
  scan.position.set(0, 1.02, 0);
  const arm = kit.group();
  arm.position.set(0.35, 0.35, 0);
  kit.cyl(0.08, 0.7, kit.steelMat(), arm).position.y = 0.35;
  const boom = kit.box(0.9, 0.06, 0.06, kit.boneMat(), arm);
  boom.position.set(0.4, 0.7, 0);
  const bins = {
    recover: { x: -1.5, z: 1.55, color: 0xc6a56a },
    organic: { x: 1.6, z: 1.55, color: 0x6a8f4e },
    hazard: { x: -1.5, z: -1.45, color: 0xd4656a },
    remainder: { x: 1.6, z: -1.45, color: 0x8d8376 },
  };
  const binMeshes = {};
  Object.entries(bins).forEach(([id, bin]) => {
    const body = kit.group();
    body.position.set(bin.x, 0, bin.z);
    const mat = new THREE.MeshStandardMaterial({ color: bin.color, roughness: 0.62 });
    kit.box(1.25, 0.08, 1.05, mat, body).position.y = 0.08;
    kit.box(1.25, 0.4, 0.06, mat, body).position.set(0, 0.28, -0.5);
    kit.box(1.25, 0.4, 0.06, mat, body).position.set(0, 0.28, 0.5);
    kit.box(0.06, 0.4, 1.05, mat, body).position.set(-0.6, 0.28, 0);
    kit.box(0.06, 0.4, 1.05, mat, body).position.set(0.6, 0.28, 0);
    kit.label({ recover: "Recyclable", organic: "Organic", hazard: "Keep out", remainder: "General waste" }[id] || id, body).position.set(0, 0.95, 0);
    pick(body, { type: "assign", stream: id, caption: id[0].toUpperCase() + id.slice(1) });
    binMeshes[id] = { body, mat };
  });
  const items = LIVER_TOKENS.map((token, index) => {
    const spec = LIVER_SHAPE[token.id];
    const mat = new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.45, metalness: spec.kind === "can" ? 0.75 : 0.08 });
    let mesh;
    if (spec.kind === "bottle") mesh = kit.cyl(0.08, 0.28, mat);
    else if (spec.kind === "can") mesh = kit.cyl(0.1, 0.16, mat);
    else if (spec.kind === "cone") mesh = kit.include(new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.26, 10), mat));
    else mesh = kit.box(0.18, 0.14, 0.14, mat);
    const home = new THREE.Vector3(-4.3 + (index % 4) * 0.42, 0.5, index < 4 ? -0.15 : 0.15);
    mesh.position.copy(home);
    pick(mesh, { type: "pick", id: token.id, caption: token.label });
    return { id: token.id, mesh, mat, home };
  });
  const ribs = belt.parent.children.filter((child) => child.userData?.rib);
  const batchMat = new THREE.MeshStandardMaterial({ color: 0x3d7ea6, roughness: 0.4, emissive: 0x102030, emissiveIntensity: 0.2 });
  const batch = kit.cyl(0.11, 0.24, batchMat);
  batch.position.set(2.2, 0.45, 0);
  pick(batch, { type: "plastic", caption: "Plastic lot — drag contamination, tap to change the rule", drag: { key: "dirt", min: 0, max: 100, step: 1, unit: "%", label: "Plastic contamination" } });
  const readout = kit.board();
  readout.sprite.position.set(2.4, 1.7, 0);
  let beltShift = 0;

  return {
    views: VIEWS.liver,
    update(state, dt) {
      const placed = state.placed || {};
      const pace = state.pace ?? 40;
      beltShift = (beltShift + dt * (0.08 + pace / 180)) % 0.42;
      ribs.forEach((rib, index) => {
        rib.position.x = -4.3 + index * 0.42 + beltShift;
      });
      scanMat.emissiveIntensity = state.picked ? 1.4 : 0.15;
      const stacks = { recover: 0, organic: 0, hazard: 0, remainder: 0 };
      items.forEach((item) => {
        const stream = placed[item.id];
        let target = item.home;
        if (stream && bins[stream]) {
          const bin = bins[stream];
          target = new THREE.Vector3(bin.x, 0.62 + stacks[stream] * 0.12, bin.z);
          stacks[stream] += 1;
        }
        stepToward(item.mesh, target, dt * (0.45 + pace / 80));
        const picked = state.picked === item.id;
        item.mesh.scale.setScalar(picked ? 1.25 : 1);
        if (state.audited && stream) {
          const right = LIVER_KEY[item.id] === stream;
          item.mat.emissive.set(right ? 0x9ddeaf : 0xffb0b4);
          item.mat.emissiveIntensity = 0.55;
        } else {
          item.mat.emissiveIntensity = 0;
        }
      });
      const mud = (state.contamination || 0) / 100;
      binMeshes.recover.mat.color.copy(mixColor(0xc6a56a, 0x6a442c, mud));
      binMeshes.organic.mat.color.copy(mixColor(0x6a8f4e, 0x6a442c, mud * 0.8));
      if (state.cascade?.plasticTo && bins[state.cascade.plasticTo]) {
        const bin = bins[state.cascade.plasticTo];
        stepToward(batch, new THREE.Vector3(bin.x, 0.72, bin.z), dt);
        const dirty = state.cascade.contaminationIn > 0.05;
        batchMat.emissive.set(dirty ? 0x8a3038 : 0x245c40);
        batchMat.emissiveIntensity = 0.55;
      }
      const aim = state.picked && placed[state.picked] ? bins[placed[state.picked]] : null;
      if (aim) arm.lookAt(aim.x, 0.5, aim.z);
      readout.write(`Plastic ${state.cascade?.plasticTo || "lot"}\n${state.picked || "Select a token"}`);
    },
  };
}

function buildSkin({ scene, kit, pick }) {
  const court = kit.box(8.5, 0.06, 4.2, kit.sandMat());
  court.position.y = 0.03;
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffe2ad });
  const sun = kit.sphere(0.22, sunMat);
  pick(sun, { type: "sun", caption: "Sun — drag up for more light", drag: { key: "sun", min: 0, max: 100, step: 1, label: "Sunlight" } });
  const sunLight = new THREE.DirectionalLight(0xffe2b8, 2);
  scene.add(sunLight);
  scene.add(sunLight.target);
  sunLight.target.position.set(0, 1, 0);

  function building(x, adaptive) {
    const body = kit.group();
    body.position.set(x, 0, 0);
    kit.box(1.7, 0.12, 1.35, kit.stoneMat(), body).position.y = 0.06;
    kit.box(1.45, 1.35, 1.05, new THREE.MeshStandardMaterial({ color: adaptive ? 0xd9d0c2 : 0xcbb79a, roughness: 0.82 }), body).position.y = 0.84;
    kit.box(1.7, 0.08, 1.3, kit.darkMat(), body).position.y = 1.56;
    kit.gable(1.75, 1.35, 0.48, kit.sandMat(), body).position.y = 1.6;
    const panes = [];
    for (let floor = 0; floor < 2; floor += 1) {
      for (let col = 0; col < 3; col += 1) {
        const mat = new THREE.MeshStandardMaterial({ color: 0x203040, emissive: 0x4ea0c8, emissiveIntensity: 0.3, roughness: 0.15 });
        const pane = kit.box(0.28, 0.32, 0.04, mat, body);
        pane.position.set(-0.42 + col * 0.42, 0.55 + floor * 0.48, 0.56);
        panes.push(mat);
      }
    }
    const sensorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x4ea0c8, emissiveIntensity: 0.8 });
    const sensor = kit.box(0.08, 0.08, 0.08, sensorMat, body);
    sensor.position.set(0.8, 0.7, 0.4);
    let louvers = null;
    let skin = null;
    const vents = [];
    if (adaptive) {
      skin = kit.box(1.5, 1.2, 0.08, kit.boneMat(), body);
      skin.position.set(0, 0.85, 0.62);
      louvers = kit.group(body);
      louvers.position.set(0, 0.9, 0.78);
      for (let fin = 0; fin < 7; fin += 1) {
        const slat = kit.box(1.35, 0.035, 0.28, kit.sandMat(), louvers);
        slat.position.y = -0.42 + fin * 0.16;
      }
      for (let vent = 0; vent < 3; vent += 1) {
        const mat = new THREE.MeshStandardMaterial({ color: 0x9fd4ef, emissive: 0x9fd4ef, emissiveIntensity: 0.2 });
        const grille = kit.box(0.16, 0.08, 0.04, mat, body);
        grille.position.set(0.78, 0.5 + vent * 0.22, 0.58);
        pick(grille, { type: "power", caption: "Vent — drag for power", drag: { key: "power", min: 0, max: 3, step: 0.1, digits: 1, unit: " kW", label: "Power" } });
        vents.push(grille);
      }
    }
    kit.label(adaptive ? "Adaptive shell" : "Fixed shell", body).position.set(0, 2.3, 0);
    pick(body, {
      type: "shell",
      id: adaptive ? "adaptive" : "fixed",
      caption: adaptive ? "Adaptive shell — drag the shade" : "Fixed shell",
      drag: adaptive ? { key: "angle", min: 0, max: 75, step: 1, unit: "°", label: "Shade angle" } : undefined,
    });
    return { panes, sensorMat, louvers, skin, vents };
  }

  const fixed = building(-1.85, false);
  const adaptive = building(1.85, true);
  const readout = kit.board();
  readout.sprite.position.set(0, 2.55, 0);
  return {
    views: VIEWS.skin,
    update(state) {
      const sunLevel = state.sun ?? 80;
      const angle = state.angle ?? 20;
      const az = (angle / 75) * 1.05;
      sun.position.set(Math.sin(az) * 3.4, 1.8 + sunLevel / 80, Math.cos(az) * 2.6);
      sun.scale.setScalar(0.4 + sunLevel / 120);
      sunLight.position.copy(sun.position);
      sunLight.intensity = 0.35 + sunLevel / 28;
      sunMat.color.copy(mixColor(0x8a5a3a, 0xfff4d2, sunLevel / 100));
      const paint = (panes, heat) => {
        const color = mixColor(0x3a6f8a, 0xc44832, heat / 100);
        panes.forEach((mat) => {
          mat.emissive.copy(color);
          mat.emissiveIntensity = 0.25 + heat / 80;
        });
      };
      paint(fixed.panes, state.thermalFixed ?? state.fixed ?? 50);
      paint(adaptive.panes, state.thermalAdaptive ?? state.adaptive ?? 40);
      fixed.sensorMat.emissive.copy(mixColor(0x3a6f8a, 0xc44832, (state.fixed ?? 50) / 100));
      adaptive.sensorMat.emissive.copy(mixColor(0x3a6f8a, 0xc44832, (state.adaptive ?? 40) / 100));
      if (adaptive.louvers) {
        const closed = state.shade ? 0.15 : 1 - angle / 75;
        adaptive.louvers.children.forEach((slat) => {
          slat.rotation.x = (Math.PI / 2.4) * closed;
        });
      }
      if (adaptive.skin) adaptive.skin.scale.z = 0.6 + (state.insulation ?? 40) / 80;
      adaptive.vents.forEach((grille) => {
        grille.material.emissiveIntensity = state.ventOpen ? 0.85 : (state.vent ?? 0) / 180;
      });
      readout.write(`${state.shade ? "Shade closed" : "Shade open"}\nIndex ${state.thermalAdaptive ?? "—"}`);
    },
  };
}

function buildDigestive({ kit, pick }) {
  const shop = kit.group();
  shop.position.set(-3.6, 0, 0);
  kit.box(1.8, 1.15, 1.3, kit.boneMat(), shop).position.y = 0.58;
  kit.box(1.5, 0.7, 0.04, kit.glassMat(), shop).position.set(0, 0.6, 0.66);
  kit.label("Market", shop).position.set(0, 1.5, 0);
  const cold = kit.group();
  cold.position.set(-1.2, 0, 0);
  kit.box(1.3, 1, 1.15, new THREE.MeshStandardMaterial({ color: 0xd5e4ea, roughness: 0.4, metalness: 0.15 }), cold).position.y = 0.5;
  kit.label("Cold store", cold).position.set(0, 1.3, 0);
  const truck = kit.group();
  kit.box(1.35, 0.55, 0.7, kit.boneMat(), truck).position.y = 0.55;
  kit.box(0.46, 0.42, 0.66, kit.darkMat(), truck).position.set(-0.62, 0.52, 0);
  [[-0.35, 0.38], [0.42, 0.38], [-0.35, -0.38], [0.42, -0.38]].forEach(([x, z]) => {
    const wheel = kit.cyl(0.16, 0.1, kit.darkMat(), truck);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, 0.16, z);
  });
  kit.label("Chiller", truck).position.set(0, 1.15, 0);
  const hall = kit.group();
  hall.position.set(3.3, 0, 0.1);
  kit.box(1.5, 1.05, 1.2, kit.sandMat(), hall).position.y = 0.52;
  kit.label("Community", hall).position.set(0, 1.4, 0);
  const compostMat = new THREE.MeshStandardMaterial({ color: 0x6a4a32, roughness: 0.9 });
  const compost = kit.sphere(0.45, compostMat);
  compost.position.set(4.7, 0.22, -1.15);
  compost.scale.y = 0.6;
  kit.label("Compost", sceneParent(compost)).position.set(4.7, 0.9, -1.15);
  const colors = [0xe08a55, 0x7dcea0, 0xf0c36a, 0xd7c4a1, 0xd4656a];
  const crates = NOURISH_BATCHES.map((batch, index) => {
    const mat = new THREE.MeshStandardMaterial({ color: colors[index], roughness: 0.55 });
    return {
      id: batch.id,
      meals: batch.meals,
      held: kit.box(0.28, 0.18, 0.22, mat.clone()),
      rescued: kit.box(0.28, 0.18, 0.22, mat.clone()),
      waste: kit.box(0.28, 0.18, 0.22, mat.clone()),
    };
  });
  const crops = [
    { id: "tomato", name: "Tomato", x: -0.9 },
    { id: "barley", name: "Barley", x: 0.55 },
    { id: "date", name: "Date", x: 2.05 },
  ].map((crop) => {
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x8a6848, roughness: 0.9 });
    const soil = kit.box(1.05, 0.1, 0.72, soilMat);
    soil.position.set(crop.x, 0.05, 1.55);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x6a8f4e, roughness: 0.7 });
    const canopy = kit.sphere(0.2, leafMat);
    canopy.position.set(crop.x, 0.36, 1.55);
    kit.label(crop.name).position.set(crop.x, 0.78, 1.55);
    pick(soil, { type: "crop", id: crop.id, caption: crop.name });
    pick(canopy, { type: "crop", id: crop.id, caption: crop.name });
    return { ...crop, soilMat, canopy, leafMat };
  });

  pick(cold, { type: "storage", caption: "Cold store — drag capacity", drag: { key: "storage", min: 0, max: 80, step: 1, label: "Storage" } });
  pick(truck, { type: "move", caption: "Chiller — drag how many meals move", drag: { key: "move", min: 0, max: 30, step: 1, label: "Meals each hour" } });
  const readout = kit.board();
  readout.sprite.position.set(0.55, 2.15, 1.55);
  function sceneParent(mesh) { return mesh.parent; }

  return {
    views: VIEWS.digestive,
    update(state, dt) {
      const portrait = state.portrait || [];
      truck.position.set(1.15 + Math.sin((state.hour || 1) + dt) * (state.running ? 0.25 : 0), 0, 0.15);
      portrait.forEach((batch, index) => {
        const crate = crates[index];
        if (!crate) return;
        const held = batch.held / batch.meals;
        const rescued = batch.rescued / batch.meals;
        const waste = batch.waste / batch.meals;
        crate.held.position.set(-3.6 + (index - 2) * 0.22, 0.2 + held, 0.9);
        crate.held.scale.setScalar(Math.max(0.05, held));
        const truckTarget = new THREE.Vector3(truck.position.x, 0.85, truck.position.z);
        const hallTarget = new THREE.Vector3(3.3, 0.35 + index * 0.05, 0.7);
        const goal = rescued > 0.2 ? hallTarget : truckTarget;
        stepToward(crate.rescued, goal, dt);
        crate.rescued.scale.setScalar(Math.max(0.05, rescued));
        crate.waste.position.set(4.55, 0.25, -1.15 + (index - 2) * 0.16);
        crate.waste.scale.setScalar(Math.max(0.05, waste));
      });
      const waste = state.waste ?? 0;
      compost.scale.set(0.7 + waste / 80, 0.4 + waste / 120, 0.7 + waste / 80);
      const chosen = state.crop?.id;
      crops.forEach((crop) => {
        const selected = crop.id === chosen;
        const fit = selected && !state.crop?.unmet && !state.crop?.violation;
        crop.canopy.scale.setScalar(fit ? 0.7 + (state.crop.yieldIndex || 1) / 8 : 0.28);
        crop.leafMat.color.set(fit ? 0x6a8f4e : 0x8a5a3a);
        crop.soilMat.color.set(state.crop && state.crop.salinity > 0.55 ? 0xc4b48a : 0x8a6848);
        crop.canopy.position.y = fit ? 0.42 : 0.28;
      });
      const cropName = crops.find((crop) => crop.id === chosen)?.name || "Crop";
      readout.write(`${cropName}\nYield ${state.crop?.yieldIndex ?? 0}`);
    },
  };
}

function buildSkeleton({ kit, pick }) {
  const heightAt = (x, z) => {
    const bank = Math.abs(z) * 0.08;
    const cut = Math.exp(-((z - 1.15) ** 2) / 0.35) * 0.35;
    return bank - cut + 0.05;
  };
  kit.terrain(12, 7.5, 0xa78462, heightAt);
  const rocks = kit.group();
  [[-3.4, -1.4], [-2.2, 1.8], [1.4, -1.6], [3.2, 1.6], [0.4, -1.8]].forEach(([x, z], index) => {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16 + (index % 3) * 0.05, 0), kit.stoneMat());
    rock.position.set(x, 0.12, z);
    rock.rotation.set(index, index * 0.4, 0.2);
    rocks.add(rock);
  });
  const pads = ["low", "terrace", "high"].map((ground, index) => {
    const body = kit.group();
    const x = -2.5 + index * 2.5;
    body.position.set(x, 0, 0);
    const pad = kit.box(1.7, 0.16, 1.45, kit.stoneMat(), body);
    const waterMat = new THREE.MeshPhysicalMaterial({ color: 0x2f8eb4, transparent: true, opacity: 0.72, roughness: 0.18, transmission: 0.25 });
    const water = kit.box(1.55, 0.7, 1.3, waterMat, body);
    const walls = new THREE.MeshStandardMaterial({ color: 0x241c16, roughness: 0.75 });
    const building = kit.box(0.62, 0.7, 0.55, walls, body);
    kit.box(0.74, 0.06, 0.66, kit.sandMat(), body);
    const roof = body.children[body.children.length - 1];
    kit.label(`Plot ${index + 1}`, body).position.set(0, 1.55, 0);
    pick(body, { type: "plot", index, caption: `Plot ${index + 1}` });
    return { body, pad, water, waterMat, building, roof, walls };
  });
  const deck = kit.group();
  const deckMat = kit.stoneMat();
  kit.box(1.5, 0.1, 0.85, deckMat, deck);
  kit.box(0.08, 0.35, 0.08, kit.darkMat(), deck).position.set(-0.55, -0.2, -0.3);
  kit.box(0.08, 0.35, 0.08, kit.darkMat(), deck).position.set(0.55, -0.2, 0.3);
  const channelMat = new THREE.MeshStandardMaterial({ color: 0x5c564c, roughness: 0.7 });
  const channel = kit.box(7.4, 0.12, 0.42, channelMat);
  channel.position.set(0, 0.08, 1.55);
  const rain = kit.specks(36, 0xb7e4f2);
  const net = {
    gate: [-4.3, -2.15],
    junction: [-2.5, -2.15],
    clinic: [-0.9, -2.55],
    school: [-2.5, -2.75],
    homes: [-0.5, -2.75],
    water: [0.9, -2.15],
  };
  const links = [
    ["gate-junction", "gate", "junction"],
    ["junction-clinic", "junction", "clinic"],
    ["junction-school", "junction", "school"],
    ["school-homes", "school", "homes"],
    ["homes-clinic", "homes", "clinic"],
    ["junction-water", "junction", "water"],
  ].map(([id, a, b]) => {
    const [ax, az] = net[a];
    const [bx, bz] = net[b];
    const dx = bx - ax;
    const dz = bz - az;
    const mat = new THREE.MeshStandardMaterial({ color: 0xc6a56a, roughness: 0.7 });
    const mesh = kit.box(Math.hypot(dx, dz), 0.05, 0.1, mat);
    mesh.position.set((ax + bx) / 2, 0.1, (az + bz) / 2);
    mesh.rotation.y = -Math.atan2(dz, dx);
    pick(mesh, { type: "road", id, caption: id.replace("-", " to ") });
    return { id, mesh, mat };
  });
  const clinicMat = new THREE.MeshStandardMaterial({ color: 0x9fd7c8, emissive: 0x9fd7c8, emissiveIntensity: 0.6 });
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x7ec8c3, emissive: 0x7ec8c3, emissiveIntensity: 0.5 });
  const clinicMark = kit.sphere(0.1, clinicMat);
  clinicMark.position.set(net.clinic[0], 0.28, net.clinic[1]);
  const waterMark = kit.sphere(0.1, waterMat);
  waterMark.position.set(net.water[0], 0.28, net.water[1]);
  kit.label("Clinic road").position.set(net.clinic[0], 0.55, net.clinic[1]);
  kit.label("Water road").position.set(net.water[0], 0.55, net.water[1]);
  pick(deck, { type: "bridge", caption: "Bridge deck" });
  pick(channel, { type: "shared", caption: "Drainage — drag capacity, tap to share", drag: { key: "drainage", min: 0, max: 100, step: 1, label: "Drainage" } });
  const rainCloud = kit.sphere(0.42, new THREE.MeshStandardMaterial({ color: 0xd5e4ea, transparent: true, opacity: 0.82, roughness: 0.4 }));
  rainCloud.position.set(-3.4, 2.5, 0.2);
  pick(rainCloud, { type: "rain", caption: "Rain cloud — drag", drag: { key: "rain", min: 0, max: 100, step: 1, label: "Rain" } });
  const readout = kit.board();
  readout.sprite.position.set(2.6, 1.8, -2.2);
  return {
    views: VIEWS.skeleton,
    update(state, dt) {
      const grounds = state.grounds || ["low", "terrace", "high"];
      const plots = state.plots || [];
      pads.forEach((pad, index) => {
        const ground = grounds[index];
        const lift = ground === "high" ? 1.15 : ground === "terrace" ? 0.52 : 0;
        pad.body.position.y = lift;
        const exposure = plots[index]?.exposure ?? 0;
        const level = Math.max(0.04, exposure / 100);
        pad.water.scale.y = level;
        pad.water.position.y = 0.16 + (0.7 * level) / 2;
        const label = plots[index]?.label;
        const color = label === "Protected" ? 0x7dcea0 : label === "Strain" ? 0xe0b15a : 0xd4656a;
        pad.walls.emissive.set(color);
        pad.walls.emissiveIntensity = 0.18;
        pad.roof.position.y = 0.78;
      });
      deck.position.set(0, state.bridge === "raised" ? 0.78 : 0.28, 1.15);
      channel.scale.y = 0.4 + (state.drainage ?? 30) / 70;
      rainCloud.scale.setScalar(0.55 + (state.rain ?? 0) / 90);
      rainCloud.position.y = 2.15 + (state.rain ?? 0) / 160;
      channelMat.color.set(state.shared ? 0x3aa0c8 : 0x5c564c);
      const wet = (state.rain ?? 0) > 2;
      rain.seeds.forEach((seed, index) => {
        if (wet) seed.y -= dt * (state.running ? 1.3 : 0.45) * (0.4 + (state.rain ?? 0) / 80);
        if (seed.y < 0) seed.y = 2.6;
        rain.dummy.position.set(-4.5 + seed.a * 9, wet ? seed.y : -3, -2.2 + seed.b * 4.5);
        rain.dummy.scale.setScalar(wet && index < Math.round((state.rain ?? 0) / 3) ? 1 : 0.01);
        rain.dummy.updateMatrix();
        rain.mesh.setMatrixAt(index, rain.dummy.matrix);
      });
      rain.mesh.instanceMatrix.needsUpdate = true;
      if (state.openRoads) {
        links.forEach((link) => {
          const on = state.openRoads.includes(link.id);
          link.mat.color.set(on ? 0xc6a56a : 0x8a3038);
          link.mesh.position.y = on ? 0.1 : 0.03;
        });
        clinicMat.color.set(state.reachClinic ? 0x9fd7c8 : 0xd4656a);
        clinicMat.emissive.copy(clinicMat.color);
        waterMat.color.set(state.reachWater ? 0x7ec8c3 : 0xd4656a);
        waterMat.emissive.copy(waterMat.color);
      }
      readout.write(`Clinic ${state.reachClinic ? "open" : "cut"}\nWater ${state.reachWater ? "open" : "cut"}`);
    },
  };
}

function buildLungs({ kit, pick }) {
  const shell = kit.group();
  kit.box(3.4, 0.08, 1.7, kit.darkMat(), shell).position.y = 0.08;
  kit.box(3.4, 0.08, 1.7, kit.darkMat(), shell).position.y = 1.7;
  kit.box(0.08, 1.7, 1.7, kit.steelMat(), shell).position.set(0, 0.85, -0.84);
  kit.box(0.04, 1.5, 1.45, kit.glassMat(), shell).position.set(-1.55, 0.85, 0);
  kit.box(0.04, 1.5, 1.45, kit.glassMat(), shell).position.set(1.55, 0.85, 0);
  const inlet = kit.cyl(0.28, 1.1, kit.steelMat(), shell, 20);
  inlet.rotation.z = Math.PI / 2;
  inlet.position.set(-2.3, 0.9, 0);
  pick(inlet, { type: "sensor", id: "in", caption: "Inlet — drag the outside reading", drag: { key: "pm", min: 0, max: 200, step: 1, label: "Outside reading" } });
  const outlet = kit.cyl(0.28, 1.1, kit.steelMat(), shell, 20);
  outlet.rotation.z = Math.PI / 2;
  outlet.position.set(2.3, 0.9, 0);
  const housing = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.05, 10, 24), kit.steelMat());
  housing.castShadow = true;
  housing.rotation.y = Math.PI / 2;
  housing.position.set(-0.55, 0.9, 0);
  shell.add(housing);
  const fan = kit.group(shell);
  fan.position.set(-0.55, 0.9, 0);
  pick(fan, { type: "fan", caption: "Fan — drag the speed", drag: { key: "fan", min: 0, max: 100, step: 1, label: "Fan" } });
  pick(outlet, { type: "spread", caption: "Outlet air" });
  for (let blade = 0; blade < 5; blade += 1) {
    const pivot = kit.group(fan);
    pivot.rotation.x = (blade / 5) * Math.PI * 2;
    const fin = kit.box(0.05, 0.38, 0.12, kit.boneMat(), pivot);
    fin.position.y = 0.24;
  }
  const hub = kit.sphere(0.08, new THREE.MeshStandardMaterial({ color: 0xe08a55, emissive: 0xe08a55, emissiveIntensity: 0.4 }), fan);
  const filterMat = new THREE.MeshStandardMaterial({ color: 0xe7eef2, roughness: 0.55 });
  const pleats = kit.group(shell);
  pleats.position.set(0.55, 0.9, 0);
  for (let fin = 0; fin < 9; fin += 1) {
    const pleat = kit.box(0.035, 1.15, 0.55, filterMat, pleats);
    pleat.position.x = (fin - 4) * 0.07;
    pleat.rotation.y = fin % 2 === 0 ? 0.35 : -0.35;
  }
  pick(pleats, { type: "filter", caption: "Filter pack — drag efficiency", drag: { key: "efficiency", min: 0, max: 100, step: 1, label: "Filter efficiency" } });
  const inMat = new THREE.MeshStandardMaterial({ color: 0xc4a574, emissive: 0xc4a574, emissiveIntensity: 0.35 });
  const outMat = new THREE.MeshStandardMaterial({ color: 0x7dcea0, emissive: 0x7dcea0, emissiveIntensity: 0.25 });
  kit.box(0.16, 0.16, 0.16, inMat, shell).position.set(-2.15, 0.35, 0.7);
  kit.box(0.16, 0.16, 0.16, outMat, shell).position.set(2.15, 0.35, 0.7);
  kit.label("Inlet sensor", shell).position.set(-2.15, 0.7, 0.7);
  kit.label("Outlet sensor", shell).position.set(2.15, 0.7, 0.7);
  kit.label("Filter", shell).position.set(0.55, 1.7, 0);
  const dust = kit.specks(30, 0xc4a574);
  const caught = kit.specks(18, 0x7dcea0);
  const hazeMat = new THREE.MeshBasicMaterial({ color: 0xc4a574, transparent: true, opacity: 0.05, depthWrite: false });
  const haze = kit.box(4.4, 2.1, 0.04, hazeMat);
  haze.position.set(0, 1.05, -1.15);
  const readout = kit.board();
  readout.sprite.position.set(0, 2.15, 0);
  return {
    views: VIEWS.lungs,
    update(state, dt) {
      const fanSpeed = state.fan ?? 0;
      const airflow = state.airflow ?? 0;
      const particles = state.particles ?? 0;
      const removed = state.removed ?? 0;
      const condition = state.condition ?? 80;
      fan.rotation.x += dt * ((state.airflow ?? fanSpeed) / 16);
      const loaded = state.loaded ?? 0;
      filterMat.color.copy(mixColor(0x6a442c, 0xe7eef2, 1 - Math.min(1, loaded / Math.max(particles, 1))));
      const share = particles === 0 ? 0 : removed / particles;
      dust.seeds.forEach((seed, index) => {
        const show = index < Math.round(particles / 4);
        seed.y = (seed.y + dt * (0.15 + airflow / 180)) % 1;
        const x = -1.9 + seed.y * 3.6;
        const stuck = x > 0.2 && seed.a < share;
        dust.dummy.position.set(stuck ? 0.4 + seed.a * 0.3 : x, 0.7 + seed.b * 0.45, (seed.a - 0.5) * 0.4);
        dust.dummy.scale.setScalar(show && !stuck ? 1 : 0.01);
        dust.dummy.updateMatrix();
        dust.mesh.setMatrixAt(index, dust.dummy.matrix);
      });
      dust.mesh.instanceMatrix.needsUpdate = true;
      caught.seeds.forEach((seed, index) => {
        const show = index < Math.round(removed / 6);
        caught.dummy.position.set(0.35 + (index % 5) * 0.06, 0.55 + seed.b * 0.7, (seed.a - 0.5) * 0.35);
        caught.dummy.scale.setScalar(show ? 1 : 0.01);
        caught.dummy.updateMatrix();
        caught.mesh.setMatrixAt(index, caught.dummy.matrix);
      });
      caught.mesh.instanceMatrix.needsUpdate = true;
      inMat.emissiveIntensity = 0.15 + particles / 90;
      outMat.emissiveIntensity = 0.1 + (state.remaining ?? 0) / 140;
      const claim = state.claim || "clear";
      hazeMat.color.set(claim === "hold" ? 0xe0b15a : claim === "dust" ? 0xc4a574 : 0x9fd4ef);
      hazeMat.opacity = claim === "dust" ? 0.34 : claim === "local" ? 0.16 : claim === "hold" ? 0.2 : 0.04;
      haze.position.x = claim === "local" ? -1.1 : 0;
      readout.write(`${claim}\nCaught ${Math.round(removed)}`);
    },
  };
}

function sceneParent(mesh) {
  return mesh.parent;
}

export function buildWorld(kind, ctx) {
  return buildPrototype(kind, ctx);
}
