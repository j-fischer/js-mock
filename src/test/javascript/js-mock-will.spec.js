describe('JsMock', function(){
  
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
  function expectExpectationError(func, expectedErrorMsg) {
    expect(func).toThrowError(JsMock.ExpectationError, expectedErrorMsg);
  }
  
  /*
   * TESTS
   */
  describe('will', function(){
    
    it("should throw if no calls have been expected", function () {
      expect(function () {
        _myFunc.will(function () {
          throw "Should not be registered.";
        });
      }).toThrowError(Error, "You must call allowing, exactly, never, once, twice or thrice before setting any other expectations for this mock.");
    }); 
    
    it("should throw AssertionError if function throws an exception", function () {
      _myFunc.once().will(function () {
        throw "some error";
      });
      
      expectExpectationError(_myFunc, "ExpectationError: Registered action for 'WithExactArgs.myFunc' threw an error: \"some error\".");
		});
    
    it("should pass the arguments to the function", function () {
      var arg1 = "abc";
      var arg2 = { a: "propertyVBalue" };
      
      _myFunc.once().will(function (actualArg1, actualArg2) {
        expect(actualArg1).toBe(arg1);
        expect(actualArg2).toBe(arg2);
      });
      
      _myFunc(arg1, arg2);
		});
    
    it("should do nothing with the return value", function () {
      _myFunc.once().will(function () {
        return "foo";
      }).returns("bar");
      
      expect(_myFunc()).toBe("bar");
		});
  });
});