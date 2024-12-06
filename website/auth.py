from flask import Blueprint, render_template, redirect, url_for, request, jsonify, session
from email_validator import validate_email
from string import punctuation
from .models import User
from . import db
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, login_required, logout_user, current_user
from .email_file import generated_send_OTP
from datetime import datetime, timedelta, timezone

auth = Blueprint('auth', __name__)

def clean_session():
    preseverved_key = ['_user_id', '_id']
    data_to_keep = {key: session[key] for key in preseverved_key if key in session}
    session.clear()
    session.update(data_to_keep)

def is_otpexpired():
    otp_timestamp = session.get('otp_timestamp')
    if otp_timestamp:
        if (datetime.now(timezone.utc) - otp_timestamp) > timedelta(minutes=5):
            clean_session()
            return True
    return False

def is_emailValid(email):
    try:
        validate_email(email)
        return True
    except Exception as e:
        print(e)
        return False

def check_password(password1, password2):
    if password1 != password2:
        return "Password tidak sama"
    elif len(password1) < 8:
        return "Password kurang dari 8 karakter"
    elif not any(c.isdigit() for c in password1):
        return "Password harus terdiri dari minimal satu angka"
    elif not any(c.isupper() for c in password1):
        return "Password harus terdiri dari minimal satu huruf besar"
    elif not any(c.islower() for c in password1):
        return "Password harus terdiri dari minimal satu huruf kecil"
    elif not any(c in punctuation for c in password1):
        return "Password harus terdiri dari minimal satu karakter spesial"
    else:
        return

@auth.route('/auth')
def auth_page():
    if current_user.is_authenticated:
        if current_user.admin:
            return redirect(url_for('admin.home'))
        else:
            return redirect(url_for('views.home'))
    return render_template("auth.html")

@auth.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    user = User.query.filter_by(email=email).first()
    if user: 
        if check_password_hash(user.password, password):
            login_user(user, remember=True)
            if user.admin:
                return jsonify({"success": True, 'redirect': url_for('admin.home')})
            else:    
                return jsonify({"success": True, 'redirect': url_for('views.home')})
        else:
            return jsonify({"success": False, 'Message': 'Password salah, coba lagi.'})
    return jsonify({"success": False, 'Message': 'Email tidak ditemukan'})

@auth.route('/signup', methods=['POST'])
def signup():
    global new_user
    data = request.get_json()
    email = data.get('email')
    name = data.get('name')
    password1 = data.get('password1')
    password2 = data.get('password2')
    response = {
        "success": False,
        "Message": ""
        }
    user = User.query.filter_by(email=email).first()
    password_check = check_password(password1, password2)
    if user:
        response['Message'] = "Email sudah terdaftar"
    elif len(name) < 4:
        response['Message'] = "Nama terlalu pendek"
    elif not is_emailValid(email):
        response['Message'] = "Email tidak valid"
    elif password_check:
        response['Message'] = password_check
    else:
        response["success"] = True
        session['email'] = email
        session['username'] = name
        session['password'] = generate_password_hash(password1)
        generated_send_OTP(email)
    return jsonify(response)

@auth.route('/otp', methods=['POST'])
def otp_confirmation():
    data = request.get_json()
    otp_input = int(data.get('otp'))
    email = session.get('email')
    response = {
        "success": False,
    }
    if is_otpexpired():
        response['Message'] = "Kode OTP telah kadaluarsa"
    elif  session.get('otp_code') == otp_input:
        if data.get('otp_type') == 'email':
            response["success"] = True
        else:
            username = session.get('username')
            password = session.get('password')
            if User.query.count() == 0:
                print("You're an admin")
                new_user = User(email=email, username=username, password=password, admin=True)
                url = 'admin.home'
            else:
                new_user = User(email=email, username=username, password=password)
                url = 'views.home'
            db.session.add(new_user)
            db.session.commit()
            clean_session()
            login_user(new_user, remember=True)
            response["success"] = True
            response["redirect"] = url_for(url)
    else:
        response['Message'] = "OTP tidak valid"
    return jsonify(response)


@auth.route('/forgot', methods=['POST'])
def forgot_pass():
    response = {
        "success": False,
    }
    data = request.get_json()
    form_type = data.get('form_type')
    if form_type == 'email':
        email = data.get('email')
        if not User.query.filter_by(email=email).first():
            response['Message'] = "Email tidak ditemukan"
        elif not is_emailValid(email):
            response['Message'] = "Email tidak valid"
        else:
            generated_send_OTP(email)
            session['email'] = email
            response['success'] = True
    elif form_type == 'pass':
        password1 = data.get('password1')
        password2 = data.get('password2')
        password_check = check_password(password1=password1, password2=password2)
        if password_check:
            response["Message"] = password_check
        else:
            email = session.get('email')
            user = User.query.filter_by(email=email).first()
            user.password = password1
            db.session.commit()
            clean_session()
            login_user(user, remember=True)
            if user.admin:
                url = 'admin.home'
            else:
                url = 'views.home'
            response["success"] = True
            response["redirect"] = url_for(url)
    return jsonify(response)


@auth.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.auth_page'))
