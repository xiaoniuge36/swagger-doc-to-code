"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLocalCommands = void 0;
const vscode_1 = __importDefault(require("vscode"));
const path_1 = __importDefault(require("path"));
const tools_1 = require("../tools");
function registerLocalCommands(viewList, viewLocal) {
    const commands = {
        /** 刷新本地接口列表 */
        refresh: () => viewLocal.refresh(),
        /** 更新本地接口 */
        async updateInterface(item) {
            await vscode_1.default.window.withProgress({
                location: vscode_1.default.ProgressLocation.Notification,
                title: tools_1.localize.getLocalize('text.updateButton'),
                cancellable: false,
            }, (progress) => {
                progress.report({ increment: -1 });
                return viewList._refresh();
            });
            let fileInfo = item;
            let isMenuAction = false;
            if (!item.fileName) {
                isMenuAction = true;
                if (item.options) {
                    fileInfo = item.options;
                }
                // 标题栏按钮
                if (item.path || item.options?.filePath) {
                    // @ts-ignore
                    fileInfo = viewLocal.readLocalFile(item.path || item.options.filePath);
                }
            }
            if (!fileInfo || !fileInfo.fileName) {
                return tools_1.log.error('<updateInterface> fileInfo error.', isMenuAction);
            }
            const fileName = path_1.default.basename(fileInfo.fileName, '.d.ts');
            const swaggerItem = viewList.getInterFacePathNameMap(fileName, fileInfo.savePath);
            if (!swaggerItem) {
                return tools_1.log.error('<updateInterface> swaggerItem is undefined.', isMenuAction);
            }
            viewList
                .saveInterface(swaggerItem, item.path)
                .then((res) => {
                if (res === 'no-change') {
                    return tools_1.log.info(`${tools_1.localize.getLocalize('text.noChange')} <${fileInfo.name || fileInfo.title}>`, isMenuAction);
                }
                viewLocal.updateSingle(item.path);
                tools_1.log.info(`${tools_1.localize.getLocalize('command.local.updateInterface')} <${fileInfo.name || fileInfo.title}> ${tools_1.localize.getLocalize('success')}`, isMenuAction);
            })
                .catch((err) => {
                tools_1.log.error(`${tools_1.localize.getLocalize('command.local.updateInterface')} <${fileInfo.name || fileInfo.title}> ${tools_1.localize.getLocalize('failed')} ${err}`, isMenuAction);
            });
        },
        /** 更新所有本地接口 */
        updateAll() {
            if (viewLocal.localFilesMap.size <= 0)
                return tools_1.log.info(`${tools_1.localize.getLocalize('text.updateButton')}: ${tools_1.localize.getLocalize('viewsWelcome.emptyLocal')}`, true);
            const confirmText = tools_1.localize.getLocalize('text.confirm');
            const cancelText = tools_1.localize.getLocalize('text.cancel');
            vscode_1.default.window
                .showWarningMessage(`${tools_1.localize.getLocalize('text.updateButton')}: ${tools_1.localize.getLocalize('text.confirmUpdateAll')}`, confirmText, cancelText)
                .then((res) => {
                if (res === confirmText) {
                    viewLocal.updateAll();
                }
            });
        },
        /** 复制请求代码 */
        copyRequest(e) {
            const filePath = e.path || e.options.filePath;
            const fileInfo = viewLocal.readLocalFile(filePath);
            if (!fileInfo) {
                return tools_1.log.error('<copyRequest> fileInfo error.', true);
            }
            if (tools_1.templateConfig.copyRequest) {
                const str = tools_1.templateConfig.copyRequest(fileInfo);
                if (typeof str === 'string') {
                    vscode_1.default.env.clipboard.writeText(str);
                }
                else {
                    vscode_1.default.env.clipboard.writeText(str.join('\n'));
                }
                tools_1.log.info(`${tools_1.localize.getLocalize('command.local.copyRequest')}${tools_1.localize.getLocalize('success')} <${fileInfo.name}>`, true);
            }
            else {
                tools_1.log.error('<copyRequest> copyRequest is undefined.', true);
            }
        },
    };
    for (const command in commands) {
        vscode_1.default.commands.registerCommand(`cmd.local.${command}`, commands[command]);
    }
}
exports.registerLocalCommands = registerLocalCommands;
//# sourceMappingURL=local.cmd.js.map