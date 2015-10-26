describe('JsMock', function(){
  
  var _clock;
  
  /*
   * HELPER FUNCTIONS
   */
  function expectExpectationError(func, expectedErrorMsg) {
    expect(func).toThrowError(JsMock.ExpectationError, expectedErrorMsg);
  }
  
  /*
   * TESTS
   */
  describe('mock function', function(){
    		
    it("should succeed verification if no expectation is set", function () {
      var myFunc = JsMock.mock("myFunc");
      
      myFunc.verify();
		});
    
    it("each mock instance is unique", function () {
      var myFunc1 = JsMock.mock("myFunc");
      var myFunc2 = JsMock.mock("myFunc");
      
      myFunc1.once();
      myFunc2.once();
          
      expectExpectationError(myFunc1.verify, "ExpectationError: Missing invocations for 'myFunc'. Expected 1 call(s) but only got 0.");
      expectExpectationError(myFunc2.verify, "ExpectationError: Missing invocations for 'myFunc'. Expected 1 call(s) but only got 0.");
      
      myFunc1();
      
      myFunc1.verify();
      expectExpectationError(myFunc2.verify, "ExpectationError: Missing invocations for 'myFunc'. Expected 1 call(s) but only got 0.");
		});
  });
  
  describe('monitorMocks function', function(){
    		
    afterEach(function() {
      JsMock.monitorMocks(function () {
        // clean monitor
      })
    });
        
    it("should succeed verification if no expectation is set", function () {
      var myFunc1, myFunc2;
      JsMock.monitorMocks(function () {
        myFunc1 = JsMock.mock("myFunc1");
        myFunc2 = JsMock.mock("myFunc2");
      });
      
      myFunc1.once();
      myFunc2.once();
      
      expectExpectationError(JsMock.assertIfSatisfied, "ExpectationError: Missing invocations for 'myFunc1'. Expected 1 call(s) but only got 0.");
      
      myFunc1();
      
      expectExpectationError(JsMock.assertIfSatisfied, "ExpectationError: Missing invocations for 'myFunc2'. Expected 1 call(s) but only got 0.");
      
      myFunc2();
      
      JsMock.assertIfSatisfied(); 
		});
    
    it("should override all previously monitored mocks", function () {
      var myFunc1, myFunc2;
            
      // Monitor func1
      JsMock.monitorMocks(function () {
        myFunc1 = JsMock.mock("myFunc1");
        
        myFunc1.once();
      });
      
      // assert should fail for func1
      expectExpectationError(JsMock.assertIfSatisfied, "ExpectationError: Missing invocations for 'myFunc1'. Expected 1 call(s) but only got 0.");
      
      // Now, monitor func2 instead of func1
      JsMock.monitorMocks(function () {
        myFunc2 = JsMock.mock("myFunc2");
        
        myFunc2.once();
      });
      
      // assert should fail for func2
      expectExpectationError(JsMock.assertIfSatisfied, "ExpectationError: Missing invocations for 'myFunc2'. Expected 1 call(s) but only got 0.");
      
      myFunc2();
      
      JsMock.assertIfSatisfied(); 
      
      // verify for func1 should still fail
      expectExpectationError(myFunc1.verify, "ExpectationError: Missing invocations for 'myFunc1'. Expected 1 call(s) but only got 0.");
		});
    
    it("should bubble exception", function () {
      expect(function () {
        JsMock.monitorMocks(function () {
          throw new Error("Some error in monitorMocks!!!")
        });
      }).toThrowError("Some error in monitorMocks!!!");
		});
  });
  
  describe('assertIfSatisfied function', function(){
    it("passes if no expectations are monitored", function () {
      var myFunc = JsMock.mock("myFunc");
      
      myFunc.once();
      
      expectExpectationError(myFunc.verify, "ExpectationError: Missing invocations for 'myFunc'. Expected 1 call(s) but only got 0.");
      
      JsMock.assertIfSatisfied();
    });    
  });
});