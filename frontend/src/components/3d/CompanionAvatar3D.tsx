import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Props {
  isSpeaking: boolean;
  isListening: boolean;
  mode?: string;
  className?: string;
}

export const CompanionAvatar3D: React.FC<Props> = ({
  isSpeaking,
  isListening,
  mode = 'free',
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ isSpeaking, isListening });

  useEffect(() => {
    stateRef.current = { isSpeaking, isListening };
  }, [isSpeaking, isListening]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 320;
    let height = container.clientHeight || 320;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0.5, 4.2);
    camera.lookAt(0, 0.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    dirLight.position.set(3, 5, 4);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0xa58ff0, 0.8);
    rimLight.position.set(-3, 2, -2);
    scene.add(rimLight);

    // 3. Materials (Soft Clay PBR)
    const matBody = new THREE.MeshStandardMaterial({
      color: 0x8b70d6, // YapWise Lavender
      roughness: 0.35,
      metalness: 0.1,
    });

    const matFace = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
    });

    const matEyes = new THREE.MeshStandardMaterial({
      color: 0x241d3b,
      roughness: 0.2,
    });

    const matEyeGlint = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const matMouth = new THREE.MeshStandardMaterial({
      color: 0xff6b81,
      roughness: 0.4,
    });

    const matHeadphones = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      roughness: 0.3,
      metalness: 0.2,
    });

    const matEarcupGlow = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
    });

    const matWaveRing = new THREE.MeshBasicMaterial({
      color: 0x8b70d6,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });

    // 4. Companion Character Rig
    const avatarGroup = new THREE.Group();
    scene.add(avatarGroup);

    // Main Torso / Pod Body
    const bodyGeo = new THREE.SphereGeometry(0.85, 32, 32);
    bodyGeo.scale(1, 1.15, 0.95);
    const bodyMesh = new THREE.Mesh(bodyGeo, matBody);
    bodyMesh.castShadow = true;
    avatarGroup.add(bodyMesh);

    // Belly / Face Plate (White Cream Screen)
    const bellyGeo = new THREE.SphereGeometry(0.72, 28, 28);
    bellyGeo.scale(0.88, 0.95, 0.55);
    const bellyMesh = new THREE.Mesh(bellyGeo, matFace);
    bellyMesh.position.set(0, 0.1, 0.46);
    avatarGroup.add(bellyMesh);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.1, 16, 16);
    eyeGeo.scale(1, 1.35, 0.6);

    const leftEye = new THREE.Mesh(eyeGeo, matEyes);
    leftEye.position.set(-0.24, 0.22, 0.76);
    avatarGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, matEyes);
    rightEye.position.set(0.24, 0.22, 0.76);
    avatarGroup.add(rightEye);

    // Eye Highlights (Kawaii Glints)
    const glintGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const leftGlint = new THREE.Mesh(glintGeo, matEyeGlint);
    leftGlint.position.set(-0.21, 0.27, 0.81);
    avatarGroup.add(leftGlint);

    const rightGlint = new THREE.Mesh(glintGeo, matEyeGlint);
    rightGlint.position.set(0.27, 0.27, 0.81);
    avatarGroup.add(rightGlint);

    // Blush Cheeks (Pastel Pink)
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xffb8d2, transparent: true, opacity: 0.65 });
    const blushGeo = new THREE.CircleGeometry(0.075, 12);
    const leftBlush = new THREE.Mesh(blushGeo, blushMat);
    leftBlush.position.set(-0.36, 0.08, 0.75);
    avatarGroup.add(leftBlush);

    const rightBlush = new THREE.Mesh(blushGeo, blushMat);
    rightBlush.position.set(0.36, 0.08, 0.75);
    avatarGroup.add(rightBlush);

    // Animated Mouth (Scales dynamically on speech)
    const mouthGeo = new THREE.TorusGeometry(0.08, 0.025, 8, 16, Math.PI);
    const mouthMesh = new THREE.Mesh(mouthGeo, matMouth);
    mouthMesh.position.set(0, 0.02, 0.78);
    mouthMesh.rotation.set(0, 0, Math.PI);
    avatarGroup.add(mouthMesh);

    // Headphones (Headband + Earcups)
    const bandGeo = new THREE.TorusGeometry(0.92, 0.065, 8, 24, Math.PI);
    const headband = new THREE.Mesh(bandGeo, matHeadphones);
    headband.position.set(0, 0.2, 0);
    headband.rotation.x = Math.PI / 2;
    avatarGroup.add(headband);

    const earcupGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.16, 16);
    const leftEarcup = new THREE.Mesh(earcupGeo, matEarcupGlow);
    leftEarcup.position.set(-0.92, 0.2, 0);
    leftEarcup.rotation.z = Math.PI / 2;
    avatarGroup.add(leftEarcup);

    const rightEarcup = new THREE.Mesh(earcupGeo, matEarcupGlow);
    rightEarcup.position.set(0.92, 0.2, 0);
    rightEarcup.rotation.z = Math.PI / 2;
    avatarGroup.add(rightEarcup);

    // Antenna with Glowing Orb
    const stemGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.32, 8);
    const stem = new THREE.Mesh(stemGeo, matHeadphones);
    stem.position.set(0, 1.05, 0);
    avatarGroup.add(stem);

    const orbGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const antennaOrb = new THREE.Mesh(orbGeo, matEarcupGlow);
    antennaOrb.position.set(0, 1.25, 0);
    avatarGroup.add(antennaOrb);

    // Floating Soundwave Energy Rings (Expand during speech/listening)
    const ringGeo = new THREE.RingGeometry(1.05, 1.15, 32);
    const waveRing1 = new THREE.Mesh(ringGeo, matWaveRing);
    waveRing1.rotation.x = Math.PI / 2;
    avatarGroup.add(waveRing1);

    const waveRing2 = new THREE.Mesh(ringGeo, matWaveRing.clone());
    waveRing2.rotation.x = Math.PI / 2;
    avatarGroup.add(waveRing2);

    // 5. Mouse Tracking for Eyeball & Head Parallax
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 6. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const { isSpeaking: speaking, isListening: listening } = stateRef.current;

      // Base idle floating oscillation
      const floatY = Math.sin(elapsed * 2.2) * 0.08;
      avatarGroup.position.y = floatY;

      // Mouse Look / Head Tilt Parallax
      const targetRotY = mouseX * 0.45;
      const targetRotX = -mouseY * 0.25;
      avatarGroup.rotation.y += (targetRotY - avatarGroup.rotation.y) * 0.08;
      avatarGroup.rotation.x += (targetRotX - avatarGroup.rotation.x) * 0.08;

      // Dynamic Speech Reaction
      if (speaking) {
        // Mouth opening and closing rhythmically
        const mouthScale = 1.0 + Math.abs(Math.sin(elapsed * 12)) * 1.8;
        mouthMesh.scale.set(mouthScale, mouthScale * 1.3, 1);
        mouthMesh.position.y = 0.02 - Math.abs(Math.sin(elapsed * 12)) * 0.04;

        // Head nodding & enthusiasm
        avatarGroup.rotation.z = Math.sin(elapsed * 6) * 0.06;

        // Earcup & Antenna Pulse
        const glow = 0.6 + Math.sin(elapsed * 10) * 0.4;
        matEarcupGlow.emissiveIntensity = glow;
        antennaOrb.scale.setScalar(1 + glow * 0.15);

        // Soundwave rings expanding outward
        waveRing1.scale.setScalar(1 + ((elapsed * 1.5) % 1) * 0.6);
        (waveRing1.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - ((elapsed * 1.5) % 1));

        waveRing2.scale.setScalar(1 + (((elapsed * 1.5) + 0.5) % 1) * 0.6);
        (waveRing2.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - (((elapsed * 1.5) + 0.5) % 1));
      } else if (listening) {
        // Listening: Attentive tilt forward, glowing cyan earcups
        avatarGroup.rotation.x = 0.15;
        avatarGroup.rotation.z = Math.sin(elapsed * 3) * 0.04;

        // Subtle smile
        mouthMesh.scale.set(1.1, 0.7, 1);
        mouthMesh.position.y = 0.04;

        matEarcupGlow.emissive.setHex(0x10b981); // Emerald / Mint listening glow
        matEarcupGlow.emissiveIntensity = 0.8 + Math.sin(elapsed * 8) * 0.3;

        waveRing1.scale.setScalar(1 + Math.sin(elapsed * 4) * 0.12);
        (waveRing1.material as THREE.MeshBasicMaterial).opacity = 0.4;
        waveRing2.scale.setScalar(1.2 + Math.cos(elapsed * 4) * 0.12);
        (waveRing2.material as THREE.MeshBasicMaterial).opacity = 0.25;
      } else {
        // Neutral Idle: Gentle breathing, closed smile
        mouthMesh.scale.set(1, 1, 1);
        mouthMesh.position.y = 0.02;
        matEarcupGlow.emissive.setHex(0x0284c7);
        matEarcupGlow.emissiveIntensity = 0.4;

        waveRing1.scale.setScalar(1);
        (waveRing1.material as THREE.MeshBasicMaterial).opacity = 0.15;
        waveRing2.scale.setScalar(1.15);
        (waveRing2.material as THREE.MeshBasicMaterial).opacity = 0.08;
      }

      // Blink animation every 4 seconds
      const blinkCycle = elapsed % 4.0;
      if (blinkCycle < 0.12) {
        leftEye.scale.y = 0.1;
        rightEye.scale.y = 0.1;
      } else {
        leftEye.scale.y = 1.35;
        rightEye.scale.y = 1.35;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 320;
      height = container.clientHeight || 320;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full flex items-center justify-center pointer-events-none select-none ${className}`}
    />
  );
};
