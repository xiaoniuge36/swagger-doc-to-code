import fs from 'fs'
import path from 'path'
import vscode from 'vscode'

import {
  WORKSPACE_PATH,
  EXT_NAME,
  config,
  localize,
  preSaveDocument,
  saveDocument,
  log,
  deleteEmptyProperty,
  TEMPLATE_FILE_NAME,
  DEFAULT_TEMPLATE_FILE_PATH,
} from '../tools'
import { openListPicker, renderToInterface } from '../core'

import { ViewList, ListItem } from '../views/list.view'
import { ViewLocal, LocalItem, TreeInterface } from '../views/local.view'
import { SwaggerJsonTreeItem } from '../core/swagger-parser-v2'
import { TemplateGenerator } from '../templates/template-generator'

/** 创建模板文件（如果不存在） */
async function createTemplateFileIfNotExists() {
  if (!WORKSPACE_PATH) {
    log.warn('工作区路径未找到，无法创建模板文件')
    return
  }

  const vscodeDir = path.join(WORKSPACE_PATH, '.vscode')
  const templatePath = path.join(vscodeDir, TEMPLATE_FILE_NAME)

  // 检查模板文件是否已存在
  if (fs.existsSync(templatePath)) {
    log.info('模板文件已存在，跳过创建')
    return
  }

  try {
    // 确保.vscode目录存在
    if (!fs.existsSync(vscodeDir)) {
      fs.mkdirSync(vscodeDir, { recursive: true })
      log.info('已创建 .vscode 目录')
    }

    // 使用模板生成器创建增强的模板内容
    const enhancedTemplateContent = TemplateGenerator.generateEnhancedTemplate()

    // 写入模板文件
    fs.writeFileSync(templatePath, enhancedTemplateContent, 'utf8')
    
    // 立即重新加载模板配置，避免需要重启VSCode
    const { getWorkspaceTemplateConfig } = await import('../tools/get-templates')
    getWorkspaceTemplateConfig()
    
    log.info('✅ 模板文件已自动生成', true)
    vscode.window.showInformationMessage(
      `🎉 接口模板已生成！\n\n文件位置: .vscode/${TEMPLATE_FILE_NAME}\n\n您可以编辑此文件来自定义生成的接口代码格式。\n\n模板配置已自动加载，无需重启VSCode！`,
      '打开模板文件'
    ).then((selection) => {
      if (selection === '打开模板文件') {
        vscode.workspace.openTextDocument(templatePath).then((doc) => {
          vscode.window.showTextDocument(doc)
        })
      }
    })
    
  } catch (error) {
    log.error(`创建模板文件失败: ${error}`, true)
  }
}

