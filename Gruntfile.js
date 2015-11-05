// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to match all subfolders:
// 'test/spec/**/*.js'
module.exports = function (grunt) {
  // show elapsed time at the end
  require('time-grunt')(grunt);
  // load all grunt tasks
  require('load-grunt-tasks')(grunt);
  
  // configurable paths
  var config = {
      app: 'src/main/javascript',
      test: 'src/test',
      dist: 'dist'
  };
  
  grunt.registerMultiTask('echo', 'Echo back input', function(){    
    var data = this.data;
    
    if (typeof (data) === 'string') {
      if (grunt.file.exists(data)) {
        grunt.log.writeln(grunt.file.read(data));
      } else {
        grunt.log.writeln(data);
      }
    }
    
    if (typeof (data) === 'object') {
      var key;
      for (key in data) {
        if (data.hasOwnProperty(key)) {
          grunt.log.writeln(data[key]);
        }
      }
    }
  });
  
  var pkg = grunt.file.readJSON('package.json');
  grunt.initConfig({
    pkg: pkg,
    config: config,
    
    echo: {
      help: 'README.md'        
    },
    
    clean: {
      options: {
        force: true
      },
      links: ["coverage/**"]
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
          destination: 'docs/jsdoc',
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
            '<%= config.app %>/{,*/}*.js'
        ]
    },
    
    karma: {
      options: {
        configFile: '<%= config.test %>/karma.conf.js',
      },
      unit: {
        singleRun: true,
        browsers: ['PhantomJS']
      },
      watch: {
        browsers: ['PhantomJS']
      },
      debug: {
        reporters: ['progress']
      }
    },

    checkDependencies: {
      'this': {
        options: {
          npmInstall: true
        }
      }
    },
    
    shell: {
      "create-site": {
        command: [
          "rm -rf site",
          "generate-md --layout mixu-gray --input ./README.md --output ./site",
          "mv site/README.html site/index.html",
          "cp -r docs/jsdoc site/docs"
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
  
  // Print help
  grunt.registerTask('help', ['echo:help']);

  // Verify installation
  grunt.registerTask('verify', ['checkDependencies']);
  
  grunt.registerTask('test', ['karma:unit']);
  
  // Build
  grunt.registerTask('build', [
    'clean',
    'jshint',
    'todo',
    'karma:unit'
  ]);
  
  grunt.registerTask('release', 'Build a new version and publish to NPM', function (newVersion) {    
    var tasks = [
      'build',
      'copy:dist',
      'jsdoc'
    ];
    
    tasks.push('shell:commit:' + newVersion);
    tasks.push('shell:version:' + newVersion);
    tasks.push('shell:publish');
    
    grunt.task.run(tasks);
  });
  
  grunt.registerTask('website', [
    "jsdoc",
    "shell:create-site"
  ]);
  
  // Setup default task that runs when you just run 'grunt'
  grunt.registerTask('default', ['build']);
};