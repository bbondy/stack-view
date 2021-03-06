var gulp = require('gulp');
var babel = require('gulp-babel');
var changed = require('gulp-changed');
var gutil = require('gulp-util');
var sourcemaps = require('gulp-sourcemaps');
var del = require('del');
var eslint = require('gulp-eslint');
var less = require('gulp-less');
var runSequence = require('run-sequence');
var server = require( 'gulp-develop-server' );
var browserify = require('browserify');
var babelify = require('babelify');
var uglify = require('gulp-uglify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var minimist = require('minimist');
var shell = require('gulp-shell');
var exec = require('child_process').exec;
var es = require('event-stream');

const SRC_ROOT = './src/';
const SRC_ROOT_PUBLIC = './src/public/';
const SRC_ROOT_PUBLIC_LESS = './src/public/less/';
const SRC_ROOT_PUBLIC_JS = './src/public/js/';
const DIST_ROOT = './dist/';
const DIST_ROOT_PUBLIC = './dist/public';
const DIST_ROOT_PUBLIC_JS = './dist/public/js/';
const DIST_EXT = './dist/public/js/ext/';
const DIST_CSS_ROOT = './dist/public/css';
const TEST_ROOT = './test/';
const SERVER_FILES = [
  SRC_ROOT + '*.js',
  SRC_ROOT + '*views*/*.js',
];

const COPY_SERVER_FILES = [
  SRC_ROOT + '*templates*/*.jade',
];

const COPY_WEB_APP_FILES = [
  SRC_ROOT_PUBLIC + '**/*',
  '!' + SRC_ROOT_PUBLIC + '**/js/*.js', // JS files are handled by babel, so don't copy them.
  '!' + SRC_ROOT_PUBLIC_LESS + 'less/**', // LESS files are handled by less, so don't copy them.
  '!' + SRC_ROOT_PUBLIC_LESS,
];

const DEFAULT_PORT = 20119;
const DEFAULT_HOST = 'localhost';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

gulp.task('start-server', function() {
  server.listen( { path: './dist/server.js' } );
});

// TODO
gulp.task('import-translations', function(cb) {
  var options = minimist(process.argv.slice(2));
  var siteSlug = options.s;
  if (!siteSlug) {
    console.error('Usage: gulp import-translations -s <siteSlug>');
    return;
  }
  gulp.src('')
    .pipe(shell('node --max-old-space-size=16384 dist/importTranslations.js ' + siteSlug))
    .pipe(es.wait(cb));
});

gulp.task('export-translations', function(cb) {
  var options = minimist(process.argv.slice(2));
  var siteSlug = options.s;
  if (!siteSlug) {
    console.error('Usage: gulp export-translations -s <siteSlug>');
    return;
  }
  gulp.src('')
    .pipe(shell('node --max-old-space-size=16384 dist/exportTranslations.js ' + siteSlug))
    .pipe(es.wait(cb));

});

gulp.task('import', function(cb) {
  var options = minimist(process.argv.slice(2));
  var siteSlug = options.s;
  if (!siteSlug) {
    console.error('Usage: gulp import -s <siteSlug>');
    return;
  }
  gulp.src('')
    .pipe(shell('node --max-old-space-size=16384 dist/importTempDB.js ' + siteSlug))
    .pipe(es.wait(cb));
});

/**
 * Runs linters on all javascript files found in the src dir.
 */
gulp.task('lint-node', function() {
  return gulp.src(SERVER_FILES)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(gutil.noop());
});

/**
 * Babilify all of the client side things
 */
gulp.task('bundle-js', function() {
  browserify({
    entries: './src/public/js/init.js',
    debug: true
  })
  .transform(babelify)
  .bundle()
  .pipe(source('bundle.js'))
  .pipe(buffer())
  .pipe(IS_PRODUCTION ? sourcemaps.init({loadMaps: true}) : gutil.noop())
  .pipe(IS_PRODUCTION ? uglify() : gutil.noop())
  .pipe(IS_PRODUCTION ? sourcemaps.write('./') : gutil.noop())
  .pipe(gulp.dest('./dist/public/js'));
});

/**
 * Runs linters on all javascript files found in the src dir.
 */
gulp.task('lint-js', function() {
  return gulp.src([
      SRC_ROOT + 'public/js/**/*.js',
      TEST_ROOT + '**/*.js',
      '!' + SRC_ROOT + 'js/ext/*.js',
      '!' + SRC_ROOT + 'public/js/analytics.js',
    ])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(gutil.noop());
});

/**
 * Convert less stylesheets to css
 */
gulp.task('less', function () {
  return gulp.src([
      SRC_ROOT_PUBLIC_LESS + '**/*.less',
      // These are imported by font-awesome.less
      '!' + SRC_ROOT + 'public/less/font-awesome/!(font-awesome).less',
    ])
    .pipe(changed(DIST_CSS_ROOT, {extension: '.css'}))
    .pipe(sourcemaps.init())
    .pipe(less().on('error', function(e) {
        console.log('error running less', e);
        this.emit('end');
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(DIST_CSS_ROOT));
});

/**
 * Copy all public non-js directory app source/assets/components.
 */
gulp.task('copy-public-static', function() {
  return gulp.src(COPY_WEB_APP_FILES)
    .pipe(gulp.dest(DIST_ROOT_PUBLIC));
});

/**
 * Copy all non-js directory app source/assets/components.
 */
gulp.task('copy-server-files', function() {
  return gulp.src(COPY_SERVER_FILES)
    .pipe(gulp.dest(DIST_ROOT));
});


/**
 * Copy analytics
 */
gulp.task('copy-analytics', function() {
  return gulp.src([SRC_ROOT_PUBLIC_JS + 'analytics.js'])
    .pipe(gulp.dest(DIST_ROOT_PUBLIC_JS));
});


/**
 * Converts javascript to es5. This allows us to use harmony classes and modules.
 */
gulp.task('babel-node', function() {
  try {
    return gulp.src(SERVER_FILES)
      .pipe(IS_PRODUCTION ? gutil.noop() : sourcemaps.init())
      .pipe(babel()
        .on('error', function(e) {
        console.log('error on babel-node: ' + e);
        this.emit('end');
      }))
      .pipe(IS_PRODUCTION ? gutil.noop() : sourcemaps.write('.'))
      .pipe(gulp.dest(DIST_ROOT));

  } catch (e) {
    console.log('Got error in babel', e);
  }
});

/**
 * Build the app.
 */
gulp.task('build', function(cb) {
  runSequence(['copy-public-static', 'copy-analytics', 'copy-server-files', 'babel-node', 'lint-node', 'less'], cb);
});

/**
 * Watch for changes on the file system, and rebuild if so.
 */
gulp.task('watch', function() {
  gulp.watch(SERVER_FILES, ['lint-node', 'babel-node', 'copy-server-files', server.restart]);
  gulp.watch([
    SRC_ROOT_PUBLIC_JS + '**/*',
  ], ['lint-js', 'bundle-js']);
  gulp.watch([COPY_WEB_APP_FILES], ['copy-public-static', 'less']);
});


/**
 * The default task when `gulp` is run.
 * Adds a listener which will re-build on a file save.
 */
gulp.task('default', function() {
  runSequence('build', 'watch', 'start-server');
});

/**
 * Remove the distributable files.
 */
gulp.task('clobber', function(cb) {
  del('dist/**', cb);
});

/**
 * Cleans all created files by this gulpfile, and node_modules.
 */
gulp.task('clean', function(cb) {
  del([
    'dist/',
    'node_modules/'
  ], cb);
});
