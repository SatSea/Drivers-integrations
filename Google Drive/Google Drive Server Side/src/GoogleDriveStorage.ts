import { drive_v3 } from "googleapis";
import mime from "mime";

import Path from "./Path";
import Storage, { StorageType } from "./Storage";
import DiskFileProvider from "./DiskFileProvider";

export default class GoogleDriveStorage implements Storage {
	private _folderName = "Folder_test";

	relativePath: string;

	private _drive: drive_v3.Drive;
	private _rootPath: Path;
	private _dfp: DiskFileProvider;
	parentFolderId: string;

	constructor(rootPath: Path, relativePath: string, dfp: DiskFileProvider, drive: drive_v3.Drive) {
		this._rootPath = rootPath;
		this._dfp = dfp;
		this._drive = drive;
		this.relativePath = relativePath;
	}

	static async initFolder(relativePath: string, dfp: DiskFileProvider, drive: drive_v3.Drive) {
		const rootPath = dfp.getRootPath()
		const gDS = new GoogleDriveStorage(rootPath, relativePath, dfp, drive);

		if (!dfp.exists(rootPath)) throw new Error("Folder does not exist");
		//	dfp.mkdir(rootPath)
		if (await gDS._isExisting(rootPath.toString())) throw new Error("Cloud folder already exist");
		gDS._setParentFolderId();

		return gDS;
	}

	private async _setParentFolderId(){
		const parentFolderMetadata = {
			name: this._folderName,
			mimeType: "application/vnd.google-apps.folder",
		};
		this.parentFolderId = (
			await this._drive.files.create({
				requestBody: parentFolderMetadata,
				fields: "id",
			})
		).data.id;
	}

	private async _isExisting(folderName: string) {
		return (await this.getFile(folderName, "application/vnd.google-apps.folder")).data.files.length > 0
			? true
			: false;
	}
	async getFile(name: string, mimeType?: string) {
		const parts = name.split("/");
		parts.shift();
		let parentId = this.parentFolderId;
		let file;

		for (let i = 0; i < parts.length; i++) {
			const response = await this._drive.files.list({
				q: `${mimeType ? `mimeType='${mimeType}' and ` : ""} '${parentId}' in parents and name='${parts[i]}'`,
				fields: "files(id, name)",
				spaces: "drive",
			});

			file = response;
			if (!file.data.files.length) throw new Error("File not found");
			parentId = file.data.files?.[0].id!;
		}
		return file;
	}

	private async _getFolderId(folderName: string): Promise<string | undefined> {
		return (
			await this._drive.files.list({
				q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}'`,
				fields: "files(id, name)",
			})
		).data.files[0].id;
	}
	async pull(): Promise<void> {
		await this._pullFromFolder(this._rootPath, this.parentFolderId);
	}

	private async _pullFromFolder(folderName: Path, folderId: string): Promise<void> {
		console.log("Pulling started");
		if (!folderId) throw new Error("Can't pull, remote folder not reachable");
		console.log(`Folder found, folder id ${folderId}`);
		const { data } = await this._drive.files.list({
			q: `'${folderId}' in parents`,
			fields: "files(id, name, mimeType)",
		});
		data.files.forEach(async (file) => {
			if (file.mimeType === "application/vnd.google-apps.folder") {
				const newFolder = new Path(this._rootPath + "\\" + file.name);
				this._dfp.mkdir(newFolder);
				this._pullFromFolder(newFolder, file.id);
				return;
			}
			await this._drive.files
				.get({ fileId: file.id, alt: "media" }, { responseType: "stream" })
				.then((response) => {
					const writeStream = this._dfp.createWriteStream(folderName.toString() + "\\" + file.name);
					response.data
						.on("end", () => {
							console.log(`File ${file.name} downloaded successfully.`);
						})
						.on("error", (error) => {
							console.error("Error downloading file:", error);
						})
						.pipe(writeStream);
					console.log(`Downloaded: ${file.name}`);
				});
		});
	}

	async push(): Promise<void> {
		this.uploadFilesFromFolder(this._rootPath, this.parentFolderId);
	}

	private uploadFilesFromFolder(folderName: Path, parentFolderId: string) {
		const files = this._dfp.getItems(folderName);
		files.forEach(async (file) => {
			if (file.isFolder) {
				const subfolderMetadata = {
					name: file.name,
					mimeType: "application/vnd.google-apps.folder",
					parents: [parentFolderId],
				};
				let folderId: string = (
					await this._drive.files.create({
						requestBody: subfolderMetadata,
						fields: "id",
					})
				).data.id;
				this.uploadFilesFromFolder(file.path, folderId);
				return;
			}
			const fileMetadata = {
				name: file.name,
				parents: [parentFolderId],
			};
			const media = {
				mimeType: mime.lookup(file.path.toString()) || "application/octet-stream",
				body: this._dfp.readAsStream(file.path),
			};
			console.log(media);
			await this._drive.files.create({
				requestBody: fileMetadata,
				media: media,
			});
		});
	}

	async clone(folderId: string): Promise<void> {
		await this._pullFromFolder(this._rootPath, folderId);
	}

	getType: () => StorageType;

	async getUrl(): Promise<string> {
		return `https://drive.google.com/drive/folders/${await this._getFolderId(this._folderName)}`;
	}

	async getFileLink(pathToFile: Path): Promise<string> {
		return `https://drive.google.com/file/d/${
			(await this.getFile(`${this._rootPath}/${pathToFile.toString()}`))?.data.files[0].id
		}`;
	}
}
