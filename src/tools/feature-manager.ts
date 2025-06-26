import * as vscode from 'vscode'
import * as path from 'path'
import { log } from './log'

/**
 * 功能管理器 - 负责扩展插件的高级功能
 */
export class FeatureManager {
  private context: vscode.ExtensionContext
  private disposables: vscode.Disposable[] = []

  constructor(context: vscode.ExtensionContext) {
    this.context = context
  }

  /**
   * 初始化所有功能
   */
  public initialize(): void {
    this.registerCodeSnippets()
    this.registerCompletionProvider()
    this.registerHoverProvider()
    this.registerCodeLensProvider()
    this.registerStatusBarItems()
    this.registerFileWatcher()
    log.info('FeatureManager initialized with enhanced features')
  }

  /**
   * 注册代码片段
   */
  private registerCodeSnippets(): void {
    // 注册 API 请求函数代码片段
    const snippetProvider = vscode.languages.registerCompletionItemProvider(
      ['typescript', 'javascript'],
      {
        provideCompletionItems(document, position) {
          const snippets: vscode.CompletionItem[] = []

          // API GET 请求片段
          const getSnippet = new vscode.CompletionItem('api-get', vscode.CompletionItemKind.Snippet)
          getSnippet.insertText = new vscode.SnippetString([
            '/**',
            ' * ${1:API Description}',
            ' */',
            'export async function ${2:functionName}(',
            '  params?: ${3:ParamsType},',
            '  options?: RequestOptions',
            ') {',
            '  return request<${4:ResponseType}>({',
            '    url: "${5:/api/path}",',
            '    method: "GET",',
            '    params,',
            '    ...options',
            '  })',
            '}'
          ].join('\n'))
          getSnippet.documentation = new vscode.MarkdownString('生成 GET 请求函数')
          snippets.push(getSnippet)

          // API POST 请求片段
          const postSnippet = new vscode.CompletionItem('api-post', vscode.CompletionItemKind.Snippet)
          postSnippet.insertText = new vscode.SnippetString([
            '/**',
            ' * ${1:API Description}',
            ' */',
            'export async function ${2:functionName}(',
            '  data: ${3:DataType},',
            '  options?: RequestOptions',
            ') {',
            '  return request<${4:ResponseType}>({',
            '    url: "${5:/api/path}",',
            '    method: "POST",',
            '    data,',
            '    ...options',
            '  })',
            '}'
          ].join('\n'))
          postSnippet.documentation = new vscode.MarkdownString('生成 POST 请求函数')
          snippets.push(postSnippet)

          // 接口类型定义片段
          const interfaceSnippet = new vscode.CompletionItem('api-interface', vscode.CompletionItemKind.Snippet)
          interfaceSnippet.insertText = new vscode.SnippetString([
            '/**',
            ' * ${1:Interface Description}',
            ' */',
            'export namespace ${2:ApiName} {',
            '  export interface Params {',
            '    ${3:// 请求参数}',
            '  }',
            '',
            '  export interface Response {',
            '    ${4:// 响应数据}',
            '  }',
            '}'
          ].join('\n'))
          interfaceSnippet.documentation = new vscode.MarkdownString('生成 API 接口类型定义')
          snippets.push(interfaceSnippet)

          return snippets
        }
      },
      'api-' // 触发字符
    )

    this.disposables.push(snippetProvider)
  }

  /**
   * 注册智能提示提供者
   */
  private registerCompletionProvider(): void {
    const completionProvider = vscode.languages.registerCompletionItemProvider(
      ['typescript'],
      {
        provideCompletionItems(document, position) {
          const line = document.lineAt(position)
          const lineText = line.text

          // 检查是否在导入语句中
          if (lineText.includes('from') && lineText.includes('types/')) {
            // 这里可以扫描 types 目录，提供智能的类型导入建议
            const completions: vscode.CompletionItem[] = []
            
            // 示例：添加常用的 API 类型
            const commonTypes = ['UserLogin', 'UserProfile', 'ApiResponse', 'PaginationParams']
            
            commonTypes.forEach(type => {
              const item = new vscode.CompletionItem(type, vscode.CompletionItemKind.Interface)
              item.detail = `API 类型: ${type}`
              item.documentation = new vscode.MarkdownString(`导入 ${type} 接口类型`)
              completions.push(item)
            })

            return completions
          }

          return []
        }
      },
      '.', '/' // 触发字符
    )

    this.disposables.push(completionProvider)
  }

