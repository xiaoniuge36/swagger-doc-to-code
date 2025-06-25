"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodelensProviderLocal = exports.CodelensProvider = exports.preSaveDocument = void 0;
const fs_1 = __importDefault(require("fs"));
const vscode_1 = __importDefault(require("vscode"));
const _1 = require(".");
class SwaggerInterfaceProvider {
    constructor() {
        this.doc = '';
    }
    provideTextDocumentContent() {
        return this.doc;
    }
}
SwaggerInterfaceProvider.scheme = 'swagger-interface-provider';
/**
 * 打开一个未保存的文档
 * @param docStr
 * @param name
 * @param refresh 文档强刷
 */
async function preSaveDocument(docStr, filePath, refresh) {
    const newFile = vscode_1.default.Uri.parse((fs_1.default.existsSync(filePath) ? 'file' : SwaggerInterfaceProvider.scheme) + ':' + filePath);
    const doc = await vscode_1.default.workspace.openTextDocument(newFile);
    if (refresh) {
        const edit = new vscode_1.default.WorkspaceEdit();
        const pMin = new vscode_1.default.Position(0, 0);
        const pMax = new vscode_1.default.Position(999999999, 999999999);
        edit.replace(newFile, new vscode_1.default.Range(pMin, pMax), docStr);
        return vscode_1.default.workspace.applyEdit(edit).then((success) => {
            if (success) {
                vscode_1.default.window.showTextDocument(doc, { preview: true, viewColumn: vscode_1.default.ViewColumn.Active });
            }
            else {
                _1.log.error('open document error error!', true);
            }
            return success;
        });
    }
    else {
        vscode_1.default.window.showTextDocument(doc, { preview: true, viewColumn: vscode_1.default.ViewColumn.Active });
    }
}
exports.preSaveDocument = preSaveDocument;
class CodelensProvider {
    constructor() {
        this.codeLenses = [];
        this.HEADER_RANGE = new vscode_1.default.Range(new vscode_1.default.Position(0, 0), new vscode_1.default.Position(0, 0));
    }
    provideCodeLenses(doc) {
        this.codeLenses = [];
        this.codeLenses.push(new vscode_1.default.CodeLens(this.HEADER_RANGE, {
            title: _1.localize.getLocalize('text.preview'),
            command: '',
        }));
        this.codeLenses.push(new vscode_1.default.CodeLens(this.HEADER_RANGE, {
            title: `${_1.localize.getLocalize('text.clickToSave')}`,
            command: 'cmd.list.saveInterfaceWitchDoc',
            arguments: [doc],
        }));
        return this.codeLenses;
    }
}
exports.CodelensProvider = CodelensProvider;
class CodelensProviderLocal {
    constructor() {
        this.codeLenses = [];
        this.HEADER_RANGE = new vscode_1.default.Range(new vscode_1.default.Position(0, 0), new vscode_1.default.Position(0, 0));
    }
    provideCodeLenses(doc) {
        this.codeLenses = [];
        if (_1.templateConfig.copyRequest) {
            this.codeLenses.push(new vscode_1.default.CodeLens(this.HEADER_RANGE, {
                title: `${_1.localize.getLocalize('command.local.copyRequest')}`,
                command: 'cmd.local.copyRequest',
                arguments: [{ path: doc.fileName }],
            }));
        }
        this.codeLenses.push(new vscode_1.default.CodeLens(this.HEADER_RANGE, {
            title: `${_1.localize.getLocalize('text.updateButton')}`,
            command: 'cmd.local.updateInterface',
            arguments: [{ path: doc.fileName }],
        }));
        return this.codeLenses;
    }
}
exports.CodelensProviderLocal = CodelensProviderLocal;
vscode_1.default.workspace.registerTextDocumentContentProvider(SwaggerInterfaceProvider.scheme, new SwaggerInterfaceProvider());
vscode_1.default.languages.registerCodeLensProvider({ scheme: SwaggerInterfaceProvider.scheme }, new CodelensProvider());
// TODO 多目录处理
const savePaths = [_1.config.extConfig.savePath];
_1.config.extConfig.swaggerJsonUrl.forEach((v) => {
    if (v.savePath) {
        savePaths.push(v.savePath);
    }
});
vscode_1.default.languages.registerCodeLensProvider({ scheme: 'file', language: 'typescript', pattern: `${_1.WORKSPACE_PATH}/{${savePaths.join(',')}}/**/*.d.ts` }, new CodelensProviderLocal());
//# sourceMappingURL=editor.js.map