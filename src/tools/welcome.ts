import * as vscode from 'vscode'
import { log } from './log'

interface WelcomeConfig {
  showWelcome: boolean
  lastVersion: string
  dismissedVersions: string[]
}

export class WelcomeManager {
  private static readonly STORAGE_KEY = 'swaggerDocToCode.welcome'
  private static readonly CURRENT_VERSION = '1.0.5'
  
  constructor(private context: vscode.ExtensionContext) {}

  /**
   * 检查是否需要显示欢迎界面或版本升级通知
   */
  async checkAndShowWelcome(): Promise<void> {
    const config = this.getWelcomeConfig()
    const currentVersion = WelcomeManager.CURRENT_VERSION
    
    // 检查是否是首次使用
    if (!config.lastVersion) {
      await this.showWelcomeMessage()
      this.updateWelcomeConfig({ ...config, lastVersion: currentVersion })
      return
    }
    
    // 检查版本升级
    if (config.lastVersion !== currentVersion && !config.dismissedVersions.includes(currentVersion)) {
      await this.showVersionUpdateMessage(config.lastVersion, currentVersion)
      this.updateWelcomeConfig({ ...config, lastVersion: currentVersion })
    }
  }

  /**
   * 显示欢迎消息
   */
  private async showWelcomeMessage(): Promise<void> {
    const message = '🎉 欢迎使用 Swagger Doc To Code！'
    const detail = '这是一个强大的 API 文档转换工具，支持将 Swagger、OpenAPI 等格式转换为 TypeScript 类型定义。'
    
    const action = await vscode.window.showInformationMessage(
      message,
      {
        detail,
        modal: false
      },
      '📖 查看使用指南',
      '⚙️ 配置数据源',
      '❌ 不再显示'
    )

    switch (action) {
      case '📖 查看使用指南':
        await this.openDocumentation()
        break
      case '⚙️ 配置数据源':
        await vscode.commands.executeCommand('cmd.list.add')
        break
      case '❌ 不再显示':
        await this.disableWelcomeMessage()
        break
    }
  }

  /**
   * 显示版本升级消息
   */
  private async showVersionUpdateMessage(oldVersion: string, newVersion: string): Promise<void> {
    const message = `🚀 Swagger Doc To Code 已升级到 v${newVersion}！`
    const detail = this.getVersionUpdateDetails(oldVersion, newVersion)
    
    const action = await vscode.window.showInformationMessage(
      message,
      {
        detail,
        modal: false
      },
      '📋 查看更新日志',
      '⭐ 给个好评',
      '🔕 忽略此版本'
    )

    switch (action) {
      case '📋 查看更新日志':
        await this.openChangelog()
        break
      case '⭐ 给个好评':
        await this.openMarketplace()
        break
      case '🔕 忽略此版本':
        await this.dismissVersion(newVersion)
        break
    }
  }

  /**
   * 获取版本更新详情
   */
  private getVersionUpdateDetails(oldVersion: string, newVersion: string): string {
    const updates = {
      '1.0.5': [
        '✨ 新增自动生成模板文件功能',
        '🎯 优化接口导入成功提示',
        '📝 完善 JSDoc 注释和使用示例',
        '🔧 修复模板字符串语法问题'
      ],
      '1.0.4': [
        '🚀 支持多种 API 文档格式',
        '📝 智能类型生成优化',
        '🎨 自定义模板功能增强'
      ]
    }
    
    const currentUpdates = updates[newVersion as keyof typeof updates] || ['常规更新和错误修复']
    return `从 v${oldVersion} 升级到 v${newVersion}:\n\n${currentUpdates.join('\n')}`
  }

  /**
   * 打开文档
   */
  private async openDocumentation(): Promise<void> {
    const uri = vscode.Uri.parse('https://github.com/xiaoniuge36/swagger-doc-to-code#readme')
    await vscode.env.openExternal(uri)
  }

  /**
   * 打开更新日志
   */
  private async openChangelog(): Promise<void> {
    const uri = vscode.Uri.parse('https://github.com/xiaoniuge36/swagger-doc-to-code/releases')
    await vscode.env.openExternal(uri)
  }

  /**
   * 打开市场页面
   */
  private async openMarketplace(): Promise<void> {
    const uri = vscode.Uri.parse('https://marketplace.visualstudio.com/items?itemName=niuge666.swagger-doc-to-code')
    await vscode.env.openExternal(uri)
  }

  /**
   * 禁用欢迎消息
   */
  private async disableWelcomeMessage(): Promise<void> {
    const config = this.getWelcomeConfig()
    this.updateWelcomeConfig({ ...config, showWelcome: false })
    log.info('Welcome message disabled by user')
  }

  /**
   * 忽略特定版本
   */
  private async dismissVersion(version: string): Promise<void> {
    const config = this.getWelcomeConfig()
    const dismissedVersions = [...config.dismissedVersions, version]
    this.updateWelcomeConfig({ ...config, dismissedVersions })
    log.info(`Version ${version} dismissed by user`)
  }

  /**
   * 获取欢迎配置
   */
  private getWelcomeConfig(): WelcomeConfig {
    return this.context.globalState.get(WelcomeManager.STORAGE_KEY, {
      showWelcome: true,
      lastVersion: '',
      dismissedVersions: []
    })
  }

  /**
   * 更新欢迎配置
   */
  private updateWelcomeConfig(config: WelcomeConfig): void {
    this.context.globalState.update(WelcomeManager.STORAGE_KEY, config)
  }

  /**
   * 重置欢迎配置（用于测试）
   */
  public resetWelcomeConfig(): void {
    this.context.globalState.update(WelcomeManager.STORAGE_KEY, undefined)
  }
}