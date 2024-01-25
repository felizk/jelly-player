export function toTime(v: number) {
  function toTwo(v: number) {
    const str = (v | 0).toString();
    return str.length == 1 ? '0' + str : str;
  }

  return `${toTwo(v / 60)}:${toTwo(v % 60)}`;
}
