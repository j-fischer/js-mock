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
  
  /*
   * TESTS
   */
  describe('returns', function(){
    
    it("should return undefined if nothing else was specified", function () {
      _myFunc.once().returns();
      
      expect(_myFunc()).toBe(undefined);
		});
    
    it("should return value that was specified", function () {
      _myFunc.once().returns("bar");
      
      expect(_myFunc()).toBe("bar");
		});
    
    it("should return value object referece", function () {
      var obj = {};
      _myFunc.twice().returns(obj);
      
      expect(_myFunc()).not.toBe({});
      expect(_myFunc()).toBe(obj);
		});
    
    it("should return different values for different calls", function () {
      var obj = {};
      _myFunc.twice();
      
      _myFunc.onFirstCall().returns("foo");
      _myFunc.onSecondCall().returns("bar");
      
      expect(_myFunc()).toBe("foo");
      expect(_myFunc()).toBe("bar");
		});
  });
});