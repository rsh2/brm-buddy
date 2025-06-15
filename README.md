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

### Usage

1. **Open your browser and navigate to:**
   ```
   http://<your-server>:9876/
   ```
   > **Note:** If you updated the port in settings.py, then use that port number instead of `9876` in the URL above.
2. **Use the web interface to:**
   - Enter an opcode, flag, and Flist.
   - Click "Run Opcode" to execute and view results.
   - Click on any highlighted POID in the output to drill down into object details (opens in a modal).

**Note:** The application is designed for use on the BRM server itself due to its reliance on local BRM tools.
