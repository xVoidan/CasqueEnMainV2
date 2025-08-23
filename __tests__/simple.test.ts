// Test simple pour vérifier que l'environnement de test fonctionne

describe('Simple Math Tests', () => {
  test('addition works correctly', () => {
    expect(2 + 2).toBe(4);
  });

  test('subtraction works correctly', () => {
    expect(10 - 5).toBe(5);
  });

  test('multiplication works correctly', () => {
    expect(3 * 4).toBe(12);
  });

  test('division works correctly', () => {
    expect(20 / 4).toBe(5);
  });
});

describe('String Tests', () => {
  test('string concatenation works', () => {
    expect('Hello' + ' ' + 'World').toBe('Hello World');
  });

  test('string includes works', () => {
    expect('Hello World').toContain('World');
  });

  test('string length works', () => {
    expect('Test').toHaveLength(4);
  });
});

describe('Array Tests', () => {
  test('array contains element', () => {
    expect([1, 2, 3, 4]).toContain(3);
  });

  test('array length works', () => {
    expect([1, 2, 3]).toHaveLength(3);
  });

  test('array push works', () => {
    const arr = [1, 2];
    arr.push(3);
    expect(arr).toEqual([1, 2, 3]);
  });
});

describe('Object Tests', () => {
  test('object has property', () => {
    const obj = { name: 'Test', value: 123 };
    expect(obj).toHaveProperty('name');
    expect(obj.name).toBe('Test');
  });

  test('object equality works', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 2 };
    expect(obj1).toEqual(obj2);
  });
});

describe('Async Tests', () => {
  test('promise resolves correctly', async () => {
    const promise = Promise.resolve('success');
    await expect(promise).resolves.toBe('success');
  });

  test('promise rejects correctly', async () => {
    const promise = Promise.reject(new Error('failure'));
    await expect(promise).rejects.toThrow('failure');
  });

  test('async function works', async () => {
    const asyncFunc = async () => {
      return new Promise(resolve => {
        setTimeout(() => resolve('done'), 10);
      });
    };

    const result = await asyncFunc();
    expect(result).toBe('done');
  });
});
