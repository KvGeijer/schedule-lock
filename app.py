from flask import Flask, render_template

app = Flask(__name__)

@app.route('/hello_world')
def hello_world():
    return 'Hello, World!'

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
