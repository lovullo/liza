/**
 * Common testing resources for client
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
import {ClientQuote} from '../../src/client/quote/ClientQuote';
import {Client} from '../../src/client/Client';
import {DataApiResult} from '../../src/dapi/DataApi';
import {Data} from '../../src/client/quote/ClientQuote';
import {ElementStyler} from '../../src/ui/ElementStyler';
import {Nav} from '../../src/client/nav/Nav';
import {PositiveInteger} from '../../src/numeric';
import {Program, ClassificationResult} from '../../src/program/Program';
import {StagingBucket} from '../../src/bucket/StagingBucket';
import {StepUi} from '../../src/ui/step/StepUi';
import {Ui} from '../../src/ui/Ui';

export function createStubClient(
  quote: ClientQuote,
  ui: Ui,
  program: Program = <Program>{}
) {
  return <Client>(<unknown>{
    program: program,
    nav: <Nav>{
      getCurrentStepId: () => <PositiveInteger>0,
    },
    elementStyler: <ElementStyler>{},
    getUi: () => <Ui>ui,
    getQuote: () => <ClientQuote>quote,
    handleError: (_e: Error) => {},
    handleEvent: () => <Client>{},
    validateChange: (_: any) => {},
    isSaving: () => false,
  });
}

export function createStubClientQuote() {
  const callbacks: any = {};

  const quote = {
    setClassifier(_known_fields: any, _classifier: any): ClientQuote {
      return <ClientQuote>(<unknown>this);
    },

    getDataByName(_name: string): Record<string, any> {
      return [];
    },

    getLastClassify() {
      return {};
    },

    visitData(visitor: (bucket: StagingBucket) => void): void {
      visitor(<StagingBucket>{});
    },

    setData(_data: Data): ClientQuote {
      return <ClientQuote>(<unknown>this);
    },

    on(name: string, callback: any): void {
      callbacks[name] = callback;
    },

    emit(name: string) {
      const data = Array.prototype.slice.call(arguments, 1);

      callbacks[name].apply(null, data);
    },

    autosave(_: any) {
      return this;
    },
  };

  return quote;
}

export function createStubUi(step: StepUi | null) {
  return <Ui>(<unknown>{
    setCmatch: () => {},
    getCurrentStep: () => step,
  });
}

export function createStubProgram(overrides: any = {}) {
  return <Program>{
    clearNaFields: false,
    naFieldValue: '',
    getId: () => '1',
    ineligibleLockCount: 0,
    cretain: {},
    defaults: overrides.defaults ?? {
      foo: 'default',
    },
    apis: {},
    whens: {},
    groupWhens: {},
    internal: {},
    autosave: false,
    meta: {
      arefs: {},
      fields: {},
      groups: {},
      qdata: {},
      qtypes: {},
    },
    mapis: {},
    rateSteps: [],
    dapi: () => <DataApiResult>{},
    initQuote: () => {},
    getClassifierKnownFields: () => <ClassificationResult>{},
    classify: () => <ClassificationResult>{},
  };
}
