import {Program} from '../../../src/program/Program';

/* eslint-disable @typescript-eslint/no-var-requires */
const QuoteDataBucket = require('../../bucket/QuoteDataBucket');
const ProgramInit = require('../../program/ProgramInit');
/* eslint-enable @typescript-eslint/no-var-requires */

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
  public createProgram(): Program {
    const program = this.program();
    const bucket = QuoteDataBucket().setValues({});

    program.initQuote(bucket, false);

    ProgramInit().init(program, bucket);

    return program;
  }
}