export function registerListCommands({
  viewList,
  viewLocal,
  listTreeView,
  localTreeView,
}: {
  viewList: ViewList
  viewLocal: ViewLocal
  listTreeView: vscode.TreeView<ListItem>
  localTreeView: vscode.TreeView<LocalItem>
}) {
  const commands = {
    /** 刷新 API 列表 */
    refresh: () => {
      viewList.refresh()
    },

    /** 选择接口 */
    onSelect: (e: TreeInterface) => {
      const savePath = e.savePath || config.extConfig.savePath || ''
      
      // 根据分组信息创建目录结构
      let finalSavePath = savePath
      
      // 优先使用 groupName，如果没有则使用 title 作为分组名
      const groupName = e.groupName || e.title
      if (groupName && groupName !== 'Default') {
        // 清理分组名，移除特殊字符，确保可以作为目录名
        const cleanGroupName = groupName.replace(/[<>:"/\\|?*]/g, '_').trim()
        if (cleanGroupName) {
          finalSavePath = path.join(savePath, cleanGroupName)
        }
      }

      const filePath = path.join(WORKSPACE_PATH || '', finalSavePath, `${e.pathName}.d.ts`)
      preSaveDocument(renderToInterface(e), filePath, true)
    },

    /** 添加 swagger 项目 */
    async add() {
      const titleText = localize.getLocalize('text.title')
      const urlText = localize.getLocalize('text.swaggerJsonUrl')
      const savePathText = localize.getLocalize('text.config.savePath')

      const url = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        title: localize.getLocalize('temp.input.placeholder', urlText),
        placeHolder: 'http://',
      })

      if (!url) {
        vscode.window.showErrorMessage(localize.getLocalize('temp.input.none', urlText))
        return
      }

      config.extConfig.swaggerJsonUrl.forEach((v) => {
        if (v.url === url) {
          log.error(localize.getLocalize('text.exist', urlText), true)
          throw new Error()
        }
      })

      const title = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        title: localize.getLocalize('temp.input.placeholder', titleText),
      })

      if (!title) {
        vscode.window.showErrorMessage(localize.getLocalize('temp.input.none', titleText))
        return
      }

      const savePath = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        title: localize.getLocalize('temp.input.placeholder', savePathText),
        placeHolder: `${config.extConfig.savePath} (${localize.getLocalize('text.canBeEmpty')})`,
      })

      const swaggerJsonUrl = Object.assign([], config.extConfig.swaggerJsonUrl || [])
      swaggerJsonUrl.push(deleteEmptyProperty({ title, url, savePath }))
      config.setCodeConfig({ swaggerJsonUrl })
      log.info(`<cmd.list.add> Add Swagger Project: [${title}]`)
      
      // 自动创建模板文件
      await createTemplateFileIfNotExists()
      
      setTimeout(() => {
        viewList.refresh()
      }, 200)
    },

    /** 搜索接口列表 (远程) */
    search() {
      openListPicker({
        title: `${EXT_NAME} - ${localize.getLocalize('command.search')} (UPDATE:${viewList.updateDate})`,
        placeholder: localize.getLocalize('text.search.placeholder'),
        before: () => viewList.getSearchList(),
      }).then((res) => {
        if (!res.source) return log.error('Picker.res.source is undefined', true)
        if (!res.configItem) return log.error('Picker.res.configItem is undefined', true)

        let hasLocalFile = false
        for (let i = 0; i < viewLocal.allSavePath.length; i++) {
          const localPath = viewLocal.allSavePath[i]
          const filePath = path.join(localPath, `${res.source.pathName}.d.ts`)
          if (fs.existsSync(filePath)) {
            const fileInfo = viewLocal.readLocalFile(filePath)
            if (fileInfo) {
              hasLocalFile = true
              localTreeView.reveal(viewLocal.renderItem(fileInfo), { expand: true, select: true })
            }
          }
        }
        if (hasLocalFile) return // 已有本地文件

        const listItem = viewList.transformToListItem(res.source, res.configItem)
        listTreeView.reveal(listItem, { expand: true, select: true }).then(() => {
          setTimeout(() => {
            commands.onSelect(res.source as unknown as TreeInterface)
          }, 100)
        })
      })
    },

    /** 保存接口至本地 (单个/批量) */
    async saveInterface(item: ListItem) {
      console.log('cmd.list.saveInterface', item)
      switch (item.options.type) {
        case 'group':
          // 批量保存开始提示
          log.info(
            `${localize.getLocalize('command.saveInterface')}(${localize.getLocalize('text.group')}) <${
              item.label
            }> 开始批量保存...`,
            true
          )
          
          viewList
            .saveInterfaceGroup(item)
            .then(() => {
              log.info(
                `${localize.getLocalize('command.saveInterface')}(${localize.getLocalize('text.group')}) <${
                  item.label
                }> ${localize.getLocalize('success')}`,
                true
              )

              viewLocal.refresh()
            })
            .catch((err) => {
              log.error(
                `${localize.getLocalize('command.saveInterface')}(${localize.getLocalize('text.group')}) <${
                  item.label
                }> ${localize.getLocalize('failed')} ${err}`,
                true
              )
            })
          break

        case 'interface':
          let interfaceItem: TreeInterface | undefined
          try {
            // @ts-ignore
            interfaceItem = item.command?.arguments[0]
          } catch (error) {
            log.error(error, true)
          }

          if (!interfaceItem) {
            return log.error('interfaceItem is undefined.', true)
          }

          // 确保接口项有正确的分组信息
          if (!interfaceItem.groupName && item.options.parentKey) {
            // 从父级获取分组信息
            const listData = viewList.swaggerJsonMap.get(item.options.configItem.url) || []
            const parentGroup = listData.find((x) => x.key === item.options.parentKey)
            if (parentGroup) {
              interfaceItem.groupName = parentGroup.title || parentGroup.groupName
            }
          }

          viewList
            .saveInterface(interfaceItem, undefined, item.options.configItem.url)
            .then(() => {
              log.info(
                `${localize.getLocalize('command.saveInterface')} <${item.label}> ${localize.getLocalize('success')}`,
                true
              )
              viewLocal.refresh()
              
              // 提示用户根据需求修改接口文档
              vscode.window.showInformationMessage(
                `🎉 接口 "${item.label}" 导入成功！\n\n💡 提示：您可以根据项目需求修改生成的接口文档，包括：\n• 调整参数类型和命名\n• 添加业务逻辑注释\n• 修改请求函数模板\n• 自定义响应数据结构`,
                '查看接口文件',
                '编辑模板配置'
              ).then((selection) => {
                if (selection === '查看接口文件') {
                  // 打开生成的接口文件
                  const savePath = interfaceItem?.savePath || config.extConfig.savePath || ''
                  
                  // 使用viewList的buildGroupPath方法计算正确的文件路径
                  let finalSavePath = savePath
                  if (interfaceItem) {
                    const groupPathSegments = viewList.buildGroupPath(interfaceItem, item.options.configItem.url)
                    if (groupPathSegments.length > 0) {
                      finalSavePath = path.join(savePath, ...groupPathSegments)
                    }
                  }
                  
                  const filePath = path.join(WORKSPACE_PATH || '', finalSavePath, `${interfaceItem?.pathName}.d.ts`)
                  if (fs.existsSync(filePath)) {
                    vscode.workspace.openTextDocument(filePath).then((doc) => {
                      vscode.window.showTextDocument(doc)
                    })
                  }
                } else if (selection === '编辑模板配置') {
                  // 打开模板配置文件
                  const templatePath = path.join(WORKSPACE_PATH || '', '.vscode', TEMPLATE_FILE_NAME)
                  if (fs.existsSync(templatePath)) {
                    vscode.workspace.openTextDocument(templatePath).then((doc) => {
                      vscode.window.showTextDocument(doc)
                    })
                  } else {
                    vscode.window.showWarningMessage(
                      '模板配置文件不存在，是否要立即创建？',
                      '创建模板文件',
                      '取消'
                    ).then((selection) => {
                      if (selection === '创建模板文件') {
                        vscode.commands.executeCommand('cmd.local.createTemplate')
                      }
                    })
                  }
                }
              })
            })
            .catch((err) => {
              log.error(
                `${localize.getLocalize('command.saveInterface')} <${item.label}> ${localize.getLocalize(
                  'failed'
                )} ${err}`,
                true
              )
            })
          break

        default:
          log.warn(localize.getLocalize('error.action'), true)
          log.warn(JSON.stringify(item))
          break
      }
    },

    /** 保存文档 */
    saveInterfaceWitchDoc(doc: vscode.TextDocument) {
      const docText = doc.getText()
      saveDocument(docText, doc.fileName).then(() => {
        viewLocal.refresh()
        preSaveDocument(docText, doc.fileName) // 更新显示状态
      })
    },
  }

  for (const command in commands) {
    vscode.commands.registerCommand(`cmd.list.${command}`, commands[command])
  }
}
