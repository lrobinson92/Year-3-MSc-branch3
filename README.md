# SOPify - Standard Operating Procedure Management Platform

SOPify is a comprehensive SOP (Standard Operating Procedure) management system designed to help organisations create, manage, and share documentation. It features team collaboration, task management, and AI-assisted document generation.

## Features

- **Document Management**: Create, store, and share SOPs with team members
- **Google Drive Integration**: Seamlessly store and access documents with Google Drive
- **Team Collaboration**: Create teams, manage members, and control access permissions
- **Task Management**: Create, assign, and track tasks related to procedures
- **AI-Assisted Generation**: Generate, summarise, and improve SOPs using AI
- **Review Scheduling**: Set review dates and receive notifications for SOP updates

## System Requirements

- Python (v3.9+)
- PostgreSQL (v13+)
- Google OAuth credentials

## 🔧 Installation

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/your-username/sopify.git
cd /backend

# Create and activate virtual environment
python -m venv venv
source venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup database
python manage.py migrate

# Create a .env file with necessary credentials (see Environment Variables section below)
cp .env.example .env

# Run development server
python manage.py runserver

# Start the notification listener (run in a separate terminal)
# This command listens for PostgreSQL notifications and sends emails for reminders for tasks that are due soon
python manage.py listen_for_notifications
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Create environment file awith necessary credentials (see Environment Variables section below)
cp .env.example .env

# Run development server
npm start
```

### Setting up Google Drive Integration

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Google Drive API
3. Create OAuth 2.0 credentials
4. Add authorised redirect URIs:
   - `http://localhost:8000/api/google-drive/callback/` (development)
5. Update your `.env` file with the client ID and client secret

## 🔑 Environment Variables

### Backend (.env)

```
SECRET_KEY=your_django_secret_key
DEBUG=True
DATABASE_URL=postgresql://user:password@localhost:5432/sopify
GOOGLE_OAUTH_CLIENT_ID=your_google_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_client_secret
OPENAI_API_KEY=your_openai_api_key
```

### Frontend (.env)

```
REACT_APP_API_URL=http://localhost:8000/api
```

## 📚 API Documentation

### Teams API
- `GET /teams/` - List all teams
- `POST /teams/` - Create a new team
- `GET /teams/{id}/` - Retrieve a specific team
- `PUT /teams/{id}/` - Update a team
- `PATCH /teams/{id}/` - Partially update a team
- `DELETE /teams/{id}/` - Delete a team

### Tasks API
- `GET /tasks/` - List all tasks
- `POST /tasks/` - Create a new task
- `GET /tasks/{id}/` - Retrieve a specific task
- `PUT /tasks/{id}/` - Update a task
- `PATCH /tasks/{id}/` - Partially update a task
- `DELETE /tasks/{id}/` - Delete a task

### Documents API
- `GET /documents/` - List all documents
- `POST /documents/` - Create a new document
- `GET /documents/{id}/` - Retrieve a specific document
- `PUT /documents/{id}/` - Update a document
- `PATCH /documents/{id}/` - Partially update a document
- `DELETE /documents/{id}/` - Delete a document

### Custom Endpoints
- `GET /teams/{team_id}/users-in-same-team/` - Get users in a specific team
- `GET /google-drive/login/` - Initiate Google Drive login flow
- `GET /google-drive/callback/` - Handle Google OAuth callback
- `GET /google-drive/files/` - List user's Google Drive files
- `POST /google-drive/upload/` - Upload to Google Drive
- `GET /google-drive/file-content/{document_id}/` - Get content of a Google Drive file
- `POST /generate-sop/` - Generate a new SOP using AI
- `POST /summarise-sop/` - Get AI-generated summary of an SOP
- `POST /improve-sop/` - Get AI-suggested improvements for an SOP
- `DELETE /documents/{document_id}/delete/` - Delete a document from Google Drive


## 🏗️ Architecture Overview

SOPify uses a modern web application architecture:

- **Frontend**: React.js with Redux for state management
- **Backend**: Django with Django REST Framework
- **Database**: PostgreSQL for structured data storage
- **External Services**:
  - Google Drive API for document storage
  - OpenAI API for AI-assisted features
  
The system follows a modular approach with separate components for authentication, document management, team management, and task tracking.

## 🧪 Testing

```bash
# Run backend tests
cd backend
python manage.py test

# Run frontend tests
cd ../frontend
npm test
```