WIP: just a simple way to reserve time on a shared resource. No enforcement on the sharing.

Requirements:
```bash
pip install Flask
pip install Flask-SQLAlchemy
pip install Flask-Migrate
pip install python-dateutil
```


Setting up the database:
```bash
flask db init
flask db migrate -m "Initial migration."
flask db upgrade
```
