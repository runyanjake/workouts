# Workouts
A bring-your-own-data workout application for managing and visualizing a workout tracker in Google Sheets.

## How to Use
1. Configure a Google Sheet with your data. The app expects a very exact Google Sheets document with these two tabs:
- Tab 1: `Data` - Table of each rep of each tracked workout.
    - Columns: `Date, Exercise, Reps, Weight, Time, Notes`.
- Tab 2: `Exercises` - Table of all tracked exercises.
    - Columns: `Name, Type, Muscle, Groups, Description, Notes`
2. Under the Settings tab, authenticate with your Google account via OAuth2.0.
3. Also under the settings tab, use the file picker to select your account.
4. Press the sync button (download button if on mobile) to pull data.
5. Update data in the Tracker tab or view data in the Analytics tab. 
6. Overwrite your sheet with updated data using the save button (upload to cloud button if on mobile).

## Server Configuration

### Environment
Create `.env` containing the following:
```env
VITE_GOOGLE_CLIENT_ID=xxxxxxxxxxx.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=yyyyyyyyyyyy
```

### GCP Configuration
1. Create Project for use with the application.
2. Create OAuth 2.0 Client ID under `APIs and Services > Credentials`. Add Authorized Javascript origins for testing and deployment (`http://localhost:5173` for local and `https://www.example.com` for your live app.)
3. Enable the required APIs for the project under `APIs and Services > Enabled APIs and Services`.
- Requires: `Google Sheets API`, `Google Drive API`, `Google Picker API`.
4. Create an API Key under `APIs and Services > Credentials`. Restrict it as necessary, and scope down to only use the required applications that you granted to the project.
5. Configure OAuth consent screen. Add authorized test users for testing phase.

## Deployment

### Locally via Node
```bash
npm install
npm run dev
```

### Docker 
```bash
docker stop workouts && docker rmi workouts && docker system prune && docker compose up -d --build && docker logs -f workouts
```
