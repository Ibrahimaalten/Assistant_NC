# Étape 1 : build du frontend avec Vite
FROM node:18-alpine AS builder

WORKDIR /app

# Copie des fichiers nécessaires pour l'installation
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du reste du projet
COPY . .

# Build de l'application pour la production
RUN npm run build


# Étape 2 : serveur statique avec NGINX
FROM nginx:stable-alpine

# Suppression de la config NGINX par défaut
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copie de ta propre config NGINX (voir ci-dessous)
COPY nginx.conf /etc/nginx/conf.d

# Copie du build de Vite vers le dossier public de NGINX
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
