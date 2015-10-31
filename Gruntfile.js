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
      links: ["dist/**", "coverage/**"]
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
        dest: '<%= config.dist %>/<%= pkg.name %>.js',
        options: {
          process: function (content) {
            return '/* ' + pkg.name + ' v' + pkg.version + ' ' + grunt.template.today("yyyy-mm-dd") + ' - Copyright 2015, Johannes Fischer */\n' + content;
          },
        },
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
        browsers: ['PhantomJS'],
        reporters: ['dots', 'coverage']
      },
      watch: {
        browsers: ['PhantomJS'],
        reporters: ['dots', 'coverage']
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
    'karma:unit'
  ]);
  
  grunt.registerTask('release', [
    'build',
    'copy:dist',
    'jsdoc'
    // add more tasks like update version, npm publish, etc.
  ]);
  
  grunt.registerTask('website', [
    "shell:create-site"
  ]);
  
  // Setup default task that runs when you just run 'grunt'
  grunt.registerTask('default', ['build']);
};