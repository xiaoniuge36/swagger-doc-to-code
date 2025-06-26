# Swagger 接口分组目录保存功能修复

## 修复概述

本次修复解决了 Swagger 接口保存时未能正确根据分组信息创建目录结构的问题。现在无论是单个接口保存还是批量分组保存，都会自动根据接口的分组信息创建相应的子目录。

## 核心问题

1. **单个接口保存**：点击接口保存按钮时，没有根据接口所属的分组创建子目录
2. **批量分组保存**：点击分组保存按钮时，子接口没有继承父分组的信息
3. **分组信息缺失**：某些情况下接口项缺少正确的分组信息

## 修复内容

### 1. 修改 `list.view.ts` 文件

#### `saveInterface` 方法优化
- 优先使用 `groupName`，如果没有则使用 `title` 作为分组名
- 过滤掉 "Default" 分组，避免创建不必要的目录
- 改进分组名清理逻辑，确保目录名的合法性

```typescript
// 根据分组信息创建目录结构
let finalSavePath = savePath

// 优先使用 groupName，如果没有则使用 title 作为分组名
const groupName = item.groupName || item.title
if (groupName && groupName !== 'Default') {
  // 清理分组名，移除特殊字符，确保可以作为目录名
  const cleanGroupName = groupName.replace(/[<>:"/\\|?*]/g, '_').trim()
  if (cleanGroupName) {
    finalSavePath = path.join(savePath, cleanGroupName)
  }
}
```

#### `saveInterfaceGroup` 方法优化
- 确保子接口继承父分组的信息
- 为每个子接口设置正确的 `groupName`

```typescript
// 为每个子接口设置正确的分组信息
for (let index = 0; index < itemChildren.length; index++) {
  const childItem = itemChildren[index]
  // 确保子接口继承父分组的信息
  if (groupItem && !childItem.groupName) {
    childItem.groupName = groupItem.title || groupItem.groupName
  }
  await this.saveInterface(childItem)
}
```

### 2. 修改 `list.cmd.ts` 文件

#### `onSelect` 方法优化
- 与 `saveInterface` 方法保持一致的分组目录创建逻辑
- 确保通过命令选择的接口也能正确创建分组目录

#### `saveInterface` 命令优化
- 添加分组信息继承逻辑，从父级获取分组信息
- 修复查看接口文件时的路径计算，包含分组目录

```typescript
// 确保接口项有正确的分组信息
if (!interfaceItem.groupName && item.options.parentKey) {
  // 从父级获取分组信息
  const listData = viewList.swaggerJsonMap.get(item.options.configItem.url) || []
  const parentGroup = listData.find((x) => x.key === item.options.parentKey)
  if (parentGroup) {
    interfaceItem.groupName = parentGroup.title || parentGroup.groupName
  }
}
```

## 功能特性

### 1. 智能分组识别
- 自动识别接口的分组信息（`groupName` 或 `title`）
- 过滤默认分组，避免创建不必要的目录
- 支持分组信息的继承机制

### 2. 目录名清理
- 自动清理分组名中的特殊字符：`<>:"/\|?*`
- 确保生成的目录名在所有操作系统上都有效
- 保持目录名的可读性

### 3. 完整的保存流程
- **单个接口保存**：自动根据分组创建子目录
- **批量分组保存**：确保所有子接口都保存到正确的分组目录
- **命令行保存**：通过命令触发的保存也支持分组目录

## 使用效果

### 保存前的目录结构
```
src/api/
├── interface1.d.ts
├── interface2.d.ts
└── interface3.d.ts
```

### 保存后的目录结构
```
src/api/
├── UserManagement/
│   ├── getUserInfo.d.ts
│   └── updateUser.d.ts
├── ProductManagement/
│   ├── getProductList.d.ts
│   └── createProduct.d.ts
└── OrderManagement/
    ├── getOrderList.d.ts
    └── updateOrderStatus.d.ts
```

## 技术细节

### 1. 分组信息来源
- `item.groupName`：接口项的分组名称
- `item.title`：接口项的标题（作为备选分组名）
- `parentGroup.title`：从父级分组继承的标题

### 2. 目录创建逻辑
- 使用 `path.join()` 确保跨平台兼容性
- 通过 `saveDocument()` 函数自动创建不存在的目录
- 支持嵌套目录结构

### 3. 错误处理
- 分组名为空时跳过目录创建
- 特殊字符清理确保目录名合法
- 保持向后兼容性，不影响现有功能

## 相关文件

- `src/views/list.view.ts` - 主要的接口保存逻辑
- `src/commands/list.cmd.ts` - 命令处理和用户交互
- `src/tools/io.ts` - 文件保存和目录创建工具

## 注意事项

1. **目录名规范**：分组名会自动清理特殊字符，确保在所有操作系统上都能正常使用
2. **向后兼容**：修改不会影响现有的接口文件，只会改变新保存接口的目录结构
3. **分组继承**：子接口会自动继承父分组的信息，确保目录结构的一致性
4. **默认分组过滤**："Default" 分组不会创建子目录，保持根目录的整洁

## 测试建议

1. 测试单个接口保存是否创建正确的分组目录
2. 测试批量分组保存是否所有子接口都保存到同一分组目录
3. 测试特殊字符分组名的处理
4. 测试没有分组信息的接口的保存行为
5. 验证查看接口文件功能是否能正确打开分组目录中的文件