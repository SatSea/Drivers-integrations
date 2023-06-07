import { error } from "console";
import DiskFileProvider from "./DiskFileProvider";
import Path from "./Path";
import { StorageType } from "./Storage";
import { Dropbox } from "dropbox";

export default class DropBoxStorage {
	private _dFP: DiskFileProvider;
	private _relavtivePath: string;
	private _dbx: Dropbox;

	constructor(dbx: Dropbox, dFP: DiskFileProvider, relavtivePath: string) {
		this._dFP = dFP;
		this._relavtivePath = relavtivePath;
		this._dbx = dbx;
	}

	static InitFolder(
		credentials: {
			accessToken: string;
			expireAt: Date;
			refreshToken: string;
			clientSecret: string;
			clientId: string;
		},
		dFP: DiskFileProvider,
		relavtivePath: string
	) {
		const dbx = new Dropbox({
			accessToken: credentials.accessToken,
			accessTokenExpiresAt: credentials.expireAt,
			refreshToken: credentials.refreshToken,
			clientSecret: credentials.clientSecret,
			clientId: credentials.clientId,
		});
		return new DropBoxStorage(dbx, dFP, relavtivePath);
	}

	async listAllFilesInFolder(pathToFolder: string) {
		return await this._dbx
			.filesListFolder({ path: pathToFolder })
			.catch((error) => {
				console.log(error);
			})
			.then((result) => {
				if (!result) return null;
				return result.result.entries;
			});
	}

	async downloadFromFolder(pathToFolder: string) {
		const files = await this.listAllFilesInFolder(pathToFolder);
		if (files.length === 0) return null;
		files.forEach(async (file) => {
			if (file[".tag"] === "folder") {
				const folderPath = file.path_display;
				this._dFP.mkdir(new Path(folderPath));
				this.pull(folderPath);
				return;
			}
			const pathToFile = `${file.path_display}`;
			const fileDownload = await this._dbx.filesDownload({ path: pathToFile });
			const fileBinary = (fileDownload.result as any).fileBinary;
			this._dFP.write(new Path(file.path_display), fileBinary);
		});
	}

	async pull(pathToFolder: string): Promise<void> {
		await this.downloadFromFolder(pathToFolder);
	}

	async clone(pathToFolder: string): Promise<void> {
		await this.downloadFromFolder(pathToFolder);
	}

	async push(pathToFolder: Path): Promise<void> {
		await this.uploadFolder(pathToFolder);
	}

	async uploadFolder(pathToFolder: Path) {
		const files = this._dFP.getItems(pathToFolder);
		files.forEach(async (file) => {
            if (file.isFolder) {
                const newLocal = "/" + file.path.toString() ;
                await this._dbx.filesCreateFolderV2({path: newLocal}).catch(()=>{})
                this.uploadFolder(file.path)
                return
            }
            const newLocal = "/" + file.path.toString();
			this._dbx.filesUpload({path: newLocal, contents: this._dFP.readAsBinary(file.path)}).catch((error)=>{
                console.log(error)
            });
		});
	}

	getType: (drive) => StorageType;

	async getUrl(): Promise<string> {
		return (await this._dbx.filesGetMetadata({ path: this._relavtivePath })).result.preview_url;
	}

	async getFileLink(pathToFile: string): Promise<string> {
		return (await this._dbx.filesGetMetadata({ path: pathToFile })).result.preview_url;
	}
}
