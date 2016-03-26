// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to match all subfolders:
// 'test/spec/**/*.js'
module.exports = function (grunt) {
  // show elapsed time at the end
  require('time-grunt')(grunt);

  // load all grunt tasks needed for this run
  require('jit-grunt')(grunt);

  // configurable paths
  var config = {
      app: 'src/main/javascript',
      test: 'src/test',
      dist: 'dist',

      artifacts: {
        coverage: 'artifacts/docs/coverage',
        junit: 'artifacts/docs/junit',
        jsdoc: 'artifacts/docs/jsdoc',
        site: 'artifacts/site'
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
      coverage: ["<%= config.artifacts.coverage %>/**"],
      junit: ["<%= config.artifacts.junit %>/**"]
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

    copy: {
      dist: {
        src: '<%= config.app %>/<%= pkg.name %>.js',
        dest: '<%= config.dist %>/<%= pkg.name %>.js'
      }
    },

    jshint: {
        options: {
            jshintrc: '.jshintrc',
            reporter: require('jshint-stylish')
        },
        all: [
            'Gruntfile.js',
            '<%= config.app %>/{,*/}*.js',
            '<%= config.test %>/javascript/{,*/}*.js'
        ]
    },

    karma: {
      options: {
        configFile: '<%= config.test %>/karma.conf.js',

        // list of files / patterns to load in the browser
        files: [
          'node_modules/jshamcrest/jshamcrest.js',
          'node_modules/jquery/dist/jquery.js',
          {pattern: '<%= config.app %>/*.js'},
          {pattern: '<%= config.test %>/**/*.spec.js'}
        ],

        // For code coverage reporting
        preprocessors: {
          '<%= config.app %>/**/*.js': 'coverage'
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
        singleRun: true
      },
      watch: {
        reporters: ['spec']
      },
      debug: {
        browsers: ['Chrome'],
        reporters: ['spec']
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
      }
    }
  });

  // Verify installation
  grunt.registerTask('verify', ['checkDependencies']);

  grunt.registerTask('test', "Runs the unit tests; available options: --watch or --chrome", function() {
    if (grunt.option("watch")) {
      return grunt.task.run("karma:watch");
    }

    if (grunt.option("chrome")) {
      return grunt.task.run("karma:debug");
    }

    grunt.task.run("karma:unit");
  });

  // Build
  grunt.registerTask('build', [
    'clean',
    'jshint',
    'todo',
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
      'build',
      'copy:dist',
      'website'
    ];

    tasks.push('shell:commit:' + newVersion);
    tasks.push('bump');
    tasks.push('shell:version:' + newVersion);
    tasks.push('shell:publish');

    grunt.task.run(tasks);
  });

  // Setup default task that runs when you just run 'grunt'
  grunt.registerTask('default', ['build']);
};