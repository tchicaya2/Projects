// Il y avait plus de 20 variables définies en global, j'ai revu le code pour les passer en local et entre fonctions
let quizType;
let counter = 0; // Utilisé à 5 autres endroits
let chances = 3; // 10 autres endroits
let fin;
let bonne_réponse;
let domaine;
let quizMap = new Map();
let selectible = [];


async function getArrets(){ // Récupérer les arrêts associés à la matière choisie par l'utilisateur

    quizType = document.getElementById("quiztype").textContent;
    let quizRoute = "/arrets"; // Par défaut, c'est la route publique Flask qui est utilisée pour récupérer les données de choix
    let method = "GET";

    if (quizType == "privé"){
        quizRoute = "/mes_quiz";
        method = "POST";
    }
    try{
        domaine = localStorage.getItem("domaine");
        let response = await fetch(`${encodeURIComponent(quizRoute)}?domaine=${encodeURIComponent(domaine)}`, {
    method: method}); // La route Flask "/mes_quiz" appelée avec POST renvoie la liste des arrêts associés à un domaine choisi
        let arrets = await response.json();
        console.log(arrets)
        return arrets;
    } catch (error){ // CETTE ERREUR EST EXCLUSIVE AUX QUIZ PRIVÉS, IL FAUDRA CORRIGER ÇA
        window.location.href = "/quizlength"; // En cas d'erreur (Flask a renvoyé une réponse invalide), on déclenche une route Flask qui affiche la page d'erreur
    }
}

async function main(){ // Remplir une liste ("selectible") avec tous les noms d'arrêts

    const arrets = await getArrets();
    for (let arret of arrets){
        quizMap.set(arret[0], arret[1]); // On associe arret et principe dans un tuple
    }
    for (let[key, value] of quizMap){
        selectible.push(key);
    }

}


document.addEventListener("DOMContentLoaded", async() => { /* Une fois la page chargée, attendre que main remplisse la liste de questions
    puis capturer les éléments du DOM pour ensuite y ajouter les données appropriées */
    await main();
    set_and_ask();
});

function set_and_ask(){
     /* On commence par "attraper" les éléments de la page */
    let matière = document.getElementById("domaine");
    matière.innerHTML = domaine;
    let pcp = document.getElementById("principe");
    let r1 = document.getElementById("r1");
    let r2 = document.getElementById("r2");
    let r3 = document.getElementById("r3");
    let r4 = document.getElementById("r4");
    let score = document.getElementById("score");
    let essais = document.getElementById("essais")
    let feedback = document.getElementById("feedback");
    let clique_réponse = document.getElementById("les_réponses");
    let suivant = document.getElementById("suivant");
    let asked = [];
    let options = [];

    essais.innerHTML = chances;
    let état = {
        bouttons_inactifs: false // Permet la mutabilité
    };
    let labels = document.querySelectorAll(".réponse");
    fin = document.querySelector(".fin");
    score_final = document.getElementById("final_score");
    fin.hidden = true;
    nbre_questions = selectible.length;
    poser_question(pcp, r1, r2, r3, r4, score, essais, feedback, clique_réponse, suivant, état, labels, asked, options);
    // Pour afficher la toute première première question, suivant ne pouvant pas encore être cliqué, on appelle poser_question manuellement
    suivant.addEventListener("click", function() {
        poser_question(pcp, r1, r2, r3, r4, score, essais, feedback, clique_réponse, suivant, état, labels, asked, options);
    }); // Cliquer sur le bouton "suivant" (après avoir répondu à une question) déclenche poser_question qui affiche donc une nouvelle question,
    //  créant ainsi une boucle gérée par Javascript seul (cela évite les rechargements de page si Flask gérait cette partie)
    clique_réponse.addEventListener("click", function(event) {vérifier_réponse(event, état, feedback, score, suivant, asked, bonne_réponse, essais)});
}

function process(asked, options){  /* Cette fonction organise les données pour chaque question, en sélectionnant au hasard un arrêt (qui sera la bonne réponse), le principe associé à cet arrêt,
     et en sélectionnant 3 autres arrêts distracteurs qui seront donc les mauvaises réponses */

    if (selectible.length == 0){ // Avant de poser toute question, on vérifié si la liste d'arrêts est épuisée, auquel cas on affiche le menu de fin avec le score
        if (quizType == "public"){ // On enregistre les scores que pour les quiz publics
            posées = asked.length;
            fetch(`/update_stats?domaine=${encodeURIComponent(domaine)}&posées=${encodeURIComponent(posées)}&trouvées=${encodeURIComponent(counter)}`);
        }
        fin.hidden = false;
        score_final.innerHTML = counter + "/" + nbre_questions;
        return;
    }
    /* Sinon, on traite les éléments à afficher pour la question en cours */

    options.length = 0; //Je vide le contenu précédent de la liste des options (donc la liste contenant les 3 arrêts distracteurs et l'arrêt correct)
    selectible.sort(() => Math.random() - 0.5); // Je mélange la liste selectible (liste d'où on tire les noms d'arrêts)
    let index = Math.floor(Math.random() * (selectible.length)); // On détermine un index au hasard dans la liste selectible
    bonne_réponse = selectible[index]; // La bonne réponse sera l'arrêt se trouvant dans la liste selectible à l'index calculé au hasard
    console.log(bonne_réponse)
    selectible.splice(index, 1); // Je retire l'arrêt sélectionné de la liste sélectible
    options.push(bonne_réponse); // Je rajoute la bonne réponse dans la liste des options
    let principe = quizMap.get(bonne_réponse); // J'extrais de la map le principe associé à la bonne réponse
    selectible.sort(() => Math.random() - 0.5); // Je remélange la liste sélectible
    options.push(selectible[0], selectible[1], selectible[2]); //Je rajoute les arrêts distracteurs (les 3 premiers éléments de la liste selectible) à la liste des options
    let j = 0;
    for (let i = 0; i < options.length; i++){ // Pour chaque élément dans la liste des options
        if (!options[i]){ // Si l'élément est undefined (ce qui arrive dès que la liste selectible contient désormais moins de 4 arrêts)
            options[i] = asked[j]; // Insérer l'élément j de la liste des questions déjà posées (liste "asked")
            j++;
        }
    }
    options.sort(() => Math.random() - 0.5); // Je mélange la liste des options (pour éviter d'avoir toujours l'odre d'affichage : bonne réponse, puis les 3 distracteurs)
    return {principe, options}; // Je retourne enfin le principe et les 4 options
}

