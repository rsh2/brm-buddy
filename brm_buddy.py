"""
BRM Buddy - Web Interface for Oracle BRM Development

Goals:
1. Compatibility: Works with both Python 2 and Python 3 for legacy and modern BRM environments
2. Zero Dependencies: Uses only core Python libraries to minimize installation complexity
3. BRM Agnostic: Remains generic and doesn't depend on custom BRM implementations

Architecture:
- Simple HTTP server for serving static files and handling API requests
- Shell script wrappers for testnap (opcode execution) and sqlplus (SQL queries)
- No external dependencies beyond Python standard library
"""

import os
import sys
import settings

# =============================================================================
# CONFIGURATION
# =============================================================================

PORT = settings.PORT
DB_USER = settings.DB_USER
DB_PASSWORD = settings.DB_PASSWORD
DB_SERVICE = settings.DB_SERVICE
TESTNAP_HOME = settings.TESTNAP_HOME


# =============================================================================
# PYTHON 2/3 COMPATIBILITY LAYER
# =============================================================================
# All version-specific imports and compatibility helpers are isolated here
# to keep the main business logic clean and readable.

# Python version detection
PY3 = sys.version_info[0] >= 3

# HTTP Server imports
try:
    # Python 2
    from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
    from SocketServer import ThreadingMixIn
except ImportError:
    # Python 3
    from http.server import BaseHTTPRequestHandler, HTTPServer
    from socketserver import ThreadingMixIn

# URL parsing imports
# Handle Python 2 vs Python 3 differences
if PY3:
    # Python 3
    import urllib.parse as urlparse
    parse_qs = urlparse.parse_qs
else:
    # Python 2
    import urlparse
    import urllib
    # parse_qs was added in Python 2.6, may not exist in 2.3.4
    try:
        parse_qs = urlparse.parse_qs
    except AttributeError:
        # Will use fallback parse_qs function defined below
        parse_qs = None

# Subprocess imports (with fallback for very old Python 2)
try:
    import subprocess
    HAS_SUBPROCESS = True
except ImportError:
    subprocess = None
    HAS_SUBPROCESS = False


# Compatibility helper functions
def decode_bytes(data):
    """
    Decode bytes to string in Python 3, pass through in Python 2.
    
    Args:
        data: bytes or str
    
    Returns:
        str: Decoded string
    """
    if PY3 and isinstance(data, bytes):
        return data.decode('utf-8')
    return data


def encode_string(text):
    """
    Encode string to bytes in Python 3, pass through in Python 2.
    
    Args:
        text: str
    
    Returns:
        bytes or str: Encoded data
    """
    if PY3 and isinstance(text, str):
        return text.encode('utf-8')
    return text


def url_decode(text):
    """
    URL decode text in a version-agnostic way.
    
    Args:
        text: URL-encoded string
    
    Returns:
        str: Decoded string
    """
    if PY3:
        return urlparse.unquote(text)
    else:
        # Python 2 requires manual space handling
        text = text.replace('+', ' ')
        return urllib.unquote(text)


def get_content_length(headers):
    """
    Get Content-Length header in a version-agnostic way.
    
    Args:
        headers: HTTP headers object
    
    Returns:
        int: Content length or 0 if not found
    """
    try:
        # Python 2
        return int(headers.getheader('Content-Length'))
    except (AttributeError, TypeError, ValueError):
        try:
            # Python 3
            return int(headers.get('Content-Length', 0))
        except (TypeError, ValueError):
            return 0


def parse_query_string(qs):
    """
    Parse query string with fallback for very old Python versions.
    
    Args:
        qs: Query string (e.g., "a=1&b=2")
    
    Returns:
        dict: Dictionary where each key maps to a list of values
    """
    # Try to use parse_qs if available (Python 2.6+ or Python 3)
    if parse_qs is not None:
        try:
            return parse_qs(qs)
        except:
            pass
    
    # Manual fallback for Python 2.3.4 and other old versions
    result = {}
    pairs = qs.split('&')
    for pair in pairs:
        if '=' in pair:
            k, v = pair.split('=', 1)
            k, v = k.strip(), v.strip()
            result.setdefault(k, []).append(v)
        else:
            k = pair.strip()
            result.setdefault(k, []).append('')
    return result


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def display(msg):
    """
    Output a message to stdout with immediate flush.
    
    Args:
        msg: Message to display
    """
    sys.stdout.write(msg + "\n")
    sys.stdout.flush()


