"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.localize = void 0;
const package_nls_json_1 = __importDefault(require("../../package.nls.json"));
const package_nls_zh_cn_json_1 = __importDefault(require("../../package.nls.zh-cn.json"));
const langs = {
    en: package_nls_json_1.default,
    'zh-cn': package_nls_zh_cn_json_1.default,
};
class Localize {
    constructor() {
        this.locale = '';
        this.localize = {};
    }
    init({ locale }) {
        this.locale = locale;
        this.localize = langs[locale];
    }
    /**
     * 转换换多语言文本
     * @param key
     * @param params
     */
    getLocalize(key, ...params) {
        let res = this.localize[key] || key;
        if (params.length) {
            params.forEach((val, i) => {
                res = res.replace(`\${${i + 1}}`, val);
            });
        }
        return res;
    }
}
/** 多语言 */
exports.localize = new Localize();
exports.localize.init(JSON.parse(process.env.VSCODE_NLS_CONFIG || ''));
//# sourceMappingURL=localize.js.map