// État de l'application
let participantsContent = '';
let transcriptContent = '';
let lastGeneratedText = '';
let conversationHistory = [];

// Éléments DOM
const apiKeyInput = document.getElementById('apiKey');
const apiEndpointInput = document.getElementById('apiEndpoint');
const modelNameInput = document.getElementById('modelName');
const participantsFileInput = document.getElementById('participantsFile');
const transcriptFileInput = document.getElementById('transcriptFile');
const participantsText = document.getElementById('participantsText');
const transcriptText = document.getElementById('transcriptText');
const clearParticipantsTextBtn = document.getElementById('clearParticipantsText');
const clearTranscriptTextBtn = document.getElementById('clearTranscriptText');
const participantsPreview = document.getElementById('participantsPreview');
const transcriptPreview = document.getElementById('transcriptPreview');
const customPrompt = document.getElementById('customPrompt');
const generateBtn = document.getElementById('generateBtn');
const resultSection = document.getElementById('resultSection');
const resultDiv = document.getElementById('result');
const copyBtn = document.getElementById('copyBtn');
const emailBtn = document.getElementById('emailBtn');
const feedbackBtn = document.getElementById('feedbackBtn');
const feedbackSection = document.getElementById('feedbackSection');
const feedbackText = document.getElementById('feedbackText');
const regenerateBtn = document.getElementById('regenerateBtn');
const loadingSection = document.getElementById('loadingSection');
const refreshModelsBtn = document.getElementById('refreshModelsBtn');
const resetPromptBtn = document.getElementById('resetPromptBtn');
const toggleApiKeyBtn = document.getElementById('toggleApiKeyBtn');

let currentLanguage = 'fr';

const DEFAULT_PROMPT = `Tu es un assistant expert en rédaction de comptes-rendus de réunion professionnels.

À partir des informations fournies, tu dois rédiger un compte-rendu clair, structuré et synthétique.

Instructions :
1. Débute par un titre approprié pour le compte-rendu en commençant par l'objet de la réunion.
2. Commence par lister les participants de la réunion
3. Fais une introduction brève du contexte
4. Organise les points discutés de manière logique avec des sections claires
5. Pour chaque point important, indique :
   - Le sujet abordé
   - Les décisions prises
   - Les actions à mener (avec responsables si mentionnés)
6. Termine par une conclusion et les prochaines étapes

Format attendu :
- Format texte brut .txt pour un envoi par mail sans formatage markdown
- Utilise des titres et sous-titres
- Sois concis mais complet
- Utilise des puces pour les listes
- Mets en évidence les décisions et actions importantes
- Respecter la structure de la trame et l'étoffer si nécessaire.
- Ne pas extrapoler ni inventer d’informations absentes.

Participants :
{PARTICIPANTS}

Transcript de la réunion :
{TRANSCRIPT}`;

// Gestion des onglets
function setupTabs(wrapperId) {
    const wrapper = document.getElementById(wrapperId);
    const tabs = wrapper.querySelectorAll('.tab-btn');
    const modes = wrapper.querySelectorAll('.input-mode');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Activer l'onglet
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Afficher le mode correspondant
            const target = tab.dataset.target;
            modes.forEach(mode => {
                if (mode.classList.contains(`mode-${target}`)) {
                    mode.style.display = 'flex';
                } else {
                    mode.style.display = 'none';
                }
            });
            
            checkInputs();
        });
    });
}

setupTabs('participantsWrapper');
setupTabs('transcriptWrapper');

// Gestion de l'effacement du texte
function setupTextClear(textarea, button) {
    textarea.addEventListener('input', () => {
        button.style.display = textarea.value.trim() ? 'block' : 'none';
        checkInputs();
    });

    button.addEventListener('click', () => {
        textarea.value = '';
        button.style.display = 'none';
        checkInputs();
    });
}

setupTextClear(participantsText, clearParticipantsTextBtn);
setupTextClear(transcriptText, clearTranscriptTextBtn);

