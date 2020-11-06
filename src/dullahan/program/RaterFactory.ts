import {DataRetriever} from './ProgramFactory';

/**
 * Generates raters on demand
 */
export class RaterFactory {
  /**
   * Create a new RaterFactory
   *
   * @param rater - path to rater
   */
  constructor(private readonly rater: string) {}

  /**
   * Create raters
   *
   * @return raters
   */
  public createRater(): CustomRater {
    return require(this.rater);
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
