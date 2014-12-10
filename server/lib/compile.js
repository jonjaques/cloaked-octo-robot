var Path = require('path');
var Fs = require("q-io/fs");
var Q = require('q');
var _ = require('underscore');
var compass = require('./compass');

function compile(guid, template, vars, customStyles) {
  var dfd = Q.defer(),
      templatePath = Path.resolve('templates', template),
      templateSettingsPath = Path.join(templatePath, 'template.json'),
      templateStylesPath = Path.join(templatePath, 'template.scss'),
      destPath = Path.resolve('generated', guid),
      destSassFilePath = Path.join(destPath, 'style.scss'),
      destCssFilePath = Path.join(destPath, 'style.css'),
      bootstrapPath = Path.resolve('bower_components/bootstrap-sass-official/assets/stylesheets');

  function handleFail(err) {
    dfd.reject(err);
  }

  function handleSuccess(css) {
    dfd.resolve(css);
  }

  function readTemplateSettings() {
    return Fs.read(templateSettingsPath)
  }

  function buildTemplateSettings(settingsJson) {
    var templateSettings = JSON.parse(settingsJson);
    if (vars && vars.length) {
      templateSettings = _(templateSettings.vars)
        .reduce(function(memo, variable) {
          var customVar = _(vars || []).find(function(v){ return v.name === variable.name });
          if (customVar) {
            variable.val = customVar.val;
          }
          memo.push(variable);
          return memo;
        }, []);
    }
    return templateSettings;
  }

  function buildStylesheet(settings) {
    return Fs.read(templateStylesPath).then(function(styles) {
      var settingsScss = _(settings).reduce(function(memo, variable) {
        memo += '$' + variable.name + ': ' + variable.val + ';  ';
        if (variable.desc) { memo += '// ' + variable.desc }
        memo += '\n';
        return memo;
      }, '');
      return [ settingsScss, styles, customStyles || '' ].join('\n');
    })
  }

  function writeStylesheet(sheet) {
    return Fs.makeTree(destPath).then(function() {
      return Fs.write(destSassFilePath, sheet);
    })
  }

  function compileStylesheet(sheet) {
    var _dfd = Q.defer();
    compass({
      project: destPath,
      sass: '.',
      css: '.',
      bin: './gems/bin/compass',
      import_path: [ bootstrapPath ]
    }, function(code, stdout, stderr) {
      if (code === 127) {
        return _dfd.reject('You need to have Ruby and Compass installed and in your system PATH for this task to work.')
      }
      if (code !== 0) {
        return _dfd.reject(stderr);
      }
      _dfd.resolve(destCssFilePath);
    });
    return _dfd.promise;
  }
  
  readTemplateSettings()
    .then(buildTemplateSettings)
    .then(buildStylesheet)
    .then(writeStylesheet)
    .then(compileStylesheet)
    .then(handleSuccess)
    .fail(handleFail)
  
  return dfd.promise;
}

module.exports = compile;