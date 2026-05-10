/**
 * 图表渲染模块
 * 使用 Chart.js 创建各种图表
 */

const Charts = {
  // 存储图表实例
  instances: {
    trainingTrend: null,
    bodyPartPie: null,
    calorie: null,
    exerciseWeight: null
  },

  // 部位颜色配置
  bodyPartColors: {
    '胸': '#ff6b6b',
    '背': '#4ecdc4',
    '肩': '#45b7d1',
    '腹': '#96ceb4',
    '二头': '#feca57',
    '三头': '#ff9ff3',
    '腿': '#54a0ff',
    '其他': '#95a5a6'
  },

  /**
   * 渐变色创建
   */
  createGradient(ctx, color1, color2, height = 400) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    return gradient;
  },

  /**
   * 渲染训练量趋势图（折线图）
   * @param {CanvasRenderingContext2D} ctx
   * @param {Array} data - 解析后的训练数据
   * @param {string} range - 'week', 'month', 'year', 'custom'
   * @param {Object} options - 可选参数
   */
  renderTrainingTrendChart(ctx, data, range = 'week', options = {}) {
    // 销毁旧图表
    if (this.instances.trainingTrend) {
      this.instances.trainingTrend.destroy();
    }

    const chartData = DataParser.aggregateVolumeByRange(data, range, options);
    
    // 保存完整的日期列表用于tooltip
    this.trainingTrendFullDates = chartData.fullDates || [];
    
    // 检查是否有数据
    const hasData = chartData.values.some(v => v > 0);

    // 空数据提示插件
    const noDataPlugin = {
      id: 'noData',
      afterDraw: function(chart) {
        if (!hasData) {
          const { width, height, ctx } = chart;
          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#999';
          ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillText('该时间段内无训练记录', width / 2, height / 2);
          ctx.restore();
        }
      }
    };

    this.instances.trainingTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [{
          label: '训练容量 (kg)',
          data: chartData.values,
          borderColor: hasData ? '#667eea' : 'transparent',
          backgroundColor: hasData ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
          fill: true,
          tension: 0.4,
          pointRadius: hasData ? 4 : 0,
          pointHoverRadius: hasData ? 6 : 0,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          borderWidth: hasData ? 3 : 0
        }]
      },
      plugins: [noDataPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { size: 14 },
            bodyFont: { size: 13 },
            callbacks: {
              title: function(context) {
                const index = context[0].dataIndex;
                if (window.App && window.App.trainingTrendFullDates && window.App.trainingTrendFullDates[index]) {
                  const dateStr = window.App.trainingTrendFullDates[index];
                  const date = new Date(dateStr);
                  if (!isNaN(date.getTime())) {
                    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
                  }
                  // 可能是月份格式 2025/01
                  return dateStr.replace('/', '年') + '月';
                }
                return context[0].label;
              },
              label: function(context) {
                return `容量: ${context.parsed.y.toLocaleString()} kg`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              callback: function(value) {
                if (value >= 10000) {
                  return (value / 1000).toFixed(0) + 'k';
                }
                return value;
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              maxRotation: 45,
              minRotation: 0
            }
          }
        }
      }
    });
  },

  /**
   * 渲染部位分布饼图（显示容量）
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} volumeStats - 各部位容量统计
   */
  renderBodyPartPieChart(ctx, volumeStats) {
    // 销毁旧图表
    if (this.instances.bodyPartPie) {
      this.instances.bodyPartPie.destroy();
    }

    // 过滤掉容量为0的部位
    const filteredStats = {};
    Object.entries(volumeStats).forEach(([key, value]) => {
      if (value > 0) {
        filteredStats[key] = value;
      }
    });

    const labels = Object.keys(filteredStats);
    const data = Object.values(filteredStats);
    const colors = labels.map(label => this.bodyPartColors[label] || '#95a5a6');

    if (labels.length === 0) {
      return;
    }

    this.instances.bodyPartPie = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 3,
          borderColor: '#fff',
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              padding: 15,
              usePointStyle: true,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((context.parsed / total) * 100);
                return `${context.label}: ${context.parsed.toLocaleString()} kg (${percentage}%)`;
              }
            }
          }
        },
        cutout: '60%'
      }
    });
  },

  /**
   * 渲染卡路里消耗图
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} calorieData - { dates: [], calories: [] }
   */
  renderCalorieChart(ctx, calorieData) {
    // 销毁旧图表
    if (this.instances.calorie) {
      this.instances.calorie.destroy();
    }

    if (!calorieData || calorieData.dates.length === 0) {
      return;
    }

    // 保存完整的日期列表用于tooltip
    this.calorieFullDates = calorieData.dates;

    const gradient = this.createGradient(ctx, '#f093fb', '#f5576c');

    this.instances.calorie = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: calorieData.dates.map(d => {
          const date = new Date(d);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }),
        datasets: [{
          label: '消耗卡路里',
          data: calorieData.calories,
          backgroundColor: gradient,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            callbacks: {
              title: function(context) {
                const index = context[0].dataIndex;
                if (window.Charts && window.Charts.calorieFullDates && window.Charts.calorieFullDates[index]) {
                  const dateStr = window.Charts.calorieFullDates[index];
                  const date = new Date(dateStr);
                  if (!isNaN(date.getTime())) {
                    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
                  }
                }
                return context[0].label;
              },
              label: function(context) {
                return `消耗: ${context.parsed.y} kcal`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              callback: function(value) {
                return value + ' kcal';
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              maxRotation: 45,
              minRotation: 0
            }
          }
        }
      }
    });
  },

  /**
   * 渲染动作重量趋势图
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} trendData
   */
  renderExerciseWeightChart(ctx, trendData) {
    // 销毁旧图表
    if (this.instances.exerciseWeight) {
      this.instances.exerciseWeight.destroy();
    }

    if (!trendData || trendData.dates.length === 0) {
      return;
    }

    this.instances.exerciseWeight = new Chart(ctx, {
      type: 'line',
      data: {
        labels: trendData.dates.map(d => {
          const date = new Date(d);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }),
        datasets: [
          {
            label: '最大重量',
            data: trendData.maxWeights,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: '#667eea',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            borderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            callbacks: {
              title: function(context) {
                const index = context[0].dataIndex;
                const date = new Date(trendData.dates[index]);
                return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
              },
              label: function(context) {
                return `最大重量: ${context.parsed.y.toFixed(1)} kg`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: '重量 (kg)',
              font: {
                size: 13
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  },

  /**
   * 销毁所有图表
   */
  destroyAll() {
    Object.keys(this.instances).forEach(key => {
      if (this.instances[key]) {
        this.instances[key].destroy();
        this.instances[key] = null;
      }
    });
  }
};

// 导出模块
if (typeof window !== 'undefined') {
  window.Charts = Charts;
}
