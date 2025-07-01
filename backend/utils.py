# backend/utils/doc_processing.py

from typing import List, Dict
from langchain_core.documents import Document

def build_sources(docs: List[Document], mode: str = "RAG") -> List[Dict]:
    """
    Construit une liste de sources client à partir de documents, selon le mode (RAG ou REQ).
    """
    sources = []
    for doc in docs:
        meta = getattr(doc, "metadata", {})
        content = getattr(doc, "page_content", "")

        if mode == "REQ":
            description = meta.get("Description du problème 0D") or (content[:200] + "..." if content else "N/A")
            nc_id = meta.get("Identification NC 0D", "Inconnu")
            sources.append({
                "content": description,
                "nc_id": nc_id,
            })
        else:  # mode RAG
            nc_id = meta.get("id_non_conformite", "ID NC Manquant")
            source_file = meta.get("nom_fichier_source", "Source Manquante")
            preview = (content or "")[:150] + "..."
            sources.append({
                "nc_id": nc_id,
                "source_file": source_file,
                "preview": preview,
            })

    return sources
