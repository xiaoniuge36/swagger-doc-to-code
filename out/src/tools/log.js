"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
const vscode_1 = require("vscode");
const const_1 = require("./const");
const utils_1 = require("./utils");
class Log {
    constructor() {
        this.outputChannel = vscode_1.window.createOutputChannel(const_1.EXT_NAME);
    }
    log(type, message, intend = 0) {
        this.outputChannel.appendLine(`${'\t'.repeat(intend)} [${type} - ${(0, utils_1.formatDate)(new Date(), 'HH:mm:ss.ms')}] ${message}`);
        return message;
    }
    /**
     * 记录日志
     * @param message
     * @param prompt 是否弹窗提示
     * @param intend
     */
    info(message, prompt = false, intend = 0) {
        const type = 'INFO';
        if (prompt)
            vscode_1.window.showInformationMessage(message);
        return this.log(type, message, intend);
    }
    /**
     * 记录警告日志
     * @param message
     * @param prompt 是否弹窗提示
     * @param intend
     */
    warn(message, prompt = false, intend = 0) {
        const type = 'WARN';
        if (prompt)
            vscode_1.window.showWarningMessage(message);
        return this.log(type, message, intend);
    }
    /**
     * 记录错误日志
     * @param err 错误信息
     * @param prompt 是否弹窗提示
     * @param intend 缩进
     */
    error(err, prompt = false, intend = 0) {
        const type = 'ERROR';
        if (prompt)
            vscode_1.window.showErrorMessage(err.toString());
        if (typeof err === 'string') {
            return this.log(type, err, intend);
        }
        else {
            return this.log(type, `${err.name}: ${err.message}\n${err.stack}`, intend);
        }
    }
    divider() {
        this.outputChannel.appendLine('\n――――――\n');
    }
}
exports.log = new Log();
//# sourceMappingURL=log.js.map