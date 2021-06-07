import async from './async';

const TIME_REGEX = /(?<value>^\d*[.]{0,1}\d+)(?<units>\w{1,2})/;
const UNITS_AND_VALUES: { [key: string]: { [key: string]: number } } = {
  ms: {
    ms: 1,
  },
  s: {
    ms: 1000,
  },
  m: {
    ms: 60000,
  },
};

function chain() {
  let _time = 0;

  return {
    /**
     * Begins the chainable methods.
     * @param {!Function} fn
     * @returns
     */
    start(fn?: Function | undefined) {
      fn && fn();

      return this;
    },
    /**
     * Runs the function fn after the accumulated time.
     * If the time format is invalid it returns null
     * @param {!Function} fn
     * @param {string|number} time
     * @returns {Object|null}
     */
    step(fn: Function, time: number | string): object | null {
      if (typeof time === 'string') {
        const matchTime = TIME_REGEX.exec(time);
        const groups = matchTime ? matchTime.groups : {};
        const value = groups?.value || '0';
        const units = groups?.units || 'ms';

        if (!units && !UNITS_AND_VALUES[units]) {
          return null;
        }

        time = parseFloat(value) * UNITS_AND_VALUES[units]['ms'];
      }

      _time += time || 0;

      async.waitFor(_time).then(() => fn());

      return this;
    },
    stop() {
      return null;
    },
  };
}

export default chain;
