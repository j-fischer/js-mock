import JsMock from 'js-mock';
import { $, jQuery } from 'jquery.init'; 

describe('GlobalMock', function(){

  var _jQueryMock;

  beforeEach(function () {
    JsMock.watch(function () {
      _jQueryMock = JsMock.mockGlobal("$");
    });
  });

  afterEach(JsMock.assertWatched);

  /*
   * HELPER FUNCTIONS
   */
  function expectExpectationError(func, expectedErrorMsg) {
    expect(func).toThrowError(JsMock.ExpectationError, expectedErrorMsg);
  }

  /*
   * TESTS
   */
  describe('verify', function() {

    it("should return true if there is no ExpectationError", function () {
      expect(global.$).not.toBe(jQuery);

      expect(_jQueryMock.verify()).toBe(true);
    });

    it("should verify all mocks, all at once", function() {
      expect(global.$).not.toBe(jQuery);

      _jQueryMock.expect().once().with("div");
      _jQueryMock.expect().noConflict.once().with();

      expectExpectationError(_jQueryMock.verify, 'ExpectationError: Missing invocations detected for global mock $:\nExpectationError: Missing invocations for $():\n>>> Expectation for call 1 with args ["div"], will return undefined\nExpectationError: Missing invocations for $.noConflict():\n>>> Expectation for call 1 with args [], will return undefined');

      global.$("div");

      expectExpectationError(_jQueryMock.verify, 'ExpectationError: Missing invocations detected for global mock $:\nExpectationError: Missing invocations for $.noConflict():\n>>> Expectation for call 1 with args [], will return undefined');

      global.$.noConflict();

      _jQueryMock.verify();
    });
  });
});