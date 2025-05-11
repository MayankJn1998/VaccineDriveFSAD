# app.py
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy import func, and_
import csv
from io import StringIO, TextIOWrapper
from flask_cors import CORS
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

# Models
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
    student_class = db.Column(db.String(50))
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
    applicable_classes = db.Column(db.String(255), nullable=False)
    
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

# Helper functions
def _build_cors_preflight_response():
    response = jsonify({"message": "Preflight accepted"})
    response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
    response.headers.add("Access-Control-Allow-Headers", "*")
    response.headers.add("Access-Control-Allow-Methods", "*")
    return response

AUTHORIZED_TOKEN = "school_admin_token"

def is_authorized(request):
    token = request.headers.get('Authorization')
    return token == AUTHORIZED_TOKEN

def get_dashboard_data_count(school_id):
    try:
        # Total Number of Students in the School
        total_students = Student.query.filter_by(school_id=school_id, is_active=True).count()

        # Number of Vaccinated Students
        vaccinated_students = db.session.query(Student.student_id)\
            .join(Vaccination, Vaccination.student_id == Student.student_id)\
            .filter(Student.school_id == school_id)\
            .distinct()\
            .count()

        # Percentage of Vaccinated Students
        vaccinated_percentage = round((vaccinated_students / total_students) * 100, 2) if total_students else 0

        # Upcoming Vaccination Drives (within the next 30 days)
        today = datetime.now().date()
        future_date = today + relativedelta(days=30)
        upcoming_drives = VaccinationDrive.query.filter(
            VaccinationDrive.school_id == school_id,
            VaccinationDrive.drive_date >= today,
            VaccinationDrive.drive_date <= future_date
        ).all()

        # Convert the drives to a serializable format
        upcoming_drives_data = [
            {
                'drive_id': drive.drive_id,
                'drive_date': drive.drive_date.isoformat(),
                'vaccine_name': drive.vaccine_name,
                'available_doses': drive.available_doses,
                'applicable_classes': drive.applicable_classes
            }
            for drive in upcoming_drives
        ]

        return {
            'total_students': total_students,
            'vaccinated_students': vaccinated_students,
            'vaccinated_percentage': vaccinated_percentage,
            'upcoming_drives': upcoming_drives_data,
        }

    except Exception as e:
        app.logger.error(f"Error in get_dashboard_data: {e}")
        return None

# API Endpoints
@app.route('/login', methods=['POST'])
def login():
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    return jsonify({'token': AUTHORIZED_TOKEN})

@app.route('/schools/<int:school_id>/dashboard', methods=['GET'])
def get_dashboard_data(school_id):
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    if not is_authorized(request):
        return jsonify({'message': 'Unauthorized'}), 401
    
    dashboard_data = get_dashboard_data_count(school_id)
    if dashboard_data:
        return jsonify(dashboard_data), 200
    return jsonify({'error': 'Failed to retrieve dashboard data'}), 500

@app.route('/schools', methods=['GET', 'POST'])
def manage_schools():
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    if not is_authorized(request):
        return jsonify({'message': 'Unauthorized'}), 401
    
    if request.method == 'GET':
        schools = School.query.all()
        return jsonify([{
            'school_id': s.school_id,
            'school_name': s.school_name,
            'classes': s.classes
        } for s in schools])
    
    elif request.method == 'POST':
        data = request.get_json()
        new_school = School(
            school_name=data['school_name'],
            classes=data.get('classes', '')
        )
        db.session.add(new_school)
        db.session.commit()
        return jsonify({
            'school_id': new_school.school_id,
            'school_name': new_school.school_name
        }), 201

