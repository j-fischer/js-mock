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
    		
		/*
		 * TESTS
		 */
    it("should succeed verification if no expectation is set", function () {
      var myFunc = JsMock.mock("myFunc");
      
      myFunc.verify();
		});
    
    it("should fail verification if expectation is set", function () {
      var myFunc = JsMock.mock("myFunc");
      
      myFunc.once();
      
      expectExpectationError(myFunc.verify, "ExpectationError: Missing invocations for 'myFunc'. Expected 1 call(s) but only got 0.");
		});
  });
});