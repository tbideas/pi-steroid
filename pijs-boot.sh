#! /bin/sh
### BEGIN INIT INFO
# Provides:          pijs
# Required-Start:    $remote_fs $syslog
# Required-Stop:     $remote_fs $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Connects to the pijs.io cloud platform
# Description:       This daemon will connect to pijs.io, download and execute
#                    code. Go to www.pijs.io to program your device.
### END INIT INFO

# Author: Thomas Sarlandie <thomas@sarlandie.net>
# Heavily relies on npm module forever to daemonize/kill node scripts

PATH=/usr/local/bin:/sbin:/usr/sbin:/bin:/usr/bin

NAME=pijs
SCRIPTNAME=/etc/init.d/$NAME
DESC="Client for pijs.io cloud platform"

DAEMON=/usr/local/bin/pi-steroid
DAEMON_ARGS="-s www.pijs.io -p 80"

USER=pi
LOGS=/var/log/pijs

FOREVER=/usr/local/bin/forever
FOREVER_ARGS="-a -p $LOGS -l $LOGS/pijs.log"

# Exit if the package is not installed
[ -x "$DAEMON" ] || exit 0

# Exit if forever is not installed
[ -x $FOREVER ] || exit 0

# Create logs directory and setup owner.
if [ ! -d $LOGS ]
then
  mkdir -p $LOGS
  chown $USER $LOGS
fi

case "$1" in
  start)
    echo "pijs.io: Launching client ..."
    su - $USER -c "$FOREVER start $FOREVER_ARGS $DAEMON $DAEMON_ARGS"
  ;;
  stop)
    echo "pijs.io: Stopping client ..."
    su - $USER -c "$FOREVER stop $FOREVER_ARGS $DAEMON"
  ;;
  restart)
    echo "pijs.io: Restarting client ..."
    su - $USER -c "$FOREVER restart $FOREVER_ARGS $DAEMON"
  ;;
  status)
    su - $USER -c "$FOREVER list $FOREVER_ARGS"
  ;;
  update)
    echo "pijs.io: Checking for and installing updates ..."
    npm -g update pi-steroid
    su - $USER -c "$FOREVER restart $FOREVER_ARGS $DAEMON"
  ;;
  updategit)
    echo "pijs.io: Installing latest development snapshot from Git repository"
    npm -g install git://github.com/tbideas/pi-steroid.git
    su - $USER -c "$FOREVER restart $FOREVER_ARGS $DAEMON"
  ;;
  logs)
    tail $LOGS/pijs.log 
  ;;

  *)
  echo "Usage: $SCRIPTNAME {start|stop|status|update|updategit|logs}" >&2
  exit 3
  ;;
esac
