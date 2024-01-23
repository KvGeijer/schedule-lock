import argparse
from app import db, app
from app import User

# Set up argparse to handle command-line arguments
parser = argparse.ArgumentParser(description='Add a new user to the database.')
parser.add_argument('username', help='Username for the new user')
parser.add_argument('password', help='Password for the new user')
args = parser.parse_args()

# Use the provided arguments
username = args.username
password = args.password

with app.app_context():
    new_user = User(username=username)
    new_user.set_password(password)  # Hash the password
    db.session.add(new_user)
    db.session.commit()

    print(f"User '{username}' added successfully.")