  /**
   * 注册悬停提示提供者
   */
  private registerHoverProvider(): void {
    const hoverProvider = vscode.languages.registerHoverProvider(
      ['typescript'],
      {
        provideHover(document, position) {
          const range = document.getWordRangeAtPosition(position)
          if (!range) return

          const word = document.getText(range)
          
          // 检查是否是 API 相关的词汇
          if (word.includes('Api') || word.includes('Request') || word.includes('Response')) {
            const markdown = new vscode.MarkdownString()
            markdown.appendMarkdown(`**API 类型**: \`${word}\`\n\n`)
            markdown.appendMarkdown('这是一个由 Swagger Doc To Code 生成的 API 类型定义。\n\n')
            markdown.appendMarkdown('[📖 查看文档](https://github.com/xiaoniuge36/swagger-doc-to-code)')
            
            return new vscode.Hover(markdown, range)
          }
        }
      }
    )

    this.disposables.push(hoverProvider)
  }

  /**
   * 注册代码镜头提供者
   */
  private registerCodeLensProvider(): void {
    const codeLensProvider = vscode.languages.registerCodeLensProvider(
      ['typescript'],
      {
        provideCodeLenses(document) {
          const codeLenses: vscode.CodeLens[] = []
          const text = document.getText()
          
          // 查找 export namespace 声明
          const namespaceRegex = /export\s+namespace\s+(\w+)/g
          let match
          
          while ((match = namespaceRegex.exec(text)) !== null) {
            const line = document.positionAt(match.index).line
            const range = new vscode.Range(line, 0, line, match[0].length)
            
            // 添加"生成请求函数"代码镜头
            const generateLens = new vscode.CodeLens(range, {
              title: '🚀 生成请求函数',
              command: 'cmd.local.copyRequest',
              arguments: [document.uri]
            })
            
            // 添加"测试 API"代码镜头
            const testLens = new vscode.CodeLens(range, {
              title: '🧪 测试 API',
              command: 'swagger-doc-to-code.testApi',
              arguments: [match[1]]
            })
            
            codeLenses.push(generateLens, testLens)
          }
          
          return codeLenses
        }
      }
    )

    this.disposables.push(codeLensProvider)
  }

  /**
   * 注册状态栏项目
   */
  private registerStatusBarItems(): void {
    // API 统计状态栏
    const apiStatsItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    )
    apiStatsItem.text = '$(globe) API: 0'
    apiStatsItem.tooltip = '点击查看 API 统计信息'
    apiStatsItem.command = 'swagger-doc-to-code.showApiStats'
    apiStatsItem.show()