// Récupérer le contenu combiné (Fichier + Texte)
function getActiveContent(wrapperId, fileContent, textInputId) {
    // On combine le contenu du fichier et du champ texte, quel que soit l'onglet actif
    const textContent = document.getElementById(textInputId).value.trim();
    const parts = [];

    if (fileContent && fileContent.trim()) {
        parts.push(fileContent.trim());
    }

    if (textContent) {
        let prefix = "INFORMATIONS COMPLÉMENTAIRES AJOUTÉES MANUELLEMENT (À PRENDRE EN COMPTE IMPÉRATIVEMENT) :\n";
        
        // Personnalisation du message selon le contexte
        if (wrapperId === 'participantsWrapper') {
            prefix = "PARTICIPANTS SUPPLÉMENTAIRES AJOUTÉS MANUELLEMENT (À FAIRE FIGURER OBLIGATOIREMENT DANS LA LISTE) :\n";
        } else if (wrapperId === 'transcriptWrapper') {
            prefix = "NOTES OU TRANSCRIPT SUPPLÉMENTAIRE AJOUTÉ MANUELLEMENT (À INTÉGRER OBLIGATOIREMENT AU COMPTE-RENDU) :\n";
        }

        parts.push(prefix + textContent);
    }

    return parts.join('\n\n');
}

// Vérifier l'état des entrées pour activer/désactiver le bouton
function checkInputs() {
    const hasApiKey = apiKeyInput.value.trim() !== '';
    const hasEndpoint = apiEndpointInput.value.trim() !== '';
    const hasModel = modelNameInput.value.trim() !== '';
    
    const currentParticipants = getActiveContent('participantsWrapper', participantsContent, 'participantsText');
    const currentTranscript = getActiveContent('transcriptWrapper', transcriptContent, 'transcriptText');
    
    const hasParticipants = currentParticipants !== '';
    const hasTranscript = currentTranscript !== '';
    const hasPrompt = customPrompt.value.trim() !== '';

    generateBtn.disabled = !(hasApiKey && hasEndpoint && hasModel && hasParticipants && hasTranscript && hasPrompt);
}

// Ajouter les écouteurs d'événements pour la validation en temps réel
apiKeyInput.addEventListener('input', checkInputs);
apiEndpointInput.addEventListener('input', checkInputs);
modelNameInput.addEventListener('change', checkInputs);
customPrompt.addEventListener('input', checkInputs);
participantsText.addEventListener('input', checkInputs);
transcriptText.addEventListener('input', checkInputs);

// Initialiser l'état du bouton
generateBtn.disabled = true;

// Charger les modèles
async function fetchModels() {
    const apiKey = apiKeyInput.value.trim();
    const apiEndpoint = apiEndpointInput.value.trim();

    if (!apiKey || !apiEndpoint) return;

    const originalText = refreshModelsBtn.textContent;
    refreshModelsBtn.textContent = '⏳';
    refreshModelsBtn.disabled = true;

    try {
        // L'URL des modèles est souvent à la racine /api/models ou /v1/models
        // Si l'endpoint est .../api/v1, on essaie .../api/models comme demandé
        let modelsEndpoint = apiEndpoint;
        if (modelsEndpoint.endsWith('/v1')) {
            modelsEndpoint = modelsEndpoint.replace('/v1', '/models');
        } else if (!modelsEndpoint.endsWith('/models')) {
            modelsEndpoint = `${modelsEndpoint}/models`;
        }

        const response = await fetch(modelsEndpoint, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Erreur récupération modèles');

        const data = await response.json();
        
        // Vider la liste actuelle
        modelNameInput.innerHTML = '';
        
        // Ajouter les modèles trouvés
        const models = Array.isArray(data) ? data : (data.data || []);
        
        if (models.length === 0) {
            const option = document.createElement('option');
            option.value = "standard";
            option.textContent = "Standard (défaut)";
            modelNameInput.appendChild(option);
        } else {
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.name || model.id;
                modelNameInput.appendChild(option);
            });
        }

        // Restaurer la sélection précédente si possible
        const savedModel = localStorage.getItem('meetingsNoteAI_modelName');
        if (savedModel && Array.from(modelNameInput.options).some(opt => opt.value === savedModel)) {
            modelNameInput.value = savedModel;
        }
        checkInputs();

    } catch (error) {
        console.error('Erreur fetchModels:', error);
        // En cas d'erreur, on remet au moins une option par défaut si vide
        if (modelNameInput.options.length === 0) {
            const option = document.createElement('option');
            option.value = "standard";
            option.textContent = "Standard";
            modelNameInput.appendChild(option);
        }
    } finally {
        refreshModelsBtn.textContent = originalText;
        refreshModelsBtn.disabled = false;
    }
}

