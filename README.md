# BRM Buddy

**BRM Buddy** is a lightweight web interface aimed at simplifying and streamlining development workflows with Oracle Billing and Revenue Management (BRM). It offers developers an intuitive, user-friendly toolset for more efficient interaction with BRM systems.

The backend is implemented in Python with minimal dependencies and is compatible with both Python 2 and Python 3 environments. To function properly, BRM Buddy must be installed on a system that also hosts the BRM server, as it relies on BRM command-line tools to perform its operations.

## Application Setup and Usage

### Prerequisites

- Oracle BRM server installed and configured on the host machine.
- Python 2.x or Python 3.x (no external dependencies required).
- Access to the `testnap` utility and a valid `pin.conf` in your BRM environment.

### Setup

1. **Clone or copy the repository to your BRM server.**
2. **Configure settings:**
   - Edit [`settings.py`](settings.py) to set the correct `PORT` and `TESTNAP_HOME` (the directory containing your testnap `pin.conf`).
3. **Make sure the helper script is executable:**
   - The server will automatically update and set permissions for [`scripts/call_testnap.sh`](scripts/call_testnap.sh) on startup.

### Running the Application

Start the web server by running:

```sh
python brm_buddy.py
```

The server will listen on the port specified in [`settings.py`](settings.py) (default: 9876).

### Web Interface

The web interface is served from the [`public/`](public/) directory and consists of:

- [`public/index.html`](public/index.html): The main UI for running opcodes, selecting domains and tasks, and viewing results.
- [`public/opcode_examples.js`](public/opcode_examples.js): Provides example opcodes, flags, and flists grouped by domain and task, which are loaded into the UI for quick selection.
- [`public/style.css`](public/style.css): Styles the web interface for a clean, modern look.

#### Features

- **Domain & Task Selection:** Choose from pre-defined domains and tasks to auto-fill opcode, flag, and flist fields.
- **Run Opcode:** Submit any opcode, flag, and flist to the backend and view the output in real time.
- **POID Drilldown:** Click on any highlighted POID in the output to open a modal with detailed object information (using `PCM_OP_READ_OBJ`).

#### Usage

1. **Open your browser and navigate to:**
   ```
   http://<your-server>:9876/
   ```
   > **Note:** If you updated the port in settings.py, then use that port number instead of `9876` in the URL above.
2. **Use the web interface to:**
   - Select a domain and task, or enter an opcode, flag, and Flist manually.
   - Click "Run Opcode" to execute and view results.
   - Click on any highlighted POID in the output to drill down into object details (opens in a modal).

**Note:** The application is designed for use on the BRM server itself due to its reliance on local BRM tools.
