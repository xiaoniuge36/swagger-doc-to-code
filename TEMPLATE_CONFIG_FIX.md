# 模板配置自动加载修复

## 问题描述
用户反映导入接口文档自动生成模板配置文件后，无法单个以及批量复制请求代码，提示 `<copyGroupRequests> copyRequest模板未配置，请先添加模板配置文件`，需要重启VSCode才能生效。

## 问题原因
1. 创建模板文件后，没有立即重新加载模板配置
2. 模板配置只在插件启动时加载一次，文件创建后需要手动重新加载
3. 缺少对文件创建事件的监听

## 修复方案

### 1. 修改 `src/commands/list.cmd.ts`
在 `createTemplateFileIfNotExists` 函数中，创建模板文件后立即重新加载配置：

```typescript
// 写入模板文件
fs.writeFileSync(templatePath, enhancedTemplateContent, 'utf8')

// 立即重新加载模板配置，避免需要重启VSCode
const { getWorkspaceTemplateConfig } = await import('../tools/get-templates')
getWorkspaceTemplateConfig()
```

### 2. 修改 `src/commands/local.cmd.ts`
在 `doCreateTemplate` 函数中，创建模板文件后立即重新加载配置：

```typescript
// 立即重新加载模板配置，避免需要重启VSCode
const { getWorkspaceTemplateConfig } = require('../tools/get-templates');
getWorkspaceTemplateConfig();
```

### 3. 增强 `src/tools/get-templates.ts`
添加文件创建事件监听，确保模板文件创建时自动重新加载配置：

```typescript
/** 监听文件创建 */
vscode.workspace.onDidCreateFiles((event) => {
  event.files.forEach((file) => {
    if (file.fsPath === workspaceConfigPath) {
      console.log('模板配置文件已创建，重新加载配置...')
      // 延迟一下确保文件写入完成
      setTimeout(() => {
        getWorkspaceTemplateConfig()
      }, 100)
    }
  })
})
```

## 修复效果
1. ✅ 创建模板文件后立即可用，无需重启VSCode
2. ✅ 自动生成模板文件时立即加载配置
3. ✅ 手动创建模板文件时也会自动加载
4. ✅ 保存模板文件时重新加载配置
5. ✅ 用户体验大幅提升

## 测试步骤
1. 删除现有的 `.vscode/swagger-doc-to-code.template.js` 文件（如果存在）
2. 添加新的Swagger项目或点击"一键添加模板配置"按钮
3. 验证模板文件创建后立即可以使用复制请求代码功能
4. 无需重启VSCode即可正常使用所有模板功能

## 相关文件
- `src/commands/list.cmd.ts` - 自动创建模板文件逻辑
- `src/commands/local.cmd.ts` - 手动创建模板文件逻辑  
- `src/tools/get-templates.ts` - 模板配置加载和监听逻辑
- `src/templates/template-generator.ts` - 模板内容生成器