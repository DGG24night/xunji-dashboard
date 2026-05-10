/**
 * 数据解析模块
 * 解析训记训练数据字符串，提取结构化信息
 */

const DataParser = {
  // 动作分类映射表
  exerciseBodyPartMap: {
    // 胸部动作
    '卧推': '胸', '上斜卧推': '胸', '下斜卧推': '胸', '哑铃卧推': '胸', '上斜哑铃卧推': '胸',
    '龙门架夹胸': '胸', '绳索夹胸': '胸', '蝴蝶机夹胸': '胸', '飞鸟': '胸', '哑铃飞鸟': '胸',
    '俯卧撑': '胸', '双杠臂屈伸': '胸',
    
    // 背部动作
    '引体向上': '背', '高位下拉': '背', '宽距高位下拉': '背', '窄距高位下拉': '背',
    '杠铃划船': '背', '哑铃划船': '背', '坐姿划船': '背', '坐姿划船': '背',
    '分动式高位划船': '背', 'T杠划船': '背', '硬拉': '背', '山羊挺身': '背',
    
    // 腿部动作
    '深蹲': '腿', '杠铃深蹲': '腿', '前蹲': '腿', '哈克深蹲': '腿',
    '腿举': '腿', '腿屈伸': '腿', '腿弯举': '腿', '坐姿腿屈伸': '腿',
    '坐姿腿弯举': '腿', '罗马尼亚硬拉': '腿', '箭步蹲': '腿', '保加利亚深蹲': '腿',
    '坐姿髋内收': '腿', '坐姿髋外展': '腿', '小腿提踵': '腿',
    
    // 肩部动作
    '推举': '肩', '杠铃推举': '肩', '哑铃推举': '肩', '坐姿推举': '肩',
    '器械坐姿推举': '肩', '侧平举': '肩', '哑铃侧平举': '肩', '绳索侧平举': '肩',
    '前平举': '肩', '俯身飞鸟': '肩', '面拉': '肩', '反向飞鸟': '肩',
    '阿诺德推举': '肩',
    
    // 二头动作
    '杠铃弯举': '二头', '哑铃弯举': '二头', '锤式弯举': '二头', '斜板弯举': '二头',
    '牧师凳弯举': '二头', '集中弯举': '二头', '绳索弯举': '二头', '高位弯举': '二头',
    
    // 三头动作
    '臂屈伸': '三头', '绳索下压': '三头', '三头下压': '三头', '过头臂屈伸': '三头',
    '仰卧臂屈伸': '三头', '窄距卧推': '三头', '碎颅者': '三头',
    
    // 腹部动作
    '卷腹': '腹', '仰卧起坐': '腹', '悬垂举腿': '腹', '平板支撑': '腹',
    '俄罗斯转体': '腹', '腹肌轮': '腹', '抬腿': '腹', '仰卧抬腿': '腹',
    '坐姿卷腹': '腹', '绳索卷腹': '腹'
  },

  /**
   * 根据动作名称获取对应的身体部位
   */
  getBodyPart(exerciseName) {
    // 直接匹配
    if (this.exerciseBodyPartMap[exerciseName]) {
      return this.exerciseBodyPartMap[exerciseName];
    }
    
    // 模糊匹配
    for (const [key, value] of Object.entries(this.exerciseBodyPartMap)) {
      if (exerciseName.includes(key) || key.includes(exerciseName)) {
        return value;
      }
    }
    
    return '其他';
  },

  /**
   * 解析单条训练记录
   * @param {string} record - 原始训练数据字符串
   * @returns {Object} 解析后的训练记录对象
   */
  parseTrainingRecord(record) {
    if (!record || typeof record !== 'string') {
      return null;
    }

    const result = {
      date: '',
      id: '',
      type: '',
      startTime: 0,
      endTime: 0,
      duration: 0,
      calories: 0,
      exercises: []
    };

    // 提取日期 (格式: 260405)
    const dateMatch = record.match(/^(\d{6})/);
    if (dateMatch) {
      const dateStr = dateMatch[1];
      const year = '20' + dateStr.substring(0, 2);
      const month = dateStr.substring(2, 4);
      const day = dateStr.substring(4, 6);
      result.date = `${year}-${month}-${day}`;
    }

    // 提取 ID
    const idMatch = record.match(/id:(\d+)/);
    if (idMatch) {
      result.id = idMatch[1];
    }

    // 提取训练类型 (如: 背+二头, 胸+三头)
    const typeMatch = record.match(/id:\d+,([^,]+)/);
    if (typeMatch) {
      result.type = typeMatch[1];
    }

    // 提取训练时间
    const trainTimeMatch = record.match(/train_time:(\d+)-(\d+)/);
    if (trainTimeMatch) {
      result.startTime = parseInt(trainTimeMatch[1]);
      result.endTime = parseInt(trainTimeMatch[2]);
      result.duration = Math.round((result.endTime - result.startTime) / 60000); // 转换为分钟
    }

    // 提取卡路里
    const calorieMatch = record.match(/calorie:(\d+)/);
    if (calorieMatch) {
      result.calories = parseInt(calorieMatch[1]);
    }

    // 提取动作和组数
    result.exercises = this.parseExercises(record);

    return result;
  },

  /**
   * 解析动作列表
   * @param {string} record - 原始训练数据字符串
   * @returns {Array} 动作列表
   */
  parseExercises(record) {
    const exercises = [];
    
    // 分割动作部分 (去掉开头的元数据)
    const parts = record.split(',');
    let currentExercise = null;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      
      // 检测动作名称 (如: "2.宽距高位下拉")
      const exerciseMatch = part.match(/^\d+\.?(.+)/);
      if (exerciseMatch && !part.includes('组') && !part.includes('kg') && !part.includes('次')) {
        // 这是一个新动作
        const exerciseName = exerciseMatch[1].trim();
        currentExercise = {
          name: exerciseName,
          bodyPart: this.getBodyPart(exerciseName),
          sets: []
        };
        exercises.push(currentExercise);
      }
      
      // 检测组数信息 (如: "1组,50kg,8次,time:120s")
      const setMatch = part.match(/^(\d+)组$/);
      if (setMatch && currentExercise) {
        const setNumber = parseInt(setMatch[1]);
        const nextParts = parts.slice(i + 1, i + 5).map(p => p.trim());
        
        let weight = 0;
        let reps = 0;
        let restTime = 0;
        
        for (const np of nextParts) {
          const weightMatch = np.match(/^(\d+\.?\d*)kg$/);
          if (weightMatch) {
            weight = parseFloat(weightMatch[1]);
          }
          
          const repsMatch = np.match(/^(\d+)次$/);
          if (repsMatch) {
            reps = parseInt(repsMatch[1]);
          }
          
          const timeMatch = np.match(/^time:(\d+)s$/);
          if (timeMatch) {
            restTime = parseInt(timeMatch[1]);
          }
        }
        
        currentExercise.sets.push({
          set: setNumber,
          weight: weight,
          reps: reps,
          restTime: restTime
        });
      }
    }
    
    return exercises;
  },

  /**
   * 解析多个训练记录
   * @param {Array} data - 原始训练数据数组
   * @returns {Array} 解析后的训练记录数组
   */
  parseAllRecords(data) {
    if (!Array.isArray(data)) {
      return [];
    }
    
    return data
      .map(record => this.parseTrainingRecord(record))
      .filter(record => record !== null);
  },

  /**
   * 提取所有动作名称（过滤非训练动作）
   * @param {Array} parsedData - 解析后的训练记录数组
   * @returns {Array} 动作名称数组（去重）
   */
  extractExerciseNames(parsedData) {
    const names = new Set();
    parsedData.forEach(record => {
      record.exercises.forEach(ex => {
        // 过滤非训练动作（包含km、kcal等有氧运动）
        if (ex.name && !this.isCardioExercise(ex.name)) {
          names.add(ex.name);
        }
      });
    });
    return Array.from(names).sort();
  },

  /**
   * 判断是否是需要过滤的动作
   */
  isCardioExercise(name) {
    if (!name) return true;
    
    // 包含有氧运动关键词
    const cardioKeywords = ['步行', '跑步', '跑步机', '椭圆机', '划船机', '单车', '自行车', '游泳', '跳绳', '有氧', '苹果健康训练', 'km', 'kcal'];
    if (cardioKeywords.some(keyword => name.includes(keyword))) {
      return true;
    }
    
    // 包含km
    if (name.includes('km') || name.includes('KM')) {
      return true;
    }
    
    // 纯数字
    if (/^\d+$/.test(name.trim())) {
      return true;
    }
    
    // 纯英文（不含中文）
    if (/^[a-zA-Z\s]+$/.test(name.trim())) {
      return true;
    }
    
    return false;
  },

  /**
   * 按部位分类提取动作
   * @param {Array} parsedData - 解析后的训练记录数组
   * @returns {Object} { 胸: [...], 背: [...], ... }
   */
  extractExercisesByBodyPart(parsedData) {
    const exercisesByPart = {
      '胸': [],
      '背': [],
      '肩': [],
      '腿': [],
      '二头': [],
      '三头': [],
      '腹': [],
      '其他': []
    };

    const addedExercises = new Set();

    parsedData.forEach(record => {
      record.exercises.forEach(ex => {
        // 过滤有氧运动
        if (this.isCardioExercise(ex.name)) {
          return;
        }

        const bodyPart = ex.bodyPart || this.getBodyPart(ex.name);
        const key = `${bodyPart}:${ex.name}`;
        
        if (!addedExercises.has(key)) {
          addedExercises.add(key);
          if (exercisesByPart[bodyPart]) {
            exercisesByPart[bodyPart].push(ex.name);
          } else {
            exercisesByPart['其他'].push(ex.name);
          }
        }
      });
    });

    // 排序每个部位的动作
    Object.keys(exercisesByPart).forEach(part => {
      exercisesByPart[part].sort();
    });

    return exercisesByPart;
  },

  /**
   * 获取某动作的重量趋势数据
   * @param {Array} parsedData - 解析后的训练记录数组
   * @param {string} exerciseName - 动作名称
   * @param {Object} options - 可选参数，包含日期范围
   * @returns {Object} 重量趋势数据
   */
  getExerciseWeightTrend(parsedData, exerciseName, options = {}) {
    const trendData = {
      dates: [],
      maxWeights: [],
      avgWeights: [],
      totalReps: []
    };

    // 收集有训练数据的日期和重量
    const weightMap = {};
    parsedData.forEach(record => {
      const exercise = record.exercises.find(ex => ex.name === exerciseName);
      if (exercise && exercise.sets.length > 0) {
        const weights = exercise.sets.map(s => s.weight).filter(w => w > 0);
        
        if (weights.length > 0) {
          weightMap[record.date] = Math.max(...weights);
        }
      }
    });

    let allDates;
    
    if (options.selectedYear) {
      // 选择年份，只显示有数据的日期
      const year = parseInt(options.selectedYear);
      allDates = Object.keys(weightMap).filter(d => d.startsWith(year.toString())).sort();
    } else if (options.customDateRange) {
      // 自定义日期范围，只显示有数据的日期
      const { startDate, endDate } = options.customDateRange;
      allDates = Object.keys(weightMap).filter(d => d >= startDate && d <= endDate).sort();
    } else {
      // 默认只显示有数据的日期
      allDates = Object.keys(weightMap).sort();
    }

    // 填充数据
    allDates.forEach(date => {
      trendData.dates.push(date);
      trendData.maxWeights.push(weightMap[date] || 0);
    });

    return trendData;
  },

  /**
   * 计算各部位的训练容量
   * @param {Array} parsedData - 解析后的训练记录数组
   * @returns {Object} 部位容量统计
   */
  getBodyPartVolume(parsedData) {
    const volume = {
      '胸': 0,
      '背': 0,
      '肩': 0,
      '腹': 0,
      '二头': 0,
      '三头': 0,
      '腿': 0,
      '其他': 0
    };

    parsedData.forEach(record => {
      record.exercises.forEach(exercise => {
        const bodyPart = exercise.bodyPart || this.getBodyPart(exercise.name);
        let exerciseVolume = 0;
        
        exercise.sets.forEach(set => {
          if (set.weight > 0 && set.reps > 0) {
            exerciseVolume += set.weight * set.reps;
          }
        });
        
        if (volume[bodyPart] !== undefined) {
          volume[bodyPart] += exerciseVolume;
        } else {
          volume['其他'] += exerciseVolume;
        }
      });
    });

    return volume;
  },

  /**
   * 获取卡路里消耗数据
   * @param {Array} parsedData - 解析后的训练记录数组
   * @returns {Object} 卡路里数据
   */
  getCalorieData(parsedData) {
    const data = {
      dates: [],
      calories: []
    };

    parsedData.forEach(record => {
      if (record.calories > 0) {
        data.dates.push(record.date);
        data.calories.push(record.calories);
      }
    });

    return data;
  },

  /**
   * 按日期范围筛选数据
   * @param {Array} parsedData - 解析后的训练记录数组
   * @param {string} startDate - 开始日期 YYYY-MM-DD
   * @param {string} endDate - 结束日期 YYYY-MM-DD
   * @returns {Array} 筛选后的数据
   */
  filterByDateRange(parsedData, startDate, endDate) {
    return parsedData.filter(record => {
      const date = record.date;
      return date >= startDate && date <= endDate;
    });
  },

  /**
   * 按月份筛选数据
   * @param {Array} parsedData - 解析后的训练记录数组
   * @param {string} month - 月份 YYYY-MM
   * @returns {Array} 筛选后的数据
   */
  filterByMonth(parsedData, month) {
    return parsedData.filter(record => record.date.startsWith(month));
  },

  /**
   * 按年份筛选数据
   * @param {Array} parsedData - 解析后的训练记录数组
   * @param {string} year - 年份 YYYY
   * @returns {Array} 筛选后的数据
   */
  filterByYear(parsedData, year) {
    return parsedData.filter(record => record.date.startsWith(year));
  },

  /**
   * 根据时间范围类型获取对应的日期范围
   * @param {string} range - 'week', 'month', 'year'
   * @returns {Object} { startDate, endDate }
   */
  getDateRangeByType(range) {
    const now = new Date();
    let startDate;
    
    if (range === 'week') {
      // 最近7天
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
    } else if (range === 'month') {
      // 最近30天
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 29);
    } else if (range === 'year') {
      // 最近12个月
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      startDate.setDate(now.getDate() + 1);
    } else {
      return null;
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    };
  },

  /**
   * 按时间范围筛选数据
   * @param {Array} parsedData - 解析后的训练记录数组
   * @param {string} range - 'week', 'month', 'year'
   * @returns {Array} 筛选后的数据
   */
  filterByTimeRange(parsedData, range) {
    const dateRange = this.getDateRangeByType(range);
    if (!dateRange) return parsedData;
    
    return this.filterByDateRange(parsedData, dateRange.startDate, dateRange.endDate);
  },

  /**
   * 计算每日训练容量
   * @param {Array} parsedData - 解析后的训练记录数组
   * @returns {Object} { dates: [], volumes: [] }
   */
  getDailyVolume(parsedData) {
    const dailyVolume = {};
    
    parsedData.forEach(record => {
      let totalVolume = 0;
      
      record.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          if (set.weight > 0 && set.reps > 0) {
            totalVolume += set.weight * set.reps;
          }
        });
      });
      
      if (!dailyVolume[record.date]) {
        dailyVolume[record.date] = 0;
      }
      dailyVolume[record.date] += totalVolume;
    });
    
    const sortedDates = Object.keys(dailyVolume).sort();
    
    return {
      dates: sortedDates,
      volumes: sortedDates.map(d => dailyVolume[d])
    };
  },

  /**
   * 按时间范围聚合每日容量
   * @param {Array} parsedData - 解析后的训练记录数组
   * @param {string} range - 'week', 'month', 'year', 'custom'
   * @param {Object} options - 可选参数，包含 selectedMonth, selectedYear, customDateRange
   * @returns {Object} { labels: [], values: [] }
   */
  aggregateVolumeByRange(parsedData, range, options = {}) {
    const dailyVolume = this.getDailyVolume(parsedData);
    const dates = dailyVolume.dates;
    
    if (range === 'week') {
      // 周视图显示最近7天
      const dateRange = this.getDateRangeByType('week');
      if (!dateRange) return { labels: [], values: [] };
      
      const allDates = [];
      const current = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      
      while (current <= end) {
        allDates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
      
      const volumeMap = {};
      dates.forEach((d, i) => {
        volumeMap[d] = dailyVolume.volumes[i];
      });
      
      return {
        labels: allDates.map(d => {
          const date = new Date(d);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }),
        values: allDates.map(d => volumeMap[d] || 0),
        fullDates: allDates
      };
    } else if (range === 'month' && options.selectedMonth) {
      // 选择的具体月份，显示该月所有天
      const [year, month] = options.selectedMonth.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      
      const allDates = [];
      for (let day = 1; day <= daysInMonth; day++) {
        allDates.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
      }
      
      const volumeMap = {};
      dates.forEach((d, i) => {
        volumeMap[d] = dailyVolume.volumes[i];
      });
      
      return {
        labels: allDates.map(d => {
          const date = new Date(d);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }),
        values: allDates.map(d => volumeMap[d] || 0),
        fullDates: allDates
      };
    } else if (range === 'year' && options.selectedYear) {
      // 选择的具体年份，显示12个月
      const year = parseInt(options.selectedYear);
      const monthlyVolume = {};
      
      dates.forEach((d, i) => {
        const date = new Date(d);
        if (date.getFullYear() === year) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!monthlyVolume[monthKey]) {
            monthlyVolume[monthKey] = 0;
          }
          monthlyVolume[monthKey] += dailyVolume.volumes[i];
        }
      });
      
      const months = [];
      for (let month = 1; month <= 12; month++) {
        months.push(`${year}-${String(month).padStart(2, '0')}`);
      }
      
      return {
        labels: months.map(m => {
          const [y, month] = m.split('-');
          return `${y}/${month}`;
        }),
        values: months.map(m => monthlyVolume[m] || 0),
        fullDates: months
      };
    } else if (range === 'custom' && options.customDateRange) {
      // 自定义日期范围
      const { startDate, endDate } = options.customDateRange;
      
      const allDates = [];
      const current = new Date(startDate);
      const end = new Date(endDate);
      
      while (current <= end) {
        allDates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
      
      const volumeMap = {};
      dates.forEach((d, i) => {
        volumeMap[d] = dailyVolume.volumes[i];
      });
      
      return {
        labels: allDates.map(d => {
          const date = new Date(d);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }),
        values: allDates.map(d => volumeMap[d] || 0),
        fullDates: allDates
      };
    } else {
      // 默认：显示所有数据
      if (dates.length === 0) return { labels: [], values: [], fullDates: [] };
      
      const volumeMap = {};
      dates.forEach((d, i) => {
        volumeMap[d] = dailyVolume.volumes[i];
      });
      
      return {
        labels: dates.map(d => {
          const date = new Date(d);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }),
        values: dates.map(d => volumeMap[d] || 0),
        fullDates: dates
      };
    }
  }
};

// 导出模块（用于浏览器环境）
if (typeof window !== 'undefined') {
  window.DataParser = DataParser;
}
