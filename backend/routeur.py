import re
from .prompts import (
    rag_8D_prompt,
    prompt_8D_1,
    prompt_8D_2,
    prompt_8D_3,
    prompt_8D_4_main_oeuvre,prompt_8D_4_materiel,prompt_8D_4_matiere,prompt_8D_4_methode,prompt_8D_4_milieu,
    prompt_8D_4_5why,
    prompt_8D_5_corrective,
    prompt_8D_5_preventive,
    prompt_8D_6,
    prompt_8D_7,
    prompt_8D_8,
)


def detect_prompt(user_query: str, step: str = None):
    """
    Retourne le prompt adapté à la requête utilisateur
    en fonction des étapes du 8D OU de l'étape courante si fournie explicitement.
    Si aucune étape n'est reconnue, retourne un prompt général pour les non-conformités.
    """
    if not user_query and not step:
        return rag_8D_prompt

    query = (user_query or '').lower()
    step = (step or '').lower() if step else None

    # Priorité à l'étape explicite si fournie
    if step:
        if step in ["1d", "d1", "equipe", "équipe"]:
            return prompt_8D_1
        if step in ["2d", "d2"]:
            return prompt_8D_2
        if step in ["3d", "d3"]:
            return prompt_8D_3
        if step in ["4d", "d4"]:
            # On peut raffiner selon le contenu de la query
            if "méthode" in query or "methode" in query or "processus" in query:
                return prompt_8D_4_methode
            if "main" in query or "opérateur" in query or "personnel" in query or "humain" in query:
                return prompt_8D_4_main_oeuvre
            if "matériel" in query or "machine" in query or "équipement" in query or "outil" in query:
                return prompt_8D_4_materiel
            if "milieu" in query or "environnement" in query or "température" in query:
                return prompt_8D_4_milieu
            if "matière" in query or "composant" in query or "pièce" in query or "produit" in query:
                return prompt_8D_4_matiere
            if "pourquoi" in query:
                return prompt_8D_4_5why
            return prompt_8D_4_methode  # fallback D4
        if step in ["5d", "d5"]:
            if "corrective" in query or "corriger" in query:
                return prompt_8D_5_corrective
            if "préventive" in query or "preventive" in query or "empêcher" in query:
                return prompt_8D_5_preventive
            return prompt_8D_5_corrective  # fallback D5
        if step in ["6d", "d6"]:
            return prompt_8D_6
        if step in ["7d", "d7"]:
            return prompt_8D_7
        if step in ["8d", "d8"]:
            return prompt_8D_8

    # Sinon, logique classique sur la query
    # Logique pour détecter un prompt spécifique

        # Étape D1
    if re.search(r"\b(1D|d1|équipe|responsable|participants|team)\b", query, re.IGNORECASE):
        return prompt_8D_1

    # Étape D2
    if re.search(r"\b(|2Dd2|description.*probl[èe]me|probl[èe]me|faits|QQOQCCP)\b", query, re.IGNORECASE):
        return prompt_8D_2

    # Étape D3
    if re.search(r"\b(d3|mesure.*imm[ée]diate|confinement|contenu)\b", query, re.IGNORECASE):
        return prompt_8D_3

    # Étape D4 — détection spécifique des sous-parties

    # 5M : Méthode
    if re.search(r"\b(m[ée]thode|processus|proc[ée]dure|proc[ée]ssus)\b", query, re.IGNORECASE):
        return prompt_8D_4_methode

    # 5M : Main-d'œuvre
    if re.search(r"\b(main[- ]?d[’']œuvre|op[ée]rateur|personnel|humain|ressource[s]?\b)", query, re.IGNORECASE):
        return prompt_8D_4_main_oeuvre

    # 5M : Matériel
    if re.search(r"\b(mat[ée]riel|machine|[ée]quipement|outil)\b", query, re.IGNORECASE):
        return prompt_8D_4_materiel

    # 5M : Milieu
    if re.search(r"\b(milieu|environnement|temp[ée]rature|humidit[ée]|site|local)\b", query, re.IGNORECASE):
        return prompt_8D_4_milieu

    # 5M : Matière
    if re.search(r"\b(mati[èe]re|composant|pi[èe]ce|produit|input|fourniture)\b", query, re.IGNORECASE):
        return prompt_8D_4_matiere

    # Analyse des 5 pourquoi
    if re.search(r"\b(5\s*pourquoi|5\s*why|pourquoi\s+\w+(\s+)?){2,}", query, re.IGNORECASE):
        return prompt_8D_4_5why

    # Étape D5 — séparation correctif / préventif
    if re.search(r"\b(action[s]?\s+corrective[s]?|solution.*(permanente|définitive)|corriger)\b", query, re.IGNORECASE):
        return prompt_8D_5_corrective

    if re.search(r"\b(action[s]?\s+pr[ée]ventive[s]?|emp[êe]cher|anticiper|r[ée]cidive|r[ée]apparition|pr[ée]venir)\b", query, re.IGNORECASE):
        return prompt_8D_5_preventive

    # Étape D6
    if re.search(r"\b(d6|mise.*en.*oeuvre|implantation|impl[ée]menter)\b", query, re.IGNORECASE):
        return prompt_8D_6

    # Étape D7
    if re.search(r"\b(d7|efficacit[ée]|v[ée]rification|r[ée]sultat.*action)\b", query, re.IGNORECASE):
        return prompt_8D_7

    # Étape D8
    if re.search(r"\b(d8|retour.*exp[ée]rience|capitalisation|partage.*le[çc]ons)\b", query, re.IGNORECASE):
        return prompt_8D_8

    # Prompt fallback si aucune étape 8D détectée
    return rag_8D_prompt
