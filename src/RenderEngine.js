import * as THREE from 'three';
import { DiscoBall } from './DiscoBall.js';
import { LightBeamSystem } from './LightBeamSystem.js';

/**
 * RenderEngine - 核心渲染引擎类
 * 负责Three.js场景的初始化、渲染循环和窗口大小调整
 */
export class RenderEngine {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationId = null;
    this.isInitialized = false;
    
    // 渲染状态
    this.frameRate = 60;
    this.lastTime = 0;
    this.frameInterval = 1000 / this.frameRate;
    
    // 响应式设备信息
    this.deviceInfo = this.detectDevice();
    this.responsiveConfig = this.getResponsiveConfig();
    
    // 迪斯科球实例
    this.discoBall = null;
    
    // 光束系统实例
    this.lightBeamSystem = null;
    
    // 绑定方法上下文
    this.render = this.render.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
  }

  /**
   * 初始化渲染引擎
   */
  init() {
    try {
      this.createScene();
      this.createCamera();
      this.createRenderer();
      this.setupLighting();
      this.createDiscoBall();
      this.createLightBeamSystem();
      this.setupEventListeners();
      
      this.isInitialized = true;
      this.startRenderLoop();
      
      console.log('RenderEngine initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize RenderEngine:', error);
      return false;
    }
  }

  /**
   * 创建Three.js场景
   */
  createScene() {
    this.scene = new THREE.Scene();
    
    // 设置场景背景为深色渐变（夜店氛围）
    this.scene.background = new THREE.Color(0x0a0a0a);
    
    // 启用雾效果增强深度感
    this.scene.fog = new THREE.Fog(0x0a0a0a, 10, 50);
  }

  /**
   * 创建透视相机
   */
  createCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    
    // 设置相机位置以获得最佳视角
    this.camera.position.set(0, 0, 8);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * 创建WebGL渲染器
   */
  createRenderer() {
    const config = this.responsiveConfig;
    
    this.renderer = new THREE.WebGLRenderer({
      antialias: config.antialias,
      alpha: false,
      powerPreference: 'high-performance'
    });
    
    // 设置渲染器属性
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(config.pixelRatio);
    this.renderer.shadowMap.enabled = config.enableShadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    
    // 将渲染器画布添加到容器
    this.container.appendChild(this.renderer.domElement);
  }

  /**
   * 设置基础光照系统
   */
  setupLighting() {
    // 环境光 - 提供基础照明
    const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
    this.scene.add(ambientLight);
    
    // 主方向光 - 模拟舞厅顶部照明
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    
    // 配置阴影属性
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    
    this.scene.add(directionalLight);
    
    // 辅助光源 - 增强立体感
    const fillLight = new THREE.DirectionalLight(0x4040ff, 0.3);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);
  }

  /**
   * 创建迪斯科球
   */
  createDiscoBall() {
    // 根据设备类型调整球体大小
    const ballConfig = {
      radius: this.getBallRadius(),
      segments: this.getBallSegments(),
      holes: 50,  // 增加孔的数量让效果更炫酷
      metalness: 0.9,
      roughness: 0.1,
      color: 0x000000,  // 改为黑色
      envMapIntensity: 1.0
    };
    
    this.discoBall = new DiscoBall(ballConfig);
    
    // 将迪斯科球添加到场景
    this.scene.add(this.discoBall.getMesh());
    
    console.log('DiscoBall created and added to scene');
  }

  /**
   * 创建光束系统
   */
  createLightBeamSystem() {
    if (!this.discoBall) {
      console.error('Cannot create light beam system: DiscoBall not initialized');
      return;
    }

    // 根据设备性能调整光束配置
    const beamConfig = this.getLightBeamConfig();
    
    this.lightBeamSystem = new LightBeamSystem(this.discoBall, beamConfig);
    
    // 将光束组添加到场景
    this.scene.add(this.lightBeamSystem.getBeamGroup());
    
    console.log('LightBeamSystem created and added to scene');
  }

  /**
   * 根据设备性能获取光束配置
   */
  getLightBeamConfig() {
    const { performanceLevel } = this.deviceInfo;
    
    const baseConfig = {
      beamLength: 8,
      beamRadius: 0.3,
      beamTipRadius: 0.05,
      beamSegments: 8,
      beamOpacity: 0.8,
      beamIntensity: 2.0,
      colorMode: 'rainbow',
      animationSpeed: 0.02
    };
    
    // 根据性能等级调整
    const performanceConfig = {
      low: {
        beamLength: 6,
        beamRadius: 0.2,
        beamSegments: 6,
        beamOpacity: 0.6,
        beamIntensity: 1.5,
        animationSpeed: 0.015
      },
      medium: {
        beamLength: 7,
        beamRadius: 0.25,
        beamSegments: 8,
        beamOpacity: 0.7,
        beamIntensity: 1.8,
        animationSpeed: 0.018
      },
      high: {
        beamLength: 8,
        beamRadius: 0.3,
        beamSegments: 8,
        beamOpacity: 0.8,
        beamIntensity: 2.0,
        animationSpeed: 0.02
      }
    };
    
    return {
      ...baseConfig,
      ...performanceConfig[performanceLevel]
    };
  }

  /**
   * 根据设备类型获取球体半径
   */
  getBallRadius() {
    const { screenSize } = this.deviceInfo;
    const baseRadius = 2;
    
    const sizeMultipliers = {
      mobile: 1.2,      // 移动端稍大一些以保持视觉效果
      tablet: 1.1,      // 平板端略大
      'small-desktop': 1.0,
      desktop: 1.0
    };
    
    return baseRadius * (sizeMultipliers[screenSize] || 1.0);
  }

  /**
   * 根据设备性能获取球体分段数
   */
  getBallSegments() {
    const { performanceLevel } = this.deviceInfo;
    
    const segmentCounts = {
      low: 16,      // 低性能设备使用较少分段
      medium: 24,   // 中等性能
      high: 32      // 高性能设备使用更多分段
    };
    
    return segmentCounts[performanceLevel] || 32;
  }

  /**
   * 获取迪斯科球实例
   */
  getDiscoBall() {
    return this.discoBall;
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    window.addEventListener('resize', this.onWindowResize, false);
  }

  /**
   * 检测设备类型和性能
   */
  detectDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;
    
    // 检测设备类型
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(userAgent);
    const isDesktop = !isMobile && !isTablet;
    
    // 检测屏幕尺寸类别
    let screenSize = 'desktop';
    if (width <= 480) {
      screenSize = 'mobile';
    } else if (width <= 768) {
      screenSize = 'tablet';
    } else if (width <= 1024) {
      screenSize = 'small-desktop';
    }
    
    // 估算设备性能等级
    let performanceLevel = 'high';
    if (isMobile || pixelRatio > 2 || width * height * pixelRatio > 2073600) { // > 1920x1080
      performanceLevel = 'medium';
    }
    if (width <= 480 && pixelRatio > 2) {
      performanceLevel = 'low';
    }
    
    return {
      isMobile,
      isTablet,
      isDesktop,
      screenSize,
      width,
      height,
      pixelRatio,
      performanceLevel,
      aspectRatio: width / height
    };
  }

  /**
   * 获取响应式配置
   */
  getResponsiveConfig() {
    const { screenSize, performanceLevel, isMobile } = this.deviceInfo;
    
    // 基础配置
    const baseConfig = {
      // 渲染质量设置
      pixelRatio: Math.min(window.devicePixelRatio, 2),
      antialias: true,
      shadowMapSize: 2048,
      
      // 相机设置
      fov: 75,
      near: 0.1,
      far: 1000,
      cameraDistance: 8,
      
      // 性能设置
      targetFPS: 60,
      enableShadows: true,
      enableFog: true
    };
    
    // 根据屏幕尺寸调整
    const sizeConfig = {
      mobile: {
        pixelRatio: Math.min(window.devicePixelRatio, 1.5),
        shadowMapSize: 1024,
        targetFPS: 30,
        cameraDistance: 6,
        fov: 80
      },
      tablet: {
        pixelRatio: Math.min(window.devicePixelRatio, 2),
        shadowMapSize: 1024,
        targetFPS: 45,
        cameraDistance: 7,
        fov: 75
      },
      'small-desktop': {
        cameraDistance: 8,
        fov: 75
      },
      desktop: {
        shadowMapSize: 2048,
        targetFPS: 60,
        cameraDistance: 8,
        fov: 75
      }
    };
    
    // 根据性能等级调整
    const performanceConfig = {
      low: {
        pixelRatio: 1,
        antialias: false,
        shadowMapSize: 512,
        targetFPS: 30,
        enableShadows: false,
        enableFog: false
      },
      medium: {
        pixelRatio: Math.min(window.devicePixelRatio, 1.5),
        shadowMapSize: 1024,
        targetFPS: 45,
        enableShadows: true
      },
      high: {
        pixelRatio: Math.min(window.devicePixelRatio, 2),
        shadowMapSize: 2048,
        targetFPS: 60,
        enableShadows: true
      }
    };
    
    // 合并配置
    return {
      ...baseConfig,
      ...sizeConfig[screenSize],
      ...performanceConfig[performanceLevel]
    };
  }

  /**
   * 更新设备信息（窗口大小变化时调用）
   */
  updateDeviceInfo() {
    const oldDeviceInfo = { ...this.deviceInfo };
    this.deviceInfo = this.detectDevice();
    this.responsiveConfig = this.getResponsiveConfig();
    
    // 如果设备类型发生变化，需要重新配置渲染器
    if (oldDeviceInfo.screenSize !== this.deviceInfo.screenSize ||
        oldDeviceInfo.performanceLevel !== this.deviceInfo.performanceLevel) {
      this.applyResponsiveSettings();
    }
  }

  /**
   * 应用响应式设置
   */
  applyResponsiveSettings() {
    if (!this.renderer || !this.camera) return;
    
    const config = this.responsiveConfig;
    
    // 更新渲染器设置
    this.renderer.setPixelRatio(config.pixelRatio);
    
    // 更新阴影设置
    if (config.enableShadows !== this.renderer.shadowMap.enabled) {
      this.renderer.shadowMap.enabled = config.enableShadows;
      
      // 更新场景中的光源阴影设置
      this.scene.traverse((child) => {
        if (child.isLight && child.castShadow !== undefined) {
          child.castShadow = config.enableShadows;
          if (child.shadow && child.shadow.mapSize) {
            child.shadow.mapSize.setScalar(config.shadowMapSize);
          }
        }
      });
    }
    
    // 更新雾效果
    if (config.enableFog && !this.scene.fog) {
      this.scene.fog = new THREE.Fog(0x0a0a0a, 10, 50);
    } else if (!config.enableFog && this.scene.fog) {
      this.scene.fog = null;
    }
    
    // 更新相机设置
    this.camera.fov = config.fov;
    this.camera.position.z = config.cameraDistance;
    this.camera.updateProjectionMatrix();
    
    // 更新帧率
    this.setFrameRate(config.targetFPS);
    
    console.log(`Applied responsive settings for ${this.deviceInfo.screenSize} (${this.deviceInfo.performanceLevel} performance)`);
  }

  /**
   * 窗口大小调整处理
   */
  onWindowResize() {
    if (!this.isInitialized) return;
    
    // 更新设备信息
    this.updateDeviceInfo();
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    // 更新相机宽高比
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    // 更新渲染器大小
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.responsiveConfig.pixelRatio);
    
    console.log(`Renderer resized to: ${width}x${height} (${this.deviceInfo.screenSize})`);
  }

  /**
   * 开始渲染循环
   */
  startRenderLoop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.render();
  }

  /**
   * 渲染循环 - 控制帧率的渲染
   */
  render(currentTime = 0) {
    this.animationId = requestAnimationFrame(this.render);
    
    // 帧率控制
    const deltaTime = currentTime - this.lastTime;
    if (deltaTime < this.frameInterval) {
      return;
    }
    this.lastTime = currentTime - (deltaTime % this.frameInterval);
    
    // 更新动画
    this.updateAnimations(deltaTime);
    
    // 执行渲染
    if (this.isInitialized && this.scene && this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * 更新所有动画
   */
  updateAnimations(deltaTime) {
    // 更新迪斯科球旋转
    if (this.discoBall) {
      this.discoBall.updateRotation(deltaTime);
    }
    
    // 更新光束系统
    if (this.lightBeamSystem) {
      this.lightBeamSystem.update(deltaTime);
    }
  }

  /**
   * 停止渲染循环
   */
  stopRenderLoop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * 获取场景对象（供其他组件使用）
   */
  getScene() {
    return this.scene;
  }

  /**
   * 获取相机对象（供其他组件使用）
   */
  getCamera() {
    return this.camera;
  }

  /**
   * 获取渲染器对象（供其他组件使用）
   */
  getRenderer() {
    return this.renderer;
  }

  /**
   * 设置帧率
   */
  setFrameRate(fps) {
    this.frameRate = Math.max(30, Math.min(120, fps));
    this.frameInterval = 1000 / this.frameRate;
  }

  /**
   * 获取当前响应式状态信息（用于调试）
   */
  getResponsiveInfo() {
    return {
      deviceInfo: { ...this.deviceInfo },
      responsiveConfig: { ...this.responsiveConfig },
      currentSize: {
        width: this.container.clientWidth,
        height: this.container.clientHeight
      },
      renderingInfo: {
        pixelRatio: this.renderer ? this.renderer.getPixelRatio() : null,
        frameRate: this.frameRate,
        shadowsEnabled: this.renderer ? this.renderer.shadowMap.enabled : null
      }
    };
  }

  /**
   * 检查WebGL支持
   */
  static checkWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (e) {
      return false;
    }
  }

  /**
   * 清理资源
   */
  dispose() {
    this.stopRenderLoop();
    
    // 移除事件监听器
    window.removeEventListener('resize', this.onWindowResize);
    
    // 清理迪斯科球
    if (this.discoBall) {
      this.discoBall.dispose();
      this.discoBall = null;
    }
    
    // 清理光束系统
    if (this.lightBeamSystem) {
      this.lightBeamSystem.dispose();
      this.lightBeamSystem = null;
    }
    
    // 清理Three.js资源
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
    
    if (this.scene) {
      // 清理场景中的所有对象
      while (this.scene.children.length > 0) {
        const child = this.scene.children[0];
        this.scene.remove(child);
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    }
    
    this.isInitialized = false;
    console.log('RenderEngine disposed');
  }
}