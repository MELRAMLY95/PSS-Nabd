import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildWorld } from "./worlds.js";

function grainTexture(base, fleck) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const draw = canvas.getContext("2d");
  draw.fillStyle = base;
  draw.fillRect(0, 0, 128, 128);
  for (let dot = 0; dot < 700; dot += 1) {
    draw.fillStyle = dot % 3 === 0 ? fleck : "rgba(255,255,255,0.12)";
    draw.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createKit(scene) {
  const sandTex = grainTexture("#c4a36a", "#8a6840");
  const stoneTex = grainTexture("#9a9186", "#5e584f");
  const steelMat = () => new THREE.MeshStandardMaterial({ color: 0xb7c0c6, metalness: 0.82, roughness: 0.28 });
  const darkMat = () => new THREE.MeshStandardMaterial({ color: 0x1c1916, metalness: 0.48, roughness: 0.46 });
  const sandMat = () => new THREE.MeshStandardMaterial({ map: sandTex, color: 0xffffff, roughness: 0.9, metalness: 0.02 });
  const stoneMat = () => new THREE.MeshStandardMaterial({ map: stoneTex, color: 0xffffff, roughness: 0.92, metalness: 0.03 });
  const boneMat = () => new THREE.MeshStandardMaterial({ color: 0xe7dfd2, roughness: 0.62, metalness: 0.08 });
  const glassMat = () => new THREE.MeshStandardMaterial({
    color: 0xe7f4f8,
    roughness: 0.06,
    metalness: 0.12,
    transparent: true,
    opacity: 0.42,
    emissive: 0x9fd4ef,
    emissiveIntensity: 0.08,
    depthWrite: false,
  });
  const waterMat = (color) => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.12,
    metalness: 0.06,
    emissive: color,
    emissiveIntensity: 0.22,
    transparent: true,
    opacity: 0.92,
  });

  function add(mesh, parent = scene) {
    parent.add(mesh);
    return mesh;
  }

  function include(mesh, parent = scene) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return add(mesh, parent);
  }

  function box(w, h, d, material, parent = scene) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return add(mesh, parent);
  }

  function cyl(radius, height, material, parent = scene, segments = 20) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return add(mesh, parent);
  }

  function sphere(radius, material, parent = scene) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 18, 12), material);
    mesh.castShadow = true;
    return add(mesh, parent);
  }

  function group(parent = scene) {
    const next = new THREE.Group();
    parent.add(next);
    return next;
  }

  function openTank({ parent = scene, w, h, d, x = 0, y = 0, z = 0, water = 0x7eb8b2 }) {
    const body = group(parent);
    body.position.set(x, y, z);
    const frame = steelMat();
    const panes = glassMat();
    const floor = box(w, 0.05, d, frame, body);
    floor.position.y = 0.025;
    [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]].forEach(([px, pz]) => {
      const post = box(0.055, h, 0.055, frame, body);
      post.position.set(px, h / 2, pz);
    });
    [
      [w - 0.08, h - 0.06, 0.03, 0, h / 2, -d / 2],
      [w - 0.08, h - 0.06, 0.03, 0, h / 2, d / 2],
      [0.03, h - 0.06, d - 0.08, -w / 2, h / 2, 0],
      [0.03, h - 0.06, d - 0.08, w / 2, h / 2, 0],
    ].forEach(([ww, hh, dd, px, py, pz]) => {
      const pane = box(ww, hh, dd, panes, body);
      pane.position.set(px, py, pz);
      pane.castShadow = false;
    });
    const material = waterMat(water);
    const volume = box(w - 0.16, h - 0.14, d - 0.16, material, body);
    volume.castShadow = false;
    const height = h - 0.14;
    volume.scale.y = 0.65;
    volume.position.y = 0.06 + (height * 0.65) / 2;
    return { body, water: volume, material, height };
  }

  function setLevel(tank, level) {
    const next = Math.max(0.05, Math.min(1, level));
    tank.water.scale.y = next;
    tank.water.position.y = 0.06 + (tank.height * next) / 2;
  }

  function gable(w, d, rise, material, parent = scene) {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0);
    shape.lineTo(0, rise);
    shape.lineTo(w / 2, 0);
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
    geometry.translate(0, 0, -d / 2);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function tube(points, radius, material, parent = scene) {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, radius, 8, false), material);
    mesh.castShadow = true;
    parent.add(mesh);
    return { mesh, curve };
  }

  function label(text, parent = scene) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const draw = canvas.getContext("2d");
    draw.fillStyle = "rgba(18, 16, 14, 0.62)";
    draw.fillRect(12, 8, 232, 48);
    draw.font = "600 26px Instrument Sans, sans-serif";
    draw.fillStyle = "#efe8dc";
    draw.textAlign = "center";
    draw.textBaseline = "middle";
    draw.fillText(text, 128, 32);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false }));
    sprite.scale.set(1.25, 0.32, 1);
    parent.add(sprite);
    return sprite;
  }

  function board(parent = scene) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 160;
    const draw = canvas.getContext("2d");
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false }));
    sprite.scale.set(1.85, 0.58, 1);
    parent.add(sprite);
    let last = "";
    function write(text) {
      const next = String(text);
      if (next === last) return;
      last = next;
      draw.clearRect(0, 0, 512, 160);
      draw.fillStyle = "rgba(7, 8, 12, 0.86)";
      draw.fillRect(8, 8, 496, 144);
      draw.strokeStyle = "rgba(230, 211, 164, 0.75)";
      draw.lineWidth = 4;
      draw.strokeRect(12, 12, 488, 136);
      draw.font = "600 34px JetBrains Mono, ui-monospace, monospace";
      draw.fillStyle = "#efe8dc";
      draw.textAlign = "center";
      draw.textBaseline = "middle";
      const lines = next.split("\n").slice(0, 2);
      lines.forEach((line, index) => {
        draw.fillText(line.slice(0, 26), 256, lines.length === 1 ? 80 : 56 + index * 48);
      });
      map.needsUpdate = true;
    }
    write(" ");
    return { sprite, write };
  }

  function specks(count, color) {
    const mesh = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.028, 6, 5),
      new THREE.MeshStandardMaterial({ color, roughness: 0.45 }),
      count,
    );
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.castShadow = false;
    scene.add(mesh);
    const seeds = Array.from({ length: count }, (_, index) => ({
      a: ((index * 37) % 100) / 100,
      b: ((index * 17) % 100) / 100,
      y: ((index * 53) % 100) / 100,
    }));
    return { mesh, seeds, dummy: new THREE.Object3D() };
  }

  function terrain(width, depth, color, heightAt) {
    const geometry = new THREE.PlaneGeometry(width, depth, 36, 24);
    geometry.rotateX(-Math.PI / 2);
    const position = geometry.attributes.position;
    for (let index = 0; index < position.count; index += 1) {
      position.setY(index, heightAt(position.getX(index), position.getZ(index)));
    }
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.94, metalness: 0.02 }));
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    scene.add(mesh);
    return mesh;
  }

  return { box, cyl, sphere, group, include, openTank, setLevel, gable, tube, label, board, specks, terrain, steelMat, darkMat, sandMat, stoneMat, boneMat, glassMat, waterMat };
}

