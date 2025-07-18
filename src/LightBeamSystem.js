import * as THREE from 'three';

/**
 * LightBeamSystem - 光束系统类
 * 负责创建和管理从迪斯科球灯孔发射的彩色光束
 */
export class LightBeamSystem {
  constructor(discoBall, config = {}) {
    this.discoBall = discoBall;
    
    // 配置参数
    this.config = {
      beamLength: config.beamLength || 8,        // 光束长度
      beamRadius: config.beamRadius || 0.5,      // 光束底部半径（增大）
      beamTipRadius: config.beamTipRadius || 0.05, // 光束顶部半径
      beamSegments: config.beamSegments || 8,    // 光束分段数
      beamOpacity: config.beamOpacity || 0.8,    // 光束透明度
      beamIntensity: config.beamIntensity || 2.0, // 光束强度
      colorMode: config.colorMode || 'rainbow',   // 颜色模式: 'rainbow' | 'random'
      animationSpeed: config.animationSpeed || 0.02, // 颜色动画速度
      
      // 眩光和lens-flare配置
      enableLensFlare: config.enableLensFlare !== false, // 启用lens-flare效果
      flareSize: config.flareSize || 1.0,        // 眩光大小
      flareIntensity: config.flareIntensity || 1.5, // 眩光强度
      flareOpacity: config.flareOpacity || 0.8,   // 眩光透明度
      pulseSpeed: config.pulseSpeed || 2.0,       // 脉动速度
      ...config
    };

    // 光束数据
    this.beams = [];
    this.beamGroup = new THREE.Group();
    this.beamGroup.name = 'LightBeamSystem';
    
    // 眩光和lens-flare系统
    this.lensFlares = [];
    this.flareGroup = new THREE.Group();
    this.flareGroup.name = 'LensFlareSystem';
    
    // 颜色系统
    this.colorTime = 0;
    this.rainbowColors = [
      new THREE.Color(0xff0000), // 红
      new THREE.Color(0xff8000), // 橙
      new THREE.Color(0xffff00), // 黄
      new THREE.Color(0x00ff00), // 绿
      new THREE.Color(0x00ffff), // 青
      new THREE.Color(0x0080ff), // 蓝
      new THREE.Color(0x8000ff), // 紫
    ];
    
    // 自定义着色器材质
    this.beamMaterial = null;
    this.beamGeometry = null;
    
    // 初始化
    this.init();
  }

  /**
   * 初始化光束系统
   */
  init() {
    this.createBeamGeometry();
    this.createBeamMaterial();
    this.createBeams();
    
    console.log(`LightBeamSystem initialized with ${this.beams.length} beams`);
  }

  /**
   * 创建光束几何体（圆柱形）
   */
  createBeamGeometry() {
    // 创建圆柱几何体作为光束
    this.beamGeometry = new THREE.CylinderGeometry(
      this.config.beamRadius,     // 顶部半径
      this.config.beamRadius,     // 底部半径（相同，形成圆柱）
      this.config.beamLength,     // 高度（长度）
      this.config.beamSegments,   // 径向分段
      1,                          // 高度分段
      false,                      // 开放端面
      0,                          // 起始角度
      Math.PI * 2                 // 扫描角度
    );

    // 调整几何体，使光束从原点向外发射
    // 默认圆柱的中心在原点，我们需要调整为从底部发射
    this.beamGeometry.translate(0, this.config.beamLength / 2, 0);
  }

