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
  function expectMissingInvocationError(expectedErrorMsg) {
    expect(_myFunc.verify).toThrowError(JsMock.ExpectationError, expectedErrorMsg);
  }
  
  /*
   * TESTS
   */
  describe('verify', function() {
    
    it("should fail a single expectation", function () {
      _myFunc.once();
      
      expectMissingInvocationError('ExpectationError: Missing invocations for WithExactArgs.myFunc: ["Expectation for call 1 with args undefined, will return undefined."].');
		});
    
    it("should list all failing expectations", function () {
      _myFunc.twice();
      _myFunc.onFirstCall().withExactArgs("foo").returns("bar");
      _myFunc.onSecondCall().withExactArgs(1).returns(2);
      
      expectMissingInvocationError('ExpectationError: Missing invocations for WithExactArgs.myFunc: ["Expectation for call 1 with args [\\"foo\\"], will return \\"bar\\".","Expectation for call 2 with args [1], will return 2."].');
		});
  });
});