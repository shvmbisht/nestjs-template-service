import { regExpEscape } from 'src/shared/helpers';
import _ from 'lodash';

export const buildRegexSearchOptions = (
  searchText: string | undefined,
  fields: string | string[],
) => {
  if (!searchText) return {};
  if (_.isString(fields)) {
    fields = [fields];
  }

  return {
    $or: fields.map((field) => ({
      [field]: new RegExp(regExpEscape(searchText), 'i'),
    })),
  };
};
