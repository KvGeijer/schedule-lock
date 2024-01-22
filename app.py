from flask import Flask, render_template, request, jsonify
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from dateutil import parser

app = Flask(__name__)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///events.db'  # SQLite database
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

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

    def __repr__(self):
        return f'<DBEvent {self.title}>'

@app.route('/add_event', methods=['POST'])
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

    # No overlap, add the event
    new_event = DBEvent(
        title=data['title'],
        start=parser.isoparse(data['start']),
        end=parser.isoparse(data['end'])
    )
    db.session.add(new_event)
    db.session.commit()
    return jsonify({'message': 'Event added successfully'}), 200

@app.route('/get_events', methods=['GET'])
def get_events():
    events = DBEvent.query.all()
    return jsonify([{'id': event.id, 'title': event.title, 'start': event.start.isoformat() + 'Z', 'end': event.end.isoformat() + 'Z'} for event in events])

if __name__ == '__main__':
    app.run(debug=True)
    

