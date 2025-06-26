import fs from 'fs'
import path from 'path'
import vscode from 'vscode'

import {
  WORKSPACE_PATH,
  EXT_NAME,
  config,
  localize,
  preSaveDocument,
  saveDocument,
  log,
  deleteEmptyProperty,
  TEMPLATE_FILE_NAME,
  DEFAULT_TEMPLATE_FILE_PATH,
} from '../tools'
import { openListPicker, renderToInterface } from '../core'

import { ViewList, ListItem } from '../views/list.view'
import { ViewLocal, LocalItem } from '../views/local.view'

/** 创建模板文件（如果不存在） */
async function createTemplateFileIfNotExists() {
  if (!WORKSPACE_PATH) {
    log.warn('工作区路径未找到，无法创建模板文件')
    return
  }

  const vscodeDir = path.join(WORKSPACE_PATH, '.vscode')
  const templatePath = path.join(vscodeDir, TEMPLATE_FILE_NAME)

  // 检查模板文件是否已存在
  if (fs.existsSync(templatePath)) {
    log.info('模板文件已存在，跳过创建')
    return
  }

  try {
    // 确保.vscode目录存在
    if (!fs.existsSync(vscodeDir)) {
      fs.mkdirSync(vscodeDir, { recursive: true })
      log.info('已创建 .vscode 目录')
    }

    // 读取默认模板内容
    const defaultTemplateContent = fs.readFileSync(DEFAULT_TEMPLATE_FILE_PATH, 'utf8')
    
    // 创建增强的模板内容
    const enhancedTemplateContent = `/**
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
  return \`\$\{groupName.replace(/[\\-\\n\\s\/\\\\]/g, '_')\}_\$\{pathName\}_\$\{method\}\`
}

/**
 * 自定义参数接口
 * @param {Object} params - 接口上下文
 * @returns {string} 参数接口代码
 */
function params(params) {
  return \`export interface Params {
\$\{params.properties.map(prop => \`  \$\{prop.name\}\$\{prop.required ? '' : '?'\}: \$\{prop.type\}\`).join('\\n')\}
\}\`
}

/**
 * 自定义响应接口
 * @param {Object} params - 接口上下文
 * @returns {string} 响应接口代码
 */
function response(params) {
  return \`export interface Response {
\$\{params.properties.map(prop => \`  \$\{prop.name\}\$\{prop.required ? '' : '?'\}: \$\{prop.type\}\`).join('\\n')\}
\}\`
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
    \`/**\`,
    \` * \$\{fileInfo.name || '接口请求函数'\}\`,
    \` * @description \$\{fileInfo.summary || fileInfo.name || ''\}\`,
    \` * @method \$\{fileInfo.method?.toUpperCase()\}\`,
    \` * @url \$\{fileInfo.path\}\`,
    \` * @param {\$\{fileInfo.namespace\}.Params} params - 请求参数\`,
    \` * @param {RequestOptions} options - 请求配置选项\`,
    \` * @returns {Promise<\$\{fileInfo.namespace\}.Response>} 响应数据\`,
    \` */\`,
    \`export async function \$\{functionName\}(params?: \$\{fileInfo.namespace\}.Params, options?: RequestOptions): Promise<\$\{fileInfo.namespace\}.Response> {\`,
    \`  return request<\$\{fileInfo.namespace\}.Response>({\`,
    \`    url: '\$\{fileInfo.path\}',\`,
    \`    method: '\$\{fileInfo.method?.toUpperCase()\}',\`,
    \`    \$\{fileInfo.method?.toLowerCase() === 'get' ? 'params' : 'data'\}: params,\`,
    \`    ...options\`,
    \`  })\`,
    \`}\`,
    \`\`,
    \`// 使用示例：\`,
    \`// const result = await \$\{functionName\}({ /* 参数 */ })\`,
    \`// console.log(result)\`,
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
    return \`\$\{params.groupName\}-\$\{params.pathName\}\`
  },
  
  // 自定义保存路径
  savePath: (params) => {
    return \`./src/api/\$\{params.groupName\}\`
  },
  
  // 自定义文件扩展名
  ext: '.ts',
  
  // 是否忽略某些接口
  ignore: (params) => {
    return params.path.includes('/internal/')
  }
  */
\}`

    // 写入模板文件
    fs.writeFileSync(templatePath, enhancedTemplateContent, 'utf8')
    
    log.info('✅ 模板文件已自动生成', true)
    vscode.window.showInformationMessage(
      `🎉 接口模板已生成！\n\n文件位置: .vscode/${TEMPLATE_FILE_NAME}\n\n您可以编辑此文件来自定义生成的接口代码格式。`,
      '打开模板文件'
    ).then((selection) => {
      if (selection === '打开模板文件') {
        vscode.workspace.openTextDocument(templatePath).then((doc) => {
          vscode.window.showTextDocument(doc)
        })
      }
    })
    
  } catch (error) {
    log.error(`创建模板文件失败: ${error}`, true)
  }
}

