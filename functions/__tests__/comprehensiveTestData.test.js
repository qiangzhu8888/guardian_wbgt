'use strict';

const { validateComprehensiveTestData } = require('../fixtures/comprehensiveTestData');

describe('comprehensiveTestData fixture', () => {
  it('整合性検証がエラーなし', () => {
    const errs = validateComprehensiveTestData();
    expect(errs).toEqual([]);
  });
});
