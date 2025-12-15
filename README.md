# 📝 MeetingsNoteAI

**MeetingsNoteAI** est un outil simple qui vous permet de générer automatiquement des comptes-rendus de réunion professionnels à partir d'un transcript (enregistrement écrit) et d'une liste de participants grâce à l'Intelligence Artificielle.

## 🚀 Comment lancer l'outil ?

Pas besoin d'installation complexe !

1. Téléchargez ou ouvrez le dossier du projet sur votre ordinateur.
2. Cherchez le fichier nommé **[index.html](index.html)**.
3. Double-cliquez dessus pour l'ouvrir dans votre navigateur web habituel (Chrome, Edge, Firefox, etc.).

## 📖 Guide d'utilisation étape par étape

Une fois la page ouverte, suivez ces 4 étapes :

### 1. Configuration de l'IA 🔑

* **Clé API** : Entrez votre clé d'accès API ou (Token Bearer). C'est le mot de passe qui vous permet d'utiliser l'intelligence artificielle.
* **URL de l'API** : Laissez la valeur par défaut (`https://api.openai.com/v1`) sauf si on vous a donné une autre adresse.
* **Modèle** : Vous pouvez choisir le modèle d'IA (par défaut "Standard"). Cliquez sur le bouton 🔄 pour rafraîchir la liste si besoin.

### 2. Chargement des fichiers ou Texte 📂

Vous devez fournir deux types d'informations :

* **👥 Participants** : La liste des personnes présentes.
* **💬 Transcript** : Le texte brut de la réunion (ce qui a été dit).

Pour chaque section, vous avez le choix :

* **Onglet Fichier** : Glissez-déposez un fichier (`.txt`, `.csv` pour les participants ; `.docx`, `.txt` pour le transcript).
* **Onglet Texte** : Copiez-collez directement le texte si vous n'avez pas de fichier.

### 3. Personnalisation et Lancement ✍️

Avant de générer, vous pouvez affiner le résultat :

* **Langue** : Choisissez le drapeau 🇫🇷 ou 🇬🇧 pour définir la langue du compte-rendu.
* **Prompt** : Cliquez sur "▶ Afficher / Modifier le prompt" si vous souhaitez voir ou modifier les consignes données à l'IA.
* Cliquez sur le bouton bleu **"🚀 Générer le Compte-Rendu"**.

### 4. Résultat et Finitions 📄

* Patientez quelques instants pendant que l'IA travaille.
* Le compte-rendu s'affiche à l'écran.
* **Copier** : Cliquez sur "📋 Copier" pour récupérer le texte et le coller dans un mail ou un document Word.
* **Envoyer par mail** : Cliquez sur "📧 Envoyer par mail" pour ouvrir votre logiciel de messagerie par défaut avec le compte-rendu pré-rempli.
* **Modifier** : Si le résultat ne vous convient pas, cliquez sur "💭 Donner un Retour", expliquez ce qu'il faut changer, et relancez la génération.

---

## 🐳 Déploiement via Docker

Si vous préférez héberger l'application sur un serveur ou utiliser Docker en local :

1. Assurez-vous d'avoir **Docker** et **Docker Compose** installés.
2. Ouvrez un terminal à la racine du projet.
3. Lancez la commande suivante :

```bash
docker-compose -f docker/docker-compose.yml up -d --build
```

L'application sera accessible à l'adresse : `http://localhost:8080`

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.
