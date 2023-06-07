import Path from "./Path";


export enum StorageType {
    google = "DropBox"
}
export interface ChangeItem {
    itemRef: ItemRef;
    type: ChangeType;
}
export interface ItemRef {
    storageId: string;
    path: Path;
}

export enum ChangeType {
    change = "change",
    delete = "delete",
    // rename = "rename",
    add = "add",
}
export type StorageUrl = string;
export default interface Storage {
    pull(drive): Promise<void>;
    push(drive): Promise<void>;
    clone(folderId, drive): Promise<void>;
    getType: (drive) => StorageType;
    getUrl(drive): Promise<StorageUrl>;
    getFileLink(path, drive): Promise<string>;
}