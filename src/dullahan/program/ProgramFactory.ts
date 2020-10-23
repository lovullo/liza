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
  constructor(
    private readonly program: () => Program,
    private readonly raters: string[]
  ) {}

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

  /**
   * Create raters
   *
   * @return raters
   */
  public createRaters(): CustomRater[] {
    return this.raters.map((rater: string) => require(rater));
  }
}

/**
 * A custom-generated rater
 */
export interface CustomRater {
  rate(
    quote: DummyQuoteApi,
    session: DummySessionApi,
    alias: string,
    on_success: RateSuccessCallback,
    on_error: RateFailureCallback
  ): void;
}

/**
 * A dummy quote API
 *
 * This is the basic interface that a quote must adhere to for rating.
 */
interface DummyQuoteApi {
  getId(): number;
  getAgentId(): number;
  getAgentName(): string;
  getBucket(): DataRetriever;
}

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
 * A dummy session
 *
 * This is the basic interface that a session must adhere to for rating.
 */
interface DummySessionApi {
  agentId(): number;
  isInternal(): boolean;
}

/**
 * A callback run when rating was successful
 *
 * @param rdata    - rate data
 * @param actions  - actions
 * @param override - override
 */
type RateSuccessCallback = (
  rdata: CommonObject,
  actions: CommonObject,
  override: boolean
) => void;

/**
 * A callback run when rating failed
 *
 * @param msg - error message
 */
type RateFailureCallback = (msg: string) => void;

/**
 * Get a dummy quote
 */
export const getDummyQuote = (bucket: DataRetriever): DummyQuoteApi => {
  return {
    getId() {
      return 1;
    },

    getAgentId() {
      return 1;
    },

    getAgentName() {
      return 'foo';
    },

    getBucket() {
      return bucket;
    },
  };
};

/**
 * Get a dummy session
 */
export const getDummySession = (): DummySessionApi => {
  return {
    agentId() {
      return 1;
    },

    isInternal() {
      return true;
    },
  };
};
