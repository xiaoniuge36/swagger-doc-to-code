"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCommonCommands = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const vscode_1 = __importDefault(require("vscode"));
const tools_1 = require("../tools");
function registerCommonCommands(viewList, viewLocal) {
    const commands = {
        // 设置
        setting() {
            if (tools_1.WORKSPACE_PATH) {
                const { swaggerJsonUrl, savePath } = tools_1.config.extConfig;
                if (!swaggerJsonUrl || !swaggerJsonUrl.length) {
                    tools_1.config.setCodeConfig({ swaggerJsonUrl: [] });
                }
                if (!savePath) {
                    tools_1.config.setCodeConfig({ savePath: '' });
                }
                tools_1.log.info('open-workspace-settings');
                vscode_1.default.workspace.openTextDocument(path_1.default.join(tools_1.WORKSPACE_PATH, '.vscode/settings.json')).then((doc) => {
                    vscode_1.default.window.showTextDocument(doc);
                });
            }
            else {
                vscode_1.default.window.showWarningMessage(tools_1.localize.getLocalize('text.noWorkspace'));
            }
        },
        /** 打开外部链接 */
        openLink(item) {
            const { configItem } = item.options;
            const link = configItem.link || configItem.url;
            vscode_1.default.env.openExternal(vscode_1.default.Uri.parse(link));
        },
        /** 打开本地文件 */
        openFile(path) {
            if (!path)
                return tools_1.log.error(tools_1.localize.getLocalize('error.path'), true);
            vscode_1.default.workspace.openTextDocument(path).then((doc) => {
                vscode_1.default.window.showTextDocument(doc);
            });
        },
        /** 删除本地文件 */
        deleteFile(path) {
            const pathH = typeof path === 'string' ? path : path.options.filePath;
            if (!pathH)
                return tools_1.log.error(tools_1.localize.getLocalize('error.path'), true);
            const confirmText = tools_1.localize.getLocalize('text.confirm');
            const cancelText = tools_1.localize.getLocalize('text.cancel');
            vscode_1.default.window
                .showWarningMessage(tools_1.localize.getLocalize('text.confirmDeleteFile'), confirmText, cancelText)
                .then((res) => {
                if (res === confirmText) {
                    try {
                        fs_1.default.unlinkSync(pathH);
                        tools_1.log.info(`Remove file: ${pathH}`);
                        viewLocal.refresh();
                    }
                    catch (error) {
                        tools_1.log.error(error, true);
                    }
                }
            });
        },
    };
    for (const command in commands) {
        vscode_1.default.commands.registerCommand(`cmd.common.${command}`, commands[command]);
    }
}
exports.registerCommonCommands = registerCommonCommands;
//# sourceMappingURL=common.cmd.js.map