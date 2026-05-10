/**
 * 设置管理模块
 * 管理AI服务配置和用户设置
 */

const Settings = {
  // localStorage键名
  storageKey: 'xunji-ai-providers',
  activeProviderKey: 'xunji-active-provider',
  activeModelKey: 'xunji-active-model',
  xunjiApiKeyKey: 'xunji-api-key',

  // 默认提供商列表
  defaultProviders: [
    {
      id: 'deepseek',
      name: 'DeepSeek',
      apiBaseUrl: 'https://api.deepseek.com/v1',
      apiKey: '',
      models: ['deepseek-chat', 'deepseek-reasoner']
    },
    {
      id: 'openai',
      name: 'OpenAI',
      apiBaseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4o']
    }
  ],

  /**
   * 加载所有提供商
   */
  loadProviders() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const providers = JSON.parse(saved);
        // 兼容旧格式：将 model 字段转换为 models 数组
        return providers.map(p => {
          if (p.model && !p.models) {
            p.models = [p.model];
            delete p.model;
          }
          // 兼容旧格式：将 apiUrl 转换为 apiBaseUrl
          if (p.apiUrl && !p.apiBaseUrl) {
            p.apiBaseUrl = p.apiUrl.replace('/chat/completions', '');
            delete p.apiUrl;
          }
          return p;
        });
      }
    } catch (error) {
      console.error('加载提供商失败:', error);
    }
    return [...this.defaultProviders];
  },

  /**
   * 保存提供商列表
   */
  saveProviders(providers) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(providers));
      return true;
    } catch (error) {
      console.error('保存提供商失败:', error);
      return false;
    }
  },

  /**
   * 获取当前选中的提供商
   */
  getActiveProvider() {
    const providers = this.loadProviders();
    const activeId = localStorage.getItem(this.activeProviderKey);
    
    if (activeId) {
      const found = providers.find(p => p.id === activeId);
      if (found) return found;
    }
    
    return providers[0] || null;
  },

  /**
   * 设置当前选中的提供商
   */
  setActiveProvider(providerId) {
    localStorage.setItem(this.activeProviderKey, providerId);
  },

  /**
   * 获取当前选中的模型
   */
  getActiveModel() {
    const provider = this.getActiveProvider();
    if (!provider || !provider.models || provider.models.length === 0) return null;
    
    const activeModel = localStorage.getItem(this.activeModelKey);
    
    // 检查当前选中的模型是否在提供商的模型列表中
    if (activeModel && provider.models.includes(activeModel)) {
      return activeModel;
    }
    
    return provider.models[0];
  },

  /**
   * 设置当前选中的模型
   */
  setActiveModel(model) {
    localStorage.setItem(this.activeModelKey, model);
  },

  /**
   * 添加提供商
   */
  addProvider(provider) {
    const providers = this.loadProviders();
    const newProvider = {
      ...provider,
      id: 'provider_' + Date.now()
    };
    providers.push(newProvider);
    this.saveProviders(providers);
    return newProvider;
  },

  /**
   * 更新提供商
   */
  updateProvider(id, updates) {
    const providers = this.loadProviders();
    const index = providers.findIndex(p => p.id === id);
    if (index !== -1) {
      providers[index] = { ...providers[index], ...updates };
      this.saveProviders(providers);
      return true;
    }
    return false;
  },

  /**
   * 删除提供商
   */
  deleteProvider(id) {
    let providers = this.loadProviders();
    providers = providers.filter(p => p.id !== id);
    this.saveProviders(providers);
    
    // 如果删除的是当前选中的，切换到第一个
    const activeId = localStorage.getItem(this.activeProviderKey);
    if (activeId === id) {
      localStorage.removeItem(this.activeProviderKey);
      localStorage.removeItem(this.activeModelKey);
    }
  },

  /**
   * 初始化设置面板
   */
  initPanel() {
    this.loadXunjiApiKey();
    this.renderProvidersList();
    this.initEventListeners();
  },

  /**
   * 加载训记 API Key
   */
  loadXunjiApiKey() {
    const saved = localStorage.getItem(this.xunjiApiKeyKey);
    const input = document.getElementById('xunjiApiKeyInput');
    if (input && saved) {
      input.value = saved;
    }
  },

  /**
   * 保存训记 API Key
   */
  saveXunjiApiKey() {
    const input = document.getElementById('xunjiApiKeyInput');
    if (!input) return;

    const apiKey = input.value.trim();
    if (apiKey) {
      localStorage.setItem(this.xunjiApiKeyKey, apiKey);
      App.showToast('训记 API Key 已保存', 'success');
    } else {
      localStorage.removeItem(this.xunjiApiKeyKey);
      App.showToast('训记 API Key 已清除', 'success');
    }
  },

  /**
   * 获取训记 API Key
   */
  getXunjiApiKey(): string {
    return localStorage.getItem(this.xunjiApiKeyKey) || '';
  },

  /**
   * 初始化事件监听
   */
  initEventListeners() {
    // 训记 API Key 保存按钮
    const saveXunjiApiKeyBtn = document.getElementById('saveXunjiApiKeyBtn');
    if (saveXunjiApiKeyBtn) {
      saveXunjiApiKeyBtn.addEventListener('click', () => this.saveXunjiApiKey());
    }

    // 添加服务商按钮
    const addBtn = document.getElementById('addProviderBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.showAddForm());
    }

    // 保存按钮
    const saveBtn = document.getElementById('saveProviderBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveProviderFromForm());
    }

    // 取消按钮
    const cancelBtn = document.getElementById('cancelProviderBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hideForm());
    }

    // 测试连接按钮
    const testBtn = document.getElementById('testProviderBtn');
    if (testBtn) {
      testBtn.addEventListener('click', () => this.testProviderConnection());
    }

    // 提供商选择器变化时更新模型选择器
    const providerSelect = document.getElementById('aiProviderSelect');
    if (providerSelect) {
      providerSelect.addEventListener('change', (e) => {
        this.setActiveProvider(e.target.value);
        this.updateModelSelector();
      });
    }

    // 模型选择器变化时保存
    const modelSelect = document.getElementById('aiModelSelect');
    if (modelSelect) {
      modelSelect.addEventListener('change', (e) => {
        this.setActiveModel(e.target.value);
      });
    }
  },

  /**
   * 渲染提供商列表
   */
  renderProvidersList() {
    const container = document.getElementById('providersList');
    if (!container) return;

    const providers = this.loadProviders();
    const activeProvider = this.getActiveProvider();

    container.innerHTML = providers.map(provider => `
      <div class="provider-item ${provider.id === activeProvider?.id ? 'active' : ''}" data-id="${provider.id}">
        <div class="provider-info">
          <div class="provider-name">${provider.name}</div>
          <div class="provider-url">${provider.apiBaseUrl}/chat/completions</div>
          <div class="provider-models">${(provider.models || []).join(', ')}</div>
        </div>
        <div class="provider-actions">
          <button class="btn btn-sm btn-primary" onclick="Settings.selectProvider('${provider.id}')">
            ${provider.id === activeProvider?.id ? '✓ 使用中' : '使用'}
          </button>
          <button class="btn btn-sm btn-secondary" onclick="Settings.editProvider('${provider.id}')">编辑</button>
          <button class="btn btn-sm btn-danger" onclick="Settings.confirmDelete('${provider.id}')">删除</button>
        </div>
      </div>
    `).join('');

    // 更新AI建议区域的提供商和模型选择器
    this.updateProviderSelector();
    this.updateModelSelector();
  },

  /**
   * 更新提供商选择器
   */
  updateProviderSelector() {
    const select = document.getElementById('aiProviderSelect');
    if (!select) return;

    const providers = this.loadProviders();
    const activeProvider = this.getActiveProvider();

    select.innerHTML = providers.map(p => 
      `<option value="${p.id}" ${p.id === activeProvider?.id ? 'selected' : ''}>${p.name}</option>`
    ).join('');
  },

  /**
   * 更新模型选择器
   */
  updateModelSelector() {
    const select = document.getElementById('aiModelSelect');
    if (!select) return;

    const provider = this.getActiveProvider();
    if (!provider || !provider.models || provider.models.length === 0) {
      select.innerHTML = '<option value="">无可用模型</option>';
      return;
    }

    const activeModel = this.getActiveModel();

    select.innerHTML = provider.models.map(m => 
      `<option value="${m}" ${m === activeModel ? 'selected' : ''}>${m}</option>`
    ).join('');
  },

  /**
   * 选择提供商
   */
  selectProvider(id) {
    this.setActiveProvider(id);
    this.renderProvidersList();
  },

  /**
   * 显示添加表单
   */
  showAddForm() {
    const section = document.getElementById('providerFormSection');
    const title = document.getElementById('providerFormTitle');
    
    if (section) section.style.display = 'block';
    if (title) title.textContent = '添加服务商';
    
    // 清空表单
    this.clearForm();
    
    // 隐藏编辑状态
    this.editingProviderId = null;
  },

  /**
   * 隐藏表单
   */
  hideForm() {
    const section = document.getElementById('providerFormSection');
    if (section) section.style.display = 'none';
    this.editingProviderId = null;
  },

  /**
   * 清空表单
   */
  clearForm() {
    const nameInput = document.getElementById('providerNameInput');
    const baseUrlInput = document.getElementById('apiBaseUrlInput');
    const keyInput = document.getElementById('apiKeyInput');
    const modelInput = document.getElementById('modelInput');
    
    if (nameInput) nameInput.value = '';
    if (baseUrlInput) baseUrlInput.value = '';
    if (keyInput) keyInput.value = '';
    if (modelInput) modelInput.value = '';
  },

  /**
   * 编辑提供商
   */
  editProvider(id) {
    const providers = this.loadProviders();
    const provider = providers.find(p => p.id === id);
    if (!provider) return;

    this.editingProviderId = id;

    const section = document.getElementById('providerFormSection');
    const title = document.getElementById('providerFormTitle');
    
    if (section) section.style.display = 'block';
    if (title) title.textContent = '编辑服务商';

    // 填充表单
    const nameInput = document.getElementById('providerNameInput');
    const baseUrlInput = document.getElementById('apiBaseUrlInput');
    const keyInput = document.getElementById('apiKeyInput');
    const modelInput = document.getElementById('modelInput');
    
    if (nameInput) nameInput.value = provider.name;
    if (baseUrlInput) baseUrlInput.value = provider.apiBaseUrl;
    if (keyInput) keyInput.value = provider.apiKey;
    if (modelInput) modelInput.value = (provider.models || []).join(', ');
  },

  /**
   * 从表单保存提供商
   */
  saveProviderFromForm() {
    const nameInput = document.getElementById('providerNameInput');
    const baseUrlInput = document.getElementById('apiBaseUrlInput');
    const keyInput = document.getElementById('apiKeyInput');
    const modelInput = document.getElementById('modelInput');

    const name = nameInput?.value.trim();
    const apiBaseUrl = baseUrlInput?.value.trim().replace(/\/+$/, ''); // 移除末尾斜杠
    const apiKey = keyInput?.value.trim();
    const modelsStr = modelInput?.value.trim();

    if (!name || !apiBaseUrl || !apiKey || !modelsStr) {
      App.showToast('请填写所有字段', 'error');
      return;
    }

    // 解析模型列表（逗号分隔）
    const models = modelsStr.split(',').map(m => m.trim()).filter(m => m);
    if (models.length === 0) {
      App.showToast('请至少添加一个模型', 'error');
      return;
    }

    if (this.editingProviderId) {
      // 更新
      this.updateProvider(this.editingProviderId, { name, apiBaseUrl, apiKey, models });
      App.showToast('服务商已更新', 'success');
    } else {
      // 添加
      this.addProvider({ name, apiBaseUrl, apiKey, models });
      App.showToast('服务商已添加', 'success');
    }

    this.hideForm();
    this.renderProvidersList();
  },

  /**
   * 确认删除
   */
  confirmDelete(id) {
    const providers = this.loadProviders();
    const provider = providers.find(p => p.id === id);
    if (!provider) return;

    if (confirm(`确定要删除 "${provider.name}" 吗？`)) {
      this.deleteProvider(id);
      this.renderProvidersList();
      App.showToast('服务商已删除', 'success');
    }
  },

  /**
   * 测试提供商连接
   */
  async testProviderConnection() {
    const baseUrlInput = document.getElementById('apiBaseUrlInput');
    const keyInput = document.getElementById('apiKeyInput');
    const modelInput = document.getElementById('modelInput');

    const apiBaseUrl = baseUrlInput?.value.trim().replace(/\/+$/, '');
    const apiKey = keyInput?.value.trim();
    const modelsStr = modelInput?.value.trim();

    if (!apiBaseUrl || !apiKey || !modelsStr) {
      App.showToast('请填写所有字段', 'error');
      return;
    }

    const models = modelsStr.split(',').map(m => m.trim()).filter(m => m);
    const apiUrl = apiBaseUrl + '/chat/completions';
    const model = models[0];

    const result = await AIAdvisor.testConnection({ apiUrl, apiKey, model });
    
    if (result.success) {
      App.showToast('连接成功！', 'success');
    } else {
      App.showToast(`连接失败: ${result.message}`, 'error');
    }
  },

  /**
   * 获取当前配置（用于AI调用）
   */
  getCurrentConfig() {
    const provider = this.getActiveProvider();
    const model = this.getActiveModel();
    
    if (!provider || !model) return null;
    
    return {
      apiUrl: provider.apiBaseUrl + '/chat/completions',
      apiKey: provider.apiKey,
      model: model
    };
  },

  /**
   * 打开设置面板
   */
  openPanel() {
    const overlay = document.getElementById('settingsOverlay');
    if (overlay) {
      overlay.classList.add('active');
    }
    this.renderProvidersList();
  },

  /**
   * 关闭设置面板
   */
  closePanel() {
    const overlay = document.getElementById('settingsOverlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }
};

// 导出模块
if (typeof window !== 'undefined') {
  window.Settings = Settings;
}
