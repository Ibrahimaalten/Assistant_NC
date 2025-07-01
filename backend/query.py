from langchain_community.vectorstores import Chroma
from langchain_ollama import ChatOllama
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate # Pour le prompt par défaut
from backend.utils import  build_sources
from backend.routeur import detect_prompt
from backend.get_vector_db import get_vectorstore
from backend.retrieval import get_relevant_documents

# Configuration
DB_DIR = "C:/Users/lrodembourg/Documents/Test_Langchain/chroma_db"
ollama_endpoint = "http://localhost:11434"

def query_documents(query_text, ):
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
    retrieved_docs = retriever.invoke(query_text)
    from langchain.chains.combine_documents import create_stuff_documents_chain
    from langchain.chains import create_retrieval_chain
    question_answer_chain = create_stuff_documents_chain(llm, selected_prompt)
    rag_chain = create_retrieval_chain(lambda q: retrieved_docs, question_answer_chain)
    result = rag_chain.invoke({"input": query_text})
    sources = []
    for doc in result.get("context", []):
        source = {
            "content": doc.page_content[:200] + "...",
            "nc_id": doc.metadata.get("id_non_conformite", "Inconnu"),
            "source": doc.metadata.get("nom_fichier_source", "Unknown")
        }
        sources.append(source)
    return result["answer"], sources

async def query_documents_with_context(query_text: str, form_data: dict, current_section_data: dict, current_section_name: str, stream: bool, model_key:int):
    print(f"RAG: Requête: '{query_text}' pour section '{current_section_name}' ")
    # 2. Initialisation et récupération des documents
    try:
        retrieved_docs = get_relevant_documents(
            query_text=query_text,
            current_section_data=current_section_data,
            current_section_name=current_section_name,
            form_data=form_data, # On passe le form_data complet
            model_key=model_key, # On passe le model_key pour flexibilité
        )
    except Exception as e_ret:
        print(f"ERREUR RAG: Échec de la récupération des documents: {e_ret}")
        error_message_for_client = f"Désolé, une erreur est survenue lors de la recherche d'informations : {e_ret}"
        yield {"response": error_message_for_client, "error": str(e_ret)}
        yield {"done": True, "sources": [], "suggested_field_update": None}
        return

    # 3. Construction des sources pour le client
    sources_for_client = build_sources(retrieved_docs, mode="RAG")
    
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
    return # Fin du générateur asynchrone