import pytest, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'code', 'app'))
import app as flask_app

flask_app.DB = os.path.join(os.path.dirname(__file__), 'test.db')

@pytest.fixture(autouse=True)
def fresh_db():
    if os.path.exists(flask_app.DB): os.remove(flask_app.DB)
    flask_app.init_db()
    yield
    if os.path.exists(flask_app.DB): os.remove(flask_app.DB)

@pytest.fixture
def client():
    flask_app.app.config['TESTING'] = True
    return flask_app.app.test_client()

def reg(client, name='Alice', email='alice@vt.edu', pw='pass'):
    return client.post('/register', data={'name': name, 'email': email, 'password': pw}, follow_redirects=False)

def login(client, email='alice@vt.edu', pw='pass'):
    return client.post('/login', data={'email': email, 'password': pw}, follow_redirects=False)

def test_register(client):
    r = reg(client)
    assert r.status_code == 302 and '/dashboard' in r.headers['Location']

def test_duplicate_email(client):
    reg(client); r = reg(client)
    assert b'already' in r.data

def test_login_correct(client):
    reg(client); r = login(client)
    assert r.status_code == 302

def test_login_wrong_password(client):
    reg(client)
    r = client.post('/login', data={'email': 'alice@vt.edu', 'password': 'wrong'})
    assert b'Invalid' in r.data

def test_dashboard_requires_login(client):
    assert client.get('/dashboard', follow_redirects=False).status_code == 302

def test_matches_no_courses(client):
    reg(client); login(client)
    r = client.get('/matches')
    assert r.status_code == 200 and b'courses' in r.data.lower()

def test_send_request(client):
    # register two users and have one send a request to the other
    reg(client, 'Alice', 'alice@vt.edu', 'pass')
    reg(client, 'Bob', 'bob@vt.edu', 'pass')
    login(client, 'alice@vt.edu', 'pass')
    r = client.post('/request/2', follow_redirects=False)
    assert r.status_code == 302

def test_requests_page_loads(client):
    reg(client); login(client)
    r = client.get('/requests')
    assert r.status_code == 200
