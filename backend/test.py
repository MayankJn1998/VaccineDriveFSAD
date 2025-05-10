from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text

app = Flask(__name__)



app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:root123@localhost/school_vaccination_db'
app.config['SECRET_KEY'] = 'key123'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

def test_connection():
    try:
        # Test raw SQL execution
        with app.app_context():
            with db.engine.connect() as connection:
                result = connection.execute(text("SELECT 1"))
                print("✅ Connection successful! Result:", result.scalar())
    except Exception as e:
        print("❌ Connection failed:", e)

if __name__ == '__main__':
    test_connection()