/**
 * Swagger Doc To Code 模板配置文件
 * 此文件用于自定义生成的 TypeScript 接口代码格式
 * 更多高级用法请参考: https://github.com/xiaoniuge36/swagger-doc-to-code
 */

/**
 * 自定义命名空间名称
 * @param {Object} params - 接口参数
 * @param {string} params.groupName - 分组名称
 * @param {string} params.pathName - 路径名称
 * @param {string} params.method - 请求方法
 * @returns {string} 命名空间名称
 */
function namespace(params) {
  const { groupName, pathName, method } = params
  return `${groupName.replace(/[\-\n\s\/\\]/g, '_')}_${pathName}_${method}`
}

/**
 * 自定义参数接口
 * @param {Object} params - 接口上下文
 * @returns {string} 参数接口代码
 */
function params(params) {
  return `export interface Params {
${params.properties.map(prop => `  ${prop.name}${prop.required ? '' : '?'}: ${prop.type}`).join('\n')}
}`
}

/**
 * 自定义响应接口
 * @param {Object} params - 接口上下文
 * @returns {string} 响应接口代码
 */
function response(params) {
  return `export interface Response {
${params.properties.map(prop => `  ${prop.name}${prop.required ? '' : '?'}: ${prop.type}`).join('\n')}
}`
}

/**
 * 复制请求函数模板
 * 优化版本：生成单个请求函数，包含完整注释和类型定义
 * @param {Object} fileInfo - 文件信息
 * @param {string} fileInfo.name - 接口名称
 * @param {string} fileInfo.namespace - 命名空间
 * @param {string} fileInfo.path - 请求路径
 * @param {string} fileInfo.method - 请求方法
 * @returns {string[]} 请求函数代码行数组
 */
function copyRequest(fileInfo) {
  // 生成函数名（转换为驼峰命名）
  const functionName = fileInfo.namespace
    .replace(/[^a-zA-Z0-9]/g, '_')
    .toLowerCase()
    .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
  
  return [
    `/**`,
    ` * ${fileInfo.name || '接口请求函数'}`,
    ` * @description ${fileInfo.summary || fileInfo.name || ''}`,
    ` * @method ${fileInfo.method?.toUpperCase()}`,
    ` * @url ${fileInfo.path}`,
    ` * @param {${fileInfo.namespace}.Params} params - 请求参数`,
    ` * @param {RequestOptions} options - 请求配置选项`,
    ` * @returns {Promise<${fileInfo.namespace}.Response>} 响应数据`,
    ` */`,
    `export async function ${functionName}(params?: ${fileInfo.namespace}.Params, options?: RequestOptions): Promise<${fileInfo.namespace}.Response> {`,
    `  return request<${fileInfo.namespace}.Response>({`,
    `    url: '${fileInfo.path}',`,
    `    method: '${fileInfo.method?.toUpperCase()}',`,
    `    ${fileInfo.method?.toLowerCase() === 'get' ? 'params' : 'data'}: params,`,
    `    ...options`,
    `  })`,
    `}`,
    ``,
    `// 使用示例：`,
    `// const result = await ${functionName}({ /* 参数 */ })`,
    `// console.log(result)`,
  ]
}

// 导出配置
module.exports = {
  
  // 请求函数模板配置（优化版本）
  copyRequest,
  
  // 其他可选配置示例（已注释，根据需要启用）
  /*
  // 命名空间配置
  namespace,
  
  // 参数接口配置
  params,
  
  // 响应接口配置  
  response,
  // 自定义文件名生成规则
  fileName: (params) => {
    return `${params.groupName}-${params.pathName}`
  },
  
  // 自定义保存路径
  savePath: (params) => {
    return `./src/api/${params.groupName}`
  },
  
  // 自定义文件扩展名
  ext: '.ts',
  
  // 是否忽略某些接口
  ignore: (params) => {
    return params.path.includes('/internal/')
  }
  */
}