// Écouteurs pour le chargement des modèles
refreshModelsBtn.addEventListener('click', fetchModels);
apiKeyInput.addEventListener('blur', fetchModels);
apiEndpointInput.addEventListener('blur', fetchModels);

// Gestion du Drag & Drop
function setupDragAndDrop(dropZoneId, fileInputId) {
    const dropZone = document.getElementById(dropZoneId);
    const fileInput = document.getElementById(fileInputId);

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('dragover');
    }

    function unhighlight(e) {
        dropZone.classList.remove('dragover');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            fileInput.files = files;
            // Déclencher l'événement change manuellement
            const event = new Event('change');
            fileInput.dispatchEvent(event);
        }
    }
}

// Initialiser le Drag & Drop
setupDragAndDrop('participantsDropZone', 'participantsFile');
setupDragAndDrop('transcriptDropZone', 'transcriptFile');

// Réinitialiser le prompt par défaut
resetPromptBtn.addEventListener('click', () => {
    if (confirm('Voulez-vous vraiment réinitialiser le prompt à sa valeur par défaut ?')) {
        customPrompt.value = DEFAULT_PROMPT;
        localStorage.setItem('meetingsNoteAI_customPrompt', DEFAULT_PROMPT);
        checkInputs();
    }
});

// Gestion de la langue
const langBtns = document.querySelectorAll('.lang-btn');
langBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Empêcher l'ouverture/fermeture de l'accordéon
        
        const lang = btn.dataset.lang;
        if (lang === currentLanguage) return;
        
        currentLanguage = lang;
        localStorage.setItem('meetingsNoteAI_language', currentLanguage);
        
        // Update UI
        langBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Toggle visibility API Key
toggleApiKeyBtn.addEventListener('click', () => {
    const type = apiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
    apiKeyInput.setAttribute('type', type);
    toggleApiKeyBtn.textContent = type === 'password' ? '👁️' : '🙈';
});

// Charger les fichiers
participantsFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        try {
            const content = await readFileContent(file);
            // Traitement simple du CSV : on remplace les points-virgules par des virgules pour l'affichage
            // et on s'assure que c'est lisible.
            participantsContent = content; 
            
            // Estimation du nombre de participants (lignes non vides)
            const count = participantsContent.split(/\r\n|\r|\n/).filter(l => l.trim()).length;
            
            participantsPreview.innerHTML = `
                <span>✓ Fichier chargé: ${file.name} (~${count} entrées)</span>
                <button class="remove-file-btn" title="Supprimer le fichier">✕</button>
            `;
            participantsPreview.classList.add('loaded');

            participantsPreview.querySelector('.remove-file-btn').addEventListener('click', () => {
                participantsFileInput.value = '';
                participantsContent = '';
                participantsPreview.textContent = '';
                participantsPreview.classList.remove('loaded');
                checkInputs();
            });

            checkInputs();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la lecture du fichier participants.");
            participantsContent = '';
            checkInputs();
        }
    } else {
        participantsContent = '';
        checkInputs();
    }
});

transcriptFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        try {
            if (file.name.endsWith('.docx')) {
                transcriptContent = await readDocxContent(file);
            } else {
                // Fallback pour .txt si jamais
                transcriptContent = await readFileContent(file);
            }
            
            const wordCount = transcriptContent.split(/\s+/).length;
            
            transcriptPreview.innerHTML = `
                <span>✓ Fichier chargé: ${file.name} (${wordCount} mots)</span>
                <button class="remove-file-btn" title="Supprimer le fichier">✕</button>
            `;
            transcriptPreview.classList.add('loaded');

            transcriptPreview.querySelector('.remove-file-btn').addEventListener('click', () => {
                transcriptFileInput.value = '';
                transcriptContent = '';
                transcriptPreview.textContent = '';
                transcriptPreview.classList.remove('loaded');
                checkInputs();
            });

            checkInputs();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la lecture du fichier transcript (assurez-vous que c'est un .docx valide).");
            transcriptContent = '';
            checkInputs();
        }
    } else {
        transcriptContent = '';
        checkInputs();
    }
});

// Lire le contenu d'un fichier texte (ou CSV)
function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// Lire le contenu d'un fichier DOCX avec Mammoth
function readDocxContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const arrayBuffer = e.target.result;
            if (typeof mammoth === 'undefined') {
                reject(new Error("La bibliothèque Mammoth n'est pas chargée."));
                return;
            }
            mammoth.extractRawText({arrayBuffer: arrayBuffer})
                .then(function(result){
                    resolve(result.value); // Le texte brut
                })
                .catch(function(err){
                    reject(err);
                });
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// Générer le compte-rendu
generateBtn.addEventListener('click', async () => {
    if (!validateInputs()) {
        return;
    }

    const currentParticipants = getActiveContent('participantsWrapper', participantsContent, 'participantsText');
    const currentTranscript = getActiveContent('transcriptWrapper', transcriptContent, 'transcriptText');

    // Préparer le prompt avec les données
    let prompt = customPrompt.value
        .replace('{PARTICIPANTS}', currentParticipants)
        .replace('{TRANSCRIPT}', currentTranscript);

    // Ajouter l'instruction de langue
    const langInstruction = currentLanguage === 'en' 
        ? "\n\nIMPORTANT: Write the meeting minutes in ENGLISH." 
        : "\n\nIMPORTANT: Rédige le compte-rendu en FRANÇAIS.";
    
    prompt += langInstruction;

    // Réinitialiser l'historique de conversation
    conversationHistory = [
        {
            role: 'user',
            content: prompt
        }
    ];

    await callAI();
});

// Regénérer avec feedback
regenerateBtn.addEventListener('click', async () => {
    const feedback = feedbackText.value.trim();
    
    if (!feedback) {
        alert('Veuillez entrer un retour avant de regénérer.');
        return;
    }

    // Ajouter le feedback à l'historique
    conversationHistory.push({
        role: 'assistant',
        content: lastGeneratedText
    });
    
    conversationHistory.push({
        role: 'user',
        content: `Voici mes commentaires pour améliorer le compte-rendu :\n\n${feedback}\n\nMerci de regénérer le compte-rendu en tenant compte de ces remarques.`
    });

    await callAI();
});

// Appeler l'API IA (Standard Open WebUI)
async function callAI() {
    const apiKey = apiKeyInput.value.trim();
    const apiEndpoint = apiEndpointInput.value.trim();
    const modelName = modelNameInput.value.trim();

    showLoading(true);

    try {
        // Construction du payload standard OpenAI/Open WebUI
        // On envoie tout l'historique de la conversation pour garder le contexte
        const payload = {
            model: modelName,
            messages: conversationHistory,
            stream: true
        };

        // Appel à l'API standard (/chat/completions)
        // On utilise l'endpoint configuré (ex: .../api/v1) + /chat/completions
        const response = await fetch(`${apiEndpoint}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Erreur API: ${errorData.error?.message || response.statusText}`);
        }

        // Lire le stream de réponse (format Open WebUI / OpenAI)
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            
            // Garder la dernière ligne incomplète dans le buffer
            buffer = lines.pop() || '';
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonData = line.slice(6).trim();
                    
                    // Ignorer les messages [DONE]
                    if (jsonData === '[DONE]') continue;
                    
                    try {
                        const data = JSON.parse(jsonData);
                        
                        // Standard OpenAI / Open WebUI : choices[0].delta.content
                        if (data.choices && data.choices[0]?.delta?.content) {
                            fullResponse += data.choices[0].delta.content;
                        }
                    } catch (e) {
                        // Ignorer les erreurs de parsing
                    }
                }
            }
        }

        // Extraire la réponse de l'assistant
        if (!fullResponse) {
            throw new Error('Aucune réponse générée par l\'API');
        }

        const generatedText = cleanAIResponse(fullResponse);

        displayResult(generatedText);
    } catch (error) {
        alert(`Erreur lors de l'appel à l'API:\n${error.message}`);
        console.error('Erreur:', error);
    } finally {
        showLoading(false);
    }
}

