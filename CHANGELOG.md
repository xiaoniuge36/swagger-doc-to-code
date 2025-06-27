# 更新日志

所有重要的项目变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.1.2] - 2025-01-15

### 新增功能
- 🌏 **中文转英文优化**：引入 `pinyin-pro` 库，智能处理中文分组名称转换
- 🔍 **智能中文检测**：新增 `containsChinese` 函数，精确识别中文字符
- 📚 **分层转换策略**：优先使用常用词汇映射，智能拼音转换作为补充
- 🎯 **词汇映射扩展**：新增大量常用技术词汇的中英文映射表
- 🧹 **格式化处理**：自动清理特殊字符，确保生成的文件夹名称符合规范

### 改进
- 📁 **文件夹命名规范**：解决复制请求代码时创建中文文件夹不规范的问题
- 🎨 **转换效果优化**：显著提升中文分组名称转英文的准确性和可读性
- ⚡ **性能优化**：采用智能检测机制，仅对包含中文的名称进行转换处理

### 新增配置项
- `apiDocToTypes.enableChineseConversion`：启用中文分组名称转英文
- `apiDocToTypes.chineseConversionMode`：中文转换模式（'pinyin'|'mapping'|'auto'）

### 技术改进
- 📦 新增 `pinyin-pro` 依赖，提供高质量的中文拼音转换
- 🔧 优化 `utils.ts` 中的转换逻辑，提高代码可维护性
- 📝 完善相关文档和使用说明

## [1.1.0] - 2025-06-26

### 新增功能
- ✨ **智能欢迎系统**：首次使用和版本升级时显示欢迎界面
- 🎯 **智能代码提示**：TypeScript/JavaScript 文件中的 API 类型智能补全
- 👁️ **悬停信息显示**：鼠标悬停时显示 API 接口详细信息
- 🔍 **代码镜头功能**：在类型定义上显示快速操作按钮
- 📝 **代码片段系统**：内置 8 种 API 开发代码模板
  - `api-get`：GET 请求模板
  - `api-post`：POST 请求模板
  - `api-interface`：接口类型定义
  - `axios-get`：基于 Axios 的 GET 请求
  - `axios-post`：基于 Axios 的 POST 请求
  - `api-error`：API 错误处理
  - `swr-hook`：SWR 数据获取 Hook
- 🧪 **API 测试功能**：
  - 生成 API 测试代码
  - 生成 cURL 命令
- 📊 **状态栏增强**：
  - 显示 API 统计信息
  - 快速生成按钮
- 📁 **文件监听**：自动检测 API 文档文件变更
- 📁 **智能分组保存**：支持按配置源和接口分组自动保存，保持 Swagger 接口列表、本地接口列表和保存文件结构的三者一致性
- ⚙️ **高级配置管理**：
  - 配置导出/导入
  - 快速配置面板
  - 功能开关控制

### 改进
- 🎨 更新了 README.md 文档，添加了详细的功能介绍
- 🔧 优化了插件架构，提高了代码可维护性
- 📦 新增了多个配置选项，支持功能的精细化控制

### 新增配置项
- `SwaggerDocToCode.enableWelcomeMessage`：启用欢迎消息
- `SwaggerDocToCode.enableCodeSnippets`：启用代码片段
- `SwaggerDocToCode.enableSmartCompletion`：启用智能补全
- `SwaggerDocToCode.enableCodeLens`：启用代码镜头
- `SwaggerDocToCode.enableApiTesting`：启用 API 测试
- `SwaggerDocToCode.apiStatsInStatusBar`：状态栏显示统计
- `SwaggerDocToCode.autoUpdateApiStats`：自动更新统计

### 新增命令
- `cmd.config.quickSetup`：快速配置
- `cmd.config.exportConfig`：导出配置
- `cmd.config.importConfig`：导入配置
- `cmd.config.resetConfig`：重置配置
- `cmd.api.generateTest`：生成 API 测试代码
- `cmd.api.generateCurl`：生成 cURL 命令
- `cmd.welcome.show`：显示欢迎页面
- `cmd.stats.refresh`：刷新 API 统计

## [1.0.5] - 2025-06-26

### 修复
- 🐛 修复了模板文件生成时的路径问题
- 🔧 优化了配置文件的读取逻辑

### 改进
- 📝 完善了文档说明
- 🎨 优化了用户界面体验

## [1.0.4] - 2025-06-26

### 新增
- ✨ 支持 Postman Collection 格式
- 🔄 增加了增量更新功能
- 📋 添加了一键复制功能

### 修复
- 🐛 修复了 OpenAPI 3.0 解析问题
- 🔧 优化了类型生成逻辑

## [1.0.3] - 2025-06-26

### 新增
- 🎯 智能类型生成
- 🏷️ 命名空间隔离
- 🔍 快速搜索功能

### 改进
- 🚀 提升了解析性能
- 📦 优化了文件结构

## [1.0.0] -2025-06-20

### 首次发布
- 🎉 支持 Swagger/OpenAPI 文档解析
- 📝 TypeScript 类型定义生成
- 🎨 自定义模板支持
- 🔧 基础配置选项