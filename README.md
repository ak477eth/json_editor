# Obsidian JSON Viewer & Editor 插件

这是一个为 Obsidian 设计的 JSON 查看与编辑插件。它允许你在项目（Vault）中轻松浏览、搜索、校验、格式化和编辑所有的 `.json` 文件。

## 功能特性

- **项目内 JSON 文件浏览与搜索**：自动扫描并列出项目内所有的 JSON 文件，支持按文件名或路径进行实时搜索。
- **双栏式优雅布局**：左侧是文件导航和搜索框，右侧是功能强大的 JSON 编辑面板。
- **实时 JSON 校验**：在输入时进行智能解析和错误提示，提供醒目的状态横条指示 JSON 格式是否有效。
- **一键格式化工具**：支持一键美化（Prettify）与压缩（Minify）JSON 内容。
- **安全保存机制**：防止保存语法有误的 JSON 数据，避免数据损坏，同时支持清空内容保存。
- **深色与浅色主题适配**：完美结合 Obsidian 的原生 CSS 变量设计，在深色和浅色主题下都有优秀的视觉体验。

---

## 安装方法

由于本插件目前为手动打包阶段，您可以通过以下几种方式进行安装。

### 方法一：手动安装（推荐）

1. **构建插件文件**：
   - 确保你已经在本插件的源码根目录下安装了依赖并完成构建：
     ```bash
     npm install
     npm run build
     ```
   - 构建完成后，目录下会生成 `main.js` 文件。

2. **创建插件目录**：
   - 打开你的 Obsidian 保险库（Vault）所在的本地文件夹。
   - 导航到隐藏目录 `.obsidian/plugins/`（如果看不到 `.obsidian`，请在系统文件管理器中开启“显示隐藏文件”）。
   - 在 `plugins` 下新建一个文件夹，命名为 `obsidian-json-editor`。

3. **复制插件文件**：
   - 将你项目根目录下的以下三个文件复制到刚刚创建的 `obsidian-json-editor` 文件夹中：
     - `main.js`
     - `manifest.json`
     - `styles.css`

4. **启用插件**：
   - 打开 Obsidian，点击左下角的 **设置（Settings）** ⚙️。
   - 导航到 **第三方插件（Community plugins）**。
   - 如果尚未启用，先开启“社区插件”。
   - 在“已安装插件”列表中，找到 **JSON Viewer and Editor** 插件并将其开启。

---

## 使用指南

### 1. 启动插件视图
有三种方式可以唤起 JSON 编辑和查看界面：
- **功能侧栏图标**：点击 Obsidian 左侧功能栏上的 **“Open JSON Viewer/Editor”** 丝带图标（通常是文档图标 📄）。
- **命令行工具**：按下 `Ctrl + P` (Windows/Linux) 或 `Cmd + P` (Mac) 打开命令面板，搜索并执行 `Open JSON Viewer and Editor`。
- **在设置中打开**（若注册了快捷键）。

### 2. 浏览与检索
- 打开插件后，左侧的侧边栏会自动列出当前 Vault 下所有的 `.json` 文件。
- 如果文件较多，在左上方输入框中输入部分文件名或路径，即可实时筛选。
- 鼠标点击列表中的 JSON 文件，右侧编辑区便会加载对应内容。

### 3. 编辑与格式化
- 右侧编辑区可以直接编辑文本。
- 如果输入的 JSON 语法有误，右上角的状态栏会变为红色，并显示详细报错信息（如：`Invalid JSON: Unexpected position...`），同时会禁用“Save”按钮防止坏数据写入。
- 输入正确 JSON 时，右上角状态栏显示绿色的 `Valid JSON`。
- 点击 **Prettify (Format)**：可一键将 JSON 整理为标准的两空格缩进格式，清晰易读。
- 点击 **Minify**：可一键去除所有空白和换行，压缩数据体积。

### 4. 保存更改
- 确认编辑完成且右上角状态为 `Valid JSON` 时，点击 **Save Changes** 按钮即可保存。
- 软件右上角会弹出 Obsidian 通知：`Successfully saved: <文件名>`。

---

## 开发与调试

如果您需要对该插件进行二次开发，可以使用以下命令：

- **安装依赖**：
  ```bash
  npm install
  ```
- **实时开发监控（热重载构建）**：
  ```bash
  npm run dev
  ```
- **生产构建**：
  ```bash
  npm run build
  ```
- **代码规范检查**：
  ```bash
  npm run lint
  ```

---

## 许可证

[MIT License](LICENSE)
