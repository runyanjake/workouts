
// Type definitions for Google Globals
declare global {
    interface Window {
        google: any;
        gapi: any;
    }
}

// Added drive.file scope which is required for the Picker to access/select files
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest'];

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

export const initializeGoogleScripts = () => {
    return new Promise<void>((resolve) => {
        const checkScripts = setInterval(() => {
            if (window.google && window.gapi) {
                clearInterval(checkScripts);
                resolve();
            }
        }, 100);
    });
};

export const initGapiClient = async (apiKey: string) => {
    return new Promise<void>((resolve, reject) => {
        window.gapi.load('client:picker', async () => {
            try {
                await window.gapi.client.init({
                    apiKey: apiKey,
                    discoveryDocs: DISCOVERY_DOCS,
                });
                gapiInited = true;
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    });
};

export const initTokenClient = (clientId: string, callback: (response: any) => void) => {
    if (!window.google) return;
    
    tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (tokenResponse: any) => {
            callback(tokenResponse);
        },
    });
    gisInited = true;
};

export const requestAccessToken = () => {
    if (!tokenClient) throw new Error("Token Client not initialized. Check Client ID.");
    // Request a new token. Prompt only if necessary.
    tokenClient.requestAccessToken({ prompt: '' });
};

export const createPicker = (apiKey: string, accessToken: string, clientId: string, callback: (fileId: string) => void) => {
    if (!gapiInited) {
        console.error("GAPI not initialized");
        alert("Google API Client not loaded yet. Please wait a moment.");
        return;
    }

    // Extract the numeric Project Number (App ID) from the Client ID
    // Client ID format is usually: 1234567890-abcdefg... .apps.googleusercontent.com
    const appId = clientId.split('-')[0];

    const view = new window.google.picker.DocsView(window.google.picker.ViewId.SPREADSHEETS);
    view.setMimeTypes("application/vnd.google-apps.spreadsheet");
    view.setMode(window.google.picker.DocsViewMode.GRID);

    const picker = new window.google.picker.PickerBuilder()
        .setDeveloperKey(apiKey)
        .setAppId(appId)
        .setOAuthToken(accessToken)
        .addView(view)
        .setCallback((data: any) => {
            if (data.action === window.google.picker.Action.PICKED) {
                const fileId = data.docs[0].id;
                callback(fileId);
            }
        })
        .build();
    
    picker.setVisible(true);
};
