// CourseInput.js - Add and manage the courses you're taking at VT
//
// This page lets students:
//   1. Search for VT courses by name or code (like "CS" or "Calculus")
//   2. Click a course to select it, then enter their professor and section
//   3. Add the course to their profile
//   4. View and remove their current courses
//
// The matching system uses these courses to find study partners.

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

function CourseInput() {
  // Get the logged-in user from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // State for the search feature
  const [searchTerm, setSearchTerm] = useState('');    // What the user typed in the search box
  const [searchResults, setSearchResults] = useState([]); // Results from the server

  // State for adding a course
  const [selectedCourse, setSelectedCourse] = useState(null); // The course the user clicked on
  const [professor, setProfessor] = useState('');  // Professor for this course
  const [section, setSection] = useState('');      // Section number (like "01", "02")

  // The user's current course list
  const [myCourses, setMyCourses] = useState([]);

  // Status messages
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // When this component first loads, get the user's current courses
  // useEffect with [] runs once when the component appears on screen
  useEffect(() => {
    loadMyCourses();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load the courses the user is already enrolled in
  async function loadMyCourses() {
    try {
      const response = await api.get(`/api/users/${user.id}/courses`);
      setMyCourses(response.data);
      console.log('Loaded courses:', response.data.length);
    } catch (err) {
      console.log('Could not load courses:', err);
    }
  }

  // Search for courses when the user clicks the "Search" button
  async function handleSearch(event) {
    event.preventDefault();
    setSelectedCourse(null); // Clear any previously selected course

    try {
      // ?search=term sends the search term to our backend as a query parameter
      const response = await api.get(`/api/courses?search=${searchTerm}`);
      setSearchResults(response.data);
      console.log('Search results:', response.data.length);
    } catch (err) {
      console.log('Search error:', err);
      setError('Could not search courses. Is the backend running?');
    }
  }

  // When the user clicks a search result, select that course
  function selectCourse(course) {
    setSelectedCourse(course);
    setProfessor(''); // Clear the professor field for the new selection
    setSection('');
    setMessage('');
    setError('');
  }

  // Add the selected course to the user's profile
  async function handleAddCourse(event) {
    event.preventDefault();

    if (!selectedCourse) {
      setError('Please select a course first.');
      return;
    }

    try {
      await api.post(`/api/users/${user.id}/courses`, {
        course_id: selectedCourse.id,
        professor: professor,
        section: section
      });

      setMessage(`Added ${selectedCourse.course_code} to your courses!`);

      // Clear the form
      setSelectedCourse(null);
      setProfessor('');
      setSection('');
      setSearchResults([]);
      setSearchTerm('');

      // Reload the course list to show the new course
      loadMyCourses();

    } catch (err) {
      console.log('Add course error:', err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Could not add course. Please try again.');
      }
    }
  }

  // Remove a course from the user's list
  async function handleRemoveCourse(entryId, courseCode) {
    // Ask the user to confirm before deleting
    const confirmed = window.confirm(`Remove ${courseCode} from your courses?`);
    if (!confirmed) return;

    try {
      await api.delete(`/api/users/${user.id}/courses/${entryId}`);
      setMessage(`${courseCode} removed from your courses.`);

      // Reload the list after removing
      loadMyCourses();

    } catch (err) {
      console.log('Remove course error:', err);
      setError('Could not remove course. Please try again.');
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="header">
        <h1>HokieStudy</h1>
        <div className="header-nav">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/matches">Find Partners</Link>
        </div>
      </div>

      <div className="page-container">

        {/* ---- SEARCH SECTION ---- */}
        <div className="card">
          <h2>Search VT Courses</h2>
          <p style={{ color: '#666', marginBottom: '15px' }}>
            Search by course code (like "CS 2104") or by course name (like "Calculus").
          </p>

          {/* Search form */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search courses..."
              style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '16px' }}
            />
            <button className="btn btn-primary" type="submit">
              Search
            </button>
          </form>

          {/* Show search results */}
          {searchResults.length > 0 && (
            <div>
              <p style={{ marginBottom: '10px', color: '#666' }}>
                Click a course to select it:
              </p>
              {searchResults.map(course => (
                <div
                  key={course.id}
                  className={`course-search-result ${selectedCourse && selectedCourse.id === course.id ? 'selected' : ''}`}
                  onClick={() => selectCourse(course)}
                >
                  <strong>{course.course_code}</strong> - {course.course_name}
                  <span style={{ color: '#999', fontSize: '13px', marginLeft: '10px' }}>
                    ({course.department} | {course.credits} credits)
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* If search ran but no results */}
          {searchResults.length === 0 && searchTerm && (
            <p style={{ color: '#888', fontStyle: 'italic' }}>
              No courses found. Try a different search term.
            </p>
          )}
        </div>

        {/* ---- ADD COURSE FORM ---- */}
        {/* Only show this section if the user selected a course */}
        {selectedCourse && (
          <div className="card">
            <h2>Add Course to Your Profile</h2>

            <div style={{ padding: '12px', backgroundColor: '#fff0f4', borderRadius: '5px', marginBottom: '15px' }}>
              <strong>Selected: {selectedCourse.course_code}</strong> - {selectedCourse.course_name}
            </div>

            <form onSubmit={handleAddCourse}>
              <div className="form-group">
                <label>Professor (optional)</label>
                <input
                  type="text"
                  value={professor}
                  onChange={(e) => setProfessor(e.target.value)}
                  placeholder="e.g., Godmar Back"
                />
              </div>

              <div className="form-group">
                <label>Section (optional)</label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="e.g., 01, A, Online"
                />
              </div>

              <button className="btn btn-primary" type="submit">
                Add This Course
              </button>
              <button
                type="button"
                className="btn"
                style={{ marginLeft: '10px', backgroundColor: '#ccc', color: '#333' }}
                onClick={() => setSelectedCourse(null)}
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* ---- MY COURSES LIST ---- */}
        <div className="card">
          <h2>My Courses This Semester</h2>

          {/* Status messages */}
          {message && <div className="success-message" style={{ marginBottom: '15px' }}>{message}</div>}
          {error && <div className="error-message" style={{ marginBottom: '15px' }}>{error}</div>}

          {myCourses.length === 0 ? (
            <p style={{ color: '#888', fontStyle: 'italic' }}>
              You haven't added any courses yet. Search above to get started!
            </p>
          ) : (
            myCourses.map(course => (
              <div key={course.id} className="my-course-item">
                <div>
                  <strong>{course.course_code}</strong> - {course.course_name}
                  {/* Only show professor/section if they were entered */}
                  {course.professor && (
                    <span style={{ color: '#666', fontSize: '14px', display: 'block' }}>
                      Prof. {course.professor}
                      {course.section && ` | Section ${course.section}`}
                    </span>
                  )}
                </div>
                <button
                  className="btn btn-danger"
                  onClick={() => handleRemoveCourse(course.id, course.course_code)}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

export default CourseInput;
