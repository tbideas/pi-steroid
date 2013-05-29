# How to release a new version of pijs

 * Prepare a new version on github
 ** Develop in a branch and when done merge the new version onto the master branch
 ** To test on a Raspberry Pi, run: 
    $ sudo /etc/init.d/pijs updategit
  This will download and install the latest version from git. (If you tweak the script, you can also use that to test a specific branch or a fork).
 ** Make sure everything works ok

 * Release the new version on npm
 ** Run 
    $ npm publish
 ** Tag in github:
    $ git tag -as <version> && git push --tags

 * Prepare a new pre-compiled image for easy install
 ** Clean things up: 
    $ rm -fr /usr/local/lib/node_modules/pi-steroid
 ** Install from npm: 
    $ npm install -g pi-steroid
 ** Make a new image of the pi-steroid package: 
    $ tar -zcf ~/pi-steroid-precompiled-<version>.tar.gz usr/local/bin/pi-steroid usr/local/lib/node_modules/pi-steroid/
  or
    $ ssh rpi-lan tar -zcf - /usr/local/bin/pi-steroid /usr/local/lib/node_modules/pi-steroid/ > release/pi-steroid-precompiled-0.1.0.tar.gz
  
 ** Copy this new version onto your computer in the folder release/
 ** Run the release script to package this version and the dependencies (pijs, forever, etc) in one tar.gz: 
    $ release/release.sh <version>

 * Update the precompiled image on Amazon webservices
 ** Push the new version to amazon web services hosting: 
    $ aws put pijs pijs-precompiled-<version>.tar.gz
