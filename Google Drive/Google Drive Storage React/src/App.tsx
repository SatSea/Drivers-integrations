import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import GooglePicker from "./GooglePicker";
import { useCookies } from "react-cookie";

import axios from "axios";

function App() {
	const [token, setToken] = useState<string | null>(null);
	const { oAuth2Client: oAuth2Client } = useCookies(["oAuth2Client"])[0];
	console.log(oAuth2Client);
  const GoogleOAuth = <GoogleOAuthProvider clientId="405235322287-65sj4j30kiribhv7ln1f7sidikl5deu4.apps.googleusercontent.com">
    <GoogleLoginComponent />
  </GoogleOAuthProvider>;
	return (
		<div className="App">
			<header className="App-header">
				<img src={logo} className="App-logo" alt="logo" />
				{/* {googleOAuth} */}
				{!oAuth2Client &&GoogleOAuth}
				{oAuth2Client && <GooglePicker token={oAuth2Client.credentials.access_token}/>}
				{}
			</header>
		</div>
	);
}


const GoogleLoginComponent = () => {
	const googleLogin = useGoogleLogin({
		flow: "auth-code",
		onSuccess: async (codeResponse) => {
			console.log(codeResponse);
			const tokens = await axios.post(
				"http://localhost:3001/auth/google",
				{
					code: codeResponse.code,
				},
				{ withCredentials: true }
			);
			if (tokens.status !== 200) {
				throw new Error("Can't get tokens from backend");
			}
			console.log(tokens.data);
		},
		scope: "https://www.googleapis.com/auth/drive",
		// overrideScope: true,
		onError: (errorResponse) => console.log(errorResponse),
	});
	return (
		<div>
			<button onClick={() => googleLogin()}>Login with Google</button>
		</div>
	);
};
export default App;
