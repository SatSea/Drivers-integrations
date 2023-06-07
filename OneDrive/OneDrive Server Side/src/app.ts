import express, { Request, Response } from "express";
import cors from "cors";
import Onedrive from "onedrive-api";
import DiskFileProvider from "./DiskFileProvider";

import Path from "./Path";
import OneDriveStorage from "./OneDriveStorage";

const app: express.Application = express();
const port: number = 3001;

const rootPath = "";
const dFP = new DiskFileProvider(rootPath);
let oDS_Folder1: OneDriveStorage;

app.use(
	cors({
		origin: "http://localhost:3000",
		credentials: true,
	})
);
app.use(express.json());

app.post("/list-all-folders", async (req: Request, res: Response) => {
	Onedrive.items
		.listChildren({
			accessToken: req.body.accessToken,
			itemId: "root",
			drive: "me",
			driveId: "",
		})
		.then((childrens) => {
			// list all children of given root directory
			console.log(childrens);
			// returns body of https://dev.onedrive.com/items/list.htm#response
		});
});

app.post("/download-item", async (req: Request, res: Response) => {
	await oDS_Folder1.downloadItem(req.body.accessToken, req.body.itemPath);
});

app.post("/pull", async (req: Request, res: Response) => {
	await oDS_Folder1.downloadFolder(req.body.accessToken, oDS_Folder1.relativePath.toString());
});

app.post("/clone", async (req: Request, res: Response) => {
	await oDS_Folder1.downloadFolder(req.body.accessToken, req.body.relativePath);
});

app.post("/push", async (req: Request, res: Response) => {
	await oDS_Folder1.uploadfolder(req.body.accessToken, new Path(req.body.relativePath));
  res.send()
});

app.post("/getFileLink", async (req: Request, res: Response) => {
	res.send(await oDS_Folder1.getFileLink(req.body.accessToken, req.body.filePath));
});

app.post("/initFolder", async (req: Request, res: Response) => {
	oDS_Folder1 = await OneDriveStorage.initFolder(req.body.accessToken, new Path(req.body.relativePath), dFP);
  res.send()
});

// getUrl

app.listen(port, () => {
	console.log(`Server listening at port: ${port}`);
});
