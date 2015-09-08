#!/usr/bin/env bash

PIDFILE="$HOME/.rosettastack_nodejs.pid"

if [ -e "${PIDFILE}" ] && (ps -u $USER -f | grep "[ ]$(cat ${PIDFILE})[ ]"); then
  echo "Already running."
  exit 99
fi

NODE_ENV=production PORT=20119 node --harmony --max-old-space-size=200 /home/tweetpig/webapps/rosettastack/dist/server.js --rosettastack > $HOME/.rosettastack_nodejs.log &

echo $! > "${PIDFILE}"
chmod 644 "${PIDFILE}"
