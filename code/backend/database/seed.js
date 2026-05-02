// seed.js - Adds fake VT students to the app for demo purposes
//
// Run this once from the backend folder:
//   node database/seed.js
//
// This adds 5 fake students who have courses and availability set up,
// so you can showcase the "Find Study Partners" feature right away.
// All fake students have the password: "password123"

const bcrypt = require('bcryptjs');
const { readDB, writeDB } = require('./db');

// The fake students we want to add
// Each has a name, email, year, courses (by course_code), and available time slots
const fakeStudents = [
  {
    name: 'Alex Rivera',
    email: 'arivera@vt.edu',
    year: 'Freshman',
    age: 18,
    courseCodes: ['CS 1044', 'MATH 1225', 'ENGL 1105'],
    professor: ['Cliff Shaffer', 'John Floyd', 'Matthew Vollmer'],
    section: ['01', '02', '03'],
    availability: [
      { day_of_week: 'Monday',    start_time: '08:00', end_time: '10:00' },
      { day_of_week: 'Monday',    start_time: '10:00', end_time: '12:00' },
      { day_of_week: 'Wednesday', start_time: '08:00', end_time: '10:00' },
      { day_of_week: 'Friday',    start_time: '14:00', end_time: '16:00' }
    ]
  },
  {
    name: 'Jordan Kim',
    email: 'jkim@vt.edu',
    year: 'Sophomore',
    age: 19,
    courseCodes: ['CS 2104', 'MATH 1226', 'BIOL 1005', 'CS 1044'],
    professor: ['Godmar Back', 'Martin Day', 'Jeb Everett', 'Cliff Shaffer'],
    section: ['02', '01', '01', '02'],
    availability: [
      { day_of_week: 'Tuesday',   start_time: '10:00', end_time: '12:00' },
      { day_of_week: 'Tuesday',   start_time: '14:00', end_time: '16:00' },
      { day_of_week: 'Thursday',  start_time: '10:00', end_time: '12:00' },
      { day_of_week: 'Monday',    start_time: '08:00', end_time: '10:00' }
    ]
  },
  {
    name: 'Taylor Chen',
    email: 'tchen@vt.edu',
    year: 'Junior',
    age: 21,
    courseCodes: ['CS 2114', 'CS 2505', 'MATH 2114', 'CS 2104'],
    professor: ['Srinidhi Varadarajan', 'Calvin Ribbens', 'Peter Haskell', 'Godmar Back'],
    section: ['01', '01', '02', '01'],
    availability: [
      { day_of_week: 'Monday',    start_time: '10:00', end_time: '12:00' },
      { day_of_week: 'Wednesday', start_time: '10:00', end_time: '12:00' },
      { day_of_week: 'Wednesday', start_time: '14:00', end_time: '16:00' },
      { day_of_week: 'Friday',    start_time: '08:00', end_time: '10:00' }
    ]
  },
  {
    name: 'Morgan Williams',
    email: 'mwilliams@vt.edu',
    year: 'Senior',
    age: 22,
    courseCodes: ['CS 3114', 'ECON 2005', 'MGT 3304', 'MATH 2114'],
    professor: ['Ali Butt', 'Sunil Sinha', 'Robert Sumichrast', 'Nicholas Loehr'],
    section: ['02', '01', '01', '01'],
    availability: [
      { day_of_week: 'Tuesday',   start_time: '16:00', end_time: '18:00' },
      { day_of_week: 'Thursday',  start_time: '16:00', end_time: '18:00' },
      { day_of_week: 'Friday',    start_time: '14:00', end_time: '16:00' },
      { day_of_week: 'Saturday',  start_time: '10:00', end_time: '12:00' }
    ]
  },
  {
    name: 'Casey Johnson',
    email: 'cjohnson@vt.edu',
    year: 'Sophomore',
    age: 20,
    courseCodes: ['CS 1064', 'CS 2104', 'ENGL 1106', 'MATH 1225'],
    professor: ['Layne Watson', 'Godmar Back', 'Peter Sforza', 'Eun Heui Kim'],
    section: ['01', '03', '01', '01'],
    availability: [
      { day_of_week: 'Monday',    start_time: '08:00', end_time: '10:00' },
      { day_of_week: 'Monday',    start_time: '14:00', end_time: '16:00' },
      { day_of_week: 'Wednesday', start_time: '08:00', end_time: '10:00' },
      { day_of_week: 'Friday',    start_time: '10:00', end_time: '12:00' }
    ]
  }
];

// Hash the shared password once (no need to hash 5 times)
const hashedPassword = bcrypt.hashSync('password123', 10);

const data = readDB();

let addedCount = 0;

for (const student of fakeStudents) {
  // Skip if this email already exists (so we can re-run the script safely)
  if (data.users.find(u => u.email === student.email)) {
    console.log(`Skipping ${student.name} - already in database`);
    continue;
  }

  // Create the user
  const newUser = {
    id: data.nextIds.users,
    name: student.name,
    email: student.email,
    password: hashedPassword,
    year: student.year,
    age: student.age
  };
  data.users.push(newUser);
  const userId = data.nextIds.users;
  data.nextIds.users += 1;

  // Add their courses
  for (let i = 0; i < student.courseCodes.length; i++) {
    const course = data.courses.find(c => c.course_code === student.courseCodes[i]);
    if (!course) {
      console.log(`  Warning: course "${student.courseCodes[i]}" not found, skipping`);
      continue;
    }

    data.user_courses.push({
      id: data.nextIds.user_courses,
      user_id: userId,
      course_id: course.id,
      professor: student.professor[i] || '',
      section: student.section[i] || ''
    });
    data.nextIds.user_courses += 1;
  }

  // Add their availability
  for (const slot of student.availability) {
    data.availability.push({
      id: data.nextIds.availability,
      user_id: userId,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time
    });
    data.nextIds.availability += 1;
  }

  console.log(`Added ${student.name} (${student.email}) with ${student.courseCodes.length} courses`);
  addedCount++;
}

writeDB(data);
console.log(`\nDone! Added ${addedCount} fake students.`);
console.log('All fake student passwords are: password123');
console.log('\nTo see matches, register your own account and add some of these courses:');
console.log('  CS 2104, CS 1044, MATH 1225, MATH 2114, CS 2114, ENGL 1105');
