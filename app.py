from website import create_app
from flask import render_template, send_file
from fpdf import FPDF
from flask_login import current_user
app = create_app()

@app.route('/export_pdf')
def export_pdf():
    user_data = {
        'username': current_user.username,
        'school': current_user.School_name,
        'email': current_user.email,
        'password': current_user.password,
    }

    # Buat PDF menggunakan fpdf
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)

    pdf.cell(200, 10, txt="Data Pengguna", ln=True, align="C")
    pdf.cell(200, 10, txt=f"Username: {user_data['username']}", ln=True)
    pdf.cell(200, 10, txt=f"School: {user_data['school']}", ln=True)
    pdf.cell(200, 10, txt=f"Email: {user_data['email']}", ln=True)
    pdf.cell(200, 10, txt=f"Password: {user_data['password']}", ln=True)

    # Simpan PDF sementara
    pdf_output = "C:/Users/Lenovo/OneDrive/Documents/Tugas/Pemograman Dasar/Python/Project full/Study-World/generated_file.pdf"
    pdf.output(pdf_output)

    return send_file(pdf_output, as_attachment=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)