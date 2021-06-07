export default {
  waitFor(time: number) {
    return new Promise(resolve => {
      setTimeout(resolve, time);
    });
  },
};
