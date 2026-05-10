/**
 * 主逻辑模块
 * 初始化应用、绑定事件、协调各模块
 */

const App = {
  // 存储解析后的数据
  parsedData: [],
  
  // 当前选中的动作
  selectedExercise: '',
  
  // 当前时间范围
  currentTimeRange: 'week',
  
  // 用户信息
  userInfo: {
    name: '',
    gender: '',
    birthdate: '',
    height: '',
    weight: '',
    bodyFat: '',
    injuries: ''
  },

  /**
   * 初始化应用
   */
  init() {
    this.bindEvents();
    this.initUserInfo();
    Settings.initPanel();
    console.log('🏋️ 训记数据分析已启动');
  },

  /**
   * 绑定事件
   */
  bindEvents() {
    // 文件选择
    const loadFileBtn = document.getElementById('loadFileBtn');
    const fileInput = document.getElementById('fileInput');
    if (loadFileBtn && fileInput) {
      loadFileBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }

    // 生成建议按钮
    const generateAdviceBtn = document.getElementById('generateAdviceBtn');
    if (generateAdviceBtn) {
      generateAdviceBtn.addEventListener('click', () => this.generateAdvice());
    }

    // 设置按钮
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => Settings.openPanel());
    }

    // 关闭设置面板
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const settingsOverlay = document.getElementById('settingsOverlay');
    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener('click', () => Settings.closePanel());
    }
    if (settingsOverlay) {
      settingsOverlay.addEventListener('click', (e) => {
        if (e.target === settingsOverlay) {
          Settings.closePanel();
        }
      });
    }

    // 保存设置按钮
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    }

    // 测试连接按钮
    const testConnectionBtn = document.getElementById('testConnectionBtn');
    if (testConnectionBtn) {
      testConnectionBtn.addEventListener('click', () => this.testConnection());
    }

    // 动作选择器
    const exerciseSelect = document.getElementById('exerciseSelect');
    if (exerciseSelect) {
      exerciseSelect.addEventListener('change', (e) => this.handleExerciseSelect(e));
    }

    // 图表时间范围按钮
    const chartControlBtns = document.querySelectorAll('.chart-control-btn');
    chartControlBtns.forEach(btn => {
      btn.addEventListener('click', (e) => this.handleTimeRangeChange(e));
    });

    // 自定义日期范围应用按钮
    const applyCustomRange = document.getElementById('applyCustomRange');
    if (applyCustomRange) {
      applyCustomRange.addEventListener('click', () => this.applyCustomDateRange());
    }

    // 用户信息编辑按钮
    const editUserInfoBtn = document.getElementById('editUserInfoBtn');
    if (editUserInfoBtn) {
      editUserInfoBtn.addEventListener('click', () => this.showUserInfoForm());
    }

    // 用户信息保存按钮
    const saveUserInfoBtn = document.getElementById('saveUserInfoBtn');
    if (saveUserInfoBtn) {
      saveUserInfoBtn.addEventListener('click', () => this.saveUserInfo());
    }

    // 用户信息取消按钮
    const cancelUserInfoBtn = document.getElementById('cancelUserInfoBtn');
    if (cancelUserInfoBtn) {
      cancelUserInfoBtn.addEventListener('click', () => this.hideUserInfoForm());
    }

    // 身高体重变化时自动计算BMI
    const inputHeight = document.getElementById('inputHeight');
    const inputWeight = document.getElementById('inputWeight');
    if (inputHeight) {
      inputHeight.addEventListener('input', () => this.updateBMIPreview());
    }
    if (inputWeight) {
      inputWeight.addEventListener('input', () => this.updateBMIPreview());
    }
  },

  /**
   * 处理文件选择
   */
  async handleFileSelect(event) {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    this.parsedData = [];
    
    for (const file of files) {
      try {
        const content = await this.readFile(file);
        const json = JSON.parse(content);
        
        if (json.data && Array.isArray(json.data)) {
          const records = DataParser.parseAllRecords(json.data);
          this.parsedData.push(...records);
        }
      } catch (error) {
        console.error(`读取文件 ${file.name} 失败:`, error);
      }
    }

    if (this.parsedData.length > 0) {
      this.showToast(`成功加载 ${this.parsedData.length} 条训练记录`, 'success');
      this.initMonthYearSelectors();
      this.updateExerciseSelector();
      this.analyzeData();
    } else {
      this.showToast('未找到有效的训练数据', 'error');
    }
  },

  /**
   * 读取文件内容
   */
  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  },

  /**
   * 初始化用户信息
   */
  initUserInfo() {
    // 从localStorage加载用户信息
    const saved = localStorage.getItem('xunji-user-info');
    if (saved) {
      try {
        this.userInfo = JSON.parse(saved);
      } catch (e) {
        console.error('加载用户信息失败:', e);
      }
    }
    this.displayUserInfo();
  },

  /**
   * 显示用户信息
   */
  displayUserInfo() {
    const { name, gender, birthdate, height, weight, bodyFat, injuries } = this.userInfo;
    
    document.getElementById('displayName').textContent = name || '未设置';
    document.getElementById('displayGender').textContent = gender || '未设置';
    document.getElementById('displayBirthdate').textContent = birthdate || '未设置';
    document.getElementById('displayHeight').textContent = height ? `${height} cm` : '未设置';
    document.getElementById('displayWeight').textContent = weight ? `${weight} kg` : '未设置';
    document.getElementById('displayBodyFat').textContent = bodyFat ? `${bodyFat}%` : '未设置';
    document.getElementById('displayInjuries').textContent = injuries || '无';
    
    // 计算BMI
    const bmiDisplay = document.getElementById('displayBMI');
    if (height && weight) {
      const heightM = height / 100;
      const bmi = (weight / (heightM * heightM)).toFixed(1);
      let bmiClass = '';
      let bmiStatus = '';
      
      if (bmi < 18.5) {
        bmiStatus = '偏瘦';
        bmiClass = 'bmi-normal';
      } else if (bmi < 24) {
        bmiStatus = '正常';
        bmiClass = 'bmi-normal';
      } else if (bmi < 28) {
        bmiStatus = '偏胖';
        bmiClass = 'bmi-overweight';
      } else {
        bmiStatus = '肥胖';
        bmiClass = 'bmi-obese';
      }
      
      bmiDisplay.textContent = `${bmi} (${bmiStatus})`;
      bmiDisplay.className = bmiClass;
    } else {
      bmiDisplay.textContent = '未设置';
      bmiDisplay.className = '';
    }
  },

  /**
   * 显示用户信息编辑表单
   */
  showUserInfoForm() {
    const { name, gender, birthdate, height, weight, bodyFat, injuries } = this.userInfo;
    
    document.getElementById('inputName').value = name || '';
    document.getElementById('inputGender').value = gender || '';
    document.getElementById('inputBirthdate').value = birthdate || '';
    document.getElementById('inputHeight').value = height || '';
    document.getElementById('inputWeight').value = weight || '';
    document.getElementById('inputBodyFat').value = bodyFat || '';
    document.getElementById('inputInjuries').value = injuries || '';
    
    document.getElementById('userInfoDisplay').style.display = 'none';
    document.getElementById('userInfoForm').style.display = 'block';
    document.getElementById('editUserInfoBtn').style.display = 'none';
  },

  /**
   * 隐藏用户信息编辑表单
   */
  hideUserInfoForm() {
    document.getElementById('userInfoDisplay').style.display = 'grid';
    document.getElementById('userInfoForm').style.display = 'none';
    document.getElementById('editUserInfoBtn').style.display = 'inline-block';
  },

  /**
   * 保存用户信息
   */
  saveUserInfo() {
    this.userInfo = {
      name: document.getElementById('inputName').value.trim(),
      gender: document.getElementById('inputGender').value,
      birthdate: document.getElementById('inputBirthdate').value,
      height: document.getElementById('inputHeight').value,
      weight: document.getElementById('inputWeight').value,
      bodyFat: document.getElementById('inputBodyFat').value,
      injuries: document.getElementById('inputInjuries').value.trim()
    };
    
    // 保存到localStorage
    localStorage.setItem('xunji-user-info', JSON.stringify(this.userInfo));
    
    this.displayUserInfo();
    this.hideUserInfoForm();
    this.showToast('用户信息已保存', 'success');
  },

  /**
   * 更新BMI预览
   */
  updateBMIPreview() {
    const height = document.getElementById('inputHeight').value;
    const weight = document.getElementById('inputWeight').value;
    
    if (height && weight) {
      const heightM = height / 100;
      const bmi = (weight / (heightM * heightM)).toFixed(1);
      let bmiStatus = '';
      
      if (bmi < 18.5) {
        bmiStatus = '偏瘦';
      } else if (bmi < 24) {
        bmiStatus = '正常';
      } else if (bmi < 28) {
        bmiStatus = '偏胖';
      } else {
        bmiStatus = '肥胖';
      }
      
      // 可以在这里添加实时BMI预览
    }
  },

  /**
   * 初始化月/年选择器
   */
  initMonthYearSelectors() {
    // 获取数据中的所有月份和年份
    const months = new Set();
    const years = new Set();
    
    this.parsedData.forEach(record => {
      const date = new Date(record.date);
      const year = date.getFullYear();
      const month = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(month);
      years.add(year.toString());
    });

    // 初始化训练量趋势的月份选择器
    const monthSelect = document.getElementById('monthSelect');
    if (monthSelect) {
      monthSelect.innerHTML = '<option value="">选择月份</option>';
      Array.from(months).sort().reverse().forEach(month => {
        const [year, m] = month.split('-');
        monthSelect.innerHTML += `<option value="${month}">${year}年${parseInt(m)}月</option>`;
      });
      monthSelect.addEventListener('change', (e) => this.handleMonthSelect(e));
    }

    // 初始化训练量趋势的年份选择器
    const yearSelect = document.getElementById('yearSelect');
    if (yearSelect) {
      yearSelect.innerHTML = '<option value="">选择年份</option>';
      Array.from(years).sort().reverse().forEach(year => {
        yearSelect.innerHTML += `<option value="${year}">${year}年</option>`;
      });
      yearSelect.addEventListener('change', (e) => this.handleYearSelect(e));
    }

    // 初始化动作重量趋势的月份选择器
    const exerciseMonthSelect = document.getElementById('exerciseMonthSelect');
    if (exerciseMonthSelect) {
      exerciseMonthSelect.innerHTML = '<option value="">选择月份</option>';
      Array.from(months).sort().reverse().forEach(month => {
        const [year, m] = month.split('-');
        exerciseMonthSelect.innerHTML += `<option value="${month}">${year}年${parseInt(m)}月</option>`;
      });
      exerciseMonthSelect.addEventListener('change', (e) => this.handleExerciseMonthSelect(e));
    }

    // 初始化动作重量趋势的年份选择器
    const exerciseYearSelect = document.getElementById('exerciseYearSelect');
    if (exerciseYearSelect) {
      exerciseYearSelect.innerHTML = '<option value="">选择年份</option>';
      Array.from(years).sort().reverse().forEach(year => {
        exerciseYearSelect.innerHTML += `<option value="${year}">${year}年</option>`;
      });
      exerciseYearSelect.addEventListener('change', (e) => this.handleExerciseYearSelect(e));
    }

    // 动作重量趋势自定义日期范围应用按钮
    const applyExerciseCustomRange = document.getElementById('applyExerciseCustomRange');
    if (applyExerciseCustomRange) {
      applyExerciseCustomRange.addEventListener('click', () => this.applyExerciseCustomDateRange());
    }
  },

  /**
   * 处理月份选择（训练量趋势）
   */
  handleMonthSelect(event) {
    const month = event.target.value;
    if (!month) return;

    // 清除其他选择器
    const yearSelect = document.getElementById('yearSelect');
    if (yearSelect) yearSelect.value = '';

    // 设置时间范围为月
    this.currentTimeRange = 'month';
    this.selectedMonth = month;
    this.selectedYear = null;

    // 清除自定义日期范围
    const customDateRange = document.getElementById('customDateRange');
    if (customDateRange) customDateRange.style.display = 'none';

    this.refreshCharts();
  },

  /**
   * 处理年份选择（训练量趋势）
   */
  handleYearSelect(event) {
    const year = event.target.value;
    if (!year) return;

    // 清除其他选择器
    const monthSelect = document.getElementById('monthSelect');
    if (monthSelect) monthSelect.value = '';

    // 设置时间范围为年
    this.currentTimeRange = 'year';
    this.selectedYear = year;
    this.selectedMonth = null;

    // 清除自定义日期范围
    const customDateRange = document.getElementById('customDateRange');
    if (customDateRange) customDateRange.style.display = 'none';

    this.refreshCharts();
  },

  /**
   * 生成AI建议
   */
  handleExerciseYearSelect(event) {
    const year = event.target.value;
    if (!year) return;

    this.selectedExerciseYear = year;
    this.selectedExerciseCustomRange = null;

    // 隐藏自定义日期范围
    const exerciseCustomDateRange = document.getElementById('exerciseCustomDateRange');
    if (exerciseCustomDateRange) exerciseCustomDateRange.style.display = 'none';

    this.updateExerciseWeightChart(this.parsedData);
  },

  /**
   * 应用自定义日期范围（动作重量趋势）
   */
  applyExerciseCustomDateRange() {
    const startDate = document.getElementById('exerciseStartDate').value;
    const endDate = document.getElementById('exerciseEndDate').value;

    if (!startDate || !endDate) {
      this.showToast('请选择开始和结束日期', 'error');
      return;
    }

    if (startDate > endDate) {
      this.showToast('开始日期不能晚于结束日期', 'error');
      return;
    }

    this.selectedExerciseCustomRange = { startDate, endDate };
    this.selectedExerciseYear = null;

    // 清除年份选择器
    const exerciseYearSelect = document.getElementById('exerciseYearSelect');
    if (exerciseYearSelect) exerciseYearSelect.value = '';

    this.updateExerciseWeightChart(this.parsedData);
  },

  /**
   * 分析数据
   */
  analyzeData() {
    if (this.parsedData.length === 0) {
      return;
    }

    // 按日期排序
    const sortedData = [...this.parsedData].sort((a, b) => a.date.localeCompare(b.date));

    // 渲染图表
    this.renderAllCharts(sortedData);
  },

  /**
   * 渲染所有图表
   * 根据当前选择的时间范围筛选数据并渲染
   */
  renderAllCharts(allData) {
    // 根据时间范围筛选数据
    let rangeData;
    const options = {};
    
    if (this.currentTimeRange === 'custom' && this.customDateRange) {
      // 自定义日期范围
      rangeData = DataParser.filterByDateRange(
        allData, 
        this.customDateRange.startDate, 
        this.customDateRange.endDate
      );
      options.customDateRange = this.customDateRange;
    } else if (this.currentTimeRange === 'month' && this.selectedMonth) {
      // 选择的具体月份
      rangeData = DataParser.filterByMonth(allData, this.selectedMonth);
      options.selectedMonth = this.selectedMonth;
    } else if (this.currentTimeRange === 'year' && this.selectedYear) {
      // 选择的具体年份
      rangeData = DataParser.filterByYear(allData, this.selectedYear);
      options.selectedYear = this.selectedYear;
    } else {
      rangeData = DataParser.filterByTimeRange(allData, this.currentTimeRange);
    }
    
    // 训练量趋势图
    const trendCtx = document.getElementById('trainingTrendChart');
    if (trendCtx) {
      // 先计算chartData以获取fullDates
      const chartData = DataParser.aggregateVolumeByRange(rangeData, this.currentTimeRange, options);
      this.trainingTrendFullDates = chartData.fullDates || [];
      Charts.renderTrainingTrendChart(trendCtx.getContext('2d'), rangeData, this.currentTimeRange, options);
    }

    // 部位分布饼图（显示容量）
    const bodyPartVolume = DataParser.getBodyPartVolume(rangeData);
    const pieCtx = document.getElementById('bodyPartPieChart');
    if (pieCtx) {
      Charts.renderBodyPartPieChart(pieCtx.getContext('2d'), bodyPartVolume);
    }

    // 卡路里消耗图
    const calorieData = DataParser.getCalorieData(rangeData);
    const calorieCtx = document.getElementById('calorieChart');
    if (calorieCtx) {
      Charts.renderCalorieChart(calorieCtx.getContext('2d'), calorieData);
    }

    // 如果有选中动作，更新重量趋势图
    if (this.selectedExercise) {
      this.updateExerciseWeightChart(rangeData);
    }
  },

  /**
   * 更新动作选择器（按部位分类）
   */
  updateExerciseSelector() {
    const select = document.getElementById('exerciseSelect');
    if (!select) return;

    const exercisesByPart = DataParser.extractExercisesByBodyPart(this.parsedData);
    
    let options = '<option value="">-- 请选择动作 --</option>';
    
    // 按部位分组显示
    Object.entries(exercisesByPart).forEach(([part, exercises]) => {
      if (exercises.length > 0) {
        options += `<optgroup label="${part}">`;
        exercises.forEach(name => {
          options += `<option value="${name}">${name}</option>`;
        });
        options += '</optgroup>';
      }
    });
    
    select.innerHTML = options;
  },

  /**
   * 处理动作选择
   */
  handleExerciseSelect(event) {
    this.selectedExercise = event.target.value;
    
    if (this.selectedExercise && this.parsedData.length > 0) {
      this.updateExerciseWeightChart(this.parsedData);
    }
  },

  /**
   * 更新动作重量趋势图
   */
  updateExerciseWeightChart(data) {
    if (!this.selectedExercise) return;

    // 构建选项参数
    const options = {};
    if (this.selectedExerciseCustomRange) {
      options.customDateRange = this.selectedExerciseCustomRange;
    } else if (this.selectedExerciseYear) {
      options.selectedYear = this.selectedExerciseYear;
    }

    const trendData = DataParser.getExerciseWeightTrend(data, this.selectedExercise, options);
    const ctx = document.getElementById('exerciseWeightChart');
    
    if (ctx) {
      Charts.renderExerciseWeightChart(ctx.getContext('2d'), trendData);
    }
  },

  /**
   * 处理时间范围变化
   */
  handleTimeRangeChange(event) {
    // 更新按钮状态
    const btn = event.target;
    const container = btn.parentElement;
    container.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // 保存当前选中的时间范围
    const range = btn.dataset.range;

    // 处理动作重量趋势的自定义按钮
    if (range === 'exerciseCustom') {
      const exerciseCustomDateRange = document.getElementById('exerciseCustomDateRange');
      if (exerciseCustomDateRange) {
        exerciseCustomDateRange.style.display = 'flex';
      }
      return;
    }

    this.currentTimeRange = range;

    // 显示/隐藏自定义日期范围
    const customDateRange = document.getElementById('customDateRange');
    if (customDateRange) {
      customDateRange.style.display = this.currentTimeRange === 'custom' ? 'flex' : 'none';
    }

    // 如果是自定义范围，不自动渲染，等待用户点击应用按钮
    if (this.currentTimeRange === 'custom') {
      return;
    }

    // 重新渲染所有图表
    this.refreshCharts();
  },

  /**
   * 应用自定义日期范围
   */
  applyCustomDateRange() {
    const startDate = document.getElementById('trendStartDate').value;
    const endDate = document.getElementById('trendEndDate').value;

    if (!startDate || !endDate) {
      this.showToast('请选择开始和结束日期', 'error');
      return;
    }

    if (startDate > endDate) {
      this.showToast('开始日期不能晚于结束日期', 'error');
      return;
    }

    this.customDateRange = { startDate, endDate };
    this.currentTimeRange = 'custom';
    this.refreshCharts();
  },

  /**
   * 刷新图表
   */
  refreshCharts() {
    if (this.parsedData.length > 0) {
      const sortedData = [...this.parsedData].sort((a, b) => a.date.localeCompare(b.date));
      this.renderAllCharts(sortedData);
    }
  },

  /**
   * 处理动作时间范围变化
   */
  handleExerciseTimeRangeChange(event) {
    // 更新按钮状态
    const btn = event.target;
    const container = btn.parentElement;
    container.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // 更新图表
    if (this.selectedExercise && this.parsedData.length > 0) {
      let data = this.parsedData;
      const range = btn.dataset.range;
      
      if (range === 'month' || range === 'year') {
        data = DataParser.filterByTimeRange(data, range);
      }
      
      this.updateExerciseWeightChart(data);
    }
  },

  /**
   * 生成AI建议
   */
  async generateAdvice() {
    if (this.parsedData.length === 0) {
      this.showToast('请先加载训练数据', 'error');
      return;
    }

    const container = document.getElementById('aiAdviceContainer');
    if (!container) return;

    // 获取选中的提供商
    const providerSelect = document.getElementById('aiProviderSelect');
    const selectedProviderId = providerSelect?.value;
    
    if (selectedProviderId) {
      Settings.setActiveProvider(selectedProviderId);
    }

    container.innerHTML = '<div class="loading"></div>';

    const advice = await AIAdvisor.generateAdvice(this.parsedData);

    container.innerHTML = Object.entries(advice).map(([part, content]) => {
      const partClass = this.getPartClass(part);
      return `
        <div class="advice-card ${partClass}">
          <div class="advice-title">${part}</div>
          <div class="advice-content">${content}</div>
        </div>
      `;
    }).join('');
  },

  /**
   * 获取部位对应的CSS类
   */
  getPartClass(part) {
    const classMap = {
      '胸': 'chest',
      '背': 'back',
      '肩': 'shoulder',
      '腹': 'abs',
      '二头': 'bicep',
      '三头': 'tricep',
      '腿': 'leg',
      '塑形建议': 'shaping'
    };
    return classMap[part] || '';
  },

  /**
   * 保存设置
   */
  saveSettings() {
    const success = Settings.saveFromPanel();
    if (success) {
      this.showToast('设置已保存', 'success');
      Settings.closePanel();
    } else {
      this.showToast('保存设置失败', 'error');
    }
  },

  /**
   * 测试AI连接
   */
  async testConnection() {
    const settings = Settings.readFromPanel();
    const result = await AIAdvisor.testConnection(settings);
    
    if (result.success) {
      this.showToast('连接成功！', 'success');
    } else {
      this.showToast(`连接失败: ${result.message}`, 'error');
    }
  },

  /**
   * 显示提示消息
   */
  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// 导出模块
if (typeof window !== 'undefined') {
  window.App = App;
}
