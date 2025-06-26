/*
 * @Author: niuge 694838286@qq.com
 * @Date: 2025-06-25 22:09:05
 * @LastEditors: niuge 694838286@qq.com
 * @LastEditTime: 2025-06-26 23:40:53
 * @FilePath: \swagger-doc-to-code\src\main.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import vscode from 'vscode'
import { ViewList } from './views/list.view'
import { ViewLocal } from './views/local.view'

import { log, config, WelcomeManager, FeatureManager, ConfigManager } from './tools'
import {
  registerCommonCommands,
  registerListCommands,
  registerLocalCommands,
  registerTemplateCommands,
} from './commands'

let viewList: ViewList
let viewLocal: ViewLocal
let featureManager: FeatureManager | undefined

export function activate(ctx: vscode.ExtensionContext) {
  viewList = new ViewList()
  viewLocal = new ViewLocal(viewList)

  const { reloadWhenSettingsChanged } = config.extConfig
  // global.ctx = ctx

  const listTreeView = vscode.window.createTreeView('view.list', { treeDataProvider: viewList })
  const localTreeView = vscode.window.createTreeView('view.local', { treeDataProvider: viewLocal })

  registerCommonCommands(viewList, viewLocal)
  registerListCommands({ viewList, viewLocal, listTreeView, localTreeView })
  registerLocalCommands(viewList, viewLocal)
  registerTemplateCommands()

  // 初始化功能管理器
  featureManager = new FeatureManager(ctx)
  featureManager.initialize()
  featureManager.registerCommands()

  // 注册配置管理器命令
  ctx.subscriptions.push(
    vscode.commands.registerCommand('cmd.config.quickSetup', () => ConfigManager.showQuickPick()),
    vscode.commands.registerCommand('cmd.config.exportConfig', () => ConfigManager.handleExportConfig()),
    vscode.commands.registerCommand('cmd.config.importConfig', () => ConfigManager.handleImportConfig()),
    vscode.commands.registerCommand('cmd.config.resetConfig', () => ConfigManager.handleResetConfig())
  )

  // 初始化欢迎管理器
  const welcomeManager = new WelcomeManager(ctx)
  // 延迟显示欢迎界面，避免阻塞插件激活
  setTimeout(() => {
    welcomeManager.checkAndShowWelcome().catch(err => {
      log.error('Failed to show welcome message:', err)
    })
  }, 1000)

  // 监听 settings.json 文件变更
  if (reloadWhenSettingsChanged) {
    vscode.workspace.onDidChangeConfiguration(() => {
      viewList.onConfigurationRefresh()
      viewLocal.onConfigurationRefresh()
    })
  }

  log.info('Extension activated.')
}

// this method is called when your extension is deactivated
export function deactivate() {
  viewList?.destroy()
  viewLocal?.destroy()
  featureManager?.dispose()

  log.info('Extension deactivated.')
}
