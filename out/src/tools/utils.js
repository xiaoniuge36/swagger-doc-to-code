"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertChineseToEnglish = exports.deleteEmptyProperty = exports.deleteProperty = exports.isDef = exports.setValueByPath = exports.getValueByPath = exports.randomId = exports.formatDate = exports.toCamel = void 0;
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
/**
 * 检测字符串是否包含中文字符
 * @param str 待检测的字符串
 * @returns 是否包含中文字符
 */
function containsChinese(str) {
    return /[\u4e00-\u9fff]/.test(str);
}
/**
 * 常用中文词汇的优化映射表（用于提高常见词汇的翻译质量）
 */
const commonChineseMap = {
    // 用户相关
    '用户': 'user',
    '用户管理': 'user-management',
    '用户信息': 'user-info',
    '用户列表': 'user-list',
    // 订单相关
    '订单': 'order',
    '订单管理': 'order-management',
    '订单信息': 'order-info',
    '订单列表': 'order-list',
    // 商品相关
    '商品': 'product',
    '商品管理': 'product-management',
    '商品信息': 'product-info',
    '商品列表': 'product-list',
    // 系统相关
    '系统': 'system',
    '系统管理': 'system-management',
    '系统设置': 'system-settings',
    '系统配置': 'system-config',
    // 权限相关
    '权限': 'permission',
    '权限管理': 'permission-management',
    '角色': 'role',
    '角色管理': 'role-management',
    // 文件相关
    '文件': 'file',
    '文件管理': 'file-management',
    '文件上传': 'file-upload',
    '文件下载': 'file-download',
    // 数据相关
    '数据': 'data',
    '数据管理': 'data-management',
    '数据统计': 'data-statistics',
    '数据分析': 'data-analysis',
    // 日志相关
    '日志': 'log',
    '日志管理': 'log-management',
    '操作日志': 'operation-log',
    '系统日志': 'system-log',
    // 通用操作
    '管理': 'management',
    '操作': 'operations',
    '信息': 'info',
    '列表': 'list',
    '详情': 'detail',
    '设置': 'settings',
    '配置': 'config',
    '统计': 'statistics',
    '分析': 'analysis',
    '报告': 'report',
    '监控': 'monitor',
    '通知': 'notification',
    '消息': 'message',
    '公告': 'announcement',
    // 常用动作
    '获取': 'get',
    '创建': 'create',
    '删除': 'delete',
    '更新': 'update',
    '修改': 'modify',
    '查询': 'query',
    '搜索': 'search',
    '添加': 'add',
    '编辑': 'edit',
    '保存': 'save',
    '提交': 'submit',
    '取消': 'cancel',
    '确认': 'confirm',
    '登录': 'login',
    '注册': 'register',
    '退出': 'logout',
    // 常用名词
    '接口': 'interface',
    '新': 'new',
    '旧': 'old',
    '测试': 'test',
    '开发': 'dev',
    '生产': 'prod',
    '环境': 'env',
    '版本': 'version',
    '状态': 'status',
    '类型': 'type',
    '分类': 'category',
    '标签': 'tag',
    '名称': 'name',
    '标题': 'title',
    '内容': 'content',
    '描述': 'description'
};
/**
 * 将中文分组名称转换为英文
 * @param chineseName 中文名称
 * @returns 英文名称
 */
function convertChineseToEnglish(chineseName) {
    if (!chineseName || typeof chineseName !== 'string') {
        return chineseName;
    }
    // 如果不包含中文字符，直接返回清理后的名称
    if (!containsChinese(chineseName)) {
        return cleanSpecialChars(chineseName);
    }
    // 优先使用常用词汇映射表进行精确匹配
    if (commonChineseMap[chineseName]) {
        return commonChineseMap[chineseName];
    }
    // 尝试部分匹配常用词汇（按长度排序，优先匹配长词汇）
    let result = chineseName;
    const sortedEntries = Object.entries(commonChineseMap)
        .sort(([a], [b]) => b.length - a.length); // 按中文长度降序排列
    for (const [chinese, english] of sortedEntries) {
        if (result.includes(chinese)) {
            result = result.replace(new RegExp(chinese, 'g'), english);
        }
    }
    // 如果还有中文字符，使用拼音转换
    if (containsChinese(result)) {
        try {
            // 动态导入 pinyin-pro
            const { pinyin } = require('pinyin-pro');
            // 将剩余的中文转换为拼音
            result = result.replace(/[\u4e00-\u9fff]+/g, (match) => {
                const pinyinArray = pinyin(match, {
                    toneType: 'none',
                    type: 'array' // 返回数组格式
                });
                return pinyinArray.join('-');
            });
        }
        catch (error) {
            // 如果 pinyin-pro 不可用，使用备用方案
            console.warn('pinyin-pro not available, using fallback method');
            result = result.replace(/[\u4e00-\u9fff]/g, 'cn');
        }
    }
    // 清理特殊字符并格式化
    return cleanSpecialChars(result) || chineseName;
}
exports.convertChineseToEnglish = convertChineseToEnglish;
/**
 * 清理特殊字符，保留字母、数字和连字符
 * @param str 待清理的字符串
 * @returns 清理后的字符串
 */
function cleanSpecialChars(str) {
    return str
        .replace(/[^\w\u4e00-\u9fff-]/g, '-') // 替换特殊字符为连字符
        .replace(/-+/g, '-') // 合并多个连字符
        .replace(/^-|-$/g, '') // 移除首尾连字符
        .toLowerCase(); // 转为小写
}
//# sourceMappingURL=utils.js.map