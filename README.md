# ACI Africa - Website and Backend

A non-profit charity website for ACI Africa, built with HTML/CSS/JS on the frontend and a Node.js + Express backend connected to a Neon PostgreSQL database.

## Project Structure

```
welfare-gh-pages/
├── index.html          # Home page
├── about.html          # About page
├── causes.html         # Causes page
├── donate.html         # Donation form (posts to /api/donate)
├── contact.html        # Contact form (posts to /api/contact)
├── admin.html          # Admin portal (view/delete submissions)
├── server.js           # Express backend API
├── package.json
├── .env.example        # Environment variable template
├── .gitignore
├── css/                # Stylesheets
├── js/                 # Scripts (including main.js with Gemini AI chatbot)
└── images/             # Static assets
```

## Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd welfare-gh-pages
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```
Open `.env` and fill in your real values:
- `DATABASE_URL` — your Neon PostgreSQL connection string
- `ADMIN_USER` / `ADMIN_PASS` — credentials for the admin portal

### 4. Run the server
```bash
node server.js
```

The site will be available at: http://localhost:3000
The admin portal is at: http://localhost:3000/admin.html

## API Endpoints

| Method   | Route                        | Description                        |
|----------|------------------------------|------------------------------------|
| POST     | /api/contact                 | Save a contact form submission     |
| POST     | /api/donate                  | Save a donation form submission    |
| GET      | /api/admin/contacts          | Fetch all contact messages         |
| GET      | /api/admin/donations         | Fetch all donation records         |
| DELETE   | /api/admin/contacts/:id      | Delete a contact message           |
| DELETE   | /api/admin/donations/:id     | Delete a donation record           |

## Environment Variables

| Variable      | Description                              |
|---------------|------------------------------------------|
| DATABASE_URL  | Neon PostgreSQL connection string        |
| PORT          | Server port (default: 3000)              |
| ADMIN_USER    | Admin portal username                    |
| ADMIN_PASS    | Admin portal password                    |

Security note: Never commit your .env file. It is excluded by .gitignore.
