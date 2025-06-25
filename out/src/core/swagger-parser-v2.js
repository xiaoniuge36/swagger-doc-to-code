"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSwaggerJson = void 0;
const tools_1 = require("../tools");
function parseSwaggerJson(swaggerJson, configItem) {
    const { tags, paths, definitions } = swaggerJson;
    const res = [];
    // console.log(swaggerJson)
    function addTag(item) {
        const itemIndex = res.length;
        tagsMap[item.name] = itemIndex;
        const tagItem = {
            key: (0, tools_1.randomId)(`${item.name}-xxxxxx`),
            parentKey: configItem.url,
            title: item.name,
            subTitle: item.description || '',
            savePath: configItem.savePath || tools_1.config.extConfig.savePath,
            type: 'group',
        };
        res.push(tagItem);
    }
    const tagsMap = {};
    if (tags && tags.length) {
        tags.forEach((v) => {
            addTag({ name: v.name, description: v.description });
        });
    }
    /**
     *
     * @param path
     * @param pathItem
     * @param method
     * @param multipleMethod 是否具有多个方法
     */
    function parseMethodItem(path, pathItem, method, multipleMethod) {
        const { summary, description, tags, parameters = [], responses = {}, ...item } = pathItem[method];
        let fileName = path.slice(1, path.length).replace(/\//g, '-');
        if (multipleMethod)
            fileName += `-${method.toLowerCase()}`;
        const pathName = (0, tools_1.toCamel)(fileName)
            .replace(/[-\/\s]/, '')
            .replace(/[\[\]<>(){|}\*]/g, '$');
        let params = [];
        if (!parameters || !parameters.length) {
            params = [];
        }
        else {
            const bodyIndex = parameters.findIndex((x) => x.in === 'body');
            if (bodyIndex !== -1) {
                const paramsBody = parameters[bodyIndex];
                const paramsSource = paramsBody.schema && getSwaggerJsonRef(paramsBody.schema, definitions);
                if (paramsBody?.schema?.type && !paramsSource?.properties?.length) {
                    paramsSource?.properties?.push({
                        name: '____body_root_param____',
                        description: paramsBody.description,
                        ...paramsBody.schema,
                    });
                }
                if (paramsSource && paramsSource.properties) {
                    const { properties } = paramsSource;
                    for (const name in properties) {
                        const val = properties[name];
                        const obj = {
                            name,
                            ...val,
                        };
                        params.push(obj);
                    }
                }
            }
            else {
                // 忽略 headers
                params = parameters.filter((x) => x.in !== 'header');
            }
        }
        let response = {};
        if (responses) {
            const responseBody = responses[200] || {};
            try {
                response = getSwaggerJsonRef(responseBody.schema, definitions);
            }
            catch (error) {
                // DESC 将错误信息输出到 devTools 控制台, 避免记录过多日志.
                console.warn(responseBody.schema);
                // console.error(error)
            }
        }
        const desc = description || summary || pathName;
        const itemRes = {
            groupName: configItem.title,
            type: 'interface',
            key: (0, tools_1.randomId)(`${desc}-xxxxxx`),
            basePath: configItem.basePath || swaggerJson.basePath || '',
            parentKey: '',
            method,
            params,
            response,
            title: desc,
            subTitle: path,
            path,
            pathName,
            fileName,
            savePath: configItem.savePath || tools_1.config.extConfig.savePath,
            ...item,
        };
        if (tags && tags.length) {
            tags.forEach((tagStr) => {
                let tagIndex = tagsMap[tagStr];
                if (tagIndex === undefined) {
                    tagIndex = tagsMap['未知分组'];
                    if (!tagIndex) {
                        addTag({ name: '未知分组', description: '分组ID在TAG表中未找到 (无效 Tag)' });
                        tagIndex = tagsMap['未知分组'];
                    }
                }
                const tagVal = res[tagIndex];
                itemRes.parentKey = tagVal.key;
                if (res[tagIndex].children && Array.isArray(tagVal.children)) {
                    tagVal.children?.push(itemRes);
                }
                else {
                    tagVal.children = [itemRes];
                }
            });
        }
        else {
            res.push(itemRes);
        }
        // console.log(itemRes)
        // return itemRes
    }
    try {
        for (const path in paths) {
            const pathItem = paths[path];
            const pathItemKeys = Object.keys(pathItem);
            pathItemKeys.forEach((method) => {
                parseMethodItem(path, pathItem, method, pathItemKeys.length > 1);
            });
        }
    }
    catch (error) {
        tools_1.log.error(error, true);
    }
    return res;
}
exports.parseSwaggerJson = parseSwaggerJson;
// 递归获取 ref
function getSwaggerJsonRef(schema, definitions) {
    const { items, originalRef } = schema || {};
    let { $ref } = schema || {};
    let refData = {};
    if (items) {
        const { 
        // originalRef: itemOriginalRef,
        $ref: item$ref, } = items;
        // if (itemOriginalRef) originalRef = itemOriginalRef
        if (item$ref)
            $ref = item$ref;
    }
    let refPath = '';
    if (originalRef && definitions) {
        refPath = originalRef?.trim();
        refData = definitions[refPath];
    }
    else if ($ref) {
        refPath = $ref.trim().replace('#/definitions/', '').replace('/', '.');
        refData = (0, tools_1.getValueByPath)(definitions, refPath);
    }
    if (!refData) {
        tools_1.log.error('getSwaggerJsonRef Error:' + JSON.stringify({ res: refData, originalRef, schema, refPath }, undefined, 2), true);
    }
    const propertiesList = [];
    const { properties, required = [] } = refData || {};
    if (properties) {
        for (const key in properties) {
            const val = properties[key];
            const obj = {
                name: val.name || key,
                type: val.type,
                required: required && required.length && required.includes(key) ? true : false,
                description: val.description,
                titRef: val.title,
            };
            if ((val.originalRef && val.originalRef != originalRef) || (val.$ref && val.$ref != $ref)) {
                obj.item = getSwaggerJsonRef(val, definitions);
            }
            if (val.items) {
                let schema;
                if (val.items.schema) {
                    schema = val.items.schema;
                }
                else if (val.items.originalRef || val.items.$ref) {
                    schema = val.items;
                }
                else if (val.items.type) {
                    obj.itemsType = val.items.type;
                }
                else if (val.originalRef || val.$ref) {
                    schema = val;
                }
                if (schema && (schema.originalRef != originalRef || schema.$ref != $ref)) {
                    obj.item = getSwaggerJsonRef(schema, definitions);
                }
            }
            propertiesList.push(obj);
        }
    }
    return Object.assign({}, refData, {
        properties: propertiesList,
        item: propertiesList,
    });
}
//# sourceMappingURL=swagger-parser-v2.js.map