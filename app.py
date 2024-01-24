from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_required, logout_user, login_user, current_user
from flask_migrate import Migrate
from dateutil import parser
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.middleware.proxy_fix import ProxyFix
from config import SECRET_KEY

def create_app():
    app = Flask(__name__)

    # Secret key for password hashes
    app.secret_key = SECRET_KEY

    # Database Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///events.db'  # SQLite database
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # or 'Strict' or 'None'

    # TODO: Only use in production on apache server
    # TODO: This is possibly wrong, and the server is likely not completely safe
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

    return app

app = create_app()

# Initialize SQLAlchemy and Migrate
db = SQLAlchemy(app)
migrate = Migrate(app, db)

@app.route('/hello_world')
def hello_world():
    return 'Hello, World!'

@app.route('/')
def index():
    return render_template('index.html')

class DBEvent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    start = db.Column(db.DateTime, nullable=False)
    end = db.Column(db.DateTime, nullable=False)
    description = db.Column(db.Text, nullable=True)
    ownerId = db.Column(db.Integer, nullable=False)

    def __repr__(self):
        return f'<DBEvent {self.title}>'

@app.route('/add_event', methods=['POST'])
@login_required
def add_event():
    data = request.json
    new_start = parser.isoparse(data['start'])
    new_end = parser.isoparse(data['end'])

    # Check for overlap with earlier events
    # This is done server-side in case of concurrent updates
    overlap = DBEvent.query.filter(
        DBEvent.start < new_end, DBEvent.end > new_start
    ).first()

    if overlap:
        return jsonify({'message': 'Event overlaps with an existing event'}), 400

    if current_user.is_authenticated:
        # No overlap, add the event
        new_event = DBEvent(
            title=data['title'],
            start=parser.isoparse(data['start']),
            end=parser.isoparse(data['end']),
            description=data.get('description'),
            ownerId = current_user.id,
        )
        db.session.add(new_event)
        db.session.commit()
        return jsonify({'message': 'Event added successfully', 'owner': current_user.username}), 200
    else:
        return jsonify({'message': 'User is not authenticated on backend side'}), 400

@app.route('/delete_event/<int:event_id>', methods=['DELETE'])
@login_required
def delete_event(event_id):
    # Find the event by ID
    event = DBEvent.query.get(event_id)

    # Check if the event exists
    if event is None:
        return jsonify({'message': 'Event not found'}), 404

    # Check if the current user is the owner of the event
    if event.ownerId != current_user.id:
        return jsonify({'message': 'Unauthorized to delete this event'}), 403

    # Delete the event
    db.session.delete(event)
    db.session.commit()

    return jsonify({'message': 'Event deleted successfully'}), 200

@app.route('/get_events', methods=['GET'])
def get_events():
    events = DBEvent.query.all()
    return jsonify([{
            'id': event.id, 
            'title': event.title,
            'start': event.start.isoformat() + 'Z', 
            'end': event.end.isoformat() + 'Z',
            'description': event.description,
            'owner': load_user(event.ownerId).username,
            'is_owner': current_user.is_authenticated and current_user.id == event.ownerId
        } for event in events])

# User for authentication
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(30), nullable=False)
    password_hash = db.Column(db.String(128))  # Store hashed passwords

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'

# Set up the login manager
login_manager = LoginManager()
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('index'))
        else:
            flash('Invalid username or password')

    return render_template('index.html')

@app.route('/logout', methods=['POST'])
def logout():
    logout_user()  # Flask-Login's logout function
    return redirect(url_for('index'))


if __name__ == '__main__':
    app.run(debug=True)
    

