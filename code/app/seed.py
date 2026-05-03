import app
from werkzeug.security import generate_password_hash

app.init_db()
c = app.db()

# course IDs based on order in courses.json:
# 1=CS1044, 2=CS1064, 3=CS2104, 4=CS2114, 5=CS2505
# 6=CS3114, 7=CS3304, 8=CS3714, 9=CS4104, 10=CS4234
# 11=MATH1225, 12=MATH1226, 13=MATH2114, 14=MATH2204
# 17=BIOL1005, 21=CHEM1035, 26=PHYS2305, 31=ENGL1105

students = [
    # name, email, year, course IDs, availability slots (day, time)
    ('Alex Rivera',     'alex@vt.edu',    'Junior',    [3, 4, 11, 13],
     [('Monday','09:00'),('Monday','11:00'),('Wednesday','09:00'),('Wednesday','14:00'),('Friday','10:00')]),

    ('Jordan Kim',      'jordan@vt.edu',  'Sophomore', [3, 2, 11, 17],
     [('Monday','09:00'),('Tuesday','13:00'),('Wednesday','09:00'),('Thursday','15:00'),('Friday','10:00')]),

    ('Taylor Chen',     'taylor@vt.edu',  'Junior',    [3, 4, 5, 13],
     [('Monday','11:00'),('Tuesday','09:00'),('Wednesday','14:00'),('Thursday','09:00'),('Friday','10:00')]),

    ('Morgan Williams', 'morgan@vt.edu',  'Senior',    [6, 7, 9, 13],
     [('Monday','09:00'),('Wednesday','09:00'),('Wednesday','14:00'),('Friday','13:00')]),

    ('Casey Johnson',   'casey@vt.edu',   'Freshman',  [1, 3, 11, 31],
     [('Tuesday','10:00'),('Tuesday','14:00'),('Thursday','10:00'),('Thursday','14:00')]),

    ('Riley Park',      'riley@vt.edu',   'Sophomore', [3, 4, 12, 13],
     [('Monday','09:00'),('Monday','14:00'),('Wednesday','09:00'),('Friday','10:00'),('Friday','13:00')]),

    ('Sam Nguyen',      'sam@vt.edu',     'Junior',    [5, 6, 7, 14],
     [('Tuesday','09:00'),('Tuesday','13:00'),('Thursday','09:00'),('Thursday','13:00')]),
]

for name, email, year, course_ids, avail in students:
    if c.execute('SELECT id FROM users WHERE email=?', (email,)).fetchone():
        continue
    c.execute('INSERT INTO users (name,email,password,year) VALUES (?,?,?,?)',
              (name, email, generate_password_hash('password123'), year))
    uid = c.execute('SELECT id FROM users WHERE email=?', (email,)).fetchone()['id']
    for cid in course_ids:
        c.execute('INSERT INTO user_courses (user_id,course_id) VALUES (?,?)', (uid, cid))
    for day, time in avail:
        c.execute('INSERT INTO availability (user_id,day,time) VALUES (?,?,?)', (uid, day, time))

c.commit(); c.close()
print('Seeded 7 demo students (password: password123)')
print('Emails: alex, jordan, taylor, morgan, casey, riley, sam  @vt.edu')
