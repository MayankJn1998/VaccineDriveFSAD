# models.py
from flask_sqlalchemy import SQLAlchemy
from app import db

class School(db.Model):
    __tablename__ = 'schools'
    school_id = db.Column(db.Integer, primary_key=True)
    school_name = db.Column(db.String(255), nullable=False)
    # ...

class Student(db.Model):
    __tablename__ = 'students'
    student_id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.school_id'), nullable=False)
    first_name = db.Column(db.String(255), nullable=False)
    last_name = db.Column(db.String(255), nullable=False)
    # ...

class VaccinationDrive(db.Model):
    __tablename__ = 'vaccination_drives'
    drive_id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.school_id'), nullable=False)
    drive_date = db.Column(db.Date, nullable=False)
    vaccine_name = db.Column(db.String(255), nullable=False)
    available_doses = db.Column(db.Integer, nullable=False)
    applicable_classes = db.Column(db.String(255), nullable=False)

class Vaccinations(db.Model):
    __tablename__ = 'vaccinations'
    vaccination_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.student_id'), nullable=False)
    drive_id = db.Column(db.Integer, db.ForeignKey('vaccination_drives.drive_id'), nullable=False)
    vaccine_name = db.Column(db.String(255), nullable=False)
    vaccination_date = db.Column(db.Date, nullable=False)
    vaccinated_status = db.Column(db.Boolean, default=False)
# ...