import fs, { Stats } from "fs";
import { ItemRef } from "./Storage";
import Path from "./Path";

export default class DiskFileProvider {
    private _rootPath: Path;

    constructor(rootPath: Path | string) {
        if (typeof rootPath === "string") this._rootPath = new Path(rootPath);
        else this._rootPath = rootPath;
    }

    getStorageId(): string {
        return `Disk@${this._rootPath.value}`;
    }

    getRootPath(): Path {
        return this._rootPath;
    }

    getItemRef(path: Path): ItemRef {
        return { path, storageId: this.getStorageId() };
    }

    isFolder(path: Path, isAbsolute: boolean = false): boolean {
        return fs.lstatSync(isAbsolute ? path.value : this._toAbsolute(path)).isDirectory();
    }

    exists(uri: Path, isAbsolute: boolean = false) {
        return fs.existsSync(isAbsolute ? uri.value : this._toAbsolute(uri));
    }

    getStat(path: Path): Stats {
        return fs.statSync(this._toAbsolute(path));
    }

    delete(path: Path, isAbsolute: boolean = false) {
        if (this.isFolder(path, isAbsolute)) {
            this._deleteFolder(path, isAbsolute);
        } else {
            this._deleteFile(path, isAbsolute);
        }
    }

    getItems(path: Path): Uri[] {
        let files = fs.readdirSync(this._toAbsolute(path));
        return files
            .map((name) => {
                let itemPath = path.join(new Path(name));
                let stat = fs.lstatSync(this._toAbsolute(itemPath));
                if (!stat.isFile() && !stat.isDirectory()) return null;
                return {
                    path: itemPath,
                    isFolder: stat.isDirectory(),
                    name,
                };
            })
            .filter((u) => u) as Uri[];
    }


    write(path: Path, data: string | Buffer, isAbsolute: boolean = false) {
        const absolutePath = isAbsolute ? path.value : this._toAbsolute(path);
        if (this.exists(path)) fs.writeFileSync(absolutePath, data, "utf-8");
        else {
            fs.mkdirSync(this._toAbsolute(path.parentDirectoryPath), { recursive: true });
            fs.writeFileSync(absolutePath, data, { encoding: "utf-8", flag: "wx" });
        }
    }

    move(from: Path, to: Path, isAbsolute: boolean = false) {
        if (this.isFolder(from, isAbsolute)) {
            this._moveFolder(from, to, isAbsolute);
        } else {
            this._moveFile(from, to, isAbsolute);
        }
    }

    mkdir(path: Path, isAbsolute: boolean = false) {
        const absolutPath = isAbsolute ? path.value : this._toAbsolute(path);
        if (!fs.existsSync(absolutPath)) fs.mkdirSync(absolutPath);
    }

    read(path: Path, isAbsolute: boolean = false): string {
        if (this.exists(path, isAbsolute))
            return fs.readFileSync(isAbsolute ? path.value : this._toAbsolute(path), "utf-8");
        return null;
    }

    readAsBinary(path: Path): Buffer {
        if (this.exists(path)) return fs.readFileSync(this._toAbsolute(path));
        return null;
    }

// 

    readAsStream(path: Path): fs.ReadStream {
        if (this.exists(path)) return fs.createReadStream(this._toAbsolute(path));
        return null;
    }

    createWriteStream(path: string): fs.WriteStream {
        return fs.createWriteStream(path);
    }

// 

    private _deleteFile(path: Path, isAbsolute: boolean = false) {
        if (this.exists(path, isAbsolute)) fs.unlinkSync(isAbsolute ? path.value : this._toAbsolute(path));
    }
    private _deleteFolder(uri: Path, isAbsolute: boolean = false) {
        const path = isAbsolute ? uri.value : this._toAbsolute(uri);
        // if (fs.existsSync(path)) fs.rmSync(path, { recursive: true, force: true, maxRetries: 5 });
    }

    private _moveFolder(oldPath: Path, newPath: Path, isAbsolute: boolean = false) {
        // fs.cpSync(
        // isAbsolute ? oldPath.value : this._toAbsolute(oldPath),
        // isAbsolute ? newPath.value : this._toAbsolute(newPath),
        // { recursive: true }
        // );
    }

    private _moveFile(oldFilePath: Path, newFilePath: Path, isAbsolute: boolean = false) {
        const content = this.read(oldFilePath, isAbsolute);
        if (!this.exists(oldFilePath, isAbsolute)) return;
        this.delete(oldFilePath, isAbsolute);
        this.write(newFilePath, content, isAbsolute);
    }

    private _isEmptyFolder(path: Path): boolean {
        if (this.exists(path)) return fs.readdirSync(this._toAbsolute(path)).length === 0;
    }

    private _toAbsolute(path: Path): string {
        return this._rootPath.join(path).value;
    }
}

export interface Uri {
    isFolder: boolean;
    name: string;
    path: Path;
}