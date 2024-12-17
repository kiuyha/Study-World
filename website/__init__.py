from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail
from dotenv import load_dotenv
from flask_login import LoginManager
# from flask_apscheduler import APScheduler
# from apscheduler.triggers.cron import CronTrigger
# import pytz
import os 

db = SQLAlchemy()
mail = Mail()
login_manager = LoginManager()
login_manager.login_view = 'auth.auth_page'
load_dotenv('website/.env')
app = Flask(__name__)
database_url = os.getenv('DATABASE_URL')
def create_app():
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 465
    app.config['MAIL_USE_TLS'] = False
    app.config['MAIL_USE_SSL'] = True
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] =  os.getenv('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_USERNAME')
    # app.config['SCHEDULER_API_ENABLED'] = True

    from .views import views
    from .auth import auth
    from .admin import admin
    from .models import User
    db.init_app(app)
    mail.init_app(app)
    login_manager.init_app(app)

    app.register_blueprint(views, url_prefix='/')
    app.register_blueprint(auth, url_prefix='/')
    app.register_blueprint(admin, url_prefix='/admin/')

    create_database(app)
    # schedule_email(app)

    @login_manager.user_loader
    def load_user(id):
        return User.query.get(int(id))
    return app


# This is function to schecduling email, you can activate it by uncommenting it
# I don't use it because pythonanywhere doesn't support multi thread
# def schedule_email(app):
#     from .email import daily_report, daily_reminder
#     scheduler = APScheduler()
#     timezone = pytz.timezone('Asia/Jakarta')
#     scheduler.add_job(func=daily_report, trigger=CronTrigger(hour=19, minute=0), timezone=timezone, id='daily_report_job')
#     scheduler.add_job(func=daily_reminder, trigger=CronTrigger(hour=7, minute=30), timezone=timezone, id='daily_reminder_job')
#     scheduler.init_app(app)
#     scheduler.start()

def create_database(app):
    if database_url.startswith("sqlite:///"):
        if not os.path.exists('website/' + database_url.split("/")[-1]):
            with app.app_context():
                db.create_all()

# @app.errorhandler(Exception)
# def handle_exception(e):
#     error_code = getattr(e, 'code', 500)
#     error_message = getattr(e, 'description', 'Sepertinya ada yang salah')
#     return render_template('error.html', error_code=error_code, error_message=error_message), error_code