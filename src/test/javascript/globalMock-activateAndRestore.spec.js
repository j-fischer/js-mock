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
  describe('restore', function() {

    it("should restore original object", function() {
      expect(global.$).not.toBe(jQuery);
      expect(global.$).toBe(_jQueryMock.expect());

      _jQueryMock.restore();

      expect(global.$).toBe(jQuery);
    });

    it("should return true", function() {
      expect(global.$).not.toBe(jQuery);

      expect(_jQueryMock.restore()).toBe(true);
    });

    it("should also verify mock", function() {
      _jQueryMock.expect().once().with("div");

      expectExpectationError(function () {
        _jQueryMock.restore();
      }, 'ExpectationError: Missing invocations detected for global mock $:\nExpectationError: Missing invocations for $():\n>>> Expectation for call 1 with args ["div"], will return undefined');

      expect(global.$).toBe(jQuery);

      _jQueryMock.activate();

      global.$("div");
    });
  });

  describe('restoreWithoutVerifying', function() {
    it("should not verify mock", function() {
      _jQueryMock.expect().once().with("div");

      _jQueryMock.restoreWithoutVerifying();

      expect(global.$).toBe(jQuery);

      _jQueryMock.activate();

      global.$("div");
    });
  });
});