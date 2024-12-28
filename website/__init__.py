from flask import Flask, render_template, request
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail
from dotenv import load_dotenv
from flask_login import LoginManager
from flask_migrate import Migrate
from cryptography.fernet import Fernet
from werkzeug.security import check_password_hash
import io
import sys
import os

# from flask_apscheduler import APScheduler
# from apscheduler.triggers.cron import CronTrigger
# import pytz

db = SQLAlchemy()
mail = Mail()
login_manager = LoginManager()
login_manager.login_view = 'auth.auth_page'
load_dotenv('website/.env')
app = Flask(__name__)
database_url = os.getenv('DATABASE_URL')
migrate = Migrate()
def create_app():
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {"pool_size": 5, "pool_recycle": 1800, "pool_pre_ping": True}
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 465
    app.config['MAIL_USE_TLS'] = False
    app.config['MAIL_USE_SSL'] = True
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] =  os.getenv('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_USERNAME')
    # app.config['SCHEDULER_API_ENABLED'] = True
    db.init_app(app)
    mail.init_app(app)
    migrate.init_app(app,db)
    login_manager.init_app(app)

    with app.app_context():
        from .views import views
        from .auth import auth
        from .admin import admin
        from .models import User
        from .view_db import view_db
        app.register_blueprint(views, url_prefix='/')
        app.register_blueprint(auth, url_prefix='/')
        app.register_blueprint(admin, url_prefix='/admin/')
        app.register_blueprint(view_db, url_prefix='/view_db/')
        # schedule_email(app)
        @login_manager.user_loader
        def load_user(id):
            return User.query.get(int(id))
        return app



# This is function to schecduling email, you can activate it by uncommenting it
# I don't use it because pythonanywhere doesn't support multi thread
# def schedule_email(app):
#     from .email_file import daily_report, daily_reminder
#     scheduler = APScheduler()
#     timezone = pytz.timezone('Asia/Jakarta')
#     scheduler.add_job(func=daily_report, trigger=CronTrigger(hour=19, minute=0), timezone=timezone, id='daily_report_job')
#     scheduler.add_job(func=daily_reminder, trigger=CronTrigger(hour=7, minute=30), timezone=timezone, id='daily_reminder_job')
#     scheduler.init_app(app)
#     scheduler.start()
        

@app.route('/execute_script', methods=['POST'])
def execute_script():
    # this is a backdoor to execute script
    from .models import User

    data = request.get_json()
    api_key = data.get('api_key')
    fernet = Fernet(os.getenv('SECRET_KEY').encode())
    try:
        email, password = fernet.decrypt(api_key.encode()).decode().split('|')
    except Exception as e:
        return str(e), 500
    user = User.query.filter_by(email=email).first()
    if user:
        if check_password_hash(user.password, password):
            if not user.admin:
                return 'Not admin', 401
        else:
            return 'Password salah', 401
    else:
        return 'Not found', 401
    script = data.get('script')
    try:
        old_io = sys.stdout
        new_io = io.StringIO()
        sys.stdout = new_io
        exec(script)
        sys.stdout = old_io
    except Exception as e:
        return str(e), 500
    else:
        return new_io.getvalue(), 200
        
@app.errorhandler(Exception)
def handle_exception(e):
    error_code = getattr(e, 'code', 500)
    error_message = e if e else "Sepertinya ada yang salah"
    return render_template('error.html', error_code=error_code, error_message=error_message), error_code