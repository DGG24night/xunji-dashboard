/**
 * AI 建议模块
 * 调用 AI API 生成训练建议
 */

const AIAdvisor = {
  // 模拟建议数据（未接入AI时使用）
  mockAdvice: {
    '胸': '💡 建议增加卧推的训练频率，每周至少2次。注意控制重量，循序渐进。可以尝试不同角度的卧推（上斜、下斜）来全面刺激胸部肌肉。',
    '背': '💡 背部训练动作多样，建议增加引体向上和划船的组合。注意肩胛骨的收缩，感受背部发力。可以加入单臂划船来改善左右不平衡。',
    '肩': '💡 肩部训练要注意前束、中束、后束的均衡发展。建议增加侧平举和面拉，避免过度使用推举。注意控制重量，避免借力。',
    '腹': '💡 核心训练建议每周3次，每次15-20分钟。注意腹式呼吸的配合。可以加入平板支撑、悬垂举腿等动作来增强核心稳定性。',
    '二头': '💡 二头训练建议增加弯举的变式，如锤式弯举、斜板弯举。控制离心收缩（放下阶段），这对肌肉增长非常重要。',
    '三头': '💡 三头训练建议增加臂屈伸和下压的组合。注意肘关节的稳定性，避免过度伸展。窄距卧推也是很好的三头训练动作。',
    '腿': '💡 腿部训练是最重要的，建议每周至少1次深蹲和硬拉的组合。注意膝盖不超过脚尖，保持背部挺直。可以加入腿举、腿弯举等动作。'
  },

  /**
   * 生成训练建议
   * @param {Array} parsedData - 解析后的训练数据
   * @returns {Object} 各部位建议
   */
  async generateAdvice(parsedData) {
    // 获取当前配置
    const config = Settings.getCurrentConfig();
    
    if (!config || !config.apiKey) {
      return this.getMockAdvice(parsedData);
    }

    try {
      const response = await this.callAIAPI(parsedData, config);
      return this.parseAIResponse(response);
    } catch (error) {
      console.error('AI API 调用失败:', error);
      App.showToast(`AI调用失败: ${error.message}，使用模拟数据`, 'error');
      return this.getMockAdvice(parsedData);
    }
  },

  /**
   * 调用 AI API
   */
  async callAIAPI(parsedData, config) {
    const prompt = this.buildPrompt(parsedData);
    
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: `你是一位专业的健身教练，名叫"训记AI助手"。你会根据用户的训练数据和身体信息给出针对性的训练建议和塑形建议。

请用中文回复，语气要积极鼓励，同时给出实用的建议。

对于每个部位，你需要：
1. 先给出一个emoji（如💪、🔥等）
2. 然后是具体的建议内容
3. 建议要基于用户的实际训练数据
4. 如果某个部位训练较少，要鼓励用户增加训练
5. 如果某个部位训练较多，要给出进阶建议

最后，请根据用户的身体信息（BMI、体脂率等）给出塑形建议，包括：
- 整体体型评估
- 需要重点改善的部位
- 饮食建议
- 有氧运动建议

请以JSON格式返回，格式如下：
{
  "胸": "💡 建议内容...",
  "背": "💡 建议内容...",
  "肩": "💡 建议内容...",
  "腹": "💡 建议内容...",
  "二头": "💡 建议内容...",
  "三头": "💡 建议内容...",
  "腿": "💡 建议内容...",
  "塑形建议": "🎯 根据你的身体信息..."
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 请求失败 (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    return result.choices[0].message.content;
  },

  /**
   * 构建提示词
   */
  buildPrompt(parsedData) {
    // 统计各部位训练情况
    const bodyPartStats = {};
    const exerciseDetails = {};
    
    parsedData.forEach(record => {
      const type = record.type;
      
      // 统计训练次数
      if (!bodyPartStats[type]) {
        bodyPartStats[type] = 0;
      }
      bodyPartStats[type]++;
      
      // 记录具体动作
      record.exercises.forEach(ex => {
        if (!exerciseDetails[type]) {
          exerciseDetails[type] = [];
        }
        if (!exerciseDetails[type].includes(ex.name)) {
          exerciseDetails[type].push(ex.name);
        }
      });
    });

    // 构建详细的训练数据描述
    let prompt = '以下是我的训练数据统计：\n\n';
    
    prompt += '【训练频率】\n';
    Object.entries(bodyPartStats).forEach(([type, count]) => {
      prompt += `- ${type}: ${count} 次\n`;
    });
    
    prompt += '\n【训练动作】\n';
    Object.entries(exerciseDetails).forEach(([type, exercises]) => {
      prompt += `- ${type}: ${exercises.join('、')}\n`;
    });
    
    prompt += `\n【训练日期范围】${parsedData[0].date} 至 ${parsedData[parsedData.length - 1].date}\n`;
    
    // 添加用户身体信息
    const userInfo = window.App ? window.App.userInfo : null;
    if (userInfo) {
      prompt += '\n【身体信息】\n';
      if (userInfo.gender) prompt += `- 性别: ${userInfo.gender}\n`;
      if (userInfo.birthdate) {
        const age = Math.floor((Date.now() - new Date(userInfo.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        prompt += `- 年龄: ${age}岁\n`;
      }
      if (userInfo.height) prompt += `- 身高: ${userInfo.height}cm\n`;
      if (userInfo.weight) prompt += `- 体重: ${userInfo.weight}kg\n`;
      if (userInfo.height && userInfo.weight) {
        const heightM = userInfo.height / 100;
        const bmi = (userInfo.weight / (heightM * heightM)).toFixed(1);
        prompt += `- BMI: ${bmi}\n`;
      }
      if (userInfo.bodyFat) prompt += `- 体脂率: ${userInfo.bodyFat}%\n`;
      if (userInfo.injuries) prompt += `- 伤病信息: ${userInfo.injuries}\n`;
    }
    
    prompt += '\n请根据以上数据，为我每个训练部位给出针对性建议，并给出塑形建议。';

    return prompt;
  },

  /**
   * 解析AI响应
   */
  parseAIResponse(response) {
    try {
      // 尝试解析JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('解析AI响应失败:', error);
    }
    
    // 如果解析失败，返回模拟数据
    return this.mockAdvice;
  },

  /**
   * 获取模拟建议
   */
  getMockAdvice(parsedData) {
    // 根据实际训练数据调整建议
    const bodyPartStats = {};
    
    parsedData.forEach(record => {
      const type = record.type;
      if (!bodyPartStats[type]) {
        bodyPartStats[type] = 0;
      }
      bodyPartStats[type]++;
    });

    const advice = { ...this.mockAdvice };
    
    // 根据训练频率调整建议
    if (bodyPartStats['胸+三头'] && bodyPartStats['胸+三头'] > 2) {
      advice['胸'] = '🔥 太棒了！你的胸部训练很频繁，可以尝试增加重量或减少休息时间来提升强度。';
    }
    
    if (bodyPartStats['背+二头'] && bodyPartStats['背+二头'] > 2) {
      advice['背'] = '🔥 很好！背部训练很到位，可以尝试引体向上的变式来增加难度。';
    }
    
    if (!bodyPartStats['肩'] && !bodyPartStats['胸+肩+三头']) {
      advice['肩'] = '⚠️ 注意！你最近没有单独训练肩部，建议每周至少安排1次肩部训练。';
    }

    // 添加塑形建议
    const userInfo = window.App ? window.App.userInfo : null;
    if (userInfo && userInfo.height && userInfo.weight) {
      const heightM = userInfo.height / 100;
      const bmi = (userInfo.weight / (heightM * heightM)).toFixed(1);
      
      let塑形建议 = '🎯 【塑形建议】\n\n';
      
      if (bmi < 18.5) {
        塑形建议 += '• 你的体重偏瘦，建议增加热量摄入，多吃高蛋白食物\n';
        塑形建议 += '• 以力量训练为主，增加肌肉量\n';
        塑形建议 += '• 减少有氧运动，避免消耗过多热量';
      } else if (bmi < 24) {
        塑形建议 += '• 你的体重在正常范围内，继续保持\n';
        塑形建议 += '• 可以根据目标调整训练重点\n';
        塑形建议 += '• 力量训练和有氧运动相结合';
      } else if (bmi < 28) {
        塑形建议 += '• 你的体重偏胖，建议控制饮食，减少高热量食物\n';
        塑形建议 += '• 增加有氧运动，如跑步、游泳等\n';
        塑形建议 += '• 力量训练可以提高基础代谢率';
      } else {
        塑形建议 += '• 你的体重偏高，建议先从饮食控制开始\n';
        塑形建议 += '• 选择低强度有氧运动，如快走、游泳\n';
        塑形建议 += '• 循序渐进，不要急于求成';
      }
      
      if (userInfo.injuries) {
        塑形建议 += `\n• ⚠️ 注意：你有伤病史（${userInfo.injuries}），训练时请避免加重伤情的动作`;
      }
      
      advice['塑形建议'] = 塑形建议;
    } else {
      advice['塑形建议'] = '🎯 【塑形建议】\n\n请先填写身高和体重信息，以便为你提供个性化的塑形建议。';
    }

    return advice;
  },

  /**
   * 测试AI连接
   */
  async testConnection(settings) {
    if (!settings || !settings.apiKey) {
      return {
        success: false,
        message: '请先填写API密钥'
      };
    }

    try {
      // 检查URL格式
      if (!settings.apiUrl.startsWith('http://') && !settings.apiUrl.startsWith('https://')) {
        return {
          success: false,
          message: 'API地址格式不正确，需要以http://或https://开头'
        };
      }

      const response = await fetch(settings.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [
            {
              role: 'user',
              content: '请回复"连接成功"'
            }
          ],
          max_tokens: 10
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          message: `API请求失败 (${response.status}): ${errorText}`
        };
      }

      const result = await response.json();
      return {
        success: true,
        message: '连接成功',
        response: result.choices?.[0]?.message?.content || '成功'
      };
    } catch (error) {
      // 区分不同类型的错误
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        return {
          success: false,
          message: '网络请求失败，可能是CORS跨域问题或网络不通。建议使用支持CORS的API服务。'
        };
      }
      return {
        success: false,
        message: error.message || '连接失败'
      };
    }
  }
};

// 导出模块
if (typeof window !== 'undefined') {
  window.AIAdvisor = AIAdvisor;
}
