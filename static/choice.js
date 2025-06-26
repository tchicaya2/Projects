let domaine;
let pageType;

async function getChoices(){
    pageType = document.getElementById("pagetype").textContent;

    let choiceRoute = "/choix"; // Par défaut, c'est la route publique Flask qui est utilisée pour récupérer les données de choix
    let method = "POST";
    if (pageType == "privé"){
        choiceRoute = "/mes_quiz";
        method = "GET";
    }
    console.log(pageType, choiceRoute, method);

    let response = await fetch(`${encodeURIComponent(choiceRoute)}`, { // Récupère la liste des quiz de l'utilisateur connecté
    method: method});
    const choix = await response.json();
    return choix;
}

document.addEventListener("DOMContentLoaded", async() => { // Remplit dynamiquement la page des options
    const choix = await getChoices();

    let html = '';
    let href = "/jurisquiz"; // Par défaut, le bouton renvoie à route Flask du quiz public
    if (pageType == "privé"){
        href = "/private_quiz";
    }
    console.log(href);
    for (element of choix) {
        html += `<a href="${encodeURIComponent(href)}"><label id="dossier" class="réponse" for="1">${element}</label></a>`;
    }
    document.getElementById('options').innerHTML = html;
});

document.addEventListener("click", (event) => { // En cas de clic sur l'une des matières proposées, on enregistre le nom de la matière dans localStorage afin de faire persister le nom en dehors de ce fichier
    if (event.target.id == "dossier"){
        domaine = event.target.textContent; // Bug possible car LABEL est aussi le tagname pour les réponses, pas que pour les choix de domaines
        localStorage.setItem("domaine", domaine); // Pour ne pas perdre la valeur de domaine lors du changement de page
    }
});


