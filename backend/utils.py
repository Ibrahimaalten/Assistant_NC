# backend/utils/doc_processing.py

from typing import List, Dict
from langchain_core.documents import Document

def build_sources(docs: List[Document], mode: str = "RAG") -> List[Dict]:
    sources = []
    for doc in docs:
        meta = getattr(doc, "metadata", {})
        content = getattr(doc, "page_content", "")
        nc_id = meta.get("id_non_conformite") or meta.get("Identification NC 0D", "Inconnu")
        source_file = meta.get("nom_fichier_source", "Source Manquante")
        preview = (content or "")[:150] + "..."
        # Toujours fournir les mêmes clés
        sources.append({
            "nc_id": nc_id,
            "content": meta.get("Description du problème 0D") or preview,
            "preview": preview,
            "source_file": source_file,
        })
    return sources