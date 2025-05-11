from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class School(db.Model):
    __tablename__ = 'schools'
    school_id = db.Column(db.Integer, primary_key=True)
    school_name = db.Column(db.String(255), nullable=False)
    classes = db.Column(db.String(255))  # Comma-separated list of classes like "1,2,3,4,5"

class Student(db.Model):
    __tablename__ = 'students'
    student_id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.school_id'), nullable=False)
    first_name = db.Column(db.String(255), nullable=False)
    last_name = db.Column(db.String(255), nullable=False)
    date_of_birth = db.Column(db.Date)
    gender = db.Column(db.String(50))
    contact_number = db.Column(db.String(50))
    student_class = db.Column(db.String(50))  # Class/grade of the student
    is_active = db.Column(db.Boolean, default=True)
    
    school = db.relationship('School', backref='students')
    vaccinations = db.relationship('Vaccination', backref='student')

class VaccinationDrive(db.Model):
    __tablename__ = 'vaccination_drives'
    drive_id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.school_id'), nullable=False)
    drive_date = db.Column(db.Date, nullable=False)
    vaccine_name = db.Column(db.String(255), nullable=False)
    available_doses = db.Column(db.Integer, nullable=False)
    applicable_classes = db.Column(db.String(255), nullable=False)  # Comma-separated list
    
    school = db.relationship('School', backref='vaccination_drives')

class Vaccination(db.Model):
    __tablename__ = 'vaccinations'
    vaccination_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.student_id'), nullable=False)
    drive_id = db.Column(db.Integer, db.ForeignKey('vaccination_drives.drive_id'), nullable=False)
    vaccine_name = db.Column(db.String(255), nullable=False)
    vaccination_date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    vaccinated_status = db.Column(db.Boolean, default=False)
    notes = db.Column(db.Text)
    
    drive = db.relationship('VaccinationDrive', backref='vaccinations')
    
    __table_args__ = (
        db.UniqueConstraint('student_id', 'vaccine_name', name='unique_student_vaccine'),
    )