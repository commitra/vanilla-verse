
        const form = document.getElementById('form');
        const title = document.getElementById('title');
        const tag = document.getElementById('tag');
        const content = document.getElementById('content');
        const grid = document.getElementById('notes');
        const search = document.getElementById('search');
        const tagFilter = document.getElementById('tagFilter');
        const themeToggle = document.getElementById('themeToggle');
        const clearButton = document.getElementById('clear-form');
        const titleCount = document.getElementById('title-count');
        const contentCount = document.getElementById('content-count');
        const deleteModal = document.getElementById('deleteModal');
        const cancelDeleteBtn = document.getElementById('cancelDelete');
        const confirmDeleteBtn = document.getElementById('confirmDelete');
        const themeIcon = document.getElementById('themeIcon');
        const moonIcon = themeIcon.querySelector('.moon-icon');
        const sunIcon = themeIcon.querySelector('.sun-icon');

        let notes = JSON.parse(localStorage.getItem('notes')) || [];
        let currentTheme = localStorage.getItem('theme') || 'dark';
        let noteToDelete = null;

        // Initialize app
        document.body.classList.toggle('light', currentTheme === 'light');
        updateThemeIcon();

        // Character counter functionality
        title.addEventListener('input', () => {
            titleCount.textContent = title.value.length;
        });

        content.addEventListener('input', () => {
            contentCount.textContent = content.value.length;
        });

        // Enhanced form submission with loading state
        form.addEventListener('submit', e => {
            e.preventDefault();

            const submitButton = form.querySelector('.btn-primary');
            const originalText = submitButton.textContent;

            // Show loading state
            submitButton.classList.add('loading');
            submitButton.textContent = 'Adding...';
            submitButton.disabled = true;

            // Simulate processing delay for better UX
            setTimeout(() => {
                const newNote = {
                    id: crypto.randomUUID(),
                    title: title.value.trim(),
                    tag: tag.value || null,
                    content: content.value.trim(),
                    created: Date.now(),
                    pinned: false
                };

                notes.unshift(newNote);
                saveNotes();

                // Reset form with success animation
                form.classList.add('submit-success');
                setTimeout(() => {
                    form.classList.remove('submit-success');
                    resetForm();

                    // Restore button state
                    submitButton.classList.remove('loading');
                    submitButton.textContent = originalText;
                    submitButton.disabled = false;
                }, 300);

                render();
                populateTags();
            }, 800);
        });

        // Clear form functionality
        clearButton.addEventListener('click', () => {
            resetForm();
            title.focus();
        });

        function resetForm() {
            form.reset();
            titleCount.textContent = '0';
            contentCount.textContent = '0';
        }

        function saveNotes() {
            localStorage.setItem('notes', JSON.stringify(notes));
        }

        function render(filterText = '', tagFilterValue = '') {
            grid.innerHTML = '';
            let filteredNotes = notes.filter(n =>
            (n.title.toLowerCase().includes(filterText.toLowerCase()) ||
                (n.tag && n.tag.toLowerCase().includes(filterText.toLowerCase())) ||
                n.content.toLowerCase().includes(filterText.toLowerCase()))
            );

            if (tagFilterValue) {
                filteredNotes = filteredNotes.filter(n => n.tag && n.tag.toLowerCase() === tagFilterValue.toLowerCase());
            }

            if (filteredNotes.length === 0) {
                grid.innerHTML = `<p style="text-align: center; opacity: 0.6; grid-column: 1 / -1; padding: 1rem;">No notes found.</p>`;
                return;
            }

            filteredNotes.sort((a, b) => b.pinned - a.pinned || b.created - a.created);

            for (const n of filteredNotes) {
                const card = document.createElement('article');
                card.className = 'card';
                const date = new Date(n.created).toLocaleString();

                // Truncate content if too long
                let displayContent = n.content;
                if (displayContent.length > 200) {
                    displayContent = displayContent.substring(0, 200) + '...';
                }

                card.innerHTML = `
                    <div class="card-header">
                        <h3>${escapeHtml(n.title)}</h3>
                        <button class="pin" aria-label="${n.pinned ? 'Unpin note' : 'Pin note'}">${n.pinned ? '📌' : '📍'}</button>
                    </div>
                    ${n.tag ? `<span class="tag">${escapeHtml(n.tag)}</span>` : ''}
                    <p>${escapeHtml(displayContent)}</p>
                    <div class="note-footer">
                        <small>${date}</small>
                        <button class="del" aria-label="Delete note">Delete</button>
                    </div>
                `;

                card.querySelector('.del').addEventListener('click', () => {
                    noteToDelete = n.id;
                    deleteModal.classList.add('active');
                });

                card.querySelector('.pin').addEventListener('click', () => {
                    n.pinned = !n.pinned;
                    saveNotes();
                    render(search.value, tagFilter.value);
                });

                grid.appendChild(card);
            }
        }

        function populateTags() {
            const tags = [...new Set(notes.filter(n => n.tag).map(n => n.tag))];
            tagFilter.innerHTML = `<option value="">All tags</option>`;
            tags.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t;
                opt.textContent = t;
                tagFilter.appendChild(opt);
            });
        }

        // Utility function to prevent XSS
        function escapeHtml(unsafe) {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        // Enhanced search with debouncing
        let searchTimeout;
        search.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                render(search.value, tagFilter.value);
            }, 300);
        });

        // Handle search input clearing
        search.addEventListener('input', () => {
            if (search.value === '') {
                render('', tagFilter.value);
            }
        });

        tagFilter.addEventListener('change', () => {
            render(search.value, tagFilter.value);
        });

        // Delete modal functionality
        cancelDeleteBtn.addEventListener('click', () => {
            deleteModal.classList.remove('active');
            noteToDelete = null;
        });

        confirmDeleteBtn.addEventListener('click', () => {
            if (noteToDelete) {
                notes = notes.filter(x => x.id !== noteToDelete);
                saveNotes();
                render(search.value, tagFilter.value);
                populateTags();
                deleteModal.classList.remove('active');
                noteToDelete = null;
            }
        });

        // Close modal when clicking outside
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) {
                deleteModal.classList.remove('active');
                noteToDelete = null;
            }
        });

        // Enhanced theme toggle with animation
        themeToggle.addEventListener('click', () => {
            // Add transition class
            document.body.classList.add('theme-transitioning');

            // Toggle theme
            document.body.classList.toggle('light');
            currentTheme = document.body.classList.contains('light') ? 'light' : 'dark';
            localStorage.setItem('theme', currentTheme);

            // Update icon and ARIA attributes
            updateThemeIcon();

            // Remove transition class after animation completes
            setTimeout(() => {
                document.body.classList.remove('theme-transitioning');
            }, 400);
        });

        function updateThemeIcon() {
            const srText = themeToggle.querySelector('.sr-only');

            if (document.body.classList.contains('light')) {
                moonIcon.style.display = 'none';
                sunIcon.style.display = 'block';
                srText.textContent = 'Light Mode';
                themeToggle.setAttribute('aria-pressed', 'true');
            } else {
                moonIcon.style.display = 'block';
                sunIcon.style.display = 'none';
                srText.textContent = 'Dark Mode';
                themeToggle.setAttribute('aria-pressed', 'false');
            }
        }

        // Focus management - set focus to title input on page load
        window.addEventListener('load', () => {
            title.focus();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl + / to focus search
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                search.focus();
            }

            // Escape to clear search
            if (e.key === 'Escape' && document.activeElement === search) {
                search.value = '';
                render('', tagFilter.value);
            }

            // Escape to close modal
            if (e.key === 'Escape' && deleteModal.classList.contains('active')) {
                deleteModal.classList.remove('active');
                noteToDelete = null;
            }

            // Ctrl + K to clear form (when not in input field)
            if (e.ctrlKey && e.key === 'k' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
                e.preventDefault();
                resetForm();
                title.focus();
            }

            // Ctrl + Shift + T to toggle theme
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                themeToggle.click();
            }
        });

        // Initialize the app
        render();
        populateTags();
