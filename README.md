WIP: just a simple way to reserve time on a shared resource. No enforcement on the sharing.

Requirements:
```bash
pip install Flask Flask-SQLAlchemy Flask-Migrate Flask-Login python-dateutil
```


Setting up the database:
```bash
flask db init
flask db migrate -m "Initial migration."
flask db upgrade
```

generating a secret key for password encryption:
```sh
python -c 'import secrets; print(secrets.token_hex())'
```
Then create a python file `config.py` with

```python
SECRET_KEY=<your secret key>
```

# Setting it up as a server

The easiest way I found was hosting the server locally with [Waitress](https://flask.palletsprojects.com/en/2.3.x/deploying/waitress/) and then setting up a reverse-proxy with [Caddy](https://caddyserver.com/docs/quick-starts/reverse-proxy) to expose it as a https-server to the internet. For example, this could be a caddyfile:
```
https://www.dcs-servers.tech http://www.dcs-servers.tech http://dcs-servers.tech {
    redir https://dcs-servers.tech{uri}
}

https://dcs-servers.tech {
    reverse_proxy localhost:8080
} 
```
as Waitress by default hosts on localhost:8080.
