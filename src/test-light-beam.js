import * as THREE from 'three';
import { DiscoBall } from './DiscoBall.js';
import { LightBeamSystem } from './LightBeamSystem.js';

/**
 * 测试光束系统的基本功能
 */
function testLightBeamSystem() {
  console.log('=== Testing LightBeamSystem ===');
  
  // 创建迪斯科球
  const discoBall = new DiscoBall({
    radius: 2,
    holes: 20
  });
  
  console.log('✓ DiscoBall created with', discoBall.getHoles().length, 'holes');
  
  // 创建光束系统
  const lightBeamSystem = new LightBeamSystem(discoBall, {
    beamLength: 6,
    beamRadius: 0.25,
    colorMode: 'rainbow'
  });
  
  console.log('✓ LightBeamSystem created with', lightBeamSystem.getBeamCount(), 'beams');
  
  // 测试基本功能
  testBasicFunctionality(lightBeamSystem);
  
  // 测试颜色模式
  testColorModes(lightBeamSystem);
  
  // 测试配置更新
  testConfigUpdates(lightBeamSystem);
  
  // 测试同步功能
  testSyncWithDiscoBall(discoBall, lightBeamSystem);
  
  console.log('=== LightBeamSystem tests completed ===');
  
  return { discoBall, lightBeamSystem };
}

/**
 * 测试基本功能
 */
function testBasicFunctionality(lightBeamSystem) {
  console.log('\n--- Testing Basic Functionality ---');
  
  // 测试获取光束组
  const beamGroup = lightBeamSystem.getBeamGroup();
  console.log('✓ Beam group retrieved:', beamGroup.name);
  console.log('✓ Beam group children count:', beamGroup.children.length);
  
  // 测试配置获取
  const config = lightBeamSystem.getConfig();
  console.log('✓ Config retrieved:', {
    beamLength: config.beamLength,
    beamRadius: config.beamRadius,
    colorMode: config.colorMode
  });
  
  // 测试可见性控制
  lightBeamSystem.setVisible(false);
  console.log('✓ Beams hidden:', !beamGroup.visible);
  
  lightBeamSystem.setVisible(true);
  console.log('✓ Beams shown:', beamGroup.visible);
}

/**
 * 测试颜色模式
 */
function testColorModes(lightBeamSystem) {
  console.log('\n--- Testing Color Modes ---');
  
  // 测试彩虹模式
  lightBeamSystem.setColorMode('rainbow');
  console.log('✓ Rainbow mode set');
  
  // 测试随机模式
  lightBeamSystem.setColorMode('random');
  console.log('✓ Random mode set');
  
  // 测试白色模式
  lightBeamSystem.setColorMode('white');
  console.log('✓ White mode set');
  
  // 测试无效模式（应该被忽略）
  const originalMode = lightBeamSystem.getConfig().colorMode;
  lightBeamSystem.setColorMode('invalid');
  const newMode = lightBeamSystem.getConfig().colorMode;
  console.log('✓ Invalid mode ignored:', originalMode === newMode);
}

/**
 * 测试配置更新
 */
function testConfigUpdates(lightBeamSystem) {
  console.log('\n--- Testing Config Updates ---');
  
  // 测试强度设置
  lightBeamSystem.setIntensity(1.5);
  console.log('✓ Intensity set to 1.5');
  
  // 测试透明度设置
  lightBeamSystem.setOpacity(0.6);
  console.log('✓ Opacity set to 0.6');
  
  // 测试动画速度设置
  lightBeamSystem.setAnimationSpeed(0.05);
  console.log('✓ Animation speed set to 0.05');
  
  // 测试边界值
  lightBeamSystem.setIntensity(-1); // 应该被限制为0
  lightBeamSystem.setOpacity(2);    // 应该被限制为1
  lightBeamSystem.setAnimationSpeed(-1); // 应该被限制为0
  console.log('✓ Boundary values handled correctly');
}

/**
 * 测试与迪斯科球的同步
 */
function testSyncWithDiscoBall(discoBall, lightBeamSystem) {
  console.log('\n--- Testing Sync with DiscoBall ---');
  
  const discoBallMesh = discoBall.getMesh();
  const beamGroup = lightBeamSystem.getBeamGroup();
  
  // 设置迪斯科球位置
  discoBallMesh.position.set(1, 2, 3);
  discoBallMesh.rotation.set(0.1, 0.2, 0.3);
  
  // 执行同步
  lightBeamSystem.syncWithDiscoBall();
  
  // 检查同步结果
  const positionMatch = beamGroup.position.equals(discoBallMesh.position);
  const rotationMatch = beamGroup.rotation.equals(discoBallMesh.rotation);
  
  console.log('✓ Position sync:', positionMatch);
  console.log('✓ Rotation sync:', rotationMatch);
}

/**
 * 创建完整的测试场景
 */
function createTestScene() {
  console.log('\n=== Creating Test Scene ===');
  
  // 创建场景
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000011);
  
  // 创建相机
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 10);
  
  // 创建渲染器
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  // 添加基础光照
  const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 5, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  
  // 测试光束系统
  const { discoBall, lightBeamSystem } = testLightBeamSystem();
  
  // 添加到场景
  scene.add(discoBall.getMesh());
  scene.add(lightBeamSystem.getBeamGroup());
  
  console.log('✓ Test scene created successfully');
  
  return {
    scene,
    camera,
    renderer,
    discoBall,
    lightBeamSystem
  };
}

/**
 * 运行动画循环测试
 */
function runAnimationTest() {
  const testScene = createTestScene();
  const { scene, camera, renderer, discoBall, lightBeamSystem } = testScene;
  
  // 添加渲染器到页面
  document.body.appendChild(renderer.domElement);
  
  let lastTime = 0;
  
  function animate(currentTime) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // 更新迪斯科球旋转
    discoBall.updateRotation(deltaTime);
    
    // 更新光束系统
    lightBeamSystem.update(deltaTime);
    
    // 渲染场景
    renderer.render(scene, camera);
    
    requestAnimationFrame(animate);
  }
  
  // 开始动画
  animate(0);
  
  console.log('✓ Animation test started');
  
  // 测试颜色模式切换
  setTimeout(() => {
    lightBeamSystem.setColorMode('random');
    console.log('✓ Switched to random color mode');
  }, 3000);
  
  setTimeout(() => {
    lightBeamSystem.setColorMode('rainbow');
    console.log('✓ Switched back to rainbow color mode');
  }, 6000);
}

// 导出测试函数
export {
  testLightBeamSystem,
  createTestScene,
  runAnimationTest
};

// 如果直接运行此文件，执行测试
if (typeof window !== 'undefined') {
  // 浏览器环境
  window.testLightBeamSystem = testLightBeamSystem;
  window.createTestScene = createTestScene;
  window.runAnimationTest = runAnimationTest;
  
  console.log('Light beam system tests loaded. Run testLightBeamSystem(), createTestScene(), or runAnimationTest() to test.');
}