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


# Setting up an apache server for https

Installing apache (with apt)

```sh
sudo apt install apache2
```

Get an SSL certificate with Let't encrypt! You should use certbot to automate the process as they otherwise only last for 90 days. Go here for installation instructions: https://certbot.eff.org/instructions

Creat a VirtualHost directive. store it in /etc/apache2/sites-available/yourdomain.conf
```
<VirtualHost *:443>
    ServerName <yourdomain>
    DocumentRoot </path/to/your/app>

    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/privkey.pem
    SSLCertificateChainFile /path/to/chain.pem

    # Proxy to your Flask app
    ProxyPass / http://127.0.0.1:5000/
    ProxyPassReverse / http://127.0.0.1:5000/
</VirtualHost>

```

Enable SSL and proxy modules
```sh
sudo a2enmod ssl
sudo a2enmod proxy
sudo a2enmod proxy_http
```

Restart Apache for the configs to take effect
```sh
sudo systemctl restart apache2
```

