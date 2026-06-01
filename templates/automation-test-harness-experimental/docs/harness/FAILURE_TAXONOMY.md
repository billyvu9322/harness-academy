# Failure Taxonomy

Use this taxonomy before repairing a failing test.

## App Bug

The product violates the approved requirement or acceptance criteria.

Action: stop, report defect, preserve trace and reproduction steps.

## Test Bug

The automation code does not match the approved scenario or current UI contract.

Action: repair locator, assertion, or flow narrowly. Update evidence.

## Data Or Setup Bug

The account, seed state, fixture, environment variable, storage state, or setup hook is invalid.

Action: repair setup if safe. Request approval for shared fixture or data lifecycle changes.

## Environment Bug

The app, service, browser, network, CI worker, or test environment is unavailable.

Action: stop, record blocker, do not rewrite the test to pass.

## Unknown

Root cause is not clear.

Action: gather more evidence. Do not patch blindly.