def run_cmd(cmd):
    """
    Execute a shell command and return its output.
    
    Tries subprocess first (preferred), falls back to os.popen for very old Python 2.
    
    Args:
        cmd: List of command arguments (e.g., ['ls', '-la'])
    
    Returns:
        str: Command output
    """
    if HAS_SUBPROCESS:
        return _run_cmd_subprocess(cmd)
    else:
        return _run_cmd_popen(cmd)


def _run_cmd_subprocess(cmd):
    """
    Execute command using subprocess module (preferred method).
    
    Args:
        cmd: List of command arguments
    
    Returns:
        str: Command output
    """
    try:
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT
        )
        output = proc.communicate()[0]
        return decode_bytes(output)
    except:
        # Get exception info in a way compatible with all Python versions
        exc_info = sys.exc_info()
        return "Error running command %s: %s" % (cmd, str(exc_info[1]))


def _run_cmd_popen(cmd):
    """
    Execute command using os.popen (fallback for old Python 2).
    
    Args:
        cmd: List of command arguments
    
    Returns:
        str: Command output
    """
    try:
        import pipes
        # Python 2.3 doesn't support generator expressions, use list comprehension
        cmdstr = " ".join([pipes.quote(arg) for arg in cmd])
        process = os.popen(cmdstr)
        output = process.read()
        process.close()
        return output
    except:
        # Get exception info in a way compatible with all Python versions
        exc_info = sys.exc_info()
        return "Error running command %s: %s" % (cmd, str(exc_info[1]))


def get_content_type(filepath):
    """
    Determine Content-Type header based on file extension.
    
    Args:
        filepath: Path to file
    
    Returns:
        str: MIME type
    """
    ext = os.path.splitext(filepath)[1].lower()
    
    mime_types = {
        '.html': 'text/html',
        '.htm': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.txt': 'text/plain',
        '.pdf': 'application/pdf',
        '.zip': 'application/zip',
    }
    
    return mime_types.get(ext, 'application/octet-stream')


def extract_post_param(post_data, param_name, default=''):
    """
    Extract a parameter from parsed POST data.
    
    Args:
        post_data: Parsed POST data dictionary
        param_name: Parameter name to extract
        default: Default value if not found
    
    Returns:
        str: Parameter value or default
    """
    if param_name in post_data and len(post_data[param_name]) > 0:
        return post_data[param_name][0]
    return default


# =============================================================================
# HTTP SERVER
# =============================================================================

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """
    Multi-threaded HTTP server to handle concurrent requests.
    
    This allows multiple users to use the tool simultaneously without blocking.
    """
    pass


