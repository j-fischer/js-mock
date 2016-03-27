  /**
   * @class ExpectationError
   * @classdesc An ExpectationError will be thrown in any situation where a mock
   * expectation has not been met.
   *
   * @property {string} name The name of the error, will always return 'ExpectationError'.
   * @property {string} message The error message for this error instance.
   * @property {string} stack A string containing the stack trace for this error instance.
   */
  function ExpectationError(message) {
    this.name = 'ExpectationError';
    this.message = 'ExpectationError: ' + (message || 'Unknown expectation failed.');
    this.stack = (new Error()).stack;
  }
  ExpectationError.prototype = Object.create(Error.prototype);
  ExpectationError.prototype.constructor = ExpectationError;