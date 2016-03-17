//Karma configuration
//Generated on Fri Feb 21 2014 14:16:24 GMT-0700 (MST)

module.exports = function (config) {
  'use strict';

  config.set({

    // base path, that will be used to resolve files and exclude, relative to THIS config file!
    basePath: '../..',

    // frameworks to use
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      'node_modules/jshamcrest/jshamcrest.js',
      'node_modules/jquery/dist/jquery.js',
      {pattern: 'src/test/lib/*.js'},
      {pattern: 'src/main/javascript/*.js'},
      {pattern: 'src/test/javascript/*.spec.js'}
    ],

    // list of files to exclude
    exclude: [],

    // For code coverage reporting
    preprocessors: {
      'src/main/javascript/**/*.js': 'coverage'
    },

    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['spec', 'junit', 'coverage'],

    coverageReporter: {
      dir: 'docs/coverage',
      reporters: [
        {
          type : 'html',
          subdir: 'html',
          file: 'coverage-report.html'
        },
        {
          type: 'cobertura',
          subdir: 'cobertura',
          file: 'coverage-report.xml'
        },
        {
          type: 'text-summary' /* Will output to console */
        }
      ]
    },

    junitReporter: {
      outputDir: 'docs/junit', // results will be saved as $outputDir/$browserName.xml
      outputFile: 'test-results.xml',
      useBrowserName: false
    },

    // web server port
    port: 9876,


    // cli runner port
    runnerPort: 9100,

    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera (has to be installed with `npm install karma-opera-launcher`)
    // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
    // - PhantomJS
    // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
    browsers: ['PhantomJS'],


    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false,

    plugins: [
      'karma-jasmine',
      'karma-coverage',
      'karma-phantomjs-launcher',
      'karma-chrome-launcher',
      'karma-spec-reporter',
      'karma-junit-reporter'
    ]
  });
};