// Nettoyer la réponse de l'IA (enlever les balises de raisonnement)
function cleanAIResponse(content) {
    // Enlever les balises <details type="reasoning">...</details>
    return content.replace(/<details type="reasoning"[^>]*>[\s\S]*?<\/details>\s*/gi, '').trim();
}

// Afficher le résultat
function displayResult(text) {
    lastGeneratedText = text;
    resultDiv.textContent = text;
    resultSection.style.display = 'block';
    feedbackSection.style.display = 'none';
    feedbackText.value = '';
    
    // Scroll vers le résultat
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Copie automatique
    copyToClipboard(true);
}

// Fonction pour copier le texte
function copyToClipboard(isAuto = false) {
    if (!lastGeneratedText) return;

    // Si c'est une copie automatique et que le document n'a pas le focus, on annule pour éviter l'erreur
    if (isAuto && !document.hasFocus()) {
        return;
    }

    navigator.clipboard.writeText(lastGeneratedText).then(() => {
        copyBtn.textContent = '✓ Copié !';
        copyBtn.style.backgroundColor = 'var(--success-color)';
        
        setTimeout(() => {
            copyBtn.textContent = '📋 Copier';
            copyBtn.style.backgroundColor = '';
        }, 2000);
    }).catch(err => {
        if (!isAuto) {
            alert('Erreur lors de la copie: ' + err);
        } else {
            console.warn('La copie automatique a échoué (probablement bloquée par le navigateur):', err);
        }
    });
}

// Copier le texte
copyBtn.addEventListener('click', () => {
    copyToClipboard(false);
});

