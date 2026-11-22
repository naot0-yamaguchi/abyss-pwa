import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { Enemy, EquipmentState } from '../types/game';

interface Props {
  floor: number;
  isFighting: boolean;
  enemy: Enemy | null;
  equipment: EquipmentState;
}

// プロシージャルな和紙・枯草のテクスチャをCanvasで生成
const createSoilTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#181514';
  ctx.fillRect(0, 0, 256, 256);

  // 墨の斑点と枯野のノイズ
  for (let i = 0; i < 1500; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const rad = Math.random() * 2.5;
    ctx.fillStyle = Math.random() > 0.5 ? '#28201c' : '#0d0b0a';
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  return texture;
};

export const ThreeDungeonScene: React.FC<Props> = ({ floor, isFighting, enemy, equipment }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. シーン・濃霧（薄暮の常夜）
    const scene = new THREE.Scene();
    const fogColor = new THREE.Color(floor % 10 === 0 ? 0x220508 : 0x0c0b10);
    scene.background = fogColor;
    scene.fog = new THREE.FogExp2(fogColor, 0.05);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 2.3, 6.2);
    camera.lookAt(0, 1.1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. 和風ライティング（赤い月光と揺らめく鬼火）
    const ambientLight = new THREE.AmbientLight(0x382d33, 0.9);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0xecdcd3, 1.6);
    moonLight.position.set(4, 9, -5);
    moonLight.castShadow = true;
    scene.add(moonLight);

    // 鬼火・提灯の青白い光
    const fireflyLight = new THREE.PointLight(enemy?.isBoss ? 0xe11d48 : 0x38bdf8, 2.5, 9);
    fireflyLight.position.set(0, 1.8, 1);
    scene.add(fireflyLight);

    // 3. 荒涼とした大地
    const groundGeo = new THREE.PlaneGeometry(35, 35, 48, 48);
    groundGeo.rotateX(-Math.PI / 2);
    const soilTexture = createSoilTexture();
    const groundMat = new THREE.MeshStandardMaterial({
      map: soilTexture,
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    scene.add(ground);

    // 4. 背景の朽ちた朱色の鳥居
    const toriiGroup = new THREE.Group();
    toriiGroup.position.set(0, 0, -4.5);
    const toriiMat = new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.8 });

    // 柱
    const colGeo = new THREE.CylinderGeometry(0.18, 0.22, 4.2, 12);
    const colL = new THREE.Mesh(colGeo, toriiMat);
    colL.position.set(-2.2, 2.1, 0);
    const colR = new THREE.Mesh(colGeo, toriiMat);
    colR.position.set(2.2, 2.1, 0);
    // 笠木
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.35, 0.4), toriiMat);
    topBar.position.set(0, 4.1, 0);
    const subBar = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.2, 0.25), toriiMat);
    subBar.position.set(0, 3.4, 0);

    toriiGroup.add(colL, colR, topBar, subBar);
    scene.add(toriiGroup);

    // 5. 漂う鬼火パーティクル（魂魄）
    const emberCount = 80;
    const emberGeo = new THREE.BufferGeometry();
    const emberPositions = new Float32Array(emberCount * 3);
    for (let i = 0; i < emberCount * 3; i += 3) {
      emberPositions[i] = (Math.random() - 0.5) * 12;
      emberPositions[i + 1] = Math.random() * 3.5;
      emberPositions[i + 2] = (Math.random() - 0.5) * 12;
    }
    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
    const emberMat = new THREE.PointsMaterial({
      size: 0.08,
      color: enemy?.isBoss ? 0xf43f5e : 0x67e8f9,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const embers = new THREE.Points(emberGeo, emberMat);
    scene.add(embers);

    // 6. 3Dプレイヤーアバター（甲冑・刀・陣笠）
    const playerGroup = new THREE.Group();
    playerGroup.position.set(-1.4, 0.35, 0.8);
    playerGroup.rotation.y = 0.55;

    // 胴大鎧
    const armorColor = equipment.chest ? 0x221c1a : 0x18181b;
    const armorMat = new THREE.MeshStandardMaterial({ color: armorColor, metalness: 0.7, roughness: 0.35 });
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.32), armorMat);
    torso.position.y = 0.9;
    torso.castShadow = true;
    playerGroup.add(torso);

    // 頭部防具（陣笠 or 鉢金）
    if (equipment.head) {
      // 編笠・陣笠の円錐メッシュ
      const kasaMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.9 });
      const kasa = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.22, 16), kasaMat);
      kasa.position.y = 1.6;
      kasa.castShadow = true;
      playerGroup.add(kasa);
    } else {
      const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), new THREE.MeshStandardMaterial({ color: 0x27272a }));
      headMesh.position.y = 1.45;
      playerGroup.add(headMesh);
    }

    // 主武器: 日本刀（佩刀）
    if (equipment.mainHand) {
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.98, roughness: 0.1 });
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.4, 0.1), bladeMat);
      blade.position.set(0.48, 0.9, 0.2);
      blade.rotation.x = -0.4;
      blade.castShadow = true;
      playerGroup.add(blade);
    }

    // 脇差・盾
    if (equipment.offHand) {
      const offMat = new THREE.MeshStandardMaterial({ color: 0x713f12, metalness: 0.4, roughness: 0.6 });
      const offWeapon = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.35), offMat);
      offWeapon.position.set(-0.42, 0.85, 0.15);
      playerGroup.add(offWeapon);
    }
    scene.add(playerGroup);

    // 7. 3Dモンスター（鬼・妖異）
    const enemyGroup = new THREE.Group();
    enemyGroup.position.set(1.5, 0.35, -0.2);
    enemyGroup.rotation.y = -0.65;

    if (enemy) {
      if (enemy.isBoss) {
        // ボス: 赤鬼・夜叉
        const oniMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.5, metalness: 0.3 });
        const oniBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.8), oniMat);
        oniBody.position.y = 1.3;
        oniBody.castShadow = true;
        enemyGroup.add(oniBody);

        // 鬼の角
        const hornMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.2 });
        const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.8, 8), hornMat);
        hornL.position.set(-0.35, 2.4, 0);
        hornL.rotation.z = 0.3;
        const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.8, 8), hornMat);
        hornR.position.set(0.35, 2.4, 0);
        hornR.rotation.z = -0.3;
        enemyGroup.add(hornL, hornR);

        // 燃える赤い双眸
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat);
        eyeL.position.set(-0.25, 1.8, 0.45);
        const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat);
        eyeR.position.set(0.25, 1.8, 0.45);
        enemyGroup.add(eyeL, eyeR);
      } else {
        // 通常妖異: 骸骨武者
        const mobMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });
        const mobBody = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 1.2, 8), mobMat);
        mobBody.position.y = 0.9;
        mobBody.castShadow = true;
        enemyGroup.add(mobBody);

        const skull = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), new THREE.MeshStandardMaterial({ color: 0xd6d3d1 }));
        skull.position.y = 1.6;
        enemyGroup.add(skull);
      }
    }
    scene.add(enemyGroup);

    // 8. アニメーション
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // 鬼火の浮遊
      const pos = emberGeo.attributes.position.array as Float32Array;
      for (let i = 1; i < emberCount * 3; i += 3) {
        pos[i] += 0.012;
        if (pos[i] > 3.5) pos[i] = 0;
      }
      emberGeo.attributes.position.needsUpdate = true;

      // 構えの呼吸
      playerGroup.position.y = 0.35 + Math.sin(t * 2.2) * 0.03;
      if (enemyGroup) enemyGroup.position.y = 0.35 + Math.cos(t * 1.8) * 0.04;

      if (isFighting) {
        playerGroup.position.x = -1.4 + Math.sin(t * 10) * 0.08;
        enemyGroup.position.x = 1.5 - Math.sin(t * 10) * 0.08;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      soilTexture.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [floor, isFighting, enemy, equipment]);

  return (
    <div
      ref={mountRef}
      className="w-full h-56 rounded-2xl overflow-hidden relative border border-stone-800 shadow-[inset_0_0_35px_rgba(0,0,0,0.85)]"
    />
  );
};
