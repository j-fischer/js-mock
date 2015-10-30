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
  
  function expectAlreadyInvokedError(numOfTimes) {
    expectExpectationError(_myFunc, "ExpectationError: 'WithExactArgs.myFunc' already called " + numOfTimes + " time(s).");
  }
  
  function expectMissingInvocationError(numOfExpectedInvocations) {
    expectExpectationError(_myFunc.verify, 'ExpectationError: Missing invocations for WithExactArgs.myFunc: ["Expectation for call ' + numOfExpectedInvocations + ' with args undefined, will return undefined."].');
  }
  
  
  /*
   * TESTS
   */
  describe('exactly', function(){
    
    describe('once', function(){
      it("should fail if not invoked", function () {
        _myFunc.once();
      
        expectMissingInvocationError(1);
  		});
      
      it("should pass if invoked once", function () {
        _myFunc.once();
      
        _myFunc();
        _myFunc.verify();
  		});
      
      it("should fail if invoked more than once", function () {
        _myFunc.once();
      
        _myFunc();
      
        expectAlreadyInvokedError(1);
        expectAlreadyInvokedError(1);
  		});
    });
    
    describe('twice', function(){
      it("should fail if not invoked", function () {
        _myFunc.twice();
      
        _myFunc();
      
        expectMissingInvocationError(2);
  		});
      
      it("should pass if invoked twice", function () {
        _myFunc.twice();
      
        _myFunc();
        _myFunc();
        
        _myFunc.verify();
  		});
      
      it("should fail if invoked more than twice", function () {
        _myFunc.twice();
      
        _myFunc();
        _myFunc();
      
        expectAlreadyInvokedError(2);
        expectAlreadyInvokedError(2);
  		});
    });
    
    describe('thrice', function(){
      it("should fail if not invoked three times", function () {
        _myFunc.thrice();
      
        _myFunc();
        _myFunc();
      
        expectMissingInvocationError(3);
  		});
      
      it("should pass if invoked three times", function () {
        _myFunc.thrice();
      
        _myFunc();
        _myFunc();
        _myFunc();
        
        _myFunc.verify();
  		});
      
      it("should fail if invoked more than three times", function () {
        _myFunc.thrice();
      
        _myFunc();
        _myFunc();
        _myFunc();
      
        expectAlreadyInvokedError(3);
        expectAlreadyInvokedError(3);
  		});
    });
    
    describe('exactly', function(){
      it("should fail if not invoked 5 times", function () {
        _myFunc.exactly(5);
      
        _myFunc();
        _myFunc();
        _myFunc();
        _myFunc();
      
        expectMissingInvocationError(5);
  		});
      
      it("should pass if invoked 5 times", function () {
        _myFunc.exactly(5);
      
        _myFunc();
        _myFunc();
        _myFunc();
        _myFunc();
        _myFunc();
        
        _myFunc.verify();
  		});
      
      it("should fail if invoked more than three times", function () {
        _myFunc.exactly(5);
      
        _myFunc();
        _myFunc();
        _myFunc();
        _myFunc();
        _myFunc();
      
        expectAlreadyInvokedError(5);
        expectAlreadyInvokedError(5);
  		});
    });
  });
});