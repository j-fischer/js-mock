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
  
  function init() {
    
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
    myFunc: function (args) {
      
    }
  };
  
  if ( typeof define === "function" && define.amd ) {
  	define("js-mock", [], function() {
  		return API;
  	});
  }

  window.JsMock = API;
})();