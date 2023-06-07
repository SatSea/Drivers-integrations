import express, { Request, Response } from "express";
import cors from "cors";
import DiskFileProvider from "./DiskFileProvider";
import axios from "axios";

import Path from "./Path";
const cookieParser = require("cookie-parser");
import DropBoxStorage from "./DropBoxStorage";

const app: express.Application = express();
const port: number = 3001;

const rootPath = "";
const dFP = new DiskFileProvider(rootPath);
let dBS_Folder1: DropBoxStorage;

const appId = "";
const appSecret = "";
const redirectURL = "http://localhost:3001/auth";
const redirect = "http://localhost:3000";

app.use(
	cors({
		origin: "http://localhost:3000",
		credentials: true,
	})
);
app.use(express.json());
app.use(cookieParser());

app.get("/auth", async (req: Request, res: Response) => {
	console.log(req.query.code);
	await axios
		.post("https://api.dropboxapi.com/oauth2/token", null, {
			params: {
				code: req.query.code,
				grant_type: "authorization_code",
				client_id: appId,
				client_secret: appSecret,
				redirect_uri: redirectURL,
			},
		})
		.then((response) => {
			const data = response.data;
			console.log(data);
			res.cookie("access_token", data.access_token);
			res.cookie("expires_at", new Date(new Date().getTime() + data.expires_in * 1000));
			res.cookie("refresh_token", data.refresh_token);
			res.redirect(redirect);
		})
		.catch((error) => {
			console.log(error);
			res.send(error);
		});
});

app.get("/authURL", (req, res) => {
	res.redirect(
		`https://www.dropbox.com/oauth2/authorize?client_id=${appId}&token_access_type=offline&redirect_uri=${redirectURL}&response_type=code`
	);
});

app.post("/listAllFolders", async (req: Request, res: Response) => {
	if (!dBS_Folder1) return res.status(401).send();
	const newLocal = await dBS_Folder1.listAllFilesInFolder(req.body.pathToFolder);
	console.log(newLocal);
	res.send(newLocal);
});

app.post("/downloadItem", async (req: Request, res: Response) => {});

app.post("/pull", async (req: Request, res: Response) => {
	if (!dBS_Folder1) return res.status(401).send();
	await dBS_Folder1.pull(req.body.pathToFolder);
});

app.post("/clone", async (req: Request, res: Response) => {
	if (!dBS_Folder1) return res.status(401).send();
	await dBS_Folder1.clone(req.body.pathToFolder);
});

app.post("/push", async (req: Request, res: Response) => {
	if (!dBS_Folder1) return res.status(401).send();
	await dBS_Folder1.uploadFolder(new Path(req.body.pathToFolder));
});

app.post("/getFileLink", async (req: Request, res: Response) => {
	if (!dBS_Folder1) return res.status(401).send();
	res.send(await dBS_Folder1.getFileLink(req.body.pathToFile));
});

app.post("/getUrl", async (req: Request, res: Response) => {
	if (!dBS_Folder1) return res.status(401).send();
	res.send(await dBS_Folder1.getUrl());
});

app.post("/initFolder", async (req: Request, res: Response) => {
	const credentials = {
		accessToken: req.cookies.access_token,
		expireAt: req.cookies.expires_at,
		refreshToken: req.cookies.refresh_token,
		clientSecret: appId,
		clientId: appSecret,
	};
	dBS_Folder1 = DropBoxStorage.InitFolder(credentials, dFP, req.body.relavtivePath);
});

app.listen(port, () => console.log(`Server listening at port: ${port}`));