@app.route('/schools/<int:school_id>/students', methods=['GET', 'POST'])
def manage_students(school_id):
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    if not is_authorized(request):
        return jsonify({'message': 'Unauthorized'}), 401

    if request.method == 'GET':
        # Get query parameters for filtering
        search = request.args.get('search', '')
        student_class = request.args.get('class', '')
        vaccination_status = request.args.get('vaccination_status', '')
        
        query = Student.query.filter_by(school_id=school_id, is_active=True)
        
        if search:
            query = query.filter(
                (Student.first_name.ilike(f'%{search}%')) |
                (Student.last_name.ilike(f'%{search}%')) |
                (Student.student_id.cast(db.String).ilike(f'%{search}%'))
            )
        
        if student_class:
            query = query.filter_by(student_class=student_class)
        
        students = query.all()
        
        # Process vaccination status filter
        student_list = []
        for student in students:
            student_data = {
                'student_id': student.student_id,
                'first_name': student.first_name,
                'last_name': student.last_name,
                'date_of_birth': student.date_of_birth.isoformat() if student.date_of_birth else None,
                'gender': student.gender,
                'contact_number': student.contact_number,
                'student_class': student.student_class,
                'vaccinations': [{
                    'vaccine_name': v.vaccine_name,
                    'vaccination_date': v.vaccination_date.isoformat(),
                    'drive_id': v.drive_id
                } for v in student.vaccinations]
            }
            
            # Apply vaccination status filter if provided
            if not vaccination_status or \
               (vaccination_status == 'vaccinated' and student.vaccinations) or \
               (vaccination_status == 'not_vaccinated' and not student.vaccinations):
                student_list.append(student_data)
        
        return jsonify(student_list)
    
    elif request.method == 'POST':
        data = request.get_json()
        new_student = Student(
            school_id=school_id,
            first_name=data['first_name'],
            last_name=data['last_name'],
            date_of_birth=datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date() if data.get('date_of_birth') else None,
            gender=data.get('gender'),
            contact_number=data.get('contact_number'),
            student_class=data['student_class']
        )
        db.session.add(new_student)
        db.session.commit()
        return jsonify({
            'student_id': new_student.student_id,
            'first_name': new_student.first_name,
            'last_name': new_student.last_name
        }), 201

@app.route('/schools/<int:school_id>/students/<int:student_id>', methods=['GET', 'PUT', 'DELETE'])
def student_detail(school_id, student_id):
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    if not is_authorized(request):
        return jsonify({'message': 'Unauthorized'}), 401
    
    student = Student.query.filter_by(school_id=school_id, student_id=student_id).first()
    if not student:
        return jsonify({'error': 'Student not found'}), 404
    
    if request.method == 'GET':
        return jsonify({
            'student_id': student.student_id,
            'first_name': student.first_name,
            'last_name': student.last_name,
            'date_of_birth': student.date_of_birth.isoformat() if student.date_of_birth else None,
            'gender': student.gender,
            'contact_number': student.contact_number,
            'student_class': student.student_class,
            'vaccinations': [{
                'vaccination_id': v.vaccination_id,
                'drive_id': v.drive_id,
                'vaccine_name': v.vaccine_name,
                'vaccination_date': v.vaccination_date.isoformat(),
                'vaccinated_status': v.vaccinated_status
            } for v in student.vaccinations]
        })
    
    elif request.method == 'PUT':
        data = request.get_json()
        if 'first_name' in data:
            student.first_name = data['first_name']
        if 'last_name' in data:
            student.last_name = data['last_name']
        if 'date_of_birth' in data:
            student.date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date() if data['date_of_birth'] else None
        if 'gender' in data:
            student.gender = data['gender']
        if 'contact_number' in data:
            student.contact_number = data['contact_number']
        if 'student_class' in data:
            student.student_class = data['student_class']
        
        db.session.commit()
        return jsonify({
            'student_id': student.student_id,
            'first_name': student.first_name,
            'last_name': student.last_name
        })
    
    elif request.method == 'DELETE':
        student.is_active = False
        db.session.commit()
        return jsonify({'message': 'Student deactivated'}), 200

