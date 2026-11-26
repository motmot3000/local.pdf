(function () {
    const STORAGE_KEY = 'localpdf-language';

    const TRANSLATIONS = {
        fr: {
            'meta.title': 'LocalPDF',
            'app.title': '📄 LocalPDF',
            'language.label': 'Langue',
            'step.import.title': '📁 Import',
            'step.import.description': 'Ajouter des fichiers PDF',
            'step.edit.title': '✂️ Modification',
            'step.edit.description': 'Sélectionner et organiser les pages',
            'step.result.title': '💾 Résultat',
            'step.result.description': 'Obtenir votre résultat',
            'upload.icon': '📁',
            'upload.title': 'Déposez les fichiers PDF ici ou cliquez pour parcourir',
            'upload.description': 'Vous pouvez télécharger plusieurs fichiers PDF à la fois',
            'button.proceedEdit': "Passer à l'édition →",
            'grid.size': 'Taille de la grille :',
            'button.selectAll': 'Tout sélectionner',
            'button.deselectAll': 'Tout désélectionner',
            'button.deleteSelected': 'Supprimer la sélection',
            'button.rotateSelected': 'Faire pivoter la sélection',
            'button.restoreInitial': "🔄 Restaurer l'état initial",
            'button.back': '← Retour',
            'button.proceedDownload': 'Passer au téléchargement →',
            'download.title': '🎉 Votre PDF est prêt !',
            'download.description': 'Créez un ou plusieurs PDFs à partir de vos pages',
            'output.title': '📄 PDF #{number}',
            'output.remove.title': 'Supprimer ce PDF',
            'output.filename': 'Nom du fichier :',
            'output.filename.placeholder': 'localpdf',
            'output.pages': 'Pages à inclure :',
            'output.pages.placeholder': '1-3,5,7-9 ou laissez vide pour toutes les pages',
            'output.pages.title': 'Exemples: 1-3,5,7-9 ou 1,2,3 ou laissez vide pour toutes les pages',
            'output.pages.help': '💡 Formats acceptés : 1-5 (plage), 1,3,5 (pages individuelles), ou combinaison 1-3,5,7-9',
            'output.preview.all': 'Toutes les pages ({count} pages)',
            'output.preview.valid': 'Pages: {range} ({count} pages)',
            'output.preview.partial': 'Pages: {range} ({validCount} valides, {invalidCount} ignorées)',
            'output.preview.none': 'Aucune page valide sélectionnée',
            'output.preview.invalid': 'Format invalide (Ex: 1-3,5,7-9)',
            'button.addPdf': '➕ Ajouter un autre PDF',
            'progress.generating': 'Génération en cours...',
            'progress.init': 'Initialisation...',
            'progress.pdf': 'Génération PDF {current}/{total}...',
            'progress.done': 'Terminé !',
            'button.backEdit': "← Retour à l'édition",
            'button.download': '📥 Télécharger le(s) PDF(s)',
            'legend.title': 'Légende des documents :',
            'page.title': 'Cliquez et faites glisser pour réorganiser',
            'page.alt': 'Page {number}',
            'page.moveLeft': 'Déplacer à gauche',
            'page.moveRight': 'Déplacer à droite',
            'page.rotate': 'Faire pivoter',
            'page.delete': 'Supprimer',
            'message.processing': 'Erreur lors du traitement de {name}: {error}',
            'message.notPdf': "{name} n'est pas un fichier PDF",
            'message.loaded': '{name} chargé avec succès ({count} pages)',
            'message.processFailed': 'Échec du traitement de {name}: {error}',
            'message.pageDeleted': 'Page supprimée',
            'message.pagesDeleted': '{count} pages supprimées',
            'message.movedLeft': 'Page {number} déplacée vers la gauche',
            'message.movedRight': 'Page {number} déplacée vers la droite',
            'message.movedBefore': 'Page déplacée avant la page {number}',
            'message.swappedPages': 'Pages {first} et {second} échangées',
            'message.movedAfter': 'Page déplacée après la page {number}',
            'message.dragHelp': 'Faites glisser pour réorganiser les pages',
            'message.dragTip': '💡 Astuce : Faites glisser les pages pour les réorganiser',
            'message.noInitialState': 'Aucun état initial à restaurer',
            'message.initialRestored': 'État initial restauré avec succès',
            'message.restoreError': 'Erreur lors de la restauration : {error}',
            'message.pdfAdded': 'PDF #{number} ajouté',
            'message.pdfRemoved': 'PDF #{number} supprimé',
            'message.noPages': 'Aucune page à traiter',
            'message.progressMissing': 'Erreur: éléments de progression non trouvés',
            'message.invalidRangeForPdf': 'Format de page invalide pour PDF #{number}',
            'message.noValidPageForPdf': 'Aucune page valide pour PDF #{number}',
            'message.downloadSuccess': '{count} PDF(s) téléchargé(s) avec succès !',
            'message.createFailed': 'Échec de la création des PDFs : {error}'
        },
        en: {
            'meta.title': 'LocalPDF',
            'app.title': '📄 LocalPDF',
            'language.label': 'Language',
            'step.import.title': '📁 Import',
            'step.import.description': 'Add PDF files',
            'step.edit.title': '✂️ Edit',
            'step.edit.description': 'Select and organize pages',
            'step.result.title': '💾 Result',
            'step.result.description': 'Get your result',
            'upload.icon': '📁',
            'upload.title': 'Drop PDF files here or click to browse',
            'upload.description': 'You can upload multiple PDF files at once',
            'button.proceedEdit': 'Go to editing →',
            'grid.size': 'Grid size:',
            'button.selectAll': 'Select all',
            'button.deselectAll': 'Deselect all',
            'button.deleteSelected': 'Delete selection',
            'button.rotateSelected': 'Rotate selection',
            'button.restoreInitial': '🔄 Restore initial state',
            'button.back': '← Back',
            'button.proceedDownload': 'Go to download →',
            'download.title': '🎉 Your PDF is ready!',
            'download.description': 'Create one or more PDFs from your pages',
            'output.title': '📄 PDF #{number}',
            'output.remove.title': 'Remove this PDF',
            'output.filename': 'File name:',
            'output.filename.placeholder': 'localpdf',
            'output.pages': 'Pages to include:',
            'output.pages.placeholder': '1-3,5,7-9 or leave empty for all pages',
            'output.pages.title': 'Examples: 1-3,5,7-9 or 1,2,3, or leave empty for all pages',
            'output.pages.help': '💡 Accepted formats: 1-5 (range), 1,3,5 (individual pages), or combined 1-3,5,7-9',
            'output.preview.all': 'All pages ({count} pages)',
            'output.preview.valid': 'Pages: {range} ({count} pages)',
            'output.preview.partial': 'Pages: {range} ({validCount} valid, {invalidCount} ignored)',
            'output.preview.none': 'No valid page selected',
            'output.preview.invalid': 'Invalid format (Ex: 1-3,5,7-9)',
            'button.addPdf': '➕ Add another PDF',
            'progress.generating': 'Generating...',
            'progress.init': 'Initializing...',
            'progress.pdf': 'Generating PDF {current}/{total}...',
            'progress.done': 'Done!',
            'button.backEdit': '← Back to editing',
            'button.download': '📥 Download PDF(s)',
            'legend.title': 'Document legend:',
            'page.title': 'Click and drag to reorder',
            'page.alt': 'Page {number}',
            'page.moveLeft': 'Move left',
            'page.moveRight': 'Move right',
            'page.rotate': 'Rotate',
            'page.delete': 'Delete',
            'message.processing': 'Error while processing {name}: {error}',
            'message.notPdf': '{name} is not a PDF file',
            'message.loaded': '{name} loaded successfully ({count} pages)',
            'message.processFailed': 'Failed to process {name}: {error}',
            'message.pageDeleted': 'Page deleted',
            'message.pagesDeleted': '{count} pages deleted',
            'message.movedLeft': 'Page {number} moved left',
            'message.movedRight': 'Page {number} moved right',
            'message.movedBefore': 'Page moved before page {number}',
            'message.swappedPages': 'Pages {first} and {second} swapped',
            'message.movedAfter': 'Page moved after page {number}',
            'message.dragHelp': 'Drag to reorder pages',
            'message.dragTip': '💡 Tip: drag pages to reorder them',
            'message.noInitialState': 'No initial state to restore',
            'message.initialRestored': 'Initial state restored successfully',
            'message.restoreError': 'Restore error: {error}',
            'message.pdfAdded': 'PDF #{number} added',
            'message.pdfRemoved': 'PDF #{number} removed',
            'message.noPages': 'No page to process',
            'message.progressMissing': 'Error: progress elements not found',
            'message.invalidRangeForPdf': 'Invalid page range for PDF #{number}',
            'message.noValidPageForPdf': 'No valid page for PDF #{number}',
            'message.downloadSuccess': '{count} PDF(s) downloaded successfully!',
            'message.createFailed': 'Failed to create PDFs: {error}'
        }
    };

    let currentLanguage = getInitialLanguage();

    function getInitialLanguage() {
        let storedLanguage = null;
        try {
            storedLanguage = localStorage.getItem(STORAGE_KEY);
        } catch (error) {
            storedLanguage = null;
        }
        if (storedLanguage && TRANSLATIONS[storedLanguage]) {
            return storedLanguage;
        }

        const browserLanguage = (navigator.language || 'fr').slice(0, 2);
        return TRANSLATIONS[browserLanguage] ? browserLanguage : 'fr';
    }

    function setLanguage(language) {
        currentLanguage = TRANSLATIONS[language] ? language : 'fr';
        try {
            localStorage.setItem(STORAGE_KEY, currentLanguage);
        } catch (error) {
            // Private browsing or locked-down file contexts can block localStorage.
        }
        document.documentElement.lang = currentLanguage;
        document.title = t('meta.title');
    }

    function t(key, params = {}) {
        const dictionary = TRANSLATIONS[currentLanguage] || TRANSLATIONS.fr;
        const fallback = TRANSLATIONS.fr[key] || key;
        const template = dictionary[key] || fallback;

        return template.replace(/\{(\w+)\}/g, (_, name) => {
            return Object.prototype.hasOwnProperty.call(params, name) ? params[name] : `{${name}}`;
        });
    }

    function applyStaticTranslations(root = document) {
        root.querySelectorAll('[data-i18n]').forEach(element => {
            element.textContent = t(element.dataset.i18n, element.dataset);
        });
        root.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            element.placeholder = t(element.dataset.i18nPlaceholder, element.dataset);
        });
        root.querySelectorAll('[data-i18n-title]').forEach(element => {
            element.title = t(element.dataset.i18nTitle, element.dataset);
        });
        root.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
            element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel, element.dataset));
        });
    }

    function getCurrentLanguage() {
        return currentLanguage;
    }

    window.PDFMixerI18n = {
        translations: TRANSLATIONS,
        t,
        setLanguage,
        getCurrentLanguage,
        applyStaticTranslations
    };
})();