class RequestHandler(BaseHTTPRequestHandler):
    """
    HTTP request handler for BRM Buddy web interface.
    
    Handles:
    - GET requests: Serve static files (HTML, CSS, JS)
    - POST requests: Execute opcodes and SQL queries
    """
    
    def do_GET(self):
        """
        Handle GET requests for static files.
        
        Serves files from the public/ directory. Defaults to index.html for root path.
        """
        filepath = self._get_filepath()
        
        if not os.path.exists(filepath):
            self.send_error(404, "File Not Found: %s" % filepath)
            return
        
        try:
            self._serve_file(filepath)
        except IOError:
            # Get exception info in a way compatible with all Python versions
            exc_info = sys.exc_info()
            self.send_error(500, 'Error Reading File: %s' % str(exc_info[1]))
    
    def do_POST(self):
        """
        Handle POST requests for BRM operations.
        
        Supported endpoints:
        - /run_opcode: Execute BRM opcode via testnap
        - /run_sql: Execute SQL query via sqlplus
        """
        action_path = self.path.lstrip('/')
        post_data = self._read_post_data()
        
        if action_path == 'run_opcode':
            response = self._handle_run_opcode(post_data)
        elif action_path == 'run_sql':
            response = self._handle_run_sql(post_data)
        else:
            response = "Unknown action: %s" % action_path
        
        self._send_text_response(response)
    
    # Private helper methods for cleaner code organization
    
    def _get_filepath(self):
        """Determine the file path from the request URL."""
        path = self.path.lstrip('/')
        # Python 2.3 doesn't support ternary operator, use 'or' instead
        return path or "public/index.html"
    
    def _serve_file(self, filepath):
        """Read and serve a static file with appropriate Content-Type."""
        # Python 2.3 doesn't support 'with' statement, use try/finally
        f = open(filepath, 'rb')
        try:
            content = f.read()
        finally:
            f.close()
        
        self.send_response(200)
        self.send_header('Content-type', get_content_type(filepath))
        self.end_headers()
        self.wfile.write(content)
    
    def _read_post_data(self):
        """Read and parse POST data from request body."""
        length = get_content_length(self.headers)
        raw_data = self.rfile.read(length)
        
        # Decode and parse based on Python version
        if PY3:
            return parse_query_string(raw_data.decode('utf-8'))
        else:
            return parse_query_string(raw_data)
    
    def _handle_run_opcode(self, post_data):
        """
        Handle opcode execution request.
        
        Args:
            post_data: Parsed POST parameters
        
        Returns:
            str: Opcode execution result
        """
        opcode = extract_post_param(post_data, 'opcode')
        flag = extract_post_param(post_data, 'flag')
        flist = extract_post_param(post_data, 'flist')
        
        # URL decode the flist
        flist = url_decode(flist).strip()
        
        display("Running opcode: %s, flag: %s, flist:\n%s" % (opcode, flag, flist))
        
        return self._execute_opcode(opcode, flag, flist)
    
    def _handle_run_sql(self, post_data):
        """
        Handle SQL execution request.
        
        Args:
            post_data: Parsed POST parameters
        
        Returns:
            str: SQL execution result
        """
        sql = extract_post_param(post_data, 'sql')
        sql = url_decode(sql)
        
        display("Running SQL: %s" % sql.strip())
        
        return self._execute_sql(sql)
    
    def _send_text_response(self, text):
        """Send a plain text response to the client."""
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(encode_string(text))
    
    def _execute_opcode(self, opcode, flag, flist):
        """
        Execute BRM opcode using testnap wrapper script.
        
        Args:
            opcode: Opcode number
            flag: Opcode flags
            flist: Field list input
        
        Returns:
            str: Execution output
        """
        return run_cmd([
            "scripts/call_testnap.sh",
            opcode,
            flag,
            flist
        ])
    
    def _execute_sql(self, sql):
        """
        Execute SQL query using sqlplus wrapper script.
        
        Args:
            sql: SQL query
        
        Returns:
            str: Query output
        """
        return run_cmd([
            "scripts/call_sqlplus.sh",
            DB_USER,
            DB_PASSWORD,
            DB_SERVICE,
            sql
        ])


# =============================================================================
# APPLICATION INITIALIZATION
# =============================================================================

def setup_scripts():
    """
    Configure and prepare helper scripts for execution.
    
    - Updates testnap script with correct TESTNAP_HOME path
    - Makes scripts executable
    """
    # Update testnap home directory in shell script
    run_cmd([
        "sed", "-i",
        "s#^test_home=.*#test_home=%s#g" % TESTNAP_HOME,
        "scripts/call_testnap.sh"
    ])
    
    # Make scripts executable
    run_cmd(["chmod", "+x", "scripts/call_testnap.sh"])
    run_cmd(["chmod", "+x", "scripts/call_sqlplus.sh"])


def start_server():
    """
    Start the HTTP server and listen for requests.
    
    Returns:
        ThreadedHTTPServer: Server instance
    """
    server = ThreadedHTTPServer(('0.0.0.0', PORT), RequestHandler)
    display("Serving HTTP on port %d ..." % PORT)
    display("Access the application at http://localhost:%d/" % PORT)
    return server


def main():
    """
    Main entry point for BRM Buddy application.
    
    - Sets up helper scripts
    - Starts HTTP server
    - Handles graceful shutdown on Ctrl+C
    """
    display("Starting BRM Buddy...")
    display("Python version: %s" % sys.version)
    
    setup_scripts()
    server = start_server()
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        display("\nShutting down server...")
        server.server_close()
        display("Server stopped.")


# =============================================================================
# SCRIPT ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    main()
