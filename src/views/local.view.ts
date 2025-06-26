import fs from 'fs'
import path from 'path'
import vscode, { StatusBarItem } from 'vscode'

import { ViewList } from '../views/list.view'
import { BaseTreeProvider, BaseTreeItem, BaseTreeItemOptions } from '../core'
import { config, log, localize, WORKSPACE_PATH, CONFIG_GROUP } from '../tools'

// 类型定义
export interface FileHeaderInfo {
  fileName: string
  filePath: string
  ext: string
  configTitle?: string
  [key: string]: any
}

export interface TreeInterface {
  [key: string]: any
}

// 分组信息接口
export interface GroupInfo {
  groupName: string
  groupPath: string
  files: FileHeaderInfo[]
}

export interface ExtLocalItemOptions {
  /** 文件路径 */
  filePath?: string
  /** 接口主键 (对应 pathName) */
  namespace?: string
  /** 分组路径 */
  groupPath?: string
  /** 保存路径 */
  savePath?: string
  /** 配置标题 */
  configTitle?: string
  /** 项目类型：root、group、interface 或 config-group */
  itemType?: 'root' | 'group' | 'interface' | 'config-group'
}

export class ViewLocal extends BaseTreeProvider<LocalItem> {
  public statusBarItem: StatusBarItem = vscode.window.createStatusBarItem()
  public localFilesList: FileHeaderInfo[] = []
  public localFilesMap = new Map<string, FileHeaderInfo>()
  public groupsMap = new Map<string, GroupInfo>()

  // private localPath = path.resolve(WORKSPACE_PATH || '', config.extConfig.savePath)
  public allSavePath = this.getAllSavePath()
  public viewList: ViewList

  constructor(viewList: ViewList) {
    super()
    this.viewList = viewList
    this.initLocalFiles()
    this.initStatusBarItem()

    /** 监听文件保存 */
    vscode.workspace.onDidSaveTextDocument(({ languageId, fileName }) => {
      // 过滤非 TS 语言文件
      if (languageId !== 'typescript') return

      let isSavePath = false
      for (let i = 0; i < this.allSavePath.length; i++) {
        const savePath = this.allSavePath[i]
        if (fileName.includes(savePath)) {
          isSavePath = true
          continue
        }
      }
      if (!isSavePath) return

      this.updateSingle(fileName)
    })
  }

  /** 获取所有本地文件保存路径 */
  getAllSavePath() {
    const { savePath, swaggerJsonUrl } = config.extConfig
    const localConfig = config.getLocalConfig()
    const allSavePath = [WORKSPACE_PATH ? path.resolve(WORKSPACE_PATH, savePath) : savePath]

    // 添加本地配置文件中的savePath
    if (localConfig.localSavePath) {
      allSavePath.push(WORKSPACE_PATH ? path.resolve(WORKSPACE_PATH, localConfig.localSavePath) : localConfig.localSavePath)
    }

    swaggerJsonUrl.forEach((v) => {
      if (v.savePath) {
        allSavePath.push(WORKSPACE_PATH ? path.resolve(WORKSPACE_PATH, v.savePath) : v.savePath)
      }
    })

    return allSavePath
  }

  /** 初始化本地文件 */
  initLocalFiles() {
    this.localFilesMap.clear()
    this.groupsMap.clear()

    const localFiles: string[] = []

    this.allSavePath.forEach((savePath) => {
      if (fs.existsSync(savePath)) {
        this.processDirectory(savePath)
      } else {
        log.warn('<initLocalFiles> localPath does not exist')
      }
    })

    // 从 localFilesMap 中提取文件路径列表
    this.localFilesMap.forEach((_, filePath) => {
      localFiles.push(filePath)
    })

    // TAG setContext 写入本地文件目录
    vscode.commands.executeCommand('setContext', `${CONFIG_GROUP}.localFiles`, localFiles)
    this.refactorLocalFilesList()
  }

  /** 递归处理目录，构建基于 namespace 的分组结构 */
  private processDirectory(dirPath: string) {
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      return
    }

