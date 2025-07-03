AVAILABLE_EMBEDDING_MODELS = {
    "qwen_base": "dengcao/Qwen3-Embedding-0.6B:f16",
    "dengcao_qwen3_4b": "dengcao/Qwen3-Embedding-4B:q5_K_M",
    "snowflake2": "snowflake-arctic-embed2:latest"
    # Ajoutez d'autres modèles que vous voulez tester ici
}

# Modèle par défaut à utiliser si aucun n'est spécifié
DEFAULT_EMBEDDING_MODEL_KEY = "qwen_base"

# Fonction utilitaire pour obtenir l'identifiant technique à partir de la clé
def get_model_id(model_key: str | None) -> str:
    """Retourne l'ID du modèle à partir de sa clé. Utilise le défaut si invalide."""
    if not model_key or model_key not in AVAILABLE_EMBEDDING_MODELS:
        model_key = DEFAULT_EMBEDDING_MODEL_KEY
    return AVAILABLE_EMBEDDING_MODELS[model_key]