function poser_question(pcp, r1, r2, r3, r4, score, essais, feedback, clique_réponse, suivant, état, labels, asked, options){

    labels.forEach(function (label) {
        label.classList.remove("trouvé"); // On retire le style appliqué à la bonne réponse
    });


    qa = process(asked, options); // Je récupère le principe et les 4 options renvoyés par la fonction process
    principe = qa.principe; // Process retourne un objet, d'où cette syntaxe
    options = qa.options;

    chances = 3; // L'utilisateur a trois essais pour cliquer sur la bonne réponse
    essais.innerHTML = chances;
    pcp.innerHTML = principe;
    r1.innerHTML = options[0];
    r2.innerHTML = options[1];
    r3.innerHTML = options[2];
    r4.innerHTML = options[3];
    score.innerHTML = counter;
    feedback.hidden = true;
    suivant.hidden = true;
    état.bouttons_inactifs = false;
     /* Si on clique sur l'une des réponses (option[0] à option[3]), ça déclenchera la fonction de vérification des réponses */

}

function vérifier_réponse(event, état, feedback, score, suivant, asked, bonne_réponse, essais){

    if (event.target.tagName == "LABEL" && état.bouttons_inactifs == false){ // la variable bouttons_inactifs permet de prendre en compte les clics sur les réponses ou pas (si bouttons_inactifs devient true, on ne prend plus en compte les clics)
        if (event.target.innerHTML == bonne_réponse){
            état.bouttons_inactifs = true;
            feedback.classList.remove("alert-danger", "alert-success"); // Supprimer l'une quelconque des deux classes d'alert préexistantes
            feedback.classList.add("alert", "alert-success"); // Rajouter une classe d'alert spécifique
            event.target.classList.add("trouvé"); // Je rajoute la classe "trouvé" au label pour le colorer en vert
            feedback.innerHTML = "Correct !";
            feedback.style.color = "green";
            feedback.style.margin = "10px";
            feedback.hidden = false;
            counter++;
            console.log(counter)
            score.innerHTML = counter;
            suivant.hidden = false;  // Une fois la réponse vérifiée et juste, on affiche le bouton "suivant" qui en cas de clic déclenche poser_question (pour donc poser une nouvelle question)
            asked.push(bonne_réponse) // Je rajoute la question à la liste de questions posées
        }

        else if (event.target.innerHTML != bonne_réponse && chances == 1){ // SI l'utilisateur n'a pas cliqué sur la bonne réponse et qu'il lui restait une seule chance
            feedback.innerHTML = "Dommage, la bonne réponse était : " + bonne_réponse; // On affiche la bonne réponse
            feedback.classList.remove("alert-danger", "alert-success"); // Supprimer l'une quelconque des deux classes d'alert préexistantes
            feedback.classList.add("alert", "alert-danger"); // Rajouter une classe d'alert spécifique
            event.target.classList.add("faux"); // On colore en rouge la mauvaise réponse cliquée en dernier
            setTimeout(() => {
                event.target.classList.remove("faux");
            }, 2000); // La coloration de la mauvaise réponse disparait au bout de 2 secondes
            chances--; // chances est maintenant égal à 0, l'utilisateur a épuisé toutes ses chances
            essais.innerHTML = chances;
            état.bouttons_inactifs = true; // bouttons_inactifs passe quand même à
            feedback.style.color = "red";
            feedback.style.margin = "10px";
            feedback.hidden = false;
            suivant.hidden = false;
            asked.push(bonne_réponse) // Je rajoute la question à la liste de questions posées
        }
        else{ // Enfin, dans le cas où l'utilisateur n'a pas trouvé la bonne réponse et qu'il lui reste encore suffisamment d'essais
            feedback.innerHTML = "Incorrect";
            feedback.classList.remove("alert-danger", "alert-success"); // Supprimer l'une quelconque des deux classes d'alert préexistantes
            feedback.classList.add("alert", "alert-danger"); // Rajouter une classe d'alert spécifique
            event.target.classList.add("faux");
            setTimeout(() => {
                event.target.classList.remove("faux");
            }, 2000);
            feedback.style.color = "red";
            feedback.hidden = false;
            chances--;
            essais.innerHTML = chances;
        }
    }
}
