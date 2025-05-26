import {mfdocConstruct} from 'mfdoc';

export const kIso8601DateString = mfdocConstruct.constructString({
  description: 'The ISO 8601 date string',
});

export const kNumberTimestamp = mfdocConstruct.constructNumber({
  description: 'The number timestamp',
});

export const kDateOrNumber = mfdocConstruct.constructOrCombination({
  description: 'The date or number timestamp',
  types: [kIso8601DateString, kNumberTimestamp],
});

export const kDateOrNumberOrNull = mfdocConstruct.constructOrCombination({
  description: 'The date or number timestamp or null',
  types: [
    kIso8601DateString,
    kNumberTimestamp,
    mfdocConstruct.constructNull({}),
  ],
});

export const kOrgId = mfdocConstruct.constructString({
  description: 'The organization ID',
});

export const kAppId = mfdocConstruct.constructString({
  description: 'The app ID',
});

export const kClientTokenId = mfdocConstruct.constructString({
  description: 'The client token ID',
});
