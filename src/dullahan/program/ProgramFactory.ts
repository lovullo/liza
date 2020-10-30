import {Program} from '../../../src/program/Program';

/* eslint-disable @typescript-eslint/no-var-requires */
const QuoteDataBucket = require('../../bucket/QuoteDataBucket');
const ProgramInit = require('../../program/ProgramInit');
/* eslint-enable @typescript-eslint/no-var-requires */

/**
 * Data retriever is partial bucket implementation
 *
 * A dummy quote "API" needs to be able to return a bucket that can retrieve its
 * data for rating.
 */
export interface DataRetriever {
  getData(): CommonObject;
}

/**
 * Generates a new program on demand
 */
export class ProgramFactory {
  /**
   * Create a new ProgramFactory
   *
   * @param program - required program dependency
   */
  constructor(private readonly program: () => Program) {}

  /**
   * Create a new program
   *
   * @return a new program
   */
  public createProgram(): {bucket: DataRetriever; program: Program} {
    const program = this.program();
    const bucket = QuoteDataBucket().setValues({});

    program.initQuote(bucket, false);

    ProgramInit().init(program, bucket);

    return {bucket, program};
  }
}
