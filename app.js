const { t, setLanguage, getCurrentLanguage, applyStaticTranslations } = window.PDFMixerI18n;

// Initialize PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/pdf.worker.min.js';
}

class PDFManipulator {
    constructor() {
        setLanguage(getCurrentLanguage());
        this.uploadedPDFs = [];
        this.pages = [];
        this.originalPages = []; // Store original state for restore
        this.currentStep = 1;
        this.gridSize = this.isMobile() ? 1 : 4;
        this.selectedPages = new Set();
        this.outputCounter = 1; // For managing multiple PDF outputs
        
        this.initializeEventListeners();
        this.updateGridLayout();
        this.updateGridSizeDisplay();
        this.applyI18n();
    }

    isMobile() {
        return window.innerWidth <= 768;
    }

    updateGridSizeDisplay() {
        const gridSizeSlider = document.getElementById('gridSize');
        const gridSizeValue = document.getElementById('gridSizeValue');
        
        if (gridSizeSlider) {
            gridSizeSlider.value = this.gridSize;
        }
        if (gridSizeValue) {
            gridSizeValue.textContent = this.gridSize;
        }
    }

    applyI18n() {
        applyStaticTranslations();

        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.value = getCurrentLanguage();
        }

        this.updateDocumentLegend();
        document.querySelectorAll('.pdf-output-item').forEach(output => this.updatePagePreview(output));
    }

    initializeEventListeners() {
        // Upload area events
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.addEventListener('change', (event) => {
                setLanguage(event.target.value);
                this.applyI18n();
                this.updateGridDisplay();
            });
        }

        // Navigation buttons
        document.getElementById('proceedToEdit').addEventListener('click', () => this.goToStep(2));
        document.getElementById('backToUpload').addEventListener('click', () => this.goToStep(1));
        document.getElementById('proceedToDownload').addEventListener('click', () => this.goToStep(3));
        document.getElementById('backToEdit').addEventListener('click', () => this.goToStep(2));

        // Grid size slider
        const gridSizeSlider = document.getElementById('gridSize');
        gridSizeSlider.addEventListener('input', (e) => {
            this.gridSize = parseInt(e.target.value);
            document.getElementById('gridSizeValue').textContent = this.gridSize;
            this.updateGridLayout();
        });

        // Batch actions
        document.getElementById('selectAll').addEventListener('click', () => this.selectAllPages());
        document.getElementById('deselectAll').addEventListener('click', () => this.deselectAllPages());
        document.getElementById('deleteSelected').addEventListener('click', () => this.deleteSelectedPages());
        document.getElementById('rotateSelected').addEventListener('click', () => this.rotateSelectedPages());
        document.getElementById('restoreInitial').addEventListener('click', () => this.restoreInitialState());

        // Download and PDF output management
        document.getElementById('downloadPdf').addEventListener('click', () => this.downloadProcessedPDFs());
        document.getElementById('addAnotherPdf').addEventListener('click', () => this.addPdfOutput());

        // Step navigation
        document.querySelectorAll('.step').forEach(step => {
            step.addEventListener('click', () => {
                const stepNum = parseInt(step.dataset.step);
                if (stepNum <= this.getMaxAvailableStep()) {
                    this.goToStep(stepNum);
                }
            });
        });

        // Handle window resize for mobile orientation changes
        window.addEventListener('resize', () => {
            if (this.isMobile() && this.gridSize > 2) {
                this.gridSize = 1;
                this.updateGridSizeDisplay();
                this.updateGridLayout();
            }
        });
    }

    async handleFiles(files) {
        for (let file of files) {
            if (file.type === 'application/pdf') {
                try {
                    await this.processPDFFile(file);
                } catch (error) {
                    this.showMessage('error', t('message.processing', { name: file.name, error: error.message }));
                }
            } else {
                this.showMessage('error', t('message.notPdf', { name: file.name }));
            }
        }
    }

    async processPDFFile(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            // Create a copy for PDF-lib to avoid detached ArrayBuffer issues
            const arrayBufferCopy = arrayBuffer.slice();
            const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            const pdfInfo = {
                file: file,
                name: file.name,
                doc: pdfDoc,
                pageCount: pdfDoc.numPages,
                arrayBuffer: arrayBufferCopy
            };

            this.uploadedPDFs.push(pdfInfo);
            
            // Generate thumbnails for all pages
            for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                const page = await pdfDoc.getPage(pageNum);
                const thumbnail = await this.generateThumbnail(page);
                     this.pages.push({
                id: `${this.uploadedPDFs.length - 1}-${pageNum}`,
                pdfIndex: this.uploadedPDFs.length - 1,
                pageNumber: pageNum,
                thumbnail: thumbnail,
                rotation: 0,
                originalPage: page
            });
        }

        // Store original state for restore functionality
        this.originalPages = JSON.parse(JSON.stringify(this.pages.map(page => ({
            id: page.id,
            pdfIndex: page.pdfIndex,
            pageNumber: page.pageNumber,
            rotation: 0
        }))));

            this.updateGridDisplay();
            this.updateNavigationButtons();
            
            this.showMessage('success', t('message.loaded', { name: file.name, count: pdfDoc.numPages }));
            
        } catch (error) {
            this.showMessage('error', t('message.processFailed', { name: file.name, error: error.message }));
        }
    }

    async generateThumbnail(page, rotation = 0) {
        const viewport = page.getViewport({ scale: 0.5, rotation });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;

        return canvas.toDataURL();
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    updateGridLayout() {
        const grid = document.getElementById('pdfGrid');
        grid.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
    }

    updateGridDisplay() {
        const grid = document.getElementById('pdfGrid');
        grid.replaceChildren();

        this.pages.forEach((page, index) => {
            const pageElement = this.createPageElement(page, index);
            grid.appendChild(pageElement);
        });

        this.makeSortable();
        this.makePageItemsDraggable();
        this.updateDocumentLegend();
    }

    updatePageElementAspectRatio(pageElement, thumbnailSrc) {
        const image = new Image();
        image.onload = () => {
            if (image.naturalWidth > 0 && image.naturalHeight > 0) {
                pageElement.style.aspectRatio = `${image.naturalWidth} / ${image.naturalHeight}`;
            }
        };
        image.src = thumbnailSrc;
    }

    updateDocumentLegend() {
        const existingLegend = document.getElementById('documentLegend');
        if (!existingLegend) {
            return;
        }

        existingLegend.replaceChildren();

        // Only show legend if there are multiple PDFs.
        if (this.uploadedPDFs.length <= 1) {
            return;
        }

        const legend = document.createElement('div');
        legend.className = 'document-legend';

        const title = document.createElement('h4');
        title.textContent = t('legend.title');
        legend.appendChild(title);

        const items = document.createElement('div');
        items.className = 'legend-items';

        this.uploadedPDFs.forEach((pdf, index) => {
            const item = document.createElement('div');
            item.className = 'legend-item';

            const color = document.createElement('div');
            color.className = 'legend-color';
            color.dataset.pdfSource = index;

            const name = document.createElement('span');
            name.textContent = pdf.name;

            item.append(color, name);
            items.appendChild(item);
        });

        legend.appendChild(items);
        existingLegend.appendChild(legend);
    }

    createPageElement(page, index) {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page-item';
        pageDiv.dataset.pageId = page.id;
        pageDiv.dataset.index = index;
        pageDiv.draggable = true;
        pageDiv.setAttribute('title', t('page.title'));

        // Add PDF source indicator for multiple PDFs.
        if (this.uploadedPDFs.length > 1 && page.pdfIndex !== undefined) {
            pageDiv.dataset.pdfSource = page.pdfIndex;
        }

        const isMobile = this.isMobile();
        const thumbnail = document.createElement('img');
        thumbnail.src = page.thumbnail;
        thumbnail.alt = t('page.alt', { number: page.pageNumber });
        thumbnail.className = 'page-thumbnail';

        const pageNumber = document.createElement('div');
        pageNumber.className = 'page-number';
        pageNumber.textContent = page.pageNumber;

        const actions = document.createElement('div');
        actions.className = 'page-actions';

        if (isMobile) {
            const moveLeftButton = document.createElement('button');
            moveLeftButton.className = 'page-btn move-left-btn';
            moveLeftButton.title = t('page.moveLeft');
            moveLeftButton.textContent = '\u2190';

            const moveRightButton = document.createElement('button');
            moveRightButton.className = 'page-btn move-right-btn';
            moveRightButton.title = t('page.moveRight');
            moveRightButton.textContent = '\u2192';

            actions.append(moveLeftButton, moveRightButton);
        }

        const rotateButton = document.createElement('button');
        rotateButton.className = 'page-btn rotate-btn';
        rotateButton.title = t('page.rotate');
        rotateButton.textContent = '\u21bb';

        const deleteButton = document.createElement('button');
        deleteButton.className = 'page-btn delete-btn';
        deleteButton.title = t('page.delete');
        deleteButton.textContent = '\u00d7';

        actions.append(rotateButton, deleteButton);
        pageDiv.append(thumbnail, pageNumber, actions);
        this.updatePageElementAspectRatio(pageDiv, page.thumbnail);

        // Page selection
        pageDiv.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-btn')) return;
            this.togglePageSelection(page.id, pageDiv);
        });

        // Mobile move controls
        if (isMobile) {
            pageDiv.querySelector('.move-left-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.movePageLeft(index);
            });

            pageDiv.querySelector('.move-right-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.movePageRight(index);
            });
        }

        // Rotate button
        pageDiv.querySelector('.rotate-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.rotatePage(index);
        });

        // Delete button
        pageDiv.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deletePage(index);
        });

        return pageDiv;
    }

    togglePageSelection(pageId, element) {
        if (this.selectedPages.has(pageId)) {
            this.selectedPages.delete(pageId);
            element.classList.remove('selected');
        } else {
            this.selectedPages.add(pageId);
            element.classList.add('selected');
        }
        this.updateNavigationButtons();
    }

    selectAllPages() {
        this.selectedPages.clear();
        this.pages.forEach(page => this.selectedPages.add(page.id));
        document.querySelectorAll('.page-item').forEach(item => {
            item.classList.add('selected');
        });
        this.updateNavigationButtons();
    }

    deselectAllPages() {
        this.selectedPages.clear();
        document.querySelectorAll('.page-item').forEach(item => {
            item.classList.remove('selected');
        });
        this.updateNavigationButtons();
    }

    async rotatePage(index) {
        const page = this.pages[index];
        page.rotation = (page.rotation + 90) % 360;
        
        // Regenerate thumbnail with new rotation
        const newThumbnail = await this.generateThumbnail(page.originalPage, page.rotation);
        page.thumbnail = newThumbnail;
        
        // Update the thumbnail in the grid
        const pageElement = document.querySelector(`[data-index="${index}"]`);
        if (pageElement) {
            pageElement.querySelector('.page-thumbnail').src = newThumbnail;
            this.updatePageElementAspectRatio(pageElement, newThumbnail);
        }
    }

    rotateSelectedPages() {
        const selectedIndices = [];
        this.selectedPages.forEach(pageId => {
            const index = this.pages.findIndex(p => p.id === pageId);
            if (index !== -1) selectedIndices.push(index);
        });

        selectedIndices.forEach(index => this.rotatePage(index));
    }

    deletePage(index) {
        const page = this.pages[index];
        this.selectedPages.delete(page.id);
        this.pages.splice(index, 1);
        this.updateGridDisplay();
        this.updateNavigationButtons();
        this.showMessage('info', t('message.pageDeleted'));
    }

    deleteSelectedPages() {
        if (this.selectedPages.size === 0) return;

        // Sort indices in descending order to avoid index shifting issues
        const indicesToDelete = [];
        this.selectedPages.forEach(pageId => {
            const index = this.pages.findIndex(p => p.id === pageId);
            if (index !== -1) indicesToDelete.push(index);
        });

        indicesToDelete.sort((a, b) => b - a);
        indicesToDelete.forEach(index => {
            this.pages.splice(index, 1);
        });

        this.selectedPages.clear();
        this.updateGridDisplay();
        this.updateNavigationButtons();
        this.showMessage('info', t('message.pagesDeleted', { count: indicesToDelete.length }));
    }

    // Mobile page movement methods
    movePageLeft(index) {
        if (index > 0) {
            const [page] = this.pages.splice(index, 1);
            this.pages.splice(index - 1, 0, page);
            this.updateGridDisplay();
            this.showMessage('success', t('message.movedLeft', { number: page.pageNumber }), 'editControls');
        }
    }

    movePageRight(index) {
        if (index < this.pages.length - 1) {
            const [page] = this.pages.splice(index, 1);
            this.pages.splice(index + 1, 0, page);
            this.updateGridDisplay();
            this.showMessage('success', t('message.movedRight', { number: page.pageNumber }), 'editControls');
        }
    }

    makeSortable() {
        const grid = document.getElementById('pdfGrid');
        
        // Check if drag and drop has already been initialized
        if (grid.dataset.sortableInitialized) {
            return;
        }
        grid.dataset.sortableInitialized = 'true';
        
        // Enhanced drag and drop implementation
        let draggedElement = null;
        let draggedIndex = null;



        grid.addEventListener('dragstart', (e) => {
            // Check if the drag started on a page item or its children
            const pageItem = e.target.closest('.page-item');
            if (pageItem) {
                draggedElement = pageItem;
                draggedIndex = parseInt(pageItem.dataset.index);
                
                // Enhanced visual feedback
                pageItem.classList.add('dragging');
                grid.classList.add('drag-active');
                
                // Set drag data
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', draggedIndex.toString());
                
                // Add subtle vibration on mobile devices
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
                
                // Show helpful message
                this.showMessage('info', t('message.dragHelp'), 'editControls');
            }
        });

        grid.addEventListener('dragend', (e) => {
            if (draggedElement) {
                draggedElement.classList.remove('dragging');
                grid.classList.remove('drag-active');
                
                // Remove all drag-related classes and overlays
                grid.querySelectorAll('.page-item').forEach(item => {
                    item.classList.remove('drag-over', 'drop-zone-left', 'drop-zone-middle', 'drop-zone-right');
                    const overlay = item.querySelector('.drop-zone-overlay');
                    if (overlay) {
                        overlay.remove();
                    }
                    delete item.dataset.dropZone;
                    delete item.dataset.targetIndex;
                });
                
                // Reset variables
                draggedElement = null;
                draggedIndex = null;
            }
        });

        grid.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            if (!draggedElement) return;
            
            const dropTarget = e.target.closest('.page-item');
            if (dropTarget && dropTarget !== draggedElement) {
                const rect = dropTarget.getBoundingClientRect();
                const mouseX = e.clientX;
                const targetLeft = rect.left;
                const targetWidth = rect.width;
                
                // Calculate which third of the element the mouse is over
                const relativeX = mouseX - targetLeft;
                const zone = Math.floor((relativeX / targetWidth) * 3);
                
                // Remove all previous drop zone classes
                grid.querySelectorAll('.page-item').forEach(item => {
                    item.classList.remove('drag-over', 'drop-zone-left', 'drop-zone-middle', 'drop-zone-right');
                    // Remove existing overlays
                    const existingOverlay = item.querySelector('.drop-zone-overlay');
                    if (existingOverlay) {
                        existingOverlay.remove();
                    }
                });
                
                // Apply zone-specific styling and create overlay
                let zoneType = '';
                if (zone === 0) {
                    dropTarget.classList.add('drop-zone-left');
                    zoneType = 'left';
                } else if (zone === 1) {
                    dropTarget.classList.add('drop-zone-middle');
                    zoneType = 'middle';
                } else {
                    dropTarget.classList.add('drop-zone-right');
                    zoneType = 'right';
                }
                
                // Create zone overlay for clear visual feedback
                const overlay = document.createElement('div');
                overlay.className = `drop-zone-overlay ${zoneType} show`;
                dropTarget.appendChild(overlay);
                
                // Store zone information for drop handler
                dropTarget.dataset.dropZone = zoneType;
                dropTarget.dataset.targetIndex = dropTarget.dataset.index;
            }
        });

        grid.addEventListener('dragleave', (e) => {
            // Only remove feedback if we're actually leaving the grid area
            if (!e.relatedTarget || !grid.contains(e.relatedTarget)) {
                grid.querySelectorAll('.page-item').forEach(item => {
                    item.classList.remove('drag-over', 'drop-zone-left', 'drop-zone-middle', 'drop-zone-right');
                    const overlay = item.querySelector('.drop-zone-overlay');
                    if (overlay) {
                        overlay.remove();
                    }
                    delete item.dataset.dropZone;
                    delete item.dataset.targetIndex;
                });
            }
        });

        grid.addEventListener('drop', (e) => {
            e.preventDefault();
            if (!draggedElement) return;

            const dropTarget = e.target.closest('.page-item');
            if (dropTarget && dropTarget !== draggedElement) {
                const targetIndex = parseInt(dropTarget.dataset.targetIndex);
                const dropZone = dropTarget.dataset.dropZone;
                
                
                let newIndex;
                let actionMessage;
                
                if (dropZone === 'left') {
                    // Insert before the target
                    newIndex = targetIndex;
                    if (draggedIndex > targetIndex) {
                        newIndex = targetIndex;
                    } else {
                        newIndex = targetIndex;
                    }
                    actionMessage = t('message.movedBefore', { number: targetIndex + 1 });
                } else if (dropZone === 'middle') {
                    // Swap positions
                    newIndex = targetIndex;
                    actionMessage = t('message.swappedPages', { first: draggedIndex + 1, second: targetIndex + 1 });
                } else if (dropZone === 'right') {
                    // Insert after the target
                    newIndex = targetIndex + 1;
                    if (draggedIndex < targetIndex) {
                        newIndex = targetIndex;
                    } else {
                        newIndex = targetIndex + 1;
                    }
                    actionMessage = t('message.movedAfter', { number: targetIndex + 1 });
                }
                
                // Only proceed if there's an actual change
                if ((dropZone === 'middle' && newIndex !== draggedIndex) || 
                    (dropZone !== 'middle' && newIndex !== draggedIndex)) {
                    
                    if (dropZone === 'middle') {
                        // Swap the two pages
                        const temp = this.pages[draggedIndex];
                        this.pages[draggedIndex] = this.pages[targetIndex];
                        this.pages[targetIndex] = temp;
                    } else {
                        // Regular move operation
                        const [draggedPage] = this.pages.splice(draggedIndex, 1);
                        this.pages.splice(newIndex, 0, draggedPage);
                    }
                    
                    // Update display with animation
                    this.updateGridDisplay();
                    
                    // Enhanced success feedback
                    this.showMessage('success', actionMessage, 'editControls');
                    
                    // Haptic feedback for successful drop
                    if (navigator.vibrate) {
                        navigator.vibrate([100, 50, 100]);
                    }
                }
            }
            
            // Clean up all drop zones and overlays
            grid.querySelectorAll('.page-item').forEach(item => {
                item.classList.remove('drag-over', 'drop-zone-left', 'drop-zone-middle', 'drop-zone-right');
                const overlay = item.querySelector('.drop-zone-overlay');
                if (overlay) {
                    overlay.remove();
                }
                delete item.dataset.dropZone;
                delete item.dataset.targetIndex;
            });
        });

        // Show helpful tip when first entering edit mode
        if (!localStorage.getItem('dragTipShown')) {
            setTimeout(() => {
                this.showMessage('info', t('message.dragTip'), 'editControls');
                localStorage.setItem('dragTipShown', 'true');
            }, 1000);
        }
    }

    makePageItemsDraggable() {
        const grid = document.getElementById('pdfGrid');
        
        // Make page items draggable with enhanced features
        grid.querySelectorAll('.page-item').forEach(item => {
            item.draggable = true;
            
            // Add visual hint for first-time users
            item.setAttribute('title', 'Cliquez et faites glisser pour réorganiser');
            
            // Enhanced touch support for mobile (only add if not already added)
            if (!item.dataset.touchEventsAdded) {
                item.addEventListener('touchstart', (e) => {
                    item.style.transform = 'scale(0.98)';
                }, { passive: true });
                
                item.addEventListener('touchend', (e) => {
                    item.style.transform = '';
                }, { passive: true });
                
                item.dataset.touchEventsAdded = 'true';
            }
        });
    }

    goToStep(stepNumber) {
        // Hide all step contents
        document.querySelectorAll('.step-content').forEach(content => {
            content.classList.remove('active');
        });

        // Show target step content
        document.getElementById(`step${stepNumber}`).classList.add('active');

        // Update step indicators
        document.querySelectorAll('.step').forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            step.classList.remove('active', 'completed');
            
            if (stepNum === stepNumber) {
                step.classList.add('active');
            } else if (stepNum < stepNumber) {
                step.classList.add('completed');
            }
        });

        this.currentStep = stepNumber;
        
        // Initialize PDF outputs on step 3
        if (stepNumber === 3) {
            this.initializePdfOutputs();
        }
        
        this.updateNavigationButtons();
    }

    // Restore initial state functionality
    async restoreInitialState() {
        if (this.originalPages.length === 0) {
            this.showMessage('warning', t('message.noInitialState'), 'uploadedFiles');
            return;
        }

        try {
            // Clear current selection
            this.selectedPages.clear();
            
            // Restore pages from original state
            this.pages = [];
            
            for (const originalPage of this.originalPages) {
                const sourcePdf = this.uploadedPDFs[originalPage.pdfIndex];
                const page = await sourcePdf.doc.getPage(originalPage.pageNumber);
                const thumbnail = await this.generateThumbnail(page, 0);
                
                this.pages.push({
                    id: originalPage.id,
                    pdfIndex: originalPage.pdfIndex,
                    pageNumber: originalPage.pageNumber,
                    thumbnail: thumbnail,
                    rotation: 0,
                    originalPage: page
                });
            }
            
            this.updateGridDisplay();
            this.updateNavigationButtons();
            this.showMessage('success', t('message.initialRestored'), 'uploadedFiles');
            
        } catch (error) {
            this.showMessage('error', t('message.restoreError', { error: error.message }), 'uploadedFiles');
        }
    }

    // PDF Output management methods
    addPdfOutput() {
        this.outputCounter++;
        const outputId = this.outputCounter;
        const outputsContainer = document.getElementById('pdfOutputs');
        const outputDiv = document.createElement('div');
        outputDiv.className = 'pdf-output-item';
        outputDiv.dataset.outputId = outputId;

        const header = document.createElement('div');
        header.className = 'pdf-output-header';

        const title = document.createElement('h3');
        title.dataset.i18n = 'output.title';
        title.dataset.number = outputId;
        title.textContent = t('output.title', { number: outputId });

        const removeButton = document.createElement('button');
        removeButton.className = 'remove-output-btn';
        removeButton.dataset.i18nTitle = 'output.remove.title';
        removeButton.title = t('output.remove.title');

        header.append(title, removeButton);

        const controls = document.createElement('div');
        controls.className = 'pdf-output-controls';

        const filenameSection = document.createElement('div');
        filenameSection.className = 'filename-section';

        const filenameLabel = document.createElement('label');
        filenameLabel.dataset.i18n = 'output.filename';
        filenameLabel.textContent = t('output.filename');

        const inputWithSuffix = document.createElement('div');
        inputWithSuffix.className = 'input-with-suffix';

        const filenameInput = document.createElement('input');
        filenameInput.type = 'text';
        filenameInput.className = 'filename-input';
        filenameInput.placeholder = `${t('output.filename.placeholder')}-${outputId}`;
        filenameInput.value = `localpdf-${outputId}`;

        const suffix = document.createElement('span');
        suffix.className = 'file-suffix';
        suffix.textContent = '.pdf';

        inputWithSuffix.append(filenameInput, suffix);
        filenameSection.append(filenameLabel, inputWithSuffix);

        const pagesSection = document.createElement('div');
        pagesSection.className = 'pages-section';

        const pagesLabel = document.createElement('label');
        pagesLabel.dataset.i18n = 'output.pages';
        pagesLabel.textContent = t('output.pages');

        const pagesInput = document.createElement('input');
        pagesInput.type = 'text';
        pagesInput.className = 'pages-input';
        pagesInput.dataset.i18nPlaceholder = 'output.pages.placeholder';
        pagesInput.dataset.i18nTitle = 'output.pages.title';
        pagesInput.placeholder = t('output.pages.placeholder');
        pagesInput.title = t('output.pages.title');

        const pagesHelp = document.createElement('div');
        pagesHelp.className = 'pages-help';
        pagesHelp.dataset.i18n = 'output.pages.help';
        pagesHelp.textContent = t('output.pages.help');

        pagesSection.append(pagesLabel, pagesInput, pagesHelp);

        const previewSection = document.createElement('div');
        previewSection.className = 'preview-section';

        const preview = document.createElement('span');
        preview.className = 'pages-preview';
        preview.textContent = t('output.preview.all', { count: this.pages.length });

        const totalPages = document.createElement('span');
        totalPages.className = 'total-pages visually-hidden';
        totalPages.textContent = this.pages.length;

        previewSection.append(preview, totalPages);
        controls.append(filenameSection, pagesSection, previewSection);
        outputDiv.append(header, controls);
        outputsContainer.appendChild(outputDiv);

        removeButton.addEventListener('click', () => this.removePdfOutput(outputId));

        let debounceTimer;
        pagesInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.updatePagePreview(outputDiv);
            }, 300);
        });

        this.updatePagePreview(outputDiv);
        this.updateRemoveButtonsVisibility();
        applyStaticTranslations(outputDiv);
        this.showMessage('info', t('message.pdfAdded', { number: outputId }), 'downloadMessages');
    }

    removePdfOutput(outputId) {
        const outputDiv = document.querySelector(`[data-output-id="${outputId}"]`);
        if (outputDiv) {
            outputDiv.remove();
            this.updateRemoveButtonsVisibility();
            this.showMessage('info', t('message.pdfRemoved', { number: outputId }), 'downloadMessages');
        }
    }

    updateRemoveButtonsVisibility() {
        const outputs = document.querySelectorAll('.pdf-output-item');
        outputs.forEach((output, index) => {
            const removeBtn = output.querySelector('.remove-output-btn');
            if (removeBtn) {
                removeBtn.style.display = outputs.length > 1 ? 'inline-block' : 'none';
            }
        });
    }

    updatePagePreview(outputDiv) {
        const pagesInput = outputDiv.querySelector('.pages-input');
        const preview = outputDiv.querySelector('.pages-preview');
        const previewSection = outputDiv.querySelector('.preview-section');
        const totalPagesSpan = outputDiv.querySelector('.total-pages');
        const setTotalPagesCount = (count) => {
            if (totalPagesSpan) {
                totalPagesSpan.textContent = count;
            }
        };
        
        const pageRange = pagesInput.value.trim();
        
        // Reset all classes
        preview.classList.remove('error', 'success');
        previewSection.classList.remove('error', 'success');
        pagesInput.classList.remove('invalid', 'valid');
        
        if (!pageRange) {
            preview.textContent = t('output.preview.all', { count: this.pages.length });
            preview.classList.add('success');
            previewSection.classList.add('success');
            pagesInput.classList.add('valid');
            setTotalPagesCount(this.pages.length);
            return;
        }
        
        try {
            const selectedPages = this.parsePageRange(pageRange);
            const validPages = selectedPages.filter(page => page >= 1 && page <= this.pages.length);
            
            if (validPages.length === 0) {
                preview.textContent = t('output.preview.none');
                preview.classList.add('error');
                previewSection.classList.add('error');
                pagesInput.classList.add('invalid');
                setTotalPagesCount('0');
            } else if (validPages.length !== selectedPages.length) {
                const invalidCount = selectedPages.length - validPages.length;
                preview.textContent = t('output.preview.partial', {
                    range: this.formatPageRange(validPages),
                    validCount: validPages.length,
                    invalidCount
                });
                preview.classList.add('success');
                previewSection.classList.add('success');
                pagesInput.classList.add('valid');
                setTotalPagesCount(validPages.length);
            } else {
                preview.textContent = t('output.preview.valid', {
                    range: this.formatPageRange(validPages),
                    count: validPages.length
                });
                preview.classList.add('success');
                previewSection.classList.add('success');
                pagesInput.classList.add('valid');
                setTotalPagesCount(validPages.length);
            }
            
        } catch (error) {
            preview.textContent = t('output.preview.invalid');
            preview.classList.add('error');
            previewSection.classList.add('error');
            pagesInput.classList.add('invalid');
            setTotalPagesCount('0');
        }
    }

    parsePageRange(rangeString) {
        const pages = new Set();
        const parts = rangeString.split(',');
        
        for (const part of parts) {
            const trimmed = part.trim();
            
            if (!trimmed) continue; // Skip empty parts
            
            if (trimmed.includes('-')) {
                const rangeParts = trimmed.split('-');
                if (rangeParts.length !== 2) {
                    throw new Error(`Invalid range format: ${trimmed}`);
                }
                
                const start = parseInt(rangeParts[0].trim());
                const end = parseInt(rangeParts[1].trim());
                
                if (isNaN(start) || isNaN(end)) {
                    throw new Error(`Invalid range numbers: ${trimmed}`);
                }
                
                if (start < 1 || end < 1) {
                    throw new Error(`Page numbers must be positive: ${trimmed}`);
                }
                
                for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
                    pages.add(i);
                }
            } else {
                const pageNum = parseInt(trimmed);
                if (isNaN(pageNum)) {
                    throw new Error(`Invalid page number: ${trimmed}`);
                }
                
                if (pageNum < 1) {
                    throw new Error(`Page number must be positive: ${pageNum}`);
                }
                
                pages.add(pageNum);
            }
        }
        
        if (pages.size === 0) {
            throw new Error('No valid pages specified');
        }
        
        return Array.from(pages).sort((a, b) => a - b);
    }

    formatPageRange(pages) {
        if (pages.length === 0) return '';
        if (pages.length === 1) return pages[0].toString();
        
        const ranges = [];
        let start = pages[0];
        let end = pages[0];
        
        for (let i = 1; i < pages.length; i++) {
            if (pages[i] === end + 1) {
                end = pages[i];
            } else {
                if (start === end) {
                    ranges.push(start.toString());
                } else {
                    ranges.push(`${start}-${end}`);
                }
                start = end = pages[i];
            }
        }
        
        if (start === end) {
            ranges.push(start.toString());
        } else {
            ranges.push(`${start}-${end}`);
        }
        
        return ranges.join(', ');
    }

    // Enhanced download method for multiple PDFs
    async downloadProcessedPDFs() {
        const outputs = document.querySelectorAll('.pdf-output-item');
        
        if (outputs.length === 0 || this.pages.length === 0) {
            this.showMessage('error', t('message.noPages'), 'downloadMessages');
            return;
        }

        const progressContainer = document.getElementById('progressContainer');
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const progressPercentage = document.getElementById('progressPercentage');

        if (!progressContainer || !progressBar || !progressText || !progressPercentage) {
            this.showMessage('error', t('message.progressMissing'), 'downloadMessages');
            return;
        }

        try {
            progressContainer.classList.add('active');
            progressBar.style.width = '0%';
            progressText.textContent = t('progress.init');
            progressPercentage.textContent = '0%';

            for (let i = 0; i < outputs.length; i++) {
                const output = outputs[i];
                const filename = output.querySelector('.filename-input').value || `localpdf-${i + 1}`;
                const pagesInput = output.querySelector('.pages-input').value.trim();
                
                progressText.textContent = t('progress.pdf', { current: i + 1, total: outputs.length });
                const baseProgress = (i / outputs.length) * 100;
                progressBar.style.width = `${baseProgress}%`;
                progressPercentage.textContent = `${Math.round(baseProgress)}%`;

                // Determine which pages to include
                let pagesToInclude;
                if (!pagesInput) {
                    pagesToInclude = this.pages.map((_, index) => index + 1);
                } else {
                    try {
                        pagesToInclude = this.parsePageRange(pagesInput);
                        pagesToInclude = pagesToInclude.filter(page => page >= 1 && page <= this.pages.length);
                    } catch (error) {
                        this.showMessage('error', t('message.invalidRangeForPdf', { number: i + 1 }), 'downloadMessages');
                        continue;
                    }
                }

                if (pagesToInclude.length === 0) {
                    this.showMessage('warning', t('message.noValidPageForPdf', { number: i + 1 }), 'downloadMessages');
                    continue;
                }

                // Create PDF
                const pdfDoc = await PDFLib.PDFDocument.create();
                
                for (let j = 0; j < pagesToInclude.length; j++) {
                    const pageIndex = pagesToInclude[j] - 1;
                    const pageInfo = this.pages[pageIndex];
                    const sourcePdf = this.uploadedPDFs[pageInfo.pdfIndex];
                    
                    const sourcePdfDoc = await PDFLib.PDFDocument.load(sourcePdf.arrayBuffer);
                    const [copiedPage] = await pdfDoc.copyPages(sourcePdfDoc, [pageInfo.pageNumber - 1]);
                    
                    // Apply rotation if any
                    if (pageInfo.rotation === 90) copiedPage.setRotation(PDFLib.degrees(90));
                    else if (pageInfo.rotation === 180) copiedPage.setRotation(PDFLib.degrees(180));
                    else if (pageInfo.rotation === 270) copiedPage.setRotation(PDFLib.degrees(270));
                    
                    pdfDoc.addPage(copiedPage);
                    
                    const pageProgress = (j / pagesToInclude.length) * (100 / outputs.length);
                    const totalProgress = baseProgress + pageProgress;
                    progressBar.style.width = `${totalProgress}%`;
                    progressPercentage.textContent = `${Math.round(totalProgress)}%`;
                }

                // Generate and download PDF
                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${filename}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                const finalProgress = ((i + 1) / outputs.length) * 100;
                progressBar.style.width = `${finalProgress}%`;
                progressPercentage.textContent = `${Math.round(finalProgress)}%`;
            }

            progressText.textContent = t('progress.done');
            progressBar.style.width = '100%';
            progressPercentage.textContent = '100%';
            this.showMessage('success', t('message.downloadSuccess', { count: outputs.length }), 'downloadMessages');
            
            // Mark the last step as completed
            this.markStepCompleted(3);
            
            setTimeout(() => {
                progressContainer.classList.remove('active');
                progressBar.style.width = '0%';
                progressPercentage.textContent = '0%';
            }, 3000);

        } catch (error) {
            this.showMessage('error', t('message.createFailed', { error: error.message }), 'downloadMessages');
            progressContainer.classList.remove('active');
        }
    }



    initializePdfOutputs() {
        // Update total pages count in the first output
        const firstOutput = document.querySelector('.pdf-output-item');
        if (firstOutput) {
            const totalPagesSpan = firstOutput.querySelector('.total-pages');
            if (totalPagesSpan) {
                totalPagesSpan.textContent = this.pages.length;
            }
            
            // Add event listeners if not already added
            const pagesInput = firstOutput.querySelector('.pages-input');
            if (pagesInput && !pagesInput.hasAttribute('data-listener-added')) {
                pagesInput.addEventListener('input', () => this.updatePagePreview(firstOutput));
                pagesInput.setAttribute('data-listener-added', 'true');
            }

            const removeButton = firstOutput.querySelector('.remove-output-btn');
            if (removeButton && !removeButton.hasAttribute('data-listener-added')) {
                removeButton.addEventListener('click', () => this.removePdfOutput(firstOutput.dataset.outputId));
                removeButton.setAttribute('data-listener-added', 'true');
            }

            this.updatePagePreview(firstOutput);
        }
        
        this.updateRemoveButtonsVisibility();
    }

    // Essential utility methods
    showMessage(type, message, containerId = 'uploadedFiles') {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Remove existing messages in this container
        const existingMessages = container.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        container.appendChild(messageDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    updateNavigationButtons() {
        const proceedToEdit = document.getElementById('proceedToEdit');
        const proceedToDownload = document.getElementById('proceedToDownload');
        
        if (proceedToEdit) {
            proceedToEdit.disabled = this.pages.length === 0;
        }
        
        if (proceedToDownload) {
            proceedToDownload.disabled = this.pages.length === 0;
        }
    }

    getMaxAvailableStep() {
        if (this.pages.length === 0) return 1;
        return 3; // All steps available once we have pages
    }

    markStepCompleted(stepNumber) {
        const step = document.querySelector(`[data-step="${stepNumber}"]`);
        if (step) {
            step.classList.add('completed');
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new PDFManipulator();
});
