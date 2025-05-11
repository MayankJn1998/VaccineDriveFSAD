# app.py
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy import func
import csv
from io import StringIO
from flask_cors import CORS
import timedelta
from datetime import datetime, timezone
from datetime import datetime
from dateutil.relativedelta import relativedelta

app = Flask(__name__)
app.config.from_object('config')  # Load configuration
db = SQLAlchemy(app)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

#from models import School, Student, VaccinationDrive, Vaccinations # Import your models

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

def _build_cors_preflight_response():
    response = jsonify({"message": "Preflight accepted"})
    response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
    response.headers.add("Access-Control-Allow-Headers", "*")
    response.headers.add("Access-Control-Allow-Methods", "*")
    return response

def get_dashboard_data_count(school_id):

    try:
        with app.app_context():  # Ensure we have an application context
            # 1. Total Number of Students in the School
            total_students = Student.query.filter(Student.school_id == school_id).count()

            # 2. Number of Vaccinated Students
            vaccinated_students = db.session.query(Vaccinations.student_id.distinct().label('student_id'))\
                .join(Student, Student.school_id == Vaccinations.student_id)\
                .filter(Student.school_id == school_id)\
                .count()
            
            """vaccinated_students = db.session.query(Vaccinations.vaccinated_status == 1)\
                .filter(Student.school_id == school_id)\
                .count()"""

            # 3. Percentage of Vaccinated Students
            vaccinated_percentage = (vaccinated_students / total_students) * 100 if total_students else 0
            print(vaccinated_percentage)

            # 4. Upcoming Vaccination Drives (within the next 30 days)
            #today = datetime.utcnow().date()
            #today = datetime.now(timezone.utc).date()
            #future_date = today + timedelta(days=30)
            today = datetime.now().date()
            future_date = today + relativedelta(days=30)
            upcoming_drives = VaccinationDrive.query.filter(
                VaccinationDrive.school_id == school_id,
                VaccinationDrive.drive_date >= today,
                VaccinationDrive.drive_date <= future_date
            ).all()  # Fetch all upcoming drives

            print(today)
            print(future_date)
            print(upcoming_drives)

            # Convert the drives to a serializable format (list of dictionaries)
            upcoming_drives_data = [
                {
                    'drive_id': drive.drive_id,
                    'drive_date': drive.drive_date,
                    'vaccine_name': drive.vaccine_name
                    # Add other drive details as needed
                }
                for drive in upcoming_drives
            ]

            # Construct the result dictionary
            dashboard_data = {
                'total_students': total_students,
                'vaccinated_students': vaccinated_students,
                'vaccinated_percentage': vaccinated_percentage,
                'upcoming_drives': upcoming_drives_data,
            }
            return dashboard_data

    except Exception as e:
        print(f"Error in get_dashboard_data: {e}")  # Log the error
        return None

# ...
# Simplified "authentication"
# Simplified "authentication"
AUTHORIZED_TOKEN = "school_admin_token"

def is_authorized(request):
    token = request.headers.get('Authorization')
    return token == AUTHORIZED_TOKEN



@app.route('/login', methods=['POST'])
def login():
    # ...
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    else:
        return jsonify({'token': AUTHORIZED_TOKEN})

@app.route('/schools/<int:school_id>/dashboard', methods=['GET'])
def get_dashboard_data(school_id):
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    elif request.method == 'GET':
        if not is_authorized(request):
            return jsonify({'message': 'Unauthorized'}), 401
        else:
        
            dashboard_data = get_dashboard_data_count(school_id)
            if dashboard_data:
                return jsonify(dashboard_data), 200
            else:
                return jsonify({'error': 'Failed to retrieve dashboard data'}), 500
            return dashboard_data
            #return  jsonify({'message': 'Okay'}), 200           
            
    # ... (as in the previous detailed response)

