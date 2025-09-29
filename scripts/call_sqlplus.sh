#!/bin/bash

# call_sqlplus.sh - Execute SQL queries against Oracle database using sqlplus

# Arguments: user password service sql

USER=$1
PASSWORD=$2
SERVICE=$3
SQL=$4

# Execute the SQL using sqlplus
# Use heredoc to pass the SQL
sqlplus -s ${USER}/${PASSWORD}@${SERVICE} <<EOF
SET PAGESIZE 50000
SET LINESIZE 32767
SET FEEDBACK OFF
SET HEADING ON
SET ECHO OFF
SET TERMOUT OFF
SET TRIMSPOOL ON
SET WRAP OFF
SET COLSEP '§'
${SQL}
EXIT;
EOF