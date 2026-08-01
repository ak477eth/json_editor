import {
	ItemView,
	WorkspaceLeaf,
	Plugin,
	TFile,
	Notice,
	TAbstractFile
} from 'obsidian';

export const VIEW_TYPE_JSON_EDITOR = 'json-editor-view';

export class JSONEditorView extends ItemView {
	private searchInput: HTMLInputElement | null = null;
	private fileListEl: HTMLDivElement | null = null;
	private editorContainerEl: HTMLDivElement | null = null;

	private selectedFile: TFile | null = null;
	private searchQuery: string = '';

	// Editor references
	private filePathEl: HTMLSpanElement | null = null;
	private jsonTextarea: HTMLTextAreaElement | null = null;
	private statusTextEl: HTMLSpanElement | null = null;
	private saveBtn: HTMLButtonElement | null = null;
	private prettyBtn: HTMLButtonElement | null = null;
	private minifyBtn: HTMLButtonElement | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_JSON_EDITOR;
	}

	getDisplayText(): string {
		return 'JSON Viewer & Editor';
	}

	getIcon(): string {
		return 'document';
	}

	async onOpen(): Promise<void> {
		const container = this.contentEl;
		container.empty();
		container.addClass('json-editor-view-container');

		// Create header
		const header = container.createEl('div', { cls: 'json-editor-header' });
		header.createEl('h3', { text: 'JSON Viewer & Editor' });

		// Create main layout container (split view)
		const mainLayout = container.createEl('div', { cls: 'json-editor-main-layout' });

		// Left sidebar: File Browser
		const sidebar = mainLayout.createEl('div', { cls: 'json-editor-sidebar' });
		sidebar.createEl('h4', { text: 'JSON Files', cls: 'json-sidebar-title' });

		// Search Box
		const searchContainer = sidebar.createEl('div', { cls: 'json-search-container' });
		this.searchInput = searchContainer.createEl('input', {
			type: 'text',
			placeholder: 'Search JSON files...',
			cls: 'json-search-input'
		}) as HTMLInputElement;

		this.searchInput.addEventListener('input', (e) => {
			this.searchQuery = (e.target as HTMLInputElement).value.toLowerCase();
			this.renderFileList();
		});

		// File List Container
		this.fileListEl = sidebar.createEl('div', { cls: 'json-file-list' });

		// Right Pane: Editor Panel
		this.editorContainerEl = mainLayout.createEl('div', { cls: 'json-editor-pane' });
		this.renderEditorPane();

		// Initial File List Render
		this.renderFileList();

		// Listen for vault changes to refresh file list
		this.registerEvent(
			this.app.vault.on('create', () => this.renderFileList())
		);
		this.registerEvent(
			this.app.vault.on('delete', (file) => {
				if (this.selectedFile && this.selectedFile.path === file.path) {
					this.selectedFile = null;
					this.updateEditorContent();
				}
				this.renderFileList();
			})
		);
		this.registerEvent(
			this.app.vault.on('rename', (file, oldPath) => {
				if (this.selectedFile && this.selectedFile.path === oldPath) {
					if (file instanceof TFile) {
						this.selectedFile = file;
					} else {
						this.selectedFile = null;
					}
					this.updateEditorContent();
				}
				this.renderFileList();
			})
		);
	}

	async onClose(): Promise<void> {
		// Nothing to clean up.
	}

	/**
	 * Scans the vault for all files ending in .json
	 */
	getJSONFiles(): TFile[] {
		const files = this.app.vault.getFiles();
		return files.filter(file => file.extension === 'json');
	}

	/**
	 * Renders the files listing in the sidebar, applying search filters.
	 */
	renderFileList(): void {
		if (!this.fileListEl) return;
		this.fileListEl.empty();

		const files = this.getJSONFiles();
		const filteredFiles = files.filter(file => {
			const fileName = file.name.toLowerCase();
			const filePath = file.path.toLowerCase();
			return fileName.includes(this.searchQuery) || filePath.includes(this.searchQuery);
		});

		if (filteredFiles.length === 0) {
			this.fileListEl.createEl('div', {
				text: 'No JSON files found',
				cls: 'json-file-empty-state'
			});
			return;
		}

		filteredFiles.forEach(file => {
			const fileItem = this.fileListEl!.createEl('div', {
				cls: 'json-file-item'
			});

			if (this.selectedFile && this.selectedFile.path === file.path) {
				fileItem.addClass('is-active');
			}

			// File Name
			fileItem.createEl('span', {
				text: file.name,
				cls: 'json-file-name'
			});

			// File Subpath (useful for deeply nested files)
			const parentPath = file.parent ? file.parent.path : '';
			if (parentPath && parentPath !== '/') {
				fileItem.createEl('span', {
					text: `in ${parentPath}`,
					cls: 'json-file-subpath'
				});
			}

			// Click handler
			fileItem.addEventListener('click', async () => {
				// De-select old item, select new item
				const activeItems = this.fileListEl!.querySelectorAll('.json-file-item.is-active');
				activeItems.forEach(el => el.removeClass('is-active'));
				fileItem.addClass('is-active');

				this.selectedFile = file;
				await this.loadSelectedFile();
			});
		});
	}

	/**
	 * Renders the Right Pane (JSON editor and utility actions)
	 */
	renderEditorPane(): void {
		if (!this.editorContainerEl) return;
		this.editorContainerEl.empty();

		// Header area of editor
		const editorHeader = this.editorContainerEl.createEl('div', { cls: 'json-editor-pane-header' });

		const pathContainer = editorHeader.createEl('div', { cls: 'json-editor-filepath-container' });
		pathContainer.createEl('strong', { text: 'File: ' });
		this.filePathEl = pathContainer.createEl('span', {
			text: 'No file selected',
			cls: 'json-editor-filepath'
		});

		// Status text for validation errors
		this.statusTextEl = editorHeader.createEl('span', {
			text: 'No file selected',
			cls: 'json-editor-status info'
		});

		// Action Buttons Container
		const actionsContainer = this.editorContainerEl.createEl('div', { cls: 'json-editor-actions' });

		this.prettyBtn = actionsContainer.createEl('button', {
			text: 'Prettify (Format)',
			cls: 'mod-cta json-btn'
		}) as HTMLButtonElement;
		this.prettyBtn.disabled = true;

		this.minifyBtn = actionsContainer.createEl('button', {
			text: 'Minify',
			cls: 'json-btn'
		}) as HTMLButtonElement;
		this.minifyBtn.disabled = true;

		this.saveBtn = actionsContainer.createEl('button', {
			text: 'Save Changes',
			cls: 'mod-warning json-btn'
		}) as HTMLButtonElement;
		this.saveBtn.disabled = true;

		// Textarea Container
		const textareaWrapper = this.editorContainerEl.createEl('div', { cls: 'json-textarea-wrapper' });
		this.jsonTextarea = textareaWrapper.createEl('textarea', {
			cls: 'json-textarea',
			placeholder: 'Select a JSON file from the left panel to begin viewing or editing...'
		}) as HTMLTextAreaElement;
		this.jsonTextarea.disabled = true;

		// Attach Event Listeners
		this.jsonTextarea.addEventListener('input', () => {
			this.validateJSON();
		});

		this.prettyBtn.addEventListener('click', () => {
			this.formatJSON(true);
		});

		this.minifyBtn.addEventListener('click', () => {
			this.formatJSON(false);
		});

		this.saveBtn.addEventListener('click', async () => {
			await this.saveSelectedFile();
		});
	}

	/**
	 * Loads the selected JSON file's content into the editor textarea
	 */
	async loadSelectedFile(): Promise<void> {
		if (!this.selectedFile) {
			this.updateEditorContent();
			return;
		}

		try {
			const content = await this.app.vault.read(this.selectedFile);
			this.updateEditorContent(content);
			new Notice(`Loaded: ${this.selectedFile.name}`);
		} catch (error) {
			console.error('Failed to read file:', error);
			new Notice(`Error reading file: ${this.selectedFile.name}`);
			this.updateEditorContent('');
		}
	}

	/**
	 * Updates the state and contents of the editor elements
	 */
	updateEditorContent(content: string = ''): void {
		if (!this.filePathEl || !this.jsonTextarea || !this.statusTextEl || !this.prettyBtn || !this.minifyBtn || !this.saveBtn) return;

		if (!this.selectedFile) {
			this.filePathEl.textContent = 'No file selected';
			this.jsonTextarea.value = '';
			this.jsonTextarea.disabled = true;
			this.statusTextEl.textContent = 'Select a JSON file';
			this.statusTextEl.className = 'json-editor-status info';
			this.prettyBtn.disabled = true;
			this.minifyBtn.disabled = true;
			this.saveBtn.disabled = true;
			return;
		}

		this.filePathEl.textContent = this.selectedFile.path;
		this.jsonTextarea.value = content;
		this.jsonTextarea.disabled = false;

		// Run initial validation
		this.validateJSON();
	}

	/**
	 * Validates the current textarea string. Updates save button availability and error state banner.
	 */
	validateJSON(): boolean {
		if (!this.jsonTextarea || !this.statusTextEl || !this.saveBtn || !this.prettyBtn || !this.minifyBtn) return false;

		const value = this.jsonTextarea.value.trim();

		if (!value) {
			this.statusTextEl.textContent = 'Empty file (valid JSON as null/object/array is required for structural features)';
			this.statusTextEl.className = 'json-editor-status error';
			this.saveBtn.disabled = false; // Allow saving empty files
			this.prettyBtn.disabled = true;
			this.minifyBtn.disabled = true;
			return false;
		}

		try {
			JSON.parse(value);
			this.statusTextEl.textContent = 'Valid JSON';
			this.statusTextEl.className = 'json-editor-status success';
			this.saveBtn.disabled = false;
			this.prettyBtn.disabled = false;
			this.minifyBtn.disabled = false;
			return true;
		} catch (err: any) {
			this.statusTextEl.textContent = `Invalid JSON: ${err.message}`;
			this.statusTextEl.className = 'json-editor-status error';
			this.saveBtn.disabled = true; // Block saving invalid JSON to prevent corrupting data
			this.prettyBtn.disabled = true;
			this.minifyBtn.disabled = true;
			return false;
		}
	}

	/**
	 * Formats JSON inside the textarea as pretty-printed or minified.
	 */
	formatJSON(pretty: boolean): void {
		if (!this.jsonTextarea) return;

		const value = this.jsonTextarea.value.trim();
		if (!value) return;

		try {
			const parsed = JSON.parse(value);
			if (pretty) {
				this.jsonTextarea.value = JSON.stringify(parsed, null, 2);
			} else {
				this.jsonTextarea.value = JSON.stringify(parsed);
			}
			this.validateJSON();
		} catch (err) {
			// Parsing shouldn't fail since buttons are disabled if invalid, but catch just in case.
			new Notice('Cannot format invalid JSON');
		}
	}

	/**
	 * Saves the current contents of the textarea to the current TFile.
	 */
	async saveSelectedFile(): Promise<void> {
		if (!this.selectedFile || !this.jsonTextarea) return;

		// Re-validate just in case
		if (!this.validateJSON() && this.jsonTextarea.value.trim() !== '') {
			new Notice('Cannot save: Invalid JSON structure.');
			return;
		}

		try {
			const content = this.jsonTextarea.value;
			await this.app.vault.modify(this.selectedFile, content);
			new Notice(`Successfully saved: ${this.selectedFile.name}`);
		} catch (error) {
			console.error('Failed to save file:', error);
			new Notice(`Error saving file: ${this.selectedFile.name}`);
		}
	}
}

export default class JSONPlugin extends Plugin {
	async onload(): Promise<void> {
		// Register Custom view
		this.registerView(
			VIEW_TYPE_JSON_EDITOR,
			(leaf) => new JSONEditorView(leaf)
		);

		// Add Ribbon Icon to open view
		this.addRibbonIcon('document', 'Open JSON Viewer/Editor', () => {
			this.activateView();
		});

		// Add Command to Command Palette
		this.addCommand({
			id: 'open-json-editor',
			name: 'Open JSON Viewer and Editor',
			callback: () => {
				this.activateView();
			}
		});
	}

	async onunload(): Promise<void> {
		// Cleanup happens automatically via Obsidian framework's registered views
	}

	/**
	 * Activates the view, creating a leaf in the main area if not already open
	 */
	async activateView(): Promise<void> {
		const { workspace } = this.app;

		let leaf = workspace.getLeavesOfType(VIEW_TYPE_JSON_EDITOR)[0];

		if (!leaf) {
			// Get right/main leaf
			leaf = workspace.getLeaf('tab');
			await leaf.setViewState({
				type: VIEW_TYPE_JSON_EDITOR,
				active: true
			});
		}

		workspace.revealLeaf(leaf);
	}
}
