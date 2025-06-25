"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseParser = void 0;
const tools_1 = require("../tools");
class BaseParser {
    constructor(swaggerJson, configItem) {
        this.swaggerJson = swaggerJson;
        this.configItem = configItem;
        this.tagsMap = {};
        this.result = [];
        const { tags } = swaggerJson;
        if (tags && tags.length) {
            tags.forEach((v) => {
                this.addGroup({ name: v.name, description: v.description });
            });
        }
        // console.log(swaggerJson, configItem)
    }
    /** 添加分组 */
    addGroup(item) {
        const itemIndex = this.result.length;
        this.tagsMap[item.name] = itemIndex;
        const tagItem = {
            key: (0, tools_1.randomId)(`${item.name}-xxxxxx`),
            parentKey: this.configItem.url,
            title: item.name,
            subTitle: item.description || '',
            savePath: this.configItem.savePath || tools_1.config.extConfig.savePath,
            type: 'group',
        };
        this.result.push(tagItem);
        return itemIndex;
    }
    /** 添加分组内元素 */
    pushGroupItem(tags, itemRes) {
        if (!itemRes.savePath) {
            itemRes.savePath = this.configItem.savePath || tools_1.config.extConfig.savePath;
        }
        if (tags && tags.length) {
            tags.forEach((tagStr) => {
                let tagIndex = this.tagsMap[tagStr];
                if (tagIndex === undefined) {
                    tagIndex = this.addGroup({ name: tagStr, description: '' });
                    if (!(0, tools_1.isDef)(tagIndex)) {
                        this.addGroup({ name: 'Unknown', description: '' });
                        tagIndex = this.tagsMap['Unknown'];
                    }
                }
                const tagVal = this.result[tagIndex];
                itemRes.parentKey = tagVal.key;
                if (this.result[tagIndex].children && Array.isArray(tagVal.children)) {
                    tagVal.children?.push(itemRes);
                }
                else {
                    tagVal.children = [itemRes];
                }
            });
        }
        else {
            this.result.push(itemRes);
        }
    }
    getKebabNameByPath(path) {
        return path.slice(1, path.length).replace(/\//g, '-').replace(/\s/g, '');
    }
    getCamelNameByKebab(kebab) {
        return (0, tools_1.toCamel)(kebab)
            .replace(/[\/\s]/g, '')
            .replace(/[\[\]<>(){|}\*]/g, '$');
    }
}
exports.BaseParser = BaseParser;
//# sourceMappingURL=swagger-parser-base.js.map