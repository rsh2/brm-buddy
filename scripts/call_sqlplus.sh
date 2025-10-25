#!/bin/bash

################################################################################
# call_sqlplus.sh - Execute SQL queries against Oracle database using sqlplus
#
# Description:
#   Executes SQL queries via sqlplus with proper error handling, validation,
#   timeout protection, and secure credential handling. Credentials are passed
#   via stdin to avoid process list exposure.
#
# Arguments:
#   $1 - user: Database username
#   $2 - password: Database password
#   $3 - service: Oracle service name/connection string
#   $4 - sql: SQL query to execute
#
# Exit Codes:
#   0 - Success
#   1 - Invalid arguments or missing dependencies
#   2 - SQL execution failed
#   3 - Connection failed
#   124 - Timeout (if timeout command available)
################################################################################

# Strict error handling
set -euo pipefail

# Configuration
readonly SQLPLUS_TIMEOUT=300  # 5 minutes default timeout
readonly TEMP_SQL_PREFIX="/tmp/brm_buddy_sql"

# Temporary file for cleanup tracking
temp_sql_file=""

################################################################################
# Cleanup Function
################################################################################
cleanup() {
    local exit_code=$?
    
    # Securely remove temporary SQL file (may contain sensitive data)
    if [[ -n "${temp_sql_file}" && -f "${temp_sql_file}" ]]; then
        # Overwrite with zeros before deletion for security
        if command -v shred >/dev/null 2>&1; then
            shred -uz "${temp_sql_file}" 2>/dev/null || rm -f "${temp_sql_file}" 2>/dev/null
        else
            rm -f "${temp_sql_file}" 2>/dev/null || true
        fi
    fi
    
    exit "${exit_code}"
}

# Set trap for cleanup on exit/error
trap cleanup EXIT INT TERM

################################################################################
# Error Reporting Function
################################################################################
error_exit() {
    local message="$1"
    local exit_code="${2:-1}"
    
    echo "ERROR: ${message}" >&2
    exit "${exit_code}"
}

################################################################################
# Usage Information
################################################################################
usage() {
    cat >&2 << EOF
Usage: $(basename "$0") <user> <password> <service> <sql>

Arguments:
    user      Database username
    password  Database password
    service   Oracle service name or connection string
    sql       SQL query to execute

Example:
    $(basename "$0") scott tiger localhost:1521/orcl "SELECT * FROM emp"

Security Notes:
    - Password is handled securely via stdin redirection
    - Temporary files are securely deleted after use
EOF
    exit 1
}

################################################################################
# Main Script
################################################################################

# Validate argument count
if [[ $# -ne 4 ]]; then
    echo "ERROR: Invalid number of arguments. Expected 4, got $#" >&2
    usage
fi

# Read and validate arguments
db_user="${1:-}"
db_password="${2:-}"
db_service="${3:-}"
sql_query="${4:-}"

if [[ -z "${db_user}" ]]; then
    error_exit "Database user argument is empty" 1
fi

if [[ -z "${db_password}" ]]; then
    error_exit "Database password argument is empty" 1
fi

if [[ -z "${db_service}" ]]; then
    error_exit "Database service argument is empty" 1
fi

if [[ -z "${sql_query}" ]]; then
    error_exit "SQL query argument is empty" 1
fi

# Verify sqlplus binary exists
if ! command -v sqlplus >/dev/null 2>&1; then
    error_exit "sqlplus command not found in PATH. Ensure Oracle client is installed." 1
fi

# Create temporary SQL file for secure execution
temp_sql_file=$(mktemp "${TEMP_SQL_PREFIX}.XXXXXX") || \
    error_exit "Failed to create temporary SQL file" 1

# Verify temp file was created
if [[ ! -f "${temp_sql_file}" ]]; then
    error_exit "Temporary SQL file creation failed" 1
fi

# Set restrictive permissions on temp file (readable/writable only by owner)
chmod 600 "${temp_sql_file}" || \
    error_exit "Failed to set permissions on temporary SQL file" 1

# Write SQL commands to temporary file with error detection
cat > "${temp_sql_file}" << 'EOF' || error_exit "Failed to write SQL file" 1
-- Enable error handling
WHENEVER SQLERROR EXIT SQL.SQLCODE
WHENEVER OSERROR EXIT FAILURE

-- Configure output formatting
SET PAGESIZE 50000
SET LINESIZE 32767
SET FEEDBACK OFF
SET HEADING ON
SET ECHO OFF
SET TRIMSPOOL ON
SET WRAP OFF
SET COLSEP '§'
SET VERIFY OFF
SET SERVEROUTPUT ON SIZE UNLIMITED

-- Execute the SQL query
EOF

# Append the actual SQL query
echo "${sql_query}" >> "${temp_sql_file}" || \
    error_exit "Failed to append SQL query to file" 1

# Add exit command
echo -e "\nEXIT;" >> "${temp_sql_file}" || \
    error_exit "Failed to finalize SQL file" 1

# Verify SQL file has content
if [[ ! -s "${temp_sql_file}" ]]; then
    error_exit "SQL file is empty after writing" 1
fi

# Prepare connection string (using /nolog to avoid password in process list)
# Then connect via stdin
connection_string="${db_user}/${db_password}@${db_service}"

# Execute sqlplus with timeout if available, otherwise without
# Use stdin redirection to avoid password exposure in process list
set +e  # Temporarily disable exit on error to capture sqlplus exit code

if command -v timeout >/dev/null 2>&1; then
    # Use timeout command if available
    timeout "${SQLPLUS_TIMEOUT}" sqlplus -s /nolog << EOF
CONNECT ${connection_string}
@${temp_sql_file}
EOF
    sqlplus_exit_code=$?
    
    # Check if timeout was triggered
    if [[ ${sqlplus_exit_code} -eq 124 ]]; then
        set -e
        error_exit "SQL query execution timed out after ${SQLPLUS_TIMEOUT} seconds" 124
    fi
else
    # Execute without timeout
    sqlplus -s /nolog << EOF
CONNECT ${connection_string}
@${temp_sql_file}
EOF
    sqlplus_exit_code=$?
fi

set -e  # Re-enable exit on error

# Check sqlplus exit status
if [[ ${sqlplus_exit_code} -ne 0 ]]; then
    # Determine error type based on exit code
    case ${sqlplus_exit_code} in
        1017)
            error_exit "Invalid username/password" 3
            ;;
        12154|12514|12541)
            error_exit "TNS error: Cannot connect to database service '${db_service}'" 3
            ;;
        *)
            error_exit "SQL execution failed with exit code ${sqlplus_exit_code}" 2
            ;;
    esac
fi

# Successful execution - cleanup will be handled by trap
exit 0