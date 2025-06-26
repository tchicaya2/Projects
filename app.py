import requests
import sqlite3
from flask import Flask, flash, redirect, jsonify, render_template, request, session
from flask_session import Session
from functools import wraps
import os
from flask_cors import CORS # Cross-origin requests
from werkzeug.security import check_password_hash, generate_password_hash
from helpers import login_required, apology, get_db
import re

app = Flask(__name__)
CORS(app)

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)


"""  ROUTES PUBLIQUES (Routes qui renvoient des données accessibles à tous """

@app.route("/") # Renvoie la page d'acceuil
def index():
    return render_template("public/index.html")


@app.route("/about") # Renvoie la page de présentation du site
def contacts():
    return render_template("public/about.html")

@app.route("/jurisquiz") # Renvoie la page sur laquelle sera jouée le quiz public
def jurisquiz():
    return render_template("quiz.html", type="public")

@app.route("/choix", methods=["GET", "POST"]) # Affiche la page de choix de matières (GET) ou renvoie les données pour remplir cette page de choix (POST)
def choix():
    if request.method == "GET":
        return render_template("public/choice.html")
    else:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT domaine FROM arrets")
        rows = cursor.fetchall()
        domaines = [row[0] for row in rows] # Extrait le premier élément de chaque tuple contenu dans la liste de tuples que renvoie la base de données
        conn.close()
        return jsonify(domaines) # Retourner avec jsonify car la réponse est attendue par JavaScript

@app.route("/create", methods=["GET", "POST"]) # Route pour créer son quiz personnalisé
@login_required # Il faut être connecté pour actionné cette route (renvoi à la page de connexion si c'est pas le cas)
def create():
    if request.method == "GET":
        return render_template("public/create.html")
    else:
        principe = request.form.get("principe").strip()
        reference = request.form.get("référence").strip()
        try:
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("INSERT INTO customs (user_id, nom, principe) VALUES (?, ?, ?)",
                      (session["user_id"], reference, principe))
            conn.commit()
            conn.close()
            return render_template("public/create.html", message="Enregistré !")
        except sqlite3.IntegrityError as e:
            print("EXCEPTION", e)
            return apology("La question existe déjà dans votre quiz") # Erreur dû à une contrainte "UNIQUE" existant sur la colonne "nom" dans la base de données

@app.route("/quiz") # Renvoie simplement la page où sera jouée le quiz
def quiz():
    return render_template("quiz.html")

@app.route("/arrets")
def arrets():
    domaine = request.args.get("domaine") # Le domaine est un innerHTML que j'ai moi-même inséré dans un label html,
    #donc a priori pas besoin de nettoyage puisque l'utilisateur ne contrôle pas le contenu
    if not domaine:
        return apology("Domaine manquant")
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT nom, principe FROM arrets WHERE domaine = ?", (domaine,))
        rows = cursor.fetchall()
        return jsonify(rows)
    except Exception as e:
        return apology("Une erreur est survenue. Le domaine n'existe peut-être pas")
    finally:
        conn.close()

@app.route("/register", methods=["GET", "POST"]) # Renvoie la page d'inscription (GET) ou enregistre le nouvel utilisateur dans la base de données (repris du PSET 9 Finance)
def register():
    """Register user"""
    if request.method == "GET":
        return render_template("public/register.html")
    elif request.method == "POST":  # Soumission d'une demande d"inscription
        username = request.form.get("username") # Required dans HTML
        password = request.form.get("password") # Required
        confirmation = request.form.get("confirmation") # Required
        if password != confirmation:
            return render_template("public/register.html", message="Mot de passe différent de la confirmation"), 400
        match = re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$', password)
        if not match:
            return render_template("public/register.html", message="Votre mot de passe doit contenir au moins 8 caractères : une lettre majuscule (A–Z), une lettre minuscule (a–z), un chiffre (0–9), un caractère spécial (par ex. !, @, #, $, %, etc.)"), 400
        try:
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("INSERT INTO users (username, hash) VALUES (?, ?)",
                      (username, generate_password_hash(password)))
            conn.commit()
            return render_template("public/login.html", message="Votre compte a été crée, vous pouvez maintenant vous connecter") # Si le nouvel utilisateur a été enregistrer, renvoi à la page de connexion avec un message informatif
        except sqlite3.IntegrityError: # Contrainte "UNIQUE" sur le nom d'utilisateur
            return render_template("public/register.html", message="Le nom d'utilisateur est déjà pris"), 400
        finally:
            conn.close() # Fermer la conexion à la base de données dans tous les cas

