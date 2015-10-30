# JsMock

JavaScript mocking framework, which can be used with any test framework. JsMock is inspired by [jMock](http://www.jmock.org/) and [Sinon.js](http://sinonjs.org/) with its interface being very similar to Sinon in order to make it easy to switch between those two frameworks. 

JsMock does only support mocks where all expectations have to be set prior to making the call to the function under test.

## How is JsMock different from other mock frameworks?

JsMock only supports mock objects where the expectations have to be defined before the mock objects are used by the function under test. This may require a bit more effort when writing a test case, but the outcome should be that the interactions of the unit under test with the mock object are very clearly defined through the tests, which should expose bugs or unintended behavior that would otherwise remain hidden if stubs or spies are used, but not evaluated properly.  

JsMock also has the goal to simplify the setup and validation of mocks by monitoring them for you. This will make it easy to evaluate that all expected calls have been made at the end of the test. 

## Installation

Install JsMock via [npm](https://www.npmjs.com)

$ npm install js-mock

and include node_modules/js-mock/lib/js-mock.js in your project. 

## Getting Started

The following list highlights some simple use cases of JsMock and includes some best practices. For a full reference, please check out the [API docs](https://github.com/j-fischer/js-mock/docs/index.html) or take a look at the [unit tests](https://github.com/j-fischer/js-mock/src/test/javascript).

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

When testing a module or file, the best way is to define a set of global mocks, which can be shared between the test cases using the `monitorMocks()` function. All mocks created inside the factory function will be added to the current test context and can be verified with a single call to `JsMock.assertIfSatisfied()`.

    var mockFunction1, mockFunction2;
    JsMock.monitorMocks(function () {
      mockFunction1 = JsMock.mock("name1");
      mockFunction2 = JsMock.mock("name2");
    });


### JsMock.assertIfSatisfied()

Calling this function will go through the list of all mocks that are currently monitored and will call `.`verify`()` on each of them. Should a mock fail the validation, an `ExpectationError` will be thrown.

    var mockFunction1, mockFunction2;
    JsMock.monitorMocks(function () {
      mockFunction1 = JsMock.mock("name1");
      mockFunction2 = JsMock.mock("name2");
    });

    // Verify all monitored mocks
    JsMock.assertIfSatisfied();


### mock.exactly(<number>)

Set the expectation for the mock to be called n number of times. 

    var mock = JsMock.mock("aMock");

    // Expect the mock to be invoked 4 times
    mock.exactly(4); 


### mock.withExactArgs(<anything>...)

Set the expectation to be called with the exact arguments provided. 

    var mock = JsMock.mock("aMock");

    // Expect to be called like this: mock("foo", "bar");
    mock.once().withExactArgs("foo", "bar"); 


### mock.returns(<anything>)

Set the expectation for the mock to return a given value.


    var mock = JsMock.mock("aMock");

    // Expect the mock to be invoked once with no arguments, returning "foo"
    mock.once().withExactArgs().returns("foo")

    var x = "foo" === mock(); // true

### mock.will(<function>)

Will execute the given function once the mock was successfully called. The arguments passed to the mock function will be forwarded to the function to be executed. 


    var mock = JsMock.mock("aMock");

    // Expect the mock to be invoked once with no arguments, returning "foo"
    mock.once().will(function (arg) {
      var x = arg; // x == "foo"
    });

    mock("foo");


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

Converts this mock into a stub, which will never throw a missing invocation exceptions. 
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

### Helper functions

The following functions are helpers that will map their calls to the API functions above. 

    mock.never() // instead of .exactly(0)
    mock.once() // instead of .exactly(1)
    mock.twice() // instead of .exactly(2)
    mock.thrice() // instead of .exactly(3)

    mock.onFirstCall() // instead of .onCall(1)
    mock.onSecondCall() // instead of .onCall(2)
    mock.onThirdCall() // instead of .onCall(3)

## License

BSD 3-clause, see [License.txt](License.txt)

## Note

Until this library reaches version 1.0, there is a chance that backwards compatibility may get broken between minor versions. Please check the release notez for conflicting changes before upgrading.

This project was created using [Yeoman](http://yeoman.io/) and the [js-api generator](https://www.npmjs.com/package/generator-js-api).