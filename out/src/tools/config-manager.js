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
exports.ConfigManager = void 0;
const vscode = __importStar(require("vscode"));
const log_1 = require("./log");
/**
 * 配置管理器 - 管理插件的高级配置选项
 */
class ConfigManager {
    /**
     * 获取配置值
     */
    static get(key, defaultValue) {
        const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
        return config.get(key, defaultValue);
    }
    /**
     * 设置配置值
     */
    static async set(key, value, target) {
        const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
        await config.update(key, value, target || vscode.ConfigurationTarget.Global);
    }
    /**
     * 获取所有配置
     */
    static getAll() {
        return vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
    }
    /**
     * 重置配置到默认值
     */
    static async resetToDefaults() {
        const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
        const inspect = config.inspect('swaggerJsonUrl');
        if (inspect?.globalValue !== undefined) {
            await config.update('swaggerJsonUrl', undefined, vscode.ConfigurationTarget.Global);
        }
        if (inspect?.workspaceValue !== undefined) {
            await config.update('swaggerJsonUrl', undefined, vscode.ConfigurationTarget.Workspace);
        }
        log_1.log.info('Configuration reset to defaults');
    }
    /**
     * 导出配置
     */
    static exportConfig() {
        const config = ConfigManager.getAll();
        const exportData = {
            swaggerJsonUrl: config.get('swaggerJsonUrl'),
            savePath: config.get('savePath'),
            showStatusbarItem: config.get('showStatusbarItem'),
            compareChanges: config.get('compareChanges'),
            reloadWhenSettingsChanged: config.get('reloadWhenSettingsChanged'),
            // 新增配置项
            enableWelcomeMessage: config.get('enableWelcomeMessage', true),
            enableCodeSnippets: config.get('enableCodeSnippets', true),
            enableSmartCompletion: config.get('enableSmartCompletion', true),
            enableCodeLens: config.get('enableCodeLens', true),
            enableApiTesting: config.get('enableApiTesting', true),
            apiStatsInStatusBar: config.get('apiStatsInStatusBar', true),
            autoUpdateApiStats: config.get('autoUpdateApiStats', true)
        };
        return JSON.stringify(exportData, null, 2);
    }
    /**
     * 导入配置
     */
    static async importConfig(configJson) {
        try {
            const configData = JSON.parse(configJson);
            for (const [key, value] of Object.entries(configData)) {
                if (value !== undefined) {
                    await ConfigManager.set(key, value);
                }
            }
            log_1.log.info('Configuration imported successfully');
            vscode.window.showInformationMessage('配置导入成功！');
        }
        catch (error) {
            log_1.log.error('Failed to import configuration:', error);
            vscode.window.showErrorMessage('配置导入失败，请检查 JSON 格式是否正确');
        }
    }
    /**
     * 验证配置
     */
    static validateConfig() {
        const errors = [];
        const config = ConfigManager.getAll();
        // 验证 swaggerJsonUrl
        const swaggerJsonUrl = config.get('swaggerJsonUrl');
        if (swaggerJsonUrl && !Array.isArray(swaggerJsonUrl)) {
            errors.push('swaggerJsonUrl 必须是数组类型');
        }
        // 验证 savePath
        const savePath = config.get('savePath');
        if (savePath && typeof savePath !== 'string') {
            errors.push('savePath 必须是字符串类型');
        }
        // 验证布尔类型配置
        const booleanConfigs = [
            'showStatusbarItem',
            'compareChanges',
            'reloadWhenSettingsChanged',
            'enableWelcomeMessage',
            'enableCodeSnippets',
            'enableSmartCompletion',
            'enableCodeLens',
            'enableApiTesting',
            'apiStatsInStatusBar',
            'autoUpdateApiStats'
        ];
        booleanConfigs.forEach(key => {
            const value = config.get(key);
            if (value !== undefined && typeof value !== 'boolean') {
                errors.push(`${key} 必须是布尔类型`);
            }
        });
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    /**
     * 获取功能开关状态
     */
    static getFeatureFlags() {
        return {
            welcomeMessage: ConfigManager.get('enableWelcomeMessage', true),
            codeSnippets: ConfigManager.get('enableCodeSnippets', true),
            smartCompletion: ConfigManager.get('enableSmartCompletion', true),
            codeLens: ConfigManager.get('enableCodeLens', true),
            apiTesting: ConfigManager.get('enableApiTesting', true),
            statusBarStats: ConfigManager.get('apiStatsInStatusBar', true),
            autoUpdateStats: ConfigManager.get('autoUpdateApiStats', true)
        };
    }
    /**
     * 注册配置变更监听器
     */
    static onConfigurationChanged(callback) {
        return vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration(ConfigManager.CONFIG_SECTION)) {
                callback(e);
            }
        });
    }
    /**
     * 打开配置设置页面
     */
    static async openSettings() {
        await vscode.commands.executeCommand('workbench.action.openSettings', ConfigManager.CONFIG_SECTION);
    }
    /**
     * 显示配置快速选择面板
     */
    static async showQuickPick() {
        const items = [
            {
                label: '⚙️ 打开设置页面',
                description: '在设置界面中配置插件选项',
                detail: 'workbench.action.openSettings'
            },
            {
                label: '📤 导出配置',
                description: '将当前配置导出为 JSON 文件',
                detail: 'export-config'
            },
            {
                label: '📥 导入配置',
                description: '从 JSON 文件导入配置',
                detail: 'import-config'
            },
            {
                label: '🔄 重置配置',
                description: '将所有配置重置为默认值',
                detail: 'reset-config'
            },
            {
                label: '✅ 验证配置',
                description: '检查当前配置是否有效',
                detail: 'validate-config'
            }
        ];
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: '选择配置操作',
            matchOnDescription: true,
            matchOnDetail: true
        });
        if (!selected)
            return;
        switch (selected.detail) {
            case 'workbench.action.openSettings':
                await ConfigManager.openSettings();
                break;
            case 'export-config':
                await ConfigManager.handleExportConfig();
                break;
            case 'import-config':
                await ConfigManager.handleImportConfig();
                break;
            case 'reset-config':
                await ConfigManager.handleResetConfig();
                break;
            case 'validate-config':
                await ConfigManager.handleValidateConfig();
                break;
        }
    }
    /**
     * 处理导出配置
     */
    static async handleExportConfig() {
        const configJson = ConfigManager.exportConfig();
        const document = await vscode.workspace.openTextDocument({
            content: configJson,
            language: 'json'
        });
        await vscode.window.showTextDocument(document);
        vscode.window.showInformationMessage('配置已导出到新文档');
    }
    /**
     * 处理导入配置
     */
    static async handleImportConfig() {
        const input = await vscode.window.showInputBox({
            prompt: '请粘贴配置 JSON 内容',
            placeHolder: '{ "swaggerJsonUrl": [...], ... }',
            validateInput: (value) => {
                try {
                    JSON.parse(value);
                    return null;
                }
                catch {
                    return '无效的 JSON 格式';
                }
            }
        });
        if (input) {
            await ConfigManager.importConfig(input);
        }
    }
    /**
     * 处理重置配置
     */
    static async handleResetConfig() {
        const confirm = await vscode.window.showWarningMessage('确定要重置所有配置到默认值吗？此操作不可撤销。', '确定', '取消');
        if (confirm === '确定') {
            await ConfigManager.resetToDefaults();
            vscode.window.showInformationMessage('配置已重置为默认值');
        }
    }
    /**
     * 处理验证配置
     */
    static async handleValidateConfig() {
        const validation = ConfigManager.validateConfig();
        if (validation.isValid) {
            vscode.window.showInformationMessage('✅ 配置验证通过，所有设置都是有效的');
        }
        else {
            const errorMessage = `❌ 配置验证失败：\n${validation.errors.join('\n')}`;
            vscode.window.showErrorMessage(errorMessage);
        }
    }
}
exports.ConfigManager = ConfigManager;
ConfigManager.CONFIG_SECTION = 'SwaggerDocToCode';
//# sourceMappingURL=config-manager.js.map