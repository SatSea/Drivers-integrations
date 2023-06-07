import Onedrive from "onedrive-api";
import DiskFileProvider from "./DiskFileProvider";
import Path from "./Path";

export default class OneDriveStorage {
	relativePath: Path;
	private _dFP: DiskFileProvider;

	constructor(_rootPath: Path, _dFP: DiskFileProvider) {
		this._dFP = _dFP;
		this.relativePath = _rootPath;
	}

	static async initFolder(accessToken: string, relativePath: Path, dFP: DiskFileProvider) {
		if (!dFP.exists(relativePath)) throw new Error("Folder does not exist");
		const newLocal = await this._isExisting(accessToken, relativePath.toString());
		console.log(newLocal);
		// if (newLocal) throw new Error("Cloud folder already exist");
		return new OneDriveStorage(relativePath, dFP);
	}

	static async _isExisting(accessToken, rootPath): Promise<boolean> {
		return Onedrive.items
			.getMetadata({
				accessToken: accessToken,
				itemPath: rootPath,
			})
			.then(() => {
				return true;
			})
			.catch(() => {
				return false;
			});
	}

	async downloadItem(accessToken, itemPath) {
		const fileDownloadStream = await Onedrive.items.download({
			accessToken: accessToken,
			itemPath: itemPath,
		});
		fileDownloadStream.pipe(this._dFP.createWriteStream(this.relativePath + "\\" + itemPath));
	}

	async downloadFolder(accessToken: string, folderPath: string) {
		console.log(folderPath);
		const folderChildrens = await Onedrive.items.listChildren({
			accessToken: accessToken,
			itemPath: folderPath,
		});
		folderChildrens.value.forEach(async (element) => {
			const elementPath = folderPath + "\\" + element.name;
			if (element.folder !== undefined) {
				this.downloadFolder(accessToken, elementPath);
				return;
			}
			const fileDownloadStream = await Onedrive.items.download({
				accessToken: accessToken,
				itemPath: elementPath,
			});
			fileDownloadStream.pipe(this._dFP.createWriteStream(this.relativePath + "\\" + elementPath));
		});
	}
	async uploadfolder(accessToken: string, pathToFolder: Path) {
		const filesInFolder = this._dFP.getItems(pathToFolder);
		Onedrive.items.createFolder({
			accessToken: accessToken,
			itemPath: pathToFolder.parentDirectoryPath.toString(),
			name: pathToFolder.name,
		});
		console.log(pathToFolder.toString())
		filesInFolder.forEach(async (file) => {
			// console.log(file);
			if (file.isFolder) {
				this.uploadfolder(accessToken, new Path(pathToFolder + "\\" + file.name));
				return;
			}
			await Onedrive.items.uploadSession(
				{
					accessToken: accessToken,
					filename: file.name,
					fileSize: this._dFP.getStat(file.path).size,
					parentPath: pathToFolder.toString(),
					readableStream: this._dFP.readAsStream(file.path),
				}
				// ,
				// (bytesUploaded) => {
				// 	console.log(size / bytesUploaded * 100);
				// }
			);
		});
	}
	async getFileLink(accessToken, filePath): Promise<string> {
		return (
			await Onedrive.items.getMetadata({
				accessToken: accessToken,
				itemPath: filePath,
			})
		).webUrl;
	}
}