export function registerListCommands({
  viewList,
  viewLocal,
  listTreeView,
  localTreeView,
}: {
  viewList: ViewList
  viewLocal: ViewLocal
  listTreeView: vscode.TreeView<ListItem>
  localTreeView: vscode.TreeView<LocalItem>
}) {
  const commands = {
    /** 刷新 API 列表 */
    refresh: () => {
      viewList.refresh()
    },

    /** 选择接口 */
    onSelect: (e: TreeInterface) => {
      const savePath = e.savePath || config.extConfig.savePath || ''

      const filePath = path.join(WORKSPACE_PATH || '', savePath, `${e.pathName}.d.ts`)
      preSaveDocument(renderToInterface(e), filePath, true)
    },

    /** 添加 swagger 项目 */
    async add() {
      const titleText = localize.getLocalize('text.title')
      const urlText = localize.getLocalize('text.swaggerJsonUrl')
      const savePathText = localize.getLocalize('text.config.savePath')

      const url = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        title: localize.getLocalize('temp.input.placeholder', urlText),
        placeHolder: 'http://',
      })

      if (!url) {
        vscode.window.showErrorMessage(localize.getLocalize('temp.input.none', urlText))
        return
      }

      config.extConfig.swaggerJsonUrl.forEach((v) => {
        if (v.url === url) {
          log.error(localize.getLocalize('text.exist', urlText), true)
          throw new Error()
        }
      })

      const title = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        title: localize.getLocalize('temp.input.placeholder', titleText),
      })

      if (!title) {
        vscode.window.showErrorMessage(localize.getLocalize('temp.input.none', titleText))
        return
      }

      const savePath = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        title: localize.getLocalize('temp.input.placeholder', savePathText),
        placeHolder: `${config.extConfig.savePath} (${localize.getLocalize('text.canBeEmpty')})`,
      })

      const swaggerJsonUrl = Object.assign([], config.extConfig.swaggerJsonUrl || [])
      swaggerJsonUrl.push(deleteEmptyProperty({ title, url, savePath }))
      config.setCodeConfig({ swaggerJsonUrl })
      log.info(`<cmd.list.add> Add Swagger Project: [${title}]`)
      
      // 自动创建模板文件
      await createTemplateFileIfNotExists()
      
      setTimeout(() => {
        viewList.refresh()
      }, 200)
    },

    /** 搜索接口列表 (远程) */
    search() {
      openListPicker({
        title: `${EXT_NAME} - ${localize.getLocalize('command.search')} (UPDATE:${viewList.updateDate})`,
        placeholder: localize.getLocalize('text.search.placeholder'),
        before: () => viewList.getSearchList(),
      }).then((res) => {
        if (!res.source) return log.error('Picker.res.source is undefined', true)
        if (!res.configItem) return log.error('Picker.res.configItem is undefined', true)

        let hasLocalFile = false
        for (let i = 0; i < viewLocal.allSavePath.length; i++) {
          const localPath = viewLocal.allSavePath[i]
          const filePath = path.join(localPath, `${res.source.pathName}.d.ts`)
          if (fs.existsSync(filePath)) {
            const fileInfo = viewLocal.readLocalFile(filePath)
            if (fileInfo) {
              hasLocalFile = true
              localTreeView.reveal(viewLocal.renderItem(fileInfo), { expand: true, select: true })
            }
          }
        }
        if (hasLocalFile) return // 已有本地文件

        const listItem = viewList.transformToListItem(res.source, res.configItem)
        listTreeView.reveal(listItem, { expand: true, select: true }).then(() => {
          setTimeout(() => {
            commands.onSelect(res.source as unknown as TreeInterface)
          }, 100)
        })
      })
    },

    /** 保存接口至本地 (单个/批量) */
    async saveInterface(item: ListItem) {
      console.log('cmd.list.saveInterface', item)
      switch (item.options.type) {
        case 'group':
          // 批量保存开始提示
          log.info(
            `${localize.getLocalize('command.saveInterface')}(${localize.getLocalize('text.group')}) <${
              item.label
            }> 开始批量保存...`,
            true
          )
          
          viewList
            .saveInterfaceGroup(item)
            .then(() => {
              log.info(
                `${localize.getLocalize('command.saveInterface')}(${localize.getLocalize('text.group')}) <${
                  item.label
                }> ${localize.getLocalize('success')}`,
                true
              )

              viewLocal.refresh()
            })
            .catch((err) => {
              log.error(
                `${localize.getLocalize('command.saveInterface')}(${localize.getLocalize('text.group')}) <${
                  item.label
                }> ${localize.getLocalize('failed')} ${err}`,
                true
              )
            })
          break

        case 'interface':
          let interfaceItem: TreeInterface | undefined
          try {
            // @ts-ignore
            interfaceItem = item.command?.arguments[0]
          } catch (error) {
            log.error(error, true)
          }

          if (!interfaceItem) {
            return log.error('interfaceItem is undefined.', true)
          }

          viewList
            .saveInterface(interfaceItem)
            .then(() => {
              log.info(
                `${localize.getLocalize('command.saveInterface')} <${item.label}> ${localize.getLocalize('success')}`,
                true
              )
              viewLocal.refresh()
              
              // 提示用户根据需求修改接口文档
              vscode.window.showInformationMessage(
                `🎉 接口 "${item.label}" 导入成功！\n\n💡 提示：您可以根据项目需求修改生成的接口文档，包括：\n• 调整参数类型和命名\n• 添加业务逻辑注释\n• 修改请求函数模板\n• 自定义响应数据结构`,
                '查看接口文件',
                '编辑模板配置'
              ).then((selection) => {
                if (selection === '查看接口文件') {
                  // 打开生成的接口文件
                  const savePath = interfaceItem?.savePath || config.extConfig.savePath || ''
                  const filePath = path.join(WORKSPACE_PATH || '', savePath, `${interfaceItem?.pathName}.d.ts`)
                  if (fs.existsSync(filePath)) {
                    vscode.workspace.openTextDocument(filePath).then((doc) => {
                      vscode.window.showTextDocument(doc)
                    })
                  }
                } else if (selection === '编辑模板配置') {
                  // 打开模板配置文件
                  const templatePath = path.join(WORKSPACE_PATH || '', '.vscode', TEMPLATE_FILE_NAME)
                  if (fs.existsSync(templatePath)) {
                    vscode.workspace.openTextDocument(templatePath).then((doc) => {
                      vscode.window.showTextDocument(doc)
                    })
                  } else {
                    vscode.window.showWarningMessage('模板配置文件不存在，请先添加一个接口项目以自动生成模板文件。')
                  }
                }
              })
            })
            .catch((err) => {
              log.error(
                `${localize.getLocalize('command.saveInterface')} <${item.label}> ${localize.getLocalize(
                  'failed'
                )} ${err}`,
                true
              )
            })
          break

        default:
          log.warn(localize.getLocalize('error.action'), true)
          log.warn(JSON.stringify(item))
          break
      }
    },

    /** 保存文档 */
    saveInterfaceWitchDoc(doc: vscode.TextDocument) {
      const docText = doc.getText()
      saveDocument(docText, doc.fileName).then(() => {
        viewLocal.refresh()
        preSaveDocument(docText, doc.fileName) // 更新显示状态
      })
    },
  }

  for (const command in commands) {
    vscode.commands.registerCommand(`cmd.list.${command}`, commands[command])
  }
}
