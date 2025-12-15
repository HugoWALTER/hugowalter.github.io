# Utiliser une image Nginx légère comme base
FROM nginx:alpine

# Copier les fichiers statiques du projet vers le dossier par défaut de Nginx
COPY . /usr/share/nginx/html

# Exposer le port 80
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
