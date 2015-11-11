# JsMock

[![Build Status](https://travis-ci.org/j-fischer/js-mock.svg?branch=master)](https://travis-ci.org/j-fischer/js-mock) [![Dependency Status](https://www.versioneye.com/javascript/j-fischer:js-mock/0.4.0/badge.svg)](https://www.versioneye.com/javascript/j-fischer:js-mock/0.4.0)

A JavaScript mocking framework, which can be used with any test framework. JsMock is inspired by [jMock](http://www.jmock.org/) and [Sinon.js](http://sinonjs.org/) with its interface being very similar to Sinon in order to make it easy to switch between those two frameworks. 

JsMock should work with any test framework. 

## How is JsMock different from other mock frameworks?

JsMock only supports mock objects where the expectations have to be defined before the mock objects are used by the function/module under test. This may require a bit more effort when writing a test case, but the outcome should be that the interactions of the unit under test with the mock object are very clearly defined through the tests. This should expose bugs or unintended behavior that would otherwise remain hidden if stubs or spies are used, but not evaluated properly.  

JsMock also has the goal to simplify the setup and validation of mocks by monitoring them for you. This will make it easy to evaluate that all expected calls have been made at the end of a test. 

## Installation

Install JsMock via [npm](https://www.npmjs.com)

    $ npm install js-mock --save-dev

and include node_modules/js-mock/dist/js-mock.js in your project. 

Or install it using [Bower](http://bower.io/)

    $ bower install js-mock --save-dev    

and include bower_components/js-mock/dist/js-mock.js in your project. 

If you are building an Ember CLI application, just use the [Ember JsMock](https://github.com/j-fischer/ember-js-mock) addon to add JsMock to your Ember CLI application tests.

    $ ember install ember-js-mock

## Getting Started

The following list highlights some simple use cases of JsMock and includes some best practices. For a full reference, please check out the [API docs](http://www.jsmock.org/docs/index.html) or take a look at the [unit tests](https://github.com/j-fischer/js-mock/src/test/javascript).

### JsMock.mock()

JsMock can create mock functions or objects.

    var mockFunc = JsMock.mock("nameOfFunction");

    var objectToMock = {
      doSomething: function () {
        // does something
      }
    };
    
    // Note: Returns a mock clone, the original object will not be modified.
    var mockObject = JsMock.mock("nameOfObject", objectToMock); 


### JsMock.monitorMocks()

When testing a module or file, the best way is to define a set of global mocks using the `monitorMocks()` function, which can be shared between the test cases. All mocks created inside the factory function will be added to the current test context and can be verified with a single call to `JsMock.assertIfSatisfied()`.

    var mockFunction1, mockFunction2;
    JsMock.monitorMocks(function () {
      mockFunction1 = JsMock.mock("name1");
      mockFunction2 = JsMock.mock("name2");
    });


### JsMock.assertIfSatisfied()

Calling this function will go through the list of all mocks that are currently monitored and will call `.verify()` on each of them. Should a mock fail the validation, an `ExpectationError` will be thrown. The functions returns `true` if all mocks were satisfied, which can be used to pass a simple assertion. 

    var mockFunction1, mockFunction2;
    JsMock.monitorMocks(function () {
      mockFunction1 = JsMock.mock("name1");
      mockFunction2 = JsMock.mock("name2");
    });

    // Verify all monitored mocks
    JsMock.assertIfSatisfied();

If the test case requires an assertion, the following could be done:

    var mockFunction1;
    JsMock.monitorMocks(function () {
      mockFunction1 = JsMock.mock("name1");
    });

    // Verify all monitored mocks
    assert.ok(JsMock.assertIfSatisfied());


### mock.exactly(<number>)

Set the expectation for the mock to be called N number of times. 

    var mock = JsMock.mock("aMock");

    // Expect the mock to be invoked 4 times
    mock.exactly(4); 


### mock.withExactArgs(<anything>...)

Set the expectation to be called with the exact arguments provided. Any of the given arguments can be 
a JsHamcrest style matcher. If a matcher is provided as an argument, the actual argument will
be passed on to the `matches()` function of the matcher object.

    var mock = JsMock.mock("aMock");

    // Expect to be called like this: mock("foo", "bar");
    mock.once().withExactArgs("foo", "bar");


### mock.returns(<anything>)

Set the expectation for the mock to return a given value.

    var mock = JsMock.mock("aMock");

    // Expect the mock to be invoked once with no arguments, returning "foo"
    mock.once().withExactArgs().returns("foo")

    var x = "foo" === mock(); // true

### mock.callsAndReturns(<function>)

Will execute the given function once the mock was successfully called. The arguments passed to the mock function 
will be forwarded to the provided function and the value returned by the given function will also be returned by the mock.

    var mock = JsMock.mock("aMock");

    // Expect the mock to be invoked once with no arguments, returning "foo"
    mock.once().callsAndReturns(function (arg) {
      var x = arg; // x == "foo"
      return "bar";
    });

    var y = mock("foo"); // y == "bar"


### mock.onCall(<number>)

Will set all following expectations for the given call. 

    var mock = JsMock.mock("aMock");

    // Expect the mock to be invoked 2 times
    mock.exactly(2); 

    // On the first call, expect "foo" to be the argument and return 1
    mock.onCall(1).withExactArgs("foo").returns(1);

    // On the second call, expect "bar" to be the argument and return 2
    mock.onCall(2).withExactArgs("bar").returns(2);


### mock.allowing()

Converts this mock into a stub, which will never throw a missing invocation error. 
As a stub, it cannot have different behaviors for different calls. If `withExactArgs`
is defined, any invocation other than the defined one will throw an unexpected invocation error.
Note: Verifying the stub will reset the object into mocking mode with 0 calls expected.

    var mock = JsMock.mock("aMock");

    // Expect the mock to be invoked once
    mock.allowing();
    
    mock("foo");
    mock("bar");
    
    // will always succeed and reset the mock
    mock.verify();

### mock.verify()

Verifies that all expectations of this mock have been fulfilled. If any expectation was
not fullfiled, an ExpectationError will be thrown.

    var mock = JsMock.mock("aMock");

    // Expect the mock to be invoked once
    mock.once();
    
    // will throw an ExpectationError
    mock.verify();

### Aliases and Helpers

The following functions are helpers that will map their calls to the API functions above. 

    mock.never() // instead of .exactly(0)
    mock.once() // instead of .exactly(1)
    mock.twice() // instead of .exactly(2)
    mock.thrice() // instead of .exactly(3)

    mock.onFirstCall() // instead of .onCall(1)
    mock.onSecondCall() // instead of .onCall(2)
    mock.onThirdCall() // instead of .onCall(3)
    
    mock.will(func) // instead of .callsAndReturns(func)


## API Docs

The full API documentation can be found [here](http://www.jsmock.org/docs/index.html).

## License

BSD 3-clause, see [License.txt](https://github.com/j-fischer/js-mock/blob/master/LICENSE.txt)

## Note

Until this library reaches version 1.0, there is a chance that backwards compatibility may get broken between minor versions. Please check the release notes for conflicting changes before upgrading.

This project was created using [Yeoman](http://yeoman.io/) and the [js-api generator](https://www.npmjs.com/package/generator-js-api).

## Changelog

### 0.5.0

- Modified assertIfSatisfied() to return a `true` if all mocks passed the verification.

### 0.4.0

- Added support for JsHamcrest style matchers for withExactArgs()
- Minor refactoring: Made will() a alias function for the now called callsAndReturns() function. 
- Added validation that only one return function, callsAndReturns() or returns(), can be expected. 

### 0.3.0

- Initial release