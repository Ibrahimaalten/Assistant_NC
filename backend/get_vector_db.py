from langchain_chroma import Chroma
import chromadb
# Assurez-vous que le chemin d'import est correct pour votre projet
from .embed import get_embedding_model, get_collection_name_from_model_id
from config import get_model_id
DB_DIR = "C:/Users/lrodembourg/Documents/Test_Langchain/chroma_db" # Assurez-vous que c'est le bon chemin si vous utilisez persist_directory

# --- NOUVEAU : Initialisation du client persistant au niveau du module ---
# C'est la meilleure pratique. Le client est créé une seule fois et sait où trouver la base de données.
try:
    persistent_client = chromadb.PersistentClient(path=DB_DIR)
    print(f"INFO: Client ChromaDB connecté à la base de données persistante à l'adresse : {DB_DIR}")
except Exception as e:
    print(f"ERREUR CRITIQUE: Impossible d'initialiser le client ChromaDB à '{DB_DIR}'. Erreur: {e}")
    persistent_client = None

# --- VOTRE FONCTION get_vectorstore CORRIGÉE ---

def get_vectorstore(model_key: str | None = None):
    """
    Récupère un vectorstore pour une collection EXISTANTE de manière stricte.
    Lève une exception si la collection n'existe pas, au lieu de la créer.
    """
    if not persistent_client:
        raise ConnectionError(f"Le client ChromaDB n'a pas pu être initialisé. Vérifiez le chemin '{DB_DIR}'.")

    # 1. Obtenir les informations du modèle et le nom de la collection
    model_id = get_model_id(model_key)
    collection_name = get_collection_name_from_model_id(model_id)
    print(f"[VECTORSTORE] Tentative de connexion au modèle '{model_key}' (collection: '{collection_name}')")

    # 2. VÉRIFICATION STRICTE DE L'EXISTENCE DE LA COLLECTION
    try:
        # On utilise le client pour obtenir la collection. C'est une opération "lecture seule".
        # Si la collection n'existe pas, cela lèvera une ValueError.
        collection = persistent_client.get_collection(name=collection_name)
        print(f"INFO: Connexion réussie à la collection existante '{collection.name}' (contient {collection.count()} documents).")
    except ValueError:
        # On intercepte l'erreur pour donner un message clair.
        error_message = f"La collection '{collection_name}' n'a pas été trouvée. Veuillez d'abord ingérer les documents pour ce modèle."
        print(f"ERREUR: {error_message}")
        # On lève une nouvelle exception pour que l'API puisse la gérer et retourner une erreur HTTP 404.
        raise ValueError(error_message)

    # 3. Si tout va bien, on obtient le modèle d'embedding et on crée l'objet LangChain
    embedding_model = get_embedding_model(model_id)
    
    # On initialise l'objet LangChain Chroma en utilisant le client déjà connecté.
    # C'est la méthode la plus propre et la plus sûre.
    vectorstore = Chroma(
        client=persistent_client,
        collection_name=collection_name,
        embedding_function=embedding_model
    )
    
    return vectorstore