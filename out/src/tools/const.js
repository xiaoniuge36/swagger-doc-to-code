"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BASE_INDENTATION_COUNT = exports.BASE_INDENTATION = exports.DEFAULT_TEMPLATE_FILE_PATH = exports.TEMPLATE_FILE_NAME = exports.CONFIG_GROUP = exports.LOCAL_CONFIG_PATH = exports.PUBLISHER = exports.EXT_PATH = exports.EXT_NAME = exports.CONFIG_LIST = exports.WORKSPACE_PATH = void 0;
const vscode_1 = __importDefault(require("vscode"));
const package_json_1 = __importDefault(require("../../package.json"));
const path_1 = __importDefault(require("path"));
const { workspaceFolders } = vscode_1.default.workspace;
/** 工作区路径 */
exports.WORKSPACE_PATH = workspaceFolders ? workspaceFolders[0].uri.fsPath.replace(/\\/g, '/') : undefined;
/** 插件设置 */
exports.CONFIG_LIST = [
    'swaggerJsonUrl',
    'savePath',
    'compareChanges',
    'showStatusbarItem',
    'reloadWhenSettingsChanged',
];
/** 插件名称 */
exports.EXT_NAME = package_json_1.default.name;
/** 插件本体路径 */
exports.EXT_PATH = path_1.default.join(__dirname, '../../../');
/** 插件发布者 */
exports.PUBLISHER = package_json_1.default.publisher;
/** 插件私有配置文件路径 */
exports.LOCAL_CONFIG_PATH = path_1.default.join(exports.EXT_PATH, 'local.config.json');
/** vscode 配置项前缀 */
exports.CONFIG_GROUP = 'swaggerToTypes';
/** 模板配置文件名 */
exports.TEMPLATE_FILE_NAME = 'swagger-to-types.template.js';
/** 默认模板配置文件路径 */
exports.DEFAULT_TEMPLATE_FILE_PATH = path_1.default.join(exports.EXT_PATH, 'templates/new.template.js');
/** 默认缩进单位 */
exports.BASE_INDENTATION = ' ';
/** 默认缩进宽度 */
exports.BASE_INDENTATION_COUNT = 2;
//# sourceMappingURL=const.js.map