import express from "express";
import cors from "cors";

import GoogleDriveStorage from "./GoogleDriveStorage";
import GoogleAuth from "./GoogleAuth";
import DiskFileProvider from "./DiskFileProvider";
import Path from "./Path";

var cookieParser = require("cookie-parser");

const rootPath = "";
const dFP = new DiskFileProvider(rootPath);
let gA: GoogleAuth = new GoogleAuth();
let gDS_Folder1: GoogleDriveStorage;

const app = express();

app.use(
	cors({
		origin: "http://localhost:3000",
		credentials: true,
	})
);

app.use(express.json());
app.use(cookieParser());

app.post("/auth/google", async (req, res) => {
	res.cookie("oAuth2Client", gA.createOAuth2Client(await gA.getTokens(req.body.code)));
	res.send();
});

app.post("/auth/google/refreshToken", async (req, res) => {
	res.send(await gA.refreshTokens(req, res));
});

app.post("/clone", async (req, res) => {
	await gDS_Folder1.clone(req.body.folder_id);
	console.log();
});

app.post("/download-item", async (req, res) => {
	await gDS_Folder1.getFile(req.body.itemPath);
});

app.post("/pull", async (req, res) => {
	await gDS_Folder1.pull();
});

app.post("/clone", async (req, res) => {
	await gDS_Folder1.clone(gDS_Folder1.parentFolderId);
});

app.post("/push", async (req, res) => {
	await gDS_Folder1.push();
	res.send();
});

app.post("/getFileLink", async (req, res) => {
	res.send(await gDS_Folder1.getFileLink(req.body.filePath));
});

app.post("/initFolder", async (req, res) => {
	const oAuth2Client = req.cookies.oAuth2Client;
	gDS_Folder1 = await GoogleDriveStorage.initFolder(req.body.relativePath, dFP, oAuth2Client.getDrive(oAuth2Client));
	res.send();
});

app.listen(3001, () => console.log(`server is running`));
