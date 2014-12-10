var gulp = require('gulp');
var compile = require('./server/lib/compile');
var UUID = require('node-uuid');


gulp.task('compile', function(done) {

  var guid = UUID.v4();

  var template = 'bootstrap';

  var customVars = [
    { "name": "color-a", "val": "#FF0000" },
    { "name": "color-b", "val": "#00FF00" },
    { "name": "color-c", "val": "#0000FF" }
  ];

  var customCss = ".box { background-color: #000 }";

  compile(guid, template, customVars, customCss)
    .then(function(css) {
      console.log(css);
      done();
    })
    .fail(function(err) {
      console.log('error', err)
      done();
    })

})