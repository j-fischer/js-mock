describe('JsMock', function(){

  /*
   * HELPER FUNCTIONS
   */
  function expectExpectationError(func, expectedErrorMsg) {
    expect(func).toThrowError(JsMock.ExpectationError, expectedErrorMsg);
  }

  /*
   * TESTS
   */
  describe('assertIfSatisfied', function(){
    it("passes if no expectations are monitored", function () {
      var myFunc = JsMock.mock("myFunc");

      myFunc.once();

      expectExpectationError(myFunc.verify, 'ExpectationError: Missing invocations for myFunc: ["Expectation for call 1 with args undefined, will return undefined."].');

      expect(JsMock.assertIfSatisfied()).toBe(true);
    });

    it("returns true if all mocks are satisfied", function () {
      var myFunc;
      JsMock.monitorMocks(function () {
        myFunc = JsMock.mock("myFunc");
      });

      expect(JsMock.assertIfSatisfied()).toBe(true);
    });
  });
});