describe('JsMock', function(){
  
  var _clock;
  
  /*
   * HELPER FUNCTIONS
   */
  function doSomething() {
    // do something
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
      
      expect(myFunc.verify).toThrow();
      //TODO: replace with expect(myFunc.verify).toThrowError("Missing invocations for 'myFync'. Expected 1 call(s) but only got 0.");
		});
  });
});