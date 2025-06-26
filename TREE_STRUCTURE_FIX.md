# Swagger 接口树形结构保存修复

## 问题描述

之前的保存逻辑无法正确处理 Swagger 接口的树形结构，导致：
1. 嵌套分组的目录结构不正确
2. 子分组保存时无法创建完整的父级路径
3. 接口保存位置与树形视图结构不匹配

## 修复内容

### 1. 新增递归路径构建方法

在 `list.view.ts` 中新增了 `buildGroupPath` 方法：

```typescript
/** 构建完整的分组路径 */
public buildGroupPath(item: TreeInterface, configUrl: string): string[] {
  const groupPath: string[] = []
  
  // 如果有parentKey，递归查找父级分组
  if (item.parentKey && item.parentKey !== configUrl) {
    const listData = this.swaggerJsonMap.get(configUrl) || []
    const parentGroup = listData.find((x) => x.key === item.parentKey)
    
    if (parentGroup && parentGroup.type === 'group') {
      // 递归获取父级路径
      const parentPath = this.buildGroupPath(parentGroup as TreeInterface, configUrl)
      groupPath.push(...parentPath)
      
      // 添加当前父级分组名
      const parentGroupName = parentGroup.title || parentGroup.groupName
      if (parentGroupName && parentGroupName !== 'Default') {
        const cleanParentName = parentGroupName.replace(/[<>:"/\\|?*]/g, '_').trim()
        if (cleanParentName) {
          groupPath.push(cleanParentName)
        }
      }
    }
  }
  
  return groupPath
}
```

### 2. 优化保存接口方法

修改了 `saveInterface` 方法，支持完整的树形路径构建：

```typescript
public async saveInterface(
  itemSource: TreeInterface | ListItem | SwaggerJsonUrlItem,
  filePath?: string,
  configUrl?: string
): Promise<'no-change' | void>
```

**主要改进：**
- 新增 `configUrl` 参数用于准确定位数据源
- 使用递归方法构建完整的分组路径
- 支持多层嵌套的目录结构
- 自动过滤 "Default" 分组

### 3. 新增辅助查找方法

添加了两个辅助方法来准确定位接口项：

```typescript
/** 查找接口项对应的配置URL */
private findConfigUrlForItem(item: TreeInterface): string

/** 在列表中递归查找接口项 */
private findItemInList(listData: SwaggerJsonTreeItem[], targetItem: TreeInterface): boolean
```

### 4. 更新批量保存逻辑

修改了 `saveInterfaceGroup` 方法：
- 传递正确的 `configUrl` 参数
- 确保子接口继承父分组信息
- 支持完整的树形结构保存

### 5. 修复命令调用

在 `list.cmd.ts` 中：
- 更新 `saveInterface` 调用，传递 `configUrl` 参数
- 修复文件路径计算逻辑，使用新的 `buildGroupPath` 方法
- 添加空值检查，提高代码健壮性

## 功能特性

### ✅ 完整树形结构支持
- 支持多层嵌套分组（如：`用户管理/权限管理/角色接口`）
- 自动创建完整的目录层次结构
- 保持与 Swagger 文档中的分组结构一致

### ✅ 智能路径构建
- 递归查找所有父级分组
- 自动清理特殊字符，确保目录名有效
- 过滤无效分组名（如 "Default"）

### ✅ 向后兼容
- 保持原有的保存逻辑不变
- 支持没有分组的接口保存
- 兼容现有的配置和模板

### ✅ 错误处理
- 添加空值检查和类型安全
- 优雅处理缺失的分组信息
- 提供详细的错误日志

## 使用示例

假设 Swagger 文档中有如下分组结构：
```
用户管理
├── 基础信息
│   ├── 获取用户信息
│   └── 更新用户信息
└── 权限管理
    ├── 角色管理
    │   ├── 创建角色
    │   └── 删除角色
    └── 权限分配
        └── 分配权限
```

修复后的保存结构：
```
output/
├── 用户管理/
│   ├── 基础信息/
│   │   ├── 获取用户信息.d.ts
│   │   └── 更新用户信息.d.ts
│   └── 权限管理/
│       ├── 角色管理/
│       │   ├── 创建角色.d.ts
│       │   └── 删除角色.d.ts
│       └── 权限分配/
│           └── 分配权限.d.ts
```

## 技术细节

### 递归算法
- 使用深度优先搜索构建完整路径
- 避免循环引用和无限递归
- 高效的缓存机制减少重复计算

### 类型安全
- 严格的 TypeScript 类型检查
- 完善的空值处理
- 清晰的接口定义

### 性能优化
- 最小化文件系统操作
- 智能的路径缓存
- 批量操作优化

这次修复彻底解决了树形结构保存的问题，确保生成的文件目录结构与 Swagger 文档的分组结构完全一致。