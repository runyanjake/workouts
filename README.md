# Workouts
A bring-your-own-data workout application for managing and visualizing a workout tracker in Google Sheets.

## User Configuration

### Google Sheets Format
Expects a very exact Google Sheets document with 2 or more tabs.

Tab 1: `Data` - Table of each rep of each tracked workout.

Columns: `Date, Exercise, Reps, Weight, Time, Notes`.

Tab 2: `Exercises` - Table of all tracked exercises.

Columns: `Name, Type, Muscle, Groups, Description, Notes`

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
