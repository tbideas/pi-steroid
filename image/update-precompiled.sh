#!/bin/bash

echo "$0: updates a pi-steroid archive with a new pi-steroid module from dev"

ARCHIVE=`pwd`/$1

if [ ! -f "$ARCHIVE" ]; then
  echo "Expecting valid archive as first argument"
  exit -1
fi
 
if [ -d worktmp ]; then
  echo "Not overwriting existing worktmp directory. please delete it first"
  exit -1
fi

echo "# Creating worktmp directory"
mkdir worktmp
cd worktmp

echo "# Uncompress old archive"
tar zxf $ARCHIVE
rm -f usr/local/lib/node_modules/pi-steroid/*
cp -v ../* usr/local/lib/node_modules/pi-steroid

echo "# Creating new archive"
tar zcf /tmp/newimage.tar.gz usr/

echo "# Cleaning up"
cd ..
rm -fr worktmp

echo "# Done! Image in /tmp/newimage.tar.gz"
