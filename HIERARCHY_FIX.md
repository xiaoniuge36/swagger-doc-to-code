# 本地接口列表层级结构修复

## 问题描述

本地接口列表的层级结构与远程Swagger接口列表不一致：
- **远程结构**：根节点(root) → 分组(group) → 接口(interface)
- **本地结构（修复前）**：分组(group) → 接口(interface)

## 解决方案

### 1. 修改层级结构

将本地接口列表的层级结构调整为与远程一致的三层结构：

```
根节点(按保存路径) → 分组(按namespace) → 接口文件
```

### 2. 核心修改

#### 2.1 扩展接口定义

在 `src/views/local.view.ts` 中扩展 `ExtLocalItemOptions` 接口：

```typescript
export interface ExtLocalItemOptions {
  itemType?: 'root' | 'group' | 'interface'  // 新增 'root' 类型
  savePath?: string                          // 新增保存路径字段
  groupPath?: string
  filePath?: string
  namespace?: string
}
```

#### 2.2 修改 getChildren 方法

重构 `getChildren` 方法以支持三层结构：

```typescript
getChildren(element?: LocalItem): Thenable<LocalItem[]> {
  if (!element) {
    // 返回根节点列表（按保存路径分组）
    const rootItems = this.renderRootItems()
    return Promise.resolve(rootItems)
  }

  // 根节点下返回分组列表
  if (element.options.itemType === 'root' && element.options.savePath) {
    const groupItems = this.renderGroupsBySavePath(element.options.savePath)
    return Promise.resolve(groupItems)
  }

  // 分组下返回接口文件列表
  if (element.options.itemType === 'group' && element.options.groupPath) {
    // 过滤只显示当前根节点路径下的文件
    const parentSavePath = this.getParentSavePath(element)
    const filteredFiles = parentSavePath 
      ? groupInfo.files.filter(file => file.filePath.startsWith(parentSavePath))
      : groupInfo.files
    const interfaceItems = this.renderItems(filteredFiles)
    return Promise.resolve(interfaceItems)
  }

  return Promise.resolve([])
}
```

#### 2.3 新增渲染方法

**renderRootItems()** - 渲染根节点列表：
- 遍历所有保存路径 (`allSavePath`)
- 统计每个路径下的接口数量
- 创建根节点项目

**renderGroupsBySavePath()** - 渲染指定路径下的分组：
- 过滤只包含指定保存路径下文件的分组
- 统计每个分组在该路径下的文件数量

#### 2.4 更新 getParent 方法

扩展 `getParent` 方法以支持新的层级关系：
- 接口的父级：分组
- 分组的父级：根节点
- 根节点的父级：无

## 技术细节

### 数据结构变化

1. **根节点数据**：
   ```typescript
   {
     itemType: 'root',
     savePath: '/path/to/save/directory',
     title: '目录名称',
     subTitle: 'X 个接口'
   }
   ```

2. **分组数据**（保持不变）：
   ```typescript
   {
     itemType: 'group',
     groupPath: 'namespace_key',
     title: '分组名称',
     subTitle: 'X 个接口'
   }
   ```

3. **接口数据**（保持不变）：
   ```typescript
   {
     itemType: 'interface',
     filePath: '/path/to/interface/file.ts',
     namespace: 'namespace_value'
   }
   ```

### 层级逻辑

1. **根节点层级**：按 `allSavePath` 创建，每个保存路径对应一个根节点
2. **分组层级**：按 `namespace` 分组，但只显示包含当前根节点路径下文件的分组
3. **接口层级**：显示分组下的接口文件，但只显示当前根节点路径下的文件

## 兼容性

- 保持现有的按钮和命令功能不变
- `package.json` 中的菜单配置无需修改
- 现有的 `contextValue` 保持不变：`root`、`group`、`interface`

## 效果

修复后的本地接口列表将具有与远程Swagger接口列表一致的三层结构：

```
📁 api (根节点 - 保存路径)
├── 📂 user (分组 - namespace)
│   ├── 📄 getUserList.ts
│   └── 📄 updateUser.ts
└── 📂 order (分组 - namespace)
    ├── 📄 createOrder.ts
    └── 📄 getOrderDetail.ts
```

这样的结构更加清晰，便于用户理解和操作，同时与远程接口列表保持一致的用户体验。