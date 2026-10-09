import { useEffect, useRef } from "react";
import * as THREE from "three";

const W = 1.22;
const H = W * (1280 / 720);

const ANCHORS = {
  brain: { u: 0.5, v: 0.078 },
  lungs: { u: 0.4, v: 0.25 },
  heart: { u: 0.5, v: 0.315 },
  liver: { u: 0.4, v: 0.395 },
  kidneys: { u: 0.6, v: 0.42 },
  digestive: { u: 0.52, v: 0.46 },
  skeleton: { u: 0.43, v: 0.535 },
  skin: { u: 0.34, v: 0.38 },
};

function toLocal(anchor) {
  return {
    x: (anchor.u - 0.5) * W,
    y: (0.5 - anchor.v) * H,
  };
}

export function Hall({ station, mode, onPick }) {
  const canvasRef = useRef(null);
  const stationRef = useRef(station);
  const modeRef = useRef(mode);
  const onPickRef = useRef(onPick);
  stationRef.current = station;
  modeRef.current = mode;
  onPickRef.current = onPick;

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
    camera.position.set(0, 0.12, 4.35);

    const group = new THREE.Group();
    scene.add(group);

    const loader = new THREE.TextureLoader();
    const bodyMap = loader.load(`${import.meta.env.BASE_URL}img/anatomy-body.png`);
    const vesselMap = loader.load(`${import.meta.env.BASE_URL}img/anatomy-vessels.png`);
    bodyMap.colorSpace = THREE.SRGBColorSpace;
    vesselMap.colorSpace = THREE.SRGBColorSpace;

    const bodyMat = new THREE.MeshStandardMaterial({
      map: bodyMap,
      roughness: 0.78,
      metalness: 0.02,
      transparent: true,
    });
    const body = new THREE.Mesh(new THREE.PlaneGeometry(W, H), bodyMat);
    group.add(body);

    const vesselMat = new THREE.MeshBasicMaterial({
      map: vesselMap,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const vessels = new THREE.Mesh(new THREE.PlaneGeometry(W, H), vesselMat);
    vessels.position.z = 0.012;
    group.add(vessels);

    const key = new THREE.DirectionalLight(0xfff6ea, 1.45);
    key.position.set(0.4, 1.6, 2.4);
    scene.add(key);
    scene.add(new THREE.AmbientLight(0x9aa3ad, 0.55));
    const feet = toLocal({ u: 0.5, v: 1 });
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(1.35, 48),
      new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: 0.9, metalness: 0.08 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, feet.y - 0.02, 0);
    scene.add(floor);
    const pool = new THREE.Mesh(
      new THREE.CircleGeometry(0.42, 32),
      new THREE.MeshBasicMaterial({ color: 0xc6a56a, transparent: true, opacity: 0.08, depthWrite: false }),
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(0, feet.y, 0.01);
    scene.add(pool);
    const heartPos = toLocal(ANCHORS.heart);
    const heartLight = new THREE.PointLight(0xd85a52, 0.25, 1.4);
    heartLight.position.set(heartPos.x, heartPos.y, 0.28);
    scene.add(heartLight);

    const ringGeo = new THREE.RingGeometry(0.026, 0.032, 40);
    const padGeo = new THREE.CircleGeometry(0.12, 20);
    const hits = [];
    const rings = [];
    Object.entries(ANCHORS).forEach(([id, anchor]) => {
      const pos = toLocal(anchor);
      const pad = new THREE.Mesh(
        padGeo,
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthTest: false, color: 0xffffff }),
      );
      pad.position.set(pos.x, pos.y, 0.04);
      pad.userData.id = id;
      group.add(pad);
      hits.push(pad);
      const ring = new THREE.Mesh(
        ringGeo,
        new THREE.MeshBasicMaterial({
          color: 0xefe8dc,
          transparent: true,
          opacity: 0.22,
          depthTest: false,
          side: THREE.DoubleSide,
        }),
      );
      ring.position.set(pos.x, pos.y, 0.05);
      ring.raycast = () => {};
      group.add(ring);
      rings.push({ id, mesh: ring });
    });

    const ray = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const desired = new THREE.Vector3(0, 0.12, 4.35);
    const look = new THREE.Vector3(0, 0.02, 0);
    const lookNow = look.clone();
    let hovered = null;

    function aim() {
      const id = stationRef.current;
      const view = modeRef.current;
      const anchor = id ? ANCHORS[id] : null;
      if (!anchor) {
        desired.set(0, 0.1, 4.35);
        look.set(0, 0.02, 0);
        return;
      }
      const pos = toLocal(anchor);
      const z = view === "innovation" ? 2.85 : view === "principle" ? 2.2 : 1.85;
      desired.set(pos.x * 0.12 - 0.62, pos.y * 0.88, z);
      look.set(pos.x, pos.y, 0);
    }

    const onPointer = (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(pointer, camera);
      const found = ray.intersectObjects(hits, false)[0];
      hovered = found ? found.object.userData.id : null;
      canvas.style.cursor = hovered ? "pointer" : "default";
      if (event.type === "click" && hovered) onPickRef.current(hovered);
    };
    canvas.addEventListener("pointermove", onPointer);
    canvas.addEventListener("click", onPointer);

    const resize = () => {
      const width = canvas.clientWidth || window.innerWidth;
      const height = canvas.clientHeight || window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const clock = new THREE.Clock();
    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const dt = Math.min(clock.getDelta(), 0.05);
      const blend = reduce ? 1 : 1 - Math.exp(-3.4 * dt);
      const t = clock.elapsedTime;
      aim();
      camera.position.lerp(desired, blend);
      lookNow.lerp(look, blend);
      if (reduce) group.scale.set(1, 1, 1);
      else {
        const breath = 1 + Math.sin(t * 0.85) * 0.01;
        group.scale.set(breath, breath * 0.997, 1);
        heartLight.intensity = 0.18 + (Math.sin(t * 3.2) * 0.5 + 0.5) * 0.16;
      }
      rings.forEach(({ id, mesh }) => {
        const active = id === stationRef.current;
        const hot = id === hovered;
        mesh.visible = active || hot;
        mesh.material.opacity = active ? 0.9 : 0.45;
      });
      camera.lookAt(lookNow);
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("click", onPointer);
      ringGeo.dispose();
      padGeo.dispose();
      body.geometry.dispose();
      vessels.geometry.dispose();
      floor.geometry.dispose();
      floor.material.dispose();
      pool.geometry.dispose();
      pool.material.dispose();
      bodyMat.dispose();
      vesselMat.dispose();
      hits.forEach((mesh) => mesh.material.dispose());
      rings.forEach(({ mesh }) => mesh.material.dispose());
      bodyMap.dispose();
      vesselMap.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="nil-canvas" aria-label="Central anatomical study. Choose a system to approach it." />;
}
