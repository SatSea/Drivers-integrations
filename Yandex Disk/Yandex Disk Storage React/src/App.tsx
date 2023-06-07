import React, { useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { YandexLogin, YandexLogout } from "react-yandex-login";
import axios from "axios";

const clientID = "9bdb007be3444b99be0ec0ea5db5ca0f";

async function get_all_folders(userData) {
	return await axios.post(
		"http://localhost:3001/list-all-folders",
		{
			accessToken: userData.access_token,
		},
		{
			withCredentials: true,
		}
	);
}

function App() {
	const [userData, setUserData] = useState(undefined);
	const [url, seturl] = useState(undefined);
	const [data, setData] = useState<{ name: string; type: string; path: string }[]>([]);
	const initFolder = async (access_token) => {
		await axios.post(
			"http://localhost:3001/initFolder",
			{
				accessToken: access_token,
			},
			{
				withCredentials: true,
			}
		);
	};

	const loginSuccess = async (userData) => {
		console.log("User Data: ", userData);
		setUserData(userData);
		console.log(userData.access_token);
		await initFolder(userData.access_token);
		const data = (await get_all_folders(userData)).data;
		console.log(data);
		setData(data.items);
	};

	const logoutSuccess = () => {
		setUserData(null);
	};

	const cloneButton = (
		<button
			onClick={() => {
				axios.post("http://localhost:3001/clone", {
					folder_path: "",
					accessToken: userData.access_token,
				});
			}}
		>
			Склонить
		</button>
	);
	const pushButton = (
		<button
			onClick={() => {
				axios.post("http://localhost:3001/push", {
					// folder_path: "Загрузки",
					accessToken: userData.access_token,
				});
			}}
		>
			Запушить
		</button>
	);
	const getUrlButton = (
		<button
			onClick={async () => {
				const res = await axios.post("http://localhost:3001/getFileLink", {
					file_path: "Загрузки/Test/",
					accessToken: userData.access_token,
				});
				console.log(res);
				seturl(res.data);
			}}
		>
			Получить Url файла
		</button>
	);

	return (
		<div className="App">
			<header className="App-header">
				<img src={logo} className="App-logo" alt="logo" />
				<div>
					{!userData && (
						<YandexLogin clientID={clientID} onSuccess={loginSuccess}>
							<button>Yandex Login</button>
						</YandexLogin>
					)}
					{userData && (
						<div>
							<YandexLogout onSuccess={logoutSuccess}>
								<button>Yandex Logout</button>
							</YandexLogout>
							<ul>
								<li>access_token: {userData.access_token}</li>
								<li>expires_in: {userData.expires_in}</li>
								<li>token_type: {userData.token_type}</li>
								<li>refresh_token: {userData.refresh_token}</li>
							</ul>
						</div>
					)}
					{userData && cloneButton}
					{userData && pushButton}
					{userData && getUrlButton}
					{userData && url}
					{data.map((item) => (
						<div
							style={{ padding: "3rem", cursor: "pointer" }}
							onClick={() => {
								axios.post("http://localhost:3001/download-item", {
									item_path: item.path,
									accessToken: userData.access_token,
								});
							}}
						>
							{item.name} {item.path} {item.type}
						</div>
					))}
				</div>
			</header>
		</div>
	);
}

export default App;
