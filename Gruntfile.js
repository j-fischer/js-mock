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
        root: 'artifacts',
        build: 'artifacts/build',
        coverage: 'artifacts/reports/coverage',
        jsdoc: 'artifacts/docs',
        site: 'artifacts/site',
        npm: 'artifacts/npm',
        bower: 'artifacts/bower' // see .bowerrc
      },

      package: {
        npm: 'artifacts/npm/node_modules/js-mock/dist',
        bower: 'artifacts/bower/js-mock/dist'
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
      artifacts: '<%= config.artifacts.root %>',
      npm: '<%= config.artifacts.npm %>',
      bower: '<%= config.artifacts.bower %>',
      site: '<%= config.artifacts.site %>'
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
            },
            {
              match: 'YEAR',
              replacement: function() {
                return new Date().getFullYear();
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
        expand: true,
        cwd: '<%= config.artifacts.build %>',
        src: '*',
        dest: '<%= config.dist %>/'
      },
      docsToSite: {
        expand: true,
        cwd: '<%= config.artifacts.jsdoc %>',
        src: '**',
        dest: '<%= config.artifacts.site %>/docs'    
      },
      npm: {
        expand: true,
        src: 'LICENSE.txt',
        dest: '<%= config.artifacts.npm %>/'
      },
    },

    move: {
      site: {
        src: '<%= config.artifacts.site %>/README.html',
        dest: '<%= config.artifacts.site %>/index.html'
      }
    },

    babel: {
      options: {
        sourceMap: true,
        presets: ['@babel/preset-env']
      },
      build: {
        files: {
          '<%= config.artifacts.build %>/<%= pkg.name %>.js': '<%= config.artifacts.build %>/<%= pkg.name %>.js'
        }
      },
      dist: {
        files: {
          '<%= config.dist %>/<%= pkg.name %>.js': '<%= config.artifacts.build %>/<%= pkg.name %>.js'
        }
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
      ]
    },

    coveralls: {
      options: {
        debug: false,
        dryRun: false,
        force: true,
        recursive: false
      },
      
      build: {
        src: '<%= config.artifacts.coverage %>/coveralls/*.info',
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
          "generate-md --layout mixu-gray --input README.md --output <%= config.artifacts.site %>"
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
      "install-npm": {
        command: [
          "npm init -f",
          "npm install js-mock"
        ].join('&&'),
        options: {
          execOptions: {
              cwd: '<%= config.artifacts.npm %>'
          }
      }
        
      },
      "install-bower": {
        command: "bower install js-mock"
      },
      "test": {
        command: "jest --color"
      },
      "test-dist": {
        command: "jest --config=jest.config.dist.js --color"
      },
      "test-npm": {
        command: "jest --config=jest.config.npm.js --color"
      },
      "test-bower": {
        command: "jest --config=jest.config.bower.js --color"
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
      'babel:build',
      'shell:test'
    ]);
  });

  // Build
  grunt.registerTask('build', [
    'clean:artifacts',
    'jshint:src',
    'todo',
    'replace:build',
    'insert',
    'babel:build',
    'shell:test'
  ]);

  grunt.registerTask('website', [
    'jsdoc',
    'clean:site',
    'shell:create-site',
    'move:site',
    'copy:docsToSite'
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
      'copy:dist',
      'shell:test-dist',
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
      'clean:npm',
      'copy:npm',
      'shell:install-npm',
      'clean:bower',
      'shell:install-bower',
      'shell:test-npm',
      'shell:test-bower',
    ]);
  });

  // Setup default task that runs when you just run 'grunt'
  grunt.registerTask('default', ['build']);
};