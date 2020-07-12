import JsMock from 'js-mock';

describe('ExpectationError', function(){
  /*
   * TESTS
   */
  describe('constructor', function() {

    it("uses default message if message is undefined", function () {
      var error = new JsMock.ExpectationError();

      expect(error.message).toBe('ExpectationError: Unknown expectation failed.');
    });
  });
});