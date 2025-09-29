document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('run-opcode-form');
    const mainOutputElement = document.getElementById('opcode-results');
    const domainSelect = document.getElementById('domain-select');
    const taskSelect = document.getElementById('task-select');
    const opcodeInput = document.getElementById('opcode');
    const flagInput = document.getElementById('flag');
    const flistTextarea = document.getElementById('flist');
    const navMenu = document.getElementById('nav-menu');
    let modalCount = 0; // Counter for cascading modals
    var escapeElem = document.createElement('textarea');

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
            li.appendChild(moduleLink);

            navMenu.appendChild(li);
        });
    }

    // Function to load content from file
    function loadContent(fileName) {
        const mainContent = document.getElementById('main-content');
        fetch(`public/${fileName}`)
            .then(response => response.text())
            .then(html => {
                mainContent.innerHTML = html;
                // Initialize the loaded content
                initializeContent(fileName.replace('.html', ''));
            })
            .catch(error => {
                console.error('Error loading content:', error);
                mainContent.innerHTML = '<p>Error loading content.</p>';
            });
    }

    // Function to initialize loaded content
    function initializeContent(sectionType) {
        if (sectionType === 'run_opcode') {
            const domainSelect = document.getElementById('domain-select');
            const taskSelect = document.getElementById('task-select');
            const opcodeInput = document.getElementById('opcode');
            const flagInput = document.getElementById('flag');
            const flistTextarea = document.getElementById('flist');

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
            const form = document.getElementById('run-opcode-form');
            if (form) {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    modalCount = 0;
                    const formData = {
                        opcode: document.getElementById('opcode').value,
                        flag: document.getElementById('flag').value,
                        flist: document.getElementById('flist').value,
                    };
                    fetchAndDisplayOpcodeResponse(formData, document.getElementById('opcode-results'));
                });
            }
        } else if (sectionType === 'quick_sql') {
            const domainSelect = document.getElementById('sql-domain-select');
            const taskSelect = document.getElementById('sql-task-select');
            const sqlTextarea = document.getElementById('sql-textarea');

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
            const form = document.getElementById('run-sql-form');
            if (form) {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    const formData = {
                        sql: document.getElementById('sql-textarea').value,
                    };
                    fetchAndDisplaySqlResponse(formData, document.getElementById('sql-results'));
                });
            }
        }
    }

    // Handle clicks
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('module-link')) {
            e.preventDefault();
            const moduleName = e.target.dataset.module;
            const type = e.target.dataset.type;

            const fileMap = {
                 'Run Opcode': 'run_opcode.html',
                 'Quick SQL': 'quick_sql.html'
             };
            loadContent(fileMap[moduleName]);
        }
    });



    /**
     * Escapes HTML special characters to prevent XSS attacks.
     */
    function escapeHtml(unsafe) {
        escapeElem.textContent = unsafe;
        return escapeElem.innerHTML;
    }

    /**
     * Fetches opcode data and displays it in a specified target element.
     * After displaying, it makes any new POIDs in the output clickable.
     */
    function fetchAndDisplayOpcodeResponse(opcodeData, targetElement) {
        targetElement.textContent = 'Running...';

        fetch('/run_opcode', {
            method: 'POST',
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(opcodeData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            if (data) {
                // Sometimes the flist buffer can contain HTML tags, so we escape it
                // and then highlight the POIDs in the output.
                const escapedData = escapeHtml(data);
                const highlightedData = escapedData.replace(/(\d+\.\d+\.\d+\.\d+\s+\/\S+\s+\d+\s+\d+)/g, '<span class="poid">$&</span>');
                targetElement.innerHTML = highlightedData;
                addPoidClickListenersTo(targetElement.parentElement); // Add listeners to the container of the results
            } else {
                targetElement.textContent = 'No output received from the server.';
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            targetElement.textContent = `An error occurred: ${error.message}`;
        });
    }

    /**
     * Fetches SQL data and displays it in a specified target element.
     * Displays as table for SELECT queries, plain text otherwise.
     */
    function fetchAndDisplaySqlResponse(sqlData, targetElement) {
        targetElement.textContent = 'Running SQL...';

        fetch('/run_sql', {
            method: 'POST',
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(sqlData)
        })
        .then(response => {
            return response.text().then(text => {
                if (!response.ok) {
                    throw new Error(text || `HTTP error! status: ${response.status}`);
                }
                return text;
            });
        })
        .then(data => {
            if (data) {
                const sql = sqlData.sql.toUpperCase().trim();
                if (sql.startsWith('SELECT')) {
                    // Try to parse as table
                    const lines = data.split('\n').map(line => line.trim()).filter(line => line);
                    if (lines.length >= 2 && lines[1].match(/^[-§ ]+$/)) {
                        // Standard sqlplus output with § separator: headers, dashes, data
                        const headers = lines[0].split('§').map(h => h.trim());
                        const dataLines = lines.slice(2);
                        const table = document.createElement('table');
                        table.className = 'sql-results-table';
                        const thead = document.createElement('thead');
                        const tbody = document.createElement('tbody');

                        // Add headers
                        const headerRow = document.createElement('tr');
                        headers.forEach(header => {
                            const th = document.createElement('th');
                            th.textContent = header;
                            headerRow.appendChild(th);
                        });
                        thead.appendChild(headerRow);

                        // Add data rows
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
                        targetElement.innerHTML = '';
                        targetElement.appendChild(table);
                    } else {
                        // Not standard format or no data, show as plain text
                        targetElement.textContent = data;
                    }
                } else {
                    targetElement.textContent = data;
                }
            } else {
                targetElement.textContent = 'No output received from the server.';
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            targetElement.textContent = `An error occurred: ${error.message}`;
        });
    }

    /**
     * Creates and displays a new modal for a given POID.
     */
    function createNewModalForPoid(poidText) {
        modalCount++;
        const offset = modalCount * 35; // Offset for the cascading effect

        // Create modal elements
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.left = `${offset}px`;
        modal.style.top = `${offset}px`;
        modal.style.zIndex = 100 + modalCount;

        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';

        const modalTitle = document.createElement('div');
        modalTitle.className = 'modal-title';
        // Display the poid in the modal title
        modalTitle.textContent = `Details for: ${poidText}`;

        const closeButton = document.createElement('span');
        closeButton.className = 'close-button';
        closeButton.innerHTML = '&times;';
        closeButton.onclick = () => {
            modal.remove();
            modalCount--; // Decrement the counter when modal is closed
        };

        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        const pre = document.createElement('pre');
        modalBody.appendChild(pre);

        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(closeButton);
        modal.appendChild(modalHeader);
        modal.appendChild(modalBody);

        document.body.appendChild(modal);
        //Set display to 'flex' to enable body scrolling
        modal.style.display = 'flex';

        // Prepare data and fetch results for the modal
        const readObjData = {
            opcode: 'PCM_OP_READ_OBJ',
            flag: '0',
            flist: `0 PIN_FLD_POID POID [0] ${poidText}`
        };
        fetchAndDisplayOpcodeResponse(readObjData, pre);
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
    loadContent('run_opcode.html');
});