"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.showLoading = void 0;
const vscode_1 = __importDefault(require("vscode"));
/**
 * 显示一个 Loading
 * @param message
 * @returns
 */
function showLoading(message) {
    let stopLoading = () => void 0;
    vscode_1.default.window.withProgress({
        location: vscode_1.default.ProgressLocation.Window,
        title: message,
        cancellable: false,
    }, () => {
        return new Promise((resolve) => {
            stopLoading = () => resolve(false);
        });
    });
    return stopLoading;
}
exports.showLoading = showLoading;
//# sourceMappingURL=vsc.js.map