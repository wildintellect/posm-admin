#!/usr/bin/env bash
# Fetches a HOT Export tar.gz, unpacks it, and puts in a directory.
# args: url, tmpDir
echo "==> hot-export-fetch.sh : Fetching and unpacking HOT Export into a temporary directory."
echo "      temp dir: "$2
echo

mkdir -p $2
curl $1 | pv | tar xzf - -C $2

echo "==> hot-export-fetch.sh : END"
echo
