PROJECT TITLE : Law and Code
VIDEO DEMO : https://youtu.be/erUOcFYbpH4
DESCRIPTION

Law and Code is a web application designed primarily for law students, providing an interactive and gamified way to revise key judicial principles. Users are invited to play quizzes where the objective is to identify the correct legal case (i.e., arrêt) corresponding to a legal principle displayed on screen.

The project merges my two areas of "expertise": law (I'm currently pursuing a Master 2 in Law) and programming. My goal with Law and Code is to demonstrate how technical tools can enhance legal education.

USER FUNCTIONALITIES

The platform offers two primary experiences:

- Public Quizzes: Accessible to everyone, logged-in or not. Users can test their knowledge on legal topics and principles from various domains.
- Private Quizzes: Available for logged-in users, who can create and play their own custom quizzes. (Currently, private quizzes are not yet organized into folders, but this feature is planned.)

In both modes, the quiz displays a legal principle at the top of the screen, and the player must choose the correct corresponding legal decision among four options. Users have three attempts per question.


TECH STACK

The application uses the following technologies:

- Flask: Backend framework (routing, server logic, JSON APIs)
- SQLite: Lightweight relational database for storing users, quizzes, and results
- HTML / CSS / JavaScript: Frontend interactivity and layout
- Bootstrap: Used for styling and responsiveness
- LocalStorage: Used client-side to persist selected quiz topics between pages


FILE STRUCTURE OVERVIEW

At the root level:

- `app.py`: Main Flask app (routing, session management, data queries)
- `helpers.py`: Utility functions for database access, user authentication, etc.
- `arrets.db`: SQLite database file containing all relevant tables

`static/` (frontend assets):
- `styling.css`: Custom CSS file
- `CV.pdf` and personal image
- `public/`: Contains `choice.js` and `public.js` for public quiz logic
- `private/`: Contains `choice.js` and `private.js` for private quiz logic

#### `templates/` (HTML templates with Jinja):
- `layout.html`: Base template extended by all other pages
- `public/`:
  - `index.html`: Clean, minimalist homepage
  - `about.html`: Personal portfolio/about section
  - `choice.html`: Public quiz subject selection
  - `jurisquiz.html`: Quiz page where the public quiz is played
  - `create.html`: Form to create new private quizzes
  - `login.html` / `register.html`: Authentication pages
  - `apology.html`: Custom error page
  - `profile.html`: Dashboard showing user quiz performance per subject
- `private/`:
  - `choice.html`: Private quiz subject selection
  - `quiz.html`: Quiz page for private quizzes

DATABASES TABLES

The project uses four main tables in `arrets.db`:

- `users`: Stores user account data (email, hashed password)
- `arrets`: Stores public quiz data (case names and principles)
- `custom`: Stores private quiz content created by users
- `stats`: Stores quiz results (per user, per subject) displayed in the profile page

DESIGN CHOICES

- The choice of SQLite fits the lightweight nature of the app for now. But I plan to learn a bit of PostgreSQL and migrate my database there
- LocalStorage is used to keep track of the user's selected domain across pages without needing server state or query strings.
- All quiz logic is done in vanilla JavaScript (no frameworks), allowing me to strengthen my understanding of raw JS before tackling JS Frameworks in the future
- Questions are shuffled and selected randomly, and once used, are removed from the selection pool to avoid repetition.


CURRENT LIMITATIONS AND PLANNED IMPROVMENTS

- Private quiz folders: Currently missing, but planned to organize custom quizzes better.
- Improved feedback animations and website style overall
- Admin panel to manage public quiz content more easily


This project was an opportunity to apply my new programming skills in a traditionally non-technical field like law, and also allowed me to solidify my knowledge of full-stack development while producing a practical tool for academic purposes.

This was CS50x!

