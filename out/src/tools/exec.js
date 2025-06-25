"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncExec = void 0;
const child_process_1 = require("child_process");
const const_1 = require("./const");
const tools_1 = require("../tools");
/**
 * 同步执行命令
 * @param {String} bash
 * @param {String} msg
 */
function syncExec(paramsSrc) {
    let params = paramsSrc;
    if (typeof params === 'string')
        params = { bash: params };
    const { bash, msg, inputPath = const_1.WORKSPACE_PATH } = params;
    try {
        const res = (0, child_process_1.execSync)(bash, {
            cwd: inputPath,
        }).toString();
        if (msg)
            tools_1.log.info(`=> ${msg} 成功`);
        return res;
    }
    catch (ex) {
        if (msg)
            tools_1.log.error(`=> ${msg} 失败\n`, ex);
        return ex.toString();
    }
}
exports.syncExec = syncExec;
//# sourceMappingURL=exec.js.map