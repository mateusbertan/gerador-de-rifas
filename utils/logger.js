import colors from 'colors';

function info(message) {
  console.log(colors.green(message));
}

function warn(message) {
  console.warn(colors.yellow(message));
}

function error(message) {
  console.error(colors.red(message));
}

export default { info, warn, error };