@app.route('/schools', methods=['GET', 'POST'])
def manage_schools():
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    if not is_authorized(request):
        return jsonify({'message': 'Unauthorized'}), 401
    if request.method == 'GET':
        schools = School.query.all()
        school_list = [{'school_id': school.school_id, 'school_name': school.school_name} for school in schools]
        return jsonify(school_list)
    elif request.method == 'POST':
        data = request.get_json()
        new_school = School(school_name=data['school_name'])
        db.session.add(new_school)
        db.session.commit()
        return jsonify({'message': 'School added'}), 201

@app.route('/schools/<int:school_id>/students', methods=['GET', 'POST'])
def manage_students(school_id):
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    if not is_authorized(request):
        return jsonify({'message': 'Unauthorized'}), 401

    if request.method == 'GET':
        students = Student.query.filter_by(school_id=school_id).all()
        student_list = [{'student_id': s.student_id, 'first_name': s.first_name, 'last_name': s.last_name} for s in students]
        return jsonify(student_list)
    elif request.method == 'POST':
        data = request.get_json()
        new_student = Student(school_id=school_id, first_name=data['first_name'], last_name=data['last_name'])#, date_of_birth=datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date(), gender=data['gender'], contact_number=data['contact_number'])
        db.session.add(new_student)
        db.session.commit()
        return jsonify({'message': 'Student added'}), 201
    """elif request.method == 'PUT':
        student = Student.query.filter(Student.school_id == school_id, Student.id == student_id).first()
        if student:
            data = request.get_json()
            # Update student attributes based on the data received.  Include validation.
            if 'first_name' in data:
                student.first_name = data['first_name']
            if 'last_name' in data:
                student.last_name = data['last_name']
            if 'date_of_birth' in data:
                student.date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date() #handle the date format
            if 'gender' in data:
                student.gender = data['gender']
            if 'contact_number' in data:
                student.contact_number = data['contact_number']
            # ... update other fields as necessary

            db.session.commit()
            return jsonify({
                'id': student.id,
                'first_name': student.first_name,
                'last_name': student.last_name,
                'date_of_birth': student.date_of_birth.isoformat(),
                'gender': student.gender,
                'contact_number': student.contact_number
            })  # Return the updated student data
        else:
            return jsonify({'error': 'Student not found'}), 404"""
    
@app.route('/schools/<int:school_id>/students/<int:student_id>', methods=['PUT','GET'])
def update_student(school_id, student_id):
    try:
        student = Student.query.filter(Student.school_id == school_id, Student.student_id == student_id).first()
        print(student)
        if request.method == 'OPTIONS':
            return _build_cors_preflight_response()
        elif request.method == 'GET':
            return jsonify({
                'id': student.student_id,
                'first_name': student.first_name,
                'last_name': student.last_name,
                #'date_of_birth': student.date_of_birth.isoformat(),
                #'gender': student.gender,
                #'contact_number': student.contact_number
            })
        elif request.method == 'PUT':
            if student:
                data = request.get_json()
                # Update student attributes based on the data received.  Include validation.
                if 'first_name' in data:
                    student.first_name = data['first_name']
                if 'last_name' in data:
                    student.last_name = data['last_name']
                if 'date_of_birth' in data:
                    student.date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date() #handle the date format
                if 'gender' in data:
                    student.gender = data['gender']
                if 'contact_number' in data:
                    student.contact_number = data['contact_number']
                # ... update other fields as necessary

                db.session.commit()
                return jsonify({
                    'id': student.student_id,
                    'first_name': student.first_name,
                    'last_name': student.last_name,
                    'date_of_birth': student.date_of_birth.isoformat(),
                    'gender': student.gender,
                    'contact_number': student.contact_number
                })  # Return the updated student data
            else:
                return jsonify({'error': 'Student not found'}), 404
    except Exception as e:
        db.session.rollback()
        print(f"Error updating student: {e}")
        return jsonify({'error': 'Failed to update student'}), 500

