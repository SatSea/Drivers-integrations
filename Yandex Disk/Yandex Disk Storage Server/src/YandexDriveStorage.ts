import { YaDisk } from "ya-disk-rest-api";

import axios from "axios";
import DiskFileProvider from "./DiskFileProvider";
import Path from "./Path";

// const relativePath = "folderTest";
// const _dfp = new DiskFileProvider(rootPath);

export default class YandexDriveStorage {

	relativePath: string;

	private _rootPath: Path;
	private _dfp: DiskFileProvider;
	private _disk: YaDisk;

	constructor(rootPath: Path, relativePath: string, dfp: DiskFileProvider, accessToken: string) {
		this._rootPath = rootPath;
		this._dfp = dfp;
		this.relativePath = relativePath;
		this._disk = new YaDisk(accessToken);
	}

	static async initFolder(relativePath: string, dfp: DiskFileProvider, accessToken: string) {
		const rootPath = dfp.getRootPath();
		const yDS = new YandexDriveStorage(rootPath, relativePath, dfp, accessToken);
		if (!dfp.exists(new Path(relativePath))) throw new Error("Folder does not exist");

		// if (await yDS._isExisting(relativePath)) throw new Error("Cloud folder already exist");

		return yDS;
	}
	private async _isExisting(pathToRootFolder: string): Promise<boolean> {
		return this._disk.isDirExist(pathToRootFolder);
	}

	async downloadItem(itemPath: string) {
		const pathToDownload = (await this._disk.getDownloadUrl({ path: itemPath })).href;
		axios
			.get(pathToDownload, {
				responseType: "stream",
			})
			.then((response) => {
				response.data.pipe(this._dfp.createWriteStream, this.relativePath + itemPath.slice(5));
			});
	}

	async downloadFolder(pathToFolder: string) {
		if (pathToFolder.length > 0) {
			this._dfp.mkdir(new Path(pathToFolder));
		}
		const itemsInFolder = await this._disk.getItemMetadata({ path: pathToFolder.length > 0 ? pathToFolder : this.relativePath });
		itemsInFolder._embedded.items.forEach(async (item) => {
			if (item.type == "dir") {
				this.downloadFolder(item.path.slice(6));
				return;
			}
			const pathToDownload = (await this._disk.getDownloadUrl({ path: item.path })).href;
			axios
				.get(pathToDownload, {
					responseType: "stream",
				})
				.then((response) => {
					const newLocal = item.path.slice(6);
					response.data.pipe(this._dfp.createWriteStream(newLocal));
				});
		});
	}
	async uploadFolder(pathToFolder: Path) {

		if (!(await this._disk.isDirExist(pathToFolder.toString()))) {
			await this._disk.createDir(pathToFolder.toString());
		}
		const items = this._dfp.getItems(pathToFolder);
		items.forEach(async (item) => {
			if (item.isFolder) {
				await this.uploadFolder(item.path);
				return;
			}
			const uploadURL = (await this._disk.getUploadUrl({ path: item.path.toString(), overwrite: true })).href;
			const fileBuffer = this._dfp.readAsBinary(item.path);
			axios
				.put(uploadURL, fileBuffer, {
					headers: {
						"Content-Type": "application/octet-stream", // Set the appropriate content type for your file
					},
					maxContentLength: Infinity,
					maxBodyLength: Infinity,
				})
				.then((response) => {
					console.log(response);
				})
				.catch((error) => {
					console.log(error);
				});
		});
	}
	async getFileUrl(pathToFile: string) {
		return (await this._disk.getItemMetadata({ path: pathToFile })).public_url;
	}
	async listAllFolders() {
		return await this._disk.getItemsList({});
	}
}
