"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLocalCommands = void 0;
const vscode_1 = __importDefault(require("vscode"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const tools_1 = require("../tools");
const template_generator_1 = require("../templates/template-generator");
function registerLocalCommands(viewList, viewLocal) {
    const commands = {
        /** 刷新本地接口列表 */
        refresh: () => viewLocal.refresh(),
        /** 更新本地接口 */
        async updateInterface(item) {
            await vscode_1.default.window.withProgress({
                location: vscode_1.default.ProgressLocation.Notification,
                title: tools_1.localize.getLocalize("text.updateButton"),
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
                return tools_1.log.error("<updateInterface> fileInfo error.", isMenuAction);
            }
            const fileName = path_1.default.basename(fileInfo.fileName, ".d.ts");
            const swaggerItem = viewList.getInterFacePathNameMap(fileName, fileInfo.savePath);
            if (!swaggerItem) {
                return tools_1.log.error("<updateInterface> swaggerItem is undefined.", isMenuAction);
            }
            viewList
                .saveInterface(swaggerItem, item.path)
                .then((res) => {
                if (res === "no-change") {
                    return tools_1.log.info(`${tools_1.localize.getLocalize("text.noChange")} <${fileInfo.name || fileInfo.title}>`, isMenuAction);
                }
                viewLocal.updateSingle(item.path);
                tools_1.log.info(`${tools_1.localize.getLocalize("command.local.updateInterface")} <${fileInfo.name || fileInfo.title}> ${tools_1.localize.getLocalize("success")}`, isMenuAction);
            })
                .catch((err) => {
                tools_1.log.error(`${tools_1.localize.getLocalize("command.local.updateInterface")} <${fileInfo.name || fileInfo.title}> ${tools_1.localize.getLocalize("failed")} ${err}`, isMenuAction);
            });
        },
        /** 更新所有本地接口 */
        updateAll() {
            if (viewLocal.localFilesMap.size <= 0)
                return tools_1.log.info(`${tools_1.localize.getLocalize("text.updateButton")}: ${tools_1.localize.getLocalize("viewsWelcome.emptyLocal")}`, true);
            const confirmText = tools_1.localize.getLocalize("text.confirm");
            const cancelText = tools_1.localize.getLocalize("text.cancel");
            vscode_1.default.window
                .showWarningMessage(`${tools_1.localize.getLocalize("text.updateButton")}: ${tools_1.localize.getLocalize("text.confirmUpdateAll")}`, confirmText, cancelText)
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
                return tools_1.log.error("<copyRequest> fileInfo error.", true);
            }
            if (tools_1.templateConfig.copyRequest) {
                const str = tools_1.templateConfig.copyRequest(fileInfo);
                if (typeof str === "string") {
                    vscode_1.default.env.clipboard.writeText(str);
                }
                else {
                    vscode_1.default.env.clipboard.writeText(str.join("\n"));
                }
                tools_1.log.info(`${tools_1.localize.getLocalize("command.local.copyRequest")}${tools_1.localize.getLocalize("success")} <${fileInfo.name}>`, true);
            }
            else {
                tools_1.log.error("<copyRequest> copyRequest is undefined.", true);
            }
        },
        /** 批量复制分组请求代码 */
        copyGroupRequests(e) {
            // 获取分组信息
            let groupPath;
            let groupInfo;
            if (e.options && e.options.itemType === 'group') {
                // 从分组节点获取路径
                groupPath = e.options.groupPath;
                groupInfo = viewLocal.groupsMap.get(groupPath);
            }
            else {
                // 兼容旧的调用方式
                groupPath = e.path || e.options?.filePath;
                if (groupPath) {
                    // 如果是文件路径，获取其目录
                    if (fs_1.default.existsSync(groupPath) && fs_1.default.statSync(groupPath).isFile()) {
                        groupPath = path_1.default.dirname(groupPath);
                    }
                    groupInfo = viewLocal.groupsMap.get(groupPath);
                }
            }
            if (!groupInfo || !groupInfo.files || groupInfo.files.length === 0) {
                return tools_1.log.error("<copyGroupRequests> 分组下没有找到接口文件", true);
            }
            if (!tools_1.templateConfig.copyRequest) {
                return tools_1.log.error("<copyGroupRequests> copyRequest模板未配置，请先添加模板配置文件", true);
            }
            const requestCodes = [];
            let successCount = 0;
            groupInfo.files.forEach((fileInfo) => {
                try {
                    const str = tools_1.templateConfig.copyRequest?.(fileInfo);
                    if (str) {
                        if (typeof str === "string") {
                            requestCodes.push(str);
                        }
                        else {
                            requestCodes.push(str.join("\n"));
                        }
                    }
                    successCount++;
                }
                catch (error) {
                    tools_1.log.error(`<copyGroupRequests> 处理文件失败: ${fileInfo.name} - ${error}`);
                }
            });
            if (requestCodes.length > 0) {
                const allRequestsCode = requestCodes.join("\n\n");
                vscode_1.default.env.clipboard.writeText(allRequestsCode);
                tools_1.log.info(`批量复制请求代码成功！已复制 ${successCount} 个接口的请求代码到剪贴板`, true);
            }
            else {
                tools_1.log.error("<copyGroupRequests> 没有成功生成任何请求代码", true);
            }
        },
        /** 一键添加模板配置文件 */
        createTemplate() {
            const vscodeConfigFolderPath = path_1.default.join(tools_1.WORKSPACE_PATH || "", ".vscode");
            const workspaceConfigPath = path_1.default.join(vscodeConfigFolderPath, "swagger-doc-to-code.template.js");
            // 检查文件是否已存在
            if (fs_1.default.existsSync(workspaceConfigPath)) {
                vscode_1.default.window
                    .showWarningMessage("模板配置文件已存在，是否要覆盖？", "覆盖", "取消")
                    .then((selection) => {
                    if (selection === "覆盖") {
                        commands.doCreateTemplate(vscodeConfigFolderPath, workspaceConfigPath);
                    }
                });
            }
            else {
                commands.doCreateTemplate(vscodeConfigFolderPath, workspaceConfigPath);
            }
        },
        /** 执行创建模板文件 */
        doCreateTemplate(vscodeConfigFolderPath, workspaceConfigPath) {
            // 确保.vscode目录存在
            if (!fs_1.default.existsSync(vscodeConfigFolderPath)) {
                try {
                    fs_1.default.mkdirSync(vscodeConfigFolderPath, { recursive: true });
                }
                catch (error) {
                    tools_1.log.error(`创建.vscode目录失败: ${error}`, true);
                    return;
                }
            }
            // 复制默认模板文件
            try {
                const defaultTemplatePath = path_1.default.join(__dirname, "../../templates/new.template.js");
                if (fs_1.default.existsSync(defaultTemplatePath)) {
                    const templateContent = fs_1.default.readFileSync(defaultTemplatePath, "utf-8");
                    fs_1.default.writeFileSync(workspaceConfigPath, templateContent);
                }
                else {
                    // 如果默认模板不存在，使用模板生成器创建基础模板
                    const basicTemplate = template_generator_1.TemplateGenerator.generateBasicTemplate();
                    fs_1.default.writeFileSync(workspaceConfigPath, basicTemplate);
                }
                vscode_1.default.window
                    .showInformationMessage("🎉 模板配置文件创建成功！", "打开文件", "查看文档")
                    .then((selection) => {
                    if (selection === "打开文件") {
                        vscode_1.default.workspace
                            .openTextDocument(workspaceConfigPath)
                            .then((doc) => {
                            vscode_1.default.window.showTextDocument(doc);
                        });
                    }
                    else if (selection === "查看文档") {
                        vscode_1.default.env.openExternal(vscode_1.default.Uri.parse("https://github.com/xiaoniuge36/swagger-doc-to-code#自定义模板"));
                    }
                });
                tools_1.log.info("模板配置文件创建成功: .vscode/swagger-doc-to-code.template.js", true);
            }
            catch (error) {
                tools_1.log.error(`创建模板配置文件失败: ${error}`, true);
            }
        },
    };
    for (const command in commands) {
        vscode_1.default.commands.registerCommand(`cmd.local.${command}`, commands[command]);
    }
}
exports.registerLocalCommands = registerLocalCommands;
//# sourceMappingURL=local.cmd.js.map