@app.route('/schools/<int:school_id>/students/bulk', methods=['POST'])
def bulk_upload_students(school_id):
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    if not is_authorized(request):
        return jsonify({'message': 'Unauthorized'}), 401

    if 'file' not in request.files:
        return jsonify({'message': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No file selected'}), 400

    if file:
        try:
            csv_file = StringIO(file.stream.read().decode("UTF8"), newline=None)
            csv_reader = csv.reader(csv_file)
            header = next(csv_reader)  # Skip header row
            students_added = []
            for row in csv_reader:
                # Assuming CSV columns are in the order: first_name, last_name, date_of_birth, gender, contact_number
                new_student = Student(
                    school_id=school_id,
                    first_name=row[0],
                    last_name=row[1],
                    date_of_birth=datetime.strptime(row[2], '%Y-%m-%d').date(),
                    gender=row[3],
                    contact_number=row[4]
                )
                db.session.add(new_student)
                students_added.append(new_student.first_name) #Minimal
            db.session.commit()
            return jsonify({'message': 'Students added successfully', 'students': students_added}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': f'Error processing CSV: {str(e)}'}), 500

@app.route('/schools/<int:school_id>/vaccination_drives', methods=['GET', 'POST'])
def manage_vaccination_drives(school_id):
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    if not is_authorized(request):
        return jsonify({'message': 'Unauthorized'}), 401

    if request.method == 'GET':
        drives = VaccinationDrive.query.filter_by(school_id=school_id).all()
        drive_list = [{'drive_id': drive.drive_id, 'drive_date': drive.drive_date, 'vaccine_name': drive.vaccine_name, 'available_doses': drive.available_doses, 'applicable_classes': drive.applicable_classes} for drive in drives]
        return jsonify(drive_list)
    elif request.method == 'POST':
        data = request.get_json()
        new_drive = VaccinationDrive(school_id=school_id, drive_date=datetime.strptime(data['drive_date'], '%Y-%m-%d').date(), vaccine_name=data['vaccine_name'], available_doses=data['available_doses'], applicable_classes=data['applicable_classes'])
        db.session.add(new_drive)
        db.session.commit()
        return jsonify({'message': 'Vaccination drive added'}), 201

@app.route('/schools/<int:school_id>/vaccinations', methods=['GET', 'POST'])
def manage_vaccinations(school_id):
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    if not is_authorized(request):
        return jsonify({'message': 'Unauthorized'}), 401

    if request.method == 'GET':
        vaccinations = Vaccinations.query.join(Student).filter(Student.school_id == school_id).all()
        vaccination_list = [{'vaccination_id': v.vaccination_id, 'student_id': v.student_id, 'drive_id': v.drive_id, 'vaccine_name': v.vaccine_name, 'vaccination_date': v.vaccination_date, 'vaccinated_status': v.vaccinated_status} for v in vaccinations]
        return jsonify(vaccination_list)
    elif request.method == 'POST':
        data = request.get_json()
        student_id = data['student_id']
        drive_id = data['drive_id']
        vaccine_name = data['vaccine_name']
        vaccination_date = datetime.strptime(data['vaccination_date'], '%Y-%m-%d').date()
        vaccinated_status = data.get('vaccinated_status', False) # Default to False if not provided

        # Check if the student and drive belong to the same school (optional, but recommended)
        student = Student.query.filter_by(student_id=student_id, school_id=school_id).first()
        drive = VaccinationDrive.query.filter_by(drive_id=drive_id, school_id=school_id).first()

        if not student or not drive:
            return jsonify({'message': 'Student or Vaccination Drive not found for this school'}), 400

        # Check for duplicate vaccination records
        existing_vaccination = Vaccinations.query.filter_by(student_id=student_id, drive_id=drive_id, vaccine_name=vaccine_name).first()
        if existing_vaccination:
            return jsonify({'message': 'Vaccination record already exists for this student, drive, and vaccine'}), 400

        new_vaccination = Vaccinations(
            student_id=student_id,
            drive_id=drive_id,
            vaccine_name=vaccine_name,
            vaccination_date=vaccination_date,
            vaccinated_status=vaccinated_status
        )
        db.session.add(new_vaccination)
        db.session.commit()
        return jsonify({'message': 'Vaccination record added'}), 201

# ... (Implement other API endpoints)

if __name__ == '__main__':
    with app.app_context(): #push context
        db.create_all()  # Create tables if they don't exist
    app.run(debug=True,host='localhost',port=5000)

