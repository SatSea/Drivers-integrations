import { Credentials, OAuth2Client } from "google-auth-library";
import {Response} from "express"
import { google } from "googleapis";

export default class GoogleAuth {

    private _clientSecret = '';
    private _clientId = '';
    private _redirectUri = 'postmessage';
    
    constructor(){

    }

    async getTokens(code: string): Promise<Credentials> {
        return await new OAuth2Client(
            this._clientId,
            this._clientSecret,
            this._redirectUri,
        ).getToken(code).then((res) => {
            return res.tokens
        }).catch(()=>{
            throw new Error("Can't get token");
        })
    }

    setOAuth2Client(res: Response, oAuth2Client: OAuth2Client ): void {
        res.cookie('oAuth2Client', oAuth2Client )
        res.send("Client authorized")
    }

    logOut() {

    }

    createOAuth2Client(credentials: Credentials) {
        const oAuthClient = this.getEmptyOAuth2Client();
        oAuthClient.setCredentials(credentials)
        return oAuthClient
    }

    async refreshTokens(req: any, res: Response | null = null): Promise<string>{
        const oAuth2Client = req.cookies.oAuth2Client;
        if (res == null) {
            this.setOAuth2Client(res, oAuth2Client)
        } else {
            return (await oAuth2Client.getAccessToken()).token
        }
    }

    async getDrive(oAuth2Client: OAuth2Client) {
        return google.drive({ version: "v3", auth: oAuth2Client });
    }

    getEmptyOAuth2Client(): OAuth2Client {
        const oAuth2Client = new OAuth2Client(
            this._clientId,
            this._clientId,
            this._redirectUri
        );
        oAuth2Client.forceRefreshOnFailure = true
        return oAuth2Client
    }
}