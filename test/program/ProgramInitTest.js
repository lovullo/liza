/**
 * Tests ProgramInit
 *
 *  Copyright (C) 2010-2020 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
 *
 *  liza is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

const chai = require('chai');
const expect = chai.expect;
const {ProgramInit: Sut} = require('../../').program;

chai.use(require('chai-as-promised'));

describe('ProgramInit', () => {
  [
    {
      label: 'initializes defaults',
      defaults: {a: 'one', b: 'two'},
      meta: {
        groups: {},
        qtypes: {
          a: {type: 'noyes'},
          b: {type: 'noyes'},
        },
      },
      groupExclusiveFields: {
        Something: ['a', 'b'],
      },
      doc_data: {},
      expected: {
        a: ['one'],
        b: ['two'],
      },
    },
    // for ancient versions of liza-proguic (before it was even called
    // "liza")
    {
      label: 'initializes defaults for ancient data representations',
      defaults: {a: 'one', b: 'two'},
      meta: {
        groups: {},
        qtypes: {
          a: 'noyes',
          b: 'noyes',
        },
      },
      groupExclusiveFields: {
        Something: ['a', 'b'],
      },
      doc_data: {},
      expected: {
        a: ['one'],
        b: ['two'],
      },
    },
    {
      label: 'does nothing with no data or defaults',
      defaults: {},
      meta: {
        groups: {},
      },
      groupExclusiveFields: {},
      doc_data: {},
      expected: {},
    },
    {
      label: 'produces empty object given undefined data',
      defaults: {},
      meta: {
        groups: {},
      },
      groupExclusiveFields: {},
      doc_data: undefined,
      expected: {},
    },
    {
      label: 'keeps existing data with defaults',
      defaults: {
        foo: 'init',
        bar: 'test',
      },
      meta: {
        groups: {},
        qtypes: {
          foo: {type: 'noyes'},
          bar: {type: 'noyes'},
        },
      },
      groupExclusiveFields: {
        Something: ['foo'],
        SomethingElse: ['bar'],
      },
      doc_data: {bar: ['baz']},
      expected: {
        foo: ['init'],
        bar: ['baz'],
      },
    },
    {
      label: 'keeps existing data with no defaults',
      defaults: {},
      meta: {
        groups: {},
        qtypes: {
          bar: {type: 'text'},
        },
      },
      groupExclusiveFields: {
        SomethingElse: ['bar'],
      },
      doc_data: {bar: ['baz']},
      expected: {
        bar: ['baz'],
      },
    },
    {
      label: 'does not overwrite existing data with defaults',
      defaults: {foo: 'init'},
      meta: {
        groups: {},
        qtypes: {
          foo: {type: 'text'},
        },
      },
      groupExclusiveFields: {
        Something: ['foo'],
      },
      doc_data: {foo: ['bar']},
      expected: {
        foo: ['bar'],
      },
    },
    {
      label: 'does not overwrite existing data with defaults and multiple rows',
      defaults: {foo: 'init'},
      meta: {
        groups: {
          Something: {
            min: 3,
          },
        },
        qtypes: {
          foo: {type: 'text'},
        },
      },
      groupExclusiveFields: {
        Something: ['foo'],
      },
      doc_data: {foo: ['bar', 'baz', 'test']},
      expected: {
        foo: ['bar', 'baz', 'test'],
      },
    },
    {
      label: 'initializes with default bucket data',
      defaults: {foo: 'init'},
      meta: {
        groups: {
          Something: {
            min: 5,
          },
        },
        qtypes: {
          foo: {type: 'text'},
        },
      },
      groupExclusiveFields: {
        Something: ['foo'],
      },
      doc_data: {},
      expected: {
        foo: ['init', 'init', 'init', 'init', 'init'],
      },
    },
    {
      label: 'resets NA fields on init',
      defaults: {foo: 'init'},
      meta: {
        groups: {
          Something: {
            min: 2,
          },
        },
        qtypes: {
          foo: {type: 'text'},
        },
      },
      groupExclusiveFields: {
        Something: ['foo'],
      },
      doc_data: {},
      expected: {
        foo: ['', ''],
      },
      clearNaFields: true,
      naFieldValue: '',
      hasResetableField: () => true,
    },
    {
      label: 'does not reset applicable fields on init',
      defaults: {foo: 'init'},
      whens: {},
      meta: {
        groups: {
          Something: {
            min: 2,
          },
        },
        qtypes: {
          foo: {type: 'text'},
        },
      },
      groupExclusiveFields: {
        Something: ['foo'],
      },
      doc_data: {},
      expected: {
        foo: ['init', 'init'],
      },
      clearNaFields: true,
      naFieldValue: '',
    },
    {
      label: 'does not reset retained fields on init',
      defaults: {foo: 'init'},
      cretain: {foo: true},
      meta: {
        groups: {
          Something: {
            min: 2,
          },
        },
        qtypes: {
          foo: {type: 'text'},
        },
      },
      groupExclusiveFields: {
        Something: ['foo'],
      },
      doc_data: {},
      expected: {
        foo: ['init', 'init'],
      },
      clearNaFields: true,
      naFieldValue: '',
    },
    {
      label: 'fix missing bucket data values',
      defaults: {foo: 'init'},
      meta: {
        groups: {
          Something: {
            min: 5,
          },
        },
        qtypes: {
          foo: {type: 'text'},
        },
      },
      groupExclusiveFields: {
        Something: ['foo'],
      },
      doc_data: {
        foo: ['1', '2', '3', '4'],
      },
      expected: {
        foo: ['1', '2', '3', '4', 'init'],
      },
    },
    {
      label: 'ignores undefined types',
      defaults: {foo: 'default'},
      meta: {
        groups: {},
        qtypes: {
          foo: {type: 'undefined'},
        },
      },
      groupExclusiveFields: {
        Something: ['foo'],
      },
      doc_data: {},
      expected: {},
    },
  ].forEach(
    ({
      label,
      doc_data,
      id,
      defaults,
      meta,
      groupExclusiveFields,
      expected,
      clearNaFields,
      naFieldValue,
      whens,
      cretain,
      hasResetableField,
    }) => {
      it(label, () => {
        const sut = Sut(null);

        const program = {
          id: 'foo',
          defaults: defaults,
          meta: meta,
          groupExclusiveFields: groupExclusiveFields,
          whens: whens ? whens : defaults,
          clearNaFields,
          naFieldValue,
          cretain: cretain ? cretain : {},
          hasResetableField: () =>
            hasResetableField ? hasResetableField() : false,
        };

        return expect(sut.init(program, doc_data)).to.eventually.deep.equal(
          expected
        );
      });
    }
  );
});
