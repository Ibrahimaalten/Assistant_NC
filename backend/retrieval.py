from .get_vector_db import get_vectorstore



def get_relevant_documents(
    query_text: str,
    current_section_data: dict,
    current_section_name: str,
    form_data: dict | None = None, # Rend form_data optionnel
    k: int = 5,
    model_key : int | None = None, # Ajout de model_key pour la flexibilité
):
    # <<< AJOUTEZ CE BLOC DE DEBUG >>>
    print("\n" + "="*50)
    print("DEBUG DANS get_relevant_documents")
    print(f"  - query_text (reçu): '{query_text}'")
    print(f"  - current_section_name (reçu): '{current_section_name}'")
    print(f"  - current_section_data (reçu): {current_section_data}")
    print(f"  - form_data (reçu): {'OUI' if form_data else 'NON'}") # Juste pour voir s'il est là
    if form_data:
        print(f"    - d0_initialisation dans form_data: {form_data.get('d0_initialisation', 'NON TROUVÉ')}")
    print("="*50 + "\n")
    # <<< FIN DU BLOC DE DEBUG >>>
    # 1. Enrichissement de la requête
    """
    Construit la requête enrichie, récupère les documents pertinents et les retourne.
    C'est la fonction centralisée pour le retrieval.
    """
    
    # 1. Construction de la requête enrichie pour le retriever
    if not query_text.strip() and form_data: # On vérifie si form_data est fourni
        description_nc_initiale = form_data.get('d0_initialisation', {}).get('descriptionInitiale', '')
        if description_nc_initiale:
            enriched_query = f"Analyse de la non-conformité : {description_nc_initiale}"
        else:
            enriched_query = f"Analyse du formulaire 8D, section {current_section_name}"
    else:
        enriched_query = query_text
        if current_section_data:
            context_fields_text = ' '.join([str(v) for k, v in current_section_data.items() if v and k != 'id'])
            if context_fields_text:
                enriched_query += f" (contexte de {current_section_name}: {context_fields_text})"
    
    print(f"[RETRIEVAL] Requête enrichie: '{enriched_query}'")

    # 2. Récupération
    vectorstore = get_vectorstore(model_key=model_key)
    retriever = vectorstore.as_retriever(search_kwargs={"k": k})
    docs = retriever.invoke(enriched_query)
    
    print(f"[RETRIEVAL] {len(docs)} documents récupérés.")
    return docs