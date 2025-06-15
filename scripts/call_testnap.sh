#!/bin/bash

# Define the testnap working directory (this will be replaced dynamically by the Python script)
test_home=__testnap_home__

# Path to the temporary testnap input file that will be created and used
nap_file="$test_home/brm_buddy_testnap.nap"

# Read arguments passed from the Python script:
# $1 = opcode to execute
# $2 = flag for the opcode
# $3 = flist (input data for the opcode)
opcode=$1
flag=$2
flist=$3

# Create the testnap input file with the provided flist, opcode and flag
cat << EOT > "$nap_file"
r << EOF 1
$flist
EOF
xop $opcode $flag 1
EOT

# Change directory to the testnap home directory (required by testnap)
cd $test_home

# Run testnap with the generated input file
testnap $nap_file

