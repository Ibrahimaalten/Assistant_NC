from langchain_community.vectorstores import Chroma
from langchain_ollama import ChatOllama
from backend.routeur import detect_prompt
from backend.get_vector_db import get_vectorstore
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate # Pour le prompt par défaut


# Configuration
DB_DIR = "C:/Users/lrodembourg/Documents/Test_Langchain/chroma_db"
ollama_endpoint = "http://localhost:11434"



def query_documents(query_text):
    vectorstore = get_vectorstore()

    llm = ChatOllama(
        model="qwen3:14b",
        num_ctx=4096,
        temperature=0.5,
        base_url=ollama_endpoint,
    )

    selected_prompt = detect_prompt(query_text)
    # Création des composants RAG
    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
    from langchain.chains.combine_documents import create_stuff_documents_chain
    from langchain.chains import create_retrieval_chain
    question_answer_chain = create_stuff_documents_chain(llm, selected_prompt)
    rag_chain = create_retrieval_chain(retriever, question_answer_chain)

    # Exécution
    result = rag_chain.invoke({"input": query_text})

    # Extraction des sources
    sources = []
    for doc in result.get("context", []):  # 'context' contient les documents récupérés
        source = {
            "content": doc.page_content[:200] + "...",
            "nc_id": doc.metadata.get("id_non_conformite", "Inconnu"),
            "source": doc.metadata.get("nom_fichier_source", "Unknown")
        }
        sources.append(source)

    return result["answer"], sources  # Retourne la réponse et les sources

async def query_documents_with_context(query_text: str, form_data: dict, current_section_data: dict, current_section_name: str, stream: bool):
    print(f"RAG: Requête: '{query_text}' pour section '{current_section_name}'")

    # 1. Construction de la requête enrichie pour le retriever
    if not query_text.strip():
        description_nc_initiale = form_data.get('d0_initialisation', {}).get('Description du problème 0D', '')
        if description_nc_initiale:
            enriched_query_for_retriever = f"Analyse de la non-conformité : {description_nc_initiale}"
        else:
            enriched_query_for_retriever = f"Analyse du formulaire 8D, section {current_section_name}"
    else:
        enriched_query_for_retriever = query_text
        if current_section_data:
            context_fields_text = ' '.join([str(v) for k, v in current_section_data.items() if v and k != 'id'])
            if context_fields_text:
                enriched_query_for_retriever += f" (contexte de {current_section_name}: {context_fields_text})"
    print(f"RAG: Requête Enrichie pour RETRIEVER: '{enriched_query_for_retriever}'")

    # 2. Initialisation et récupération des documents
    vectorstore = get_vectorstore()
    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
    retrieved_docs = []
    try:
        retrieved_docs = retriever.invoke(enriched_query_for_retriever)
        print(f"RAG: {len(retrieved_docs)} documents récupérés.")
        for i, doc_debug in enumerate(retrieved_docs): # Logs de débogage des métadonnées
            print(f"  Doc récupéré {i} - METADATA COMPLÈTE: {doc_debug.metadata if hasattr(doc_debug, 'metadata') else 'PAS DE METADATA'}")
            if hasattr(doc_debug, 'metadata'):
                print(f"    -> id_non_conformite: {doc_debug.metadata.get('id_non_conformite', 'NON TROUVÉ')}")
                print(f"    -> nom_fichier_source: {doc_debug.metadata.get('nom_fichier_source', 'NON TROUVÉ')}")
    except Exception as e_ret:
        print(f"ERREUR RAG: Échec de la récupération des documents: {e_ret}")
        error_message_for_client = f"Désolé, une erreur est survenue lors de la recherche d'informations : {e_ret}"
        yield {"response": error_message_for_client, "error": str(e_ret)}
        yield {"done": True, "sources": [], "suggested_field_update": None}
        return

    # 3. Construction des sources pour le client
    sources_for_client = []
    if retrieved_docs:
        for doc_item in retrieved_docs:
            if not hasattr(doc_item, 'metadata'): continue
            nc_id = doc_item.metadata.get("id_non_conformite", "ID NC Manquant") # ADAPTE CETTE CLÉ
            nom_fichier = doc_item.metadata.get("nom_fichier_source", "Source Manquante") # ADAPTE CETTE CLÉ
            source_entry = { "nc_id": nc_id, "source_file": nom_fichier, "preview": doc_item.page_content[:150] + "..." if hasattr(doc_item, 'page_content') else "N/A"}
            sources_for_client.append(source_entry)
    print(f"RAG: Sources construites pour le client: {sources_for_client}")

    # 4. Formatage du contexte pour le LLM (basé sur retrieved_docs)
    context_to_pass_to_llm = [] # Initialisation
    if retrieved_docs:
        print(f"RAG: Formatage du contexte pour le LLM à partir de {len(retrieved_docs)} documents.")
        temp_formatted_docs = []
        for i, doc_to_format in enumerate(retrieved_docs):
            if not hasattr(doc_to_format, 'metadata'):
                if hasattr(doc_to_format, 'page_content') and doc_to_format.page_content:
                    temp_formatted_docs.append(Document(page_content=doc_to_format.page_content, metadata={}))
                continue
