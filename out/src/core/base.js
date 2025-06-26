"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openListPicker = exports.BaseTreeProvider = exports.BaseTreeItem = void 0;
const vscode_1 = __importDefault(require("vscode"));
const tools_1 = require("../tools");
/**
 * 小图标配置
 * [codeIcon](https://microsoft.github.io/vscode-codicons/dist/codicon.html)
 */
const ICON_MAP = {
    root: new vscode_1.default.ThemeIcon('package'),
    group: vscode_1.default.ThemeIcon.Folder,
    interface: new vscode_1.default.ThemeIcon('debug-disconnect'),
    'file-ignore': new vscode_1.default.ThemeIcon('sync-ignored'),
    'file-sync': new vscode_1.default.ThemeIcon('sync'),
    'config-group': new vscode_1.default.ThemeIcon('server-environment'),
};
class BaseTreeItem extends vscode_1.default.TreeItem {
    constructor(options) {
        super(options.title, options.collapsible);
        this.options = options;
        this.label = options.title;
        this.command = options.command;
        this.description = options.subTitle;
        if (options.tooltip) {
            this.tooltip = options.tooltip;
        }
        else {
            this.tooltip = `${this.label} - ${options.subTitle}`;
        }
        this.iconPath = ICON_MAP[options.type];
        this.contextValue = options.contextValue;
    }
}
exports.BaseTreeItem = BaseTreeItem;
class BaseTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode_1.default.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.workspaceRoot = tools_1.WORKSPACE_PATH || '';
        this.TM = Date.now();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren() {
        return Promise.resolve([]);
    }
    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
    /** 函数防抖 */
    debounce(callBack, t) {
        this.TM = Date.now();
        setTimeout(() => {
            if (Date.now() - this.TM >= t) {
                callBack();
            }
        }, t);
    }
}
exports.BaseTreeProvider = BaseTreeProvider;
/**
 * 打开一个列表选择框 (单选)
 * @param conf
 */
function openListPicker(conf) {
    return new Promise((resolve) => {
        const listPicker = vscode_1.default.window.createQuickPick();
        listPicker.placeholder = conf.placeholder;
        listPicker.matchOnDescription = true;
        listPicker.matchOnDetail = true;
        listPicker.show();
        listPicker.title = conf.title;
        if (conf.before) {
            listPicker.busy = true;
            conf
                .before()
                .then((items) => {
                listPicker.items = items;
            })
                .finally(() => {
                listPicker.busy = false;
            });
        }
        else if (conf.items) {
            listPicker.items = conf.items;
            listPicker.busy = false;
        }
        listPicker.onDidAccept(() => {
            listPicker.hide();
            resolve(listPicker.selectedItems[0]);
        });
    });
}
exports.openListPicker = openListPicker;
//# sourceMappingURL=base.js.map