(function () { // initializes namepsace if neccessary
  var namespaceString = 'JsMock';
  
    var parts = namespaceString.split('.'),
        parent = window,
        currentPart = '';    
        
    for(var i = 0, length = parts.length; i < length; i++) {
        currentPart = parts[i];
        parent[currentPart] = parent[currentPart] || {};
        parent = parent[currentPart];
    }
})();

(function () {
  
  /* constants */
  var _ALL_CALLS = -1;
  
  /* variables */
  var _shouldMonitorMocks = false;
  var _monitoredMocks = [];
  
 /** 
  * This is a module. 
  *
  * @class
  */
  var Mock = function (args) {
    
    var _scope = _ALL_CALLS;
    var _expectTotalCalls = 0;
    
    var _name = args.name;
    
    var _expectations = {
      
    };
    
    function init() {
      
    }
    
    return {
      exactly: function(count) {
        
      },
      
      withExactArgs: function () {
        
      }, 
      
      returns: function (arg) {
        
      },
      
      will: function (willArgs, func) {
        
      },
      
      assertIfSatisfied: function () {
        
      }
      /* helpers*/
      
    }
  };
  
  
  function mock(name) {
    // body...
  }
  
  function mockProperties(objName, obj) {
    // body...
  }  
  
  init();
  
 /** 
  * This is a module. 
  *
  * @exports js-mock
  */
  var API = {
    /** 
     * This is an API method that does something.
     * @param {object} args
     *   @param {string} args.aParam: this is a parameter for this method
     *
     * @module js-mock
     */
    mock: function (arg1, arg2) {

    },
    
    monitorMocks: function (factoryFunc) {
      
    }
  };
  
  if ( typeof define === "function" && define.amd ) {
  	define("js-mock", [], function() {
  		return API;
  	});
  }

  window.JsMock = API;
})();