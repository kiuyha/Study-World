from flask import Blueprint, render_template, redirect, request, url_for, jsonify, session
from urllib.parse import quote
from .models import get_content,TrackViewPoints, TrackFinishPoints, point_information, change_profile, change_emailOrPassword, change_notif_settings, delete_account, User, all_notif
import os
from flask_login import login_required, current_user
from . import app
from .auth import check_password, is_emailValid, clean_session, is_otpexpired
from .email_file import generated_send_OTP
from werkzeug.security import generate_password_hash


views = Blueprint('views', __name__)
courses_dir = os.path.join(os.getcwd(), "website/templates/courses")

@views.route('/courses/<class_name>')
@login_required
def courses(class_name):
    try:
        all_courses = get_content()
        if class_name in all_courses:
            courses_data = all_courses[class_name]
            return render_template('user/courses.html', class_name=class_name,
                                courses=courses_data, 
                                classes=all_courses.keys(),
                                notifications=all_notif(),
                                current_url=quote(request.path),
                                user= current_user)
        else:
            return redirect(url_for(views.handle_exception))
    except Exception as e:
        return redirect(url_for(app.handle_exception, e=e))
    
# Route for rendering specific course files
@views.route('/courses/<class_name>/<course>/<course_file>', methods=['GET', 'POST'])
@login_required
def course_file_route(class_name, course, course_file):
    if request.method == 'POST':
        data = request.get_json()
        if data.get("type") == "view-point":
            TrackViewPoints(course_file)
        elif data.get("type") == "finish-point":
            TrackFinishPoints(course_file)
    course_file_path = os.path.join(courses_dir, class_name, course, f"{course_file}.html")
    if os.path.exists(course_file_path):
        with open(course_file_path, 'r', encoding='utf-8') as file:
            html_content = file.read()
        return render_template("template_module.html", content=html_content, all_courses=get_content(), user=current_user, notifications=all_notif(), module_name=course_file)
    else:
        return redirect(url_for('handle_exception', e='file not found'))

@views.route('/home')
@login_required
def home():
    try:
        all_courses = get_content()
        example = [
            {"name": "Kimia", "class": "Kelas XII MIPA", "image": "Kimia.webp"},
            {"name": "Biologi", "class": "Kelas XI MIPA", "image": "Biologi.webp"},
            {"name": "Matematika", "class": "Kelas XI MIPA", "image": "Matematika.webp"},
            {"name": "Fisika", "class": "Kelas X MIPA", "image": "Fisika.webp"},
            {"name": "Python", "class": "Untuk semua", "image": "Python.webp"},
        ]
        return render_template('user/home.html', classes=all_courses.keys(), courses=example, notifications=all_notif(), user= current_user, current_url=request.path)
    except Exception as e:
        return redirect(url_for('handle_exception', e=e))

@views.route('/profile', methods=['GET','POST'])
@login_required
def profile():
    all_courses = get_content()
    user_point, rank_data, chart_data = point_information(range_date='all')
    if request.method == 'POST':
        return jsonify(chart_data)
    return render_template('user/profile.html',
                           user= current_user,
                           current_url=request.path,
                           classes=all_courses.keys(),
                           user_point=user_point,
                           notifications=all_notif(),
                           users_points= rank_data)

@views.route('/settings', methods=['GET', 'POST'])
@login_required
def settings():
    all_courses = get_content()
    if request.method == 'POST':
        data = request.get_json()
        type_data = data.get('type')
        response = {
        "success": False,
        "Message": ""
        }
        if type_data == 'data-profile':
            img_data = data.get('photo-pic')
            if img_data == url_for('static', filename=current_user.photo, _external=True):
                img_data = None
            response["Message"], response["success"] = change_profile(src_img=img_data, username=data.get('username'), school=data.get('school'))

        elif type_data == 'notification':
            type_notif = data.get('notif')
            response["Message"], response["success"] = change_notif_settings(type_notif=type_notif, values=data.get(type_notif))

        elif type_data == 'update-email':
            old_email = data.get('old-email')
            new_email = data.get('new-email')
            if old_email != current_user.email:
                response["Message"] = "Email lama tidak sesuai"
            elif not is_emailValid(new_email):
                response["Message"] = "Email tidak valid"
            elif User.query.filter_by(email=new_email).first():
                response["Message"] = "Email sudah terdaftar"
            else:
                response["success"] = True
                session['new_email'] = new_email
                response["Message"] = ("otp-needed", 'email')

        elif type_data == 'update-password':
            old_password = data.get('old-password')
            new_password = data.get('new-password')
            confirm_password = data['confirm-password']
            password_check = check_password(new_password, confirm_password)
            if old_password == new_password:
                response["Message"] = "Password baru tidak boleh sama dengan password lama"
            elif password_check:
                response["Message"] = password_check
            else:
                response["success"] = True
                session['new_password'] = generate_password_hash(new_password)
                response["Message"] = ("otp-needed", 'password')

        elif type_data == 'otp-requested':
            generated_send_OTP(current_user.email)
            response["success"] = True
            response["Message"] = ("otp-sended", data.get('otp_type'))

        elif type_data == 'otp-confirmation':
            otp_input = int(data.get('otp'))
            type_otp = data.get('type-otp')
            if is_otpexpired():
                response["Message"] = "Kode OTP telah kadaluarsa"
            if session['otp_code'] == otp_input:
                if type_otp == 'email':
                    change_value = session.get('new_email')
                elif type_otp == 'password':
                    change_value = session.get('new_password')
                Message, response["success"] = change_emailOrPassword(type_change=type_otp, value=change_value)
                clean_session() 
                response["Message"] = ('otp-confirmed', Message)
            else:
                response["Message"] = "OTP tidak sesuai"
        
        elif type_data == 'delete-account':
            delete_account()
            response["success"] = True
            response["redirect"] = url_for('auth.logout')
        return jsonify(response)
    return render_template('user/settings.html',
                           notifications=all_notif(),
                           classes=all_courses.keys(),
                           user= current_user,
                           current_url=request.path)