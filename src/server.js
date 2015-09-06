require('babel/polyfill');
let Path = require('path');
let Hapi = require('hapi');
import {initRedis, getQuestion, getAnswers} from './datastore.js';
import {cookiePassword} from './secrets.js';

initRedis();

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

server.route({
  method: 'GET',
  path: '/questions/{id}',
  handler: function(request, reply) {
    Promise.all([getQuestion(request.params.id), getAnswers(request.params.id)]).then((data) => {
      let [question, answers] = data;
      var context = {
        title: 'Test Main.',
        question,
        answers,
      };
      var renderOpts = { runtimeOptions: {} };
      server.render('main', context, renderOpts, function (err, output) {
        if (err) {
          reply(err).code(500);
          return;
        }
        reply(output).code(200);
      });
    }).catch((err) => {
      console.log('question error: !', err);
    });
  }
});

server.route({
  method: 'GET',
  path: '/api/questions/{id}',
  handler: function(request, reply) {
    getQuestion(request.params.id).then((answers) => {
      reply(answers).code(200);
    }).catch((err) => {
      console.log('question error: !', err);
    });
  }
});

server.route({
  method: 'GET',
  path: '/api/questions/{id}/answers',
  handler: function(request, reply) {
    getAnswers(request.params.id).then((answers) => {
      reply(answers).code(200);
    }).catch((err) => {
      console.log('question error: !', err);
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
  engines: {
    jsx: require('hapi-react-views')
  },
  compileOptions: {
    pretty: true
  },
  relativeTo: __dirname,
  path: 'views'
});