  /**
   * 创建自定义着色器材质
   */
  createBeamMaterial() {
    // 顶点着色器
    const vertexShader = `
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      
      void main() {
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        vUv = uv;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    // 片段着色器 - 实现光束渐变效果
    const fragmentShader = `
      uniform vec3 color;
      uniform float opacity;
      uniform float intensity;
      uniform float time;
      
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      
      void main() {
        // 计算从中心到边缘的距离（径向渐变）
        float radialDistance = length(vUv - vec2(0.5, 0.5)) * 2.0;
        
        // 计算沿光束长度的渐变（从底部到顶部）
        float lengthFade = 1.0 - vUv.y;
        
        // 组合径向和长度渐变
        float alpha = opacity * (1.0 - radialDistance) * lengthFade;
        
        // 添加脉动效果
        float pulse = 0.8 + 0.2 * sin(time * 3.0);
        alpha *= pulse;
        
        // 确保alpha不为负数
        alpha = max(alpha, 0.0);
        
        // 应用强度到颜色
        vec3 finalColor = color * intensity;
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    // 创建着色器材质
    this.beamMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
        opacity: { value: this.config.beamOpacity },
        intensity: { value: this.config.beamIntensity },
        time: { value: 0.0 }
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending, // 加法混合创建光效
      side: THREE.DoubleSide,
      depthWrite: false, // 避免透明度问题
      depthTest: true
    });
  }

  /**
   * 为每个灯孔创建光束
   */
  createBeams() {
    const holes = this.discoBall.getHoles();
    
    holes.forEach((hole, index) => {
      // 为每个光束创建独立的材质实例
      const beamMaterial = this.beamMaterial.clone();
      
      // 创建光束网格
      const beamMesh = new THREE.Mesh(this.beamGeometry, beamMaterial);
      
      // 设置光束位置（在灯孔位置）
      beamMesh.position.copy(hole.position);
      
      // 设置光束方向（垂直于球面，沿法向量方向）
      // 创建一个从原点指向目标点的向量来设置正确的方向
      const targetPoint = hole.position.clone().add(hole.direction.clone().multiplyScalar(this.config.beamLength));
      beamMesh.lookAt(targetPoint);
      
      // 确保光束垂直于球面：使用四元数直接设置方向
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), hole.direction);
      beamMesh.setRotationFromQuaternion(quaternion);
      
      // 设置名称便于调试
      beamMesh.name = `LightBeam_${index}`;
      
      // 存储光束数据
      const beamData = {
        id: index,
        mesh: beamMesh,
        material: beamMaterial,
        hole: hole,
        baseColor: new THREE.Color(0xffffff), // 基础颜色
        currentColor: new THREE.Color(0xffffff), // 当前颜色
        colorOffset: index / holes.length, // 颜色偏移（用于彩虹效果）
        randomColorTarget: new THREE.Color().setHSL(Math.random(), 1.0, 0.5) // 随机颜色目标
      };
      
      this.beams.push(beamData);
      this.beamGroup.add(beamMesh);
    });
    
    // 初始化颜色
    this.updateColors();
  }

  /**
   * 获取光束组（用于添加到场景）
   */
  getBeamGroup() {
    return this.beamGroup;
  }

  /**
   * 更新光束颜色
   */
  updateColors() {
    this.beams.forEach((beam, index) => {
      let targetColor;
      
      if (this.config.colorMode === 'rainbow') {
        // 彩虹模式：按彩虹色谱循环
        targetColor = this.getRainbowColor(beam.colorOffset + this.colorTime);
      } else if (this.config.colorMode === 'random') {
        // 随机模式：随机变化颜色
        targetColor = beam.randomColorTarget.clone();
        
        // 偶尔更新随机颜色目标
        if (Math.random() < 0.01) {
          beam.randomColorTarget.setHSL(Math.random(), 1.0, 0.5);
        }
      } else {
        // 默认白色
        targetColor = new THREE.Color(0xffffff);
      }
      
      // 平滑过渡到目标颜色
      beam.currentColor.lerp(targetColor, 0.05);
      
      // 更新材质颜色
      beam.material.uniforms.color.value.copy(beam.currentColor);
    });
  }

  /**
   * 获取彩虹颜色
   */
  getRainbowColor(t) {
    // 将时间映射到彩虹色谱
    const normalizedT = (t % 1.0 + 1.0) % 1.0; // 确保在0-1范围内
    const colorIndex = normalizedT * (this.rainbowColors.length - 1);
    const lowerIndex = Math.floor(colorIndex);
    const upperIndex = Math.ceil(colorIndex);
    const factor = colorIndex - lowerIndex;
    
    // 在两个颜色之间插值
    const lowerColor = this.rainbowColors[lowerIndex];
    const upperColor = this.rainbowColors[upperIndex % this.rainbowColors.length];
    
    return lowerColor.clone().lerp(upperColor, factor);
  }

  /**
   * 更新光束系统（在渲染循环中调用）
   */
  update(deltaTime) {
    // 更新时间
    this.colorTime += this.config.animationSpeed * (deltaTime * 0.001);
    
    // 更新所有光束材质的时间uniform
    this.beams.forEach(beam => {
      beam.material.uniforms.time.value = this.colorTime;
    });
    
    // 更新颜色
    this.updateColors();
    
    // 同步光束位置和方向（如果球体在旋转）
    this.syncWithDiscoBall();
  }

  /**
   * 同步光束与迪斯科球的旋转
   */
  syncWithDiscoBall() {
    if (!this.discoBall || !this.discoBall.getMesh()) return;
    
    const discoBallMesh = this.discoBall.getMesh();
    const holes = this.discoBall.getHoles();
    
    // 更新每个光束的位置和方向，考虑球体的旋转
    this.beams.forEach((beam, index) => {
      if (index >= holes.length) return;
      
      const hole = holes[index];
      
      // 获取旋转后的灯孔位置
      const rotatedPosition = hole.position.clone();
      rotatedPosition.applyQuaternion(discoBallMesh.quaternion);
      rotatedPosition.add(discoBallMesh.position);
      
      // 获取旋转后的灯孔方向
      const rotatedDirection = hole.direction.clone();
      rotatedDirection.applyQuaternion(discoBallMesh.quaternion);
      
      // 更新光束位置
      beam.mesh.position.copy(rotatedPosition);
      
      // 更新光束方向（确保垂直于球面）
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), rotatedDirection);
      beam.mesh.setRotationFromQuaternion(quaternion);
    });
  }

  /**
   * 设置颜色模式
   */
  setColorMode(mode) {
    if (['rainbow', 'random', 'white'].includes(mode)) {
      this.config.colorMode = mode;
      console.log(`Light beam color mode set to: ${mode}`);
    }
  }

  /**
   * 设置光束强度
   */
  setIntensity(intensity) {
    this.config.beamIntensity = Math.max(0, intensity);
    
    this.beams.forEach(beam => {
      beam.material.uniforms.intensity.value = this.config.beamIntensity;
    });
  }

  /**
   * 设置光束透明度
   */
  setOpacity(opacity) {
    this.config.beamOpacity = Math.max(0, Math.min(1, opacity));
    
    this.beams.forEach(beam => {
      beam.material.uniforms.opacity.value = this.config.beamOpacity;
    });
  }

  /**
   * 设置动画速度
   */
  setAnimationSpeed(speed) {
    this.config.animationSpeed = Math.max(0, speed);
  }

  /**
   * 获取光束数量
   */
  getBeamCount() {
    return this.beams.length;
  }

  /**
   * 获取配置信息
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * 显示/隐藏光束
   */
  setVisible(visible) {
    this.beamGroup.visible = visible;
  }

  /**
   * 清理资源
   */
  dispose() {
    // 清理几何体
    if (this.beamGeometry) {
      this.beamGeometry.dispose();
      this.beamGeometry = null;
    }
    
    // 清理材质
    this.beams.forEach(beam => {
      if (beam.material) {
        beam.material.dispose();
      }
    });
    
    // 清理原始材质
    if (this.beamMaterial) {
      this.beamMaterial.dispose();
      this.beamMaterial = null;
    }
    
    // 清理光束数据
    this.beams = [];
    
    // 清理组
    if (this.beamGroup) {
      this.beamGroup.clear();
    }
    
    console.log('LightBeamSystem disposed');
  }
}