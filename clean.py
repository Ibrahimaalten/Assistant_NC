import pandas as pd

# Remplace par le chemin réel de ton fichier source et de sortie
input_path = "documents/NC5.csv.csv"
output_path = "documents/NC5_clean.csv"

# Détection automatique du séparateur
seps = [';', ',', '\t']
for sep in seps:
    try:
        df = pd.read_csv(input_path, sep=sep)
        if len(df.columns) > 1:
            break
    except Exception:
        continue
else:
    raise ValueError("Impossible de lire le CSV avec les séparateurs courants.")

# Suppression de la première colonne (index 0)
df = df.iloc[:, 1:]

# Sauvegarde du fichier nettoyé
df.to_csv(output_path, sep=';', index=False, encoding='utf-8')
print(f"Fichier nettoyé sauvegardé sous : {output_path}")