@app.route('/schools/<int:school_id>/students/bulk', methods=['POST'])
def bulk_upload_students(school_id):
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    if not is_authorized(request):
        return jsonify({'message': 'Unauthorized'}), 401
    
    if 'file' not in request.files:
        return jsonify({'message': 'No file part'}), 400
    
    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({'message': 'No file selected'}), 400
    
    try:
        csv_file = TextIOWrapper(file.stream, encoding='utf-8')
        csv_reader = csv.DictReader(csv_file)
        students_added = 0
        
        for row in csv_reader:
            new_student = Student(
                school_id=school_id,
                first_name=row['first_name'],
                last_name=row['last_name'],
                date_of_birth=datetime.strptime(row['date_of_birth'], '%Y-%m-%d').date() if row.get('date_of_birth') else None,
                gender=row.get('gender'),
                contact_number=row.get('contact_number'),
                student_class=row['student_class']
            )
            db.session.add(new_student)
            students_added += 1
        
        db.session.commit()
        return jsonify({
            'message': f'Successfully added {students_added} students',
            'count': students_added
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error processing CSV: {str(e)}'}), 500

@app.route('/schools/<int:school_id>', methods=['GET', 'PUT'])
def single_school(school_id):
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    if not is_authorized(request):
        return jsonify({'message': 'Unauthorized'}), 401

    school = School.query.get_or_404(school_id)

    if request.method == 'GET':
        return jsonify({
            'school_id': school.school_id,
            'school_name': school.school_name,
            'classes': school.classes
        })
    
    elif request.method == 'PUT':
        data = request.get_json()
        if 'school_name' in data:
            school.school_name = data['school_name']
        if 'classes' in data:
            school.classes = data['classes']
        
        db.session.commit()
        return jsonify({
            'school_id': school.school_id,
            'school_name': school.school_name,
            'classes': school.classes
        })
@app.route('/schools/<int:school_id>/drives/<int:drive_id>', methods=['GET', 'PUT', 'DELETE'])
def single_vaccination_drive(school_id, drive_id):
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    if not is_authorized(request):
        return jsonify({'message': 'Unauthorized'}), 401

    drive = VaccinationDrive.query.filter_by(
        school_id=school_id,
        drive_id=drive_id
    ).first_or_404()

    if request.method == 'GET':
        return jsonify({
            'drive_id': drive.drive_id,
            'drive_date': drive.drive_date.isoformat(),
            'vaccine_name': drive.vaccine_name,
            'available_doses': drive.available_doses,
            'applicable_classes': drive.applicable_classes,
            'school_id': drive.school_id
        })
    
    elif request.method == 'PUT':
        data = request.get_json()
        if 'drive_date' in data:
            drive.drive_date = datetime.strptime(data['drive_date'], '%Y-%m-%d').date()
        if 'vaccine_name' in data:
            drive.vaccine_name = data['vaccine_name']
        if 'available_doses' in data:
            drive.available_doses = data['available_doses']
        if 'applicable_classes' in data:
            drive.applicable_classes = data['applicable_classes']
        
        db.session.commit()
        return jsonify({
            'drive_id': drive.drive_id,
            'vaccine_name': drive.vaccine_name,
            'drive_date': drive.drive_date.isoformat()
        })
    
    elif request.method == 'DELETE':
        # Check if there are any vaccinations associated with this drive
        vaccinations = Vaccination.query.filter_by(drive_id=drive_id).count()
        if vaccinations > 0:
            return jsonify({
                'message': 'Cannot delete drive with existing vaccinations',
                'vaccination_count': vaccinations
            }), 400
        
        db.session.delete(drive)
        db.session.commit()
        return jsonify({'message': 'Vaccination drive deleted successfully'}), 200

@app.route('/schools/<int:school_id>/drives', methods=['GET', 'POST'])
def manage_vaccination_drives(school_id):
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    if not is_authorized(request):
        return jsonify({'message': 'Unauthorized'}), 401
    
    if request.method == 'GET':
        drives = VaccinationDrive.query.filter_by(school_id=school_id).all()
        return jsonify([{
            'drive_id': d.drive_id,
            'drive_date': d.drive_date.isoformat(),
            'vaccine_name': d.vaccine_name,
            'available_doses': d.available_doses,
            'applicable_classes': d.applicable_classes,
            'school_id': d.school_id  # Added school_id to response
        } for d in drives])
    
    elif request.method == 'POST':
        data = request.get_json()
        new_drive = VaccinationDrive(
            school_id=school_id,
            drive_date=datetime.strptime(data['drive_date'], '%Y-%m-%d').date(),
            vaccine_name=data['vaccine_name'],
            available_doses=data['available_doses'],
            applicable_classes=data['applicable_classes']
        )
        db.session.add(new_drive)
        db.session.commit()
        return jsonify({
            'drive_id': new_drive.drive_id,
            'vaccine_name': new_drive.vaccine_name,
            'school_id': new_drive.school_id  # Added school_id to response
        }), 201


@app.route('/schools/<int:school_id>/students/<int:student_id>/vaccinate', methods=['POST'])
def mark_vaccinated(school_id, student_id):
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    if not is_authorized(request):
        return jsonify({'message': 'Unauthorized'}), 401
    
    data = request.get_json()
    drive_id = data['drive_id']
    
    # Verify student and drive belong to the same school
    student = Student.query.filter_by(school_id=school_id, student_id=student_id).first()
    drive = VaccinationDrive.query.filter_by(school_id=school_id, drive_id=drive_id).first()
    
    if not student or not drive:
        return jsonify({'message': 'Student or Vaccination Drive not found for this school'}), 404
    
    # Check if student is already vaccinated with this vaccine
    existing = Vaccination.query.filter_by(
        student_id=student_id,
        vaccine_name=drive.vaccine_name
    ).first()
    
    if existing:
        return jsonify({'message': 'Student already vaccinated with this vaccine'}), 400
    
    # Create vaccination record
    vaccination = Vaccination(
        student_id=student_id,
        drive_id=drive_id,
        vaccine_name=drive.vaccine_name,
        vaccinated_status=True
    )
    
    db.session.add(vaccination)
    db.session.commit()
    
    return jsonify({
        'vaccination_id': vaccination.vaccination_id,
        'student_id': vaccination.student_id,
        'vaccine_name': vaccination.vaccine_name
    }), 201

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='localhost', port=5000)