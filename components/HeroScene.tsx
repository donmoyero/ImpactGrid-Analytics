"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Animated 3D centrepiece for the homepage hero.
 * Fills its parent (position it with the parent's classes). Client-only:
 * three.js is touched inside useEffect, so SSR is safe.
 */
export default function HeroScene() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return; // no WebGL: the dark hero still looks fine without the scene
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.style.display = "block";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 9;

    // Centrepiece: 3x3x3 lattice of cubes with an "I" lit in the middle
    const core = new THREE.Group();
    scene.add(core);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x5b8cff, transparent: true, opacity: 0.55 });
    const litMat = new THREE.MeshStandardMaterial({ color: 0x2d6edb, emissive: 0x2d6edb, emissiveIntensity: 1.1, metalness: 0.4, roughness: 0.25 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x14161d, metalness: 0.8, roughness: 0.3 });
    const cubeGeo = new THREE.BoxGeometry(0.78, 0.78, 0.78);
    const edgeGeo = new THREE.EdgesGeometry(cubeGeo);
    const cubes: THREE.Mesh[] = [];
    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++)
        for (let z = -1; z <= 1; z++) {
          const lit = z === 0 && (x === 0 || y === 1 || y === -1);
          const m = new THREE.Mesh(cubeGeo, lit ? litMat : darkMat);
          m.position.set(x, y, z);
          m.userData.base = m.position.clone();
          m.add(new THREE.LineSegments(edgeGeo, edgeMat));
          core.add(m);
          cubes.push(m);
        }
    const ringGeo = new THREE.TorusGeometry(2.9, 0.012, 8, 160);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x8b5cff }));
    ring.rotation.x = Math.PI / 2.3;
    core.add(ring);
    const shellGeo = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(3.4, 1));
    const shell = new THREE.LineSegments(shellGeo, new THREE.LineBasicMaterial({ color: 0x8b5cff, transparent: true, opacity: 0.22 }));
    core.add(shell);

    scene.add(new THREE.AmbientLight(0x6070b0, 1.6));
    const key = new THREE.DirectionalLight(0x2d6edb, 4);
    key.position.set(4, 3, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x8b5cff, 3);
    fill.position.set(-5, -3, 4);
    scene.add(fill);

    // Drifting particles joined by faint lines
    const N = 90;
    const pos = new Float32Array(N * 3);
    const vel: [number, number][] = [];
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
      vel.push([(Math.random() - 0.5) * 0.004, (Math.random() - 0.5) * 0.004]);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x9db8ff, size: 0.05, transparent: true, opacity: 0.8 });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);
    const MAX = N * 4;
    const lpos = new Float32Array(MAX * 6);
    const lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute("position", new THREE.BufferAttribute(lpos, 3));
    lGeo.setDrawRange(0, 0);
    const lMat = new THREE.LineBasicMaterial({ color: 0x2d6edb, transparent: true, opacity: 0.2 });
    scene.add(new THREE.LineSegments(lGeo, lMat));
    const link = () => {
      let c = 0;
      for (let i = 0; i < N; i++)
        for (let j = i + 1; j < N && c < MAX; j++) {
          const dx = pos[i * 3] - pos[j * 3];
          const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
          const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
          if (dx * dx + dy * dy + dz * dz < 2.6) {
            lpos.set([pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]], c * 6);
            c++;
          }
        }
      lGeo.setDrawRange(0, c * 2);
      lGeo.attributes.position.needsUpdate = true;
    };

    // Sizing
    let aspect = 1;
    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      aspect = w / h;
      renderer.setSize(w, h);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    // Pointer + scroll
    let mx = 0, my = 0, tx = 0, ty = 0, prog = 0, sp = 0;
    const onMove = (e: PointerEvent) => {
      mx = (e.clientX / window.innerWidth) * 2 - 1;
      my = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onScroll = () => {
      const r = host.getBoundingClientRect();
      prog = Math.min(1, Math.max(0, -r.top / Math.max(r.height, 1)));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Only animate while visible
    let visible = true;
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; });
    io.observe(host);

    const clock = new THREE.Clock();
    let frame = 0;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      const t = clock.getElapsedTime() * (reduce ? 0.15 : 1);
      frame++;
      sp += (prog - sp) * 0.08;
      tx += (mx - tx) * 0.05;
      ty += (my - ty) * 0.05;

      const wide = aspect > 1.3;
      core.position.x = wide ? 2.6 - sp * 1.5 : 0;
      core.position.y = Math.sin(t * 0.9) * 0.18;
      core.scale.setScalar((wide ? 1 : 0.68) * (1 - sp * 0.25));
      core.rotation.y = t * 0.25 + tx * 0.6 + sp * Math.PI;
      core.rotation.x = -0.25 + ty * 0.35 + Math.sin(t * 0.4) * 0.08;
      ring.rotation.z = t * 0.5;
      shell.rotation.y = -t * 0.12;
      const spread = 1 + Math.abs(prog - sp) * 5 + Math.sin(t * 1.2) * 0.03 + sp * 0.4;
      cubes.forEach((c) => c.position.copy(c.userData.base).multiplyScalar(spread));
      litMat.emissiveIntensity = 1 + Math.sin(t * 2) * 0.25;
      key.position.x = 4 + tx * 4;
      key.position.y = 3 - ty * 4;

      for (let i = 0; i < N; i++) {
        pos[i * 3] += vel[i][0];
        pos[i * 3 + 1] += vel[i][1];
        if (Math.abs(pos[i * 3]) > 11) vel[i][0] *= -1;
        if (Math.abs(pos[i * 3 + 1]) > 7) vel[i][1] *= -1;
      }
      pGeo.attributes.position.needsUpdate = true;
      if (frame % 3 === 0) link();
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      ro.disconnect();
      io.disconnect();
      [cubeGeo, edgeGeo, ringGeo, shellGeo, pGeo, lGeo, edgeMat, litMat, darkMat, pMat, lMat].forEach((d) => d.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} className="h-full w-full" />;
}
