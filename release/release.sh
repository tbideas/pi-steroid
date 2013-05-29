#!/bin/sh

WORKDIR=`mktemp -d pijs-precompiled.XXXX`

VERSION="$1"

if [ -z "$VERSION" ]; then
  echo "$0: <version>"
  exit -1
fi

PISTEROID="pi-steroid-precompiled-$VERSION.tar.gz"
DEPS="node-precompiled-0.10.0.tar.gz forever-precompiled-0.10.0.tar.gz serialport-precompiled-1.1.0.tar.gz $PISTEROID"

for i in $DEPS; do
  if [ ! -f $i ]; then
    echo "$i does not exist. Aborting."
    exit -1
  fi
done

cd $WORKDIR
for i in $DEPS; do
  echo "Adding $i ..."
  tar -zxf ../$i
done

echo "Generating archive ..."
tar -zcf ../pijs-precompiled-$VERSION.tar.gz *
cd ..
rm -fr $WORKDIR

echo "Done: pijs-precompiled-$VERSION.tar.gz"