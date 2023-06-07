import { drive_v3 } from "googleapis";
import Path from "./Path";


export enum StorageType {
    google = "google"
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
    pull(drive: drive_v3.Drive): Promise<void>;
    push(drive: drive_v3.Drive): Promise<void>;
    clone(folderId: string, drive: drive_v3.Drive): Promise<void>;
    getType: (drive: drive_v3.Drive) => StorageType;
    getUrl(drive: drive_v3.Drive): Promise<StorageUrl>;
    getFileLink(path: Path, drive: drive_v3.Drive): Promise<string>;
}