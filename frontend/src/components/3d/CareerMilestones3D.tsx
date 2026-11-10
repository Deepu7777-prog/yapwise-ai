import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Milestone } from '../../lib/types';

interface Props {
  milestones: Milestone[];
  activeMilestoneId: number;
  onSelectMilestone: (id: number) => void;
  className?: string;
}

export const CareerMilestones3D: React.FC<Props> = ({
  milestones,
  activeMilestoneId,
  onSelectMilestone,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef(activeMilestoneId);
  const [hoveredMilestone, setHoveredMilestone] = useState<Milestone | null>(null);

  useEffect(() => {
    activeIdRef.current = activeMilestoneId;
  }, [activeMilestoneId]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 800;
    let height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf6f3fe);
    scene.fog = new THREE.FogExp2(0xf6f3fe, 0.035);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 5.2, 10.5);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xede7ff, 1.1);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff5ea, 1.3);
    sun.position.set(5, 10, 6);
    sun.castShadow = true;
    scene.add(sun);

    // Materials
    const matGround = new THREE.MeshStandardMaterial({ color: 0xedf7f2, roughness: 0.9 });
    const matPath = new THREE.MeshStandardMaterial({ color: 0xe2d9fc, roughness: 0.65 });
    const matCompleted = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.35, metalness: 0.2 });
    const matActive = new THREE.MeshStandardMaterial({ color: 0x8b70d6, emissive: 0x7c3aed, emissiveIntensity: 0.35, roughness: 0.25 });
    const matPending = new THREE.MeshStandardMaterial({ color: 0xd4c7f5, roughness: 0.7 });
    const matGold = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.6 });

    // Ground plane
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), matGround);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    scene.add(ground);

    // Winding path through 10 milestones
    const points: THREE.Vector3[] = [];
    const count = Math.max(milestones.length, 10);
    for (let i = 0; i < count; i++) {
      const t = (i / (count - 1)) * 2 - 1; // -1 to 1
      const x = t * 11;
      const z = Math.sin(t * Math.PI * 1.5) * 2.2;
      points.push(new THREE.Vector3(x, 0.02, z));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const pathMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 50, 0.65, 8, false), matPath);
    pathMesh.scale.set(1, 0.05, 1);
    scene.add(pathMesh);

    // 10 Milestone Pedestals & Interactive Markers
    const milestoneObjects: { id: number; mesh: THREE.Group; marker: THREE.Mesh }[] = [];

    milestones.slice(0, 10).forEach((m, idx) => {
      const pos = points[idx] || new THREE.Vector3(idx * 2 - 9, 0, 0);
      const group = new THREE.Group();
      group.position.set(pos.x, 0, pos.z);

      // Base Pedestal
      const isCompleted = m.status === 'completed';
      const isActive = m.status === 'in-progress' || m.id === activeIdRef.current;
      const mat = isCompleted ? matCompleted : isActive ? matActive : matPending;

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.25, 16), mat);
      base.position.y = 0.12;
      base.castShadow = true;
      group.add(base);

      // Floating Gem / Star Marker above pedestal
      let markerGeo: THREE.BufferGeometry;
      if (isCompleted) {
        markerGeo = new THREE.OctahedronGeometry(0.28);
      } else if (isActive) {
        markerGeo = new THREE.DodecahedronGeometry(0.32);
      } else {
        markerGeo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
      }

      const marker = new THREE.Mesh(markerGeo, mat);
      marker.position.y = 0.75;
      marker.castShadow = true;
      group.add(marker);

      // Small number pillar
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.68, 0.75, 24), isCompleted ? matCompleted : isActive ? matActive : matPending);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.02;
      group.add(ring);

      scene.add(group);
      milestoneObjects.push({ id: m.id, mesh: group, marker });
    });

    // Mouse Interaction / Raycasting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      raycaster.setFromCamera(mouse, camera);
      const meshesToTest = milestoneObjects.map((mo) => mo.marker);
      const intersects = raycaster.intersectObjects(meshesToTest, false);

      if (intersects.length > 0) {
        container.style.cursor = 'pointer';
        const hit = milestoneObjects.find((mo) => mo.marker === intersects[0].object);
        if (hit) {
          const found = milestones.find((m) => m.id === hit.id);
          if (found) setHoveredMilestone(found);
        }
      } else {
        container.style.cursor = 'default';
        setHoveredMilestone(null);
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      raycaster.setFromCamera(mouse, camera);
      const meshesToTest = milestoneObjects.map((mo) => mo.marker);
      const intersects = raycaster.intersectObjects(meshesToTest, false);

      if (intersects.length > 0) {
        const hit = milestoneObjects.find((mo) => mo.marker === intersects[0].object);
        if (hit) {
          onSelectMilestone(hit.id);
        }
      }
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('click', handlePointerDown);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Animate Milestone Markers
      milestoneObjects.forEach((mo) => {
        const isCurrent = mo.id === activeIdRef.current;
        if (isCurrent) {
          mo.marker.rotation.y = elapsed * 2.2;
          mo.marker.position.y = 0.85 + Math.sin(elapsed * 4) * 0.12;
          mo.marker.scale.setScalar(1.2 + Math.sin(elapsed * 4) * 0.1);
        } else {
          mo.marker.rotation.y = elapsed * 0.8 + mo.id;
          mo.marker.position.y = 0.72 + Math.sin(elapsed * 2 + mo.id) * 0.05;
          mo.marker.scale.setScalar(1);
        }
      });

      // Camera gentle pan tracking active milestone
      const activeObj = milestoneObjects.find((mo) => mo.id === activeIdRef.current);
      if (activeObj) {
        const targetCamX = THREE.MathUtils.clamp(activeObj.mesh.position.x * 0.55, -4, 4);
        camera.position.x += (targetCamX - camera.position.x) * 0.05;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 800;
      height = container.clientHeight || 360;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('click', handlePointerDown);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [milestones, onSelectMilestone]);

  return (
    <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#EDE7FF]/40 via-white to-[#F8F6FF] border border-[#D4C7F5] shadow-card ${className}`}>
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="w-full h-72 sm:h-80 relative" />

      {/* Hover Information Pill */}
      {hoveredMilestone && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-[#8B70D6] shadow-lg text-xs font-bold text-[#29243A] flex items-center gap-2 pointer-events-none animate-fadeIn">
          <span className="w-2.5 h-2.5 rounded-full bg-[#8B70D6] animate-ping" />
          <span>Milestone {hoveredMilestone.id}: {hoveredMilestone.title}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#EDE7FF] text-[#8B70D6] uppercase">
            Click to Inspect
          </span>
        </div>
      )}

      {/* Instructions Overlay */}
      <div className="absolute top-3 left-4 flex items-center gap-2 pointer-events-none">
        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-white/90 text-[#8B70D6] border border-[#EDE7FF] shadow-sm">
          Interactive 3D Placement Highway • Click any Gem to Inspect Milestone
        </span>
      </div>
    </div>
  );
};
