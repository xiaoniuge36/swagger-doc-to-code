"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerListCommands = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const vscode_1 = __importDefault(require("vscode"));
const tools_1 = require("../tools");
const core_1 = require("../core");
function registerListCommands({ viewList, viewLocal, listTreeView, localTreeView, }) {
    const commands = {
        /** 刷新 API 列表 */
        refresh: () => {
            viewList.refresh();
        },
        /** 选择接口 */
        onSelect: (e) => {
            const savePath = e.savePath || tools_1.config.extConfig.savePath || '';
            const filePath = path_1.default.join(tools_1.WORKSPACE_PATH || '', savePath, `${e.pathName}.d.ts`);
            (0, tools_1.preSaveDocument)((0, core_1.renderToInterface)(e), filePath, true);
        },
        /** 添加 swagger 项目 */
        async add() {
            const titleText = tools_1.localize.getLocalize('text.title');
            const urlText = tools_1.localize.getLocalize('text.swaggerJsonUrl');
            const savePathText = tools_1.localize.getLocalize('text.config.savePath');
            const url = await vscode_1.default.window.showInputBox({
                ignoreFocusOut: true,
                title: tools_1.localize.getLocalize('temp.input.placeholder', urlText),
                placeHolder: 'http://',
            });
            if (!url) {
                vscode_1.default.window.showErrorMessage(tools_1.localize.getLocalize('temp.input.none', urlText));
                return;
            }
            tools_1.config.extConfig.swaggerJsonUrl.forEach((v) => {
                if (v.url === url) {
                    tools_1.log.error(tools_1.localize.getLocalize('text.exist', urlText), true);
                    throw new Error();
                }
            });
            const title = await vscode_1.default.window.showInputBox({
                ignoreFocusOut: true,
                title: tools_1.localize.getLocalize('temp.input.placeholder', titleText),
            });
            if (!title) {
                vscode_1.default.window.showErrorMessage(tools_1.localize.getLocalize('temp.input.none', titleText));
                return;
            }
            const savePath = await vscode_1.default.window.showInputBox({
                ignoreFocusOut: true,
                title: tools_1.localize.getLocalize('temp.input.placeholder', savePathText),
                placeHolder: `${tools_1.config.extConfig.savePath} (${tools_1.localize.getLocalize('text.canBeEmpty')})`,
            });
            const swaggerJsonUrl = Object.assign([], tools_1.config.extConfig.swaggerJsonUrl || []);
            swaggerJsonUrl.push((0, tools_1.deleteEmptyProperty)({ title, url, savePath }));
            tools_1.config.setCodeConfig({ swaggerJsonUrl });
            tools_1.log.info(`<cmd.list.add> Add Swagger Project: [${title}]`);
            setTimeout(() => {
                viewList.refresh();
            }, 200);
        },
        /** 搜索接口列表 (远程) */
        search() {
            (0, core_1.openListPicker)({
                title: `${tools_1.EXT_NAME} - ${tools_1.localize.getLocalize('command.search')} (UPDATE:${viewList.updateDate})`,
                placeholder: tools_1.localize.getLocalize('text.search.placeholder'),
                before: () => viewList.getSearchList(),
            }).then((res) => {
                if (!res.source)
                    return tools_1.log.error('Picker.res.source is undefined', true);
                if (!res.configItem)
                    return tools_1.log.error('Picker.res.configItem is undefined', true);
                let hasLocalFile = false;
                for (let i = 0; i < viewLocal.allSavePath.length; i++) {
                    const localPath = viewLocal.allSavePath[i];
                    const filePath = path_1.default.join(localPath, `${res.source.pathName}.d.ts`);
                    if (fs_1.default.existsSync(filePath)) {
                        const fileInfo = viewLocal.readLocalFile(filePath);
                        if (fileInfo) {
                            hasLocalFile = true;
                            localTreeView.reveal(viewLocal.renderItem(fileInfo), { expand: true, select: true });
                        }
                    }
                }
                if (hasLocalFile)
                    return; // 已有本地文件
                const listItem = viewList.transformToListItem(res.source, res.configItem);
                listTreeView.reveal(listItem, { expand: true, select: true }).then(() => {
                    setTimeout(() => {
                        commands.onSelect(res.source);
                    }, 100);
                });
            });
        },
        /** 保存接口至本地 (单个/批量) */
        async saveInterface(item) {
            switch (item.options.type) {
                case 'group':
                    viewList
                        .saveInterfaceGroup(item)
                        .then(() => {
                        tools_1.log.info(`${tools_1.localize.getLocalize('command.saveInterface')}(${tools_1.localize.getLocalize('text.group')}) <${item.label}> ${tools_1.localize.getLocalize('success')}`, false);
                        viewLocal.refresh();
                    })
                        .catch((err) => {
                        tools_1.log.error(`${tools_1.localize.getLocalize('command.saveInterface')}(${tools_1.localize.getLocalize('text.group')}) <${item.label}> ${tools_1.localize.getLocalize('failed')} ${err}`, true);
                    });
                    break;
                case 'interface':
                    let interfaceItem;
                    try {
                        // @ts-ignore
                        interfaceItem = item.command?.arguments[0];
                    }
                    catch (error) {
                        tools_1.log.error(error, true);
                    }
                    if (!interfaceItem) {
                        return tools_1.log.error('interfaceItem is undefined.', true);
                    }
                    viewList
                        .saveInterface(interfaceItem)
                        .then(() => {
                        tools_1.log.info(`${tools_1.localize.getLocalize('command.saveInterface')} <${item.label}> ${tools_1.localize.getLocalize('success')}`, true);
                        viewLocal.refresh();
                    })
                        .catch((err) => {
                        tools_1.log.error(`${tools_1.localize.getLocalize('command.saveInterface')} <${item.label}> ${tools_1.localize.getLocalize('failed')} ${err}`, true);
                    });
                    break;
                default:
                    tools_1.log.warn(tools_1.localize.getLocalize('error.action'), true);
                    tools_1.log.warn(JSON.stringify(item));
                    break;
            }
        },
        /** 保存文档 */
        saveInterfaceWitchDoc(doc) {
            const docText = doc.getText();
            (0, tools_1.saveDocument)(docText, doc.fileName).then(() => {
                viewLocal.refresh();
                (0, tools_1.preSaveDocument)(docText, doc.fileName); // 更新显示状态
            });
        },
    };
    for (const command in commands) {
        vscode_1.default.commands.registerCommand(`cmd.list.${command}`, commands[command]);
    }
}
exports.registerListCommands = registerListCommands;
//# sourceMappingURL=list.cmd.js.map