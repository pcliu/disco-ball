import { DiscoBall } from './DiscoBall.js';
import * as THREE from 'three';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('DiscoBall', () => {
  let discoBall;

  beforeEach(() => {
    discoBall = new DiscoBall({
      radius: 2,
      segments: 32,
      holes: 20,
      metalness: 0.9,
      roughness: 0.1
    });
  });

  afterEach(() => {
    if (discoBall) {
      discoBall.dispose();
    }
  });

  it('should create DiscoBall instance successfully', () => {
    expect(discoBall).toBeDefined();
    expect(discoBall.config.radius).toBe(2);
    expect(discoBall.config.holes).toBe(20);
  });

  it('should create mesh object correctly', () => {
    const mesh = discoBall.getMesh();
    expect(mesh).toBeInstanceOf(THREE.Mesh);
    expect(mesh.name).toBe('DiscoBall');
  });

  it('should create sphere geometry correctly', () => {
    const mesh = discoBall.getMesh();
    const geometry = mesh.geometry;
    expect(geometry).toBeInstanceOf(THREE.SphereGeometry);
  });

  it('should create PBR material with correct properties', () => {
    const mesh = discoBall.getMesh();
    const material = mesh.material;
    expect(material).toBeInstanceOf(THREE.MeshPhysicalMaterial);
    expect(material.metalness).toBe(0.9);
    expect(material.roughness).toBe(0.1);
    expect(material.color.getHex()).toBe(0xffffff);
  });

  it('should generate correct number of holes', () => {
    const holes = discoBall.getHoles();
    expect(holes).toHaveLength(20);
  });

  it('should have correct hole data structure', () => {
    const holes = discoBall.getHoles();
    const firstHole = holes[0];
    expect(firstHole).toHaveProperty('id');
    expect(firstHole).toHaveProperty('spherical');
    expect(firstHole).toHaveProperty('direction');
    expect(firstHole).toHaveProperty('position');
    expect(firstHole).toHaveProperty('normal');
    expect(firstHole.direction).toBeInstanceOf(THREE.Vector3);
    expect(firstHole.position).toBeInstanceOf(THREE.Vector3);
  });

  it('should control rotation correctly', () => {
    discoBall.setRotationSpeed(2.0);
    discoBall.setRotationDirection(-1);
    const rotationState = discoBall.getRotationState();
    expect(rotationState.speed).toBe(2.0);
    expect(rotationState.direction).toBe(-1);
  });

  it('should return correct configuration', () => {
    const config = discoBall.getConfig();
    expect(config.radius).toBe(2);
    expect(config.holes).toBe(20);
    expect(config.metalness).toBe(0.9);
  });

  it('should calculate world position correctly', () => {
    const worldPos = discoBall.getWorldPosition();
    expect(worldPos).toBeInstanceOf(THREE.Vector3);
  });

  it('should calculate hole world coordinates correctly', () => {
    const holeWorldPos = discoBall.getHoleWorldPosition(0);
    const holeWorldDir = discoBall.getHoleWorldDirection(0);
    expect(holeWorldPos).toBeInstanceOf(THREE.Vector3);
    expect(holeWorldDir).toBeInstanceOf(THREE.Vector3);
  });

  it('should update material properties correctly', () => {
    const mesh = discoBall.getMesh();
    const material = mesh.material;
    discoBall.updateMaterial({ metalness: 0.8 });
    expect(material.metalness).toBe(0.8);
  });
});