pi-steroid
##########

pi-steroid is a client for [Asteroid][asteroid] aka [pijs.io][pijs], a cloud framework for JavaScript development and deployment on the Raspberry Pi.

## What does it do?

pi-steroid runs on your Raspberry Pi and connects it to an [asteroid] server. Once your Raspberry Pi is connected, you can program it in javascript in the cloud. Your code is updated on the device in realtime.

## How to install?

The easiest way to install pi-steroid on a Raspberry Pi is to use the auto-installation script described in [pijs.io documentation][pijsdoc].

You can also try pi-steroid on any computer that has nodejs and npm installed. Just install this package and run pijs-client:

    $ sudo npm install -g pi-steroid
    $ pi-steroid

## How does it work?

pi-steroid uses the [node-ddp-client][node-ddp-client] library to connect to an asteroid server. It subscribes to a feed from the server that describes this device and the code it is supposed to run.

## Author

 * Thomas Sarlandie - @sarfata

## License

MIT License

Copyright (c) 2013 TBideas

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[asteroid]: http://github.com/tbideas/asteroid/
[pijs]: http://www.pijs.io/
[pijsdoc]: http://pijs.io/gettingstarted
[node-ddp-client]: http://github.com/oortcloud/node-ddp-client