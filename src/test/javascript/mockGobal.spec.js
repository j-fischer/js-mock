import JsMock from 'js-mock';
import { $, jQuery } from 'jquery.init'; 
import hamjest from 'hamjest';

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
  describe('mockGlobal', function(){
    it("throws if globalObjectName is not of type string", function () {
      expect(JsMock.mockGlobal).toThrowError(TypeError, "The first argument must be a string");
      expect(function () {
        JsMock.mockGlobal(123);
      }).toThrowError(TypeError, "The first argument must be a string");
      expect(function () {
        JsMock.mockGlobal([]);
      }).toThrowError(TypeError, "The first argument must be a string");
    });

    it("throws if the global object is undefined", function () {
      expect(function () {
        JsMock.mockGlobal("doesNotExist");
      }).toThrowError(TypeError, "Global variable 'doesNotExist' must be an object or a function, but was 'undefined'");
    });

    it("throws if the global object is not null", function () {
      global.cannotMock = null;
      expect(function () {
        JsMock.mockGlobal("cannotMock");
      }).toThrowError(TypeError, "Global variable 'cannotMock' cannot be null");
    });

    it("throws if the global object is not supported", function () {
      global.cannotMock = [];
      expect(function () {
        JsMock.mockGlobal("cannotMock");
      }).toThrowError(TypeError, "Mocking of arrays is not supported");
    });

    it("should activate the global mock by default", function () {
      expect(jQuery).toBe(global.$);

      var jqueryMock = JsMock.mockGlobal("$");

      expect(jQuery).not.toBe(global.$);

      jqueryMock.restore();
    });

    it("should mock partial objects if path is provided", function () {
      expect(jQuery).toBe(global.$);

      var jqueryMock = JsMock.mockGlobal("$.ajax");

      expect(jQuery).toBe($);

      expect(global.$.extend({1: 2}, {foo: "bar"})).toEqual({1:2, foo: "bar"});

      expect(global.$.ajax.verify).toBeTruthy();
      expectExpectationError($.ajax, "ExpectationError: '$.ajax' was not expected to be called. The invocation used the following arguments: []");

      jqueryMock.restore();
    });
  });

  describe('mockGlobal - Date.now', function(){
    it("should throw if invoked without expectation", function () {
      var dateMock = JsMock.mockGlobal("Date.now");

      expectExpectationError(Date.now, "ExpectationError: 'Date.now' was not expected to be called. The invocation used the following arguments: []");

      dateMock.restore();
    });

    it("should keep all other Date functions intact", function () {
      var dateMock = JsMock.mockGlobal("Date.now");

      dateMock.expect().once().with().returns(new Date(Date.UTC(2016, 1, 29, 8, 0, 0)));

      var now = Date.now();

      expect(now.getTime()).toBe(1456732800000);

      now.setUTCFullYear(2020);
      expect(now.toUTCString()).toEqual("Sat, 29 Feb 2020 08:00:00 GMT");

      dateMock.restore();
    });
  });

  describe('mockGlobal - setTimeout', function(){
    it("should throw if invoked without expectation", function () {
      var setTimeoutMock = JsMock.mockGlobal("setTimeout");

      expectExpectationError(setTimeout, "ExpectationError: 'setTimeout' was not expected to be called. The invocation used the following arguments: []");

      setTimeoutMock.restore();
    });

    it("should allow to mock setTimeout call using with() and will() functions", function () {
      var setTimeoutMock = JsMock.mockGlobal("setTimeout");
      var delayedFuncMock = JsMock.mock("delayedFunc");
      var timeoutId = "timeout123";

      setTimeoutMock.expect().once().with(hamjest.func(), 500).will(function (func, delay) {
        func();

        return timeoutId;
      });

      delayedFuncMock.once().with();

      var result = setTimeout(delayedFuncMock, 500);
      expect(result).toBe(timeoutId);

      setTimeoutMock.restore();
    });
  });
});