// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to match all subfolders:
// 'test/spec/**/*.js'
module.exports = function (grunt) {
  // show elapsed time at the end
  require('time-grunt')(grunt);

  // Needs to be loaded specifcally, because the name and the configuration property name aren't matching.
  grunt.loadNpmTasks('grunt-karma-coveralls');

  // load all grunt tasks needed for this run
  require('jit-grunt')(grunt);

  // configurable paths
  var config = {
      app: 'src/main/javascript',
      test: 'src/test',
      dist: 'dist',

      artifacts: {
        build: 'artifacts/build',
        coverage: 'artifacts/reports/coverage',
        junit: 'artifacts/reports/junit',
        jsdoc: 'artifacts/docs',
        root: 'artifacts',
        site: 'artifacts/site',
        npm: 'artifacts/npm',
        bower: 'artifacts/bower' // see .bowerrc
      },

      package: {
        npm: "artifacts/npm/node_modules/js-mock/dist",
        bower: "artifacts/bower/js-mock/dist"
      }
  };

  var pkg = grunt.file.readJSON('package.json');
  grunt.initConfig({
    pkg: pkg,
    config: config,

    clean: {
      options: {
        force: true
      },
      artifacts: '<%= config.artifacts.root %>'
    },

    todo: {
      options: {
        marks: [
          {
            name: "FIX",
            pattern: /FIXME/,
            color: "red"
          },
          {
            name: "TODO",
            pattern: /TODO/,
            color: "yellow"
          }
        ]
      },
      src: [
        'src/**/*.js'
      ],
    },

    jsdoc : {
      dist : {
        src: ['<%= config.app %>/*.js', '<%= config.app %>/**/*.js', 'README.md'],
        options: {
          destination: '<%= config.artifacts.jsdoc %>',
          configure: './conf/jsdoc.json',
          template: './node_modules/jsdoc-oblivion/template'
        }
      }
    },

    insert: {
      expectationError: {
        src: '<%= config.app %>/classes/expectationError.js',
        dest: '<%= config.artifacts.build %>/<%= pkg.name %>.js',
        match: '/*INSERT ExpectationError */'
      },
      globalMock: {
        src: '<%= config.app %>/classes/globalMock.js',
        dest: '<%= config.artifacts.build %>/<%= pkg.name %>.js',
        match: '/*INSERT GlobalMock */'
      },
      mock: {
        src: '<%= config.app %>/classes/mock.js',
        dest: '<%= config.artifacts.build %>/<%= pkg.name %>.js',
        match: '/*INSERT Mock */'
      }
    },

    replace: {
      build: {
        options: {
          patterns: [
            {
              match: 'DEV',
              replacement: function() {
                return grunt.option("setversion") || 'DEV';
              }
            }
          ]
        },
        files: [
          {expand: true, flatten: true, src: ['<%= config.app %>/<%= pkg.name %>.js'], dest: '<%= config.artifacts.build %>'}
        ]
      }
    },

    copy: {
      dist: {
        src: '<%= config.artifacts.build %>/<%= pkg.name %>.js',
        dest: '<%= config.dist %>/<%= pkg.name %>.js'
      }
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      src: [
        'Gruntfile.js',
        '<%= config.app %>/{,*/}*.js',
        '<%= config.test %>/javascript/{,*/}*.js'
      ],
      dist: [
        '<%= config.artifacts.build %>/<%= pkg.name %>.js'
      ]
    },

    karma: {
      options: {
        configFile: '<%= config.test %>/karma.conf.js',

        // list of files / patterns to load in the browser
        files: [
          'node_modules/jshamcrest/jshamcrest.js',
          'node_modules/jquery/dist/jquery.js'
        ],

        // For code coverage reporting
        preprocessors: {
          '<%= config.artifacts.build %>/**/*.js': 'coverage'
        },

        coverageReporter: {
          dir: '<%= config.artifacts.coverage %>',
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
              type: "lcov",
              subdir: "coveralls"
            },
            {
              type: 'text-summary' /* Will output to console */
            }
          ]
        },

        junitReporter: {
          outputDir: '<%= config.artifacts.junit %>', // results will be saved as $outputDir/$browserName.xml
          outputFile: 'test-results.xml',
          useBrowserName: false
        }
      },
      unit: {
        singleRun: true,

        files: [
          {pattern: '<%= config.artifacts.build %>/*.js'},
          {pattern: '<%= config.test %>/**/*.spec.js'}
        ]
      },
      watch: {
        autoWatch: false,
        background:true,
        reporters: ['spec'],

        files: [
          {pattern: '<%= config.artifacts.build %>/*.js'},
          {pattern: '<%= config.test %>/**/*.spec.js'}
        ]
      },
      debug: {
        autoWatch: false,
        background:true,
        browsers: ['Chrome'],
        reporters: ['spec'],

        files: [
          {pattern: '<%= config.artifacts.build %>/*.js'},
          {pattern: '<%= config.test %>/**/*.spec.js'}
        ]
      },
      dist: {
        singleRun: true,
        reporters: ['spec'],

        files: [
          {pattern: '<%= config.dist %>/*.js'},
          {pattern: '<%= config.test %>/**/*.spec.js'}
        ]
      },
      npm: {
        singleRun: true,
        reporters: ['spec'],

        files: [
          {pattern: '<%= config.package.npm %>/*.js'},
          {pattern: '<%= config.test %>/**/*.spec.js'}
        ]
      },
      bower: {
        singleRun: true,
        reporters: ['spec'],

        files: [
          {pattern: '<%= config.package.bower %>/*.js'},
          {pattern: '<%= config.test %>/**/*.spec.js'}
        ]
      }
    },

    watch: {
      //run unit tests with karma (server needs to be already running)
      "karma-watch": {
        files: ['<%= config.app %>/**/*.js', '<%= config.test %>/**/*.spec.js'],
        tasks: ['replace:build', 'insert', 'karma:watch:run'] //NOTE the :run flag
      },

      "karma-debug": {
        files: ['<%= config.app %>/**/*.js', '<%= config.test %>/**/*.spec.js'],
        tasks: ['replace:build', 'insert', 'karma:debug:run'] //NOTE the :run flag
      }
    },

    coveralls: {
      options: {
        debug: false,
        coverageDir: '<%= config.artifacts.coverage %>/coveralls',
        dryRun: false,
        force: true,
        recursive: false
      }
    },

    checkDependencies: {
      'this': {
        options: {
          npmInstall: true
        }
      }
    },

    bump: {
        options: {
          files: ['bower.json'],
          updateConfigs: [],
          commit: true,
          commitMessage: 'Updated bower.json to version v%VERSION%',
          commitFiles: ['bower.json'],
          createTag: false,
          push: false
        }
      },

    shell: {
      "create-site": {
        command: [
          "rm -rf <%= config.artifacts.site %>",
          "generate-md --layout mixu-gray --input ./README.md --output ./<%= config.artifacts.site %>",
          "mv <%= config.artifacts.site %>/README.html <%= config.artifacts.site %>/index.html",
          "cp -r <%= config.artifacts.jsdoc %> <%= config.artifacts.site %>/docs"
        ].join("&&")
      },
      "version": {
        command: function (newVersion) {
          var versionRegex = /^\d+\.\d+\.\d+$/;
          if (!versionRegex.test(newVersion)) {
            grunt.fail.fatal(newVersion + " is not a proper version.");
          }

          return "npm version " + newVersion;
        }
      },
      "publish": {
        command: "npm publish"
      },
      "commit": {
        command: function (newVersion) {
          var versionRegex = /^\d+\.\d+\.\d+$/;
          if (!versionRegex.test(newVersion)) {
            grunt.fail.fatal(newVersion + " is not a proper version.");
          }

          return 'git commit -am "Updated artifacts for version ' + newVersion + '"';
        }
      },
      "installNpm": {
        command: [
          "mkdir -p <%= config.artifacts.npm %>",
          "cd <%= config.artifacts.npm %>",
          "npm init -f",
          "npm install js-mock"
        ].join('&&')
      },
      "installBower": {
        command: "bower install js-mock"
      }
    }
  });

  // Verify installation
  grunt.registerTask('verify', ['checkDependencies']);

  grunt.registerTask('test', "Runs the unit tests; available options: --watch or --chrome", function() {
    if (grunt.option("watch")) {
      return grunt.task.run(["karma:watch:start", "watch:karma-watch"]);
    }

    if (grunt.option("chrome")) {
      return grunt.task.run(["karma:debug:start", "watch:karma-debug"]);
    }

    grunt.task.run([
      'replace:build',
      'insert',
      "karma:unit"
    ]);
  });

  // Build
  grunt.registerTask('build', [
    'clean',
    'jshint:src',
    'todo',
    'replace:build',
    'insert',
    'karma:unit'
  ]);

  grunt.registerTask('website', [
    "jsdoc",
    "shell:create-site"
  ]);

  grunt.registerTask('release', 'Build a new version and publish to NPM', function () {

    var newVersion = grunt.option("setversion");
    var versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(newVersion)) {
      grunt.fail.fatal(newVersion + " is not a proper version. Please set version using the 'setversion' option, i.e.: --setversion=0.5.0");
    }

    var tasks = [
      'verify',
      'build',
      'jshint:dist',
      'copy:dist',
      'karma:dist',
      'website'
    ];

    tasks.push('shell:commit:' + newVersion);
    tasks.push('bump');
    tasks.push('shell:version:' + newVersion);
    tasks.push('shell:publish');

    grunt.task.run(tasks);
  });

  grunt.registerTask('validate-packages', 'Download JsMock through NPM and bower and run tests', function () {
    grunt.task.run([
      'shell:installNpm',
      'shell:installBower',
      'karma:npm',
      'karma:bower',
    ]);
  });

  // Setup default task that runs when you just run 'grunt'
  grunt.registerTask('default', ['build']);
};