#Quelle partie spécifique du document doit on envoyé en fonction de l'étape actuelle  
            nc_id_ctx = doc_to_format.metadata.get("id_non_conformite", "Non spécifié")
            desc_probleme_ctx = doc_to_format.metadata.get("Description du problème 0D", "")
            cause_racine_ctx = doc_to_format.metadata.get("Cause Racine 4D", "")
            actions_5d_ctx = doc_to_format.metadata.get("Action(s) systémique(s) 5D", "")
            
            single_doc_context_parts = [f"--- Document Pertinent Réf. NC: {nc_id_ctx} ---"]
            if desc_probleme_ctx: single_doc_context_parts.append(f"Description du Problème: {desc_probleme_ctx}")
            if cause_racine_ctx: single_doc_context_parts.append(f"Cause Racine Identifiée: {cause_racine_ctx}")
            if actions_5d_ctx: single_doc_context_parts.append(f"Actions Correctives (5D): {actions_5d_ctx}")
            if hasattr(doc_to_format, 'page_content') and doc_to_format.page_content:
                 single_doc_context_parts.append(f"Informations textuelles complémentaires du document:\n{doc_to_format.page_content}")
            
            formatted_page_content_for_llm = "\n".join(single_doc_context_parts) + "\n--- Fin Document Pertinent ---\n"
            
            temp_formatted_docs.append(
                Document(page_content=formatted_page_content_for_llm, metadata=doc_to_format.metadata)
            )
        context_to_pass_to_llm = temp_formatted_docs # Assigne la liste formatée
            
    if not context_to_pass_to_llm:
        print("RAG: Aucun contexte de document à passer au LLM, utilisation d'un message par défaut.")
        context_to_pass_to_llm = [Document(page_content="Information contextuelle non disponible.")]

    # 5. Préparation chaîne LLM
    llm = ChatOllama(model="qwen3:14b", num_ctx=8192, temperature=0.7, base_url=ollama_endpoint)
    selected_prompt = detect_prompt(query_text, step=current_section_name if 'step' in detect_prompt.__code__.co_varnames else None)

    # LOG PROMPT COMPLET
    # Récupère le template string du prompt
    if hasattr(selected_prompt, 'format') and hasattr(selected_prompt, 'template'):
        prompt_template_str = selected_prompt.template
    elif isinstance(selected_prompt, str):
        prompt_template_str = selected_prompt
    else:
        prompt_template_str = str(selected_prompt)
    # Construit le contexte texte (concatène tous les docs)
    context_text = "\n\n".join([doc.page_content for doc in context_to_pass_to_llm]) if context_to_pass_to_llm else ""
    prompt_complet = prompt_template_str.replace('{context}', context_text).replace('{input}', query_text)
    print("\n========== PROMPT LLM COMPLET ==========")
    print(prompt_complet)
    print("========== FIN PROMPT LLM COMPLET ==========")

    if not selected_prompt or not (isinstance(selected_prompt, str) and "{context}" in selected_prompt and "{input}" in selected_prompt) and \
       not (hasattr(selected_prompt, 'input_variables') and "context" in selected_prompt.input_variables and "input" in selected_prompt.input_variables):
        print("AVERTISSEMENT RAG: 'selected_prompt' invalide. Utilisation d'un prompt par défaut.")
        default_prompt_str = "Contexte:\n{context}\n\nQuestion: {input}\n\nRéponse:"
        selected_prompt = ChatPromptTemplate.from_template(default_prompt_str)

    from langchain.chains.combine_documents import create_stuff_documents_chain
    question_answer_chain = create_stuff_documents_chain(llm, selected_prompt)

    # 6. Logique de Streaming ou Non-Streaming
    if stream:
        chain_input = {"input": query_text, "context": context_to_pass_to_llm}
        full_answer = ""
        try:
            async for chunk_content_obj in question_answer_chain.astream(chain_input):
                delta = getattr(chunk_content_obj, 'content', str(chunk_content_obj) if isinstance(chunk_content_obj, str) else "")
                if delta:
                    full_answer += delta
                    yield {"response": full_answer}
        except Exception as e_llm_stream:
            print(f"ERREUR RAG STREAM: Échec du stream LLM: {e_llm_stream}")
            yield {"response": f"Erreur durant la génération de la réponse: {e_llm_stream}", "error": str(e_llm_stream)}

        suggested_field_update = None
        if (not query_text.strip() or "sponsor" in query_text.lower()) and current_section_name == "d1_team" and not form_data.get('d1_team', {}).get('Sponsor'):
            suggested_field_update = {"section": "d1_team", "field": "Sponsor", "value": "Nom du Sponsor à définir"}
        
        print(f"RAG STREAM: Yield final: sources: {sources_for_client}, suggestion: {suggested_field_update}")
        yield {"done": True, "sources": sources_for_client, "suggested_field_update": suggested_field_update}
    
    else: # Branche non-streamée
        print(f"--- DÉBUT LOGIQUE NON-STREAMING ---")
        chain_input_non_stream = {"input": query_text, "context": context_to_pass_to_llm}
        answer_non_stream = "[Réponse non initialisée]"
        try:
            result_obj_llm = await question_answer_chain.ainvoke(chain_input_non_stream)
            answer_non_stream = result_obj_llm
            if hasattr(result_obj_llm, 'content'): answer_non_stream = result_obj_llm.content
            elif not isinstance(result_obj_llm, str): answer_non_stream = str(result_obj_llm)
        except Exception as e_llm_invoke:
            print(f"ERREUR NON-STREAM: Échec de l'appel LLM: {e_llm_invoke}")
            answer_non_stream = f"Erreur lors de la génération de la réponse : {e_llm_invoke}"
        
        suggested_field_update = None
        if (not query_text.strip() or "sponsor" in query_text.lower()) and current_section_name == "d1_team" and not form_data.get('d1_team', {}).get('Sponsor'):
            suggested_field_update = {"section": "d1_team", "field": "Sponsor", "value": "Nom du Sponsor à définir"}

        print(f"NON-STREAM: Yielding single response object. Answer: '{str(answer_non_stream)[:50]}...', Sources: {len(sources_for_client)}")
        yield {
            "response": str(answer_non_stream),
            "sources": sources_for_client,
            "suggested_field_update": suggested_field_update,
            "done": True
        }
    return # Fin du générateur asynchrone