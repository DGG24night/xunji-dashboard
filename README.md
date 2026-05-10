# 训记数据分析可视化工具

一个基于训记App训练数据的可视化分析工具，帮助你更好地了解自己的训练情况。

## 功能特点

- 📊 **训练数据可视化**：训练量趋势、部位分布、卡路里消耗、动作重量趋势
- 🤖 **AI训练建议**：支持多AI服务商，提供个性化训练和塑形建议
- 👤 **用户信息管理**：记录身体数据，自动计算BMI
- 🎨 **高级感UI**：亮色调毛玻璃效果设计

## 使用方法

### 方式一：使用本地缓存文件

1. 使用训记App导出训练数据到 `cache/` 目录
2. 打开 `web/index.html`
3. 点击"选择文件夹"，选择 `cache/` 目录
4. 查看图表和分析结果

### 方式二：通过API获取数据

1. 在训记App中申请API Key
2. 打开网页，点击"⚙️ 设置"
3. 在"训记 API Key"处填写你的API Key
4. 使用命令行工具获取数据：

```bash
export XUNJI_API_KEY=你的API_KEY
npm run fetch
```

## 部署到GitHub Pages

1. Fork 或克隆本仓库
2. 在 GitHub 仓库设置中开启 Pages
3. 选择 `main` 分支和 `/ (root)` 目录
4. 访问 `https://你的用户名.github.io/仓库名/web/`

## 技术栈

- 前端：HTML + CSS + JavaScript
- 图表：Chart.js
- 数据存储：localStorage

## 隐私说明

- 所有训练数据存储在浏览器本地（localStorage）
- API Key 仅保存在你的浏览器中，不会上传到任何服务器
- 缓存文件（`cache/`）包含你的训练数据，已通过 `.gitignore` 排除

## 许可证

MIT
