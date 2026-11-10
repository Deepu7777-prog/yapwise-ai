import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Props {
  className?: string;
  focusMode?: 'login' | 'register' | 'overview';
  interactive?: boolean;
}

export const CampusCanvas3D: React.FC<Props> = ({
  className = '',
  focusMode = 'overview',
  interactive = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf6f3fe); // Soft Lavender-White
    scene.fog = new THREE.FogExp2(0xf6f3fe, 0.028);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 4.5, 12);
    camera.lookAt(0, 1.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xede7ff, 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5ea, 1.2);
    sunLight.position.set(6, 12, 8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 25;
    sunLight.shadow.camera.left = -8;
    sunLight.shadow.camera.right = 8;
    sunLight.shadow.camera.top = 8;
    sunLight.shadow.camera.bottom = -8;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0xffe6f3, 0xbdebda, 0.5);
    scene.add(hemiLight);

    // 3. Materials (Clay-morphic PBR Palette)
    const matGround = new THREE.MeshStandardMaterial({ color: 0xedf7f2, roughness: 0.85, metalness: 0.05 });
    const matPath = new THREE.MeshStandardMaterial({ color: 0xe2d9fc, roughness: 0.65, metalness: 0.1 });
    const matCobble = new THREE.MeshStandardMaterial({ color: 0xd4c7f5, roughness: 0.6 });
    const matSkin = new THREE.MeshStandardMaterial({ color: 0xffdfc4, roughness: 0.55 });
    const matHairDark = new THREE.MeshStandardMaterial({ color: 0x2a2336, roughness: 0.6 });
    const matHairBrown = new THREE.MeshStandardMaterial({ color: 0x543c2c, roughness: 0.6 });

    // Distinct clothing materials for 8 B.Tech student characters
    const clothingColors = [
      0x583b99, // 1. Deep Violet (Rahul)
      0xa58ff0, // 2. Lavender (Ananya)
      0x3b82f6, // 3. Sky Blue / Denim (Vikram)
      0x46b88a, // 4. Mint Green (Sneha)
      0xfa9a77, // 5. Coral / Peach (Arjun)
      0xf48b62, // 6. Tangerine (Divya)
      0xec4899, // 7. Pastel Pink (Rohan)
      0x10b981, // 8. Emerald Success (Meera)
    ];

    const matPants = new THREE.MeshStandardMaterial({ color: 0x333745, roughness: 0.7 });
    const matSneakers = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const matGold = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.7 });
    const matCyanGlow = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.4, roughness: 0.3 });
    const matPinkFoil = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.4 });

    // 4. Ground & Winding Campus Path
    const groundGeo = new THREE.PlaneGeometry(36, 36, 16, 16);
    const ground = new THREE.Mesh(groundGeo, matGround);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    scene.add(ground);

    // Stone pathway curving through the campus
    const pathCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-9, 0, -5),
      new THREE.Vector3(-4, 0, -2),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(4, 0, 2),
      new THREE.Vector3(9, 0, 4),
    ]);
    const pathGeo = new THREE.TubeGeometry(pathCurve, 40, 1.3, 10, false);
    const pathMesh = new THREE.Mesh(pathGeo, matPath);
    pathMesh.scale.set(1, 0.05, 1);
    pathMesh.receiveShadow = true;
    scene.add(pathMesh);

    // Stepping cobblestones along pathway
    for (let i = -7; i <= 7; i += 1.4) {
      const stoneGeo = new THREE.CylinderGeometry(0.35 + Math.random() * 0.1, 0.4, 0.08, 7);
      const stone = new THREE.Mesh(stoneGeo, matCobble);
      stone.position.set(i + (Math.random() - 0.5) * 0.6, 0.02, (i * 0.45) + (Math.random() - 0.5) * 0.3);
      stone.rotation.y = Math.random() * Math.PI;
      stone.receiveShadow = true;
      scene.add(stone);
    }

    // 5. Campus Trees (Low-Poly Clay Style)
    const treeTrunkGeo = new THREE.CylinderGeometry(0.12, 0.2, 1.4, 7);
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x8a7160, roughness: 0.8 });
    const foliageColors = [0xbdebd9, 0xc4b4fa, 0xffd9c9, 0xa7f3d0];

    const createTree = (x: number, z: number, scale = 1, colorIdx = 0) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(x, 0, z);

      const trunk = new THREE.Mesh(treeTrunkGeo, treeTrunkMat);
      trunk.position.y = 0.7 * scale;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      const foliageMat = new THREE.MeshStandardMaterial({ color: foliageColors[colorIdx % foliageColors.length], roughness: 0.6 });
      const topGeo = new THREE.SphereGeometry(0.9 * scale, 8, 8);
      const foliage = new THREE.Mesh(topGeo, foliageMat);
      foliage.position.y = 1.6 * scale;
      foliage.castShadow = true;
      treeGroup.add(foliage);

      const miniFoliage = new THREE.Mesh(new THREE.SphereGeometry(0.55 * scale, 7, 7), foliageMat);
      miniFoliage.position.set(0.3 * scale, 2.1 * scale, 0);
      miniFoliage.castShadow = true;
      treeGroup.add(miniFoliage);

      scene.add(treeGroup);
      return treeGroup;
    };

    createTree(-6.5, -4, 1.2, 0);
    createTree(-7.5, 1, 1.0, 1);
    createTree(6.5, -3.5, 1.3, 2);
    createTree(7.5, 2.5, 0.9, 3);
    createTree(-2, -6, 1.1, 1);
    createTree(3, -6.5, 1.2, 0);

    // 6. Campus Lamp Posts
    const createLamp = (x: number, z: number) => {
      const lampGroup = new THREE.Group();
      lampGroup.position.set(x, 0, z);

      const postGeo = new THREE.CylinderGeometry(0.04, 0.06, 2.2, 6);
      const postMat = new THREE.MeshStandardMaterial({ color: 0x674bb4, roughness: 0.4 });
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.y = 1.1;
      post.castShadow = true;
      lampGroup.add(post);

      const bulbGeo = new THREE.SphereGeometry(0.18, 8, 8);
      const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfde047, emissiveIntensity: 0.9 });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.y = 2.15;
      lampGroup.add(bulb);

      scene.add(lampGroup);
    };
    createLamp(-3.5, -1.2);
    createLamp(3.8, 1.2);

    // 7. Eight B.Tech Student Characters
    interface CharacterRig {
      root: THREE.Group;
      head: THREE.Mesh;
      torso: THREE.Mesh;
      leftLeg: THREE.Mesh;
      rightLeg: THREE.Mesh;
      leftArm: THREE.Mesh;
      rightArm: THREE.Mesh;
      walkSpeed: number;
      walkPhase: number;
      isWalking: boolean;
      initialX: number;
      initialZ: number;
      targetX: number;
      targetZ: number;
    }

    const characters: CharacterRig[] = [];

    const createStudent = (
      index: number,
      name: string,
      startX: number,
      startZ: number,
      clothingColor: number,
      accessoryType: 'laptop' | 'tablet' | 'book' | 'coffee' | 'diploma' | 'headphones'
    ): CharacterRig => {
      const charGroup = new THREE.Group();
      charGroup.position.set(startX, 0, startZ);

      // Torso
      const torsoMat = new THREE.MeshStandardMaterial({ color: clothingColor, roughness: 0.5 });
      const torsoGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.75, 8);
      const torso = new THREE.Mesh(torsoGeo, torsoMat);
      torso.position.y = 1.05;
      torso.castShadow = true;
      charGroup.add(torso);

      // Head
      const headGeo = new THREE.SphereGeometry(0.22, 12, 12);
      const head = new THREE.Mesh(headGeo, matSkin);
      head.position.y = 1.62;
      head.castShadow = true;
      charGroup.add(head);

      // Hair
      const hairMat = index % 2 === 0 ? matHairDark : matHairBrown;
      const hairGeo = new THREE.SphereGeometry(0.24, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.6);
      const hair = new THREE.Mesh(hairGeo, hairMat);
      hair.position.y = 1.66;
      hair.rotation.x = -0.15;
      charGroup.add(hair);

      // Legs
      const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6);
      const leftLeg = new THREE.Mesh(legGeo, matPants);
      leftLeg.position.set(-0.12, 0.45, 0);
      leftLeg.castShadow = true;
      charGroup.add(leftLeg);

      const rightLeg = new THREE.Mesh(legGeo, matPants);
      rightLeg.position.set(0.12, 0.45, 0);
      rightLeg.castShadow = true;
      charGroup.add(rightLeg);

      // Shoes
      const shoeGeo = new THREE.BoxGeometry(0.14, 0.1, 0.22);
      const leftShoe = new THREE.Mesh(shoeGeo, matSneakers);
      leftShoe.position.set(-0.12, 0.08, 0.04);
      charGroup.add(leftShoe);

      const rightShoe = new THREE.Mesh(shoeGeo, matSneakers);
      rightShoe.position.set(0.12, 0.08, 0.04);
      charGroup.add(rightShoe);

      // Arms
      const armGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.52, 6);
      const leftArm = new THREE.Mesh(armGeo, torsoMat);
      leftArm.position.set(-0.32, 1.05, 0);
      leftArm.castShadow = true;
      charGroup.add(leftArm);

      const rightArm = new THREE.Mesh(armGeo, torsoMat);
      rightArm.position.set(0.32, 1.05, 0);
      rightArm.castShadow = true;
      charGroup.add(rightArm);

      // Gear / Accessory
      if (accessoryType === 'laptop') {
        const laptopGeo = new THREE.BoxGeometry(0.32, 0.04, 0.24);
        const laptop = new THREE.Mesh(laptopGeo, matCyanGlow);
        laptop.position.set(0.3, 0.95, 0.12);
        laptop.rotation.set(0.3, 0.4, 0);
        charGroup.add(laptop);
      } else if (accessoryType === 'book') {
        const bookGeo = new THREE.BoxGeometry(0.24, 0.32, 0.08);
        const book = new THREE.Mesh(bookGeo, matPinkFoil);
        book.position.set(-0.28, 0.95, 0.12);
        book.rotation.set(0.2, -0.3, 0.1);
        charGroup.add(book);
      } else if (accessoryType === 'diploma') {
        const diplomaGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.32, 8);
        const diploma = new THREE.Mesh(diplomaGeo, matGold);
        diploma.position.set(0.28, 1.15, 0.15);
        diploma.rotation.set(0.4, 0, 0.6);
        charGroup.add(diploma);
      } else if (accessoryType === 'headphones') {
        const bandGeo = new THREE.TorusGeometry(0.25, 0.03, 6, 12, Math.PI);
        const band = new THREE.Mesh(bandGeo, matGold);
        band.position.y = 1.68;
        band.rotation.x = Math.PI / 2;
        charGroup.add(band);
      }

      scene.add(charGroup);

      return {
        root: charGroup,
        head,
        torso,
        leftLeg,
        rightLeg,
        leftArm,
        rightArm,
        walkSpeed: 1.2 + (index % 3) * 0.3,
        walkPhase: index * 0.9,
        isWalking: index % 2 === 0,
        initialX: startX,
        initialZ: startZ,
        targetX: startX + (Math.random() - 0.5) * 4,
        targetZ: startZ + (Math.random() - 0.5) * 2,
      };
    };

    // Instantiate 8 B.Tech Students
    characters.push(createStudent(0, 'Rahul', -5.5, -0.5, clothingColors[0], 'laptop'));
    characters.push(createStudent(1, 'Ananya', -3.2, 0.6, clothingColors[1], 'tablet'));
    characters.push(createStudent(2, 'Vikram', -1.5, -0.4, clothingColors[2], 'headphones'));
    characters.push(createStudent(3, 'Sneha', 0.8, 0.3, clothingColors[3], 'book'));
    characters.push(createStudent(4, 'Arjun', 2.6, -0.7, clothingColors[4], 'coffee'));
    characters.push(createStudent(5, 'Divya', 4.2, 0.8, clothingColors[5], 'laptop'));
    characters.push(createStudent(6, 'Rohan', 5.8, -0.2, clothingColors[6], 'book'));
    characters.push(createStudent(7, 'Meera', 7.2, 0.5, clothingColors[7], 'diploma'));

    // 8. Floating Interactive 3D Learning Relics
    interface FloatingRelic {
      mesh: THREE.Object3D;
      baseY: number;
      speedY: number;
      rotSpeed: number;
      phase: number;
    }
    const floatingRelics: FloatingRelic[] = [];

    // Floating 3D Laptop with Glowing Screen
    const createFloatingLaptop = (x: number, y: number, z: number) => {
      const group = new THREE.Group();
      group.position.set(x, y, z);

      // Base
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.6), matPants);
      group.add(base);

      // Screen
      const screenFrame = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.55, 0.04), matPants);
      screenFrame.position.set(0, 0.28, -0.28);
      screenFrame.rotation.x = 0.25;
      group.add(screenFrame);

      const screenDisplay = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.46), matCyanGlow);
      screenDisplay.position.set(0, 0.28, -0.25);
      screenDisplay.rotation.x = 0.25;
      group.add(screenDisplay);

      scene.add(group);
      floatingRelics.push({ mesh: group, baseY: y, speedY: 1.8, rotSpeed: 0.4, phase: 0 });
    };

    // Floating 3D Graduation Cap
    const createFloatingGradCap = (x: number, y: number, z: number) => {
      const group = new THREE.Group();
      group.position.set(x, y, z);

      // Skull cap
      const skull = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.2, 8), matPants);
      group.add(skull);

      // Diamond mortarboard
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.8), matPants);
      board.position.y = 0.12;
      board.rotation.y = Math.PI / 4;
      group.add(board);

      // Golden tassel
      const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6), matGold);
      tassel.position.set(0.3, -0.05, 0.3);
      group.add(tassel);

      scene.add(group);
      floatingRelics.push({ mesh: group, baseY: y, speedY: 1.4, rotSpeed: -0.5, phase: 1.2 });
    };

    // Floating 3D Book
    const createFloatingBook = (x: number, y: number, z: number, coverColor: number) => {
      const group = new THREE.Group();
      group.position.set(x, y, z);

      const coverMat = new THREE.MeshStandardMaterial({ color: coverColor, roughness: 0.4 });
      const cover = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.12), coverMat);
      group.add(cover);

      const pages = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.08), matSneakers);
      pages.position.x = 0.03;
      group.add(pages);

      scene.add(group);
      floatingRelics.push({ mesh: group, baseY: y, speedY: 2.1, rotSpeed: 0.6, phase: 2.4 });
    };

    // Floating 3D Golden Placement Trophy
    const createFloatingTrophy = (x: number, y: number, z: number) => {
      const group = new THREE.Group();
      group.position.set(x, y, z);

      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.15, 0.45, 8), matGold);
      group.add(cup);

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.25, 6), matGold);
      stem.position.y = -0.3;
      group.add(stem);

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.12, 8), matPants);
      base.position.y = -0.45;
      group.add(base);

      scene.add(group);
      floatingRelics.push({ mesh: group, baseY: y, speedY: 1.6, rotSpeed: 0.3, phase: 3.5 });
    };

    // Add floating learning relics around campus
    createFloatingLaptop(-3.8, 3.2, 0.5);
    createFloatingGradCap(4.2, 3.5, 0.2);
    createFloatingBook(-5.2, 2.2, 1.2, 0xec4899);
    createFloatingBook(2.8, 2.5, -0.8, 0x8b5cf6);
    createFloatingTrophy(0, 3.8, -1);

    // 9. Mouse Interactive Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetCameraX = 0;
    let targetCameraY = 4.5;

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = normX * 1.5;
      mouseY = normY * 0.8;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // 10. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Camera parallax interpolation
      targetCameraX = mouseX + (focusMode === 'login' ? -1.2 : focusMode === 'register' ? 1.2 : 0);
      targetCameraY = 4.2 + mouseY * 0.5;

      camera.position.x += (targetCameraX - camera.position.x) * 0.04;
      camera.position.y += (targetCameraY - camera.position.y) * 0.04;
      camera.lookAt(0, 1.4, 0);

      // Animate 8 Characters
      characters.forEach((char) => {
        const t = elapsed * char.walkSpeed + char.walkPhase;

        if (char.isWalking) {
          // Walking leg swing & arm counter-swing
          const legAngle = Math.sin(t) * 0.5;
          char.leftLeg.rotation.x = legAngle;
          char.rightLeg.rotation.x = -legAngle;
          char.leftArm.rotation.x = -legAngle * 0.7;
          char.rightArm.rotation.x = legAngle * 0.7;

          // Gentle torso bob
          char.root.position.y = Math.abs(Math.sin(t * 2)) * 0.06;

          // Head tilt
          char.head.rotation.y = Math.sin(t * 0.5) * 0.15;
        } else {
          // Idle breathing
          char.root.position.y = Math.sin(t * 1.5) * 0.02;
          char.head.rotation.y = Math.sin(t * 0.8) * 0.25;
          char.leftArm.rotation.z = -0.1 + Math.sin(t * 1.2) * 0.04;
          char.rightArm.rotation.z = 0.1 - Math.sin(t * 1.2) * 0.04;
        }
      });

      // Animate Floating Relics
      floatingRelics.forEach((relic) => {
        relic.mesh.position.y = relic.baseY + Math.sin(elapsed * relic.speedY + relic.phase) * 0.22;
        relic.mesh.rotation.y = elapsed * relic.rotSpeed;
        relic.mesh.rotation.x = Math.sin(elapsed * 0.8 + relic.phase) * 0.1;
      });

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [focusMode, interactive]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{ pointerEvents: interactive ? 'auto' : 'none' }}
    />
  );
};
