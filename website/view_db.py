from flask import Blueprint, render_template, request, session, redirect, url_for, jsonify
from sqlalchemy import inspect
import datetime
from .admin import admin_required
from . import db
from .models import *

view_db = Blueprint('view_db', __name__, template_folder='templates/view_db')

def execute_script(script):
    try:
        local_scope = {}
        exec(script, globals(), local_scope)
        return local_scope.get('result', None), 200
    except Exception as e:
        return str(e), 500


@view_db.route('/', methods=['GET'])
@admin_required
def home():
    return render_template('home.html')


@view_db.route('/get_tables', methods=['GET'])
@admin_required
def get_tables():
    try:
        output = inspect(db.engine).get_table_names()
        status = 200
    except Exception as e:
        status = 500
        output = str(e)
    return jsonify(output), status


@view_db.route('/table/<table_name>', methods=['GET'])
@admin_required
def table(table_name):
    output, status = execute_script(f'''
from .models import {table_name}
rows = {table_name}.query.all()
columns = [column.name for column in {table_name}.__table__.columns]
result = {{'columns': columns,
'rows': [{{col: getattr(row, col) for col in columns}} for row in rows],
'type_data': {{ col: str({table_name}.__table__.columns[col].type) for col in columns }}}}
''')  
    if status == 200:
        return jsonify(output), status
    return output, status

@view_db.route('/delete_row/<table_name>/<row_id>', methods=['GET'])
@admin_required
def delete_row(table_name, row_id):
    output, status = execute_script(f'''
from .models import {table_name}
row = {table_name}.query.filter_by(id={row_id}).first()
db.session.delete(row)
db.session.commit()
''')
    return jsonify(output), status

def parse_datetime(value):
    formats = ['%Y-%m-%d %H:%M:%S', '%a, %d %b %Y %H:%M:%S GMT', '%Y-%m-%d']
    for fmt in formats:
        try:
            return datetime.datetime.strptime(str(value), fmt).strftime('%Y-%m-%d %H:%M:%S')
        except ValueError:
            continue
    return value

@view_db.route('/add_row/<table_name>', methods=['POST'])
@admin_required
def add_row(table_name):
    data = request.get_json()
    output, status = execute_script(f'''
data = {table_name}({', '.join([f"{key}={repr(parse_datetime(value))}" for key, value in data.items()])})
db.session.add(data)
db.session.commit()
    ''')
    return jsonify(output), status


@view_db.route('/update_row/<table_name>/<row_id>', methods=['POST'])
@admin_required
def update_row(table_name, row_id):
    data = request.get_json()
    output, status = execute_script(f'''
row = {table_name}.query.filter_by(id={row_id}).first()
if row:
    for key, value in {data}.items():
        setattr(row, key, parse_datetime(value))
    db.session.commit()
''')
    return jsonify(output), status
