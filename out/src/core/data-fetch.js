"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestJson = exports.getSwaggerJson = void 0;
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const tools_1 = require("../tools");
/** 获取 Swagger JSON 数据 */
async function getSwaggerJson(url) {
    if (/^https?:\/\//.test(url)) {
        return requestJson(url);
    }
    else {
        try {
            const res = (0, tools_1.requireModule)(path_1.default.join(tools_1.WORKSPACE_PATH || '', url));
            return Promise.resolve(res);
        }
        catch (err) {
            tools_1.log.error(err, true);
            return Promise.reject(err);
        }
    }
}
exports.getSwaggerJson = getSwaggerJson;
/** 发起请求 */
function requestJson(url) {
    return new Promise((resolve, reject) => {
        let TM;
        const request = /^https/.test(url) ? https_1.default.request : http_1.default.request;
        tools_1.log.info(`Request Start: ${url}`);
        const req = request(url, {
            method: 'GET',
            rejectUnauthorized: false,
            headers: {
                Accept: '*/*',
                'Accept-Encoding': 'utf-8',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        }, (res) => {
            res.setEncoding('utf-8'); // 解决中文乱码
            let dataStr = '';
            res.on('data', (data) => {
                dataStr += data.toString();
            });
            res.on('end', () => {
                clearTimeout(TM);
                try {
                    const json = JSON.parse(dataStr);
                    tools_1.log.info(`Request Successful: ${url}`);
                    resolve(json);
                }
                catch (error) {
                    tools_1.log.error(`Request Failed: ${url}`, true);
                    reject(error);
                }
            });
            res.on('error', (err) => {
                tools_1.log.error(`Request Failed: ${url}`, true);
                reject(err);
            });
        });
        req.on('timeout', (err) => {
            tools_1.log.error(err, true);
            reject(err);
        });
        TM = setTimeout(() => {
            const err = new Error();
            err.name = 'Request Timeout';
            err.message = url;
            req.emit('timeout', err);
        }, 15000); // 15秒超时
        req.end();
    });
}
exports.requestJson = requestJson;
//# sourceMappingURL=data-fetch.js.map