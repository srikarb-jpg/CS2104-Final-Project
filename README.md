# HokieStudy - Virginia Tech Study Partner Finder

A web app that helps VT students find study partners by matching them on shared courses and overlapping availability.

## Video Demonstration

[VIDEO LINK - Upload to YouTube and paste URL here]

---

## Features

- Register and login with a VT email
- Add the courses you're taking this semester
- Mark your weekly availability on a grid
- View matched students who share your courses and are free at the same time

---

## Tech Stack

- **Python + Flask** — web framework (server-side rendering)
- **SQLite** — built into Python, no database server needed
- **Jinja2** — HTML templates (comes with Flask)
- **pytest** — testing

---

## Setup

**Requires Python 3.8+**

### Install dependencies
```
cd code/app
pip install flask
```

### Run the app
```
python app.py
```

Open http://localhost:5000 in your browser.

### (Optional) Add demo students
```
python seed.py
```
This adds 5 fake VT students (password: `password123`) so you can demo the matching feature.

---

## Running Tests
```
pip install pytest
pytest tests/test_app.py
```

---

## Author

- **Name**: Srikar Burugula
- **Email**: srikarb@vt.edu
- **Course**: CS 2104 — Problem Solving in Computer Science
- **GitHub**: https://github.com/srikarb-jpg/CS2104-Final-Project
