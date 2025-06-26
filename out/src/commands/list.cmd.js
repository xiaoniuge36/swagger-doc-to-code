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
const template_generator_1 = require("../templates/template-generator");
/** 创建模板文件（如果不存在） */
async function createTemplateFileIfNotExists() {
    if (!tools_1.WORKSPACE_PATH) {
        tools_1.log.warn('工作区路径未找到，无法创建模板文件');
        return;
    }
    const vscodeDir = path_1.default.join(tools_1.WORKSPACE_PATH, '.vscode');
    const templatePath = path_1.default.join(vscodeDir, tools_1.TEMPLATE_FILE_NAME);
    // 检查模板文件是否已存在
    if (fs_1.default.existsSync(templatePath)) {
        tools_1.log.info('模板文件已存在，跳过创建');
        return;
    }
    try {
        // 确保.vscode目录存在
        if (!fs_1.default.existsSync(vscodeDir)) {
            fs_1.default.mkdirSync(vscodeDir, { recursive: true });
            tools_1.log.info('已创建 .vscode 目录');
        }
        // 使用模板生成器创建增强的模板内容
        const enhancedTemplateContent = template_generator_1.TemplateGenerator.generateEnhancedTemplate();
        // 写入模板文件
        fs_1.default.writeFileSync(templatePath, enhancedTemplateContent, 'utf8');
        tools_1.log.info('✅ 模板文件已自动生成', true);
        vscode_1.default.window.showInformationMessage(`🎉 接口模板已生成！\n\n文件位置: .vscode/${tools_1.TEMPLATE_FILE_NAME}\n\n您可以编辑此文件来自定义生成的接口代码格式。`, '打开模板文件').then((selection) => {
            if (selection === '打开模板文件') {
                vscode_1.default.workspace.openTextDocument(templatePath).then((doc) => {
                    vscode_1.default.window.showTextDocument(doc);
                });
            }
        });
    }
    catch (error) {
        tools_1.log.error(`创建模板文件失败: ${error}`, true);
    }
}
function registerListCommands({ viewList, viewLocal, listTreeView, localTreeView, }) {
    const commands = {
        /** 刷新 API 列表 */
        refresh: () => {
            viewList.refresh();
        },
        /** 选择接口 */
        onSelect: (e) => {
            const savePath = e.savePath || tools_1.config.extConfig.savePath || '';
            // 根据分组信息创建目录结构
            let finalSavePath = savePath;
            // 优先使用 groupName，如果没有则使用 title 作为分组名
            const groupName = e.groupName || e.title;
            if (groupName && groupName !== 'Default') {
                // 清理分组名，移除特殊字符，确保可以作为目录名
                const cleanGroupName = groupName.replace(/[<>:"/\\|?*]/g, '_').trim();
                if (cleanGroupName) {
                    finalSavePath = path_1.default.join(savePath, cleanGroupName);
                }
            }
            const filePath = path_1.default.join(tools_1.WORKSPACE_PATH || '', finalSavePath, `${e.pathName}.d.ts`);
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
            // 自动创建模板文件
            await createTemplateFileIfNotExists();
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
            console.log('cmd.list.saveInterface', item);
            switch (item.options.type) {
                case 'group':
                    // 批量保存开始提示
                    tools_1.log.info(`${tools_1.localize.getLocalize('command.saveInterface')}(${tools_1.localize.getLocalize('text.group')}) <${item.label}> 开始批量保存...`, true);
                    viewList
                        .saveInterfaceGroup(item)
                        .then(() => {
                        tools_1.log.info(`${tools_1.localize.getLocalize('command.saveInterface')}(${tools_1.localize.getLocalize('text.group')}) <${item.label}> ${tools_1.localize.getLocalize('success')}`, true);
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
                    // 确保接口项有正确的分组信息
                    if (!interfaceItem.groupName && item.options.parentKey) {
                        // 从父级获取分组信息
                        const listData = viewList.swaggerJsonMap.get(item.options.configItem.url) || [];
                        const parentGroup = listData.find((x) => x.key === item.options.parentKey);
                        if (parentGroup) {
                            interfaceItem.groupName = parentGroup.title || parentGroup.groupName;
                        }
                    }
                    viewList
                        .saveInterface(interfaceItem, undefined, item.options.configItem.url)
                        .then(() => {
                        tools_1.log.info(`${tools_1.localize.getLocalize('command.saveInterface')} <${item.label}> ${tools_1.localize.getLocalize('success')}`, true);
                        viewLocal.refresh();
                        // 提示用户根据需求修改接口文档
                        vscode_1.default.window.showInformationMessage(`🎉 接口 "${item.label}" 导入成功！\n\n💡 提示：您可以根据项目需求修改生成的接口文档，包括：\n• 调整参数类型和命名\n• 添加业务逻辑注释\n• 修改请求函数模板\n• 自定义响应数据结构`, '查看接口文件', '编辑模板配置').then((selection) => {
                            if (selection === '查看接口文件') {
                                // 打开生成的接口文件
                                const savePath = interfaceItem?.savePath || tools_1.config.extConfig.savePath || '';
                                // 使用viewList的buildGroupPath方法计算正确的文件路径
                                let finalSavePath = savePath;
                                if (interfaceItem) {
                                    const groupPathSegments = viewList.buildGroupPath(interfaceItem, item.options.configItem.url);
                                    if (groupPathSegments.length > 0) {
                                        finalSavePath = path_1.default.join(savePath, ...groupPathSegments);
                                    }
                                }
                                const filePath = path_1.default.join(tools_1.WORKSPACE_PATH || '', finalSavePath, `${interfaceItem?.pathName}.d.ts`);
                                if (fs_1.default.existsSync(filePath)) {
                                    vscode_1.default.workspace.openTextDocument(filePath).then((doc) => {
                                        vscode_1.default.window.showTextDocument(doc);
                                    });
                                }
                            }
                            else if (selection === '编辑模板配置') {
                                // 打开模板配置文件
                                const templatePath = path_1.default.join(tools_1.WORKSPACE_PATH || '', '.vscode', tools_1.TEMPLATE_FILE_NAME);
                                if (fs_1.default.existsSync(templatePath)) {
                                    vscode_1.default.workspace.openTextDocument(templatePath).then((doc) => {
                                        vscode_1.default.window.showTextDocument(doc);
                                    });
                                }
                                else {
                                    vscode_1.default.window.showWarningMessage('模板配置文件不存在，是否要立即创建？', '创建模板文件', '取消').then((selection) => {
                                        if (selection === '创建模板文件') {
                                            vscode_1.default.commands.executeCommand('cmd.local.createTemplate');
                                        }
                                    });
                                }
                            }
                        });
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