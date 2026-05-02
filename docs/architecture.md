# HokieStudy - Architecture Documentation

## Tech Stack

| Layer | Technology | Version | Why We Chose It |
|---|---|---|---|
| Frontend | React | 18.x | Fast, component-based UI; required by proposal |
| Routing | React Router | v6 | Enables multiple pages in a single-page app |
| HTTP Client | Axios | 1.x | Easier than fetch(); auto-attaches auth token |
| Backend | Node.js + Express | 18+ / 4.x | JavaScript on the server; required by proposal |
| Database | JSON file storage | — | No install needed; pure JavaScript; easy to read |
| Auth | JWT + bcryptjs | — | Stateless tokens; bcryptjs requires no C++ compiler |
| Testing | Jest + supertest | 29.x / 6.x | Standard Node.js testing combo |
| CSS | Plain CSS | — | Familiar to HTML/CSS students |

---

## Database Design

Data is stored in `data/hokiestudy-data.json` (one JSON file). The file contains four arrays that act like database tables:

```
hokiestudy-data.json
├── users[]         All registered students
├── courses[]       VT course catalog (pre-loaded from courses.json)
├── user_courses[]  Which courses each student is taking
└── availability[]  When each student is free to study
```

### users
```json
{
  "id": 1,
  "name": "Hokie Student",
  "email": "student@vt.edu",
  "password": "$2a$10$...",  // bcrypt hash (never the real password)
  "year": "Junior",
  "age": 20
}
```

### courses (pre-loaded, read-only)
```json
{
  "id": 1,
  "course_code": "CS 2104",
  "course_name": "Problem Solving in CS",
  "department": "Computer Science",
  "credits": 3
}
```

### user_courses (joins users → courses)
```json
{
  "id": 1,
  "user_id": 1,
  "course_id": 3,
  "professor": "Godmar Back",
  "section": "01"
}
```

### availability
```json
{
  "id": 1,
  "user_id": 1,
  "day_of_week": "Monday",
  "start_time": "08:00",
  "end_time": "10:00"
}
```

---

## API Endpoints

| Method | Path | Auth? | Description |
|---|---|---|---|
| POST | /api/auth/register | No | Create new account |
| POST | /api/auth/login | No | Log in, receive JWT |
| GET | /api/users/:id | Yes | Get user profile |
| PUT | /api/users/:id | Yes | Update user profile |
| GET | /api/courses?search= | No | Search VT course catalog |
| GET | /api/users/:id/courses | Yes | Get user's enrolled courses |
| POST | /api/users/:id/courses | Yes | Add course to profile |
| DELETE | /api/users/:id/courses/:entryId | Yes | Remove course from profile |
| POST | /api/users/:id/availability | Yes | Save weekly availability |
| GET | /api/users/:id/availability | Yes | Get weekly availability |
| GET | /api/users/:id/matches | Yes | Get study partner matches |
| GET | /api/health | No | Server health check |

**Auth**: Routes marked "Yes" require `Authorization: Bearer <token>` header.

---

## Frontend Component Tree

```
App.js (router)
├── /login       → Login.js
│                  Form: email + password → POST /api/auth/login
├── /register    → Register.js
│                  Form: name, email, password, year, age → POST /api/auth/register
├── /dashboard   → Dashboard.js (requires login)
│                  Navigation cards to all sections; logout button
├── /courses     → CourseInput.js (requires login)
│                  Search box → GET /api/courses?search=
│                  Course list + add form → POST /api/users/:id/courses
│                  Remove button → DELETE /api/users/:id/courses/:entryId
├── /availability → Availability.js (requires login)
│                  7×8 clickable grid (days × time slots)
│                  Save → POST /api/users/:id/availability
├── /matches     → Matches.js (requires login)
│                  Loads → GET /api/users/:id/matches
│                  Shows matched students, shared courses, overlapping times
├── /calendar    → Calendar.js (requires login)
│                  Read-only grid (same as Availability)
│                  Export button → generates .ics file in browser (no API call)
└── /profile     → Profile.js (requires login)
                   Edit name/year/age → PUT /api/users/:id
```

---

## Matching Algorithm

1. Get all `course_id` values from `user_courses` for the current user
2. Filter `user_courses` for all other users who have any of those `course_id` values
3. Count how many courses each other user shares (like a `GROUP BY COUNT`)
4. Sort by count descending
5. For each match: look up shared course details and overlapping availability
6. Return the sorted list of matches

---

## Authentication Flow

```
User logs in → backend verifies password → backend creates JWT token
JWT is stored in localStorage → axios interceptor attaches it to every request
Backend middleware (auth.js) verifies token before each protected route
Token expires after 7 days → user must log in again
```

---

## Calendar Export (.ics)

The `.ics` file is generated entirely in the browser using JavaScript's `Blob` API.
No additional server route is needed.

Each availability slot becomes a `VEVENT` with:
- `RRULE:FREQ=WEEKLY;BYDAY=MO` (repeats every Monday, for example)
- The file uses `\r\n` line endings (required by RFC 5545 iCal standard)
- Compatible with Google Calendar, Apple Calendar, and Outlook