    try {
      const files = fs.readdirSync(dirPath)
      
      files.forEach(file => {
        const filePath = path.join(dirPath, file)
        const stat = fs.statSync(filePath)
        
        if (stat.isDirectory()) {
           // 递归处理子目录
           this.processDirectory(filePath)
         } else if (file.endsWith('.ts') || file.endsWith('.d.ts')) {
           // 处理 TypeScript 文件和定义文件
           const fileInfo = this.readLocalFile(filePath)
           if (fileInfo) {
             this.localFilesMap.set(filePath, fileInfo)
            
            // 基于 namespace 进行分组
            const groupKey = fileInfo.namespace || 'Default'
            let groupInfo = this.groupsMap.get(groupKey)
            
            if (!groupInfo) {
              groupInfo = {
                groupName: groupKey,
                groupPath: groupKey, // 使用 namespace 作为 groupPath
                files: []
              }
              this.groupsMap.set(groupKey, groupInfo)
            }
            
            groupInfo.files.push(fileInfo)
          }
        }
      })
    } catch (error) {
      log.error(`处理目录失败: ${dirPath}, ${error}`)
    }
  }

  /** 初始化状态栏按钮 */
  initStatusBarItem() {
    const { showStatusbarItem, swaggerJsonUrl } = config.extConfig
    this.statusBarItem.text = `$(cloud-download) ${localize.getLocalize('text.updateButton')}`
    this.statusBarItem.command = 'cmd.local.updateAll'
    if (showStatusbarItem && swaggerJsonUrl.length) {
      this.statusBarItem.show()
    } else {
      this.statusBarItem.hide()
    }
  }

  /** 读取本地文件 */
  readLocalFile(fileName: string, text?: string): FileHeaderInfo | undefined {
    try {
      const fileStr = text || fs.readFileSync(fileName, 'utf-8')
      
      // 提取文件头部注释中的信息
      let headerStr = ''
      
      // 匹配 /** ... */ 注释块
      const commentMatch = fileStr.match(/^\/\*\*([\s\S]*?)\*\//)
      if (commentMatch) {
        headerStr = commentMatch[1]
      }
      
      // 尝试从 declare namespace 中提取 namespace
      const namespaceMatch = fileStr.match(/declare\s+namespace\s+([^\s\n{]+)/)
      if (namespaceMatch) {
        headerStr += `\n* @namespace ${namespaceMatch[1]}\n`
      }

      const headerInfo: FileHeaderInfo = {
        fileName: path.basename(fileName, path.extname(fileName)),
        filePath: fileName,
        ext: path.extname(fileName).slice(1),
      }

      // 解析注释中的 @key value 格式
      headerStr.replace(/\*\s*@([^\s]+)[^\S\n]*([^\n]*?)\n/g, (_, key, value) => {
        headerInfo[key] = value.trim() || true
        return ''
      })

      // 确保configTitle字段存在
      if (headerInfo.configTitle) {
        headerInfo.configTitle = headerInfo.configTitle
      }

      return headerInfo
    } catch (error) {
      log.error(`Read File Error - ${fileName}`)
    }
  }

  /** 获取分组下的所有文件 */
  getGroupFiles(groupPath: string): string[] {
    const groupFiles: string[] = []
    
    // 如果传入的是文件路径，获取其所在目录
    let dirPath = groupPath
    if (fs.existsSync(groupPath) && fs.statSync(groupPath).isFile()) {
      dirPath = path.dirname(groupPath)
    }
    
    // 检查目录是否存在
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      return groupFiles
    }
    
    try {
      // 读取目录下的所有.d.ts文件
      const files = fs.readdirSync(dirPath)
      files.forEach(file => {
        if (file.endsWith('.d.ts')) {
          const filePath = path.join(dirPath, file)
          groupFiles.push(filePath)
        }
      })
    } catch (error) {
      log.error(`获取分组文件失败: ${error}`)
    }
    
    return groupFiles
  }

  /** 更新所有本地接口 */
  public updateAll() {
    const statusBarItemText = `$(cloud-download) ${localize.getLocalize('text.updateButton')}`
    this.statusBarItem.text = statusBarItemText + '...'
    this.statusBarItem.command = undefined
    const progressPanel = vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: localize.getLocalize('text.updateButton'),
        cancellable: false,
      },
      async (progress) => {
        return new Promise(async (resolve) => {
          progress.report({ increment: -1 })

          await this.viewList._refresh()

          const unit = 100 / this.localFilesMap.size
          let increment = 0
          progress.report({ increment })

          for (const [key, item] of this.localFilesMap) {
            if (item.ignore) {
              log.info(`<updateAll> ignored. (${item.filePath})`)
              continue
            }
            if (!item.namespace) {
              log.error(`<updateAll> namespace is undefined. (${item.filePath})`, false)
              continue
            }
            const swaggerItem = this.viewList.getInterFacePathNameMap(
              item.namespace,
              item.savePath
            ) as unknown as TreeInterface
            if (!swaggerItem) {
              log.error(`<updateAll> swaggerItem is undefined. (${item.filePath})`, false)
              continue
            }

            await this.viewList
              .saveInterface(swaggerItem, item.filePath)
              .then((res) => {
                if (res === 'no-change') {
                  return log.info(`${localize.getLocalize('text.noChange')} <${item.name}> `)
                }
                log.info(
                  `${localize.getLocalize('command.local.updateInterface')} <${item.name}> ${
                    item.filePath
                  } ${localize.getLocalize('success')}`
                )
              })
              .catch((err) => {
                log.error(
                  `${localize.getLocalize('command.local.updateInterface')} <${item.name}> ${localize.getLocalize(
                    'failed'
                  )} ${err}`,
                  true
                )
              })

            progress.report({ increment, message: key })
            increment += unit
          }

          resolve(void 0)
        })
      }
    )

    progressPanel.then(() => {
      this.statusBarItem.text = statusBarItemText
      this.statusBarItem.command = 'cmd.local.updateAll'
      this.initLocalFiles()
      log.info(`${localize.getLocalize('text.updateButton')} ${localize.getLocalize('success')}`)
      log.outputChannel.show()
    })
  }

  /** 刷新单个本地接口 */
  public updateSingle(filePath: string) {
    const fileInfo = this.readLocalFile(filePath)

    if (fileInfo && fileInfo.ext === 'ts') {
      this.localFilesMap.set(filePath, fileInfo)
      this.refactorLocalFilesList()
    }
  }

  getChildren(element?: LocalItem): Thenable<LocalItem[]> {
    if (!element) {
      // 返回配置项分组列表（与Swagger接口列表保持一致）
      const configItems = this.renderConfigItems()
      return Promise.resolve(configItems)
    }

    // 配置项下返回保存路径分组
    if (element.options.itemType === 'config-group' && element.options.configTitle) {
      const savePathItems = this.renderSavePathsByConfig(element.options.configTitle)
      return Promise.resolve(savePathItems)
    }

    // 保存路径下返回分组列表
    if (element.options.itemType === 'root' && element.options.savePath) {
      const groupItems = this.renderGroupsBySavePath(element.options.savePath, element.options.configTitle)
      return Promise.resolve(groupItems)
    }

    // 分组下返回接口文件列表
    if (element.options.itemType === 'group' && element.options.groupPath) {
      const groupInfo = this.groupsMap.get(element.options.groupPath)
      if (groupInfo) {
        // 获取父级根节点的保存路径和配置标题
        const parentSavePath = this.getParentSavePath(element)
        const configTitle = element.options.configTitle
        const filteredFiles = this.filterFilesByPathAndConfig(groupInfo.files, parentSavePath, configTitle)
        const interfaceItems = this.renderItems(filteredFiles)
        return Promise.resolve(interfaceItems)
      }
    }

    return Promise.resolve([])
  }

  /** 渲染配置项分组列表（与Swagger接口列表保持一致） */
  renderConfigItems(): LocalItem[] {
    const configItems: LocalItem[] = []
    const configMap = new Map<string, number>()
    
    // 统计每个配置项下的接口数量
    this.localFilesMap.forEach((file) => {
      if (file.configTitle) {
        const count = configMap.get(file.configTitle) || 0
        configMap.set(file.configTitle, count + 1)
      }
    })
    
    configMap.forEach((count, configTitle) => {
      const options: BaseTreeItemOptions & ExtLocalItemOptions = {
        title: configTitle,
        type: 'config-group',
        subTitle: `${count} 个接口`,
        collapsible: 1,
        contextValue: 'config-group',
        itemType: 'config-group',
        configTitle: configTitle,
      }
      
      configItems.push(new LocalItem(options))
    })
    
    return configItems
  }

  /** 渲染指定配置下的保存路径列表 */
  renderSavePathsByConfig(configTitle: string): LocalItem[] {
    const savePathItems: LocalItem[] = []
    const pathMap = new Map<string, number>()
    
    // 统计该配置下每个保存路径的接口数量
    this.localFilesMap.forEach((file) => {
      if (file.configTitle === configTitle) {
        const savePath = this.allSavePath.find(path => file.filePath.startsWith(path))
        if (savePath) {
          const count = pathMap.get(savePath) || 0
          pathMap.set(savePath, count + 1)
        }
      }
    })
    
    pathMap.forEach((count, savePath) => {
      const options: BaseTreeItemOptions & ExtLocalItemOptions = {
        title: path.basename(savePath),
        type: 'root',
        subTitle: `${count} 个接口`,
        collapsible: 1,
        contextValue: 'root',
        itemType: 'root',
        savePath: savePath,
        configTitle: configTitle,
      }
      
      savePathItems.push(new LocalItem(options))
    })
    
    return savePathItems
  }

  /** 渲染指定保存路径和配置下的分组列表 */
  renderGroupsBySavePath(savePath: string, configTitle?: string): LocalItem[] {
    const groups: LocalItem[] = []
    
    this.groupsMap.forEach((groupInfo, groupPath) => {
      // 检查该分组是否包含指定保存路径和配置下的文件
      const filteredFiles = this.filterFilesByPathAndConfig(groupInfo.files, savePath, configTitle)
      
      if (filteredFiles.length > 0) {
        const options: BaseTreeItemOptions & ExtLocalItemOptions = {
          title: groupInfo.groupName,
          type: 'group',
          subTitle: `${filteredFiles.length} 个接口`,
          collapsible: 1,
          contextValue: 'group',
          itemType: 'group',
          groupPath: groupPath,
          configTitle: configTitle,
        }
        
        groups.push(new LocalItem(options))
      }
    })
    
    return groups
  }

  /** 根据保存路径和配置标题过滤文件 */
  filterFilesByPathAndConfig(files: FileHeaderInfo[], savePath?: string, configTitle?: string): FileHeaderInfo[] {
    return files.filter(file => {
      const pathMatch = !savePath || file.filePath.startsWith(savePath)
      const configMatch = !configTitle || file.configTitle === configTitle
      return pathMatch && configMatch
    })
  }

  /** 渲染分组列表 */
  renderGroups(): LocalItem[] {
    const groups: LocalItem[] = []
    
    this.groupsMap.forEach((groupInfo, groupPath) => {
      const options: BaseTreeItemOptions & ExtLocalItemOptions = {
        title: groupInfo.groupName,
        type: 'group',
        subTitle: `${groupInfo.files.length} 个接口`,
        collapsible: 1, // 可展开
        contextValue: 'group',
        itemType: 'group',
        groupPath: groupPath,
      }
      
      groups.push(new LocalItem(options))
    })
    
    return groups
  }

  renderItems(itemList: FileHeaderInfo[]): LocalItem[] {
    return itemList.map((item) => this.renderItem(item))
  }

  renderItem(item: FileHeaderInfo) {
    const title = item.name || item.namespace || item.fileName

    const options: BaseTreeItemOptions & ExtLocalItemOptions = {
      title,
      type: item.ignore ? 'file-ignore' : 'file-sync',
      subTitle: `[${item.update || 'No Update Date'}] <${item.namespace}> ${item.path}`,
      collapsible: 0,
      contextValue: 'interface',
      itemType: 'interface',
      filePath: item.filePath,
      namespace: item.namespace,
      configTitle: item.configTitle,
      command: {
        title,
        command: 'cmd.common.openFile',
        arguments: [item.filePath],
      },
    }

    return new LocalItem(options)
  }

  getParent(element: LocalItem): LocalItem | undefined {
    if (element.options.itemType === 'interface' && element.options.namespace) {
      // 使用 namespace 作为分组键
      const groupKey = element.options.namespace
      const groupInfo = this.groupsMap.get(groupKey)
      
      if (groupInfo) {
        const parentOptions: BaseTreeItemOptions & ExtLocalItemOptions = {
          title: groupInfo.groupName,
          type: 'group',
          subTitle: `${groupInfo.files.length} 个接口`,
          collapsible: 1,
          contextValue: 'group',
          itemType: 'group',
          groupPath: groupKey,
          configTitle: element.options.configTitle,
        }
        
        return new LocalItem(parentOptions)
      }
    }
    
    if (element.options.itemType === 'group') {
      // 查找包含该分组的保存路径节点
      const groupInfo = this.groupsMap.get(element.options.groupPath || '')
      if (groupInfo && element.options.configTitle) {
        // 找到该配置下的文件所属的保存路径
        const configFiles = groupInfo.files.filter(file => file.configTitle === element.options.configTitle)
        const firstFile = configFiles[0]
        if (firstFile) {
          const savePath = this.allSavePath.find(path => firstFile.filePath.startsWith(path))
          if (savePath) {
            const parentOptions: BaseTreeItemOptions & ExtLocalItemOptions = {
              title: path.basename(savePath),
              type: 'root',
              subTitle: '',
              collapsible: 1,
              contextValue: 'root',
              itemType: 'root',
              savePath: savePath,
              configTitle: element.options.configTitle,
            }
            
            return new LocalItem(parentOptions)
          }
        }
      }
    }
    
    if (element.options.itemType === 'root' && element.options.configTitle) {
      // 保存路径节点的父级是配置分组
      const parentOptions: BaseTreeItemOptions & ExtLocalItemOptions = {
        title: element.options.configTitle,
        type: 'config-group',
        subTitle: '',
        collapsible: 1,
        contextValue: 'config-group',
        itemType: 'config-group',
        configTitle: element.options.configTitle,
      }
      
      return new LocalItem(parentOptions)
    }
    
    return undefined
  }

  /** 获取元素的父级保存路径 */
  getParentSavePath(element: LocalItem): string | undefined {
    const parent = this.getParent(element)
    return parent?.options.savePath
  }

  /** 重新生成本地文件列表 */
  public refactorLocalFilesList() {
    this.localFilesList = []
    this.groupsMap.clear() // 清空分组信息
    
    this.localFilesMap.forEach((val) => {
      this.localFilesList.push(val)
      
      // 重新构建分组信息，使用实际的分组路径而不是namespace
      const groupKey = this.extractGroupFromPath(val.filePath) || val.namespace || 'Default'
      let groupInfo = this.groupsMap.get(groupKey)
      
      if (!groupInfo) {
        groupInfo = {
          groupName: groupKey,
          groupPath: groupKey,
          files: []
        }
        this.groupsMap.set(groupKey, groupInfo)
      }
      
      groupInfo.files.push(val)
    })
    
    this._onDidChangeTreeData.fire(undefined)
  }

  /** 从文件路径中提取分组信息 */
  private extractGroupFromPath(filePath: string): string | null {
    // 找到匹配的保存路径
    const matchedSavePath = this.allSavePath.find(savePath => filePath.startsWith(savePath))
    if (!matchedSavePath) return null
    
    // 获取相对于保存路径的部分
    const relativePath = path.relative(matchedSavePath, filePath)
    const pathSegments = relativePath.split(path.sep)
    
    // 如果文件直接在保存路径下，返回null（无分组）
    if (pathSegments.length <= 1) return null
    
    // 返回最后一级目录作为分组名（排除文件名）
    return pathSegments[pathSegments.length - 2]
  }

  /** 刷新 */
  public refresh(): void {
    // 0.5 秒防抖, 避免重复刷新产生大量算力开销
    this.debounce(() => this._refresh(), 500)
  }

  private _refresh() {
    this.initLocalFiles()
    log.info('refresh: view.local')
  }

  /** settings.json 文件变更时触发 */
  public onConfigurationRefresh() {
    this.allSavePath = this.getAllSavePath()
    this.initStatusBarItem()
    this.refresh()
  }

  /** 销毁时释放资源 */
  destroy(): void {}
}

export class LocalItem extends BaseTreeItem<ExtLocalItemOptions> {}
