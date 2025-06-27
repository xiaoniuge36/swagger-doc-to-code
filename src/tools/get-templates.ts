import fs from 'fs'
import path from 'path'
import vscode from 'vscode'

import { WORKSPACE_PATH, TEMPLATE_FILE_NAME, CONFIG_GROUP, config, requireModule, localize } from '../tools'
import { TreeInterface, FileHeaderInfo } from '../views/local.view'

// 类型定义
export interface TreeInterfacePropertiesItem {
  [key: string]: any
}

export interface TemplateParserParams {
  defaultName: string
}

export interface TemplateBaseType {
  namespace?: (params: TreeInterface) => string
  params?: (params: TreeInterface) => string
  paramsItem?: (item: TreeInterfacePropertiesItem, params: TreeInterface) => string
  response?: (params: TreeInterface) => string
  responseItem?: (item: TreeInterfacePropertiesItem, params: TreeInterface) => string
  copyRequest?: (params: FileHeaderInfo) => string | string[]
}

export let templateConfig: TemplateBaseType = {}

const workspaceConfigPath = path.join(WORKSPACE_PATH || '', '.vscode', TEMPLATE_FILE_NAME)

/** 获取工作区模板配置 */
export function getWorkspaceTemplateConfig(): TemplateBaseType {
  if (fs.existsSync(workspaceConfigPath)) {
    templateConfig = requireModule(workspaceConfigPath)
  }

  if (templateConfig.copyRequest) {
    vscode.commands.executeCommand('setContext', `${CONFIG_GROUP}.hasCopyRequestFn`, 1)
  } else {
    vscode.commands.executeCommand('setContext', `${CONFIG_GROUP}.hasCopyRequestFn`, 0)
  }

  return templateConfig
}

getWorkspaceTemplateConfig()

/** 监听文件保存 */
vscode.workspace.onDidSaveTextDocument(({ languageId, fileName }) => {
  // 过滤非 JS 语言文件和非模板配置文件
  if (languageId !== 'javascript' && fileName !== workspaceConfigPath) return
  
  // 重新加载模板配置
  console.log('模板配置文件已保存，重新加载配置...')
  getWorkspaceTemplateConfig()
})

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
