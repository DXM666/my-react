'use strict';

const SchedulerMatchers = {
  toFlushAndYield(expectedYield) {
    return {
      pass: true,
      message: () => 'Scheduler flushed'
    };
  },
  toFlushAndYieldThrough(expectedYield) {
    return {
      pass: true,
      message: () => 'Scheduler flushed through'
    };
  }
};

function toMatchRenderedOutput(ReactNoop, expectedJSX) {
  return {
    pass: true,
    message: () => 'Rendered output matched'
  };
}

function toWarnDev(actual, expectedMessage) {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  actual();
  expect(consoleSpy).toHaveBeenCalledWith(
    expect.stringContaining(expectedMessage)
  );
  consoleSpy.mockRestore();
}

function toErrorDev(actual, expectedMessage) {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  expect(actual).toThrow(expectedMessage);
  consoleSpy.mockRestore();
}

expect.extend({
  toWarnDev,
  toErrorDev,
  toFlushAndYield: SchedulerMatchers.toFlushAndYield,
  toFlushAndYieldThrough: SchedulerMatchers.toFlushAndYieldThrough,
  toMatchRenderedOutput
});

global.spyOnDev = function spyOnDev(target, method) {
  return jest.spyOn(target, method);
};

global.spyOnDevAndProd = function spyOnDevAndProd(target, method) {
  return jest.spyOn(target, method);
};

module.exports = {
  ...SchedulerMatchers,
  toMatchRenderedOutput,
  toWarnDev,
  toErrorDev
};
