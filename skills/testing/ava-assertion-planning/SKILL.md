---
name: AVA Assertion Planning
description: Add t.plan(num) to AVA tests with multiple assertions for better test structure and error detection
when_to_use: When working with AVA tests that have multiple assertions and need explicit planning
version: 1.0.0
---

# AVA Assertion Planning

Add `t.plan(num)` calls to AVA tests with multiple assertions to improve test reliability and catch assertion count mismatches.

## When to Use

- Working with AVA test framework
- Tests have more than one assertion
- Want to catch cases where tests pass/fail due to incorrect assertion counts
- Improving test structure and debugging

## When NOT to Use

- Tests with only a single assertion (unnecessary overhead)
- Non-AVA test frameworks
- Tests with highly dynamic assertion counts that can't be predetermined

## Process

### 1. Identify Multi-Assertion Tests

Search for tests and analyze their assertion patterns:

```bash
# Find all test functions
grep -n "test(" test-file.js

# Count assertions in each test (look for t.* calls)
grep -n "t\." test-file.js
```

### 2. Count Assertions Systematically

For each test with multiple assertions:

1. **Static assertions**: Count direct `t.is()`, `t.true()`, `t.deepEqual()`, etc. calls
2. **Loop assertions**: Count assertions inside loops (multiply by expected iterations)
3. **Conditional assertions**: Count assertions inside if/else blocks (only count those that always run)
4. **Async assertions**: Include `t.throwsAsync()`, `t.notThrowsAsync()`, etc.

### 3. Add t.plan() Calls

Add `t.plan(num)` as the first line in each multi-assertion test:

```javascript
test('my test with multiple assertions', async t => {
  t.plan(5); // 2 basic + 3 loop assertions
  
  // ... test implementation
});
```

### 4. Verify Counts

Run tests to ensure plan counts match actual assertions:

```bash
npx ava test-file.js --verbose
```

Fix any "Planned for X assertions, but got Y" errors by:

- Recounting assertions carefully
- Checking conditional logic
- Verifying loop iteration counts

## Example Implementation

```javascript
// BEFORE - no planning
test('processes multiple items', async t => {
  const items = ['a', 'b', 'c'];
  
  t.is(items.length, 3);
  
  for (const item of items) {
    t.is(typeof item, 'string');
  }
  
  t.true(items.includes('a'));
});

// AFTER - with planning
test('processes multiple items', async t => {
  t.plan(5); // 1 length check + 3 loop assertions + 1 includes check
  
  const items = ['a', 'b', 'c'];
  
  t.is(items.length, 3);
  
  for (const item of items) {
    t.is(typeof item, 'string');
  }
  
  t.true(items.includes('a'));
});
```

## Common Patterns

### Loop Assertions

```javascript
t.plan(baseAssertions + (loopIterations * assertionsPerIteration));
```

### Conditional Assertions (when condition always true)

```javascript
if (condition) {
  t.true(something); // Count this
}
```

### Complex Counting Example

```javascript
test('complex test', async t => {
  t.plan(8); // 2 base + 4*1 loop + 2 conditional
  
  t.is(hookCalls.length, 5);  // 1
  t.deepEqual(moduleSpecifiers, expected); // 2
  
  for (const call of hookCalls) { // 4 iterations
    t.is(typeof call.packageDescriptor, 'object'); // 4*1 = 4
  }
  
  if (attenuatorsCall) { // always true in this test
    t.true(attenuatorsCall.dependencies.has('dep-a')); // 1
    t.true(attenuatorsCall.dependencies.has('dep-b')); // 1
  }
});
```

## Benefits

1. **Early Error Detection**: Catches tests that pass due to exceptions preventing later assertions
2. **Test Structure**: Forces explicit thinking about assertion count and test logic
3. **Debugging**: Makes it clear when assertion logic changes unexpectedly
4. **Documentation**: Plan numbers serve as inline documentation of test complexity

## Verification

After adding plans, all tests should:

- ✅ Pass with correct assertion counts
- ✅ Fail with clear "Planned for X, got Y" messages if logic changes
- ✅ Only have plans on multi-assertion tests (single assertions don't need planning)

## Tools Used

- `grep_search` with regex to find test patterns
- `replace_string_in_file` to add t.plan() calls
- `run_in_terminal` with `npx ava --verbose` to verify counts
