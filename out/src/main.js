"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
/*
 * @Author: niuge 694838286@qq.com
 * @Date: 2025-06-25 22:09:05
 * @LastEditors: niuge 694838286@qq.com
 * @LastEditTime: 2025-06-26 23:40:53
 * @FilePath: \swagger-doc-to-code\src\main.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const vscode_1 = __importDefault(require("vscode"));
const list_view_1 = require("./views/list.view");
const local_view_1 = require("./views/local.view");
const tools_1 = require("./tools");
const commands_1 = require("./commands");
let viewList;
let viewLocal;
let featureManager;
function activate(ctx) {
    viewList = new list_view_1.ViewList();
    viewLocal = new local_view_1.ViewLocal(viewList);
    const { reloadWhenSettingsChanged } = tools_1.config.extConfig;
    // global.ctx = ctx
    const listTreeView = vscode_1.default.window.createTreeView('view.list', { treeDataProvider: viewList });
    const localTreeView = vscode_1.default.window.createTreeView('view.local', { treeDataProvider: viewLocal });
    (0, commands_1.registerCommonCommands)(viewList, viewLocal);
    (0, commands_1.registerListCommands)({ viewList, viewLocal, listTreeView, localTreeView });
    (0, commands_1.registerLocalCommands)(viewList, viewLocal);
    (0, commands_1.registerTemplateCommands)();
    // 初始化功能管理器
    featureManager = new tools_1.FeatureManager(ctx);
    featureManager.initialize();
    featureManager.registerCommands();
    // 注册配置管理器命令
    ctx.subscriptions.push(vscode_1.default.commands.registerCommand('cmd.config.quickSetup', () => tools_1.ConfigManager.showQuickPick()), vscode_1.default.commands.registerCommand('cmd.config.exportConfig', () => tools_1.ConfigManager.handleExportConfig()), vscode_1.default.commands.registerCommand('cmd.config.importConfig', () => tools_1.ConfigManager.handleImportConfig()), vscode_1.default.commands.registerCommand('cmd.config.resetConfig', () => tools_1.ConfigManager.handleResetConfig()));
    // 初始化欢迎管理器
    const welcomeManager = new tools_1.WelcomeManager(ctx);
    // 延迟显示欢迎界面，避免阻塞插件激活
    setTimeout(() => {
        welcomeManager.checkAndShowWelcome().catch(err => {
            tools_1.log.error('Failed to show welcome message:', err);
        });
    }, 1000);
    // 监听 settings.json 文件变更
    if (reloadWhenSettingsChanged) {
        vscode_1.default.workspace.onDidChangeConfiguration(() => {
            viewList.onConfigurationRefresh();
            viewLocal.onConfigurationRefresh();
        });
    }
    tools_1.log.info('Extension activated.');
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
    viewList?.destroy();
    viewLocal?.destroy();
    featureManager?.dispose();
    tools_1.log.info('Extension deactivated.');
}
exports.deactivate = deactivate;
//# sourceMappingURL=main.js.map