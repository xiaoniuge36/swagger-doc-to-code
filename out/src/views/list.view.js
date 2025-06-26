"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListItem = exports.ViewList = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const core_1 = require("../core");
const tools_1 = require("../tools");
class ViewList extends core_1.BaseTreeProvider {
    constructor() {
        super();
        /** Swagger JSON */
        this.swaggerJsonMap = new Map();
        this.interFacePathNameMap = new Map();
        /** 接口更新时间 */
        this.updateDate = (0, tools_1.formatDate)(new Date(), 'H:I:S');
        this.globalSavePath = path_1.default.resolve(tools_1.WORKSPACE_PATH || '', tools_1.config.extConfig.savePath);
        this.getSearchList();
    }
    async getChildren(element) {
        if (!element) {
            const { swaggerJsonUrl = [] } = tools_1.config.extConfig;
            return swaggerJsonUrl.map((item) => this.renderRootItem(item));
        }
        const configItem = element.options.configItem;
        return this.getListData(configItem).then((swaggerJsonMap) => {
            let listData = [];
            switch (element.options.type) {
                case 'root':
                    listData = swaggerJsonMap.get(configItem.url) || [];
                    return this.renderItem(listData, configItem);
                case 'group':
                    listData = swaggerJsonMap.get(configItem.url) || [];
                    const itemChildren = listData.find((x) => x.key === element.options.key);
                    return this.renderItem(itemChildren?.children || [], configItem);
                default:
                    return Promise.resolve([]);
            }
        });
    }
    /** 渲染根节点 */
    renderRootItem(item, collapsible) {
        const rootNode = new ListItem({
            key: item.url,
            title: item.title || item.url,
            type: 'root',
            subTitle: item.url || '',
            collapsible: collapsible || 1,
            contextValue: 'root',
            // url: item.url,
            // link: item.link,
            configItem: item,
        });
        return rootNode;
    }
    /**
     * 获取远程数据
     * @param item
     * @param update 更新覆盖
     */
    getListData(item, update) {
        return new Promise((resolve) => {
            if (!item.url)
                return resolve(this.swaggerJsonMap); // reject map
            if (this.swaggerJsonMap.has(item.url) && !update)
                return resolve(this.swaggerJsonMap);
            (0, core_1.getSwaggerJson)(item.url)
                .then((res) => {
                this.updateDate = (0, tools_1.formatDate)(new Date(), 'H:I:S');
                if (res.swagger) {
                    this.swaggerJsonMap.set(item.url, (0, core_1.parseSwaggerJson)(res, item));
                }
                else if (res.openapi) {
                    this.swaggerJsonMap.set(item.url, new core_1.OpenAPIV3Parser(res, item).parse());
                }
                resolve(this.swaggerJsonMap);
            })
                .catch(() => {
                resolve(this.swaggerJsonMap); // reject map
            });
        });
    }
    /**
     * 渲染树视图节点
     *
     * @param itemList
     * @param configItem
     * @param parent
     */
    renderItem(itemList, configItem) {
        return itemList.map((item) => this.transformToListItem(item, configItem));
    }
    /**
     * 转换为树视图节点
     *
     * @param item
     * @param configItem
     * @param parent
     */
    transformToListItem(item, configItem, collapsible) {
        const hasChildren = item.children && item.children.length;
        const collapsibleH = collapsible || (hasChildren ? 1 : 0);
        const options = {
            title: item.title,
            type: item.type,
            subTitle: item.subTitle,
            collapsible: collapsibleH,
            configItem,
            // url: configItem.url,
            contextValue: item.type,
            key: item.key,
            parentKey: item.parentKey,
        };
        if (!hasChildren) {
            options.command = {
                command: 'cmd.list.onSelect',
                title: item.title,
                arguments: [item],
            };
        }
        return new ListItem(options);
    }
    /**
     * 刷新 SwaggerJsonMap
     * @param all 是否刷新全部接口, 默认只刷新已拉取的列表
     */
    refreshSwaggerJsonMap(all) {
        const { swaggerJsonUrl = [] } = tools_1.config.extConfig;
        const queryList = [];
        swaggerJsonUrl.forEach((v) => {
            if (!this.swaggerJsonMap.has(v.url) && !all)
                return;
            queryList.push(this.getListData(v));
        });
        return Promise.all(queryList);
    }
    /** 获取可供搜索选择器使用的列表 */
    getSearchList() {
        const stopLoading = (0, tools_1.showLoading)(tools_1.localize.getLocalize('text.querySwaggerData'));
        return new Promise(async (resolve) => {
            let arr = [];
            const { swaggerJsonUrl = [] } = tools_1.config.extConfig;
            await this.refreshSwaggerJsonMap(true);
            this.swaggerJsonMap.forEach((list, key) => {
                const conf = swaggerJsonUrl.find((x) => x.url === key);
                if (!conf)
                    return tools_1.log.error(`swaggerJsonUrl config not found (${key})`);
                arr = arr.concat(this.mergeSwaggerJsonMap(list, conf, conf.title));
            });
            stopLoading();
            resolve(arr);
        });
    }
    /**
     * 合并所有接口列表 - getSearchList
     * @param data
     * @param apiUrl
     * @param dir
     * @param parent
     */
    mergeSwaggerJsonMap(data, configItem, dir, parent) {
        let arr = [];
        data.forEach((v) => {
            if (v.type === 'interface') {
                if (v.pathName) {
                    this.setInterFacePathNameMap(v.pathName, v.savePath, v);
                }
                arr.push({
                    label: v.title,
                    description: `<${v.method}> [${dir}] ${v.pathName} `,
                    detail: v.subTitle,
                    source: v,
                    configItem,
                    parent,
                });
            }
            else if (v.children) {
                let dirH = v.title;
                if (dir) {
                    dirH = `${dir} / ${dirH}`;
                }
                arr = arr.concat(this.mergeSwaggerJsonMap(v.children, configItem, dirH, v));
            }
        });
        return arr;
    }
    setInterFacePathNameMap(pathName, savePath = tools_1.config.extConfig.savePath, item) {
        this.interFacePathNameMap.set(`${savePath}/${pathName}`, item);
    }
    getInterFacePathNameMap(pathName, savePath = tools_1.config.extConfig.savePath) {
        return this.interFacePathNameMap.get(`${savePath}/${pathName}`);
    }
    /** 获取父级元素 */
    getParent(item) {
        const { parentKey, type, configItem } = item.options;
        let parentNode = void 0;
        switch (type) {
            case 'interface':
                const groupNode = this.swaggerJsonMap.get(configItem.url)?.find((x) => x.key === parentKey);
                if (groupNode) {
                    parentNode = this.transformToListItem(groupNode, configItem);
                }
                else {
                    tools_1.log.error(`<getParent> [${parentKey}] groupNode not found`);
                }
                break;
            case 'group':
                const rootNode = tools_1.config.extConfig.swaggerJsonUrl.find((x) => x.url === parentKey);
                if (rootNode) {
                    parentNode = this.renderRootItem(rootNode);
                }
                else {
                    tools_1.log.error(`<getParent> [${parentKey}] rootNode not found`);
                }
                break;
        }
        return parentNode;
    }
    /** 保存接口到本地 */
    async saveInterface(itemSource, filePath) {
        const item = itemSource;
        const { compareChanges } = tools_1.config.extConfig;
        if (!item.pathName)
            return Promise.reject('SaveInterface Error');
        const savePath = item.savePath ? path_1.default.resolve(tools_1.WORKSPACE_PATH || '', item.savePath) : this.globalSavePath;
        const filePathH = filePath ?? path_1.default.join(savePath, `${item.pathName}.d.ts`);
        const nextStr = (0, core_1.renderToInterface)(item);
        if (compareChanges && fs_1.default.existsSync(filePathH)) {
            const currentStr = fs_1.default.readFileSync(filePathH, 'utf-8');
            const REG_UPDATE_DATE = /@update[^\n]+/;
            if (currentStr.replace(REG_UPDATE_DATE, '') === nextStr.replace(REG_UPDATE_DATE, '')) {
                return Promise.resolve('no-change');
            }
        }
        return (0, tools_1.saveDocument)(nextStr, filePathH);
    }
    /** 批量保存分组到本地 */
    async saveInterfaceGroup(item) {
        return new Promise(async (resolve, reject) => {
            // await this._refresh()
            const listData = this.swaggerJsonMap.get(item.options.configItem.url) || [];
            const itemChildren = listData.find((x) => x.key === item.options.key)?.children;
            if (itemChildren && itemChildren.length) {
                for (let index = 0; index < itemChildren.length; index++) {
                    await this.saveInterface(itemChildren[index]);
                }
                resolve(void 0);
            }
            else {
                reject('No Children!');
            }
        });
    }
    /** 刷新 */
    refresh() {
        // 0.5 秒防抖, 避免重复刷新占用大量资源
        this.debounce(() => this._refresh(), 500);
    }
    async _refresh() {
        this.swaggerJsonMap.clear();
        this.interFacePathNameMap.clear();
        await this.getSearchList();
        this._onDidChangeTreeData.fire(undefined);
        tools_1.log.info('refresh: view.list');
    }
    /** settings.json 文件变更时触发 */
    onConfigurationRefresh() {
        const { savePath } = tools_1.config.extConfig;
        this.globalSavePath = path_1.default.resolve(tools_1.WORKSPACE_PATH || '', savePath);
        this.refresh();
    }
    updateSavePath(savePath) {
        this.globalSavePath = path_1.default.resolve(tools_1.WORKSPACE_PATH || '', savePath);
        this.refresh();
    }
    destroy() {
        // 清理资源
    }
}
exports.ViewList = ViewList;
class ListItem extends core_1.BaseTreeItem {
}
exports.ListItem = ListItem;
//# sourceMappingURL=list.view.js.map