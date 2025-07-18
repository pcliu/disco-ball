import * as THREE from 'three';

/**
 * DiscoBall - 迪斯科球3D模型类
 * 负责创建球体几何、金属材质和灯孔系统
 */
export class DiscoBall {
  constructor(config = {}) {
    // 配置参数
    this.config = {
      radius: config.radius || 2,
      segments: config.segments || 32,
      holes: config.holes || 12,  // 减少孔的数量，让光束更加突出
      metalness: config.metalness || 0.9,
      roughness: config.roughness || 0.1,
      color: config.color || 0x000000,  // 改为黑色
      envMapIntensity: config.envMapIntensity || 1.0,
      ...config
    };

    // 核心组件
    this.geometry = null;
    this.material = null;
    this.mesh = null;
    this.holes = []; // 存储灯孔位置数据
    
    // 旋转状态
    this.rotationSpeed = 1.0;
    this.targetRotationSpeed = 1.0; // 目标旋转速度（用于平滑过渡）
    this.rotationDirection = 1; // 1: 顺时针, -1: 逆时针
    this.currentRotation = { x: 0, y: 0, z: 0 };
    
    // 旋转动画配置
    this.rotationConfig = {
      speedTransitionRate: 0.05, // 速度过渡的平滑度
      minSpeed: 0.1,             // 最小旋转速度
      maxSpeed: 5.0,             // 最大旋转速度
      xAxisFactor: 0.1,          // X轴旋转因子（增加动感）
      zAxisFactor: 0.05          // Z轴旋转因子（轻微摆动）
    };
    
    // 初始化
    this.init();
  }

  /**
   * 初始化迪斯科球
   */
  init() {
    this.createGeometry();
    this.generateHoles();
    this.createHoleGeometry(); // 在几何体上创建孔的效果
    this.createMaterial();
    this.createMesh();
    this.createHoleVisuals(); // 创建孔的视觉效果
    
    console.log('DiscoBall initialized with', this.holes.length, 'holes');
  }

  /**
   * 创建球体几何体
   */
  createGeometry() {
    this.geometry = new THREE.SphereGeometry(
      this.config.radius,
      this.config.segments,
      this.config.segments
    );
    
    // 计算法线以确保正确的光照
    this.geometry.computeVertexNormals();
  }

  /**
   * 在球体表面创建灯孔的视觉效果
   * 通过修改几何体顶点来创建凹陷
   */
  createHoleGeometry() {
    if (!this.geometry || this.holes.length === 0) return;

    const positions = this.geometry.attributes.position;
    const normals = this.geometry.attributes.normal;
    const vertices = [];
    const normalArray = [];

    // 获取所有顶点
    for (let i = 0; i < positions.count; i++) {
      vertices.push(new THREE.Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      ));
      normalArray.push(new THREE.Vector3(
        normals.getX(i),
        normals.getY(i),
        normals.getZ(i)
      ));
    }

    // 为每个灯孔创建凹陷效果
    const holeRadius = 0.35; // 灯孔半径（进一步增大）
    const holeDepth = 0.3;   // 凹陷深度（进一步增大）

    this.holes.forEach(hole => {
      const holeCenter = hole.direction.clone().multiplyScalar(this.config.radius);
      
      // 找到靠近灯孔中心的顶点并创建凹陷
      for (let i = 0; i < vertices.length; i++) {
        const vertex = vertices[i];
        const distance = vertex.distanceTo(holeCenter);
        
        if (distance < holeRadius) {
          // 计算凹陷因子（距离中心越近，凹陷越深）
          const factor = 1 - (distance / holeRadius);
          const depthFactor = Math.pow(factor, 2) * holeDepth;
          
          // 向内凹陷
          const inwardDirection = hole.direction.clone().multiplyScalar(-depthFactor);
          vertex.add(inwardDirection);
          
          // 更新法线以创建更好的光照效果
          const normal = normalArray[i];
          normal.lerp(hole.direction.clone().multiplyScalar(-1), factor * 0.3);
          normal.normalize();
        }
      }
    });

    // 更新几何体
    for (let i = 0; i < vertices.length; i++) {
      positions.setXYZ(i, vertices[i].x, vertices[i].y, vertices[i].z);
      normals.setXYZ(i, normalArray[i].x, normalArray[i].y, normalArray[i].z);
    }

