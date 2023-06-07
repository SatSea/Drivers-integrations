import React, { useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import axios from "axios";
import MicrosoftLogin from "react-microsoft-login";

function App() {
	const clientId = "41ad6f4f-cf74-488c-bc90-faaad5f5950f";
	const [userData, setUserData] = useState(undefined);
	const [initedFolder, setInitedFolder] = useState(false);

	const authHandler = (err: any, data: any) => {
		console.log(data);
		setUserData(data.accessToken);
	};
	const listAllButton = (
		<button
			onClick={() => {
				axios.post(
					"http://localhost:3001/list-all-folders",
					{
						accessToken: userData,
					},
					{
						withCredentials: true,
					}
				);
			}}
		>
			Вернуть все файлы
		</button>
	);
	const downloadButton = (
		<button
			onClick={() => {
				axios.post(
					"http://localhost:3001/download-item",
					{
						accessToken: userData,
            itemPath: "folderTest\\Зима.jpg",
					},
					{
						withCredentials: true,
					}
				);
			}}
		>
			Скачать файл
		</button>
	);
	const pullButton = (
		<button
			onClick={() => {
				axios.post(
					"http://localhost:3001/pull",
					{
						accessToken: userData,
            folderPath: "folderTest",
					},
					{
						withCredentials: true,
					}
				);
			}}
		>
			Скачать папку
		</button>
	);
	const pushButton = (
		<button
			onClick={() => {
				axios.post(
					"http://localhost:3001/push",
					{
						accessToken: userData,
            relativePath: "folderTest",
					},
					{
						withCredentials: true,
					}
				);
			}}
		>
			Запушить
		</button>
	);
	const getLinkButton = (
		<button
			onClick={async () => {
				console.log(await axios.post(
					"http://localhost:3001/getFileLink",
					{
						accessToken: userData,
            filePath: "folderTest\\Загрузки\\Test\\R.jfif",
					},
					{
						withCredentials: true,
					}
				))
			}}
		>
			Получить ссылку
		</button>
	);
	const initFolderButton = (
		<button
			onClick={async () => {
				if((await axios.post(
					"http://localhost:3001/initFolder",
					{
						accessToken: userData,
            relativePath: "folderTest",
					},
					{
						withCredentials: true,
					}
				)).status === 200){
          setInitedFolder(true)
        }
			}}
		>
			Получить ссылку
		</button>
	);
	const scopes = ["Files.ReadWrite.All"];
	return (
		<div className="App">
			<header className="App-header">
				<img src={logo} className="App-logo" alt="logo" />

				<MicrosoftLogin
					graphScopes={scopes}
					useLocalStorageCache={true}
					clientId={clientId}
					authCallback={authHandler}
					children={undefined}
				/>
        {userData && !initedFolder && initFolderButton}
				{userData && initedFolder && listAllButton}
				{userData && initedFolder && downloadButton}
				{userData && initedFolder && pullButton}
				{userData && initedFolder && pushButton}
				{userData && initedFolder && getLinkButton}
			</header>
		</div>
	);
}

export default App;
