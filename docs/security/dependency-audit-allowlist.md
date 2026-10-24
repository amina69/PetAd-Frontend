# Dependency audit exceptions

The CI dependency audit has no active exceptions. High or critical findings
must be fixed before merge.

If an exception becomes necessary, record the package, advisory ID, affected
versions, reason a fix cannot be applied, compensating controls, owner, and an
expiry date in this file. Keep the exception limited to the specific advisory
and remove it as soon as an upstream fix is available. Do not suppress a whole
package or disable the CI audit. Review exceptions before their expiry and fail
CI when an exception reaches its expiry date.
