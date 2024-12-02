from . import db
from flask import url_for
from flask_login import UserMixin, current_user
from collections import defaultdict
from datetime import datetime,timedelta
from bs4 import BeautifulSoup
from sqlalchemy import func
from sqlalchemy.ext.mutable import MutableDict
import os
import shutil
import base64


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)
    points = db.Column(db.Integer, nullable=False, default=0)
    timestamp = db.Column(db.Date, nullable=False, default=db.func.current_date())
    photo = db.Column(db.Text, nullable=False, default='img/dash/pp-icon.svg')
    School_name = db.Column(db.String(150), default='')
    web_notif = db.Column(MutableDict.as_mutable(db.JSON), nullable=False, default=lambda: {"acc_activity": True, "anoncement": True})
    email_notif = db.Column(MutableDict.as_mutable(db.JSON), nullable=False, default=lambda: {"daily_report": True, "daily_reminder": True})
    admin = db.Column(db.Boolean, nullable=False, default=False)

class Content(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    Class = db.Column(db.String(150), nullable=False, index=True)
    Course = db.Column(db.String(150), nullable=False, index=True)
    Module = db.Column(db.String(150), nullable=False, index=True)
    Visit_point = db.Column(db.Integer, nullable=False, default=0)
    Finish_point = db.Column(db.Integer, nullable=False, default=0)
    Creator = db.Column(db.String(150), db.ForeignKey('user.username'), nullable=False)
    Created_at = db.Column(db.DateTime, nullable=False, default=db.func.now())
    Views = db.Column(db.Integer, nullable=False, default=0)
    img_path = db.Column(db.String(150), nullable=False)

class DailyTrack(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    page = db.Column(db.String(150), db.ForeignKey('content.id'), nullable=False)
    date = db.Column(db.Date, nullable=False, default=db.func.current_date())
    user_point = db.Column(db.Integer, nullable=False, default=0)
    page_view = db.Column(db.Integer, nullable=False, default=0)

class TempContent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    Class = db.Column(db.String(150), index=True)
    Course = db.Column(db.String(150), index=True)
    Module = db.Column(db.String(150), index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    generated_html = db.Column(db.Text, default='')
    Visit_point = db.Column(db.Integer, default=0)
    Finish_point = db.Column(db.Integer, default=0)
    Created_at = db.Column(db.DateTime, default=db.func.now())

class Notifications(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    headline = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text)
    receiver = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    sender = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    anoncement = db.Column(db.Boolean, nullable=False, default=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=db.func.now())

def web_notif(headline, message, sender, anoncement=False):
    # send notification to all users that enable it
    if anoncement:
        user_list = User.query.filter(web_notif['anoncement'] == True).all()
        for user in user_list:
            notif = Notifications(headline=headline, message=message, receiver=user.id, sender=sender, anoncement=anoncement)
            db.session.add(notif)
    else:
        user = current_user.web_notif['acc_activity']
        if user:
            notif = Notifications(headline=headline, message=message, receiver=current_user.id, sender=sender)
            db.session.add(notif)
    db.session.commit()

def all_notif():
    # get all notification
    all_notif = Notifications.query.filter(Notifications.receiver == current_user.get_id()).order_by(Notifications.timestamp.desc()).all()
    data = ((
        notif.headline,
        notif.message,
        notif.anoncement,
    ) for notif in all_notif)
    return tuple(data)

def TrackViewPoints(page):
    #track all point and view for each module
    page_id = Content.query.filter_by(Module=page).first().id
    page_views = Content.query.filter_by(Module=page).first().Views
    page_views += 1
    today = db.func.current_date()
    data = DailyTrack.query.filter_by(user_id=current_user.id, page=page_id, date=today).first()
    point = Content.query.get(page_id).Visit_point
    user = User.query.get(current_user.id)
    if data:
        data.page_view += 1
        data.user_point += point
    else:
        new_track = DailyTrack(user_id=current_user.id, page=page_id, page_view=1, user_point=point)
        db.session.add(new_track)
    web_notif(headline='Point Membaca', message=f'Selamat kamu berhasil mendapatkan {point} point', sender='Sistem')
    user.points += point
    db.session.commit()
    
def TrackFinishPoints(page):
    # add point if user finish the module
    page_id = Content.query.filter_by(Module=page).first().id
    data = DailyTrack.query.filter_by(user_id=current_user.id, page=page_id, date=db.func.current_date()).first()
    point = Content.query.get(page_id).Finish_point
    user = User.query.get(current_user.id)
    data.user_point += point
    user.points += point
    web_notif(headline='Point Soal', message=f'Selamat kamu berhasil mendapatkan {point} point', sender='Sistem')
    db.session.commit()

def get_content(is_latest=False):
    # get all content to show in courses   
    if is_latest:
        latest_content = Content.query.order_by(Content.Created_at.desc()).limit(5).all()
        return latest_content
    all_content = Content.query.with_entities(
        Content.Class, Content.Course, Content.Module, Content.Created_at, Content.img_path
    ).order_by(Content.Class, Content.Course, Content.Created_at).all()
    result = defaultdict(lambda: defaultdict(list))
    for content in all_content:
        result[content.Class][content.Course].append((content.Module, content.img_path))
    return dict(result)

def content_dash(range_date):
    # get information for admin dashboard
    date_now = datetime.now().date()

    new_user = User.query.filter(func.date(User.timestamp) == date_now).count()
    total_user = User.query.count()
    total_content = Content.query.count()
    total_views = db.session.query(db.func.sum(DailyTrack.page_view)).scalar() or 0
    
    if range_date == 'all':
        views_data = db.session.query(func.strftime('%Y-%m-%d',DailyTrack.date), db.func.sum(DailyTrack.page_view))\
        .group_by(func.strftime('%Y-%m-%d',DailyTrack.date)).all()
        new_user_data = db.session.query(func.strftime('%Y-%m-%d', User.timestamp).label('timestamp_str'),db.func.count(User.id))\
        .group_by(func.strftime('%Y-%m-%d', User.timestamp)).all()
    else:
        range_date = int(range_date)
        start_date = date_now - timedelta(days=range_date)
        views_data = db.session.query(func.strftime('%Y-%m-%d',DailyTrack.date), db.func.sum(DailyTrack.page_view))\
        .filter(DailyTrack.date.between(start_date, date_now)).group_by(func.strftime('%Y-%m-%d',DailyTrack.date)).all()
        new_user_data= db.session.query(func.strftime('%Y-%m-%d', User.timestamp).label('timestamp_str'), func.count(User.id))\
        .filter(User.timestamp.between(start_date, date_now)).group_by(func.strftime('%Y-%m-%d', User.timestamp)).all()
    new_user_every_day = (tuple(data) for data in new_user_data)
    views_every_day = (tuple(data) for data in views_data)
    return new_user, total_user, total_content, total_views, tuple(new_user_every_day), tuple(views_every_day)

def pages_information(is_draft=False):
    if is_draft:
        unique_classes = db.session.query(TempContent.Class).distinct().all()
        unique_courses = db.session.query(TempContent.Course).distinct().all()
        all_content = TempContent.query.order_by(TempContent.Created_at.desc()).all()
    else:
        unique_classes = db.session.query(Content.Class).distinct().all()
        unique_courses = db.session.query(Content.Course).distinct().all()
        all_content = Content.query.order_by(Content.Created_at.desc()).all()
    classes = (classe[0] for classe in unique_classes)
    courses = (course[0] for course in unique_courses)

    def format_datetime(dt):
        return dt.strftime('%d %B %Y %H:%M:%S')
    def def_val(content):
        if not hasattr(content, 'Creator'):
            return User.query.filter_by(id=content.user_id).first().username
    
    data_contents = ((
            content.id, content.Class, content.Course, content.Module,
            getattr(content, 'Creator', def_val(content)),
            format_datetime(content.Created_at), getattr(content, 'Views', ""))
    for content in all_content)
    return tuple(data_contents), classes, courses

def delete_page(id_content, is_draft=False):
    if is_draft:
        page = TempContent.query.filter_by(id=id_content).first()
    else:
        page = Content.query.filter_by(id=id_content).first()
        path_html = os.path.join(os.getcwd(), 'website/templates/courses', page.Class, page.Course, f"{page.Module}.html")
        path_img = os.path.join(os.getcwd(),'website/static/img/courses', page.Class, page.Course, page.Module)
        if os.path.exists(path_img):
            shutil.rmtree(path_img)
        os.remove(path=path_html)
    if page:
        db.session.delete(page)
        db.session.commit()

def save_images_and_get_updated_html(html_content, class_name,course_name, module_name):
    soup = BeautifulSoup(html_content, 'html.parser')
    images = soup.find_all('img')
    img_path = f"img/{course_name}.webp"
    for idx,image in enumerate(images):
        src = image.get('src')
        if src.startswith('data:image'):
            img_data = src.split(",")[1]
            img_type = src.split(";")[0].split("/")[1]
            
            # Generate a filename for the image
            image_filename = f"img/courses/{class_name}/{course_name}/{module_name}/image{idx+1}.{img_type}"
            if idx == 0:
                img_path = image_filename
            
            # Determine the directory for storing the image file
            directory = os.path.join(os.getcwd(),'website/static/img/courses', class_name, course_name, module_name)
            if not os.path.exists(directory):
                os.makedirs(directory)
            
            image_path = os.path.join(directory, f'image {idx+1}.{img_type}')
            
            # Save the base64 image to the file
            with open(image_path, 'wb') as f:
                f.write(base64.b64decode(img_data))
            # Update the image src in the HTML to the relative file path
            image['src'] = url_for('static', filename=os.path.join('img/courses',class_name, course_name, module_name, image_filename))
    return str(soup), img_path
    
def save_html(html_content, class_name, course_name, module_name):
    directory = os.path.join(os.getcwd(),'website/templates/courses', class_name, course_name)
    if not os.path.exists(directory):
        os.makedirs(directory)
    file_path = os.path.join(directory,  f"{module_name}.html")
    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(html_content)

def update_publish(id_tempcontent,classe=None, course=None, module=None, html=None, is_published=None, Visit_point=None, Finish_point=None):
    if id_tempcontent and not is_published:
        temp_content = TempContent.query.filter_by(id=id_tempcontent).first()
        temp_content.Class = classe
        temp_content.Course = course
        temp_content.Module = module
        temp_content.generated_html = html
        temp_content.Visit_point = Visit_point
        temp_content.Finish_point = Finish_point
    if id_tempcontent and is_published:
        temp_content = TempContent.query.filter_by(id=id_tempcontent).first()
        html_with_img, img_path = save_images_and_get_updated_html(temp_content.generated_html, classe, course, module)
        save_html(html_with_img, classe, course, module)
        content = Content(Module=module, Class=classe, Course=course, Visit_point=Visit_point, Finish_point=Finish_point, img_path=img_path, Creator=current_user.username)
        db.session.add(content)
        db.session.delete(temp_content)
    db.session.commit()

def get_tempcontent(id_tempcontent=None, list_path=None):
    if id_tempcontent:
        return TempContent.query.filter_by(id=id_tempcontent).first()
    else:
        if list_path:
            content = Content.query.filter_by(Class=list_path[0], Course=list_path[1], Module=list_path[2]).first()
            with open(os.path.join(os.getcwd(), 'website/templates/courses', list_path[0], list_path[1], f"{list_path[2]}.html"), 'r', encoding='utf-8') as file:
                html = file.read()
            temp_content = TempContent(Class=content.Class, Course=content.Course, Module=content.Module, user_id=current_user.get_id(), generated_html=html)
        else:
            temp_content = TempContent(Class="", Course="", Module="", user_id=current_user.get_id())
        db.session.add(temp_content)
        db.session.commit()
        return temp_content

def delete_tempcontent(id_tempcontent=None):
    if id_tempcontent:
        temp_content = TempContent.query.filter_by(id=id_tempcontent).first()
        db.session.delete(temp_content)
        db.session.commit()
        
def point_information(range_date=None):
    # get point information for each user
    ranked_query = db.session.query(User.username, User.points, User.photo).order_by(User.points.desc())
    leaderboard = []
    user_rank = None
    for index, (username, points, photo) in enumerate(ranked_query, start=1):
        user = (index, username, f"{points:,}".replace(',', '.'), photo)
        leaderboard.append(user)
        if current_user.username == username:
            user_rank = user
        if user_rank and index == 10:
            break
    leaderboard = leaderboard[:10]
    if user_rank and user_rank not in leaderboard:
        leaderboard.append(user_rank)
    if range_date == 'all':
        user_point_data = db.session.query(DailyTrack.date, db.func.sum(DailyTrack.user_point)).filter(
            DailyTrack.user_id == current_user.id
        ).group_by(DailyTrack.date).all()
    elif range_date:
        start_date = db.func.current_date() - timedelta(days=range_date)
        user_point_data = db.session.query(func .strftime('%Y-%m-%d', DailyTrack.date).label('date'), db.func.sum(DailyTrack.user_point)).filter(
            DailyTrack.user_id == current_user.id
        ).filter(DailyTrack.date.between(start_date, db.func.current_date())).group_by(func.strftime('%Y-%m-%d', DailyTrack.date)).all()
    user_point = User.query.get(current_user.id).points
    user_point_every_day = tuple(tuple(p) for p in user_point_data)
    return user_point, leaderboard, user_point_every_day

def user_information(page_size=10, page_num=1):
    total_user = User.query.count()
    pagination = User.query.order_by(User.id).paginate(page=page_num, per_page=page_size, error_out=False)
    return total_user, pagination

def change_role(user_id, role):
    user = User.query.filter_by(id=user_id).first()
    if role == 'admin':
        user.admin = True
    else:
        user.admin = False
    db.session.commit()

def change_profile(username, school ,src_img=None):
    try:
        if src_img != None:
            img_data = src_img.split(',')[1]
            img_type = src_img.split(';')[0].split('/')[1]

            filename = f"{current_user.id}.{img_type}"
            directory = os.path.join(os.getcwd(), 'website/static/img/profile_pic')
            if not os.path.exists(directory):
                os.mkdir(directory)
            with open(os.path.join(directory, filename), 'wb') as f:
                f.write(base64.b64decode(img_data))
            current_user.photo = f"img/profile_pic/{filename}"
        current_user.username = username
        current_user.School_name = school
        db.session.commit()
    except Exception as e:
        return str(e), False
    else:
        return "Profil berhasil diubah", True

def change_emailOrPassword(type_change, value):
    try:
        if type_change == 'email':
            current_user.email = value
            Message = 'Email berhasil diubah'
        elif type_change == 'password':
            current_user.password = value
            Message = 'Password berhasil diubah'
        db.session.commit()
    except Exception as e:
        return e, False
    else:
        return Message, True

def change_notif_settings(type_notif, values):
    try:
        user = current_user
        notif_settings = getattr(user, type_notif)
        notif_settings.update(values)
        setattr(user, type_notif, notif_settings)
        db.session.commit()
    except Exception as e:
        return e, False
    else:
        return "Pengaturan notifikasi berhasil diubah", True

def delete_account():
    db.session.delete(current_user)
    db.session.commit()
