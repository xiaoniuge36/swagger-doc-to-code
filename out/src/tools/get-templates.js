"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkspaceTemplateConfig = exports.templateConfig = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const vscode_1 = __importDefault(require("vscode"));
const tools_1 = require("../tools");
exports.templateConfig = {};
const workspaceConfigPath = path_1.default.join(tools_1.WORKSPACE_PATH || '', '.vscode', tools_1.TEMPLATE_FILE_NAME);
/** 获取工作区模板配置 */
function getWorkspaceTemplateConfig() {
    if (fs_1.default.existsSync(workspaceConfigPath)) {
        exports.templateConfig = (0, tools_1.requireModule)(workspaceConfigPath);
    }
    if (exports.templateConfig.copyRequest) {
        vscode_1.default.commands.executeCommand('setContext', `${tools_1.CONFIG_GROUP}.hasCopyRequestFn`, 1);
    }
    else {
        vscode_1.default.commands.executeCommand('setContext', `${tools_1.CONFIG_GROUP}.hasCopyRequestFn`, 0);
    }
    return exports.templateConfig;
}
exports.getWorkspaceTemplateConfig = getWorkspaceTemplateConfig;
getWorkspaceTemplateConfig();
/** 监听文件保存 */
vscode_1.default.workspace.onDidSaveTextDocument(({ languageId, fileName }) => {
    // 过滤非 JS 语言文件和非模板配置文件
    if (languageId !== 'javascript' && fileName !== workspaceConfigPath)
        return;
    // 重新加载模板配置
    console.log('模板配置文件已保存，重新加载配置...');
    getWorkspaceTemplateConfig();
});
/** 监听文件创建 */
vscode_1.default.workspace.onDidCreateFiles((event) => {
    event.files.forEach((file) => {
        if (file.fsPath === workspaceConfigPath) {
            console.log('模板配置文件已创建，重新加载配置...');
            // 延迟一下确保文件写入完成
            setTimeout(() => {
                getWorkspaceTemplateConfig();
            }, 100);
        }
    });
});
//# sourceMappingURL=get-templates.js.map