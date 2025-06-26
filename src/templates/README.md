# 模板管理系统

本目录包含了 Swagger Doc To Code 扩展的模板管理相关文件。

## 文件说明

### `template-generator.ts`
模板生成器工具类，统一管理所有模板内容，提供以下功能：

- **generateEnhancedTemplate()**: 生成完整的增强版模板内容
- **generateBasicTemplate()**: 生成基础模板内容
- **getTemplateHeader()**: 获取模板文件头部注释
- **getNamespaceFunction()**: 获取命名空间函数模板
- **getParamsFunction()**: 获取参数接口函数模板
- **getResponseFunction()**: 获取响应接口函数模板
- **getCopyRequestFunction()**: 获取复制请求函数模板
- **getExportConfig()**: 获取模板导出配置

### `enhanced-template.js`
预定义的增强版模板文件，包含完整的模板配置示例。

## 重构说明

### 重构前的问题
1. **代码重复**: `list.cmd.ts` 和 `local.cmd.ts` 中存在大量重复的模板代码
2. **维护困难**: 模板内容硬编码在多个文件中，修改时需要同步更新多处
3. **可读性差**: 长字符串模板嵌入在业务逻辑中，影响代码可读性

### 重构后的优势
1. **统一管理**: 所有模板内容集中在 `TemplateGenerator` 类中管理
2. **消除重复**: 多个文件共享同一套模板生成逻辑
3. **易于维护**: 模板修改只需在一处进行
4. **模块化**: 模板生成逻辑与业务逻辑分离
5. **可扩展**: 便于添加新的模板类型和配置选项

## 使用示例

```typescript
import { TemplateGenerator } from '../templates/template-generator';

// 生成完整模板内容
const templateContent = TemplateGenerator.generateEnhancedTemplate();

// 生成特定部分的模板
const headerComment = TemplateGenerator.getTemplateHeader();
const copyRequestFunction = TemplateGenerator.getCopyRequestFunction();
```

## 模板结构

生成的模板文件包含以下部分：

1. **文件头部注释**: 说明模板用途和参考文档
2. **命名空间函数**: 自定义接口命名空间生成规则
3. **参数接口函数**: 自定义请求参数接口生成
4. **响应接口函数**: 自定义响应数据接口生成
5. **请求函数模板**: 生成完整的 API 请求函数
6. **导出配置**: 模块导出和可选配置示例

## 扩展指南

如需添加新的模板类型，请在 `TemplateGenerator` 类中添加相应的静态方法，并遵循以下命名规范：

- `generate*()`: 生成完整模板内容的方法
- `get*()`: 获取模板片段的方法

确保新增的模板方法包含完整的 JSDoc 注释，说明用途和返回值类型。