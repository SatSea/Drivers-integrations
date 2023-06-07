import express from "express";
import { Request, Response } from "express";
import cors from "cors";

import YandexDriveStorage from "./YandexDriveStorage";
import Path from "./Path";
import DiskFileProvider from "./DiskFileProvider";

const app: express.Application = express();
const port: number = 3001;

let yDS_Folder1: YandexDriveStorage;

const relativePath = "folderTest";
const rootPath = "";
const dfp = new DiskFileProvider(rootPath);

app.use(
	cors({
		origin: "http://localhost:3000",
		credentials: true,
	})
);
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
	return res.send("Hello World");
});

app.post("/list-all-folders", async (req: Request, res: Response) => {
	if (!yDS_Folder1) return res.status(401).send()
	await yDS_Folder1.listAllFolders()
});

app.post("/download-item", async (req: Request, res: Response) => {
	if (!yDS_Folder1) return res.status(401).send()
	await yDS_Folder1.downloadItem(req.body.item_path);
});

app.post("/pull", async (req: Request, res: Response) => {
	if (!yDS_Folder1) return res.status(401).send()
	await yDS_Folder1.downloadFolder(req.body.folder_path);
});

app.post("/clone", async (req: Request, res: Response) => {
	if (!yDS_Folder1) return res.status(401).send()
	await yDS_Folder1.downloadFolder(req.body.folder_path);
});

app.post("/push", async (req: Request, res: Response) => {
	if (!yDS_Folder1) return res.status(401).send()
	await yDS_Folder1.uploadFolder(new Path(yDS_Folder1.relativePath));
	res.send("Pushed");
});

app.post("/getFileLink", async (req: Request, res: Response) => {
	if (!yDS_Folder1) return res.status(401).send()
	res.send(await yDS_Folder1.getFileUrl(req.body.file_path));
});

app.post("/initFolder", async (req: Request, res: Response) => {
	yDS_Folder1 = await YandexDriveStorage.initFolder(relativePath, dfp, req.body.accessToken);
});

// getUrl

app.listen(port, () => {
	console.log(`Server listening at port: ${port}`);
});