export function mountLab(host, kind, api) {
  const phone = window.matchMedia("(max-width: 760px)").matches;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduce = motion.matches;
  const onMotion = () => { reduce = motion.matches; };
  motion.addEventListener("change", onMotion);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: phone ? "default" : "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 1.35));
  renderer.setClearColor(0x100e0c, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = !phone;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";
  renderer.domElement.style.touchAction = "none";
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c0b0a);
  scene.fog = new THREE.Fog(0x0c0b0a, 18, 36);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = phone ? 0.45 : 0.55;

  const key = new THREE.DirectionalLight(0xfff4e4, phone ? 2.4 : 3.1);
  key.position.set(5, 9, 6);
  key.castShadow = !phone;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 28;
  key.shadow.camera.left = -8;
  key.shadow.camera.right = 8;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -8;
  key.shadow.bias = -0.00035;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xf0d7b0, 1.15);
  rim.position.set(-6, 4, -3);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xf3ead8, 0x2a241c, 0.34));

  const kit = createKit(scene);
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(4.7, 5.05, 0.18, 72),
    new THREE.MeshStandardMaterial({ color: 0x171410, roughness: 0.62, metalness: 0.22 }),
  );
  plinth.position.y = -0.09;
  plinth.receiveShadow = true;
  scene.add(plinth);
  const inlay = new THREE.Mesh(
    new THREE.TorusGeometry(4.15, 0.018, 8, 96),
    new THREE.MeshStandardMaterial({ color: 0xe6d3a4, emissive: 0xc6a56a, emissiveIntensity: 0.45, metalness: 0.7, roughness: 0.28 }),
  );
  inlay.rotation.x = Math.PI / 2;
  inlay.position.y = 0.015;
  scene.add(inlay);
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(3.1, 48),
    new THREE.MeshBasicMaterial({ color: 0xc6a56a, transparent: true, opacity: 0.09, depthWrite: false }),
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.02;
  scene.add(pool);
  if (kind !== "heart") {
    const spot = new THREE.SpotLight(0xffe6c4, phone ? 2.4 : 3.6, 14, 0.4, 0.32, 1.15);
    const cool = new THREE.DirectionalLight(0x8ec8d8, 0.7);
    cool.position.set(-5, 3.2, -2);
    scene.add(cool);
    spot.position.set(1.5, 7.2, 3.2);
    spot.target.position.set(0, 0.4, 0);
    spot.castShadow = false;
    scene.add(spot);
    scene.add(spot.target);
  }

  const pickables = [];
  const world = buildWorld(kind, {
    scene,
    kit,
    pick(mesh, action) {
      mesh.userData.action = action;
      pickables.push(mesh);
      if (!action?.drag) return;
      const grip = new THREE.Mesh(
        new THREE.SphereGeometry(0.58, 10, 8),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
      );
      if (mesh.isGroup) grip.position.y = 0.42;
      mesh.add(grip);
      pickables.push(grip);
    },
  });

  if (world.fov) {
    camera.fov = world.fov;
    camera.updateProjectionMatrix();
  }

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI / 2.04;
  controls.minDistance = 2.2;
  controls.maxDistance = 16;
  controls.enablePan = Boolean(world.pan);
  controls.screenSpacePanning = true;
  controls.panSpeed = 0.55;
  const desiredPos = new THREE.Vector3();
  const desiredTarget = new THREE.Vector3();
  let viewName = "overview";
  let dragging = false;
  const onStart = () => { dragging = true; };
  const onEnd = () => { dragging = false; };
  controls.addEventListener("start", onStart);
  controls.addEventListener("end", onEnd);

  function setView(name) {
    const view = world.views[name] || world.views.overview;
    viewName = world.views[name] ? name : "overview";
    desiredPos.set(...view.pos);
    desiredTarget.set(...view.target);
    dragging = false;
    if (reduce) {
      camera.position.copy(desiredPos);
      controls.target.copy(desiredTarget);
    }
  }
  setView("overview");
  camera.position.copy(desiredPos);
  controls.target.copy(desiredTarget);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const aim = new THREE.Mesh(
    new THREE.RingGeometry(0.1, 0.145, 24),
    new THREE.MeshBasicMaterial({ color: 0xe6d3a4, transparent: true, opacity: 0.92, depthTest: false, side: THREE.DoubleSide }),
  );
  aim.visible = false;
  aim.renderOrder = 6;
  scene.add(aim);
  const helper = new THREE.BoxHelper(new THREE.Object3D(), 0xe6d3a4);
  helper.visible = false;
  helper.material.depthTest = false;
  helper.material.transparent = true;
  helper.material.opacity = 0.9;
  scene.add(helper);
  let down = null;
  let grab = null;
  let pending = null;
  let hoverNode = null;
  let hoverCaption = "";
  function aimAt(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(pickables, true)[0];
    let node = hit?.object;
    while (node && !node.userData.action) node = node.parent;
    return { hit, node };
  }
  function setHover(caption) {
    if (caption === hoverCaption) return;
    hoverCaption = caption;
    host.dispatchEvent(new CustomEvent("lab-hover", { detail: caption }));
  }
  function readDrag(state, drag) {
    const raw = state?.[drag.key];
    const value = drag.id ? raw?.[drag.id] : raw;
    const number = Number(value);
    return Number.isFinite(number) ? number : (drag.fallback ?? drag.min);
  }
  function dragText(drag, value) {
    const shown = value * (drag.scale ?? 1);
    const digits = drag.digits ?? 0;
    return `${drag.label} ${shown.toFixed(digits)}${drag.unit || ""}`;
  }
  function dragAt(drag, start, dy) {
    const span = drag.max - drag.min;
    const next = start + (-dy / 170) * span;
    const stepped = Math.round(next / drag.step) * drag.step;
    const clamped = Math.min(drag.max, Math.max(drag.min, stepped));
    const places = String(drag.step).includes(".") ? String(drag.step).split(".")[1].length : 0;
    return Number(clamped.toFixed(places));
  }
  function publishDrag(entry, live) {
    api.onAction?.({ type: "drag", key: entry.drag.key, id: entry.drag.id, value: entry.value });
    host.dispatchEvent(new CustomEvent(live ? "lab-drag" : "lab-drag-end", { detail: dragText(entry.drag, entry.value) }));
  }
  const onDown = (event) => {
    if (event.button !== 0) return;
    const { hit, node } = aimAt(event);
    const drag = node?.userData.action?.drag;
    if (drag) {
      controls.enabled = false;
      const start = readDrag(api.getState() || {}, drag);
      grab = { drag, y: event.clientY, start, value: start, moved: 0, node, action: node.userData.action, point: hit?.point.clone() };
      pending = null;
      renderer.domElement.setPointerCapture(event.pointerId);
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    down = { x: event.clientX, y: event.clientY };
  };
  const onUp = (event) => {
    if (grab) {
      grab.moved = Math.abs(event.clientY - grab.y);
      if (grab.moved >= 8) publishDrag(grab, false);
      else if (grab.action) api.onAction?.(grab.action);
      pending = null;
      grab = null;
      controls.enabled = true;
      if (renderer.domElement.hasPointerCapture?.(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
      return;
    }
    if (!down) return;
    const moved = (event.clientX - down.x) ** 2 + (event.clientY - down.y) ** 2;
    down = null;
    if (moved > 20) return;
    const { node } = aimAt(event);
    if (node?.userData.action) api.onAction?.(node.userData.action);
  };
  const onMove = (event) => {
    if (grab) {
      const value = dragAt(grab.drag, grab.start, event.clientY - grab.y);
      grab.value = value;
      grab.moved = Math.abs(event.clientY - grab.y);
      pending = { drag: grab.drag, value };
      renderer.domElement.style.cursor = "ns-resize";
      hoverNode = grab.node;
      if (grab.point) {
        aim.visible = true;
        aim.position.copy(grab.point);
        aim.scale.setScalar(1.35);
      }
      setHover(dragText(grab.drag, value));
      return;
    }
    const { hit, node } = aimAt(event);
    const draggable = Boolean(node?.userData.action?.drag);
    renderer.domElement.style.cursor = draggable ? "ns-resize" : node ? "pointer" : "grab";
    aim.visible = Boolean(node && hit);
    aim.scale.setScalar(draggable ? 1.2 : 1);
    if (node && hit) aim.position.copy(hit.point);
    hoverNode = node || null;
    setHover(node?.userData.action?.caption || "");
  };
  const onLeave = () => {
    if (grab) return;
    aim.visible = false;
    hoverNode = null;
    setHover("");
    renderer.domElement.style.cursor = "grab";
  };
  renderer.domElement.style.cursor = "grab";
  renderer.domElement.addEventListener("pointerdown", onDown, true);
  renderer.domElement.addEventListener("pointerup", onUp);
  renderer.domElement.addEventListener("pointermove", onMove);
  renderer.domElement.addEventListener("pointerleave", onLeave);
  renderer.domElement.addEventListener("pointercancel", onUp);

  const clock = new THREE.Clock();
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

  let alive = true;
  let reported = false;
  renderer.setAnimationLoop(() => {
    if (!alive) return;
    const dt = reduce ? 0 : Math.min(0.05, clock.getDelta());
    if (!dragging) {
      const blend = reduce ? 1 : 1 - Math.exp(-Math.max(dt, 0.016) * 4);
      camera.position.lerp(desiredPos, blend);
      controls.target.lerp(desiredTarget, blend);
    }
    if (pending && grab) {
      publishDrag(pending, true);
      pending = null;
    }
    try {
      world.update(api.getState() || {}, dt, clock.elapsedTime);
    } catch (error) {
      if (!reported) {
        reported = true;
        console.error(kind, error?.stack || error);
      }
    }
    if (aim.visible) aim.lookAt(camera.position);
    if (hoverNode) {
      helper.setFromObject(hoverNode);
      helper.visible = true;
    } else helper.visible = false;
    controls.update();
    renderer.render(scene, camera);
  });

  return {
    setView,
    view: () => viewName,
    dispose() {
      alive = false;
      renderer.setAnimationLoop(null);
      observer.disconnect();
      motion.removeEventListener("change", onMotion);
      controls.removeEventListener("start", onStart);
      controls.removeEventListener("end", onEnd);
      renderer.domElement.removeEventListener("pointerdown", onDown, true);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerleave", onLeave);
      renderer.domElement.removeEventListener("pointercancel", onUp);
      controls.dispose();
      scene.traverse((node) => {
        if (node.geometry) node.geometry.dispose();
        const materials = node.material ? [].concat(node.material) : [];
        materials.forEach((material) => {
          material.map?.dispose();
          material.dispose();
        });
      });
      scene.environment?.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
