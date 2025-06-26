"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAPIV3Parser = void 0;
const tools_1 = require("../tools");
const _1 = require("./");
class OpenAPIV3Parser extends _1.BaseParser {
    parse() {
        const { paths } = this.swaggerJson;
        for (const path in paths) {
            const pathItem = paths[path];
            try {
                // log.info(!pathItem+"???"+JSON.stringify(pathItem))
                if (!pathItem)
                    continue;
                const pathItemKeys = Object.keys(pathItem);
                const multipleMethod = pathItemKeys.length > 1;
                pathItemKeys.forEach((method) => {
                    try {
                        return this.parseMethodItem(path, pathItem[method], method, multipleMethod);
                    }
                    catch (e) {
                        tools_1.log.error('error:' +
                            JSON.stringify({
                                path,
                                item: pathItem[method],
                                method,
                                multipleMethod,
                            }));
                    }
                });
            }
            catch (err) {
                tools_1.log.error('error:' + JSON.stringify({ err, content: pathItem }));
            }
        }
        return this.result;
    }
    /** 解析接口方法 */
    parseMethodItem(path, item, method, multipleMethod) {
        const { description, summary, tags, operationId, parameters, requestBody, responses, } = item;
        const fileName = this.getKebabNameByPath(path);
        const pathName = this.getCamelNameByKebab(fileName);
        const desc = description || summary || pathName;
        let params = [];
        // get 方法优先解析 parameters 参数，其它方法优先解析 body 参数。
        // TODO: 待调研：优先使用 url search 作为参数的方法除 get 外是否还有其它。
        if (['GET'].includes(method.toUpperCase())) {
            if (parameters) {
                params = this.parseParameters(parameters);
            }
            else if (requestBody) {
                params = this.parseRequestBody(requestBody);
            }
        }
        else {
            if (requestBody) {
                params = this.parseRequestBody(requestBody);
            }
            else if (parameters) {
                params = this.parseParameters(parameters);
            }
        }
        const response = this.parseResponse(responses);
        const itemRes = {
            groupName: this.configItem.title,
            type: 'interface',
            key: (0, tools_1.randomId)(`${desc}-xxxxxx`),
            basePath: this.configItem.basePath || '',
            parentKey: '',
            savePath: this.configItem.savePath || '',
            method,
            params,
            response,
            title: desc,
            subTitle: path,
            path,
            pathName,
            fileName,
            operationId,
        };
        this.pushGroupItem(tags, itemRes);
    }
    /** 解析 parameters 参数 */
    parseParameters(parameters) {
        if (!parameters) {
            tools_1.log.warn('parseParameters: parameters is null.');
            return [];
        }
        const paramCatchObj = {};
        parameters.forEach((paramItem) => {
            const paramSchema = this.dereferenceSchema(paramItem);
            if (!paramSchema)
                return;
            if (paramSchema.in === 'header')
                return; // 忽略 headers
            if (Object.prototype.hasOwnProperty.call(paramCatchObj, paramSchema?.name))
                return; // 去重，用于解决 NodeJS 的 nest/swagger 不规范定义导致的字段重复问题。
            const schema = this.dereferenceSchema(paramSchema.schema) || {};
            const propertiesItem = {
                name: paramSchema.name,
                description: paramSchema.description,
                ...schema,
                required: paramSchema.required,
            };
            if (paramSchema.required) {
                propertiesItem.itemsRequiredNamesList = schema.required;
            }
            if (schema.type === 'array') {
                paramCatchObj[propertiesItem.name] = this.parseArray(propertiesItem);
            }
            else {
                paramCatchObj[propertiesItem.name] = this.parseObject(propertiesItem);
            }
        });
        return Object.values(paramCatchObj);
    }
    /** 解析 body 参数 */
    parseRequestBody(requestBodyUnresolved) {
        const requestBody = this.dereferenceSchema(requestBodyUnresolved);
        if (!requestBody) {
            tools_1.log.warn('parseRequestBody: requestBody is null.');
            return void 0;
        }
        // WARN: 永远只取首位键值对，通常为：application/json，其它情况忽略
        const requestBodyContent = Object.values(requestBody.content || {})?.[0];
        if (!requestBodyContent) {
            tools_1.log.warn('parseRequestBody: requestBodyContent is null.');
            return void 0;
        }
        const requestBodySchema = this.dereferenceSchema(requestBodyContent.schema);
        if (!requestBodySchema) {
            tools_1.log.warn('parseRequestBody: requestBodySchema is null.');
            return void 0;
        }
        return this.parseSchemaObject(requestBodySchema, '');
    }
    getResponseData(responses, key) {
        let responseData = responses[key || 'default'];
        let res;
        // 如果没有指定 key 或 default，取第一个 content 不为空的值
        if (!responseData) {
            for (const k in responses) {
                const v = responses[k];
                if (v?.content) {
                    responseData = v;
                    break;
                }
            }
        }
        if (responseData) {
            // WARN: 永远只取首位键值对，通常为：application/json，其它情况忽略
            res = Object.values(responseData.content || {})?.[0];
        }
        if (!res && !key) {
            for (const code in responses) {
                const val = responses[code];
                res = val?.content?.['application/json'];
                if (res)
                    break;
            }
        }
        return res;
    }
    /** 解析接口返回值 */
    parseResponse(responses) {
        const responseBodyContent = this.getResponseData(responses);
        if (!responseBodyContent) {
            tools_1.log.warn('parseResponse: responseBodyContent is null.');
            return void 0;
        }
        const responseBodySchema = this.dereferenceSchema(responseBodyContent.schema);
        if (!responseBodySchema) {
            tools_1.log.warn('parseResponse: responseBodySchema is null.');
            return void 0;
        }
        return this.parseSchemaObject(responseBodySchema, '');
    }
    parseSchemaObject(schema, name, itemsRequiredNamesList) {
        let requiredBoolean = false;
        if (itemsRequiredNamesList) {
            requiredBoolean = itemsRequiredNamesList.includes(name);
        }
        if (schema.type === 'array') {
            const { required, ...val } = schema;
            return this.parseArray({
                ...val,
                name,
                required: requiredBoolean,
                itemsRequiredNamesList: required,
            });
        }
        else {
            const { required, ...val } = schema;
            return this.parseObject({
                ...val,
                name,
                required: requiredBoolean,
                itemsRequiredNamesList: required,
            });
        }
    }
    /** 解析数组 */
    parseArray(arrayItem, parentRef) {
        const { type, description } = arrayItem;
        let items = this.dereferenceSchema(arrayItem.items) || {};
        if (items.title === 'WorkOrderCodeVO') {
            console.log();
        }
        const { type: itemsType, ...itemsData } = items;
        const itemSchema = {
            name: arrayItem.name,
            type,
            itemsType,
            description,
            ...itemsData,
            required: undefined,
        };
        if (arrayItem.itemsRequiredNamesList) {
            itemSchema.required = arrayItem.itemsRequiredNamesList.includes(arrayItem.name);
        }
        if (!type) {
            return itemSchema;
        }
        if (itemsType === 'array') {
            return this.parseArray(itemSchema);
        }
        else {
            if (items.required) {
                itemSchema.itemsRequiredNamesList = items.required;
            }
            return this.parseObject(itemSchema, items.title);
        }
    }
    /** 解析对象 */
    parseObject(propertiesItem, parentRef) {
        const { properties, allOf, itemsRequiredNamesList } = propertiesItem;
        const res = {
            ...propertiesItem,
        };
        if (res.properties) {
            res.item = this.parseProperties(properties, itemsRequiredNamesList, res);
            return res;
        }
        if (allOf && allOf.length === 1) {
            const allOfSingleSchema = this.dereferenceSchema(allOf[0]);
            if (!allOfSingleSchema)
                return res;
            res.item = this.parseProperties(allOfSingleSchema.properties, itemsRequiredNamesList);
        }
        return res;
    }
    parseProperties(properties, itemsRequiredNamesList, items) {
        const arr = [];
        for (const name in properties) {
            const schemaSource = properties[name];
            const propertiesSchema = this.dereferenceSchema(schemaSource);
            // @ts-ignore
            const propertiesRef = this.dereferenceSchema(propertiesSchema.items);
            if (!propertiesSchema) {
                continue;
            }
            arr.push(items?.title === propertiesRef?.title
                ? this.parseArray({
                    // ...propertiesRef,
                    // ...propertiesSchema,
                    name,
                    required: undefined,
                    itemsRequiredNamesList: undefined,
                })
                : this.parseSchemaObject(propertiesSchema, name, itemsRequiredNamesList));
        }
        return arr;
    }
    /** 去重合并 allOf 元数据数组 */
    mergeAllOf(a, b) {
        if (!a || typeof a === 'string') {
            return b;
        }
        else if (!b || typeof b === 'string') {
            return a;
        }
        const cacheObj = {};
        a.forEach((v) => {
            cacheObj[v.name] = v;
        });
        b.forEach((v) => {
            if (cacheObj[v.name])
                return; // 重复则忽略后数据
            cacheObj[v.name] = v;
        });
        return Object.values(cacheObj);
    }
    /** SchemaObject 解引用 */
    dereferenceSchema(schema) {
        if (!schema)
            return;
        if (schema.$ref) {
            const pathStr = schema.$ref.substring(1, schema.$ref.length);
            return (0, tools_1.getValueByPath)(this.swaggerJson, pathStr);
        }
        else {
            return schema;
        }
    }
}
exports.OpenAPIV3Parser = OpenAPIV3Parser;
//# sourceMappingURL=swagger-parser-v3.js.map