// Envoyer par mail
emailBtn.addEventListener('click', () => {
    if (!lastGeneratedText) return;

    let subjectText = "Compte-rendu de réunion";
    
    // Extraction générique du sujet
    // On cherche dans les premières lignes non-vides
    const lines = lastGeneratedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // On cherche une ligne qui ressemble à un titre (commence par #, ou Objet:, ou juste la première ligne)
    // On privilégie les lignes avec des mots clés explicites
    const explicitLine = lines.slice(0, 10).find(l => /^(?:objet|sujet|titre|thème|re)\s*[:\-]/i.test(l));
    const titleLine = lines.slice(0, 5).find(l => l.startsWith('# '));
    
    const candidateLine = explicitLine || titleLine || lines[0];

    if (candidateLine) {
        // Nettoyage : on retire les caractères Markdown, les préfixes "Objet:", et on garde le texte brut
        const cleanSubject = candidateLine
            .replace(/^[#*>\-•\s]+/, '') // Retire les puces et niveaux de titre (#, ##, -, *)
            .replace(/^(?:objet|sujet|titre|thème|re)\s*[:\-]\s*/i, '') // Retire les préfixes courants
            .replace(/[*_`]/g, '') // Retire le gras/italique interne
            .trim();

        // Si le résultat est valide et pas trop long, on l'utilise
        if (cleanSubject.length > 0 && cleanSubject.length < 150) {
            subjectText = cleanSubject;
        }
    }

    const subject = encodeURIComponent(subjectText);
    const body = encodeURIComponent(lastGeneratedText);
    
    // Création du lien mailto
    // Note: Il y a une limite de longueur pour les liens mailto selon les clients mail/navigateurs (souvent autour de 2000 caractères)
    const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
    
    window.location.href = mailtoLink;

    // Feedback visuel
    const originalText = emailBtn.textContent;
    emailBtn.textContent = '✓ Client mail ouvert !';
    emailBtn.style.backgroundColor = 'var(--success-color)';
    
    setTimeout(() => {
        emailBtn.textContent = originalText;
        emailBtn.style.backgroundColor = '';
    }, 2000);
});

// Afficher la section de feedback
feedbackBtn.addEventListener('click', () => {
    feedbackSection.style.display = 'block';
    feedbackSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    feedbackText.focus();
});

// Afficher/masquer le chargement
function showLoading(show) {
    loadingSection.style.display = show ? 'flex' : 'none';
    generateBtn.disabled = show;
    regenerateBtn.disabled = show;
}

// Valider les entrées
function validateInputs() {
    if (!apiKeyInput.value.trim()) {
        alert('⚠️ Veuillez entrer votre clé API.');
        apiKeyInput.focus();
        return false;
    }

    if (!apiEndpointInput.value.trim()) {
        alert('⚠️ Veuillez entrer l\'URL de l\'API.');
        apiEndpointInput.focus();
        return false;
    }

    if (!modelNameInput.value.trim()) {
        alert('⚠️ Veuillez entrer le nom du modèle.');
        modelNameInput.focus();
        return false;
    }

    const currentParticipants = getActiveContent('participantsWrapper', participantsContent, 'participantsText');
    if (!currentParticipants) {
        alert('⚠️ Veuillez fournir la liste des participants (Fichier ou Texte).');
        return false;
    }

    const currentTranscript = getActiveContent('transcriptWrapper', transcriptContent, 'transcriptText');
    if (!currentTranscript) {
        alert('⚠️ Veuillez fournir le transcript de la réunion (Fichier ou Texte).');
        return false;
    }

    if (!customPrompt.value.trim()) {
        alert('⚠️ Le prompt ne peut pas être vide.');
        customPrompt.focus();
        return false;
    }

    return true;
}

// Sauvegarder la clé API dans localStorage (optionnel, pour la persistance)
apiKeyInput.addEventListener('blur', () => {
    if (apiKeyInput.value.trim()) {
        localStorage.setItem('meetingsNoteAI_apiKey', apiKeyInput.value.trim());
    }
});

apiEndpointInput.addEventListener('blur', () => {
    if (apiEndpointInput.value.trim()) {
        localStorage.setItem('meetingsNoteAI_apiEndpoint', apiEndpointInput.value.trim());
    }
});

modelNameInput.addEventListener('change', () => {
    if (modelNameInput.value.trim()) {
        localStorage.setItem('meetingsNoteAI_modelName', modelNameInput.value.trim());
    }
});

customPrompt.addEventListener('blur', () => {
    if (customPrompt.value.trim()) {
        localStorage.setItem('meetingsNoteAI_customPrompt', customPrompt.value.trim());
    }
});

// Charger les valeurs sauvegardées au démarrage
window.addEventListener('load', () => {
    const savedApiKey = localStorage.getItem('meetingsNoteAI_apiKey');
    const savedApiEndpoint = localStorage.getItem('meetingsNoteAI_apiEndpoint');
    const savedCustomPrompt = localStorage.getItem('meetingsNoteAI_customPrompt');
    const savedLanguage = localStorage.getItem('meetingsNoteAI_language');
    // Le modèle sera restauré après le fetchModels
    
    if (savedApiKey) apiKeyInput.value = savedApiKey;
    if (savedApiEndpoint) apiEndpointInput.value = savedApiEndpoint;
    
    if (savedCustomPrompt) {
        customPrompt.value = savedCustomPrompt;
    } else {
        customPrompt.value = DEFAULT_PROMPT;
    }

    if (savedLanguage) {
        currentLanguage = savedLanguage;
    }
    
    // Update language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.dataset.lang === currentLanguage) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    checkInputs();

    // Tenter de charger les modèles si on a les infos
    if (apiKeyInput.value && apiEndpointInput.value) {
        fetchModels();
    }
});
