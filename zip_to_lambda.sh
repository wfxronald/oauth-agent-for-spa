#!/bin/bash

rm -rf tozip
mkdir tozip
cp -r dist/* tozip/
cp -r node_modules tozip/
cp package.json tozip/

# Please manually zip the folder tozip afterwards using 7zip.
# Zip only the content of tozip folder, without including the tozip folder itself.
# The in-built zip tool in Windows 11 has issues being read in Lambda.
