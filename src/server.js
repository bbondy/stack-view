require('babel/polyfill');
let Path = require('path');
let Hapi = require('hapi');
var Inert = require('inert');
import {getQuestions, getQuestion, getAnswers, getUsers, getUser, getTags} from './datastore.js';
import {cookiePassword} from './secrets.js';

let port = process.env.PORT || 20119;

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

server.register(Inert, function () {
}); // requires a callback function but can be blank


server.connection({ port });

server.route( {
  method: 'GET',
  path: '/{param*}',
  handler: {
    directory: {
      path: './'
    }
  }
});

let getQuestionsHandler = (request, reply) => {
  getQuestions(request.params.siteSlug, request.params.lang, request.params.page || 1).then(questions => {
    var context = {
      title: 'Questions',
      siteSlug: request.params.siteSlug,
      lang: request.params.lang,
      questions,
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
    console.log('questions error:', err);
  });
};

let getUsersHandler = (request, reply) => {
  getUsers(request.params.siteSlug, request.params.lang, request.params.page || 1).then(users => {
    var context = {
      title: 'Users',
      siteSlug: request.params.siteSlug,
      lang: request.params.lang,
      users,
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
    console.log('users error:', err);
  });
};

server.route({
  method: 'GET',
  path: '/{siteSlug}/{lang}',
  handler: (request, reply) => {
     var context = {
      title: 'Site info', // TODO: Get a better name here from config
      siteSlug: request.params.siteSlug,
      lang: request.params.lang,
      siteBasePage: true,
    };
    var renderOpts = { runtimeOptions: {} };
    server.render('main', context, renderOpts, function (err, output) {
      if (err) {
        reply(err).code(500);
        return;
      }
      reply(output).code(200);
    });

  },
});


server.route({
  method: 'GET',
  path: '/{siteSlug}/{lang}/questions',
  handler: getQuestionsHandler,
});
server.route({
  method: 'GET',
  path: '/{siteSlug}/{lang}/questions/page/{page}',
  handler: getQuestionsHandler,
});

server.route({
  method: 'GET',
  path: '/{siteSlug}/{lang}/users',
  handler: getUsersHandler,
});

server.route({
  method: 'GET',
  path: '/{siteSlug}/{lang}/users/page/{page}',
  handler: getUsersHandler,
});

server.route({
  method: 'GET',
  path: '/{siteSlug}/{lang}/questions/{id}',
  handler: function(request, reply) {
    Promise.all([getQuestion(request.params.siteSlug, request.params.lang, request.params.id),
        getAnswers(request.params.siteSlug, request.params.lang, request.params.id)
    ]).then((data) => {
      let [question, answers] = data;
      var context = {
        title: question.title,
        siteSlug: request.params.siteSlug,
        lang: request.params.lang,
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
      console.log('question error:', err);
    });
  }
});

server.route({
  method: 'GET',
  path: '/{siteSlug}/{lang}/users/{id}',
  handler: function(request, reply) {
    getUser(request.params.siteSlug, request.params.lang, request.params.id).then((user) => {
      var context = {
        title: user.displayName,
        siteSlug: request.params.siteSlug,
        lang: request.params.lang,
        user,
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
      console.log('question error:', err);
    });
  }
});

server.route({
  method: 'GET',
  path: '/',
  handler: function(request, reply) {
    var context = {
      title: 'Main',
    };
    var renderOpts = { runtimeOptions: {} };
    server.render('main', context, renderOpts, function (err, output) {
      if (err) {
        reply(err).code(500);
        return;
      }
      reply(output).code(200);
    });
  }
});

server.route({
  method: 'GET',
  path: '/{siteSlug}/{lang}/tags',
  handler: function(request, reply) {
    getTags(request.params.siteSlug, request.params.lang).then((tags) => {
      var context = {
        title: 'Tags',
        siteSlug: request.params.siteSlug,
        lang: request.params.lang,
        tags,
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
      console.log('tags error: ', err);
    });
  }
});

server.route({
  method: 'GET',
  path: '/api/{siteSlug}/{lang}/questions/{id}',
  handler: function(request, reply) {
    getQuestion(request.params.siteSlug, request.params.lang, request.params.id).then((answers) => {
      reply(answers).code(200);
    }).catch((err) => {
      console.log('question error: !', err);
    });
  }
});

server.route({
  method: 'GET',
  path: '/api/{siteSlug}/{lang}/questions/{id}/answers',
  handler: function(request, reply) {
    getAnswers(request.params.siteSlug, request.params.lang, request.params.id).then((answers) => {
      reply(answers).code(200);
    }).catch((err) => {
      console.log('question error: !', err);
    });
  }
});


// Serve everything else from the public folder
server.route({
  method: 'GET',
  path: '/static/{path*}',
  handler: {
    directory: {
      path: './'
    }
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
    js: require('hapi-react-views')
  },
  compileOptions: {
    pretty: true
  },
  relativeTo: __dirname,
  path: 'views'
});
