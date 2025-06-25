"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const vscode_1 = __importStar(require("vscode"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const _1 = require(".");
class Config {
    constructor() {
        this.initContext();
    }
    /**
     * 获取全部配置
     */
    get extConfig() {
        return { ...this.getCodeConfig(), ...this.getLocalConfig() };
    }
    initContext() {
        for (const key in this.extConfig) {
            const val = this.extConfig[key];
            vscode_1.default.commands.executeCommand('setContext', `config.${_1.CONFIG_GROUP}.${key}`, val);
        }
    }
    /**
     * 获取 vscode 配置
     */
    getCodeConfig() {
        const resConfig = {};
        _1.CONFIG_LIST.forEach((configKey) => {
            const settingsKey = `${_1.CONFIG_GROUP}.${configKey}`;
            resConfig[configKey] = vscode_1.workspace.getConfiguration().get(settingsKey);
        });
        return resConfig;
    }
    /**
     * 写入 vscode 配置
     * @param config
     */
    setCodeConfig(config) {
        for (const configKey in config) {
            const settingsKey = `${_1.CONFIG_GROUP}.${configKey}`;
            const val = config[configKey];
            vscode_1.workspace.getConfiguration().update(settingsKey, val, false);
        }
    }
    getChannelPath() {
        if (vscode_1.default.env.appName.indexOf('Insiders') > 0) {
            return 'Code - Insiders';
        }
        else {
            return 'Code';
        }
    }
    /**
     * 获取全局配置文件路径
     * @param fileName 文件名
     */
    getGlobalStoragePath(fileName = '') {
        const appPath = process.env.APPDATA ||
            (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : '/var/local');
        const channelPath = this.getChannelPath();
        const storagePath = path_1.default.join(channelPath, 'User', 'globalStorage', `${_1.PUBLISHER}.${_1.EXT_NAME}`);
        const globalStoragePath = path_1.default.join(appPath, storagePath, fileName);
        // 如果不存在，则预创建
        if (!fs_1.default.existsSync(globalStoragePath)) {
            try {
                _1.log.info(_1.localize.getLocalize('text.success.create', 'GlobalStorage'));
                (0, _1.mkdirRecursive)(storagePath, appPath);
            }
            catch (error) {
                _1.log.error(_1.localize.getLocalize('text.error.create.folders', globalStoragePath), true);
            }
        }
        return globalStoragePath;
    }
    /**
     * 获取本地文件配置
     */
    getLocalConfig() {
        let config = {};
        if (fs_1.default.existsSync(_1.LOCAL_CONFIG_PATH)) {
            const configStr = fs_1.default.readFileSync(_1.LOCAL_CONFIG_PATH, 'utf-8');
            try {
                config = JSON.parse(configStr);
            }
            catch (error) {
                _1.log.error(error);
            }
        }
        else {
            fs_1.default.writeFileSync(_1.LOCAL_CONFIG_PATH, '{}');
            config = {};
        }
        return config;
    }
    /**
     * 写入本地文件配置
     * @param config
     */
    setLocalConfig(config) {
        const defaultConfig = this.getLocalConfig();
        try {
            const configStr = JSON.stringify(Object.assign({}, defaultConfig, config));
            return fs_1.default.writeFileSync(_1.LOCAL_CONFIG_PATH, configStr, 'utf-8');
        }
        catch (error) {
            _1.log.error(error);
        }
    }
}
exports.config = new Config();
//# sourceMappingURL=config.js.map