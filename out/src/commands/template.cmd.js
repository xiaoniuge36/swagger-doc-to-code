"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTemplateCommands = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const vscode_1 = __importDefault(require("vscode"));
const tools_1 = require("../tools");
function registerTemplateCommands() {
    const commands = {
        edit() {
            const vscodeConfigFolderPath = path_1.default.join(tools_1.WORKSPACE_PATH || '', '.vscode');
            const workspaceConfigPath = path_1.default.join(vscodeConfigFolderPath, tools_1.TEMPLATE_FILE_NAME);
            if (!fs_1.default.existsSync(vscodeConfigFolderPath)) {
                try {
                    (0, tools_1.mkdirRecursive)('.vscode');
                }
                catch (error) {
                    tools_1.log.error(error);
                    return tools_1.log.error(tools_1.localize.getLocalize('error.action'), true);
                }
            }
            if (!fs_1.default.existsSync(workspaceConfigPath)) {
                const readable = fs_1.default.createReadStream(tools_1.DEFAULT_TEMPLATE_FILE_PATH);
                const writable = fs_1.default.createWriteStream(workspaceConfigPath);
                readable.pipe(writable);
            }
            vscode_1.default.workspace.openTextDocument(workspaceConfigPath).then((doc) => {
                vscode_1.default.window.showTextDocument(doc);
            });
        },
    };
    for (const command in commands) {
        vscode_1.default.commands.registerCommand(`cmd.template.${command}`, commands[command]);
    }
}
exports.registerTemplateCommands = registerTemplateCommands;
//# sourceMappingURL=template.cmd.js.map