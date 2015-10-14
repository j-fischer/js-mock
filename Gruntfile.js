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
        src: ['<%= config.app %>/*.js', '<%= config.app %>/**/*.js'], 
        options: {
          destination: 'docs/jsdoc'
        }
      }
    },
    
    copy: {
      dist: {
        src: '<%= config.app %>/<%= pkg.name %>.js',
        dest: '<%= config.dist %>/<%= pkg.name %>-<%= pkg.version %>.js',
        options: {
          process: function (content) {
            return '/* ' + pkg.name + ' v' + pkg.version + ' ' + grunt.template.today("yyyy-mm-dd") + ' - Copyright notice here */\n' + content;
          },
        },
      }
    },
    
    uglify: {
      options: {
        banner: '/* <%= pkg.name %> v<%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> - Copyright notice here */\n'
      },
      build: {
        src: '<%= config.app %>/<%= pkg.name %>.js',
        dest: '<%= config.dist %>/<%= pkg.name %>-<%= pkg.version %>.min.js'
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
      unit: {
        configFile: '<%= config.test %>/karma.conf.js',
        singleRun: true,
        autoWatch: false,
        keepalive: true,
        colors: false,
        browsers: ['Chrome'],
        reporters: ['progress', 'coverage']
      },
      watch: {
        options: {
          configFile: '<%= config.test %>/karma.conf.js'
        },
        reporters: ['progress']
      },
      unit_phantomjs: {
        configFile: '<%= config.test %>/karma.conf.js',
        singleRun: true,
        browsers: ['PhantomJS'],
        reporters: ['dots', 'coverage']
      }
    },

    checkDependencies: {
      'this': {
        options: {
          npmInstall: true
        }
      }
    }
  });
  
  // Print help
  grunt.registerTask('help', ['echo:help']);

  // Verify installation
  grunt.registerTask('verify', ['checkDependencies']);
  
  // Build
  grunt.registerTask('build', [
    'clean',
    'jshint',
    'karma:unit_phantomjs',
    'copy:dist',
    'uglify',
    'jsdoc'
  ]);
  
  // Setup default task that runs when you just run 'grunt'
  grunt.registerTask('default', ['build']);
};