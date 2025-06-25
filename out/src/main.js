"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode_1 = __importDefault(require("vscode"));
const list_view_1 = require("./views/list.view");
const local_view_1 = require("./views/local.view");
const tools_1 = require("./tools");
const commands_1 = require("./commands");
let viewList;
let viewLocal;
function activate(ctx) {
    viewList = new list_view_1.ViewList();
    viewLocal = new local_view_1.ViewLocal(viewList);
    const { reloadWhenSettingsChanged } = tools_1.config.extConfig;
    // global.ctx = ctx
    const listTreeView = vscode_1.default.window.createTreeView('view.list', { treeDataProvider: viewList });
    const localTreeView = vscode_1.default.window.createTreeView('view.local', { treeDataProvider: viewLocal });
    (0, commands_1.registerCommonCommands)(viewList, viewLocal);
    (0, commands_1.registerListCommands)({ viewList, viewLocal, listTreeView, localTreeView });
    (0, commands_1.registerLocalCommands)(viewList, viewLocal);
    (0, commands_1.registerTemplateCommands)();
    // 监听 settings.json 文件变更
    if (reloadWhenSettingsChanged) {
        vscode_1.default.workspace.onDidChangeConfiguration(() => {
            viewList.onConfigurationRefresh();
            viewLocal.onConfigurationRefresh();
        });
    }
    tools_1.log.info('Extension activated.');
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
    viewLocal?.destroy();
    tools_1.log.info('Extension deactivated.');
}
exports.deactivate = deactivate;
//# sourceMappingURL=main.js.map