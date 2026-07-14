"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    THREE: any;
  }
}

export default function ThreeNetwork() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [threeLoaded, setThreeLoaded] = useState(false);

  useEffect(() => {
    if (!threeLoaded || !containerRef.current || !window.THREE) return;

    const THREE = window.THREE;
    const container = containerRef.current;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Clear any previous canvas
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Create a complex network sphere
    const group = new THREE.Group();
    scene.add(group);

    const nodeCount = 60;
    const nodes: any[] = [];
    const nodeGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const nodeMaterial = new THREE.MeshPhongMaterial({
      color: 0x2563eb,
      emissive: 0x2563eb,
      emissiveIntensity: 0.5,
    });

    for (let i = 0; i < nodeCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / nodeCount);
      const theta = Math.sqrt(nodeCount * Math.PI) * phi;

      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      node.position.setFromSphericalCoords(2, phi, theta);
      node.userData = {
        originalPosition: node.position.clone(),
      };
      group.add(node);
      nodes.push(node);
    }

    // Lines between nodes
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x2563eb,
      transparent: true,
      opacity: 0.2,
    });
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions: number[] = [];

    // Connect each node to its 3 nearest neighbors
    for (let i = 0; i < nodes.length; i++) {
      const neighbors = nodes
        .map((n, idx) => ({ dist: nodes[i].position.distanceTo(n.position), idx }))
        .sort((a, b) => a.dist - b.dist)
        .slice(1, 4);

      neighbors.forEach((neighbor) => {
        linePositions.push(nodes[i].position.x, nodes[i].position.y, nodes[i].position.z);
        linePositions.push(nodes[neighbor.idx].position.x, nodes[neighbor.idx].position.y, nodes[neighbor.idx].position.z);
      });
    }
    lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    group.add(lines);

    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(5, 5, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    camera.position.z = 5;

    let animationFrameId: number;

    function animate() {
      animationFrameId = requestAnimationFrame(animate);

      const time = Date.now() * 0.001;
      group.rotation.y += 0.002;
      group.rotation.x += 0.001;

      nodes.forEach((node, i) => {
        const offset = Math.sin(time + i) * 0.1;
        node.position.copy(node.userData.originalPosition).multiplyScalar(1 + offset * 0.2);
      });

      // Update lines
      const posAttr = lines.geometry.attributes.position;
      let index = 0;
      for (let i = 0; i < nodes.length; i++) {
        const neighbors = nodes
          .map((n, idx) => ({ dist: nodes[i].position.distanceTo(n.position), idx }))
          .sort((a, b) => a.dist - b.dist)
          .slice(1, 4);

        neighbors.forEach((neighbor) => {
          posAttr.setXYZ(index++, nodes[i].position.x, nodes[i].position.y, nodes[i].position.z);
          posAttr.setXYZ(index++, nodes[neighbor.idx].position.x, nodes[neighbor.idx].position.y, nodes[neighbor.idx].position.z);
        });
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    }

    const handleResize = () => {
      const w = container.clientWidth || 500;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      container.innerHTML = "";
    };
  }, [threeLoaded]);

  return (
    <>
      <Script
        src="https://ajax.googleapis.com/ajax/libs/threejs/r125/three.min.js"
        strategy="afterInteractive"
        onLoad={() => setThreeLoaded(true)}
      />
      <div ref={containerRef} className="w-full h-full" />
    </>
  );
}
