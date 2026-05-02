// db.js - Our "database" module
// Instead of a real database server, we store all our data in a JSON file.
// This is like a simple filing cabinet for our app's information.
// It's easy to understand because the data is just JavaScript objects and arrays!

const fs = require('fs');
const path = require('path');

// Figure out where to save the data file
// If we're running tests, use a separate file so we don't mess up real data
const DATA_FILE = process.env.NODE_ENV === 'test'
  ? path.join(__dirname, '..', '..', '..', 'data', 'hokiestudy-test.json')
  : path.join(__dirname, '..', '..', '..', 'data', 'hokiestudy-data.json');

// The courses file has the list of VT courses we pre-loaded
const COURSES_FILE = path.join(__dirname, '..', '..', '..', 'data', 'courses.json');

// This sets up a fresh empty database with the VT course list already loaded
// Think of it like a constructor that initializes all our data containers
function initData() {
  console.log('Creating new database file...');

  // Load the VT courses from our courses.json file
  const rawCourses = JSON.parse(fs.readFileSync(COURSES_FILE, 'utf8'));

  // Give each course an ID number (like a primary key in a real database)
  const courses = rawCourses.map((c, i) => ({
    id: i + 1,
    course_code: c.code,
    course_name: c.name,
    department: c.department,
    credits: c.credits
  }));

  // Return the initial structure with empty arrays for each "table"
  // This is like having 4 empty tables in a real database
  return {
    users: [],                  // All registered students
    courses: courses,           // VT courses (pre-loaded from courses.json)
    user_courses: [],           // Which courses each student is taking
    availability: [],           // When each student is free to study
    study_requests: [],         // Study partner requests between students
    nextIds: {                  // Auto-increment counters (like AUTOINCREMENT in SQL)
      users: 1,
      user_courses: 1,
      availability: 1,
      study_requests: 1
    }
  };
}

// Read the data from the JSON file
// This is like opening the database connection
function readDB() {
  // If the file doesn't exist yet, create it with starting data
  if (!fs.existsSync(DATA_FILE)) {
    const data = initData();
    writeDB(data);
    return data;
  }
  // Read and parse the JSON file
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

// Save the data back to the JSON file
// This is like committing a transaction in a real database
function writeDB(data) {
  // JSON.stringify with null, 2 makes the JSON file nicely formatted (easy to read)
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Export these functions so other files can use them
module.exports = { readDB, writeDB };
