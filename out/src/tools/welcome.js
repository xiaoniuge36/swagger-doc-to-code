"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WelcomeManager = void 0;
const vscode = __importStar(require("vscode"));
const log_1 = require("./log");
class WelcomeManager {
    constructor(context) {
        this.context = context;
    }
    /**
     * 检查是否需要显示欢迎界面或版本升级通知
     */
    async checkAndShowWelcome() {
        const config = this.getWelcomeConfig();
        const currentVersion = WelcomeManager.CURRENT_VERSION;
        // 检查是否是首次使用
        if (!config.lastVersion) {
            await this.showWelcomeMessage();
            this.updateWelcomeConfig({ ...config, lastVersion: currentVersion });
            return;
        }
        // 检查版本升级
        if (config.lastVersion !== currentVersion && !config.dismissedVersions.includes(currentVersion)) {
            await this.showVersionUpdateMessage(config.lastVersion, currentVersion);
            this.updateWelcomeConfig({ ...config, lastVersion: currentVersion });
        }
    }
    /**
     * 显示欢迎消息
     */
    async showWelcomeMessage() {
        const message = '🎉 欢迎使用 Swagger Doc To Code！';
        const detail = '这是一个强大的 API 文档转换工具，支持将 Swagger、OpenAPI 等格式转换为 TypeScript 类型定义。';
        const action = await vscode.window.showInformationMessage(message, {
            detail,
            modal: false
        }, '📖 查看使用指南', '⚙️ 配置数据源', '❌ 不再显示');
        switch (action) {
            case '📖 查看使用指南':
                await this.openDocumentation();
                break;
            case '⚙️ 配置数据源':
                await vscode.commands.executeCommand('cmd.list.add');
                break;
            case '❌ 不再显示':
                await this.disableWelcomeMessage();
                break;
        }
    }
    /**
     * 显示版本升级消息
     */
    async showVersionUpdateMessage(oldVersion, newVersion) {
        const message = `🚀 Swagger Doc To Code 已升级到 v${newVersion}！`;
        const detail = this.getVersionUpdateDetails(oldVersion, newVersion);
        const action = await vscode.window.showInformationMessage(message, {
            detail,
            modal: false
        }, '📋 查看更新日志', '⭐ 给个好评', '🔕 忽略此版本');
        switch (action) {
            case '📋 查看更新日志':
                await this.openChangelog();
                break;
            case '⭐ 给个好评':
                await this.openMarketplace();
                break;
            case '🔕 忽略此版本':
                await this.dismissVersion(newVersion);
                break;
        }
    }
    /**
     * 获取版本更新详情
     */
    getVersionUpdateDetails(oldVersion, newVersion) {
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
        };
        const currentUpdates = updates[newVersion] || ['常规更新和错误修复'];
        return `从 v${oldVersion} 升级到 v${newVersion}:\n\n${currentUpdates.join('\n')}`;
    }
    /**
     * 打开文档
     */
    async openDocumentation() {
        const uri = vscode.Uri.parse('https://github.com/xiaoniuge36/swagger-doc-to-code#readme');
        await vscode.env.openExternal(uri);
    }
    /**
     * 打开更新日志
     */
    async openChangelog() {
        const uri = vscode.Uri.parse('https://github.com/xiaoniuge36/swagger-doc-to-code/releases');
        await vscode.env.openExternal(uri);
    }
    /**
     * 打开市场页面
     */
    async openMarketplace() {
        const uri = vscode.Uri.parse('https://marketplace.visualstudio.com/items?itemName=niuge666.swagger-doc-to-code');
        await vscode.env.openExternal(uri);
    }
    /**
     * 禁用欢迎消息
     */
    async disableWelcomeMessage() {
        const config = this.getWelcomeConfig();
        this.updateWelcomeConfig({ ...config, showWelcome: false });
        log_1.log.info('Welcome message disabled by user');
    }
    /**
     * 忽略特定版本
     */
    async dismissVersion(version) {
        const config = this.getWelcomeConfig();
        const dismissedVersions = [...config.dismissedVersions, version];
        this.updateWelcomeConfig({ ...config, dismissedVersions });
        log_1.log.info(`Version ${version} dismissed by user`);
    }
    /**
     * 获取欢迎配置
     */
    getWelcomeConfig() {
        return this.context.globalState.get(WelcomeManager.STORAGE_KEY, {
            showWelcome: true,
            lastVersion: '',
            dismissedVersions: []
        });
    }
    /**
     * 更新欢迎配置
     */
    updateWelcomeConfig(config) {
        this.context.globalState.update(WelcomeManager.STORAGE_KEY, config);
    }
    /**
     * 重置欢迎配置（用于测试）
     */
    resetWelcomeConfig() {
        this.context.globalState.update(WelcomeManager.STORAGE_KEY, undefined);
    }
}
exports.WelcomeManager = WelcomeManager;
WelcomeManager.STORAGE_KEY = 'swaggerDocToCode.welcome';
WelcomeManager.CURRENT_VERSION = '1.0.5';
//# sourceMappingURL=welcome.js.map