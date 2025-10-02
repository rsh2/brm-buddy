# BRM Buddy

**BRM Buddy** is a lightweight web interface aimed at simplifying and streamlining development workflows with Oracle Billing and Revenue Management (BRM). It offers developers an intuitive, user-friendly toolset for more efficient interaction with BRM systems.

The backend is implemented in Python with minimal dependencies and is compatible with both Python 2 and Python 3 environments. To function properly, BRM Buddy must be installed on a system that also hosts the BRM server, as it relies on BRM command-line tools to perform its operations.

## Application Setup and Usage

### Prerequisites

- Oracle BRM server installed and configured on the host machine.
- Oracle Database access (for SQL feature).
- Python 2.x or Python 3.x (no external dependencies required).
- Access to the `testnap` utility and a valid `pin.conf` in your BRM environment.
- Access to `sqlplus` for database queries.

### Setup

1. **Clone or copy the repository to your BRM server.**
2. **Configure settings:**
    - Edit [`settings.py`](settings.py) to set the correct `PORT`, `TESTNAP_HOME` (the directory containing your testnap `pin.conf`), and Oracle database credentials (`DB_USER`, `DB_PASSWORD`, `DB_SERVICE`).
3. **Make sure the helper scripts are executable:**
    - The server will automatically update and set permissions for [`scripts/call_testnap.sh`](scripts/call_testnap.sh) and [`scripts/call_sqlplus.sh`](scripts/call_sqlplus.sh) on startup.

### Running the Application

Start the web server by running:

```sh
python brm_buddy.py
```

The server will listen on the port specified in [`settings.py`](settings.py) (default: 9876).

### Web Interface

The web interface is served from the [`public/`](public/) directory and consists of:

- [`public/index.html`](public/index.html): The main UI with navigation for different modules.
- [`public/run_opcode.html`](public/run_opcode.html): Interface for running BRM opcodes.
- [`public/quick_sql.html`](public/quick_sql.html): Interface for executing SQL queries against the Oracle database.
- [`public/utilities.html`](public/utilities.html): Interface for utilities like Unix Epoch converter.
- [`public/module_examples.js`](public/module_examples.js): Provides example opcodes and SQL queries grouped by domain and task, which are loaded into the UI for quick selection.
- [`public/style.css`](public/style.css): Styles the web interface for a clean, modern look.

#### Features

- **Run Opcode:** Execute BRM opcodes with domain and task selection to auto-fill fields, or enter custom opcodes manually. View results in real-time with POID drilldown.
- **Quick SQL:** Run SQL queries against the Oracle database with pre-defined examples by domain. Results are displayed in tabular format for SELECT queries.
- **Utilities:** Convert between Unix Epoch timestamps and readable dates with timezone support.
- **POID Drilldown:** Click on any highlighted POID in opcode output to open a modal with detailed object information (using `PCM_OP_READ_OBJ`).
- **Modular Interface:** Clean navigation between different tools with customizable examples.

#### Usage

1. **Open your browser and navigate to:**
    ```
    http://<your-server>:9876/
    ```
    > **Note:** If you updated the port in settings.py, then use that port number instead of `9876` in the URL above.
2. **Use the web interface:**
    - **Run Opcode:** Select "Run Opcode" from the sidebar. Choose a domain and task to auto-fill fields, or enter custom opcodes. Click "Run Opcode" to execute and view results. Click highlighted POIDs for drilldown.
    - **Quick SQL:** Select "Quick SQL" from the sidebar. Choose a domain and SQL query, or enter custom SQL. Click "Run SQL" to execute. SELECT results display in tables; other queries show plain text.
    - **Utilities:** Select "Utilities" from the sidebar. Use the Unix Epoch converter to convert between timestamps and readable dates, with timezone selection.

**Note:** The application is designed for use on systems with access to BRM tools and Oracle database, typically on the BRM server itself.
