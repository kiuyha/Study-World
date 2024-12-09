from flask import Blueprint, render_template, redirect, url_for, request, jsonify
from .models import get_tempcontent, content_dash, pages_information, delete_page, update_publish, user_information, change_role, all_notif, web_notif, get_content
from flask_login import current_user
from functools import wraps
import math

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.admin :
            return render_template("error.html", error_code=403, error_message="Kamu tidak memiliki akses untuk halaman ini.")
        return f(*args, **kwargs)
    return decorated_function

admin = Blueprint('admin', __name__)

@admin.route('/home', methods=['GET','POST'])
@admin_required
def home():
    if request.method == 'POST':
        data = request.get_json()
        new_user, total_user, total_content, total_views, new_user_every_day, views_every_day = content_dash(data.get('date'))
        chart_data = {}
        if data.get('graph')['user']:
            chart_data['user'] = new_user_every_day
        if data.get('graph')['views']:
            chart_data['views'] = views_every_day
        box_data = (new_user,total_user, total_content, total_views)
        return jsonify({"chart_data": chart_data, "box_data": box_data})
    return render_template("admin/home.html", current_url=request.path, user=current_user, notifications=all_notif())

@admin.route('/page-management', methods=['GET', 'POST'])
@admin_required
def pages():
    data_content, classes, courses = pages_information()
    if request.method == 'POST':
        data = request.get_json()
        selectedValue = list(data.keys())[0]
        delete_id = data[selectedValue].get("delete")
        if selectedValue == 'draft':
            is_draft = True
            if delete_id:
                delete_page(delete_id, is_draft=True)
            data_content, classes,courses = pages_information(is_draft=is_draft)
        else:
            is_draft = False
            if delete_id:
                delete_page(delete_id)
            data_content, classes, courses = pages_information()
        filtered_content = [
            content for content in data_content
            if (str(content[1]) in data[selectedValue].get("classes",[])) and
               (str(content[2]) in data[selectedValue].get("courses",[]))
        ]
        return render_template("admin/page_update.html", classes=classes, courses=courses, content_data=filtered_content, draft=is_draft)
    return render_template("admin/page-management.html", current_url=request.path, classes=classes, courses=courses, content_data=data_content, user=current_user, notifications=all_notif())

@admin.route('/add-post')
@admin_required
def add_page():
    temp_id = get_tempcontent().id
    return redirect(url_for('admin.edit_module', tempcontent_id=temp_id))

@admin.route('/edit/<int:tempcontent_id>')
@admin.route('/edit/courses/<class_name>/<course>/<course_file>')
@admin_required
def edit_module(tempcontent_id = None, class_name = None, course = None, course_file=None):
    if class_name and course and course_file:
        temp_content = get_tempcontent(list_path=[class_name, course, course_file])
        print(temp_content.id)
        return redirect(url_for('admin.edit_module', tempcontent_id=temp_content.id))
    data = get_tempcontent(tempcontent_id)
    return render_template("admin/add_update.html", data=data)

@admin.route('/save', methods=['POST'])
@admin_required
def save_content():
    data = request.get_json()
    id_tempcontent = data.get("id")
    classe = data.get("class-name")
    course = data.get("course-name")
    module = data.get("module-name")
    html = data.get("html")
    visit_point = data.get("visit-point")
    finish_point = data.get("finish-point")
    if data.get("publish"):
        publish = True
    else:
        publish = False
    update_publish(id_tempcontent=id_tempcontent, classe=classe, course=course, module=module, html=html, is_published=publish, Visit_point=visit_point, Finish_point=finish_point)
    return jsonify({"success": True})

@admin.route('/preview/<int:tempcontent_id>')
@admin_required
def preview(tempcontent_id):
    content = get_tempcontent(tempcontent_id)
    return render_template('template_module.html', content=content.generated_html, module_name= content.Module, all_courses=get_content(), user=current_user, notifications=all_notif())

@admin.route('/user-management', methods=['GET', 'POST'])
@admin.route('/user-management?page=<int:page>')
@admin_required
def users(number_page=1):
    if request.method == 'POST':
        try:
            data = request.get_json()
            type_data = data.get("type")
            if type_data == 'role-data':
                role = data.get("role")
                change_role(data.get("id"), role)
                Message = "Role of " + data.get("username") + " has been changed to " + role
            elif  type_data == 'anoncement':
                headline = data.get("headline")
                message = data.get("message")
                web_notif(headline=headline, message=message, sender=current_user.username, anoncement=True)
                Message = "Anoncement has been sent"
            return jsonify({"success": True, "Message": Message})
        except Exception as e:
            return jsonify({"success": False, "Message": str(e)})
    total_users, users = user_information(page_size=10, page_num=number_page)
    total_pages = math.ceil(total_users/10) 
    return render_template("admin/user-management.html", current_url=request.path, total_pages=total_pages, users=users, user=current_user, notifications=all_notif())

@admin.route('/settings')
@admin_required
def settings():
    return redirect(url_for('views.settings'))
