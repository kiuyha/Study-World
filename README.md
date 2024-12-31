# Study-World

**Website for Learning, Collaborating and Growth**

This is web created using Flask. You can test it in <a href="https://StudyWorld.pythonanywhere.com" target="_blank">Study-World</a>

## Feautures
- **Major SQL Database Compatibility**. This website support all the database support by SQLalchemy, such as MySQL, PostgreSQL, SQLite, etc. But for database outside MySQL and SQLite, you need to download driver.
- **Using Flask-Migrate**. This allow you to edit the database and migrate to the new one.
- **Database Viewer**. You can access the database by add this relative path `/view_db`
- **Admin Dashboard**. Have admin dashboard where you can manage the users and pages, and also see the statistics of the website.
- **Dynamic Module**. You can add, edit and remove module from the admin and it will apply immediatly.
- **Using Flask-Email**. You can receive OTP when signup or change password. Also there's email being sent to users so they can know theirs achivment and reminder to learn.
- **Points Statistics**. User can see the statistics of their progress over last week. Also there's leaderboard to provide incentives.
- **Authtetication page**. User can sign up and login.
- **Settings**. User can change theirs profil, security and notifications.
- **Quiz**. Admin can add quiz in module so that user can get points.
- **Comment**. User can interact with each other in each module.

## Setup
1. You can download this repository by click the `code` button and download zip. If you prefer using git, you can use this command
```
git clone https://github.com/kiuyha/Study-World.git
```
2. This program requires to have .env file to be run. Below are the required variables:
  - `MAIL_USERNAME`: The email that the app will be use.
  - `MAIL_PASSWORD`: Password of the email.
  - `SECRET_KEY `: Random string as key for encryption user's data.
  -  `DATABASE_URL`: Url for the database.
  You can also run this command for to have the same thing:
  ```
  echo MAIL_USERNAME=your_email_address > .env
  echo MAIL_PASSWORD=your_email_password >> .env
  echo SECRET_KEY=your_secret_key >> .env
  echo DATABASE_URL=your_database_url >> .env
  echo BASE_URL=your_website_url >> .env
  ```
  **NOTE**: if you run that command in powershell or CMD the .env file might be using the UTF-16, which not
  supported by the python code. You can change it in vscode though.

3. Install the requirements. You can use this command.
```
pip install -r requirements.txt
``` 

4. Run the `app.py`.

## END
Thank you for reading. Feel free to fork this project and modify it.