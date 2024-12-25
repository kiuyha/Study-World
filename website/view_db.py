from flask import Blueprint, render_template, request, jsonify
from sqlalchemy import inspect
from datetime import datetime
from . import db
from .models import *
from functools import wraps
import sqlalchemy

view_db = Blueprint('view_db', __name__, template_folder='templates/view_db')

def SuperAdmin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.admin or not current_user.id == 1:
            return render_template("error.html", error_code=403, error_message="Kamu tidak memiliki akses untuk halaman ini.")
        return f(*args, **kwargs)
    return decorated_function

@view_db.route('/', methods=['GET'])
@SuperAdmin_required
def home():
    return render_template('home.html')

@view_db.route('/get_tables', methods=['GET'])
@SuperAdmin_required
def get_tables():
    try:
        output = inspect(db.engine).get_table_names()
        status = 200
    except Exception as e:
        status = 500
        output = str(e)
    return jsonify(output), status



@view_db.route('/table/<table_name>', methods=['GET'])
@SuperAdmin_required
def table(table_name):
    def get_default_value(column):
        if callable(column.default):
            print(column.default(), flush=True)
            return str(column.default())
        elif hasattr(column.default, 'arg'):
            return column.default.arg
        return None
    try:
        module_class = globals()[table_name]
        table_columns = module_class.__table__.columns
        rows = module_class.query.all()
        columns = [column.name for column in table_columns]
        type_data = {col: [str(table_columns[col].type),
                           table_columns[col].nullable,
                           get_default_value(table_columns[col])]
                           for col in columns}
        result = {
            'columns': columns,
            'rows': [{col: getattr(row, col) for col in columns} for row in rows],
            'type_data': type_data
        }
        return jsonify(result), 200
    except Exception as e:
        return str(e), 500

@view_db.route('/delete_row/<table_name>/<row_id>', methods=['GET'])
@SuperAdmin_required
def delete_row(table_name, row_id):
    try:
        module_name = globals()[table_name]
        row = module_name.query.filter_by(id={row_id}).first()
        db.session.delete(row)
        db.session.commit()
        return 'sucesss', 200
    except Exception as e:
        return str(e), 500


def parse_datetime(value):
    formats = ['%Y-%m-%d %H:%M:%S', '%a, %d %b %Y %H:%M:%S GMT', '%Y-%m-%d']
    for fmt in formats:
        try:
            return datetime.strptime(str(value), fmt).strftime('%Y-%m-%d %H:%M:%S')
        except ValueError:
            continue
    return value

@view_db.route('/add_row/<table_name>', methods=['POST'])
@SuperAdmin_required
def add_row(table_name):
    data = request.get_json()
    try:
        module_name = globals()[table_name]
        parsed_data = {}
        for key, value in data.items():
            if value or len(value) > 0:
                parsed_data[key] = parse_datetime(value)
        model_instance = module_name(**parsed_data)
        db.session.add(model_instance)
        db.session.commit()
        return str('success'), 200
    except Exception as e:
        return str(e), 500
        

@view_db.route('/update_row/<table_name>/<row_id>', methods=['POST'])
@SuperAdmin_required
def update_row(table_name, row_id):
    data = request.get_json()
    try:
        module_name = globals()[table_name]
        row = module_name.query.filter_by(id=row_id).first()
        if row:
            for key, value in data.items():
                setattr(row, key, parse_datetime(value))
        db.session.commit()
        return str('success'), 200
    except Exception as e:
        return str(e), 500
