"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEmptyProperty = exports.deleteProperty = exports.isDef = exports.setValueByPath = exports.getValueByPath = exports.randomId = exports.formatDate = exports.toCamel = void 0;
/**
 * 中划线转驼峰
 * @param {String} str
 * @param {Boolean} c 首字母是否大写
 */
function toCamel(str, c, s = '-') {
    const REG = new RegExp(`([^${s}])(?:${s}+([^${s}]))`, 'g');
    let strH = str.replace(REG, (_, $1, $2) => $1 + $2.toUpperCase());
    if (c)
        strH = strH.slice(0, 1).toUpperCase() + strH.slice(1);
    return strH;
}
exports.toCamel = toCamel;
/**
 * 格式化日期
 * @param d
 * @param format 'YYYY-MM-DD HH:mm:ss.ms'
 */
function formatDate(date = new Date(), format = 'YYYY-MM-DD HH:mm:ss.ms') {
    const obj = {
        YYYY: date.getFullYear().toString().padStart(4, '0'),
        MM: (date.getMonth() + 1).toString().padStart(2, '0'),
        DD: date.getDate().toString().padStart(2, '0'),
        HH: date.getHours().toString().padStart(2, '0'),
        mm: date.getMinutes().toString().padStart(2, '0'),
        ss: date.getSeconds().toString().padStart(2, '0'),
        ms: date.getMilliseconds().toString().padStart(3, '0'),
    };
    return format.replace(/(YYYY|MM|DD|HH|mm|ss|ms)/g, (_, $1) => {
        return obj[$1];
    });
}
exports.formatDate = formatDate;
/**
 * 生成一组随机 ID
 * @param {String} 格式, x 为随机字符
 */
function randomId(t = 'id-xxxxx') {
    return t.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0, v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
exports.randomId = randomId;
/**
 * 通过路径查找值
 * @param obj
 * @param path
 * @param splitStr
 */
function getValueByPath(obj, path) {
    if (!obj)
        return undefined;
    let tempObj = obj;
    let pathH = path.replace(/\[(\w+)\]/g, '.$1');
    pathH = pathH.replace(/^[\.|\/]/, '');
    const keyArr = pathH.split(/[\.|\/]/);
    let i = 0;
    for (let len = keyArr.length; i < len - 1; ++i) {
        const key = keyArr[i];
        if (key in tempObj) {
            tempObj = tempObj[key];
        }
        else {
            break;
        }
    }
    return tempObj ? tempObj[keyArr[i]] : undefined;
}
exports.getValueByPath = getValueByPath;
/**
 * 通过路径写入值
 * @param obj
 * @param path
 * @param strict
 */
function setValueByPath(obj, path, value) {
    let tempObj = obj;
    let pathH = path.replace(/\[(\w+)\]/g, '.$1');
    pathH = pathH.replace(/^\./, '');
    const keyArr = pathH.split('.');
    for (let i = 1; i <= keyArr.length; i++) {
        const key = keyArr[i - 1];
        if (i >= keyArr.length) {
            tempObj[key] = value;
        }
        else {
            tempObj = tempObj[key];
        }
    }
}
exports.setValueByPath = setValueByPath;
function isDef(val) {
    return val !== undefined && val !== null;
}
exports.isDef = isDef;
/**
 * 删除指定值的属性
 * @param obj
 * @param v
 * @returns
 */
function deleteProperty(obj, v) {
    const res = {};
    const isArray = Array.isArray(v);
    for (const key in obj) {
        if (isArray) {
            if (!v.includes(obj[key]))
                res[key] = obj[key];
        }
        else {
            if (obj[key] !== v)
                res[key] = obj[key];
        }
    }
    return res;
}
exports.deleteProperty = deleteProperty;
/**
 * 删除对象中空值字段
 * @param obj
 * @returns
 */
function deleteEmptyProperty(obj) {
    return deleteProperty(obj, [undefined, null, '']);
}
exports.deleteEmptyProperty = deleteEmptyProperty;
//# sourceMappingURL=utils.js.map