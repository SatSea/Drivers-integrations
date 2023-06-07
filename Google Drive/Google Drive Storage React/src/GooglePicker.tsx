import axios from "axios";
import { error } from "console";
import React from "react";

declare global {
  interface Window {
    gapi: any;
  }
}

interface IDocument {
  id: string;
}

class GooglePicker extends React.Component<{ token: string }> {
  componentDidMount() {
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.onload = () => {
      window.gapi.load("picker", {
        callback: () => console.log("Picker loaded"),
      });
    };
    document.body.appendChild(script);
  }

  openPicker = () => {
    if (!window.gapi) {
      console.error("Google API not loaded");
      return;
    }
    if (!window.gapi.picker.api) {
      console.error("Google Picker not loaded");
      return;
    }
    console.log(window.gapi.picker.api);
    const view = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
      .setParent("root")
      .setIncludeFolders(true)
      .setSelectFolderEnabled(true);
    const picker = new window.gapi.picker.api.PickerBuilder()
      .enableFeature(google.picker.Feature.SUPPORT_DRIVES)
      .addView(view)
      .setOAuthToken(this.props.token)
      .setCallback(this.pickerCallback)
      .build();
    console.log(new window.gapi.picker.api.PickerBuilder());
    picker.setVisible(true);
  };

  pickerCallback = async (data: { action: string; docs: IDocument[] }) => {
    if (data.action === window.gapi.picker.api.Action.PICKED) {
      const doc = data.docs[0];
      console.log("The user selected: " + doc.id);
      const isSuccessfullFolderPull: boolean = await axios.post("http://localhost:3001/clone", {
        folder_id: doc.id,
      });
      if (isSuccessfullFolderPull) {
        console.log("Successful pull")
      }
      else {
        throw new Error("Error then pulling");        
      }
    }
  };

  render() {
    return <button onClick={this.openPicker}>Select Folder</button>;
  }
}

export default GooglePicker;
