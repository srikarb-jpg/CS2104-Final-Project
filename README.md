# HokieStudy - Virginia Tech Study Partner Finder

A web application that helps Virginia Tech students find study partners by matching them based on shared courses and overlapping weekly availability.

## Video Demonstration

[VIDEO LINK - Upload to YouTube and paste URL here]

---

## Project Overview

HokieStudy lets VT students:
- Create an account and set up their profile (name, year, age)
- Add the courses they're taking this semester (with professor and section)
- Mark their weekly availability on a 7-day × 8-timeslot grid
- View a list of matched students who share their courses, sorted by number of shared courses
- See which times both students are free to meet
- Export their study schedule as a `.ics` file to import into Google Calendar

---

## Technologies Used

- **Frontend**: React 18, React Router v6, Axios, plain CSS (VT maroon & orange theme)
- **Backend**: Node.js, Express.js
- **Data Storage**: JSON file (`data/hokiestudy-data.json`) — no database server needed
- **Authentication**: JWT (JSON Web Tokens) + bcryptjs password hashing
- **Testing**: Jest + supertest
- **Calendar Export**: iCal `.ics` format (RFC 5545), generated in the browser

---

## Prerequisites

Before running this project, make sure you have:
- **Node.js** version 16 or higher (download from https://nodejs.org)
- **npm** (comes with Node.js)
- A terminal / command prompt

You do **not** need to install a database server.

---

## Installation & Setup

### Step 1: Clone or download the project
```
git clone https://github.com/srikarb-jpg/CS2104-Final-Project.git
cd CS2104-Final-Project
```

### Step 2: Install backend dependencies
```
cd code/backend
npm install
```

### Step 3: Install frontend dependencies
```
cd ../frontend
npm install
cd ../..
```
(Go back to the project root after this)

---

## Running the Application

You need to run **two terminal windows** at the same time — one for the backend, one for the frontend.

### Terminal 1 - Start the Backend Server
```
cd code/backend
node server.js
```
You should see: `HokieStudy server is running at http://localhost:5000`

To verify it's working, open http://localhost:5000/api/health in your browser.
You should see: `{"status":"ok","message":"HokieStudy backend is running! Go Hokies!"}`

### Terminal 2 - Start the React Frontend
```
cd code/frontend
npm start
```
This will automatically open http://localhost:3000 in your browser.

---

## How to Use the App

1. **Register**: Click "Sign up here" and fill in your name, VT email, password, and year
2. **Add Courses**: After registering, you'll be taken to My Courses. Search for your classes (e.g., "CS 2104") and add them with your professor and section
3. **Set Availability**: Go to My Availability and click the time slots when you're free to study each week. Click Save.
4. **Find Partners**: Go to Find Study Partners to see other students sharing your courses, sorted by how many courses you share. Overlapping free times are highlighted.
5. **Export Calendar**: Go to My Calendar to see your availability grid and click "Export to Google Calendar (.ics)" to download the file, then import it into Google Calendar.

---

## Running the Tests

From the project root:
```
cd code/backend
npm test
```
This runs three test suites:
- `tests/auth.test.js` — Registration and login tests
- `tests/matching.test.js` — Study partner matching algorithm tests
- `tests/api.test.js` — Course search, availability, and protected route tests

---

## Project File Structure

```
CS2104-Final-Project/
├── code/
│   ├── backend/
│   │   ├── database/
│   │   │   └── db.js               JSON-based data store
│   │   ├── middleware/
│   │   │   └── auth.js             JWT authentication middleware
│   │   ├── routes/
│   │   │   ├── auth.js             Register and login endpoints
│   │   │   ├── users.js            User profile endpoints
│   │   │   ├── courses.js          Course search and management
│   │   │   ├── availability.js     Weekly availability endpoints
│   │   │   └── matches.js          Study partner matching endpoint
│   │   ├── .env                    Environment variables (JWT secret, port)
│   │   ├── package.json
│   │   └── server.js               Express app entry point
│   └── frontend/
│       └── src/
│           ├── api.js              Axios setup with auth interceptor
│           ├── App.js              Router and protected routes
│           ├── App.css             All styles (VT colors)
│           └── components/
│               ├── Auth/           Login.js, Register.js
│               ├── Dashboard/      Dashboard.js
│               ├── Profile/        Profile.js
│               ├── Courses/        CourseInput.js
│               ├── Availability/   Availability.js (grid)
│               ├── Matches/        Matches.js
│               └── Calendar/       Calendar.js (.ics export)
├── data/
│   ├── courses.json                50 VT courses across 9 departments
│   └── professors.json             33 VT faculty members
├── tests/
│   ├── auth.test.js                Auth endpoint tests
│   ├── matching.test.js            Matching algorithm tests
│   └── api.test.js                 API endpoint tests
├── docs/
│   └── architecture.md             System design documentation
├── report/
│   └── placeholder.txt             (report submitted separately)
└── README.md
```

---

## Author

- **Name**: Srikar Bandaru
- **Email**: srikarb@vt.edu
- **Course**: CS 2104 — Problem Solving in Computer Science
- **GitHub**: https://github.com/srikarb-jpg/CS2104-Final-Project

---

## LLM Usage

Claude Code (Anthropic) was used to assist with:
- Writing and structuring the Node.js/Express backend routes
- Setting up the React component structure and routing
- Generating the iCal (.ics) calendar export logic
- Writing the Jest + supertest test files

All code was reviewed, understood, and integrated by the student.
