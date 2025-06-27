# 中文分组名称转英文优化

## 优化背景

之前的实现使用固定的映射表来转换中文分组名称，存在以下问题：
1. 映射表覆盖范围有限，遇到未定义的中文词汇时无法处理
2. 没有中文检测机制，对非中文内容也进行处理
3. 转换质量依赖于映射表的完整性

## 优化方案

### 1. 引入 pinyin-pro 库
- 添加了 `pinyin-pro` 依赖，这是一个高质量的中文转拼音库
- 准确率高达 99.846%，性能优异
- 支持多音字处理和智能分词

### 2. 智能中文检测
- 新增 `containsChinese()` 函数，使用正则表达式 `/[\u4e00-\u9fff]/` 检测中文字符
- 只有包含中文字符的字符串才进行转换处理
- 纯英文、数字等内容直接进行格式化处理

### 3. 分层转换策略

#### 第一层：常用词汇精确匹配
- 保留并扩展了常用中文词汇映射表
- 优先进行精确匹配，确保常用词汇的翻译质量
- 按词汇长度排序，优先匹配长词汇，避免短词汇覆盖长词汇的问题

#### 第二层：部分匹配替换
- 对包含常用词汇的复合词进行部分替换
- 例如："用户注册接口" → "user注册interface" → "userregisterinterface"

#### 第三层：拼音转换
- 对剩余的中文字符使用 pinyin-pro 进行拼音转换
- 配置为无声调模式，返回数组格式并用连字符连接
- 提供降级方案，当 pinyin-pro 不可用时使用 'cn' 替代

### 4. 格式化处理
- 新增 `cleanSpecialChars()` 函数统一处理特殊字符
- 替换特殊字符为连字符，合并多个连字符，移除首尾连字符
- 统一转换为小写格式

## 扩展的词汇映射表

新增了以下类别的常用词汇：

### 常用动作
- 获取 → get
- 创建 → create  
- 删除 → delete
- 更新 → update
- 查询 → query
- 登录 → login
- 注册 → register
- 等...

### 常用名词
- 接口 → interface
- 测试 → test
- 环境 → env
- 版本 → version
- 状态 → status
- 类型 → type
- 等...

## 转换效果对比

| 输入 | 优化前 | 优化后 |
|------|--------|--------|
| 用户管理 | user-management | user-management |
| 获取商品详情 | huo-quproductdetail | getproductdetail |
| 创建新订单 | chuang-jian-xinorder | createneworder |
| 删除用户信息 | shan-chuuserinfo | deleteuser-info |
| 测试API | ce-shiapi | testapi |
| UserManagement | usermanagement | usermanagement |

## 技术特点

1. **智能检测**：只对包含中文的字符串进行转换
2. **分层处理**：常用词汇 → 部分匹配 → 拼音转换
3. **高质量转换**：结合人工映射和智能拼音转换
4. **容错机制**：提供降级方案，确保功能稳定性
5. **性能优化**：按词汇长度排序，提高匹配效率

## 使用方式

```typescript
import { convertChineseToEnglish } from './tools/utils';

// 自动检测并转换
const result = convertChineseToEnglish('用户管理'); // 'user-management'
const result2 = convertChineseToEnglish('获取商品详情'); // 'getproductdetail'
const result3 = convertChineseToEnglish('UserList'); // 'userlist'
```

这次优化显著提升了中文分组名称转换的质量和覆盖范围，解决了创建中文文件夹不规范的问题。