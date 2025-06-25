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
        const allSavePath = [path_1.default.resolve(tools_1.WORKSPACE_PATH || '', savePath)];
        swaggerJsonUrl.forEach((v) => {
            if (v.savePath) {
                allSavePath.push(path_1.default.resolve(tools_1.WORKSPACE_PATH || '', v.savePath));
            }
        });
        return allSavePath;
    }
    /** 初始化本地文件 */
    initLocalFiles() {
        this.localFilesMap.clear();
        const localFiles = [];
        this.allSavePath.forEach((savePath) => {
            if (fs_1.default.existsSync(savePath)) {
                fs_1.default.readdirSync(savePath).forEach((file) => {
                    const filePath = path_1.default.join(savePath, file);
                    const fileInfo = this.readLocalFile(filePath);
                    if (fileInfo && fileInfo.ext === 'ts') {
                        localFiles.push(filePath);
                        this.localFilesMap.set(filePath, fileInfo);
                    }
                });
            }
            else {
                tools_1.log.warn('<initLocalFiles> localPath does not exist');
            }
        });
        // TAG setContext 写入本地文件目录
        vscode_1.default.commands.executeCommand('setContext', `${tools_1.CONFIG_GROUP}.localFiles`, localFiles);
        this.refactorLocalFilesList();
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
            const headerStr = fileStr.replace(/^[\s]*\/\*\*(.*?)\*\/.*declare\s+namespace\s+([^\s\n]+).+$/s, '$1* @namespace $2\n');
            const headerInfo = {
                fileName: fileName.replace(/^.+\/(.+?)(\.d)?\.{.+}$/, '$1'),
                filePath: fileName,
                ext: fileName.replace(/^.+\.(.+)$/, '$1'),
            };
            headerStr.replace(/\*\s*@([^\s]+)[^\S\n]*([^\n]*?)\n/g, (_, key, value) => {
                headerInfo[key] = value || true;
                return '';
            });
            return headerInfo;
        }
        catch (error) {
            tools_1.log.error(`Read File Error - ${fileName}`);
        }
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
    getChildren() {
        const treeItems = this.renderItems(this.localFilesList);
        return Promise.resolve(treeItems);
    }
    renderItems(itemList) {
        return itemList.map(this.renderItem);
    }
    renderItem(item) {
        const title = item.name || item.namespace || item.fileName;
        const options = {
            title,
            type: item.ignore ? 'file-ignore' : 'file-sync',
            subTitle: `[${item.update || 'No Update Date'}] <${item.namespace}> ${item.path}`,
            collapsible: 0,
            filePath: item.filePath,
            namespace: item.namespace,
            command: {
                title,
                command: 'cmd.common.openFile',
                arguments: [item.filePath],
            },
        };
        return new LocalItem(options);
    }
    getParent() {
        return void 0;
    }
    /** 重新生成本地文件列表 */
    refactorLocalFilesList() {
        this.localFilesList = [];
        this.localFilesMap.forEach((val) => {
            this.localFilesList.push(val);
        });
        this._onDidChangeTreeData.fire(undefined);
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