@app.route("/login", methods=["GET", "POST"]) # Renvoie la page de connexion (GET) ou authentifie l'utilisateur (repris du PSET 9 Finance)
def login():
    """Log user in"""

    # Forget any user_id
    session.clear()

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":
        # Ensure username was submitted
        if not request.form.get("username"):
            return apology("must provide username", 403)

        # Ensure password was submitted
        elif not request.form.get("password"):
            return apology("must provide password", 403)

        # Query database for username
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (request.form.get("username"),))
        rows = cursor.fetchall()
        conn.close()
        # Ensure username exists and password is correct
        if len(rows) != 1 or not check_password_hash(
            rows[0][2], request.form.get("password") # 0 pour indexer dans la liste et 2 pour récupérer la hash qui se trouve à l'index 2 des éléments du tuple
        ):
            return apology("invalid username and/or password", 403)

        # Remember which user has logged in
        session["user_id"] = rows[0][0]
        session.modified = True

        # Renvoyer à la page d'accueil avec un message
        return render_template("public/index.html", message="Vous êtes connecté !")

    # User reached route via GET (as by clicking a link or via redirect)
    else:
        return render_template("public/login.html")


@app.route("/logout") # Déconnecte l'utilisateur et renvoie à la page d'accueil avec un message
def logout():
    """Log user out"""

    # Forget any user_id
    session.clear()

    return render_template("public/index.html", message="Vous êtes déconnecté !")


@app.route("/quizlength") # Renvoie à une page d'erreur lorsque l'utilisateur essaie de lancer un quiz privé trop court
def quizlength():
    return apology("Votre Quiz doit contenir au moins 4 questions et réponses pour être lancé")


"""  ROUTES PRIVÉES (Routes qui renvoient des données privées) """

@app.route("/private_choice") # Page de choix de matière pour les quiz privés
@login_required
def private_choice():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT domaine FROM customs WHERE user_id = ?", (session["user_id"],))
    rows = cursor.fetchall()
    conn.close()
    return render_template("private/choice.html", response=rows) # Si response est vide, Jinja affiche une message d'absence de quiz privés simplement


@app.route("/mes_quiz", methods=["GET", "POST"]) # Renvoie à la liste des quiz privés sur requête de Javascript ou renvoie la liste des questions-réponses d'un quiz privé
@login_required
def mes_quiz():
    if request.method == "GET":
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT domaine FROM customs WHERE user_id = ?", (session["user_id"],))
        rows = cursor.fetchall()
        domaines = [row[0] for row in rows]
        conn.close()
        return jsonify(domaines)
    else:
        domaine = request.args.get("domaine")
        if not domaine:
            return apology("Domaine manquant")
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT nom, principe FROM customs WHERE domaine = ? AND user_id = ?", (domaine, session["user_id"],))
        rows = cursor.fetchall()
        if len(rows) < 4:
            conn.close()
            return apology("Le quiz ne contient pas assez de questions")
        conn.close()
        return jsonify(rows)


@app.route("/private_quiz") # Renvoie la page de quiz privé (ne pas confondre avec la page de choix du quiz privé ou le renvoi des questions-réponses d'un quiz privé spécifique)
@login_required
def private_quiz(): # Requête du HTML
    return render_template("quiz.html", type="privé")

@app.route("/update_stats") # Met à jour les résultats des utilisateurs dans la base de données
@login_required
def update_stats():
    domaine = request.args.get("domaine")
    posées = request.args.get("posées")
    trouvées = request.args.get("trouvées")
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT domaine FROM stats WHERE domaine = ? AND user_id = ?", (domaine, session["user_id"],)) # Vérifier si l'utilisateur a une ligne dans la db pour le domaine qu'il vient de jouer
    row = cursor.fetchone()
    if not row:  # Si l'utilisateur n'a pas encore une ligne pour ce domaine (parce qu'il y a jamais joué)
        # On crée une nouvelle ligne pour cette action pour l'utilisateur
        cursor.execute("INSERT INTO stats (user_id, domaine, posées, trouvées) VALUES (?, ?, ?, ?)",
                       (session["user_id"], domaine, posées, trouvées,))
    else:  # Sinon, l'utilisateur a déjà eu l'action dans son portefeuille, la ligne est déjà présente, on update juste le nombre d'actions
        cursor.execute("UPDATE stats SET posées = posées + ?, trouvées = trouvées + ? WHERE user_id = ? AND domaine = ?",
                       (posées, trouvées, session["user_id"], domaine,))
    conn.commit()
    conn.close()
    return '', 204 # On retourne quand même une réponse valide même si cette route n'a pas vocation à renvoyer quelque chose à l'appelant

@app.route("/get_stats") # Renvoie les résultats de l'utilisateur pour les afficher dans la page de profil
@login_required
def get_stats():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM stats WHERE user_id = ?", (session["user_id"],)) # Vérifier si l'utilisateur a une ligne dans la db pour le domaine qu'il vient de jouer
    rows = cursor.fetchall()
    cursor.execute("SELECT username FROM users WHERE id = ?", (session["user_id"],))
    nom = cursor.fetchone()
    print(nom)
    conn.close()
    return render_template("public/profile.html", rows=rows, nom=nom[0])



if __name__ == "__main__":

    app.run(host="0.0.0.0", port=5000)


