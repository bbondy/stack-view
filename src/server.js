require('babel/polyfill');
let Path = require('path');
let Hapi = require('hapi');

import {cookiePassword} from './secrets.js';

let server = new Hapi.Server({
  connections: {
    router: {
      stripTrailingSlash: false,
    },
    routes: {
      files: {
        relativeTo: Path.join(__dirname, 'public')
      }
    }
  }
});

server.register(require('vision'), function(err) {
  if (err) {
    console.log('Failed to load vision.');
  }
});

server.connection({ port: process.env.PORT || 8888 });

server.route({
  method: 'GET',
  path: '/',
  handler: function(request, reply) {
    reply.view('index', {
      title: 'Stack',
    });
  }
});

server.register([{
  // good is a process monitor that listens for one or more of the below 'event types'
  register: require('good'),
  options: {
    reporters: [{
      reporter: require('good-console'),
      events: {
        response: '*',
        log: '*'
      }
    }]
  }
}, {
  // A hapi session plugin and cookie jar
  register: require('yar'),
  options: {
    cookieOptions: {
      password: cookiePassword,
      // only used for captcha so this is ok
      isSecure: false,
    },
  },
}], function(err) {
  if (err) {
    throw err; // something bad happened loading the plugin
  }

  server.start(function() {
    server.log('info', 'Server running at: ' + server.info.uri);
  });
});

server.views({
  engines: { jade: require('jade') },
  path: Path.join(__dirname, 'templates'),
  compileOptions: {
    pretty: true
  }
});
