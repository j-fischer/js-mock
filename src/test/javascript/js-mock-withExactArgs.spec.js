describe('JsMock - withExactArgs', function(){
  
  var _myFunc;
  
  JsMock.monitorMocks(function () {
    _myFunc = JsMock.mock("WithExactArgs.myFunc");
  });
  
  afterEach(function () {
    JsMock.assertIfSatisfied();
  });
  
  /*
   * HELPER FUNCTIONS
   */
  function expectUnexpectedInvocationError() {
    var args = Array.prototype.slice.call(arguments);
    
    expect(function () {
      _myFunc.apply(null, args);
    }).toThrowError(JsMock.ExpectationError, "ExpectationError: Unexpected invocation of 'WithExactArgs.myFunc' for call 1: actual arguments: " + JSON.stringify(args) + ".");
  }
  
  
  /*
   * TESTS
   */
  describe('proper assertions', function(){
    
    it("should ignore arguments if no expecation was set", function () {
      _myFunc.once();
      
      _myFunc("foo");
		});
    
    it("should match arguments if provided - no args", function () {
      _myFunc.once().withExactArgs();
      
      _myFunc();
		});
    
    it("should fail if an argument was provided but none expected", function () {
      _myFunc.once().withExactArgs();
      
      expectUnexpectedInvocationError("foo");
      
      _myFunc();
		});
    
    it("should match arguments if provided - string", function () {
      _myFunc.once().withExactArgs("foo");
      
      _myFunc("foo");
		});
    
    it("should match arguments if provided - object", function () {
      var obj = {};
      _myFunc.once().withExactArgs(obj);
      
      _myFunc(obj);
		});
    
    it("should match arguments if provided - boolean", function () {
      _myFunc.once().withExactArgs(false);
      
      _myFunc(false);
      _myFunc.verify();
      
      _myFunc.once().withExactArgs(true);
      
      _myFunc(true);
      _myFunc.verify();
		});
    
    it("should match arguments if provided - numbers", function () {
      _myFunc.once().withExactArgs(-1);
      
      _myFunc(-1);
      _myFunc.verify();
      
      _myFunc.once().withExactArgs(0);
      
      _myFunc(0);
      _myFunc.verify();
      
      _myFunc.once().withExactArgs(1);
      
      _myFunc(1);
      _myFunc.verify();
		});
    
    it("should throw unexpected invocation if wrong argument was provided", function () {
      _myFunc.once().withExactArgs("foo");
      
      expectUnexpectedInvocationError("bar");
      
      _myFunc("foo");
		});
    
    it("should throw unexpected invocation if wrong object reference was provided", function () {
      var obj = {};
      _myFunc.once().withExactArgs(obj);
      
      expectUnexpectedInvocationError({});
      
      _myFunc(obj);
		});
    
    it("should throw unexpected invocation if too many arguments wer provided", function () {
      _myFunc.once().withExactArgs("foo");
      
      expectUnexpectedInvocationError("foo", "bar");
      _myFunc("foo");
		});
    
    it("should throw unexpected invocation if string is compared to String object", function () {
      _myFunc.once().withExactArgs("foo");
      
      // NOTE: new String() creates and object which will not be identical with the expected string argument. This is some expected JS behaviour.
      expectUnexpectedInvocationError(new String("foo"));
      
      _myFunc("foo");
		});
    
    it("should throw unexpected invocation if types are not identical", function () {
      _myFunc.once().withExactArgs(true);
      
      expectUnexpectedInvocationError(1);
      
      _myFunc(true);
		});
  });
});