#! /bin/sh
### BEGIN INIT INFO
# Provides:          pi-steroid
# Required-Start:    $remote_fs $syslog
# Required-Stop:     $remote_fs $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Connects to the piJS.io cloud platform
# Description:       This daemon will connect to pijs.io, download and execute
#                    code. Connect to pijs.io to program your device.
### END INIT INFO

# Author: Thomas Sarlandie <thomas@sarlandie.net>
# Heavily relies on npm module forever to daemonize/kill node scripts

PATH=/sbin:/usr/sbin:/bin:/usr/bin:/usr/local/bin
DESC="Client for pijs.io cloud platform"
NAME=pi-steroid
DAEMON=/usr/local/bin/$NAME
DAEMON_ARGS="-s pijs.io -p 80"
SCRIPTNAME=/etc/init.d/$NAME
FOREVER=/usr/local/bin/forever


# Exit if the package is not installed
[ -x "$DAEMON" ] || exit 0

# Exit if forever is not installed
[ -x $FOREVER ] || exit 0

case "$1" in
  start)
    echo "piJS.io: Checking and installing updates for pi-steroid ..."
    npm -g update pi-steroid
    echo "piJS.io: Launching pi-steroid"
    $FOREVER start $DAEMON $DAEMON_ARGS
  ;;
  stop)
    $FOREVER stop $DAEMON
  ;;
  status)
    $FOREVER list
  ;;
  update)
    echo "piJS.io: Checking and installing updates for pi-steroid ..."
    npm -g update pi-steroid
  ;;
  logs)
    $FOREVER logs
  ;;

  *)
  echo "Usage: $SCRIPTNAME {start|stop|update|logs}" >&2
  exit 3
  ;;
esac
