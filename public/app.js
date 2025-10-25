/* ============================================
   Toast Notification System
   ============================================ */
class ToastManager {
    constructor() {
        this.toasts = [];
    }

    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        
        document.body.appendChild(toast);
        this.toasts.push(toast);
        
        // Trigger animation
        setTimeout(() => {
            toast.classList.add('toast-show');
        }, 10);
        
        // Auto-remove
        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => {
                toast.remove();
                this.toasts = this.toasts.filter(t => t !== toast);
            }, 300);
        }, duration);
    }

    success(message) {
        this.show(message, 'success');
    }

    error(message) {
        this.show(message, 'error', 4000);
    }

    warning(message) {
        this.show(message, 'warning');
    }

    info(message) {
        this.show(message, 'info');
    }
}

const toast = new ToastManager();

/* ============================================
   Modal Manager
   ============================================ */
class ModalManager {
    constructor() {
        this.modals = [];
        this.cascadeCycle = 0; // Track position in current cascade cycle
        this.setupKeyboardListeners();
    }

    open(content, title) {
        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.setAttribute('role', 'presentation');
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', `modal-title-${this.modals.length}`);
        
        // Calculate offset for cascading with viewport boundary check
        const baseOffset = 35;
        const horizontalOffset = this.modals.length * baseOffset;
        
        // Calculate vertical offset based on current cascade cycle
        const viewportHeight = window.innerHeight;
        const modalHeight = 600; // Approximate modal height
        const verticalOffset = this.cascadeCycle * baseOffset;
        
        // Check if this vertical offset would go past viewport (leaving 100px margin)
        const wouldExceedViewport = (viewportHeight / 2 + verticalOffset + modalHeight / 2) > (viewportHeight - 100);
        
        let finalVerticalOffset;
        if (wouldExceedViewport) {
            // Reset cascade cycle to 1 (not 0) so next modal starts cascading
            this.cascadeCycle = 1;
            finalVerticalOffset = 0;
        } else {
            // Continue cascading diagonally
            finalVerticalOffset = verticalOffset;
            this.cascadeCycle++;
        }
        
        modal.style.left = `calc(50% + ${horizontalOffset}px)`;
        modal.style.top = `calc(50% + ${finalVerticalOffset}px)`;
        modal.style.zIndex = 1050 + this.modals.length;
        backdrop.style.zIndex = 1040 + this.modals.length;
        
        modal.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title" id="modal-title-${this.modals.length}">${this.escapeHtml(title)}</h3>
                <button class="close-button" aria-label="Close modal" type="button">&times;</button>
            </div>
            <div class="modal-body">
                <pre></pre>
            </div>
        `;
        
        const closeBtn = modal.querySelector('.close-button');
        const preElement = modal.querySelector('pre');
        
        closeBtn.onclick = () => this.close(modal, backdrop);
        backdrop.onclick = () => this.close(modal, backdrop);
        
        document.body.appendChild(backdrop);
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        // Display modal with animation
        modal.style.display = 'flex';
        
        this.modals.push({ modal, backdrop, preElement });
        
        // Focus close button for accessibility
        closeBtn.focus();
        
        return preElement;
    }

    close(modal, backdrop) {
        modal.style.display = 'none';
        modal.remove();
        backdrop.remove();
        
        this.modals = this.modals.filter(m => m.modal !== modal);
        
        // Decrement cascade cycle when closing modals
        if (this.cascadeCycle > 0) {
            this.cascadeCycle--;
        }
        
        if (this.modals.length === 0) {
            document.body.style.overflow = '';
            this.cascadeCycle = 0; // Reset cycle when all modals are closed
        }
    }

    closeAll() {
        this.modals.forEach(({ modal, backdrop }) => {
            modal.remove();
            backdrop.remove();
        });
        this.modals = [];
        this.cascadeCycle = 0; // Reset cascade cycle
        document.body.style.overflow = '';
    }

    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modals.length > 0) {
                const last = this.modals[this.modals.length - 1];
                this.close(last.modal, last.backdrop);
            }
        });
    }

    escapeHtml(unsafe) {
        const div = document.createElement('div');
        div.textContent = unsafe;
        return div.innerHTML;
    }
}

const modalManager = new ModalManager();

/* ============================================
   Utility Functions
   ============================================ */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function escapeHtml(unsafe) {
    const div = document.createElement('div');
    div.textContent = unsafe;
    return div.innerHTML;
}

function showLoading(element) {
    if (element.tagName === 'BUTTON') {
        element.classList.add('loading');
        element.disabled = true;
    } else {
        element.innerHTML = '<div class="loading-spinner" role="status"><span class="sr-only">Loading...</span></div>';
    }
}

function hideLoading(element, originalText = '') {
    if (element.tagName === 'BUTTON') {
        element.classList.remove('loading');
        element.disabled = false;
    }
}

/* ============================================
   Main Application
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    const navMenu = document.getElementById('nav-menu');
    let currentPage = null;

    // Populate sidebar navigation
    if (typeof appModules !== 'undefined') {
        appModules.forEach(module => {
            const li = document.createElement('li');
            const moduleLink = document.createElement('a');
            moduleLink.href = '#';
            moduleLink.textContent = module.name;
            moduleLink.className = 'module-link';
            moduleLink.dataset.module = module.name;
            moduleLink.dataset.type = module.type;
            moduleLink.setAttribute('role', 'button');
            li.appendChild(moduleLink);
            navMenu.appendChild(li);
        });
    }

    // File mapping for navigation
    const fileMap = {
        'Run Opcode': 'run_opcode.html',
        'Quick SQL': 'quick_sql.html',
        'Utilities': 'utilities.html'
    };

    // Function to cleanup current page
    function cleanupCurrentPage() {
        // Close all modals
        modalManager.closeAll();
        
        // Reset body overflow
        document.body.style.overflow = '';
        
        // Clear any active dropdowns
        document.querySelectorAll('.dropdown-content').forEach(el => {
            el.style.display = 'none';
        });
    }

    // Function to load content from file
    function loadContent(fileName, moduleName) {
        cleanupCurrentPage();
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = '<div class="loading-spinner" style="margin: 50px auto;"></div>';
        
        fetch(`public/${fileName}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                mainContent.innerHTML = html;
                currentPage = fileName.replace('.html', '');
                
                // Update active nav link
                document.querySelectorAll('.module-link').forEach(link => {
                    if (link.dataset.module === moduleName) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
                
                // Initialize the loaded content
                initializeContent(currentPage);
            })
            .catch(error => {
                console.error('Error loading content:', error);
                mainContent.innerHTML = '<div class="empty-state"><p class="empty-state-title">Error Loading Content</p><p class="empty-state-text">Unable to load the requested page. Please try again.</p></div>';
                toast.error('Failed to load page');
            });
    }

