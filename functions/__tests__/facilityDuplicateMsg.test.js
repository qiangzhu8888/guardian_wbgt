'use strict';

const { facilityCreateConflictMessage } = require('../lib/facilityDuplicateMsg');

describe('facilityCreateConflictMessage', () => {
  it('同一組織ならローカル重複の説明', () => {
    expect(facilityCreateConflictMessage('org-a', 'org-a')).toContain('あなたの組織で登録されています');
  });

  it('別組織ならグローバル重複の説明', () => {
    expect(facilityCreateConflictMessage('org-b', 'org-a')).toContain('システム内ですでに使われています');
  });
});
