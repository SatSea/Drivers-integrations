import React from "react";
import logo from "./logo.svg";
import "./App.css";
import axios from "axios";


const authURL = "http://localhost:3001/authURL";

function App() {
  const goToAuthButton = (
    <button onClick={
      () => {
        window.location.href = authURL
      }
    }>Авторизоваться</button>
  );
  const initButton = (
    <button onClick={
      () => {
        axios.post("http://localhost:3001/initFolder", {
          relavtivePath: "folderTest"
        },{
          withCredentials: true
        })
      }
    }>Инициализировать папку</button>
  );
  const listButton = (
    <button onClick={
      () => {
        axios.post("http://localhost:3001/listAllFolders", {
          pathToFolder: "/folderTest"
        })
      }
    }>Содержимое папки</button>
  );
  const pullButton = (
    <button onClick={
      () => {
        axios.post("http://localhost:3001/pull", {
          pathToFolder: "/folderTest"
        })
      }
    }>Pull папку</button>
  );
  const pushButton = (
    <button onClick={
      () => {
        axios.post("http://localhost:3001/push", {
          pathToFolder: "folderTest"
        })
      }
    }>Push папку</button>
  );
	return (
		<div className="App">
			<header className="App-header">
				<img src={logo} className="App-logo" alt="logo" />
				{goToAuthButton}
        {initButton}
        {listButton}
        {pullButton}
        {pushButton}
			</header>
		</div>
	);
}

export default App;
