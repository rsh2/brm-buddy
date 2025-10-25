#!/bin/bash

################################################################################
# call_testnap.sh - Execute BRM opcodes using testnap
#
# Description:
#   Executes BRM opcodes via testnap with proper error handling, validation,
#   and cleanup. Creates temporary input files and ensures cleanup on exit.
#
# Arguments:
#   $1 - opcode: BRM opcode number to execute
#   $2 - flag: Opcode execution flags
#   $3 - flist: Field list input data for the opcode
#
# Exit Codes:
#   0 - Success
#   1 - Invalid arguments or missing dependencies
#   2 - Testnap execution failed
#   3 - Invalid testnap home directory
################################################################################

# Strict error handling
set -euo pipefail

# Define the testnap working directory (replaced dynamically by Python script)
test_home=__testnap_home__

# Temporary file for cleanup tracking
nap_file=""

################################################################################
# Cleanup Function
################################################################################
cleanup() {
    local exit_code=$?
    
    # Remove temporary file if it exists
    if [[ -n "${nap_file}" && -f "${nap_file}" ]]; then
        rm -f "${nap_file}" 2>/dev/null || true
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
Usage: $(basename "$0") <opcode> <flag> <flist>

Arguments:
    opcode    BRM opcode number to execute
    flag      Opcode execution flags
    flist     Field list input data

Example:
    $(basename "$0") PCM_OP_READ_OBJ 0 "0 PIN_FLD_POID ..."
EOF
    exit 1
}

################################################################################
# Main Script
################################################################################

# Validate argument count
if [[ $# -ne 3 ]]; then
    echo "ERROR: Invalid number of arguments. Expected 3, got $#" >&2
    usage
fi

# Read and validate arguments
opcode="${1:-}"
flag="${2:-}"
flist="${3:-}"

if [[ -z "${opcode}" ]]; then
    error_exit "Opcode argument is empty" 1
fi

if [[ -z "${flag}" ]]; then
    error_exit "Flag argument is empty" 1
fi

if [[ -z "${flist}" ]]; then
    error_exit "Flist argument is empty" 1
fi

# Validate testnap home directory
if [[ ! -d "${test_home}" ]]; then
    error_exit "Testnap home directory does not exist: ${test_home}" 3
fi

if [[ ! -r "${test_home}" ]]; then
    error_exit "Testnap home directory is not readable: ${test_home}" 3
fi

if [[ ! -w "${test_home}" ]]; then
    error_exit "Testnap home directory is not writable: ${test_home}" 3
fi

# Verify testnap binary exists and is executable
if ! command -v testnap >/dev/null 2>&1; then
    error_exit "testnap command not found in PATH" 1
fi

# Create temporary testnap input file
nap_file=$(mktemp "${test_home}/brm_buddy_testnap.XXXXXX.nap") || \
    error_exit "Failed to create temporary file in ${test_home}" 1

# Verify temp file was created successfully
if [[ ! -f "${nap_file}" ]]; then
    error_exit "Temporary file creation failed: ${nap_file}" 1
fi

# Create the testnap input file with proper error handling
cat > "${nap_file}" << EOT || error_exit "Failed to write testnap input file" 1
r << EOF 1
${flist}
EOF
xop ${opcode} ${flag} 1
EOT

# Verify the input file was written correctly
if [[ ! -s "${nap_file}" ]]; then
    error_exit "Testnap input file is empty after writing" 1
fi

# Change to testnap home directory (required by testnap)
cd "${test_home}" || error_exit "Failed to change directory to ${test_home}" 1

# Execute testnap and capture exit status
set +e  # Temporarily disable exit on error to capture testnap's exit code
testnap "${nap_file}"
testnap_exit_code=$?
set -e

# Check testnap exit status
if [[ ${testnap_exit_code} -ne 0 ]]; then
    error_exit "Testnap execution failed with exit code ${testnap_exit_code}" 2
fi

# Successful execution - cleanup will be handled by trap
exit 0
