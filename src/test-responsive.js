/**
 * Test script to verify responsive rendering system functionality
 */
import { RenderEngine } from './RenderEngine.js';

// Create a test container
const testContainer = document.createElement('div');
testContainer.style.width = '800px';
testContainer.style.height = '600px';
testContainer.style.position = 'absolute';
testContainer.style.top = '0';
testContainer.style.left = '0';
document.body.appendChild(testContainer);

// Initialize render engine
const renderEngine = new RenderEngine(testContainer);

console.log('Testing Responsive Rendering System...');

// Test 1: Initial device detection
console.log('1. Device Detection Test:');
console.log('Device Info:', renderEngine.deviceInfo);
console.log('Responsive Config:', renderEngine.responsiveConfig);

// Test 2: Initialize render engine
console.log('\n2. Initialization Test:');
const initSuccess = renderEngine.init();
console.log('Initialization successful:', initSuccess);

// Test 3: Simulate window resize events
console.log('\n3. Resize Handling Test:');

// Simulate mobile size
console.log('Simulating mobile size (400x600)...');
testContainer.style.width = '400px';
testContainer.style.height = '600px';
Object.defineProperty(window, 'innerWidth', { value: 400, configurable: true });
Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true });
renderEngine.onWindowResize();
console.log('Mobile config:', renderEngine.responsiveConfig);

// Simulate tablet size
console.log('Simulating tablet size (768x1024)...');
testContainer.style.width = '768px';
testContainer.style.height = '1024px';
Object.defineProperty(window, 'innerWidth', { value: 768, configurable: true });
Object.defineProperty(window, 'innerHeight', { value: 1024, configurable: true });
renderEngine.onWindowResize();
console.log('Tablet config:', renderEngine.responsiveConfig);

// Simulate desktop size
console.log('Simulating desktop size (1920x1080)...');
testContainer.style.width = '1920px';
testContainer.style.height = '1080px';
Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true });
Object.defineProperty(window, 'innerHeight', { value: 1080, configurable: true });
renderEngine.onWindowResize();
console.log('Desktop config:', renderEngine.responsiveConfig);

// Test 4: Performance level detection
console.log('\n4. Performance Level Test:');
console.log('Current performance level:', renderEngine.deviceInfo.performanceLevel);
console.log('Frame rate setting:', renderEngine.frameRate);
console.log('Pixel ratio setting:', renderEngine.responsiveConfig.pixelRatio);

// Test 5: WebGL support check
console.log('\n5. WebGL Support Test:');
console.log('WebGL supported:', RenderEngine.checkWebGLSupport());

console.log('\nResponsive Rendering System Test Complete!');

// Clean up
setTimeout(() => {
  renderEngine.dispose();
  document.body.removeChild(testContainer);
  console.log('Test cleanup completed.');
}, 2000);