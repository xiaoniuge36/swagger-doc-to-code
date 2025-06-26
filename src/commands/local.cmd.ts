import vscode from "vscode";
import fs from "fs";
import path from "path";

import { log, localize, templateConfig, WORKSPACE_PATH } from "../tools";
import { TemplateGenerator } from "../templates/template-generator";

import {
  ViewLocal,
  LocalItem,
  FileHeaderInfo,
  TreeInterface,
} from "../views/local.view";
import { ViewList } from "../views/list.view";
import { TreeInterfaceParamsItem } from "../core/swagger-parser-v3";

export function registerLocalCommands(
  viewList: ViewList,
  viewLocal: ViewLocal
) {
  const commands = {
    /** 刷新本地接口列表 */
    refresh: () => viewLocal.refresh(),

    /** 更新本地接口 */
    async updateInterface(
      item: LocalItem &
        FileHeaderInfo & {
          path: string;
          options?: any;
          savePath?: string;
          title?: string;
        }
    ) {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: localize.getLocalize("text.updateButton"),
          cancellable: false,
        },
        (progress) => {
          progress.report({ increment: -1 });
          return viewList._refresh();
        }
      );

      let fileInfo = item;
      let isMenuAction = false;

      if (!item.fileName) {
        isMenuAction = true;
        if (item.options) {
          fileInfo = item.options;
        }

        // 标题栏按钮
        if (item.path || item.options?.filePath) {
          // @ts-ignore
          fileInfo = viewLocal.readLocalFile(
            item.path || item.options.filePath
          );
        }
      }

      if (!fileInfo || !fileInfo.fileName) {
        return log.error("<updateInterface> fileInfo error.", isMenuAction);
      }

      const fileName = path.basename(fileInfo.fileName, ".d.ts");

      const swaggerItem = viewList.getInterFacePathNameMap(
        fileName,
        fileInfo.savePath
      ) as unknown as TreeInterface;

      if (!swaggerItem) {
        return log.error(
          "<updateInterface> swaggerItem is undefined.",
          isMenuAction
        );
      }

      viewList
        .saveInterface(swaggerItem, item.path)
        .then((res) => {
          if (res === "no-change") {
            return log.info(
              `${localize.getLocalize("text.noChange")} <${
                fileInfo.name || fileInfo.title
              }>`,
              isMenuAction
            );
          }

          viewLocal.updateSingle(item.path);

          log.info(
            `${localize.getLocalize("command.local.updateInterface")} <${
              fileInfo.name || fileInfo.title
            }> ${localize.getLocalize("success")}`,
            isMenuAction
          );
        })
        .catch((err) => {
          log.error(
            `${localize.getLocalize("command.local.updateInterface")} <${
              fileInfo.name || fileInfo.title
            }> ${localize.getLocalize("failed")} ${err}`,
            isMenuAction
          );
        });
    },

    /** 更新所有本地接口 */
    updateAll() {
      if (viewLocal.localFilesMap.size <= 0)
        return log.info(
          `${localize.getLocalize("text.updateButton")}: ${localize.getLocalize(
            "viewsWelcome.emptyLocal"
          )}`,
          true
        );

      const confirmText = localize.getLocalize("text.confirm");
      const cancelText = localize.getLocalize("text.cancel");

      vscode.window
        .showWarningMessage(
          `${localize.getLocalize("text.updateButton")}: ${localize.getLocalize(
            "text.confirmUpdateAll"
          )}`,
          confirmText,
          cancelText
        )
        .then((res) => {
          if (res === confirmText) {
            viewLocal.updateAll();
          }
        });
    },

    /** 复制请求代码 */
    copyRequest(e: any) {
      const filePath = e.path || e.options.filePath;
      const fileInfo = viewLocal.readLocalFile(filePath);

      if (!fileInfo) {
        return log.error("<copyRequest> fileInfo error.", true);
      }

      if (templateConfig.copyRequest) {
        const str = templateConfig.copyRequest(fileInfo);
        if (typeof str === "string") {
          vscode.env.clipboard.writeText(str);
        } else {
          vscode.env.clipboard.writeText(str.join("\n"));
        }
        log.info(
          `${localize.getLocalize(
            "command.local.copyRequest"
          )}${localize.getLocalize("success")} <${fileInfo.name}>`,
          true
        );
      } else {
        log.error("<copyRequest> copyRequest is undefined.", true);
      }
    },

    /** 批量复制分组请求代码 */
    copyGroupRequests(e: any) {
      // 获取分组信息
      let groupPath: string;
      let groupInfo: any;
      
      if (e.options && e.options.itemType === 'group') {
        // 从分组节点获取路径
        groupPath = e.options.groupPath;
        groupInfo = viewLocal.groupsMap.get(groupPath);
      } else {
        // 兼容旧的调用方式
        groupPath = e.path || e.options?.filePath;
        if (groupPath) {
          // 如果是文件路径，获取其目录
          if (fs.existsSync(groupPath) && fs.statSync(groupPath).isFile()) {
            groupPath = path.dirname(groupPath);
          }
          groupInfo = viewLocal.groupsMap.get(groupPath);
        }
      }

      if (!groupInfo || !groupInfo.files || groupInfo.files.length === 0) {
        return log.error("<copyGroupRequests> 分组下没有找到接口文件", true);
      }

      if (!templateConfig.copyRequest) {
        return log.error(
          "<copyGroupRequests> copyRequest模板未配置，请先添加模板配置文件",
          true
        );
      }

      const requestCodes: string[] = [];
      let successCount = 0;

      groupInfo.files.forEach((fileInfo: any) => {
        try {
          const str = templateConfig.copyRequest?.(fileInfo);
          if (str) {
            if (typeof str === "string") {
              requestCodes.push(str);
            } else {
              requestCodes.push(str.join("\n"));
            }
          }
          successCount++;
        } catch (error) {
          log.error(
            `<copyGroupRequests> 处理文件失败: ${fileInfo.name} - ${error}`
          );
        }
      });

      if (requestCodes.length > 0) {
        const allRequestsCode = requestCodes.join("\n\n");
        vscode.env.clipboard.writeText(allRequestsCode);
        log.info(
          `批量复制请求代码成功！已复制 ${successCount} 个接口的请求代码到剪贴板`,
          true
        );
      } else {
        log.error("<copyGroupRequests> 没有成功生成任何请求代码", true);
      }
    },

    /** 一键添加模板配置文件 */
    createTemplate() {
      const vscodeConfigFolderPath = path.join(WORKSPACE_PATH || "", ".vscode");
      const workspaceConfigPath = path.join(
        vscodeConfigFolderPath,
        "swagger-doc-to-code.template.js"
      );

      // 检查文件是否已存在
      if (fs.existsSync(workspaceConfigPath)) {
        vscode.window
          .showWarningMessage(
            "模板配置文件已存在，是否要覆盖？",
            "覆盖",
            "取消"
          )
          .then((selection) => {
            if (selection === "覆盖") {
              commands.doCreateTemplate(
                vscodeConfigFolderPath,
                workspaceConfigPath
              );
            }
          });
      } else {
        commands.doCreateTemplate(vscodeConfigFolderPath, workspaceConfigPath);
      }
    },

    /** 执行创建模板文件 */
    doCreateTemplate(
      vscodeConfigFolderPath: string,
      workspaceConfigPath: string
    ) {
      // 确保.vscode目录存在
      if (!fs.existsSync(vscodeConfigFolderPath)) {
        try {
          fs.mkdirSync(vscodeConfigFolderPath, { recursive: true });
        } catch (error) {
          log.error(`创建.vscode目录失败: ${error}`, true);
          return;
        }
      }

      // 复制默认模板文件
      try {
        const defaultTemplatePath = path.join(
          __dirname,
          "../../templates/new.template.js"
        );
        if (fs.existsSync(defaultTemplatePath)) {
          const templateContent = fs.readFileSync(defaultTemplatePath, "utf-8");
          fs.writeFileSync(workspaceConfigPath, templateContent);
        } else {
          // 如果默认模板不存在，使用模板生成器创建基础模板
          const basicTemplate = TemplateGenerator.generateBasicTemplate();

          fs.writeFileSync(workspaceConfigPath, basicTemplate);
        }

        vscode.window
          .showInformationMessage(
            "🎉 模板配置文件创建成功！",
            "打开文件",
            "查看文档"
          )
          .then((selection) => {
            if (selection === "打开文件") {
              vscode.workspace
                .openTextDocument(workspaceConfigPath)
                .then((doc) => {
                  vscode.window.showTextDocument(doc);
                });
            } else if (selection === "查看文档") {
              vscode.env.openExternal(
                vscode.Uri.parse(
                  "https://github.com/xiaoniuge36/swagger-doc-to-code#自定义模板"
                )
              );
            }
          });

        log.info(
          "模板配置文件创建成功: .vscode/swagger-doc-to-code.template.js",
          true
        );
      } catch (error) {
        log.error(`创建模板配置文件失败: ${error}`, true);
      }
    },
  };

  for (const command in commands) {
    vscode.commands.registerCommand(`cmd.local.${command}`, commands[command]);
  }
}
