import Lib "lib/cricket-academy";
import AcademyApi "mixins/cricket-academy-api";

// State is initialised once on fresh install.
// Enhanced orthogonal persistence keeps all actor-level heap objects
// (Maps, mutable counters) alive across upgrades with NO preupgrade /
// postupgrade hooks required — adding those hooks would revert the runtime
// to classical-persistence mode and erase non-stable fields on every upgrade.
actor {
  let state = Lib.newState();
  include AcademyApi(state);
};
