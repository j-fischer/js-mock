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

    it("restores all global mocks, even if some are not fulfilled", function () {
      var myFunc, $Mock, jQueryMock;
      JsMock.monitorMocks(function () {
        myFunc = JsMock.mock("myFunc");
        $Mock = JsMock.mockGlobal("$");
        jQueryMock = JsMock.mockGlobal("jQuery");
      });

      $Mock.expect().once().with("div");

      expectExpectationError(JsMock.assertIfSatisfied, 'ExpectationError: Missing invocations for $: ["Expectation for call 1 with args [\\"div\\"], will return undefined."].');

      expect($.verify).toBe(undefined);
      expect($).toBe(jQuery);
    });
  });
});