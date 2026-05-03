# main app file - handles all the routes and database stuff
# using Flask because it's way simpler than setting up React + Node

from flask import Flask, render_template, redirect, url_for, session, request, flash, jsonify, Response
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3, os, json, datetime
from functools import wraps

app = Flask(__name__)
app.secret_key = 'hokiestudy-secret'

# paths to the database and the course/faculty data files
DB = os.path.join(os.path.dirname(__file__), 'hokiestudy.db')
COURSES_JSON = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'courses.json')
FACULTY_JSON = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'faculty.json')

# days and times used for the availability grid
DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
TIMES = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00']
LABELS = ['8AM','9AM','10AM','11AM','12PM','1PM','2PM','3PM','4PM','5PM','6PM','7PM','8PM','9PM','10PM']

# opens a connection to the sqlite database
def db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row  # so we can access columns by name instead of index
    return conn

# creates all the tables and loads course/faculty data on first run
def init_db():
    c = db()
    c.executescript('''
        CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE, password TEXT, year TEXT);
        CREATE TABLE IF NOT EXISTS courses (id INTEGER PRIMARY KEY, course_code TEXT, course_name TEXT, department TEXT);
        CREATE TABLE IF NOT EXISTS user_courses (id INTEGER PRIMARY KEY, user_id INTEGER, course_id INTEGER, professor TEXT DEFAULT '');
        CREATE TABLE IF NOT EXISTS availability (id INTEGER PRIMARY KEY, user_id INTEGER, day TEXT, time TEXT);
        CREATE TABLE IF NOT EXISTS study_requests (id INTEGER PRIMARY KEY, from_uid INTEGER, to_uid INTEGER, status TEXT DEFAULT 'pending');
        CREATE TABLE IF NOT EXISTS faculty (id INTEGER PRIMARY KEY, name TEXT, department TEXT);
    ''')
    # this handles the case where the db already exists without the professor column
    try:
        c.execute('ALTER TABLE user_courses ADD COLUMN professor TEXT DEFAULT ""')
        c.commit()
    except:
        pass
    # seed courses from JSON only if the table is empty
    if c.execute('SELECT COUNT(*) FROM courses').fetchone()[0] == 0 and os.path.exists(COURSES_JSON):
        with open(COURSES_JSON) as f:
            for course in json.load(f):
                c.execute('INSERT INTO courses (course_code,course_name,department) VALUES (?,?,?)',
                          (course['code'], course['name'], course['department']))
    # same thing for faculty
    if c.execute('SELECT COUNT(*) FROM faculty').fetchone()[0] == 0 and os.path.exists(FACULTY_JSON):
        with open(FACULTY_JSON) as f:
            for person in json.load(f):
                c.execute('INSERT INTO faculty (name,department) VALUES (?,?)',
                          (person['name'], person['department']))
    c.commit(); c.close()

