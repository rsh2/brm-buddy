"""
brm_buddy is designed to be compatible with both Python 2 and Python 3,
allowing it to run on legacy and modern Oracle BRM environments.

The tool avoids external dependencies by using only core Python libraries,
minimizing installation complexity.

Another key goal is to remain agnostic of any custom BRM implementations,
focusing purely on generic interaction and tooling.
"""

import os
import sys
import settings

PORT = settings.PORT

# Ensure compatibility between Python 2 and 3 for HTTP server and URL parsing
try:
    # Python 2 imports
    import BaseHTTPServer
    from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
    import urlparse
    import urllib
except ImportError:
    # Python 3 equivalents
    from http.server import BaseHTTPRequestHandler, HTTPServer
    import urllib.parse as urlparse

def display(msg):
    """
    Outputs a message to stdout and flushes it.
    Compatible with both Python 2 and 3.
    """
    sys.stdout.write(msg + "\n")
    sys.stdout.flush()

# Try to import subprocess for running shell commands
try:
    import subprocess
except ImportError:
    subprocess = None  # Not available in early Python 2 without installing manually

def run_cmd(cmd):
    """
    Executes a shell command and returns its output as a string.
    Falls back gracefully if subprocess is unavailable.
    """
    if subprocess is None:
        # Fallback to os.popen for old python 2.x
        import pipes
        cmdstr = ""
        for arg in cmd:
            cmdstr += pipes.quote(arg) + " "
        try:
            process = os.popen(cmdstr)
            output = process.read()
            process.close()
            return output
        except Exception:
            return "Error running command: %s " % cmd


    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        output = proc.communicate()[0]
        if sys.version_info[0] >= 3:
            return output.decode('utf-8')    # Decode bytes to string in Python 3
        return output
    except Exception:
        return "Error running command: %s " % cmd

# Try to use the standard parse_qs, or define a fallback for older Python versions
try:
    parse_qs = urlparse.parse_qs
except AttributeError:
    def parse_qs(qs):
        """
        Simple fallback parser for query strings (e.g., "a=1&b=2").
        Returns a dictionary where each key maps to a list of values.
        """
        result = {}
        pairs = qs.split('&')
        for pair in pairs:
            if '=' in pair:
                k, v = pair.split('=', 1)
                k = k.strip()
                v = v.strip()
                if k in result:
                    result[k].append(v)
                else:
                    result[k] = [v]
            else:
                # Handle keys with no value (e.g., "?debug")
                k = pair.strip()
                if k in result:
                    result[k].append('')
                else:
                    result[k] = ['']
        return result

def get_content_type(filepath):
    """
    Returns the appropriate Content-Type based on the file extension.
    Used when serving static files.
    """
    ext = os.path.splitext(filepath)[1].lower()
    if ext in ('.html', '.htm'):
        return 'text/html'
    elif ext == '.css':
        return 'text/css'
    elif ext == '.js':
        return 'application/javascript'
    elif ext == '.json':
        return 'application/json'
    elif ext in ('.png',):
        return 'image/png'
    elif ext in ('.jpg', '.jpeg'):
        return 'image/jpeg'
    elif ext == '.gif':
        return 'image/gif'
    elif ext == '.svg':
        return 'image/svg+xml'
    elif ext == '.ico':
        return 'image/x-icon'
    elif ext == '.txt':
        return 'text/plain'
    elif ext == '.pdf':
        return 'application/pdf'
    elif ext == '.zip':
        return 'application/zip'
    else:
        return 'application/octet-stream'   # Default for unknown types

class RequestHandler(BaseHTTPRequestHandler):
    """
    Handles incoming HTTP GET and POST requests.
    Used as the main handler for the built-in HTTP server.
    """

    def do_GET(self):
        """
        Handles GET requests.
        Serves index.html by default or the requested static file.
        """
        path = self.path.lstrip('/')
        if path:
            filepath = path
        else:
            filepath = "public/index.html"

        if not os.path.exists(filepath):
            self.send_error(404, "File Not Found: %s" % filepath)
            return

        try:
            file = open(filepath, 'rb')
            content = file.read()
            file.close()

            self.send_response(200)
            self.send_header('Content-type', get_content_type(filepath))
            self.end_headers()
            self.wfile.write(content)
        except IOError:
            self.send_error(500, 'Error Reading File: %s' % filepath)


    def do_POST(self):
        """
        Handles POST requests.
        Expects specific paths (e.g., /run_opcode) and parses POST data accordingly.
        """
        action_path = self.path.lstrip('/')
        try:
            length = int(self.headers.getheader('Content-Length'))
        except:
            try:
                length = int(self.headers['Content-Length'])
            except:
                length = 0

        post_data = self.rfile.read(length)

        if sys.version_info[0] >= 3:
            post_data = parse_qs(post_data.decode('utf-8'))
        else:
            post_data = parse_qs(post_data)

        if action_path == 'run_opcode':
            opcode = ''
            flag = ''
            flist = ''

            # Extract parameters from POST data
            if 'opcode' in post_data and len(post_data['opcode']) > 0:
                opcode = post_data['opcode'][0]
            if 'flag' in post_data and len(post_data['flag']) > 0:
                flag = post_data['flag'][0]
            if 'flist' in post_data and len(post_data['flist']) > 0:
                flist = post_data['flist'][0]

            # Decode URL-encoded flist
            if sys.version_info[0] >= 3:
                flist = urlparse.unquote(flist)
            else:
                flist = flist.replace('+', ' ')
                flist = urllib.unquote(flist)
            display("Running opcode: %s, flag: %s, flist:\n%s" % (opcode, flag, flist.strip()))

            response = self.run_opcode(opcode, flag, flist)
        else:
            response = "Unknown action"

        # Send back plain-text response
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()

        if sys.version_info[0] >= 3:
            self.wfile.write(response.encode('utf-8'))
        else:
            self.wfile.write(response)

    def run_opcode(self, opcode, flag, flist):
        """
        Executes the specified opcode using the testnap helper shell script.
        """
        return run_cmd(["scripts/call_testnap.sh", opcode, flag, flist])


def main():
    """
    Entry point: Starts the HTTP server and prepares the testnap helper script.
    """
    server = HTTPServer(('0.0.0.0', PORT), RequestHandler)
    display("Serving HTTP on port %d ..." % PORT)

    # Set testnap home directory in the shell script and ensure it is executable
    run_cmd(["sed", "-i", "s#^test_home=.*#test_home=%s#g" % settings.TESTNAP_HOME, "scripts/call_testnap.sh"])
    run_cmd(["chmod", "+x", "scripts/call_testnap.sh"])

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        display("\nShutting down server.")
        server.server_close()

if __name__ == "__main__":
    main()