    // Function to initialize loaded content
    function initializeContent(sectionType) {
        if (sectionType === 'run_opcode') {
            initializeRunOpcode();
        } else if (sectionType === 'quick_sql') {
            initializeQuickSQL();
        } else if (sectionType === 'utilities') {
            initializeUtilities();
        }
    }

    // Initialize Run Opcode page
    function initializeRunOpcode() {
        const domainSelect = document.getElementById('domain-select');
        const taskSelect = document.getElementById('task-select');
        const opcodeInput = document.getElementById('opcode');
        const flagInput = document.getElementById('flag');
        const flistTextarea = document.getElementById('flist');
        const form = document.getElementById('run-opcode-form');

        if (!domainSelect || !form) return;

        // Populate domain select
        const opcodesModule = appModules.find(m => m.type === 'opcodes');
        if (opcodesModule && opcodesModule.domains) {
            opcodesModule.domains.forEach(domainData => {
                const option = new Option(domainData.domain, domainData.domain);
                domainSelect.add(option);
            });
        }

        // Handle Domain dropdown changes
        domainSelect.addEventListener('change', (e) => {
            const selectedDomainName = e.target.value;
            taskSelect.innerHTML = '<option value="">-- Select a Task --</option>';
            opcodeInput.value = '';
            flagInput.value = '0';
            flistTextarea.value = '';

            if (selectedDomainName) {
                const domain = opcodesModule.domains.find(d => d.domain === selectedDomainName);
                if (domain && domain.examples) {
                    domain.examples.forEach(example => {
                        const option = new Option(example.task, example.task);
                        taskSelect.add(option);
                    });
                }
            }
        });

        // Handle Task dropdown changes
        taskSelect.addEventListener('change', (e) => {
            const selectedTaskName = e.target.value;
            const selectedDomainName = domainSelect.value;

            if (selectedTaskName && selectedDomainName) {
                const domain = opcodesModule.domains.find(d => d.domain === selectedDomainName);
                const example = domain?.examples.find(ex => ex.task === selectedTaskName);

                if (example) {
                    opcodeInput.value = example.opcode;
                    flagInput.value = example.flag;
                    flistTextarea.value = example.flist;
                }
            }
        });

        // Attach form submit listener
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitButton = form.querySelector('button[type="submit"]');
            const resultsElement = document.getElementById('opcode-results');
            
            const formData = {
                opcode: opcodeInput.value.trim(),
                flag: flagInput.value.trim(),
                flist: flistTextarea.value.trim(),
            };

            // Validation
            if (!formData.opcode) {
                toast.error('Please enter an opcode');
                opcodeInput.focus();
                return;
            }

            showLoading(submitButton);
            fetchAndDisplayOpcodeResponse(formData, resultsElement, submitButton);
        });
    }

    // Initialize Quick SQL page
    function initializeQuickSQL() {
        const domainSelect = document.getElementById('sql-domain-select');
        const taskSelect = document.getElementById('sql-task-select');
        const sqlTextarea = document.getElementById('sql-textarea');
        const form = document.getElementById('run-sql-form');

        if (!domainSelect || !form) return;

        // Populate domain select
        const sqlModule = appModules.find(m => m.type === 'sql');
        if (sqlModule && sqlModule.domains) {
            sqlModule.domains.forEach(domainData => {
                const option = new Option(domainData.domain, domainData.domain);
                domainSelect.add(option);
            });
        }

        // Handle Domain dropdown changes
        domainSelect.addEventListener('change', (e) => {
            const selectedDomainName = e.target.value;
            taskSelect.innerHTML = '<option value="">-- Select a SQL Query --</option>';
            sqlTextarea.value = '';

            if (selectedDomainName) {
                const domain = sqlModule.domains.find(d => d.domain === selectedDomainName);
                if (domain && domain.examples) {
                    domain.examples.forEach(example => {
                        const option = new Option(example.task, example.task);
                        taskSelect.add(option);
                    });
                }
            }
        });

        // Handle Task dropdown changes
        taskSelect.addEventListener('change', (e) => {
            const selectedTaskName = e.target.value;
            const selectedDomainName = domainSelect.value;

            if (selectedTaskName && selectedDomainName) {
                const domain = sqlModule.domains.find(d => d.domain === selectedDomainName);
                const example = domain?.examples.find(ex => ex.task === selectedTaskName);

                if (example) {
                    sqlTextarea.value = example.sql;
                }
            }
        });

        // Attach form submit listener
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitButton = form.querySelector('button[type="submit"]');
            const resultsElement = document.getElementById('sql-results');
            
            const formData = {
                sql: sqlTextarea.value.trim(),
            };

            // Validation
            if (!formData.sql) {
                toast.error('Please enter a SQL query');
                sqlTextarea.focus();
                return;
            }

            showLoading(submitButton);
            fetchAndDisplaySqlResponse(formData, resultsElement, submitButton);
        });
    }

    // Initialize Utilities page
    function initializeUtilities() {
        const epochInput = document.getElementById('epochInput');
        const readableInput = document.getElementById('readableInput');
        const timezoneFilter = document.getElementById('timezoneFilter');
        const timezoneDropdown = document.getElementById('timezoneDropdown');
        const convertRight = document.getElementById('convertRight');
        const convertLeft = document.getElementById('convertLeft');
        const nowButton = document.getElementById('nowButton');

        if (!epochInput || !readableInput) return;

        let timezones = Intl.supportedValuesOf('timeZone');
        if (!timezones.includes('Etc/UTC') && !timezones.includes('UTC')) {
            timezones = ['UTC', ...timezones];
        }
        
        let selectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        timezoneFilter.value = selectedTimezone;

        function filterTimezones(query) {
            return timezones.filter(tz => tz.toLowerCase().includes(query.toLowerCase()));
        }

        function renderTimezoneOptions(filteredTimezones) {
            timezoneDropdown.innerHTML = '';
            filteredTimezones.forEach(tz => {
                const option = document.createElement('div');
                option.className = 'timezone-option';
                if (tz === selectedTimezone) option.classList.add('selected');
                option.textContent = tz;
                option.addEventListener('click', () => {
                    selectedTimezone = tz;
                    timezoneFilter.value = tz;
                    timezoneDropdown.classList.remove('active');
                });
                timezoneDropdown.appendChild(option);
            });
        }

        timezoneFilter.addEventListener('focus', () => {
            renderTimezoneOptions(filterTimezones(timezoneFilter.value));
            timezoneDropdown.classList.add('active');
        });

        timezoneFilter.addEventListener('input', debounce((e) => {
            renderTimezoneOptions(filterTimezones(e.target.value));
            timezoneDropdown.classList.add('active');
        }, 300));

        timezoneFilter.addEventListener('blur', () => {
            setTimeout(() => {
                timezoneDropdown.classList.remove('active');
                if (!timezones.includes(timezoneFilter.value)) {
                    timezoneFilter.value = selectedTimezone;
                }
            }, 200);
        });

        epochInput.addEventListener('input', () => readableInput.value = '');
        readableInput.addEventListener('input', () => epochInput.value = '');

        function formatDateToReadable(date, timezone) {
            const formatter = new Intl.DateTimeFormat('en-CA', {
                timeZone: timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            
            const parts = formatter.formatToParts(date);
            const year = parts.find(p => p.type === 'year').value;
            const month = parts.find(p => p.type === 'month').value;
            const day = parts.find(p => p.type === 'day').value;
            const hour = parts.find(p => p.type === 'hour').value;
            const minute = parts.find(p => p.type === 'minute').value;
            const second = parts.find(p => p.type === 'second').value;
            
            return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
        }

        function parseReadableToDate(readable, timezone) {
            const match = readable.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
            if (!match) return null;
            
            const [, year, month, day, hour, minute, second] = match;
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
                timeZoneName: 'shortOffset'
            });
            
            const utcDate = new Date(Date.UTC(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                parseInt(hour),
                parseInt(minute),
                parseInt(second)
            ));
            
            const parts = formatter.formatToParts(utcDate);
            const offsetPart = parts.find(p => p.type === 'timeZoneName');
            let offsetMinutes = 0;
            
            if (offsetPart && offsetPart.value.match(/GMT([+-]\d+)/)) {
                const offsetMatch = offsetPart.value.match(/GMT([+-])(\d+)(?::(\d+))?/);
                if (offsetMatch) {
                    const sign = offsetMatch[1] === '+' ? 1 : -1;
                    const hours = parseInt(offsetMatch[2]) || 0;
                    const minutes = parseInt(offsetMatch[3]) || 0;
                    offsetMinutes = sign * (hours * 60 + minutes);
                }
            }
            
            return new Date(utcDate.getTime() - offsetMinutes * 60000);
        }

        convertRight.addEventListener('click', () => {
            const epoch = parseInt(epochInput.value);
            if (isNaN(epoch)) {
                toast.error('Please enter a valid Unix Epoch timestamp');
                epochInput.focus();
                return;
            }
            readableInput.value = formatDateToReadable(new Date(epoch * 1000), selectedTimezone);
            toast.success('Converted to readable time');
        });

        convertLeft.addEventListener('click', () => {
            if (!readableInput.value) {
                toast.error('Please enter a readable time');
                readableInput.focus();
                return;
            }
            const date = parseReadableToDate(readableInput.value, selectedTimezone);
            if (!date || isNaN(date.getTime())) {
                toast.error('Please enter a valid time in format: YYYY-MM-DD HH:mm:ss');
                readableInput.focus();
                return;
            }
            epochInput.value = Math.floor(date.getTime() / 1000);
            toast.success('Converted to Unix Epoch');
        });

        nowButton.addEventListener('click', () => {
            const now = new Date();
            epochInput.value = Math.floor(now.getTime() / 1000);
            readableInput.value = formatDateToReadable(now, selectedTimezone);
            toast.info('Current time loaded');
        });
    }

    // Handle navigation clicks
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('module-link')) {
            e.preventDefault();
            const moduleName = e.target.dataset.module;
            const fileName = fileMap[moduleName];
            if (fileName) {
                loadContent(fileName, moduleName);
            }
        }
    });

    // Keyboard navigation for POID links
    document.addEventListener('keydown', (e) => {
        if (e.target.classList.contains('poid')) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.target.click();
            }
        }
    });

    /**
     * Fetches opcode data and displays it in a specified target element.
     */
    function fetchAndDisplayOpcodeResponse(opcodeData, targetElement, submitButton) {
        targetElement.innerHTML = '<div class="loading-overlay"><div class="loading-spinner"></div></div>';

        fetch('/run_opcode', {
            method: 'POST',
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(opcodeData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            hideLoading(submitButton);
            if (data && data.trim()) {
                const escapedData = escapeHtml(data);
                const highlightedData = escapedData.replace(
                    /(\d+\.\d+\.\d+\.\d+\s+\/\S+\s+\d+\s+\d+)/g,
                    '<span class="poid" role="button" tabindex="0">$&</span>'
                );
                targetElement.innerHTML = highlightedData;
                addPoidClickListenersTo(targetElement.parentElement);
                toast.success('Opcode executed successfully');
            } else {
                targetElement.innerHTML = '<div class="empty-state"><p class="empty-state-text">No output received from the server.</p></div>';
                toast.warning('No output received');
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            hideLoading(submitButton);
            targetElement.innerHTML = `<div class="empty-state"><p class="empty-state-title">Error</p><p class="empty-state-text">${escapeHtml(error.message)}</p></div>`;
            toast.error(`Error: ${error.message}`);
        });
    }

    /**
     * Fetches SQL data and displays it in a specified target element.
     */
    function fetchAndDisplaySqlResponse(sqlData, targetElement, submitButton) {
        targetElement.innerHTML = '<div class="loading-overlay"><div class="loading-spinner"></div></div>';

        fetch('/run_sql', {
            method: 'POST',
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(sqlData)
        })
        .then(response => {
            return response.text().then(text => {
                if (!response.ok) {
                    throw new Error(text || `Server error: ${response.status}`);
                }
                return text;
            });
        })
        .then(data => {
            hideLoading(submitButton);
            if (data && data.trim()) {
                const sql = sqlData.sql.toUpperCase().trim();
                if (sql.startsWith('SELECT')) {
                    const lines = data.split('\n').map(line => line.trim()).filter(line => line);
                    if (lines.length >= 2 && lines[1].match(/^[-§ ]+$/)) {
                        const headers = lines[0].split('§').map(h => h.trim());
                        const dataLines = lines.slice(2);
                        
                        const tableContainer = document.createElement('div');
                        tableContainer.className = 'table-container';
                        
                        const table = document.createElement('table');
                        table.className = 'sql-results-table';
                        const thead = document.createElement('thead');
                        const tbody = document.createElement('tbody');

                        const headerRow = document.createElement('tr');
                        headers.forEach(header => {
                            const th = document.createElement('th');
                            th.textContent = header;
                            headerRow.appendChild(th);
                        });
                        thead.appendChild(headerRow);

                        dataLines.forEach(line => {
                            const cells = line.split('§').map(c => c.trim());
                            if (cells.length === headers.length) {
                                const row = document.createElement('tr');
                                cells.forEach(cell => {
                                    const td = document.createElement('td');
                                    td.textContent = cell;
                                    row.appendChild(td);
                                });
                                tbody.appendChild(row);
                            }
                        });

                        table.appendChild(thead);
                        table.appendChild(tbody);
                        tableContainer.appendChild(table);
                        targetElement.innerHTML = '';
                        targetElement.appendChild(tableContainer);
                        
                        toast.success(`Query returned ${tbody.children.length} rows`);
                    } else {
                        targetElement.innerHTML = `<pre>${escapeHtml(data)}</pre>`;
                        toast.info('Query executed');
                    }
                } else {
                    targetElement.innerHTML = `<pre>${escapeHtml(data)}</pre>`;
                    toast.success('SQL executed successfully');
                }
            } else {
                targetElement.innerHTML = '<div class="empty-state"><p class="empty-state-text">No output received from the server.</p></div>';
                toast.warning('No output received');
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            hideLoading(submitButton);
            targetElement.innerHTML = `<div class="empty-state"><p class="empty-state-title">Error</p><p class="empty-state-text">${escapeHtml(error.message)}</p></div>`;
            toast.error(`Error: ${error.message}`);
        });
    }

    /**
     * Creates and displays a new modal for a given POID.
     */
    function createNewModalForPoid(poidText) {
        const preElement = modalManager.open('Loading...', `Details for: ${poidText}`);
        
        // Prepare data and fetch results for the modal
        const readObjData = {
            opcode: 'PCM_OP_READ_OBJ',
            flag: '0',
            flist: `0 PIN_FLD_POID POID [0] ${poidText}`
        };
        
        preElement.textContent = 'Loading POID details...';
        
        fetch('/run_opcode', {
            method: 'POST',
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(readObjData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            if (data && data.trim()) {
                const escapedData = escapeHtml(data);
                const highlightedData = escapedData.replace(
                    /(\d+\.\d+\.\d+\.\d+\s+\/\S+\s+\d+\s+\d+)/g,
                    '<span class="poid" role="button" tabindex="0">$&</span>'
                );
                preElement.innerHTML = highlightedData;
                addPoidClickListenersTo(preElement.parentElement);
            } else {
                preElement.textContent = 'No output received from the server.';
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            preElement.textContent = `Error: ${error.message}`;
            toast.error('Failed to load POID details');
        });
    }

    /**
     * Finds all elements with the 'poid' class within a given container
     * and attaches a click event listener to them.
     */
    function addPoidClickListenersTo(container) {
        const poids = container.querySelectorAll('.poid');
        poids.forEach(poidElement => {
            if (poidElement.dataset.listenerAttached) return;

            poidElement.dataset.listenerAttached = 'true';
            poidElement.addEventListener('click', (e) => {
                e.stopPropagation();
                createNewModalForPoid(e.target.textContent);
            });
        });
    }

    // Load default content
    loadContent('run_opcode.html', 'Run Opcode');
});