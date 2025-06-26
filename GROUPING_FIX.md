# 分组逻辑修复说明

## 问题描述

用户反馈本地接口列表存在以下问题：
1. 分组最外层多了"复制请求代码"和"保存接口"的按钮
2. 分组逻辑有问题，希望分组逻辑与 Swagger 接口列表一致

## 解决方案

### 1. 修复按钮显示问题

**修改文件**: `package.json`

在 `view/item/context` 菜单配置中，为以下命令添加了 `viewItem == interface` 条件：
- `cmd.local.copyRequest`
- `cmd.local.updateInterface`

**修改前**:
```json
"when": "view == view.local && SwaggerDocToCode.hasCopyRequestFn == 1"
"when": "view == view.local"
```

**修改后**:
```json
"when": "view == view.local && SwaggerDocToCode.hasCopyRequestFn == 1 && viewItem == interface"
"when": "view == view.local && viewItem == interface"
```

### 2. 修改分组逻辑

**修改文件**: `src/views/local.view.ts`

#### 主要变更：

1. **分组依据改变**：
   - **原来**：基于文件目录结构进行分组
   - **现在**：基于接口文件的 `namespace` 进行分组，与 Swagger 接口列表的 tag 分组逻辑一致

2. **processDirectory 方法重构**：
   ```typescript
   // 基于 namespace 进行分组
   const groupKey = fileInfo.namespace || 'Default'
   let groupInfo = this.groupsMap.get(groupKey)
   
   if (!groupInfo) {
     groupInfo = {
       groupName: groupKey,
       groupPath: groupKey, // 使用 namespace 作为 groupPath
       files: []
     }
     this.groupsMap.set(groupKey, groupInfo)
   }
   
   groupInfo.files.push(fileInfo)
   ```

3. **getParent 方法更新**：
   ```typescript
   // 接口文件的父级是分组
   const namespace = element.options.namespace
   if (namespace) {
     const groupKey = namespace
     const groupInfo = this.groupsMap.get(groupKey)
     // ...
   }
   ```

## 技术实现细节

### 分组逻辑对比

| 特性 | Swagger 接口列表 | 修改前的本地列表 | 修改后的本地列表 |
|------|------------------|------------------|------------------|
| 分组依据 | API tags | 文件目录结构 | 接口 namespace |
| 分组键 | tag 名称 | 目录路径 | namespace 值 |
| 层级结构 | tag -> 接口 | 目录 -> 文件 | namespace -> 接口 |

### 数据结构变化

```typescript
// GroupInfo 接口保持不变
interface GroupInfo {
  groupName: string    // 现在是 namespace 值
  groupPath: string    // 现在是 namespace 值（作为唯一标识）
  files: FileHeaderInfo[]
}

// groupsMap 的键值变化
// 原来：Map<目录路径, GroupInfo>
// 现在：Map<namespace, GroupInfo>
```

## 使用说明

1. **分组显示**：接口现在按照其 `namespace` 进行分组
2. **默认分组**：没有 `namespace` 的接口会被放入 "Default" 分组
3. **按钮权限**："复制请求代码"和"保存接口"按钮只在接口项上显示，不在分组上显示
4. **批量操作**："批量复制请求代码"按钮只在分组上显示

## 兼容性说明

- 保持了原有的 `copyGroupRequests` 命令功能
- 保持了原有的数据结构接口
- 向后兼容现有的接口文件格式
- 不影响其他功能模块

## 测试建议

1. 验证分组按 namespace 正确显示
2. 验证按钮只在正确的项目类型上显示
3. 验证批量复制功能正常工作
4. 验证没有 namespace 的文件被正确归入 Default 分组