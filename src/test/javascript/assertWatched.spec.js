import JsMock from 'js-mock';
import { $, jQuery } from 'jquery.init'; 

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
  describe('assertWatched', function() {

    it("passes if no expectations are monitored", function () {
      var myFunc = JsMock.mock("myFunc");

      myFunc.once();

      expectExpectationError(myFunc.verify, 'ExpectationError: Missing invocations for myFunc():\n>>> Expectation for call 1 with args undefined, will return undefined');

      expect(JsMock.assertWatched()).toBe(true);
    });

    it("returns true if all mocks are satisfied", function () {
      var myFunc;
      JsMock.watch(function () {
        myFunc = JsMock.mock("myFunc");
      });

      expect(JsMock.assertWatched()).toBe(true);
    });

    it("restores all global mocks, even if some are not fulfilled", function () {
      var myFunc, $Mock, jQueryMock;
      JsMock.watch(function () {
        myFunc = JsMock.mock("myFunc");
        $Mock = JsMock.mockGlobal("$");
      });

      expect(global.$).not.toBe(jQuery, '$ and jQuery should not be the same.');

      $Mock.expect().once().with("div");

      expectExpectationError(JsMock.assertWatched, 'ExpectationError: Missing invocations for $():\n>>> Expectation for call 1 with args ["div"], will return undefined');

      expect(global.$.verify).toBe(undefined);
      expect(global.$).toBe(jQuery, '$ and jQuery should be the same.');

      // Fullfil expectation to avoid ExpactationErrors in other test cases.
      $Mock.activate();
      global.$("div");
      JsMock.assertWatched();
    });
  });
});