"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalItem = exports.ViewLocal = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const vscode_1 = __importDefault(require("vscode"));
const core_1 = require("../core");
const tools_1 = require("../tools");
class ViewLocal extends core_1.BaseTreeProvider {
    constructor(viewList) {
        super();
        this.statusBarItem = vscode_1.default.window.createStatusBarItem();
        this.localFilesList = [];
        this.localFilesMap = new Map();
        this.groupsMap = new Map();
        // private localPath = path.resolve(WORKSPACE_PATH || '', config.extConfig.savePath)
        this.allSavePath = this.getAllSavePath();
        this.viewList = viewList;
        this.initLocalFiles();
        this.initStatusBarItem();
        /** 监听文件保存 */
        vscode_1.default.workspace.onDidSaveTextDocument(({ languageId, fileName }) => {
            // 过滤非 TS 语言文件
            if (languageId !== 'typescript')
                return;
            let isSavePath = false;
            for (let i = 0; i < this.allSavePath.length; i++) {
                const savePath = this.allSavePath[i];
                if (fileName.includes(savePath)) {
                    isSavePath = true;
                    continue;
                }
            }
            if (!isSavePath)
                return;
            this.updateSingle(fileName);
        });
    }
    /** 获取所有本地文件保存路径 */
    getAllSavePath() {
        const { savePath, swaggerJsonUrl } = tools_1.config.extConfig;
        const localConfig = tools_1.config.getLocalConfig();
        const allSavePath = [tools_1.WORKSPACE_PATH ? path_1.default.resolve(tools_1.WORKSPACE_PATH, savePath) : savePath];
        // 添加本地配置文件中的savePath
        if (localConfig.localSavePath) {
            allSavePath.push(tools_1.WORKSPACE_PATH ? path_1.default.resolve(tools_1.WORKSPACE_PATH, localConfig.localSavePath) : localConfig.localSavePath);
        }
        swaggerJsonUrl.forEach((v) => {
            if (v.savePath) {
                allSavePath.push(tools_1.WORKSPACE_PATH ? path_1.default.resolve(tools_1.WORKSPACE_PATH, v.savePath) : v.savePath);
            }
        });
        return allSavePath;
    }
    /** 初始化本地文件 */
    initLocalFiles() {
        this.localFilesMap.clear();
        this.groupsMap.clear();
        const localFiles = [];
        this.allSavePath.forEach((savePath) => {
            if (fs_1.default.existsSync(savePath)) {
                this.processDirectory(savePath);
            }
            else {
                tools_1.log.warn('<initLocalFiles> localPath does not exist');
            }
        });
        // 从 localFilesMap 中提取文件路径列表
        this.localFilesMap.forEach((_, filePath) => {
            localFiles.push(filePath);
        });
        // TAG setContext 写入本地文件目录
        vscode_1.default.commands.executeCommand('setContext', `${tools_1.CONFIG_GROUP}.localFiles`, localFiles);
        this.refactorLocalFilesList();
    }
    /** 递归处理目录，构建基于 namespace 的分组结构 */
    processDirectory(dirPath) {
        if (!fs_1.default.existsSync(dirPath) || !fs_1.default.statSync(dirPath).isDirectory()) {
            return;
        }
        try {
            const files = fs_1.default.readdirSync(dirPath);
            files.forEach(file => {
                const filePath = path_1.default.join(dirPath, file);
                const stat = fs_1.default.statSync(filePath);
                if (stat.isDirectory()) {
                    // 递归处理子目录
                    this.processDirectory(filePath);
                }
                else if (file.endsWith('.ts') || file.endsWith('.d.ts')) {
                    // 处理 TypeScript 文件和定义文件
                    const fileInfo = this.readLocalFile(filePath);
                    if (fileInfo) {
                        this.localFilesMap.set(filePath, fileInfo);
                        // 基于 namespace 进行分组
                        const groupKey = fileInfo.namespace || 'Default';
                        let groupInfo = this.groupsMap.get(groupKey);
                        if (!groupInfo) {
                            groupInfo = {
                                groupName: groupKey,
                                groupPath: groupKey,
                                files: []
                            };
                            this.groupsMap.set(groupKey, groupInfo);
                        }
                        groupInfo.files.push(fileInfo);
                    }
                }
            });
        }
        catch (error) {
            tools_1.log.error(`处理目录失败: ${dirPath}, ${error}`);
        }
    }
    /** 初始化状态栏按钮 */
    initStatusBarItem() {
        const { showStatusbarItem, swaggerJsonUrl } = tools_1.config.extConfig;
        this.statusBarItem.text = `$(cloud-download) ${tools_1.localize.getLocalize('text.updateButton')}`;
        this.statusBarItem.command = 'cmd.local.updateAll';
        if (showStatusbarItem && swaggerJsonUrl.length) {
            this.statusBarItem.show();
        }
        else {
            this.statusBarItem.hide();
        }
    }
    /** 读取本地文件 */
    readLocalFile(fileName, text) {
        try {
            const fileStr = text || fs_1.default.readFileSync(fileName, 'utf-8');
            // 提取文件头部注释中的信息
            let headerStr = '';
            // 匹配 /** ... */ 注释块
            const commentMatch = fileStr.match(/^\/\*\*([\s\S]*?)\*\//);
            if (commentMatch) {
                headerStr = commentMatch[1];
            }
            // 尝试从 declare namespace 中提取 namespace
            const namespaceMatch = fileStr.match(/declare\s+namespace\s+([^\s\n{]+)/);
            if (namespaceMatch) {
                headerStr += `\n* @namespace ${namespaceMatch[1]}\n`;
            }
            const headerInfo = {
                fileName: path_1.default.basename(fileName, path_1.default.extname(fileName)),
                filePath: fileName,
                ext: path_1.default.extname(fileName).slice(1),
            };
            // 解析注释中的 @key value 格式
            headerStr.replace(/\*\s*@([^\s]+)[^\S\n]*([^\n]*?)\n/g, (_, key, value) => {
                headerInfo[key] = value.trim() || true;
                return '';
            });
            // 确保configTitle字段存在
            if (headerInfo.configTitle) {
                headerInfo.configTitle = headerInfo.configTitle;
            }
            return headerInfo;
        }
        catch (error) {
            tools_1.log.error(`Read File Error - ${fileName}`);
        }
    }
    /** 获取分组下的所有文件 */
    getGroupFiles(groupPath) {
        const groupFiles = [];
        // 如果传入的是文件路径，获取其所在目录
        let dirPath = groupPath;
        if (fs_1.default.existsSync(groupPath) && fs_1.default.statSync(groupPath).isFile()) {
            dirPath = path_1.default.dirname(groupPath);
        }
        // 检查目录是否存在
        if (!fs_1.default.existsSync(dirPath) || !fs_1.default.statSync(dirPath).isDirectory()) {
            return groupFiles;
        }
        try {
            // 读取目录下的所有.d.ts文件
            const files = fs_1.default.readdirSync(dirPath);
            files.forEach(file => {
                if (file.endsWith('.d.ts')) {
                    const filePath = path_1.default.join(dirPath, file);
                    groupFiles.push(filePath);
                }
            });
        }
        catch (error) {
            tools_1.log.error(`获取分组文件失败: ${error}`);
        }
        return groupFiles;
    }
    /** 更新所有本地接口 */
    updateAll() {
        const statusBarItemText = `$(cloud-download) ${tools_1.localize.getLocalize('text.updateButton')}`;
        this.statusBarItem.text = statusBarItemText + '...';
        this.statusBarItem.command = undefined;
        const progressPanel = vscode_1.default.window.withProgress({
            location: vscode_1.default.ProgressLocation.Notification,
            title: tools_1.localize.getLocalize('text.updateButton'),
            cancellable: false,
        }, async (progress) => {
            return new Promise(async (resolve) => {
                progress.report({ increment: -1 });
                await this.viewList._refresh();
                const unit = 100 / this.localFilesMap.size;
                let increment = 0;
                progress.report({ increment });
                for (const [key, item] of this.localFilesMap) {
                    if (item.ignore) {
                        tools_1.log.info(`<updateAll> ignored. (${item.filePath})`);
                        continue;
                    }
                    if (!item.namespace) {
                        tools_1.log.error(`<updateAll> namespace is undefined. (${item.filePath})`, false);
                        continue;
                    }
                    const swaggerItem = this.viewList.getInterFacePathNameMap(item.namespace, item.savePath);
                    if (!swaggerItem) {
                        tools_1.log.error(`<updateAll> swaggerItem is undefined. (${item.filePath})`, false);
                        continue;
                    }
                    await this.viewList
                        .saveInterface(swaggerItem, item.filePath)
                        .then((res) => {
                        if (res === 'no-change') {
                            return tools_1.log.info(`${tools_1.localize.getLocalize('text.noChange')} <${item.name}> `);
                        }
                        tools_1.log.info(`${tools_1.localize.getLocalize('command.local.updateInterface')} <${item.name}> ${item.filePath} ${tools_1.localize.getLocalize('success')}`);
                    })
                        .catch((err) => {
                        tools_1.log.error(`${tools_1.localize.getLocalize('command.local.updateInterface')} <${item.name}> ${tools_1.localize.getLocalize('failed')} ${err}`, true);
                    });
                    progress.report({ increment, message: key });
                    increment += unit;
                }
                resolve(void 0);
            });
        });
        progressPanel.then(() => {
            this.statusBarItem.text = statusBarItemText;
            this.statusBarItem.command = 'cmd.local.updateAll';
            this.initLocalFiles();
            tools_1.log.info(`${tools_1.localize.getLocalize('text.updateButton')} ${tools_1.localize.getLocalize('success')}`);
            tools_1.log.outputChannel.show();
        });
    }
    /** 刷新单个本地接口 */
    updateSingle(filePath) {
        const fileInfo = this.readLocalFile(filePath);
        if (fileInfo && fileInfo.ext === 'ts') {
            this.localFilesMap.set(filePath, fileInfo);
            this.refactorLocalFilesList();
        }
    }
    getChildren(element) {
        if (!element) {
            // 返回配置项分组列表（与Swagger接口列表保持一致）
            const configItems = this.renderConfigItems();
            return Promise.resolve(configItems);
        }
        // 配置项下返回保存路径分组
        if (element.options.itemType === 'config-group' && element.options.configTitle) {
            const savePathItems = this.renderSavePathsByConfig(element.options.configTitle);
            return Promise.resolve(savePathItems);
        }
        // 保存路径下返回分组列表
        if (element.options.itemType === 'root' && element.options.savePath) {
            const groupItems = this.renderGroupsBySavePath(element.options.savePath, element.options.configTitle);
            return Promise.resolve(groupItems);
        }
        // 分组下返回接口文件列表
        if (element.options.itemType === 'group' && element.options.groupPath) {
            const groupInfo = this.groupsMap.get(element.options.groupPath);
            if (groupInfo) {
                // 获取父级根节点的保存路径和配置标题
                const parentSavePath = this.getParentSavePath(element);
                const configTitle = element.options.configTitle;
                const filteredFiles = this.filterFilesByPathAndConfig(groupInfo.files, parentSavePath, configTitle);
                const interfaceItems = this.renderItems(filteredFiles);
                return Promise.resolve(interfaceItems);
            }
        }
        return Promise.resolve([]);
    }
    /** 渲染配置项分组列表（与Swagger接口列表保持一致） */
    renderConfigItems() {
        const configItems = [];
        const configMap = new Map();
        // 统计每个配置项下的接口数量
        this.localFilesMap.forEach((file) => {
            if (file.configTitle) {
                const count = configMap.get(file.configTitle) || 0;
                configMap.set(file.configTitle, count + 1);
            }
        });
        configMap.forEach((count, configTitle) => {
            const options = {
                title: configTitle,
                type: 'config-group',
                subTitle: `${count} 个接口`,
                collapsible: 1,
                contextValue: 'config-group',
                itemType: 'config-group',
                configTitle: configTitle,
            };
            configItems.push(new LocalItem(options));
        });
        return configItems;
    }
    /** 渲染指定配置下的保存路径列表 */
    renderSavePathsByConfig(configTitle) {
        const savePathItems = [];
        const pathMap = new Map();
        // 统计该配置下每个保存路径的接口数量
        this.localFilesMap.forEach((file) => {
            if (file.configTitle === configTitle) {
                const savePath = this.allSavePath.find(path => file.filePath.startsWith(path));
                if (savePath) {
                    const count = pathMap.get(savePath) || 0;
                    pathMap.set(savePath, count + 1);
                }
            }
        });
        pathMap.forEach((count, savePath) => {
            const options = {
                title: path_1.default.basename(savePath),
                type: 'root',
                subTitle: `${count} 个接口`,
                collapsible: 1,
                contextValue: 'root',
                itemType: 'root',
                savePath: savePath,
                configTitle: configTitle,
            };
            savePathItems.push(new LocalItem(options));
        });
        return savePathItems;
    }
    /** 渲染指定保存路径和配置下的分组列表 */
    renderGroupsBySavePath(savePath, configTitle) {
        const groups = [];
        this.groupsMap.forEach((groupInfo, groupPath) => {
            // 检查该分组是否包含指定保存路径和配置下的文件
            const filteredFiles = this.filterFilesByPathAndConfig(groupInfo.files, savePath, configTitle);
            if (filteredFiles.length > 0) {
                const options = {
                    title: groupInfo.groupName,
                    type: 'group',
                    subTitle: `${filteredFiles.length} 个接口`,
                    collapsible: 1,
                    contextValue: 'group',
                    itemType: 'group',
                    groupPath: groupPath,
                    configTitle: configTitle,
                };
                groups.push(new LocalItem(options));
            }
        });
        return groups;
    }
    /** 根据保存路径和配置标题过滤文件 */
    filterFilesByPathAndConfig(files, savePath, configTitle) {
        return files.filter(file => {
            const pathMatch = !savePath || file.filePath.startsWith(savePath);
            const configMatch = !configTitle || file.configTitle === configTitle;
            return pathMatch && configMatch;
        });
    }
    /** 渲染分组列表 */
    renderGroups() {
        const groups = [];
        this.groupsMap.forEach((groupInfo, groupPath) => {
            const options = {
                title: groupInfo.groupName,
                type: 'group',
                subTitle: `${groupInfo.files.length} 个接口`,
                collapsible: 1,
                contextValue: 'group',
                itemType: 'group',
                groupPath: groupPath,
            };
            groups.push(new LocalItem(options));
        });
        return groups;
    }
    renderItems(itemList) {
        return itemList.map((item) => this.renderItem(item));
    }
    renderItem(item) {
        const title = item.name || item.namespace || item.fileName;
        const options = {
            title,
            type: item.ignore ? 'file-ignore' : 'file-sync',
            subTitle: `[${item.update || 'No Update Date'}] <${item.namespace}> ${item.path}`,
            collapsible: 0,
            contextValue: 'interface',
            itemType: 'interface',
            filePath: item.filePath,
            namespace: item.namespace,
            configTitle: item.configTitle,
            command: {
                title,
                command: 'cmd.common.openFile',
                arguments: [item.filePath],
            },
        };
        return new LocalItem(options);
    }
    getParent(element) {
        if (element.options.itemType === 'interface' && element.options.namespace) {
            // 使用 namespace 作为分组键
            const groupKey = element.options.namespace;
            const groupInfo = this.groupsMap.get(groupKey);
            if (groupInfo) {
                const parentOptions = {
                    title: groupInfo.groupName,
                    type: 'group',
                    subTitle: `${groupInfo.files.length} 个接口`,
                    collapsible: 1,
                    contextValue: 'group',
                    itemType: 'group',
                    groupPath: groupKey,
                    configTitle: element.options.configTitle,
                };
                return new LocalItem(parentOptions);
            }
        }
        if (element.options.itemType === 'group') {
            // 查找包含该分组的保存路径节点
            const groupInfo = this.groupsMap.get(element.options.groupPath || '');
            if (groupInfo && element.options.configTitle) {
                // 找到该配置下的文件所属的保存路径
                const configFiles = groupInfo.files.filter(file => file.configTitle === element.options.configTitle);
                const firstFile = configFiles[0];
                if (firstFile) {
                    const savePath = this.allSavePath.find(path => firstFile.filePath.startsWith(path));
                    if (savePath) {
                        const parentOptions = {
                            title: path_1.default.basename(savePath),
                            type: 'root',
                            subTitle: '',
                            collapsible: 1,
                            contextValue: 'root',
                            itemType: 'root',
                            savePath: savePath,
                            configTitle: element.options.configTitle,
                        };
                        return new LocalItem(parentOptions);
                    }
                }
            }
        }
        if (element.options.itemType === 'root' && element.options.configTitle) {
            // 保存路径节点的父级是配置分组
            const parentOptions = {
                title: element.options.configTitle,
                type: 'config-group',
                subTitle: '',
                collapsible: 1,
                contextValue: 'config-group',
                itemType: 'config-group',
                configTitle: element.options.configTitle,
            };
            return new LocalItem(parentOptions);
        }
        return undefined;
    }
    /** 获取元素的父级保存路径 */
    getParentSavePath(element) {
        const parent = this.getParent(element);
        return parent?.options.savePath;
    }
    /** 重新生成本地文件列表 */
    refactorLocalFilesList() {
        this.localFilesList = [];
        this.groupsMap.clear(); // 清空分组信息
        this.localFilesMap.forEach((val) => {
            this.localFilesList.push(val);
            // 重新构建分组信息，使用实际的分组路径而不是namespace
            const groupKey = this.extractGroupFromPath(val.filePath) || val.namespace || 'Default';
            let groupInfo = this.groupsMap.get(groupKey);
            if (!groupInfo) {
                groupInfo = {
                    groupName: groupKey,
                    groupPath: groupKey,
                    files: []
                };
                this.groupsMap.set(groupKey, groupInfo);
            }
            groupInfo.files.push(val);
        });
        this._onDidChangeTreeData.fire(undefined);
    }
    /** 从文件路径中提取分组信息 */
    extractGroupFromPath(filePath) {
        // 找到匹配的保存路径
        const matchedSavePath = this.allSavePath.find(savePath => filePath.startsWith(savePath));
        if (!matchedSavePath)
            return null;
        // 获取相对于保存路径的部分
        const relativePath = path_1.default.relative(matchedSavePath, filePath);
        const pathSegments = relativePath.split(path_1.default.sep);
        // 如果文件直接在保存路径下，返回null（无分组）
        if (pathSegments.length <= 1)
            return null;
        // 返回最后一级目录作为分组名（排除文件名）
        return pathSegments[pathSegments.length - 2];
    }
    /** 刷新 */
    refresh() {
        // 0.5 秒防抖, 避免重复刷新产生大量算力开销
        this.debounce(() => this._refresh(), 500);
    }
    _refresh() {
        this.initLocalFiles();
        tools_1.log.info('refresh: view.local');
    }
    /** settings.json 文件变更时触发 */
    onConfigurationRefresh() {
        this.allSavePath = this.getAllSavePath();
        this.initStatusBarItem();
        this.refresh();
    }
    /** 销毁时释放资源 */
    destroy() { }
}
exports.ViewLocal = ViewLocal;
class LocalItem extends core_1.BaseTreeItem {
}
exports.LocalItem = LocalItem;
//# sourceMappingURL=local.view.js.map