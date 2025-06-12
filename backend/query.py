from langchain_ollama.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_ollama import ChatOllama
from backend.routeur import detect_prompt
from backend.get_vector_db import get_vectorstore

# Configuration
DB_DIR = "./chroma_db"
ollama_endpoint = "http://localhost:11434"


def test_retriever():
    vectorstore = get_vectorstore()
    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

    # Lance une requête de test (tu peux remplacer "test" par une vraie question)
    docs = retriever.invoke("test")

    print(f"Nombre de documents récupérés : {len(docs)}")
    print("-" * 80)

    for i, doc in enumerate(docs):
        print(f"\nDocument {i + 1}")
        print("—" * 50)
        print("Metadata:", doc.metadata)
        print("\nContenu (premiers 300 caractères) :\n", doc.page_content[:300] + "...")
        print("—" * 80)

def query_documents(query_text):
    vectorstore = get_vectorstore()

    llm = ChatOllama(
        model="qwen3:4b",
        num_ctx=4096,
        temperature=0,
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
            "nc_id": doc.metadata.get("Identification_NC", "Inconnu"),
            "source": doc.metadata.get("source", "Unknown")
        }
        sources.append(source)

    return result["answer"], sources  # Retourne la réponse et les sources

def query_documents_with_context(query_text: str, form_data: dict, current_section_data: dict, current_section_name: str):
    print(f"RAG: Requête: '{query_text}'")
    print(f"RAG: Données 8D complètes reçues: {bool(form_data)}")
    print(f"RAG: Contenu des données 8D reçues : {form_data}")
    print(f"RAG: Données de la section '{current_section_name}' reçues: {bool(current_section_data)}")

    # 1. Générer dynamiquement la requête de similarité
    # Si l'utilisateur ne pose pas de question (query_text vide), on construit une requête basée sur le contexte
    if not query_text.strip():
        # Exemple : on prend la description de la non-conformité si elle existe (Initialisation)
        description_nc = form_data.get('initialisation', {}).get('description', '')
        enriched_query = f"Suggestion automatique basée sur la description : {description_nc}" if description_nc else "Suggestion automatique basée sur le contexte du formulaire 8D."
    else:
        # Sinon, on enrichit la question avec les champs pertinents de l'étape courante
        enriched_query = query_text
        # Ajout d'informations contextuelles selon l'étape courante
        if current_section_data:
            # On concatène tous les champs non vides de la section courante
            context_fields = ' '.join([str(v) for v in current_section_data.values() if v])
            if context_fields:
                enriched_query += f" (contexte de l'étape {current_section_name}: {context_fields})"
        # Ajout d'informations de l'étape précédente si possible
        step_order = [
            'd0_initialisation',
  'd1_team',
  'd2_problem',
  'd3_containment',
  'd4_rootcause',
  'd5_correctiveactions',
  'd6_implementvalidate',
  'd7_preventrecurrence',
  'd8_congratulate'
        ]
        if current_section_name in step_order:
            idx = step_order.index(current_section_name)
            if idx > 0:
                prev_step = step_order[idx-1]
                prev_data = form_data.get(prev_step, {})
                prev_fields = ' '.join([str(v) for v in prev_data.values() if v])
                if prev_fields:
                    enriched_query += f" (contexte de l'étape précédente {prev_step}: {prev_fields})"
        # On peut aussi ajouter des infos clés d'étapes précédentes si pertinent (exemple : description NC)
        # if current_section_name != 'initialisation':
        #     description_nc = form_data.get('d0_initialisation', {}).get('description_du_probleme', '')
        #     if description_nc:
        #         enriched_query += f" (description NC: {description_nc})"

    # 2. Utiliser la vraie logique RAG
    vectorstore = get_vectorstore()
    llm = ChatOllama(
        model="qwen3:4b",
        num_ctx=4096,
        temperature=0,
        base_url=ollama_endpoint,
    )
    # 3. Choix dynamique du prompt
    selected_prompt = detect_prompt(enriched_query, step=current_section_name if 'step' in detect_prompt.__code__.co_varnames else None)
    from langchain.chains.combine_documents import create_stuff_documents_chain
    from langchain.chains import create_retrieval_chain
    
    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
    question_answer_chain = create_stuff_documents_chain(llm, selected_prompt)
    rag_chain = create_retrieval_chain(retriever, question_answer_chain)

    # 4. Exécution réelle
    result = rag_chain.invoke({"input": enriched_query})

    # 5. Extraction réelle des sources
    sources = []
    for doc in result.get("context", []):
        source = {
            "content": doc.page_content[:200] + "...",
            "nc_id": doc.metadata.get("Identification_NC", "Inconnu"),
            "source": doc.metadata.get("source", "Unknown")
        }
        sources.append(source)

    # 6. Suggestion de mise à jour de champ (exemple, à adapter selon ta logique)
    suggested_field_update = None
    # Exemple : suggestion automatique pour le sponsor à l'étape D1
    if (not query_text.strip() or "sponsor" in query_text.lower()) and "d1_team" == current_section_name and not form_data.get('d1_team',{}).get('Sponsor'):
        suggested_field_update = {
            "section": "d1_team",
            "field": "Sponsor",
            "value": "Nom du Sponsor à ajouter"
        }

    return result["answer"], sources, suggested_field_update
