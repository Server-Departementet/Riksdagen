"use client";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";

export default function RailsAndRoadsPage() {
  return (
    <main>
      <Canvas>
        <ambientLight intensity={0.5} />
      </Canvas>
    </main >
  );
}

{/* import * as THREE from 'three'
import { createRoot } from 'react-dom/client'
import React, { useRef, useState } from 'react'
import { Canvas, useFrame, ThreeElements } from '@react-three/fiber'
import './styles.css'

function Box(props: ThreeElements['mesh']) {
const meshRef = useRef<THREE.Mesh>(null!)
const [hovered, setHover] = useState(false)
const [active, setActive] = useState(false)
useFrame((state, delta) => (meshRef.current.rotation.x += delta))
return (
  <mesh
    {...props}
    ref={meshRef}
    scale={active ? 1.5 : 1}
    onClick={(event) => setActive(!active)}
    onPointerOver={(event) => setHover(true)}
    onPointerOut={(event) => setHover(false)}>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color={hovered ? 'hotpink' : '#2f74c0'} />
  </mesh>
)
}

createRoot(document.getElementById('root')).render(
<Canvas>
  <ambientLight intensity={Math.PI / 2} />
  <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
  <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
  <Box position={[-1.2, 0, 0]} />
  <Box position={[1.2, 0, 0]} />
</Canvas>,
) */}