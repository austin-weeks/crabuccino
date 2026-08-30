class UnmetThrowExpectation extends Error {}

export function captureThrown<E>(f: () => void): E {
  try {
    f();
  } catch (e) {
    return e as E;
  }
  throw new UnmetThrowExpectation("did not throw");
}
