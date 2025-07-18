import { RenderEngine } from './RenderEngine.js';

/**
 * 主应用入口点
 * 初始化渲染引擎并启动应用
 */
class DiscoApp {
  constructor() {
    this.renderEngine = null;
    this.isInitialized = false;
  }

  /**
   * 初始化应用
   */
  async init() {
    console.log('Disco Ball Interactive - Starting...');
    
    try {
      // 检查WebGL支持
      if (!RenderEngine.checkWebGLSupport()) {
        this.showError('您的浏览器不支持WebGL，无法运行此应用。');
        return false;
      }

      // 获取应用容器
      const appContainer = document.getElementById('app');
      if (!appContainer) {
        this.showError('找不到应用容器元素。');
        return false;
      }

      // 初始化渲染引擎
      this.renderEngine = new RenderEngine(appContainer);
      const success = this.renderEngine.init();
      
      if (!success) {
        this.showError('渲染引擎初始化失败。');
        return false;
      }

      this.isInitialized = true;
      
      // 隐藏加载屏幕
      this.hideLoadingScreen();
      
      console.log('Disco Ball Interactive - Initialized successfully');
      return true;
      
    } catch (error) {
      console.error('Application initialization failed:', error);
      this.showError('应用初始化失败：' + error.message);
      return false;
    }
  }

  /**
   * 隐藏加载屏幕
   */
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
    }
  }

  /**
   * 显示错误信息
   */
  showError(message) {
    const loadingScreen = document.getElementById('loading');
    if (loadingScreen) {
      loadingScreen.innerHTML = `
        <div style="text-align: center; color: #ff6b6b;">
          <h3>错误</h3>
          <p>${message}</p>
          <p style="font-size: 14px; margin-top: 20px;">
            请尝试刷新页面或使用支持WebGL的现代浏览器。
          </p>
        </div>
      `;
    }
  }

  /**
   * 清理应用资源
   */
  dispose() {
    if (this.renderEngine) {
      this.renderEngine.dispose();
      this.renderEngine = null;
    }
    this.isInitialized = false;
  }
}

// 创建并启动应用
const app = new DiscoApp();

// 页面加载完成后初始化应用
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => app.dispose());

// 导出应用实例供调试使用
window.discoApp = app;