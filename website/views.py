from flask import Blueprint, render_template, redirect, request, url_for, jsonify, session
from urllib.parse import quote
from .models import get_content,TrackViewPoints, TrackExercisePoints, point_information, change_profile, change_emailOrPassword, change_notif_settings, delete_account, User, all_notif, searching, read_notif, get_comments, post_comment
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
                                current_url=quote(request.path),
                                user= current_user,
                                have_notif=read_notif())
        else:
            raise "class not found"
    except Exception as e:
        raise e

# Route for rendering specific course files
@views.route('/courses/<class_name>/<course>/<module>', methods=['GET', 'POST'])
@login_required
def module_route(class_name, course, module):
    if request.method == 'POST':
        data = request.get_json()
        if data.get("is_view"):
            success, message = TrackViewPoints(module)
            solution = None
        else:
            user_answer = data.get("answer")
            success, message, solution = TrackExercisePoints(module, user_answer)
        return jsonify({"success": success, "Message": message, "solution": solution})
    module_path = os.path.join(courses_dir, class_name, course, f"{module}.html")
    if os.path.exists(module_path):
        with open(module_path, 'r', encoding='utf-8') as file:
            html_content = file.read()
        courses = get_content()
        list_modules = courses[class_name][course]
        current_module = next((index for index, item in enumerate(list_modules) if item[0] == module), None)
        next_module = list_modules[current_module + 1][0] if current_module + 1 < len(list_modules) else None
        prev_module = list_modules[current_module - 1][0] if current_module - 1 >= 0 else None
        return render_template("template_module.html",
                               content=html_content,
                               all_courses=courses,
                               user=current_user,
                               module_name=module,
                               module_info = [class_name, course, prev_module, next_module],
                               latest_content= get_content(is_latest=True),
                               most_viewed_content= get_content(most_viewed=True),
                               have_notif=read_notif())
    else:
        raise "module not found"

@views.route('/home')
@login_required
def home():
    try:
        all_courses = get_content()
        return render_template('user/home.html',
                               classes=all_courses.keys(),
                               latest_content=get_content(is_latest=True),
                               most_viewed_content=get_content(most_viewed=True),
                               user= current_user,
                               current_url=request.path,
                               have_notif=read_notif())
    except Exception as e:
        raise e

@views.route('/profile', methods=['GET','POST'])
@login_required
def profile():
    all_courses = get_content()
    user_point, rank_data, chart_data = point_information(range_date=14)
    if request.method == 'POST':
        return jsonify(user_point, rank_data,chart_data)
    return render_template('user/profile.html',
                           user= current_user,
                           current_url=request.path,
                           classes=all_courses.keys(),
                           user_point=user_point,
                           users_points= rank_data,
                           have_notif=read_notif())

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
                           classes=all_courses.keys(),
                           user= current_user,
                           current_url=request.path,
                           have_notif=read_notif())


@views.route('/search_module/<module_name>', methods=['GET', 'POST'])
@login_required
def search_module(module_name):
    return jsonify(searching(keywords=module_name, type_search='module'))

@views.route('notifications', methods=['GET', 'POST'])
@login_required
def notifications():
    if request.method == 'POST':
        try:
            data = request.get_json()
            read_notif(data.get('id'))
            return '', 200
        except Exception as e:
            return str(e), 500 
    return jsonify(all_notif())

@views.route('comments/<module_name>', methods=['GET', 'POST'])
@login_required
def comment(module_name):
    if request.method == 'POST':
        data = request.get_json()
        comment = data.get('comment')
        parent_id = data.get('parent_id')
        try:
            post_comment(module_name=module_name, comment=comment, parent_id=parent_id)
            return jsonify({'success': True, 'Message': 'Komentarmu berhasil di post'})
        except Exception as e:
            return jsonify({'success': False, 'Message': f"Error: {str(e)}"})
    page= request.args.get('page', 1, type=int)
    parent_id= request.args.get('parent_id',None, type=int)
    return jsonify(get_comments(module_name=module_name, parent_id= parent_id, page_id=page))