    // 快速操作状态栏
    const quickActionItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      99
    )
    quickActionItem.text = '$(zap) 快速生成'
    quickActionItem.tooltip = '快速生成 API 代码'
    quickActionItem.command = 'cmd.list.search'
    quickActionItem.show()

    this.disposables.push(apiStatsItem, quickActionItem)
  }

  /**
   * 注册文件监听器
   */
  private registerFileWatcher(): void {
    // 监听 TypeScript 文件变化
    const watcher = vscode.workspace.createFileSystemWatcher('**/*.{ts,js}')
    
    watcher.onDidCreate(uri => {
      if (uri.path.includes('types/') || uri.path.includes('api/')) {
        log.info(`API 文件已创建: ${uri.fsPath}`)
        this.updateApiStats()
      }
    })
    
    watcher.onDidDelete(uri => {
      if (uri.path.includes('types/') || uri.path.includes('api/')) {
        log.info(`API 文件已删除: ${uri.fsPath}`)
        this.updateApiStats()
      }
    })

    this.disposables.push(watcher)
  }

  /**
   * 更新 API 统计信息
   */
  private async updateApiStats(): Promise<void> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders
      if (!workspaceFolders) return

      const apiFiles = await vscode.workspace.findFiles('**/types/**/*.ts')
      const count = apiFiles.length
      
      // 更新状态栏显示
      const statusBarItems = this.disposables.filter(d => 
      d && typeof (d as any).text !== 'undefined'
    ) as vscode.StatusBarItem[]
      
      const apiStatsItem = statusBarItems.find(item => 
        item.text?.includes('API:')
      )
      
      if (apiStatsItem) {
        apiStatsItem.text = `$(globe) API: ${count}`
      }
    } catch (error) {
      log.error('Failed to update API stats:', error)
    }
  }

  /**
   * 注册额外的命令
   */
  public registerCommands(): void {
    // API 统计命令
    const showApiStatsCommand = vscode.commands.registerCommand(
      'swagger-doc-to-code.showApiStats',
      async () => {
        const apiFiles = await vscode.workspace.findFiles('**/types/**/*.ts')
        const message = `当前工作区共有 ${apiFiles.length} 个 API 类型文件`
        
        vscode.window.showInformationMessage(message, '📁 打开类型目录').then(action => {
          if (action === '📁 打开类型目录') {
            vscode.commands.executeCommand('revealInExplorer', apiFiles[0])
          }
        })
      }
    )

    // API 测试命令
    const testApiCommand = vscode.commands.registerCommand(
      'swagger-doc-to-code.testApi',
      async (apiName: string) => {
        const message = `准备测试 API: ${apiName}`
        const action = await vscode.window.showInformationMessage(
          message,
          '🧪 生成测试代码',
          '📋 复制 cURL 命令'
        )
        
        if (action === '🧪 生成测试代码') {
          await this.generateTestCode(apiName)
        } else if (action === '📋 复制 cURL 命令') {
          await this.generateCurlCommand(apiName)
        }
      }
    )

    this.disposables.push(showApiStatsCommand, testApiCommand)
  }

  /**
   * 生成测试代码
   */
  private async generateTestCode(apiName: string): Promise<void> {
    const testCode = [
      `// ${apiName} API 测试代码`,
      `import { ${apiName} } from './types/api-interfaces/${apiName.toLowerCase()}'`,
      '',
      `describe('${apiName} API', () => {`,
      `  it('should call ${apiName} successfully', async () => {`,
      `    const params: ${apiName}.Params = {`,
      `      // TODO: 填写测试参数`,
      `    }`,
      '',
      `    const response = await ${apiName.toLowerCase()}(params)`,
      `    expect(response).toBeDefined()`,
      `  })`,
      `})`
    ].join('\n')

    const document = await vscode.workspace.openTextDocument({
      content: testCode,
      language: 'typescript'
    })
    
    await vscode.window.showTextDocument(document)
  }

  /**
   * 生成 cURL 命令
   */
  private async generateCurlCommand(apiName: string): Promise<void> {
    const curlCommand = [
      `# ${apiName} API cURL 命令`,
      `curl -X POST \\`,
      `  'https://api.example.com/endpoint' \\`,
      `  -H 'Content-Type: application/json' \\`,
      `  -H 'Authorization: Bearer YOUR_TOKEN' \\`,
      `  -d '{`,
      `    "param1": "value1",`,
      `    "param2": "value2"`,
      `  }'`
    ].join('\n')

    await vscode.env.clipboard.writeText(curlCommand)
    vscode.window.showInformationMessage('cURL 命令已复制到剪贴板')
  }

  /**
   * 销毁所有资源
   */
  public dispose(): void {
    this.disposables.forEach(d => d.dispose())
    this.disposables = []
  }
}