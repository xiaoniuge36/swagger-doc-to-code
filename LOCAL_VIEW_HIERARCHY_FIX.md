# 本地接口列表层级结构修复

## 问题描述

用户反馈本地接口列表显示不正确，每个添加的接口都和远程接口列表的三层结构不符。具体问题：
- 接口被错误地当作分组处理
- 缺少了分组这一层
- 应该是：根节点 → 分组 → 接口，但实际显示为：根节点 → 接口

## 根本原因分析

1. **分组信息重建问题**：`refactorLocalFilesList` 方法只是简单地将文件添加到列表中，但没有重新构建 `groupsMap`，导致分组信息丢失。

2. **本地配置文件支持缺失**：本地视图没有读取 `local.config.json` 中的配置，无法正确加载用户自定义的接口文件路径。

3. **类型定义冲突**：`LocalConfig` 接口与 `CodeConfig` 接口的 `savePath` 属性存在冲突。

## 修复方案

### 1. 修复分组信息重建逻辑

在 `refactorLocalFilesList` 方法中添加分组信息的重新构建：

```typescript
public refactorLocalFilesList() {
  this.localFilesList = []
  this.groupsMap.clear() // 清空分组信息
  
  this.localFilesMap.forEach((val) => {
    this.localFilesList.push(val)
    
    // 重新构建分组信息
    const groupKey = val.namespace || 'Default'
    let groupInfo = this.groupsMap.get(groupKey)
    
    if (!groupInfo) {
      groupInfo = {
        groupName: groupKey,
        groupPath: groupKey,
        files: []
      }
      this.groupsMap.set(groupKey, groupInfo)
    }
    
    groupInfo.files.push(val)
  })
  
  this._onDidChangeTreeData.fire(undefined)
}
```

### 2. 添加本地配置文件支持

修改 `getAllSavePath` 方法，使其能够读取 `local.config.json` 中的配置：

```typescript
getAllSavePath() {
  const { savePath, swaggerJsonUrl } = config.extConfig
  const localConfig = config.getLocalConfig()
  const allSavePath = [WORKSPACE_PATH ? path.resolve(WORKSPACE_PATH, savePath) : savePath]

  // 添加本地配置文件中的savePath
  if (localConfig.localSavePath) {
    allSavePath.push(WORKSPACE_PATH ? path.resolve(WORKSPACE_PATH, localConfig.localSavePath) : localConfig.localSavePath)
  }

  swaggerJsonUrl.forEach((v) => {
    if (v.savePath) {
      allSavePath.push(WORKSPACE_PATH ? path.resolve(WORKSPACE_PATH, v.savePath) : v.savePath)
    }
  })

  return allSavePath
}
```

### 3. 解决类型定义冲突

更新 `LocalConfig` 接口，使用不同的属性名避免冲突：

```typescript
export interface LocalConfig {
  localSavePath?: string
}
```

## 测试验证

1. 创建了示例接口文件结构：
   ```
   interfaces/
   ├── user/
   │   ├── getUserList.ts (namespace: user)
   │   └── updateUser.ts (namespace: user)
   └── order/
       ├── createOrder.ts (namespace: order)
       └── getOrderDetail.ts (namespace: order)
   ```

2. 配置 `local.config.json`：
   ```json
   {
     "localSavePath": "d:\\programming\\a-project\\swagger-doc-to-code\\interfaces"
   }
   ```

3. 编译项目成功，无错误。

## 修复效果

修复后的本地接口列表将正确显示三层结构：
- **根节点**：显示保存路径，统计该路径下的接口总数
- **分组**：按 `namespace` 分组，显示分组名称和该分组下的接口数量
- **接口**：显示具体的接口文件，包含接口名称、更新时间、命名空间和文件路径

这样就与远程接口列表保持了一致的层级结构，解决了用户反馈的问题。