# decorator to protect routes that require login - redirects to login page if not logged in
def login_required(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        if 'uid' not in session: return redirect(url_for('login'))
        return f(*args, **kwargs)
    return wrapped

@app.route('/')
def index(): return redirect(url_for('dashboard') if 'uid' in session else url_for('login'))

# register a new account, hash the password before saving
@app.route('/register', methods=['GET','POST'])
def register():
    if request.method == 'POST':
        name, email, pw, year = request.form['name'], request.form['email'], request.form['password'], request.form.get('year','')
        if not name or not email or not pw:
            return render_template('register.html', error='All fields required.')
        c = db()
        if c.execute('SELECT id FROM users WHERE email=?', (email,)).fetchone():
            c.close(); return render_template('register.html', error='Email already registered.')
        c.execute('INSERT INTO users (name,email,password,year) VALUES (?,?,?,?)',
                  (name, email, generate_password_hash(pw), year))
        c.commit()
        u = c.execute('SELECT * FROM users WHERE email=?', (email,)).fetchone()
        c.close()
        session['uid'] = u['id']; session['uname'] = u['name']
        return redirect(url_for('dashboard'))
    return render_template('register.html')

# check email + password, store user id in session on success
@app.route('/login', methods=['GET','POST'])
def login():
    if request.method == 'POST':
        email, pw = request.form['email'], request.form['password']
        c = db()
        u = c.execute('SELECT * FROM users WHERE email=?', (email,)).fetchone()
        c.close()
        if not u or not check_password_hash(u['password'], pw):
            return render_template('login.html', error='Invalid email or password.')
        session['uid'] = u['id']; session['uname'] = u['name']
        return redirect(url_for('dashboard'))
    return render_template('login.html')

@app.route('/logout')
def logout(): session.clear(); return redirect(url_for('login'))

# dashboard just shows a welcome + how many pending requests the user has
@app.route('/dashboard')
@login_required
def dashboard():
    c = db()
    pending = c.execute('SELECT COUNT(*) FROM study_requests WHERE to_uid=? AND status=?', (session['uid'], 'pending')).fetchone()[0]
    c.close()
    return render_template('dashboard.html', name=session['uname'], pending=pending)

# returns up to 10 matching faculty names as JSON for the professor autocomplete
@app.route('/faculty/search')
@login_required
def faculty_search():
    q = request.args.get('q', '').strip().lower()
    if len(q) < 2:
        return jsonify([])
    c = db()
    rows = c.execute('SELECT name FROM faculty WHERE LOWER(name) LIKE ? LIMIT 10', (f'%{q}%',)).fetchall()
    c.close()
    return jsonify([r['name'] for r in rows])

# search for courses and add/remove them from your list
@app.route('/courses', methods=['GET','POST'])
@login_required
def courses():
    c = db()
    if request.method == 'POST':
        action = request.form.get('action')
        if action == 'add':
            cid = request.form.get('course_id')
            professor = request.form.get('professor', '').strip()
            # don't add duplicates
            if cid and not c.execute('SELECT id FROM user_courses WHERE user_id=? AND course_id=?', (session['uid'], cid)).fetchone():
                c.execute('INSERT INTO user_courses (user_id,course_id,professor) VALUES (?,?,?)', (session['uid'], cid, professor))
        elif action == 'remove':
            c.execute('DELETE FROM user_courses WHERE id=? AND user_id=?', (request.form.get('entry_id'), session['uid']))
        c.commit(); c.close()
        return redirect(url_for('courses'))
    my_courses = c.execute('''SELECT uc.id, c.course_code, c.course_name, uc.professor FROM user_courses uc
                              JOIN courses c ON uc.course_id=c.id WHERE uc.user_id=?
                              ORDER BY c.course_code''', (session['uid'],)).fetchall()
    search = request.args.get('q', '')
    results = c.execute('SELECT * FROM courses WHERE LOWER(course_code) LIKE ? OR LOWER(course_name) LIKE ? LIMIT 15',
                        (f'%{search.lower()}%', f'%{search.lower()}%')).fetchall() if search else []
    c.close()
    return render_template('courses.html', my_courses=my_courses, results=results, search=search)

# save availability by wiping old slots and inserting the new ones
@app.route('/availability', methods=['GET','POST'])
@login_required
def availability():
    c = db()
    if request.method == 'POST':
        c.execute('DELETE FROM availability WHERE user_id=?', (session['uid'],))
        for slot in request.form.getlist('slots'):
            day, time = slot.split('-', 1)
            c.execute('INSERT INTO availability (user_id,day,time) VALUES (?,?,?)', (session['uid'], day, time))
        c.commit(); c.close()
        flash('Availability saved!')
        return redirect(url_for('availability'))
    saved = {f"{r['day']}-{r['time']}" for r in c.execute('SELECT day,time FROM availability WHERE user_id=?', (session['uid'],))}
    c.close()
    return render_template('availability.html', days=DAYS, times=TIMES, labels=LABELS, selected=saved)

# generates a .ics file from the user's saved availability slots
# each slot becomes a weekly recurring event so it shows up in Google Calendar etc.
@app.route('/availability/export')
@login_required
def export_availability():
    c = db()
    slots = c.execute('SELECT day, time FROM availability WHERE user_id=?', (session['uid'],)).fetchall()
    c.close()
    day_map = {'Monday':'MO','Tuesday':'TU','Wednesday':'WE','Thursday':'TH','Friday':'FR','Saturday':'SA','Sunday':'SU'}
    day_num = {'Monday':0,'Tuesday':1,'Wednesday':2,'Thursday':3,'Friday':4,'Saturday':5,'Sunday':6}
    monday = datetime.date.today() - datetime.timedelta(days=datetime.date.today().weekday())
    lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//HokieStudy//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH']
    for s in slots:
        ref = monday + datetime.timedelta(days=day_num[s['day']])
        h, m = s['time'].split(':')
        dtstart = ref.strftime('%Y%m%d') + f'T{h}{m}00'
        lines += ['BEGIN:VEVENT',f'DTSTART;TZID=America/New_York:{dtstart}','DURATION:PT1H',
                  f'RRULE:FREQ=WEEKLY;BYDAY={day_map[s["day"]]}','SUMMARY:Study Availability',
                  f'UID:{session["uid"]}-{s["day"]}-{s["time"]}@hokiestudy','END:VEVENT']
    lines.append('END:VCALENDAR')
    return Response('\r\n'.join(lines) + '\r\n', mimetype='text/calendar',
                    headers={'Content-Disposition': 'attachment; filename=hokiestudy-availability.ics'})

# find other students who share courses with you
# also calculates course match % and availability overlap %
@app.route('/matches')
@login_required
def matches():
    uid = session['uid']
    c = db()
    my_courses = [r['course_id'] for r in c.execute('SELECT course_id FROM user_courses WHERE user_id=?', (uid,))]
    if not my_courses:
        c.close(); return render_template('matches.html', matches=[], no_courses=True)
    my_slots = {f"{r['day']}-{r['time']}" for r in c.execute('SELECT day,time FROM availability WHERE user_id=?', (uid,))}
    ph = ','.join('?'*len(my_courses))  # build the right number of ? placeholders for the IN clause
    shared = c.execute(f'SELECT user_id, COUNT(*) as cnt FROM user_courses WHERE course_id IN ({ph}) AND user_id!=? GROUP BY user_id ORDER BY cnt DESC',
                       my_courses+[uid]).fetchall()
    sent_requests = {r['to_uid']: r['status'] for r in c.execute('SELECT to_uid, status FROM study_requests WHERE from_uid=?', (uid,))}
    result = []
    for row in shared:
        u = c.execute('SELECT name,year FROM users WHERE id=?', (row['user_id'],)).fetchone()
        if not u: continue
        shared_codes = [r['course_code'] for r in c.execute(
            f'SELECT c.course_code FROM user_courses uc JOIN courses c ON uc.course_id=c.id WHERE uc.user_id=? AND uc.course_id IN ({ph})',
            [row['user_id']]+my_courses)]
        their_slots = {f"{r['day']}-{r['time']}" for r in c.execute('SELECT day,time FROM availability WHERE user_id=?', (row['user_id'],))}
        overlap = my_slots & their_slots
        result.append({
            'uid': row['user_id'], 'name': u['name'], 'year': u['year'] or 'VT Student',
            'courses': shared_codes, 'course_pct': round(row['cnt'] / len(my_courses) * 100),
            'avail_pct': round(len(overlap) / len(my_slots) * 100) if my_slots else 0,
            'overlap_count': len(overlap), 'request_status': sent_requests.get(row['user_id'])
        })
    c.close()
    return render_template('matches.html', matches=result)

# send a study request to another user (only one request per pair)
@app.route('/request/<int:to_uid>', methods=['POST'])
@login_required
def send_request(to_uid):
    c = db()
    if not c.execute('SELECT id FROM study_requests WHERE from_uid=? AND to_uid=?', (session['uid'], to_uid)).fetchone():
        c.execute('INSERT INTO study_requests (from_uid,to_uid,status) VALUES (?,?,?)', (session['uid'], to_uid, 'pending'))
        c.commit()
    c.close()
    return redirect(url_for('matches'))

# inbox page - shows requests you received and requests you sent
@app.route('/requests')
@login_required
def requests_page():
    c = db()
    incoming = c.execute('''SELECT r.id, r.status, u.name, u.year FROM study_requests r
                            JOIN users u ON r.from_uid=u.id WHERE r.to_uid=? ORDER BY r.id DESC''', (session['uid'],)).fetchall()
    sent = c.execute('''SELECT r.id, r.status, u.name, u.year FROM study_requests r
                        JOIN users u ON r.to_uid=u.id WHERE r.from_uid=? ORDER BY r.id DESC''', (session['uid'],)).fetchall()
    c.close()
    return render_template('requests.html', incoming=incoming, sent=sent)

# accept or decline an incoming study request
@app.route('/requests/<int:req_id>/<action>', methods=['POST'])
@login_required
def respond_request(req_id, action):
    if action in ('accepted', 'declined'):
        c = db()
        c.execute('UPDATE study_requests SET status=? WHERE id=? AND to_uid=?', (action, req_id, session['uid']))
        c.commit(); c.close()
    return redirect(url_for('requests_page'))

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