    positions.needsUpdate = true;
    normals.needsUpdate = true;
    this.geometry.computeBoundingSphere();
  }

  /**
   * 创建PBR金属材质
   */
  createMaterial() {
    this.material = new THREE.MeshPhysicalMaterial({
      // 基础颜色：黑色金属质感
      color: new THREE.Color(this.config.color),
      
      // PBR材质属性
      metalness: this.config.metalness,    // 高金属度
      roughness: this.config.roughness,    // 低粗糙度（高反射）
      
      // 其他属性
      clearcoat: 0.1,           // 轻微的清漆层效果
      clearcoatRoughness: 0.1,  // 清漆层粗糙度
      reflectivity: 0.8,        // 适中的反射率
      
      // 启用阴影
      transparent: false,
      opacity: 1.0,
      
      // 双面渲染
      side: THREE.FrontSide
    });
  }



  /**
   * 创建网格对象
   */
  createMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    
    // 启用阴影
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    // 设置名称便于调试
    this.mesh.name = 'DiscoBall';
    
    // 设置初始位置
    this.mesh.position.set(0, 0, 0);
  }

  /**
   * 生成均匀分布的灯孔位置
   * 使用斐波那契螺旋算法在球面上均匀分布点
   */
  generateHoles() {
    this.holes = [];
    const numHoles = this.config.holes;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    
    for (let i = 0; i < numHoles; i++) {
      // 斐波那契螺旋算法
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / numHoles);
      
      // 转换为笛卡尔坐标
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.sin(phi) * Math.sin(theta);
      const z = Math.cos(phi);
      
      // 创建位置向量（单位球面上的点）
      const position = new THREE.Vector3(x, y, z);
      
      // 缩放到球体半径
      const worldPosition = position.clone().multiplyScalar(this.config.radius);
      
      // 存储灯孔数据
      this.holes.push({
        id: i,
        // 球面坐标（用于计算）
        spherical: {
          theta: theta,
          phi: phi
        },
        // 单位向量（方向）
        direction: position.clone(),
        // 世界坐标位置
        position: worldPosition,
        // 法向量（指向球心外）
        normal: position.clone()
      });
    }
    
    console.log(`Generated ${this.holes.length} holes using Fibonacci spiral distribution`);
  }

  /**
   * 获取网格对象（用于添加到场景）
   */
  getMesh() {
    return this.mesh;
  }

  /**
   * 创建孔的视觉效果
   * 在每个孔的位置添加深色小圆形来模拟真实的迪斯科球
   */
  createHoleVisuals() {
    if (!this.mesh || this.holes.length === 0) return;

    // 创建孔的材质 - 深色金属
    const holeMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x202020), // 深灰色
      metalness: 0.8,
      roughness: 0.6,
      transparent: true,
      opacity: 0.9
    });

    // 为每个孔创建小的圆形几何体 - 增大孔的半径让效果更明显
    const holeRadius = 0.35;  // 进一步增大孔的半径，让效果更突出
    const holeGeometry = new THREE.CircleGeometry(holeRadius, 16);  // 增加分段数让圆形更平滑

    this.holes.forEach((hole, index) => {
      // 创建孔的网格
      const holeMesh = new THREE.Mesh(holeGeometry, holeMaterial);
      
      // 设置孔的位置（稍微向内一点，避免z-fighting）
      const holePosition = hole.direction.clone().multiplyScalar(this.config.radius - 0.01);
      holeMesh.position.copy(holePosition);
      
      // 让孔面向球心外部
      holeMesh.lookAt(hole.direction.clone().multiplyScalar(this.config.radius + 1));
      
      // 设置名称便于调试
      holeMesh.name = `DiscoBallHole_${index}`;
      
      // 将孔添加到迪斯科球网格中作为子对象
      this.mesh.add(holeMesh);
    });

    console.log(`Created ${this.holes.length} hole visuals`);
  }

  /**
   * 获取灯孔位置数据
   */
  getHoles() {
    return this.holes;
  }

  /**
   * 更新旋转（在渲染循环中调用）
   */
  updateRotation(deltaTime) {
    if (!this.mesh) return;
    
    // 平滑过渡到目标旋转速度
    this.updateRotationSpeed(deltaTime);
    
    // 计算旋转增量
    const rotationDelta = this.rotationSpeed * this.rotationDirection * deltaTime * 0.001;
    
    // 主要绕Y轴旋转（垂直轴）
    this.currentRotation.y += rotationDelta;
    
    // 添加轻微的X轴旋转增加动感
    this.currentRotation.x += rotationDelta * this.rotationConfig.xAxisFactor;
    
    // 添加轻微的Z轴摆动效果
    this.currentRotation.z += Math.sin(this.currentRotation.y * 2) * this.rotationConfig.zAxisFactor * rotationDelta;
    
    // 应用旋转
    this.mesh.rotation.set(
      this.currentRotation.x,
      this.currentRotation.y,
      this.currentRotation.z
    );
  }

  /**
   * 平滑更新旋转速度
   */
  updateRotationSpeed(deltaTime) {
    if (Math.abs(this.rotationSpeed - this.targetRotationSpeed) > 0.01) {
      // 使用线性插值实现平滑过渡
      const transitionRate = this.rotationConfig.speedTransitionRate * (deltaTime * 0.001);
      this.rotationSpeed = THREE.MathUtils.lerp(
        this.rotationSpeed, 
        this.targetRotationSpeed, 
        Math.min(transitionRate, 1.0)
      );
    } else {
      this.rotationSpeed = this.targetRotationSpeed;
    }
  }

  /**
   * 设置旋转速度（带平滑过渡）
   */
  setRotationSpeed(speed) {
    this.targetRotationSpeed = Math.max(
      this.rotationConfig.minSpeed, 
      Math.min(this.rotationConfig.maxSpeed, speed)
    );
  }

  /**
   * 立即设置旋转速度（无过渡）
   */
  setRotationSpeedImmediate(speed) {
    const clampedSpeed = Math.max(
      this.rotationConfig.minSpeed, 
      Math.min(this.rotationConfig.maxSpeed, speed)
    );
    this.rotationSpeed = clampedSpeed;
    this.targetRotationSpeed = clampedSpeed;
  }

  /**
   * 设置旋转方向
   */
  setRotationDirection(direction) {
    this.rotationDirection = direction > 0 ? 1 : -1;
  }

  /**
   * 停止旋转（平滑停止）
   */
  stopRotation() {
    this.setRotationSpeed(0);
  }

  /**
   * 立即停止旋转
   */
  stopRotationImmediate() {
    this.setRotationSpeedImmediate(0);
  }

  /**
   * 设置旋转配置
   */
  setRotationConfig(config) {
    this.rotationConfig = { ...this.rotationConfig, ...config };
  }

  /**
   * 获取当前旋转状态
   */
  getRotationState() {
    return {
      speed: this.rotationSpeed,
      targetSpeed: this.targetRotationSpeed,
      direction: this.rotationDirection,
      currentRotation: { ...this.currentRotation },
      isTransitioning: Math.abs(this.rotationSpeed - this.targetRotationSpeed) > 0.01,
      config: { ...this.rotationConfig }
    };
  }

  /**
   * 更新材质属性
   */
  updateMaterial(properties = {}) {
    if (!this.material) return;
    
    Object.keys(properties).forEach(key => {
      if (this.material[key] !== undefined) {
        this.material[key] = properties[key];
      }
    });
    
    this.material.needsUpdate = true;
  }

  /**
   * 获取球体配置信息
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * 获取球体在世界坐标系中的位置
   */
  getWorldPosition() {
    if (!this.mesh) return new THREE.Vector3();
    
    const worldPosition = new THREE.Vector3();
    this.mesh.getWorldPosition(worldPosition);
    return worldPosition;
  }

  /**
   * 获取指定灯孔在世界坐标系中的位置
   */
  getHoleWorldPosition(holeIndex) {
    if (!this.mesh || holeIndex < 0 || holeIndex >= this.holes.length) {
      return null;
    }
    
    const hole = this.holes[holeIndex];
    const worldPosition = hole.position.clone();
    
    // 应用球体的变换矩阵
    worldPosition.applyMatrix4(this.mesh.matrixWorld);
    
    return worldPosition;
  }

  /**
   * 获取指定灯孔的世界方向向量
   */
  getHoleWorldDirection(holeIndex) {
    if (!this.mesh || holeIndex < 0 || holeIndex >= this.holes.length) {
      return null;
    }
    
    const hole = this.holes[holeIndex];
    const worldDirection = hole.direction.clone();
    
    // 应用球体的旋转变换
    worldDirection.applyQuaternion(this.mesh.quaternion);
    
    return worldDirection;
  }

  /**
   * 清理资源
   */
  dispose() {
    // 清理几何体
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }
    
    // 清理材质
    if (this.material) {
      // 清理环境贴图
      if (this.material.envMap) {
        this.material.envMap.dispose();
      }
      
      this.material.dispose();
      this.material = null;
    }
    
    // 清理网格引用
    this.mesh = null;
    this.holes = [];
    
    console.log('DiscoBall disposed');
  }
}