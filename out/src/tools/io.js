"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveDocument = exports.requireModule = exports.mkdirRecursive = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const _1 = require(".");
/**
 * 递归创建路径
 * @param dir
 * @param inputPath
 * @param split
 */
function mkdirRecursive(dir, inputPath = _1.WORKSPACE_PATH || '', split = '/') {
    const dirArr = dir.split(split);
    const dir2 = dirArr.reduce((dirPath, folder) => {
        const p1 = path_1.default.join(inputPath, dirPath);
        if (!fs_1.default.existsSync(p1))
            fs_1.default.mkdirSync(p1);
        return dirPath + '/' + folder;
    });
    const p2 = path_1.default.join(inputPath, dir2);
    if (!fs_1.default.existsSync(p2))
        fs_1.default.mkdirSync(p2);
}
exports.mkdirRecursive = mkdirRecursive;
/**
 * 动态导入一个 JS 文件
 * @param modulePath 要导入的文件路径
 * @param clearCache 是否清除缓存
 */
function requireModule(modulePath, clearCache = true) {
    try {
        const m = require(modulePath);
        if (clearCache) {
            setTimeout(() => {
                delete require.cache[require.resolve(modulePath)];
            }, 200);
        }
        return m;
    }
    catch (error) {
        throw new Error(error);
    }
}
exports.requireModule = requireModule;
/**
 * 保存文件
 * @param docStr
 * @param filePath
 */
async function saveDocument(docStr, filePath) {
    return new Promise((resolve, reject) => {
        const dir = path_1.default.dirname(filePath);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        try {
            fs_1.default.writeFileSync(filePath, docStr, 'utf-8');
            resolve(void 0);
        }
        catch (error) {
            _1.log.error(error, true);
            reject();
        }
    });
}
exports.saveDocument = saveDocument;
//# sourceMappingURL=io.js.map