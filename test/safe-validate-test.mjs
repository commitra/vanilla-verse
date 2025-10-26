import { validateWithFriendlyErrors } from 'safe-validate-json-schema';

const schema = {
  type: 'object',
  required: ['name'],
  additionalProperties: false,
  properties: {
    name: { type: 'string' },
    age: { type: 'number', minimum: 0 }
  }
};

const good = { name: 'Alice', age: 25 };
const bad = { name: 123, extra: true };

function runCase(title, data) {
  const res = validateWithFriendlyErrors(schema, data);
  console.log(`\n=== ${title} ===`);
  console.log('valid:', res.valid);
  if (!res.valid) {
    console.log('errors (top 3):');
    for (const e of res.errors.slice(0, 3)) {
      console.log('-', e.message || JSON.stringify(e));
    }
  }
}

runCase('GOOD DATA', good);
runCase('BAD DATA', bad);
